"""
Module: API documentation exposure
Purpose: Hold the SEC-07 rule that production serves no CDN-backed documentation UI.
Author: Kevin "Lirioth" Cusnir
Date: 2026-09-05 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH.

Why this file exists.

Swagger UI and ReDoc both bootstrap by loading JavaScript from a public CDN and
running an inline script. To make that work the application published a second,
looser Content-Security-Policy that allowed `cdn.jsdelivr.net` and
`'unsafe-inline'` for scripts — on the same origin that holds the learner's
session cookie.

Two things were true and only one of them was written down. The documented UI
was `/api/v1/docs`. FastAPI also publishes ReDoc, and because `redoc_url` was
never stated it kept its default of `/redoc`, outside the API prefix, so a
second documentation UI existed that no line of the application had mentioned.

Production now serves neither, and the loose policy is unreachable rather than
merely unused.

The production cases build the app without a TestClient on purpose: entering the
client would run the lifespan and try to reach a database that does not exist
here, and the question being asked is about routing, not runtime.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import (
    APP_CONTENT_SECURITY_POLICY,
    DOCS_CONTENT_SECURITY_POLICY,
    create_app,
)
from ivrit_sheli.config import Settings

DOC_PATHS = ("/api/v1/docs", "/api/v1/redoc", "/redoc", "/docs", "/api/v1/openapi.json")


def _local(tmp_path: Path, **overrides: str) -> Settings:
    """Offline local settings: documentation stays available here."""
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


def _production(tmp_path: Path) -> Settings:
    """The smallest configuration production validation will accept."""
    data_dir = tmp_path / "data"
    return Settings.from_env(
        {
            "APP_ENV": "production",
            "DEBUG": "false",
            "AUTH_REQUIRED": "true",
            "APP_DATA_DIR": str(data_dir),
            "APP_DB_PATH": str(data_dir / "learning.db"),
            "DICTIONARY_DB_PATH": str(data_dir / "dictionary.db"),
            "AI_PROVIDER": "offline",
            "ALLOW_CLOUD_PROCESSING": "false",
            "OPENAI_API_KEY": "",
            "GOOGLE_ACCESS_TOKEN": "",
            "GOOGLE_REFRESH_TOKEN": "",
            "DATABASE_URL": (
                "postgresql://ivrit_sheli_runtime:not-a-real-password"
                "@db.example:5432/ivrit"
            ),
            "SESSION_SECRET": "test-only-session-secret-at-least-32-characters",
            "PUBLIC_BASE_URL": "https://ivrit.example",
            "ALLOWED_ORIGINS": "https://ivrit.example",
            # Production refuses to start without a sign-in provider. These are
            # the same inert test values test_cloud_auth.py uses; without them the
            # suite only passed on a machine that had real Google credentials set.
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
        }
    )


def test_production_publishes_no_documentation_ui(tmp_path: Path) -> None:
    """Neither Swagger nor ReDoc nor the schema they render."""
    app = create_app(_production(tmp_path))

    assert app.docs_url is None
    assert app.redoc_url is None
    assert app.openapi_url is None

    published = {getattr(route, "path", "") for route in app.routes}
    for path in DOC_PATHS:
        assert path not in published, f"production still publishes {path}"


def test_production_has_no_route_that_could_serve_the_relaxed_policy(
    tmp_path: Path,
) -> None:
    """The loose policy must be unreachable in production, not merely unused."""
    app = create_app(_production(tmp_path))
    published = {getattr(route, "path", "") for route in app.routes}

    assert not published & {"/api/v1/docs", "/api/v1/redoc"}
    assert "cdn.jsdelivr.net" not in APP_CONTENT_SECURITY_POLICY

    # Read the directive itself. Searching the whole policy for 'unsafe-inline'
    # would match style-src, which legitimately carries it, and the assertion
    # would then be about the wrong directive.
    directives = {
        part.strip().split(" ", 1)[0]: part.strip().split(" ", 1)[-1]
        for part in APP_CONTENT_SECURITY_POLICY.split(";")
        if part.strip()
    }
    assert directives["script-src"] == "'self'"


def test_development_keeps_its_documentation(tmp_path: Path) -> None:
    """Removing a developer tool from the laptop was never the goal."""
    with TestClient(create_app(_local(tmp_path))) as client:
        for path in ("/api/v1/docs", "/api/v1/redoc", "/api/v1/openapi.json"):
            assert client.get(path).status_code == 200, path


def test_redoc_no_longer_hides_outside_the_api_prefix(tmp_path: Path) -> None:
    """It defaulted to /redoc, which nothing in the application mentioned.

    The path still answers, because every unmatched path falls through to the
    single-page application. What matters is that it is the learner's app shell
    under the strict policy, and not a documentation UI pulling a CDN bundle.
    """
    app = create_app(_local(tmp_path))
    assert "/redoc" not in {getattr(route, "path", "") for route in app.routes}

    with TestClient(app) as client:
        stray = client.get("/redoc")

    assert "redoc" not in stray.text.lower()
    assert "cdn.jsdelivr.net" not in stray.text
    assert stray.headers["Content-Security-Policy"] == APP_CONTENT_SECURITY_POLICY


@pytest.mark.parametrize("path", ["/api/v1/docs", "/api/v1/redoc"])
def test_only_the_documentation_pages_get_the_relaxed_policy(
    tmp_path: Path, path: str
) -> None:
    """The CDN allowance must not leak onto the pages that hold the session."""
    with TestClient(create_app(_local(tmp_path))) as client:
        docs = client.get(path)
        app_page = client.get("/health/live")

    assert docs.headers["Content-Security-Policy"] == DOCS_CONTENT_SECURITY_POLICY
    assert app_page.headers["Content-Security-Policy"] == APP_CONTENT_SECURITY_POLICY
    assert "cdn.jsdelivr.net" not in app_page.headers["Content-Security-Policy"]
