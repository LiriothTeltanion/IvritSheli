"""
Module: portable import resource boundaries
Purpose: Hold the SEC-04 byte ceiling and admission limit on the restore endpoint.
Author: Kevin "Lirioth" Cusnir
Date: 2026-09-05 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH.

Why this file exists.

A restore is the most expensive request this application serves. Body limits are
enforced outside the authorization middleware, because a chunked request carries
no trustworthy Content-Length and has to be buffered before any handler can look
at it. With the route's ceiling at 32 MB that handed an unauthenticated caller
32 MB of process memory for the asking, once per concurrent request.

In cloud mode the ceiling was also fiction. A learner document is refused above
`max_cloud_snapshot_bytes` when it is encoded, so an import larger than that can
never succeed; it could only be buffered, written, parsed, expanded into rows,
and then rejected at the very last step. All of the cost, none of the outcome.

These tests hold two properties: the accepted size is aligned with what a restore
can actually keep, and the number of restores paying that cost at the same time
is a number this process chose rather than however many requests arrived.
"""

from __future__ import annotations

import io
from pathlib import Path

from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.config import Settings

IMPORT_PATH = "/api/v1/import?confirm_replace=true"


def _settings(tmp_path: Path, **overrides: str) -> Settings:
    """Build isolated settings, defaulting to the offline local profile."""
    data_dir = tmp_path / "data"
    env = {
        "IVRIT_LOCAL_ONLY": "true",
        "APP_DATA_DIR": str(data_dir),
        "APP_DB_PATH": str(data_dir / "learning.db"),
        "DICTIONARY_DB_PATH": str(data_dir / "dictionary.db"),
        "AI_PROVIDER": "offline",
        "ALLOW_CLOUD_PROCESSING": "false",
        "OPENAI_API_KEY": "",
        "GOOGLE_ACCESS_TOKEN": "",
        "GOOGLE_REFRESH_TOKEN": "",
        "DEBUG": "true",
    }
    env.update(overrides)
    return Settings.from_env(env)


def _upload(payload: bytes = b"{}") -> dict[str, tuple[str, io.BytesIO, str]]:
    """One multipart part shaped like the export the learner would upload."""
    return {"file": ("ivrit-sheli-export.json", io.BytesIO(payload), "application/json")}


def test_local_mode_keeps_its_configured_restore_ceiling(tmp_path: Path) -> None:
    """Local SQLite has no durable snapshot ceiling, so nothing is tightened."""
    settings = _settings(tmp_path)
    app = create_app(settings)

    assert not settings.cloud_mode
    assert app.state.import_body_limit == settings.max_import_upload_body_bytes


def test_cloud_mode_aligns_the_ceiling_with_the_durable_snapshot_limit(
    tmp_path: Path,
) -> None:
    """Accepting eight times what can be stored is buffering for nothing."""
    settings = _settings(
        tmp_path,
        IVRIT_LOCAL_ONLY="false",
        DATABASE_URL="memory://",
        SESSION_SECRET="test-only-session-secret-at-least-32-characters",
    )
    app = create_app(settings)

    assert settings.cloud_mode
    assert app.state.import_body_limit == settings.max_cloud_snapshot_bytes * 2
    assert app.state.import_body_limit < settings.max_import_upload_body_bytes


def test_a_restore_is_refused_while_the_admission_slots_are_taken(
    tmp_path: Path,
) -> None:
    """Concurrency must not multiply the worst case of a single restore."""
    app = create_app(_settings(tmp_path, MAX_CONCURRENT_IMPORTS="1"))
    with TestClient(app) as client:
        assert app.state.import_admission.acquire(timeout=1)
        try:
            response = client.post(IMPORT_PATH, files=_upload())
        finally:
            app.state.import_admission.release()

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "import_busy"
    assert response.headers["Retry-After"] == "5"


def test_the_refusal_names_no_path_or_internal_detail(tmp_path: Path) -> None:
    """The restore route is reachable by anyone the session lets through."""
    app = create_app(_settings(tmp_path, MAX_CONCURRENT_IMPORTS="1"))
    with TestClient(app) as client:
        assert app.state.import_admission.acquire(timeout=1)
        try:
            response = client.post(IMPORT_PATH, files=_upload())
        finally:
            app.state.import_admission.release()

    body = response.text.lower()
    for leak in ("private", "tmp", "sqlite", "traceback", ".json"):
        assert leak not in body


def test_a_failed_restore_gives_its_admission_slot_back(tmp_path: Path) -> None:
    """A leaked slot would refuse every later restore for the process's life."""
    app = create_app(_settings(tmp_path, MAX_CONCURRENT_IMPORTS="1"))
    with TestClient(app) as client:
        for _ in range(3):
            broken = client.post(IMPORT_PATH, files=_upload(b"this is not json"))
            assert broken.status_code != 503, "the failure itself must not be a refusal"

        # If any of the three above had kept its slot, this one could only 503.
        again = client.post(IMPORT_PATH, files=_upload(b"still not json"))

    assert again.status_code != 503
    assert again.json()["error"]["code"] != "import_busy"


def test_a_rejected_extension_never_takes_an_admission_slot(tmp_path: Path) -> None:
    """A cheap rejection should not have to queue behind a real restore."""
    app = create_app(_settings(tmp_path, MAX_CONCURRENT_IMPORTS="1"))
    with TestClient(app) as client:
        assert app.state.import_admission.acquire(timeout=1)
        try:
            response = client.post(
                IMPORT_PATH,
                files={"file": ("backup.zip", io.BytesIO(b"PK"), "application/zip")},
            )
        finally:
            app.state.import_admission.release()

    # Refused for its extension while every slot was held: the check ran first.
    assert response.status_code != 503
    assert response.json()["error"]["code"] != "import_busy"


def test_the_temporary_restore_file_is_removed_even_when_the_import_fails(
    tmp_path: Path,
) -> None:
    """A restore that leaves its upload behind is a disk leak and a privacy leak."""
    settings = _settings(tmp_path)
    app = create_app(settings)
    private = Path(settings.data_dir) / "private"
    with TestClient(app) as client:
        client.post(IMPORT_PATH, files=_upload(b"not json at all"))

    leftovers = list(private.glob("import-*.json")) if private.exists() else []
    assert leftovers == []
