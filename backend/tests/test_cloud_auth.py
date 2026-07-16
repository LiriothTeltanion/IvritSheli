"""Cloud authentication, demo safety, tenant isolation, and operational endpoint tests."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.config import Settings


class FakeGitHubOAuth:
    """Deterministic OAuth boundary: no network, tokens, or private profile data."""

    def authorize_url(self, state: str, verifier: str, settings: Settings) -> str:
        assert len(verifier) >= 43
        return f"https://github.test/authorize?state={state}"

    def exchange_code(self, code: str, verifier: str, settings: Settings) -> dict[str, Any]:
        assert verifier
        return {
            "id": f"github-{code}",
            "login": f"learner-{code}",
            "name": f"Learner {code}",
            "avatar_url": "https://avatars.test/learner.png",
        }


def cloud_settings(tmp_path: Path) -> Settings:
    """Build test-only cloud settings backed by an injected in-memory store."""
    return Settings.from_env(
        {
            "APP_ENV": "test",
            "APP_DATA_DIR": str(tmp_path / "data"),
            "APP_DB_PATH": ":memory:",
            "DICTIONARY_DB_PATH": ":memory:",
            "DATABASE_URL": "memory://",
            "AUTH_REQUIRED": "true",
            "SESSION_SECRET": "test-only-session-secret-at-least-32-characters",
            "SESSION_COOKIE_SECURE": "false",
            "GITHUB_CLIENT_ID": "fake-client",
            "GITHUB_CLIENT_SECRET": "fake-secret",
            "PUBLIC_BASE_URL": "http://127.0.0.1:8000",
            "DEBUG": "true",
        }
    )


def production_cloud_settings(
    tmp_path: Path, overrides: dict[str, str] | None = None
) -> Settings:
    """Build production-validated settings while injecting memory storage in tests."""
    values = {
        "APP_ENV": "production",
        "APP_DATA_DIR": str(tmp_path / "production-data"),
        "APP_DB_PATH": ":memory:",
        "DICTIONARY_DB_PATH": ":memory:",
        "DATABASE_URL": "postgresql://ivrit_sheli_runtime:password@db/ivrit",
        "AUTH_REQUIRED": "true",
        "SESSION_SECRET": "production-test-secret-with-more-than-32-chars",
        "SESSION_COOKIE_SECURE": "true",
        "PUBLIC_BASE_URL": "https://ivrit.example",
        "GITHUB_CLIENT_ID": "client-id",
        "GITHUB_CLIENT_SECRET": "client-secret",
        "GITHUB_REDIRECT_URI": "https://ivrit.example/api/v1/auth/github/callback",
        "ALLOWED_ORIGINS": "",
        "DEBUG": "false",
    }
    values.update(overrides or {})
    return Settings.from_env(values)


def login_github(client: TestClient, code: str = "one") -> None:
    """Complete the deterministic fake browser OAuth flow."""
    started = client.get(
        "/api/v1/auth/github/start",
        headers={"Accept": "application/json"},
    )
    assert started.status_code == 200
    state = parse_qs(urlparse(started.json()["authorize_url"]).query)["state"][0]
    callback = client.get(
        "/api/v1/auth/github/callback",
        params={"code": code, "state": state},
        follow_redirects=False,
    )
    assert callback.status_code == 303


def test_cloud_requires_auth_and_demo_is_seeded_read_only(tmp_path: Path) -> None:
    store = MemoryCloudStore()
    with TestClient(
        create_app(cloud_settings(tmp_path), cloud_store=store, oauth_client=FakeGitHubOAuth())
    ) as client:
        anonymous = client.get("/api/v1/auth/me")
        assert anonymous.json() == {
            "authenticated": False,
            "demo": False,
            "read_only": False,
            "user": None,
            "mode": "cloud",
            "capabilities": {
                "cloud_learning": True,
                "ai": True,
                "audio_scoring": True,
                "connectors": True,
                "local_first": False,
            },
        }
        denied = client.get("/api/v1/dashboard")
        assert denied.status_code == 401
        assert denied.json()["error"]["code"] == "authentication_required"

        demo = client.post(
            "/api/v1/auth/demo", headers={"Content-Type": "application/json"}
        )
        assert demo.status_code == 200
        assert demo.json()["authenticated"] is True
        assert demo.json()["demo"] is True
        assert demo.json()["read_only"] is True
        assert demo.json()["user"]["display_name"] == "Ivrit Sheli Demo"

        dashboard = client.get("/api/v1/dashboard")
        items = client.get("/api/v1/items")
        assert dashboard.status_code == 200
        assert dashboard.json()["stats"]["total_items"] == 6
        assert dashboard.json()["system"]["offline_ready"] is False
        assert len(items.json()["items"]) == 6

        before_safe_reads = store.read_state(demo.json()["user"]["id"])
        assert client.get("/api/v1/dictionary/lookup", params={"word": "שלום"}).status_code == 200
        assert client.get("/api/v1/connectors").status_code == 200
        assert store.read_state(demo.json()["user"]["id"]) == before_safe_reads

        mutation = client.post("/api/v1/items", json={"hebrew_text": "פרטי"})
        assert mutation.status_code == 403
        assert mutation.json()["error"]["code"] == "demo_read_only"


def test_github_oauth_login_csrf_logout_and_replay_protection(tmp_path: Path) -> None:
    store = MemoryCloudStore()
    settings = cloud_settings(tmp_path)
    with TestClient(
        create_app(settings, cloud_store=store, oauth_client=FakeGitHubOAuth())
    ) as client:
        started = client.get(
            "/api/v1/auth/github/start",
            headers={"Accept": "application/json"},
        )
        state = parse_qs(urlparse(started.json()["authorize_url"]).query)["state"][0]
        callback = client.get(
            "/api/v1/auth/github/callback",
            params={"code": "primary", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303
        session = client.get("/api/v1/auth/me").json()
        assert session["authenticated"] is True
        assert session["demo"] is False
        assert session["read_only"] is False
        assert session["user"]["login"] == "learner-primary"

        foreign_origin = client.post(
            "/api/v1/items",
            json={"hebrew_text": "שלום"},
            headers={"Origin": "https://attacker.invalid"},
        )
        assert foreign_origin.status_code == 403
        assert foreign_origin.json()["error"]["code"] == "csrf_validation_failed"

        created = client.post(
            "/api/v1/items",
            json={"hebrew_text": "שלום"},
            headers={"Origin": "http://localhost:5173"},
        )
        assert created.status_code == 201

        ai = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני  לומד"}, "cloud_requested": False},
            headers={"Origin": "http://localhost:5173"},
        )
        pronunciation = client.post(
            "/api/v1/audio/pronunciation-score",
            json={"target_text": "תודה רבה", "transcript": "תודה"},
            headers={"Origin": "http://localhost:5173"},
        )
        retained_audio = client.post(
            "/api/v1/audio/tts",
            json={"text": "שלום", "retain": True},
            headers={"Origin": "http://localhost:5173"},
        )
        assert ai.status_code == 200
        assert pronunciation.status_code == 200
        assert retained_audio.status_code == 400
        learner_state = store.read_state(session["user"]["id"])
        assert len(learner_state["tables"]["ai_interactions"]) == 1
        assert len(learner_state["tables"]["audio_attempts"]) == 1

        replay = client.get(
            "/api/v1/auth/github/callback",
            params={"code": "again", "state": state},
            follow_redirects=False,
        )
        assert replay.status_code == 400
        assert replay.json()["error"]["code"] == "authentication_failed"

        logged_out = client.post(
            "/api/v1/auth/logout",
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:5173",
            },
        )
        assert logged_out.status_code == 200
        assert logged_out.json()["authenticated"] is False
        assert client.get("/api/v1/dashboard").status_code == 401


def test_github_oauth_cancel_returns_safely_and_consumes_state(tmp_path: Path) -> None:
    store = MemoryCloudStore()
    with TestClient(
        create_app(
            cloud_settings(tmp_path),
            cloud_store=store,
            oauth_client=FakeGitHubOAuth(),
        )
    ) as client:
        started = client.get(
            "/api/v1/auth/github/start",
            params={"next": "/settings"},
            headers={"Accept": "application/json"},
        )
        state = parse_qs(urlparse(started.json()["authorize_url"]).query)["state"][0]

        cancelled = client.get(
            "/api/v1/auth/github/callback",
            params={"error": "access_denied", "state": state},
            follow_redirects=False,
        )

        assert cancelled.status_code == 303
        assert cancelled.headers["location"] == "/settings"
        assert "ivrit_oauth_state=" in cancelled.headers["set-cookie"]
        assert "Max-Age=0" in cancelled.headers["set-cookie"]
        assert store.consume_oauth_state(state) is None
        assert client.get("/api/v1/auth/me").json()["authenticated"] is False

        replay = client.get(
            "/api/v1/auth/github/callback",
            params={"error": "access_denied", "state": state},
            follow_redirects=False,
        )
        assert replay.status_code == 400
        assert replay.json()["error"]["code"] == "authentication_failed"


def test_cloud_repository_isolates_users_with_colliding_item_ids() -> None:
    store = MemoryCloudStore()
    first = store.create_test_user("Alpha")
    second = store.create_test_user("Beta")
    first_repository = CloudLearningRepository(store, first.id, first.display_name)
    second_repository = CloudLearningRepository(store, second.id, second.display_name)

    created = first_repository.create_item({"hebrew_text": "סוד של אלפא"})
    assert created["id"] == 1
    with pytest.raises(KeyError):
        second_repository.get_item(created["id"])
    assert second_repository.list_items() == []
    assert "סוד של אלפא" in str(store.read_state(first.id))
    assert "סוד של אלפא" not in str(store.read_state(second.id))


def test_session_store_expires_and_revokes_bearer_tokens() -> None:
    store = MemoryCloudStore()
    user = store.create_test_user("Session")
    store.create_session(user.id, "expired-token", "csrf", -1)
    assert store.resolve_session("expired-token") is None
    store.create_session(user.id, "live-token", "csrf", 300)
    assert store.resolve_session("live-token") is not None
    store.revoke_session("live-token")
    assert store.resolve_session("live-token") is None


def test_demo_session_cap_and_opportunistic_auth_artifact_cleanup() -> None:
    store = MemoryCloudStore()
    demo = store.ensure_demo_user()
    for index in range(5):
        store.create_session(
            demo.id,
            f"demo-{index}",
            f"csrf-{index}",
            300,
            max_live_sessions=2,
            retention_seconds=0,
        )
    assert store.resolve_session("demo-0") is None
    assert store.resolve_session("demo-4") is not None
    assert sum(
        store.resolve_session(f"demo-{index}") is not None
        for index in range(5)
    ) == 2

    regular = store.create_test_user("Unlimited")
    for index in range(4):
        store.create_session(
            regular.id,
            f"regular-{index}",
            f"csrf-regular-{index}",
            300,
            retention_seconds=0,
        )
    assert all(
        store.resolve_session(f"regular-{index}") is not None
        for index in range(4)
    )

    store.create_session(
        regular.id,
        "already-expired",
        "expired-csrf",
        -1,
        retention_seconds=0,
    )
    store.store_oauth_state("expired-state", "verifier", "/", ttl_seconds=-1)
    store.store_oauth_state("live-state", "verifier", "/next", ttl_seconds=300)
    store.create_session(
        regular.id,
        "cleanup-trigger",
        "cleanup-csrf",
        300,
        retention_seconds=0,
    )
    assert store.hash_bearer("already-expired") not in store._sessions
    assert store.hash_bearer("expired-state") not in store._oauth_states
    assert store.consume_oauth_state("live-state") == ("verifier", "/next")


def test_operational_endpoints_report_version_storage_and_readiness(tmp_path: Path) -> None:
    with TestClient(
        create_app(
            cloud_settings(tmp_path),
            cloud_store=MemoryCloudStore(),
            oauth_client=FakeGitHubOAuth(),
        )
    ) as client:
        assert client.get("/health/live").json()["version"] == "2.1.0"
        ready = client.get("/health/ready")
        assert ready.status_code == 200
        assert ready.json()["checks"]["postgresql"] is True
        version = client.get("/version").json()
        assert version["version"] == "2.1.0"
        assert version["storage"] == "postgresql"


def test_legacy_local_mode_remains_authenticated_and_writable(tmp_path: Path) -> None:
    settings = Settings.from_env(
        {
            "APP_ENV": "development",
            "APP_DATA_DIR": str(tmp_path / "local-data"),
            "APP_DB_PATH": ":memory:",
            "DICTIONARY_DB_PATH": ":memory:",
            "DATABASE_URL": "",
            "AUTH_REQUIRED": "false",
        }
    )
    with TestClient(create_app(settings)) as client:
        identity = client.get("/api/v1/auth/me").json()
        assert identity["authenticated"] is True
        assert identity["demo"] is False
        assert identity["read_only"] is False
        assert identity["mode"] == "local"
        assert identity["capabilities"]["local_first"] is True
        created = client.post("/api/v1/items", json={"hebrew_text": "מצב מקומי"})
        assert created.status_code == 201
        assert created.json()["hebrew_text"] == "מצב מקומי"
        assert client.get("/api/v1/dashboard").json()["system"]["offline_ready"] is True


def test_production_settings_fail_closed_and_accept_only_https_oauth(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="SESSION_SECRET"):
        Settings.from_env(
            {
                "APP_ENV": "production",
                "APP_DATA_DIR": str(tmp_path / "unsafe"),
                "DATABASE_URL": "postgresql://ivrit_sheli_runtime:password@db/ivrit",
                "AUTH_REQUIRED": "true",
                "SESSION_SECRET": "short",
                "SESSION_COOKIE_SECURE": "true",
                "PUBLIC_BASE_URL": "https://ivrit.example",
            }
        )

    settings = Settings.from_env(
        {
            "APP_ENV": "production",
            "APP_DATA_DIR": str(tmp_path / "safe"),
            "DATABASE_URL": "postgresql://ivrit_sheli_runtime:password@db/ivrit",
            "AUTH_REQUIRED": "true",
            "SESSION_SECRET": "production-test-secret-with-more-than-32-chars",
            "SESSION_COOKIE_SECURE": "true",
            "PUBLIC_BASE_URL": "https://ivrit.example",
            "GITHUB_CLIENT_ID": "client-id",
            "GITHUB_CLIENT_SECRET": "client-secret",
            "GITHUB_REDIRECT_URI": "https://ivrit.example/api/v1/auth/github/callback",
        }
    )
    assert settings.allowed_origins == ("https://ivrit.example",)

    with pytest.raises(ValueError, match="must authenticate as ivrit_sheli_runtime"):
        Settings.from_env(
            {
                "APP_ENV": "production",
                "APP_DATA_DIR": str(tmp_path / "admin-url"),
                "DATABASE_URL": "postgresql://database_owner:password@db/ivrit",
                "AUTH_REQUIRED": "true",
                "SESSION_SECRET": "production-test-secret-with-more-than-32-chars",
                "SESSION_COOKIE_SECURE": "true",
                "PUBLIC_BASE_URL": "https://ivrit.example",
                "GITHUB_CLIENT_ID": "client-id",
                "GITHUB_CLIENT_SECRET": "client-secret",
                "GITHUB_REDIRECT_URI": (
                    "https://ivrit.example/api/v1/auth/github/callback"
                ),
            }
        )


def test_unknown_app_environment_fails_closed(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="APP_ENV must be one of"):
        Settings.from_env(
            {
                "APP_ENV": "prod",
                "APP_DATA_DIR": str(tmp_path / "unknown-environment-data"),
            }
        )


def test_production_provider_credentials_require_explicit_identity_allowlists(
    tmp_path: Path,
) -> None:
    with pytest.raises(ValueError, match="requires authentication"):
        production_cloud_settings(tmp_path, {"AUTH_REQUIRED": "false"})
    with pytest.raises(ValueError, match="DEBUG must be false"):
        production_cloud_settings(tmp_path, {"DEBUG": "true"})
    with pytest.raises(ValueError, match="exact HTTPS origins"):
        production_cloud_settings(tmp_path, {"ALLOWED_ORIGINS": "*"})
    with pytest.raises(ValueError, match="exact HTTPS origins"):
        production_cloud_settings(
            tmp_path, {"ALLOWED_ORIGINS": "https://*.trusted.example"}
        )
    with pytest.raises(ValueError, match="exact HTTPS origins"):
        production_cloud_settings(
            tmp_path, {"ALLOWED_ORIGINS": "http://trusted.example"}
        )
    with pytest.raises(ValueError, match="GitHub callback path"):
        production_cloud_settings(
            tmp_path,
            {
                "GITHUB_REDIRECT_URI": (
                    "https://ivrit.example/api/v1/auth/github/callback/attacker"
                )
            },
        )
    with pytest.raises(ValueError, match="cloud AI.*allowlist"):
        production_cloud_settings(
            tmp_path,
            {
                "AI_PROVIDER": "openai",
                "ALLOW_CLOUD_PROCESSING": "true",
                "OPENAI_API_KEY": "test-only-key",
            },
        )
    with pytest.raises(ValueError, match="Google connectors.*allowlist"):
        production_cloud_settings(
            tmp_path,
            {"GOOGLE_ACCESS_TOKEN": "test-only-google-token"},
        )

    settings = production_cloud_settings(
        tmp_path,
        {
            "ALLOW_CLOUD_PROCESSING": "true",
            "CLOUD_AI_ALLOWED_GITHUB_LOGINS": "Owner, owner",
            "GOOGLE_ACCESS_TOKEN": "test-only-google-token",
            "GOOGLE_CONNECTORS_ALLOWED_GITHUB_IDS": "12345",
            "RAILWAY_GIT_COMMIT_SHA": "railway-commit-sha",
        },
    )
    assert settings.cloud_ai_allowed_github_logins == ("owner",)
    assert settings.allows_cloud_ai("OWNER", None) is True
    assert settings.allows_google_connectors(None, "12345") is True
    assert settings.allows_google_connectors("owner", None) is False
    assert settings.build_commit == "railway-commit-sha"


def test_production_cloud_routes_deny_non_allowlisted_provider_operations(
    tmp_path: Path,
) -> None:
    settings = production_cloud_settings(
        tmp_path,
        {
            "CLOUD_AI_ALLOWED_GITHUB_LOGINS": "owner",
            "GOOGLE_CONNECTORS_ALLOWED_GITHUB_LOGINS": "owner",
        },
    )
    with TestClient(
        create_app(
            settings,
            cloud_store=MemoryCloudStore(),
            oauth_client=FakeGitHubOAuth(),
        ),
        base_url="https://ivrit.example",
    ) as client:
        login_github(client, "primary")
        headers = {"Origin": "https://ivrit.example"}

        offline = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": False},
            headers=headers,
        )
        assert offline.status_code == 200
        assert offline.json()["provider"] == "offline"

        guarded_requests = (
            client.post(
                "/api/v1/ai/correct",
                json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
                headers=headers,
            ),
            client.post(
                "/api/v1/audio/tts",
                json={"text": "שלום", "cloud_requested": True},
                headers=headers,
            ),
            client.post(
                "/api/v1/audio/stt?cloud_requested=true",
                files={"file": ("sample.webm", b"synthetic", "audio/webm")},
                headers=headers,
            ),
            client.post(
                "/api/v1/connectors/google/preview",
                json={"service": "calendar", "resource_id": ""},
                headers=headers,
            ),
        )
        for response in guarded_requests:
            assert response.status_code == 403
            assert response.json()["error"]["code"] == "cloud_feature_not_allowed"


def test_production_cloud_ai_allows_only_the_matching_github_identity(
    tmp_path: Path,
) -> None:
    settings = production_cloud_settings(
        tmp_path,
        {"CLOUD_AI_ALLOWED_GITHUB_IDS": "github-primary"},
    )
    with TestClient(
        create_app(
            settings,
            cloud_store=MemoryCloudStore(),
            oauth_client=FakeGitHubOAuth(),
        ),
        base_url="https://ivrit.example",
    ) as client:
        login_github(client, "primary")
        response = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
            headers={"Origin": "https://ivrit.example"},
        )
        assert response.status_code == 200
        assert response.json()["provider"] == "offline"
        assert response.json()["degraded_mode"] is True
