"""Request-size, authentication-abuse, concurrency, and cloud batching tests."""

from __future__ import annotations

import asyncio
import inspect
import threading
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.auth import AuthService, OAuthClient
from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import (
    CloudSnapshotLimitError,
    MemoryCloudStore,
    bearer_hash,
)
from ivrit_sheli.config import Settings
from ivrit_sheli.request_limits import _client_identity

ROOT_DIR = Path(__file__).resolve().parents[2]


class FakeOAuth(OAuthClient):
    """Deterministic provider boundary used without network access."""

    def authorize_url(self, state: str, verifier: str, settings: Settings) -> str:
        assert verifier and settings.github_client_id
        return f"https://github.test/authorize?state={state}"

    def exchange_code(
        self, code: str, verifier: str, settings: Settings
    ) -> dict[str, Any]:
        assert verifier and settings.github_client_secret
        return {
            "id": f"github-{code}",
            "login": f"learner-{code}",
            "name": f"Learner {code}",
            "avatar_url": None,
        }


class CountingMemoryCloudStore(MemoryCloudStore):
    """Expose tenant mutation count without weakening the production contract."""

    def __init__(self) -> None:
        super().__init__()
        self.mutation_count = 0
        self.resolve_count = 0

    def mutate_state(self, user_id: str, operation: Any) -> Any:
        self.mutation_count += 1
        return super().mutate_state(user_id, operation)

    def resolve_session(self, token: str) -> Any:
        self.resolve_count += 1
        return super().resolve_session(token)


class GatedSessionStore(MemoryCloudStore):
    """Pause one session lookup so the event-loop probe is deterministic."""

    def __init__(self) -> None:
        super().__init__()
        self.entered = threading.Event()
        self.release = threading.Event()

    def resolve_session(self, token: str) -> Any:
        self.entered.set()
        self.release.wait(timeout=1.0)
        return super().resolve_session(token)


def cloud_settings(tmp_path: Path, **overrides: str) -> Settings:
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
    values.update(overrides)
    return Settings.from_env(values)


def local_settings(tmp_path: Path, **overrides: str) -> Settings:
    values = {
        "APP_ENV": "test",
        "APP_DATA_DIR": str(tmp_path / "local-data"),
        "APP_DB_PATH": ":memory:",
        "DICTIONARY_DB_PATH": ":memory:",
        "DATABASE_URL": "",
        "AUTH_REQUIRED": "false",
    }
    values.update(overrides)
    return Settings.from_env(values)


def railway_settings(tmp_path: Path, **overrides: str) -> Settings:
    values = {
        "APP_ENV": "production",
        "APP_DATA_DIR": str(tmp_path / "railway-data"),
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
        "TRUSTED_PROXY_MODE": "railway",
        "RAILWAY_ENVIRONMENT_ID": "test-environment-id",
        "DEBUG": "false",
    }
    values.update(overrides)
    return Settings.from_env(values)


def render_settings(tmp_path: Path, **overrides: str) -> Settings:
    values = {
        "APP_ENV": "production",
        "APP_DATA_DIR": str(tmp_path / "render-data"),
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
        "TRUSTED_PROXY_MODE": "render",
        "RENDER": "true",
        "RENDER_SERVICE_ID": "srv-test-render-service",
        "DEBUG": "false",
    }
    values.update(overrides)
    return Settings.from_env(values)


def login_github(client: TestClient, code: str = "batch") -> None:
    started = client.get(
        "/api/v1/auth/github/start", headers={"Accept": "application/json"}
    )
    state = parse_qs(urlparse(started.json()["authorize_url"]).query)["state"][0]
    completed = client.get(
        "/api/v1/auth/github/callback",
        params={"code": code, "state": state},
        follow_redirects=False,
    )
    assert completed.status_code == 303


def test_declared_and_streamed_bodies_are_bounded_with_upload_overrides(
    tmp_path: Path,
) -> None:
    settings = local_settings(
        tmp_path,
        MAX_REQUEST_BODY_BYTES="64",
        MAX_AUDIO_UPLOAD_BODY_BYTES="2048",
        MAX_ICS_UPLOAD_BODY_BYTES="1024",
    )
    with TestClient(create_app(settings)) as client:
        declared = client.post(
            "/api/v1/items",
            content=b"{" + b'"hebrew_text":"' + b"x" * 80 + b'"}',
            headers={"Content-Type": "application/json", "X-Request-ID": "body-limit"},
        )
        assert declared.status_code == 413
        assert declared.json()["error"]["code"] == "request_body_too_large"
        assert declared.json()["error"]["request_id"] == "body-limit"

        def streamed_body() -> Any:
            yield b'{"hebrew_text":"'
            yield b"x" * 80
            yield b'"}'

        streamed = client.post(
            "/api/v1/items",
            content=streamed_body(),
            headers={"Content-Type": "application/json"},
        )
        assert streamed.status_code == 413
        assert streamed.json()["error"]["code"] == "request_body_too_large"

        allowed_upload = client.post(
            "/api/v1/audio/stt",
            files={"file": ("sample.webm", b"a" * 256, "audio/webm")},
        )
        # The unavailable self-hosted worker is reported explicitly, but the
        # route-specific allowance lets the request reach that provider boundary
        # instead of returning 413.
        assert allowed_upload.status_code == 503
        assert allowed_upload.json()["error"]["code"] == "audio_service_unavailable"
        oversized_upload = client.post(
            "/api/v1/audio/stt",
            files={"file": ("sample.webm", b"a" * 2200, "audio/webm")},
        )
        assert oversized_upload.status_code == 413


def test_direct_auth_client_bucket_blocks_same_peer_and_ignores_spoofed_xff(
    tmp_path: Path,
) -> None:
    settings = cloud_settings(
        tmp_path,
        AUTH_CLIENT_RATE_LIMIT_REQUESTS="2",
        AUTH_GLOBAL_RATE_LIMIT_REQUESTS="100",
        AUTH_RATE_LIMIT_WINDOW_SECONDS="60",
    )
    with TestClient(
        create_app(settings, cloud_store=MemoryCloudStore(), oauth_client=FakeOAuth())
    ) as client:
        for spoofed_address in ("198.51.100.1", "203.0.113.7"):
            response = client.get(
                "/api/v1/auth/github/start",
                headers={
                    "Accept": "application/json",
                    "X-Forwarded-For": spoofed_address,
                },
            )
            assert response.status_code == 200
        blocked = client.get(
            "/api/v1/auth/github/start",
            headers={
                "Accept": "application/json",
                "X-Forwarded-For": "192.0.2.99",
            },
        )
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "rate_limit_exceeded"
        assert int(blocked.headers["Retry-After"]) >= 1



def test_railway_mode_uses_trusted_x_real_ip_for_distinct_client_buckets(
    tmp_path: Path,
) -> None:
    settings = railway_settings(
        tmp_path,
        AUTH_CLIENT_RATE_LIMIT_REQUESTS="2",
        AUTH_GLOBAL_RATE_LIMIT_REQUESTS="20",
    )
    with TestClient(
        create_app(settings, cloud_store=MemoryCloudStore(), oauth_client=FakeOAuth()),
        base_url="https://ivrit.example",
    ) as client:
        first = {"Accept": "application/json", "X-Real-IP": "198.51.100.10"}
        assert client.get("/api/v1/auth/github/start", headers=first).status_code == 200
        assert client.get("/api/v1/auth/github/start", headers=first).status_code == 200
        assert client.get("/api/v1/auth/github/start", headers=first).status_code == 429
        second = {"Accept": "application/json", "X-Real-IP": "203.0.113.20"}
        assert client.get("/api/v1/auth/github/start", headers=second).status_code == 200


def test_render_mode_uses_only_cf_connecting_ip_for_distinct_client_buckets(
    tmp_path: Path,
) -> None:
    settings = render_settings(
        tmp_path,
        AUTH_CLIENT_RATE_LIMIT_REQUESTS="2",
        AUTH_GLOBAL_RATE_LIMIT_REQUESTS="20",
    )
    with TestClient(
        create_app(settings, cloud_store=MemoryCloudStore(), oauth_client=FakeOAuth()),
        base_url="https://ivrit.example",
    ) as client:
        first = {
            "Accept": "application/json",
            "CF-Connecting-IP": "198.51.100.10",
            "X-Forwarded-For": "203.0.113.250",
        }
        assert client.get("/api/v1/auth/github/start", headers=first).status_code == 200
        first["X-Forwarded-For"] = "192.0.2.99"
        assert client.get("/api/v1/auth/github/start", headers=first).status_code == 200
        assert client.get("/api/v1/auth/github/start", headers=first).status_code == 429

        second = {
            "Accept": "application/json",
            "CF-Connecting-IP": "203.0.113.20",
            "X-Forwarded-For": "198.51.100.10",
        }
        assert client.get("/api/v1/auth/github/start", headers=second).status_code == 200


def test_render_identity_collapses_missing_duplicate_and_invalid_headers() -> None:
    assert _client_identity({"headers": []}, "render") == "render:unresolved"
    assert (
        _client_identity(
            {
                "headers": [
                    (b"cf-connecting-ip", b"198.51.100.10"),
                    (b"CF-Connecting-IP", b"203.0.113.20"),
                ]
            },
            "render",
        )
        == "render:unresolved"
    )
    assert (
        _client_identity(
            {
                "headers": [
                    (b"cf-connecting-ip", b"not-an-ip"),
                    (b"x-forwarded-for", b"198.51.100.10"),
                ]
            },
            "render",
        )
        == "render:unresolved"
    )
    assert (
        _client_identity(
            {
                "headers": [
                    (b"cf-connecting-ip", b"2001:db8::1"),
                    (b"x-forwarded-for", b"192.0.2.99"),
                ]
            },
            "render",
        )
        == "render:2001:db8::1"
    )


def test_auth_endpoint_global_circuit_breaker_spans_distinct_railway_clients(
    tmp_path: Path,
) -> None:
    settings = railway_settings(
        tmp_path,
        AUTH_CLIENT_RATE_LIMIT_REQUESTS="1",
        AUTH_GLOBAL_RATE_LIMIT_REQUESTS="10",
    )
    with TestClient(
        create_app(settings, cloud_store=MemoryCloudStore(), oauth_client=FakeOAuth()),
        base_url="https://ivrit.example",
    ) as client:
        for index in range(10):
            allowed = client.get(
                "/api/v1/auth/github/start",
                headers={
                    "Accept": "application/json",
                    "X-Real-IP": f"198.51.100.{index + 1}",
                },
            )
            assert allowed.status_code == 200
        blocked = client.get(
            "/api/v1/auth/github/start",
            headers={"Accept": "application/json", "X-Real-IP": "203.0.113.99"},
        )
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "auth_global_rate_limit_exceeded"


def test_trusted_proxy_configuration_fails_closed(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="valid only in production"):
        cloud_settings(tmp_path, TRUSTED_PROXY_MODE="railway")
    with pytest.raises(ValueError, match="requires RAILWAY_ENVIRONMENT_ID"):
        railway_settings(tmp_path, RAILWAY_ENVIRONMENT_ID="")
    with pytest.raises(ValueError, match="valid only in production"):
        cloud_settings(
            tmp_path,
            TRUSTED_PROXY_MODE="render",
            RENDER="true",
            RENDER_SERVICE_ID="srv-test",
        )
    with pytest.raises(ValueError, match="requires RENDER=true"):
        render_settings(tmp_path, RENDER="false")
    with pytest.raises(ValueError, match="requires RENDER_SERVICE_ID"):
        render_settings(tmp_path, RENDER_SERVICE_ID="")
    with pytest.raises(ValueError, match="must be direct, railway, or render"):
        cloud_settings(tmp_path, TRUSTED_PROXY_MODE="untrusted")


def test_render_blueprint_is_manual_free_and_least_privilege() -> None:
    blueprint = (ROOT_DIR / "render.yaml").read_text(encoding="utf-8")
    assert "runtime: docker" in blueprint
    assert "plan: free" in blueprint
    assert "region: singapore" in blueprint
    assert "branch: main" in blueprint
    assert "autoDeployTrigger: off" in blueprint
    assert "healthCheckPath: /health/ready" in blueprint
    assert "preDeployCommand" not in blueprint
    assert "dockerCommand" not in blueprint
    assert "MIGRATION_DATABASE_URL" not in blueprint
    assert "OPENAI_API_KEY" not in blueprint

    for disabled_key in (
        "ALLOW_CLOUD_PROCESSING",
        "SELF_HOSTED_SPEECH_ENABLED",
        "WHISPER_PRELOAD_ON_START",
        "PUSH_NOTIFICATIONS_ENABLED",
    ):
        assert f"- key: {disabled_key}\n        value: \"false\"" in blueprint

    for prompted_key in (
        "DATABASE_URL",
        "PUBLIC_BASE_URL",
        "GOOGLE_AUTH_CLIENT_ID",
        "GOOGLE_AUTH_CLIENT_SECRET",
    ):
        assert f"- key: {prompted_key}\n        sync: false" in blueprint

    assert "- key: SESSION_SECRET\n        generateValue: true" in blueprint

    dockerignore = (ROOT_DIR / ".dockerignore").read_text(encoding="utf-8")
    assert ".env*" in dockerignore.splitlines()
    assert "**/.env*" in dockerignore.splitlines()


def test_container_entrypoint_preserves_raw_peer_and_never_trusts_xff() -> None:
    entrypoint = (ROOT_DIR / "scripts" / "docker-entrypoint.sh").read_text(
        encoding="utf-8"
    )
    dockerfile = (ROOT_DIR / "Dockerfile").read_text(encoding="utf-8")
    privilege_helper = (
        ROOT_DIR / "scripts" / "drop_privileges.py"
    ).read_text(encoding="utf-8")
    assert "--no-proxy-headers" in entrypoint
    assert "--forwarded-allow-ips" not in entrypoint
    assert "chown -R 10001:10001 /app/data" in entrypoint
    assert "drop_privileges.py /app/scripts/docker-entrypoint.sh" in entrypoint
    assert "unset MIGRATION_DATABASE_URL" in entrypoint
    assert "unset PUSH_DATABASE_URL" in entrypoint
    assert "USER root" in dockerfile
    assert "os.setgid(RUNTIME_GID)" in privilege_helper
    assert "os.setuid(RUNTIME_UID)" in privilege_helper
    assert "os.execvp(selected[0], selected)" in privilege_helper


def test_oversized_body_is_rejected_before_session_database_work(tmp_path: Path) -> None:
    store = CountingMemoryCloudStore()
    settings = cloud_settings(tmp_path, MAX_REQUEST_BODY_BYTES="64")
    with TestClient(
        create_app(settings, cloud_store=store, oauth_client=FakeOAuth())
    ) as client:
        assert client.post(
            "/api/v1/auth/demo", headers={"Content-Type": "application/json"}
        ).status_code == 200
        store.resolve_count = 0
        rejected = client.post(
            "/api/v1/items",
            content=b"{" + b'"hebrew_text":"' + b"x" * 80 + b'"}',
            headers={"Content-Type": "application/json"},
        )
        assert rejected.status_code == 413
        assert store.resolve_count == 0


def test_oauth_states_have_a_global_store_cap_and_release_capacity() -> None:
    store = MemoryCloudStore()
    assert store.store_oauth_state(
        "first", "verifier", "/", max_active_states=2
    )
    assert store.store_oauth_state(
        "second", "verifier", "/", max_active_states=2
    )
    assert not store.store_oauth_state(
        "blocked", "verifier", "/", max_active_states=2
    )
    assert store.consume_oauth_state("first") == ("verifier", "/")
    assert store.store_oauth_state(
        "replacement", "verifier", "/", max_active_states=2
    )


def test_oauth_start_surfaces_durable_state_capacity_as_retryable_429(
    tmp_path: Path,
) -> None:
    settings = cloud_settings(
        tmp_path,
        OAUTH_STATE_LIMIT="1",
        AUTH_CLIENT_RATE_LIMIT_REQUESTS="10",
    )
    with TestClient(
        create_app(settings, cloud_store=MemoryCloudStore(), oauth_client=FakeOAuth())
    ) as client:
        assert (
            client.get("/api/v1/auth/github/start", follow_redirects=False).status_code
            == 302
        )
        blocked = client.get("/api/v1/auth/github/start", follow_redirects=False)
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "authentication_busy"
        assert blocked.headers["Retry-After"] == "60"


def test_auth_posts_reject_cross_site_forms_and_logout_retains_csrf(
    tmp_path: Path,
) -> None:
    settings = cloud_settings(tmp_path)
    with TestClient(
        create_app(settings, cloud_store=MemoryCloudStore(), oauth_client=FakeOAuth())
    ) as client:
        form_post = client.post("/api/v1/auth/demo", data={"demo": "1"})
        assert form_post.status_code == 403
        cross_origin = client.post(
            "/api/v1/auth/demo",
            json={},
            headers={"Origin": "https://attacker.invalid"},
        )
        assert cross_origin.status_code == 403
        cross_site = client.post(
            "/api/v1/auth/demo",
            json={},
            headers={"Sec-Fetch-Site": "cross-site"},
        )
        assert cross_site.status_code == 403

        started = client.post(
            "/api/v1/auth/demo",
            json={},
            headers={"Origin": "http://localhost:5173"},
        )
        assert started.status_code == 200

        missing_csrf = client.post("/api/v1/auth/logout", json={})
        assert missing_csrf.status_code == 403
        assert client.get("/api/v1/auth/me").json()["authenticated"] is True

        csrf_token = client.cookies.get("ivrit_csrf")
        assert csrf_token
        logged_out = client.post(
            "/api/v1/auth/logout",
            json={},
            headers={"X-CSRF-Token": csrf_token},
        )
        assert logged_out.status_code == 200
        assert logged_out.json()["authenticated"] is False


def test_bearer_hash_is_deterministic_fixed_length_and_keyed() -> None:
    session_secret = "session-secret-with-at-least-32-characters"
    digest = bearer_hash("session-token", session_secret)

    assert digest == bearer_hash("session-token", session_secret)
    assert len(digest) == 64
    assert digest != bearer_hash("different-token", session_secret)
    assert len(bearer_hash("session-token", "x" * 128)) == 64
    assert len(bearer_hash("session-token", "סוד-ארוך-מאוד-" * 8)) == 64


def test_key_rotation_invalidates_session_csrf_and_oauth_bearers() -> None:
    first_secret = "first-session-secret-with-at-least-32-characters"
    second_secret = "second-session-secret-with-at-least-32-characters"
    store = MemoryCloudStore(session_secret=first_secret)
    user = store.create_test_user("Keyed")
    identity = store.create_session(user.id, "session-token", "csrf-token", 300)
    assert identity.csrf_hash == bearer_hash("csrf-token", first_secret)
    assert store.resolve_session("session-token") is not None
    assert store.store_oauth_state("oauth-state", "verifier", "/")

    store.configure_security(second_secret, 4_194_304)
    assert store.resolve_session("session-token") is None
    assert store.consume_oauth_state("oauth-state") is None
    assert bearer_hash("session-token", first_secret) != bearer_hash(
        "session-token", second_secret
    )


def test_non_demo_session_cap_revokes_oldest_login(tmp_path: Path) -> None:
    settings = cloud_settings(tmp_path, USER_SESSION_LIMIT="2")
    store = MemoryCloudStore(session_secret=settings.session_secret)
    store.ensure_demo_user()
    auth = AuthService(settings, store, FakeOAuth())
    tokens: list[str] = []
    for _index in range(3):
        state, _authorize_url = auth.start_github()
        grant, _redirect = auth.finish_github("shared", state, state)
        tokens.append(grant.token)
    assert store.resolve_session(tokens[0]) is None
    assert store.resolve_session(tokens[1]) is not None
    assert store.resolve_session(tokens[2]) is not None


def test_cloud_snapshot_limit_rejects_utf8_state_before_save() -> None:
    store = MemoryCloudStore(max_snapshot_bytes=200)
    user = store.create_test_user("Snapshot")
    before = store.read_state(user.id)
    with pytest.raises(CloudSnapshotLimitError, match="limit is 200 bytes"):
        store.mutate_state(
            user.id,
            lambda _current: ({"hebrew": "א" * 200}, None),
        )
    assert store.read_state(user.id) == before


def test_authenticated_write_limit_is_per_user_and_does_not_block_reads(
    tmp_path: Path,
) -> None:
    settings = cloud_settings(
        tmp_path,
        AUTHENTICATED_WRITE_RATE_LIMIT_REQUESTS="2",
        AUTHENTICATED_WRITE_RATE_LIMIT_WINDOW_SECONDS="60",
    )
    store = MemoryCloudStore()
    app = create_app(settings, cloud_store=store, oauth_client=FakeOAuth())
    headers = {"Origin": "http://localhost:5173"}
    with TestClient(app) as alpha:
        login_github(alpha, "alpha")
        for index in range(2):
            created = alpha.post(
                "/api/v1/items",
                json={"hebrew_text": f"אלפא {index}"},
                headers=headers,
            )
            assert created.status_code == 201
        blocked = alpha.post(
            "/api/v1/items",
            json={"hebrew_text": "אלפא חסום"},
            headers=headers,
        )
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "write_rate_limit_exceeded"
        assert int(blocked.headers["Retry-After"]) >= 1
        assert alpha.get("/api/v1/profile").status_code == 200

        with TestClient(app) as beta:
            login_github(beta, "beta")
            independent = beta.post(
                "/api/v1/items",
                json={"hebrew_text": "בטא"},
                headers=headers,
            )
            assert independent.status_code == 201


def test_cloud_connector_import_batches_one_hydrate_mutation_and_snapshot(
    tmp_path: Path, monkeypatch: Any
) -> None:
    store = CountingMemoryCloudStore()
    app = create_app(cloud_settings(tmp_path), cloud_store=store, oauth_client=FakeOAuth())
    hydrate_calls = 0
    snapshot_calls = 0
    original_hydrate = CloudLearningRepository._hydrate
    original_snapshot = CloudLearningRepository._snapshot

    def counted_hydrate(self: CloudLearningRepository, state: dict[str, Any]) -> Any:
        nonlocal hydrate_calls
        hydrate_calls += 1
        return original_hydrate(self, state)

    def counted_snapshot(database: Any) -> dict[str, Any]:
        nonlocal snapshot_calls
        snapshot_calls += 1
        return original_snapshot(database)

    with TestClient(app) as client:
        login_github(client)
        # Initialize the tenant before measuring only the import transaction.
        assert client.get("/api/v1/profile").status_code == 200
        monkeypatch.setattr(CloudLearningRepository, "_hydrate", counted_hydrate)
        monkeypatch.setattr(
            CloudLearningRepository, "_snapshot", staticmethod(counted_snapshot)
        )
        store.mutation_count = 0
        invalid = client.post(
            "/api/v1/connectors/import",
            json={
                "source": "load-test",
                "phrases": [{"hebrew": "א" * 2001}],
            },
            headers={"Origin": "http://localhost:5173"},
        )
        assert invalid.status_code == 422
        assert hydrate_calls == 0
        assert snapshot_calls == 0
        assert store.mutation_count == 0
        phrases = [
            {"hebrew": f"משפט {index}", "en": f"phrase {index}", "es": f"frase {index}"}
            for index in range(50)
        ]
        imported = client.post(
            "/api/v1/connectors/import",
            json={"source": "load-test", "phrases": phrases},
            headers={"Origin": "http://localhost:5173"},
        )
        assert imported.status_code == 201
        assert imported.json()["count"] == 50
        assert store.mutation_count == 1
        assert hydrate_calls == 1
        assert snapshot_calls == 1


def test_blocking_session_lookup_does_not_starve_liveness(tmp_path: Path) -> None:
    store = GatedSessionStore()
    app = create_app(cloud_settings(tmp_path), cloud_store=store, oauth_client=FakeOAuth())

    async def scenario() -> None:
        transport = httpx.ASGITransport(app=app)
        async with app.router.lifespan_context(app):
            async with (
                httpx.AsyncClient(
                    transport=transport, base_url="http://127.0.0.1:8000"
                ) as learner,
                httpx.AsyncClient(
                    transport=transport, base_url="http://127.0.0.1:8000"
                ) as probe,
            ):
                assert (
                    await learner.post(
                        "/api/v1/auth/demo",
                        headers={"Content-Type": "application/json"},
                    )
                ).status_code == 200
                blocked_request = asyncio.create_task(learner.get("/api/v1/dashboard"))
                entered = await asyncio.to_thread(store.entered.wait, 0.5)
                assert entered is True
                try:
                    live = await asyncio.wait_for(probe.get("/health/live"), timeout=0.5)
                    assert live.status_code == 200
                    assert blocked_request.done() is False
                finally:
                    store.release.set()
                assert (await blocked_request).status_code == 200

    asyncio.run(scenario())


def test_blocking_application_routes_are_declared_sync_for_threadpool_dispatch(
    tmp_path: Path,
) -> None:
    app = create_app(
        cloud_settings(tmp_path),
        cloud_store=MemoryCloudStore(),
        oauth_client=FakeOAuth(),
    )
    endpoints = {
        route.path: route.endpoint
        for route in app.routes
        if isinstance(route, APIRoute)
    }
    blocking_routes = {
        "/api/v1/auth/github/callback",
        "/api/v1/auth/google/callback",
        "/api/v1/auth/demo",
        "/api/v1/account",
        "/health/ready",
        "/api/v1/dashboard",
        "/api/v1/ai/correct",
        "/api/v1/audio/stt",
        "/api/v1/connectors/google/preview",
        "/api/v1/export",
    }
    assert blocking_routes <= endpoints.keys()
    assert all(
        not inspect.iscoroutinefunction(endpoints[path]) for path in blocking_routes
    )
