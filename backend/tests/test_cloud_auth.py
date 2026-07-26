"""Cloud authentication, demo safety, tenant isolation, and operational endpoint tests."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.auth import GoogleOAuthClient
from ivrit_sheli.cloud_repository import STATE_FORMAT, CloudLearningRepository
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


class FakeGoogleOAuth:
    """Deterministic Google OIDC boundary with one stable privacy-minimal subject."""

    def authorize_url(self, state: str, verifier: str, settings: Settings) -> str:
        assert len(verifier) >= 43
        assert settings.google_auth_client_id
        return f"https://accounts.google.test/authorize?state={state}"

    def exchange_code(self, code: str, verifier: str, settings: Settings) -> dict[str, Any]:
        assert code and verifier and settings.google_auth_client_secret
        return {
            "id": "google-stable-subject",
            "name": "Beginner Learner",
            "avatar_url": "https://lh3.googleusercontent.com/a/learner",
        }


def cloud_settings(
    tmp_path: Path, overrides: dict[str, str] | None = None
) -> Settings:
    """Build test-only cloud settings backed by an injected in-memory store."""
    values = {
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
    values.update(overrides or {})
    return Settings.from_env(values)


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


def test_google_oidc_client_uses_pkce_and_discards_private_token_fields(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = cloud_settings(
        tmp_path,
        {
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
            "GOOGLE_AUTH_REDIRECT_URI": (
                "http://127.0.0.1:8000/api/v1/auth/google/callback"
            ),
        },
    )
    client = GoogleOAuthClient()
    assert client._picture_url("https://tracking.example/avatar") is None
    verifier = "v" * 64
    query = parse_qs(urlparse(client.authorize_url("state-value", verifier, settings)).query)
    assert query["response_type"] == ["code"]
    assert query["scope"] == ["openid profile"]
    assert "email" not in query["scope"][0]
    assert query["state"] == ["state-value"]
    assert query["code_challenge_method"] == ["S256"]
    assert query["code_challenge"][0] != verifier

    captured: dict[str, Any] = {}

    class FakeResponse:
        def __init__(self, payload: dict[str, Any]) -> None:
            self.payload = payload

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, Any]:
            return self.payload

    def fake_post(url: str, **kwargs: Any) -> FakeResponse:
        captured["token_url"] = url
        captured["token_request"] = kwargs
        return FakeResponse(
            {
                "access_token": "transient-access-token",
                "id_token": "transient-id-token",
                "refresh_token": "must-not-be-retained",
                "token_type": "Bearer",
            }
        )

    def fake_get(url: str, **kwargs: Any) -> FakeResponse:
        captured["userinfo_url"] = url
        captured["userinfo_request"] = kwargs
        return FakeResponse(
            {
                "sub": "google-subject",
                "name": "Google Learner",
                "picture": "https://lh3.googleusercontent.com/a/profile",
                "email": "must-not-be-stored@example.test",
            }
        )

    monkeypatch.setattr("ivrit_sheli.auth.requests.post", fake_post)
    monkeypatch.setattr("ivrit_sheli.auth.requests.get", fake_get)

    profile = client.exchange_code("one-use-code", verifier, settings)

    assert profile == {
        "id": "google-subject",
        "name": "Google Learner",
        "avatar_url": "https://lh3.googleusercontent.com/a/profile",
    }
    assert captured["token_url"] == "https://oauth2.googleapis.com/token"
    assert captured["token_request"]["data"]["grant_type"] == "authorization_code"
    assert captured["token_request"]["data"]["code_verifier"] == verifier
    assert captured["userinfo_url"] == (
        "https://openidconnect.googleapis.com/v1/userinfo"
    )
    assert captured["userinfo_request"]["headers"]["Authorization"] == (
        "Bearer transient-access-token"
    )


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
            "auth_providers": ["github"],
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

        learning_core = client.get("/api/v1/learning-core")
        learning_core_next = client.get("/api/v1/learning-core/next")
        assert learning_core.status_code == learning_core_next.status_code == 200
        assert learning_core.json()["contract_version"] == "2.6"
        assert learning_core_next.json()["activity"]["phase"] == "encounter"

        before_safe_reads = store.read_state(demo.json()["user"]["id"])
        assert client.get("/api/v1/dictionary/lookup", params={"word": "שלום"}).status_code == 200
        assert client.get("/api/v1/connectors").status_code == 200
        local_word_analysis = client.post(
            "/api/v1/audio/word-analysis",
            json={"transcript": "שלום", "transcript_provider": "browser"},
        )
        assert local_word_analysis.status_code == 200
        assert local_word_analysis.json()["word"] == "שלום"
        assert local_word_analysis.json()["provenance"]["audio_retained"] is False
        cloud_word_analysis = client.post(
            "/api/v1/audio/word-analysis",
            json={
                "transcript": "שלום",
                "transcript_provider": "browser",
                "cloud_requested": True,
            },
        )
        assert cloud_word_analysis.status_code == 403
        assert cloud_word_analysis.json()["error"]["code"] == "cloud_feature_not_allowed"
        assert store.read_state(demo.json()["user"]["id"]) == before_safe_reads

        core_mutation = client.post(
            "/api/v1/learning-core/attempt",
            json={
                "item_id": learning_core_next.json()["activity"]["item"]["id"],
                "is_correct": True,
            },
        )
        assert core_mutation.status_code == 403
        assert core_mutation.json()["error"]["code"] == "demo_read_only"
        assert store.read_state(demo.json()["user"]["id"]) == before_safe_reads

        mutation = client.post("/api/v1/items", json={"hebrew_text": "פרטי"})
        assert mutation.status_code == 403
        assert mutation.json()["error"]["code"] == "demo_read_only"
        delete_demo = client.request(
            "DELETE",
            "/api/v1/account",
            json={"confirm": True},
            headers={"Origin": "http://localhost:5173"},
        )
        assert delete_demo.status_code == 403
        assert delete_demo.json()["error"]["code"] == "demo_read_only"


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


def test_google_login_persists_and_account_deletion_clears_all_private_state(
    tmp_path: Path,
) -> None:
    store = MemoryCloudStore()
    settings = cloud_settings(
        tmp_path,
        {
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
            "GOOGLE_AUTH_REDIRECT_URI": (
                "http://127.0.0.1:8000/api/v1/auth/google/callback"
            ),
        },
    )
    assert store.store_oauth_state(
        "provider-bound-state",
        "provider-verifier",
        "/next",
        provider="google",
    )
    assert store.consume_oauth_state(
        "provider-bound-state", provider="github"
    ) is None
    assert store.consume_oauth_state(
        "provider-bound-state", provider="google"
    ) == ("provider-verifier", "/next")

    with TestClient(
        create_app(
            settings,
            cloud_store=store,
            oauth_client=FakeGitHubOAuth(),
            google_oauth_client=FakeGoogleOAuth(),
        )
    ) as client:
        started = client.get(
            "/api/v1/auth/google/start",
            headers={"Accept": "application/json"},
        )
        assert started.status_code == 200
        state = parse_qs(urlparse(started.json()["authorize_url"]).query)["state"][0]
        callback = client.get(
            "/api/v1/auth/google/callback",
            params={"code": "first", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303

        session = client.get("/api/v1/auth/me").json()
        assert session["auth_providers"] == ["google", "github"]
        assert session["user"]["provider"] == "google"
        assert session["user"]["login"] is None
        original_user_id = session["user"]["id"]

        created = client.post(
            "/api/v1/items",
            json={"hebrew_text": "מילה פרטית"},
            headers={"Origin": "http://localhost:5173"},
        )
        assert created.status_code == 201
        assert client.get("/api/v1/auth/me").json()["user"]["id"] == original_user_id
        assert client.get("/api/v1/export").status_code == 200

        missing_csrf = client.request(
            "DELETE",
            "/api/v1/account",
            json={"confirm": True},
        )
        assert missing_csrf.status_code == 403
        assert missing_csrf.json()["error"]["code"] == "csrf_validation_failed"
        assert store.read_state(original_user_id)

        foreign_origin = client.request(
            "DELETE",
            "/api/v1/account",
            json={"confirm": True},
            headers={"Origin": "https://attacker.invalid"},
        )
        assert foreign_origin.status_code == 403

        deleted = client.request(
            "DELETE",
            "/api/v1/account",
            json={"confirm": True},
            headers={"Origin": "http://localhost:5173"},
        )
        assert deleted.status_code == 200
        assert deleted.json()["authenticated"] is False
        assert deleted.json()["auth_providers"] == ["google", "github"]
        assert client.get("/api/v1/auth/me").json()["authenticated"] is False
        with pytest.raises(KeyError, match="User is not available"):
            store.read_state(original_user_id)

        restarted = client.get(
            "/api/v1/auth/google/start",
            headers={"Accept": "application/json"},
        )
        second_state = parse_qs(urlparse(restarted.json()["authorize_url"]).query)[
            "state"
        ][0]
        assert client.get(
            "/api/v1/auth/google/callback",
            params={"code": "second", "state": second_state},
            follow_redirects=False,
        ).status_code == 303
        recreated = client.get("/api/v1/auth/me").json()
        assert recreated["user"]["id"] != original_user_id
        assert client.get("/api/v1/items").json()["items"] == []


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


def test_legacy_cloud_profile_keeps_level_and_skips_new_beginner_gates() -> None:
    store = MemoryCloudStore()
    user = store.create_test_user("Returning cloud learner")
    legacy_state = {
        "format": STATE_FORMAT,
        "tables": {
            "profiles": [
                {
                    "id": 1,
                    "display_name": "Returning cloud learner",
                    "interface_language": "he",
                    "hebrew_level": "C1",
                    "daily_minutes": 35,
                    "guided_mode": 0,
                    "created_at": "2026-07-16T00:00:00Z",
                    "updated_at": "2026-07-16T00:00:00Z",
                }
            ]
        },
    }
    store.mutate_state(user.id, lambda _current: (legacy_state, None))

    repository = CloudLearningRepository(store, user.id, user.display_name)
    profile = repository.get_profile()

    assert profile["hebrew_level"] == "C1"
    assert profile["daily_minutes"] == 35
    assert profile["onboarding_step"] == 4
    assert profile["onboarding_completed"] == 1
    assert profile["first_steps_step"] == 5
    assert profile["first_steps_completed"] == 1
    assert profile["learner_mode"] == "explorer"

    repository.update_profile({"daily_minutes": 36})
    persisted_profile = store.read_state(user.id)["tables"]["profiles"][0]
    assert persisted_profile["hebrew_level"] == "C1"
    assert persisted_profile["first_steps_completed"] == 1
    assert persisted_profile["learner_mode"] == "explorer"


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
        assert client.get("/health/live").json()["version"] == "2.8.1"
        ready = client.get("/health/ready")
        assert ready.status_code == 200
        assert ready.json()["checks"]["postgresql"] is True
        assert ready.json()["checks"]["dictionary_details"]["mode"] == "shared_cloud"
        version = client.get("/version").json()
        assert version["version"] == "2.8.1"
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
    assert settings.auth_providers == ("github",)

    google_only = production_cloud_settings(
        tmp_path,
        {
            "GITHUB_CLIENT_ID": "",
            "GITHUB_CLIENT_SECRET": "",
            "GITHUB_REDIRECT_URI": "",
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
            "GOOGLE_AUTH_REDIRECT_URI": (
                "https://ivrit.example/api/v1/auth/google/callback"
            ),
        },
    )
    assert google_only.auth_providers == ("google",)

    both_providers = production_cloud_settings(
        tmp_path,
        {
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
            "GOOGLE_AUTH_REDIRECT_URI": (
                "https://ivrit.example/api/v1/auth/google/callback"
            ),
        },
    )
    assert both_providers.auth_providers == ("google", "github")

    with pytest.raises(ValueError, match="Google sign-in requires both"):
        production_cloud_settings(
            tmp_path,
            {
                "GOOGLE_AUTH_CLIENT_ID": "google-client",
                "GOOGLE_AUTH_CLIENT_SECRET": "",
            },
        )
    with pytest.raises(ValueError, match="at least one OAuth provider"):
        production_cloud_settings(
            tmp_path,
            {
                "GITHUB_CLIENT_ID": "",
                "GITHUB_CLIENT_SECRET": "",
            },
        )
    with pytest.raises(ValueError, match="Google callback path"):
        production_cloud_settings(
            tmp_path,
            {
                "GOOGLE_AUTH_CLIENT_ID": "google-client",
                "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
                "GOOGLE_AUTH_REDIRECT_URI": "https://ivrit.example/wrong-callback",
            },
        )

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
            "CLOUD_AI_ALLOWED_GOOGLE_SUBJECTS": "google-alpha, google-alpha",
            "GOOGLE_ACCESS_TOKEN": "test-only-google-token",
            "GOOGLE_CONNECTORS_ALLOWED_GITHUB_IDS": "12345",
            "GOOGLE_CONNECTORS_ALLOWED_GOOGLE_SUBJECTS": "google-beta",
            "RAILWAY_GIT_COMMIT_SHA": "railway-commit-sha",
        },
    )
    assert settings.cloud_ai_allowed_github_logins == ("owner",)
    assert settings.cloud_ai_allowed_google_subjects == ("google-alpha",)
    assert settings.allows_cloud_ai("OWNER", None) is True
    assert settings.allows_cloud_ai(None, "google-alpha", provider="google") is True
    assert settings.allows_cloud_ai("owner", "google-alpha", provider="unknown") is False
    assert settings.allows_google_connectors(None, "12345") is True
    assert settings.allows_google_connectors(None, "google-beta", provider="google") is True
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
        headers = {"Origin": "https://ivrit.example"}
        denied_without_consent = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
            headers=headers,
        )
        assert denied_without_consent.status_code == 403
        assert denied_without_consent.json()["error"]["code"] == "cloud_consent_required"

        consent = client.put(
            "/api/v1/profile",
            json={"cloud_consent": True},
            headers=headers,
        )
        assert consent.status_code == 200
        response = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["provider"] == "offline"
        assert response.json()["degraded_mode"] is True


def test_production_cloud_ai_can_allow_an_explicit_google_subject(
    tmp_path: Path,
) -> None:
    settings = production_cloud_settings(
        tmp_path,
        {
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
            "GOOGLE_AUTH_REDIRECT_URI": (
                "https://ivrit.example/api/v1/auth/google/callback"
            ),
            "CLOUD_AI_ALLOWED_GOOGLE_SUBJECTS": "google-stable-subject",
        },
    )
    with TestClient(
        create_app(
            settings,
            cloud_store=MemoryCloudStore(),
            oauth_client=FakeGitHubOAuth(),
            google_oauth_client=FakeGoogleOAuth(),
        ),
        base_url="https://ivrit.example",
    ) as client:
        started = client.get(
            "/api/v1/auth/google/start",
            headers={"Accept": "application/json"},
        )
        state = parse_qs(urlparse(started.json()["authorize_url"]).query)["state"][0]
        callback = client.get(
            "/api/v1/auth/google/callback",
            params={"code": "pilot", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303

        headers = {"Origin": "https://ivrit.example"}
        denied_without_consent = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
            headers=headers,
        )
        assert denied_without_consent.status_code == 403
        assert denied_without_consent.json()["error"]["code"] == "cloud_consent_required"

        consent = client.put(
            "/api/v1/profile",
            json={"cloud_consent": True},
            headers=headers,
        )
        assert consent.status_code == 200
        response = client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["provider"] == "offline"
        assert response.json()["degraded_mode"] is True
