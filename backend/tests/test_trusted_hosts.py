"""
Module: Host header trust boundary
Purpose: Hold the SEC-06 allowlist so a forged Host cannot reach the application.
Author: Kevin "Lirioth" Cusnir
Date: 2026-09-05 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH.

Why this file exists.

Nothing checked the Host header at all. That is what makes DNS rebinding work:
a browser is pointed at a name the attacker controls, the name is re-resolved to
127.0.0.1, and the browser then speaks to the local service believing it is
same-origin. An unchecked Host also lets a forged value reach anything that
builds an absolute URL out of it.

The first test in this file is the one that matters. A whole suite can pass with
an allowlist that accepts everything, so the allowlist has to be shown refusing
something before any of the acceptance tests mean anything.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.config import Settings


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


def test_a_forged_host_is_refused(tmp_path: Path) -> None:
    """The load-bearing test: prove the allowlist refuses before trusting it."""
    with TestClient(create_app(_settings(tmp_path))) as client:
        response = client.get("/health/live", headers={"Host": "attacker.example"})

    assert response.status_code == 400, (
        "an unlisted Host must be refused; if this passes with 200 the allowlist "
        "is decorative and every other test in this file proves nothing"
    )


def test_a_rebinding_style_host_is_refused_even_for_the_api(tmp_path: Path) -> None:
    """Rebinding targets the API, not the health endpoint."""
    with TestClient(create_app(_settings(tmp_path))) as client:
        response = client.get(
            "/api/v1/dashboard", headers={"Host": "127-0-0-1.rebind.example"}
        )

    assert response.status_code == 400


def test_the_loopback_names_are_accepted(tmp_path: Path) -> None:
    """The launcher and the platform health check both speak to loopback."""
    with TestClient(create_app(_settings(tmp_path))) as client:
        for host in ("localhost", "127.0.0.1", "localhost:8000", "127.0.0.1:8000"):
            response = client.get("/health/live", headers={"Host": host})
            assert response.status_code == 200, host


def test_the_public_base_url_host_is_accepted(tmp_path: Path) -> None:
    """The deployed hostname must not need a second setting to work."""
    settings = _settings(tmp_path, PUBLIC_BASE_URL="https://ivrit-sheli-staging.example")
    with TestClient(create_app(settings)) as client:
        response = client.get(
            "/health/live", headers={"Host": "ivrit-sheli-staging.example"}
        )

    assert response.status_code == 200
    assert "ivrit-sheli-staging.example" in settings.trusted_hosts


def test_a_lan_pilot_host_must_be_named_explicitly(tmp_path: Path) -> None:
    """Binding to every interface does not silently trust every name."""
    bound_everywhere = _settings(tmp_path, APP_HOST="0.0.0.0")
    assert "0.0.0.0" not in bound_everywhere.trusted_hosts
    assert "kevin-laptop.local" not in bound_everywhere.trusted_hosts

    named = _settings(tmp_path, APP_HOST="0.0.0.0", ALLOWED_HOSTS="kevin-laptop.local")
    assert "kevin-laptop.local" in named.trusted_hosts
    with TestClient(create_app(named)) as client:
        assert (
            client.get("/health/live", headers={"Host": "kevin-laptop.local"})
        ).status_code == 200
        assert (
            client.get("/health/live", headers={"Host": "someone-else.local"})
        ).status_code == 400


def test_production_does_not_trust_the_test_client_host(tmp_path: Path) -> None:
    """`testserver` is a convenience for the suite, not a deployment name."""
    production = _settings(
        tmp_path,
        IVRIT_LOCAL_ONLY="false",
        APP_ENV="production",
        DEBUG="false",
        AUTH_REQUIRED="true",
        # Production refuses to start without a real PostgreSQL DSN on the
        # restricted role. Nothing here connects: only trusted_hosts is read.
        DATABASE_URL="postgresql://ivrit_sheli_runtime:not-a-real-password@db.example:5432/ivrit",
        SESSION_SECRET="test-only-session-secret-at-least-32-characters",
        PUBLIC_BASE_URL="https://ivrit.example",
        ALLOWED_ORIGINS="https://ivrit.example",
        # Production refuses to start without a sign-in provider; inert values
        # matching test_cloud_auth.py keep this independent of the machine.
        GOOGLE_AUTH_CLIENT_ID="google-client",
        GOOGLE_AUTH_CLIENT_SECRET="google-secret",
    )

    assert "testserver" not in production.trusted_hosts
    assert "ivrit.example" in production.trusted_hosts


def test_the_allowlist_is_never_a_wildcard(tmp_path: Path) -> None:
    """A single "*" would turn every other test here into theatre.

    Starlette's TrustedHostMiddleware sets `allow_any = "*" in allowed_hosts`
    and returns before it reads the Host header at all, and it treats a leading
    `*.` as a live suffix match. So a wildcard does not widen this control, it
    switches it off.
    """
    for settings in (
        _settings(tmp_path),
        _settings(tmp_path, ALLOWED_HOSTS="a.example, b.example"),
        _settings(tmp_path, APP_HOST="0.0.0.0"),
    ):
        assert "*" not in settings.trusted_hosts
        assert not any(host.startswith("*") for host in settings.trusted_hosts)
        assert all(host.strip() for host in settings.trusted_hosts)


@pytest.mark.parametrize("wildcard", ["*", "*.attacker.example", "a.example,*"])
def test_a_wildcard_in_allowed_hosts_is_refused_at_startup(
    tmp_path: Path, wildcard: str
) -> None:
    """Fail closed on the obvious reaction to an unexpected 400.

    The previous version of the test above only ever fed inputs that contained
    no `*`, so it asserted an invariant it could not break. This one feeds the
    wildcard.
    """
    with pytest.raises(ValueError, match="wildcards are not allowed"):
        _settings(tmp_path, ALLOWED_HOSTS=wildcard)


def test_a_wildcard_smuggled_through_the_public_url_never_reaches_the_middleware(
    tmp_path: Path,
) -> None:
    """`urlparse("https://*").hostname` really does return "*"."""
    settings = _settings(tmp_path, PUBLIC_BASE_URL="https://*")

    assert "*" not in settings.trusted_hosts

    with TestClient(create_app(settings)) as client:
        assert client.get("/health/live", headers={"Host": "anything.example"}).status_code == 400
        assert client.get("/health/live", headers={"Host": "localhost"}).status_code == 200
