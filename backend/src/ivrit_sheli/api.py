"""
Module: FastAPI application
Purpose: Expose the complete local Hebrew-learning system through validated, observable HTTP endpoints.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import hmac
import logging
import sqlite3
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Annotated, Any, Literal, cast
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from psycopg import Error as PostgresError
from pydantic import BaseModel, ConfigDict, Field
from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool
from starlette.middleware.base import BaseHTTPMiddleware

from ivrit_sheli import __version__
from ivrit_sheli.ai_engine import AIEngine
from ivrit_sheli.audio import MAX_AUDIO_BYTES, AudioProviderError, AudioService
from ivrit_sheli.auth import (
    AuthenticationCapacityError,
    AuthenticationConfigurationError,
    AuthenticationError,
    AuthService,
    OAuthClient,
    auth_payload,
)
from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import (
    CloudSnapshotLimitError,
    CloudStore,
    MemoryCloudStore,
    PostgresCloudStore,
    bearer_hash,
)
from ivrit_sheli.config import Settings
from ivrit_sheli.connectors import ConnectorError, ConnectorService, ContextPreview
from ivrit_sheli.database import Database
from ivrit_sheli.dictionary import DictionaryStore
from ivrit_sheli.gamification import XPAction
from ivrit_sheli.repository import LearningRepository
from ivrit_sheli.request_limits import (
    AuthRateLimitMiddleware,
    RequestBodyLimitMiddleware,
    RequestBodyTooLarge,
    SlidingWindowLimiter,
)
from ivrit_sheli.structured_logging import configure_json_logging, privacy_user_hash

LOGGER = logging.getLogger(__name__)
API_PREFIX = "/api/v1"
APP_CONTENT_SECURITY_POLICY = "; ".join(
    (
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://avatars.githubusercontent.com",
        "font-src 'self' data:",
        "connect-src 'self'",
        "media-src 'self' data: blob: https:",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
    )
)
DOCS_CONTENT_SECURITY_POLICY = (
    APP_CONTENT_SECURITY_POLICY.replace(
        "script-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    )
    .replace(
        "style-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    )
    .replace(
        "img-src 'self' data: blob: https://avatars.githubusercontent.com",
        (
            "img-src 'self' data: blob: https://avatars.githubusercontent.com "
            "https://fastapi.tiangolo.com"
        ),
    )
)
NO_STORE_OPERATIONAL_PATHS = frozenset({"/health/live", "/health/ready", "/version"})


class CloudFeatureForbiddenError(RuntimeError):
    """Raised when a production-cloud identity is outside a provider allowlist."""


class AuthRequestSafetyError(RuntimeError):
    """Raised when an auth POST does not meet the browser CSRF boundary."""


class StrictModel(BaseModel):
    """Base request model that rejects misspelled fields."""

    model_config = ConfigDict(extra="forbid")


class LearningItemPayload(StrictModel):
    """Validated learning-item creation payload."""

    hebrew_text: str = Field(min_length=1, max_length=2000)
    hebrew_with_niqqud: str | None = Field(default=None, max_length=2000)
    transliteration: str | None = Field(default=None, max_length=2000)
    translation_en: str | None = Field(default=None, max_length=4000)
    translation_es: str | None = Field(default=None, max_length=4000)
    item_type: str = Field(default="phrase", max_length=50)
    root: str | None = Field(default=None, max_length=80)
    binyan: str | None = Field(default=None, max_length=80)
    grammatical_gender: str | None = Field(default=None, max_length=80)
    register_label: str | None = Field(default=None, max_length=100)
    context_label: str = Field(default="daily_life", max_length=100)
    source_label: str = Field(default="manual", max_length=100)
    personal_note: str | None = Field(default=None, max_length=10_000)
    priority: float = Field(default=0.5, ge=0, le=1)


class ReviewPayload(StrictModel):
    """Validated adaptive review submission."""

    is_correct: bool
    confidence: int = Field(default=3, ge=1, le=5)
    response_ms: int = Field(default=0, ge=0, le=3_600_000)
    hints_used: int = Field(default=0, ge=0, le=100)
    modality: Literal["recognition", "production", "listening", "speaking"] = "recognition"
    exercise_type: str = Field(default="mixed_review", max_length=100)
    mistake_category: str | None = Field(default=None, max_length=100)
    answer_text: str | None = Field(default=None, max_length=10_000)


class ProfilePayload(StrictModel):
    """Validated learner profile update."""

    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    interface_language: Literal["en", "es", "he"] | None = None
    hebrew_level: str | None = Field(default=None, max_length=20)
    daily_minutes: int | None = Field(default=None, ge=5, le=180)
    transliteration_mode: Literal["always", "hints", "hidden"] | None = None
    niqqud_mode: Literal["always", "difficult", "hidden"] | None = None
    weekly_rest_day: int | None = Field(default=None, ge=0, le=6)
    cloud_consent: bool | None = None
    goals: list[dict[str, Any]] | None = None


class AITaskPayload(StrictModel):
    """Flexible but bounded AI task request."""

    payload: dict[str, Any] = Field(default_factory=dict)
    learner_context: dict[str, Any] = Field(default_factory=dict)
    cloud_requested: bool = False


class TTSPayload(StrictModel):
    """Text-to-speech request."""

    text: str = Field(min_length=1, max_length=4000)
    cloud_requested: bool = False
    voice: str | None = Field(default=None, max_length=80)
    retain: bool = False


class PronunciationPayload(StrictModel):
    """Transcript-based pronunciation score request."""

    target_text: str = Field(min_length=1, max_length=4000)
    transcript: str = Field(min_length=1, max_length=4000)
    item_id: int | None = Field(default=None, ge=1)
    provider: str = Field(default="browser", max_length=80)


class GooglePreviewPayload(StrictModel):
    """Read-only Google preview request."""

    service: Literal["calendar", "gmail", "drive"]
    resource_id: str = Field(default="", max_length=500)


class ConnectorPhrasePayload(StrictModel):
    """One fully bounded phrase selected from a connector preview."""

    hebrew: str = Field(min_length=1, max_length=2000)
    en: str | None = Field(default=None, max_length=4000)
    es: str | None = Field(default=None, max_length=4000)


class ConnectorImportPayload(StrictModel):
    """Explicitly selected phrase import from a connector preview."""

    source: str = Field(max_length=100)
    context_label: str = Field(default="daily_life", max_length=100)
    phrases: list[ConnectorPhrasePayload] = Field(min_length=1, max_length=50)


class MissionPayload(StrictModel):
    """Real-life mission creation payload."""

    mission_text: str = Field(min_length=1, max_length=4000)
    item_id: int | None = Field(default=None, ge=1)
    context_label: str = Field(default="daily_life", max_length=100)
    scheduled_for: str | None = Field(default=None, max_length=100)


class MissionCompletionPayload(StrictModel):
    """Real-life mission result payload."""

    success: bool
    confidence_after: int = Field(default=3, ge=1, le=5)
    reflection: str | None = Field(default=None, max_length=10_000)


class BugReportPayload(StrictModel):
    """Privacy-conscious local bug report."""

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=20_000)
    route: str | None = Field(default=None, max_length=500)
    request_id: str | None = Field(default=None, max_length=100)
    diagnostics: dict[str, Any] = Field(default_factory=dict)


@dataclass(slots=True)
class Services:
    """Application service container kept on `app.state`.

    Args:
        settings: Runtime settings.
        database: Learner database.
        dictionary: Dictionary store.
        repository: Learning repository.
        ai: AI engine.
        audio: Audio service.
        connectors: Connector service.
    """

    settings: Settings
    database: Database
    dictionary: DictionaryStore
    repository: LearningRepository
    ai: AIEngine
    audio: AudioService
    connectors: ConnectorService
    cloud_store: CloudStore
    auth: AuthService


def build_services(
    settings: Settings,
    cloud_store: CloudStore | None = None,
    oauth_client: OAuthClient | None = None,
) -> Services:
    """Initialize databases and domain services.

    Args:
        settings: Validated runtime settings.

    Returns:
        Ready service container.

    Raises:
        sqlite3.Error: If local persistence cannot initialize.

    Example:
        Used by `create_app` and focused tests.
    """
    database = Database(settings.db_path)
    database.initialize()
    dictionary = DictionaryStore(settings.dictionary_db_path)
    dictionary.initialize()
    repository = LearningRepository(database)
    repository.ensure_default_profile()
    # An empty install still gets clickable Hebrew and useful dashboard content.
    if dictionary.stats()["entries"] == 0:
        dictionary.seed_demo()
    configured_store = cloud_store
    if configured_store is None:
        configured_store = (
            PostgresCloudStore(
                settings.database_url,
                session_secret=settings.session_secret,
                max_snapshot_bytes=settings.max_cloud_snapshot_bytes,
            )
            if settings.cloud_mode and settings.database_url != "memory://"
            else MemoryCloudStore(
                session_secret=(
                    settings.session_secret or "local-development-only-session-secret-key"
                ),
                max_snapshot_bytes=settings.max_cloud_snapshot_bytes,
            )
        )
    configured_store.configure_security(
        settings.session_secret or "local-development-only-session-secret-key",
        settings.max_cloud_snapshot_bytes,
    )
    configured_store.ensure_demo_user()
    return Services(
        settings=settings,
        database=database,
        dictionary=dictionary,
        repository=repository,
        ai=AIEngine(settings, database),
        audio=AudioService(settings, database),
        connectors=ConnectorService(settings, database),
        cloud_store=configured_store,
        auth=AuthService(settings, configured_store, oauth_client),
    )


def create_app(
    settings: Settings | None = None,
    *,
    cloud_store: CloudStore | None = None,
    oauth_client: OAuthClient | None = None,
) -> FastAPI:
    """Create the configured FastAPI application.

    Args:
        settings: Optional settings override for tests.

    Returns:
        FastAPI application.

    Example:
        >>> app = create_app(Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"}))
        >>> app.title
        'Ivrit Sheli Ultimate API'
    """
    runtime_settings = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        """Initialize and close retained local resources."""
        configure_logging(runtime_settings.log_level)
        app.state.services = build_services(runtime_settings, cloud_store, oauth_client)
        LOGGER.info(
            "Ivrit Sheli API initialized",
            extra={
                "event": "app.started",
                "version": __version__,
                "commit": runtime_settings.build_commit,
                "environment": runtime_settings.app_env,
            },
        )
        yield
        app.state.services.database.close()
        app.state.services.dictionary.close()
        app.state.services.cloud_store.close()

    app = FastAPI(
        title="Ivrit Sheli Ultimate API",
        version=__version__,
        description="Local-first and securely authenticated cloud Hebrew-learning API",
        docs_url=f"{API_PREFIX}/docs",
        openapi_url=f"{API_PREFIX}/openapi.json",
        lifespan=lifespan,
    )
    authenticated_write_limiter = SlidingWindowLimiter(
        runtime_settings.authenticated_write_rate_limit_requests,
        runtime_settings.authenticated_write_rate_limit_window_seconds,
        max_keys=runtime_settings.authenticated_write_rate_limit_max_users,
    )

    async def authorization_middleware(request: Request, call_next: Any) -> Any:
        """Resolve synchronous sessions off-loop, then enforce auth/demo/CSRF rules."""
        container = getattr(request.app.state, "services", None)
        identity = None
        session_token = request.cookies.get(runtime_settings.session_cookie_name)
        if container is not None and session_token:
            identity = await run_in_threadpool(
                container.auth.resolve,
                session_token,
            )
        request.state.session_identity = identity
        if (
            runtime_settings.cloud_mode
            and runtime_settings.auth_required
            and _is_private_api_path(request.url.path)
            and identity is None
        ):
            return error_response(
                request,
                401,
                "authentication_required",
                "Sign in with GitHub or enter the seeded demonstration.",
            )
        if (
            identity is not None
            and identity.user.is_demo
            and _is_private_api_path(request.url.path)
            and request.method not in {"GET", "HEAD", "OPTIONS"}
        ):
            return error_response(
                request,
                403,
                "demo_read_only",
                "This seeded demonstration is read-only. Sign in with GitHub to save progress.",
            )
        if (
            identity is not None
            and not identity.user.is_demo
            and _is_private_api_path(request.url.path)
            and request.method not in {"GET", "HEAD", "OPTIONS"}
            and not _csrf_valid(request, identity.csrf_hash, runtime_settings)
        ):
            return error_response(
                request,
                403,
                "csrf_validation_failed",
                "The request origin or CSRF token could not be verified.",
            )
        if (
            runtime_settings.cloud_mode
            and identity is not None
            and not identity.user.is_demo
            and _is_private_api_path(request.url.path)
            and request.method not in {"GET", "HEAD", "OPTIONS"}
        ):
            allowed, retry_after = authenticated_write_limiter.allow(identity.user.id)
            if not allowed:
                response = error_response(
                    request,
                    429,
                    "write_rate_limit_exceeded",
                    "Too many authenticated mutations. Retry after the indicated delay.",
                )
                response.headers["Retry-After"] = str(retry_after)
                return response
        return await call_next(request)

    # Registration order is deliberate: request ID/logging is outermost, then CORS,
    # endpoint auth limits, request-body limits, and finally session/database work.
    app.add_middleware(BaseHTTPMiddleware, dispatch=authorization_middleware)
    app.add_middleware(
        RequestBodyLimitMiddleware,
        default_limit=runtime_settings.max_request_body_bytes,
        route_limits={
            f"{API_PREFIX}/audio/stt": runtime_settings.max_audio_upload_body_bytes,
            (f"{API_PREFIX}/connectors/ics/preview"): runtime_settings.max_ics_upload_body_bytes,
        },
    )
    app.add_middleware(
        AuthRateLimitMiddleware,
        client_requests_per_window=(runtime_settings.auth_client_rate_limit_requests),
        global_requests_per_window=(runtime_settings.auth_global_rate_limit_requests),
        window_seconds=runtime_settings.auth_rate_limit_window_seconds,
        client_key_mode=runtime_settings.trusted_proxy_mode,
        max_client_keys=runtime_settings.auth_rate_limit_max_client_keys,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(runtime_settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID", "X-CSRF-Token"],
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next: Any) -> Any:
        """Enforce cloud access and emit one privacy-safe structured request event."""
        started = time.perf_counter()
        supplied_request_id = request.headers.get("X-Request-ID", "")
        request_id = (
            supplied_request_id
            if supplied_request_id.isascii()
            and supplied_request_id.replace("-", "").replace("_", "").isalnum()
            and len(supplied_request_id) <= 100
            else uuid4().hex
        )
        request.state.request_id = request_id
        response = await call_next(request)
        identity = getattr(request.state, "session_identity", None)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=(self)"
        response.headers["Content-Security-Policy"] = (
            DOCS_CONTENT_SECURITY_POLICY
            if request.url.path == f"{API_PREFIX}/docs"
            else APP_CONTENT_SECURITY_POLICY
        )
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        if (
            request.url.path.startswith(f"{API_PREFIX}/")
            or request.url.path in NO_STORE_OPERATIONAL_PATHS
        ):
            response.headers["Cache-Control"] = "no-store"
        if runtime_settings.app_env == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        duration_ms = round((time.perf_counter() - started) * 1000, 3)
        route = request.scope.get("route")
        route_path = getattr(route, "path", request.url.path)
        LOGGER.info(
            "HTTP request completed",
            extra={
                "event": "http.request.completed",
                "request_id": request_id,
                "method": request.method,
                "route": route_path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "version": __version__,
                "commit": runtime_settings.build_commit,
                "environment": runtime_settings.app_env,
                "user_hash": privacy_user_hash(
                    identity.user.id if identity else None,
                    runtime_settings.session_secret or "local-development",
                ),
            },
        )
        return response

    register_error_handlers(app, runtime_settings)
    register_routes(app)
    register_frontend(app, runtime_settings.frontend_dist)
    return app


def services(request: Request) -> Services:
    """Read the initialized service container.

    Args:
        request: Current HTTP request.

    Returns:
        Service container.

    Raises:
        RuntimeError: If lifespan initialization did not run.

    Example:
        Used by all endpoint handlers.
    """
    container = getattr(request.app.state, "services", None)
    if container is None:
        raise RuntimeError("Application services are not initialized")
    return cast(Services, container)


def repository_for(
    request: Request,
) -> LearningRepository | CloudLearningRepository:
    """Return the local repository or one authenticated PostgreSQL tenant adapter."""
    container = services(request)
    identity = getattr(request.state, "session_identity", None)
    if container.settings.cloud_mode and identity is not None:
        return CloudLearningRepository(
            container.cloud_store,
            identity.user.id,
            identity.user.display_name,
            seed_demo=identity.user.is_demo,
        )
    return container.repository


def _production_cloud_feature_allowed(
    request: Request,
    feature: Literal["cloud_ai", "google_connectors"],
) -> bool:
    """Apply identity allowlists only to the public production-cloud boundary."""
    container = services(request)
    settings = container.settings
    if settings.app_env != "production" or not settings.cloud_mode:
        return True
    identity = getattr(request.state, "session_identity", None)
    if identity is None or identity.user.is_demo:
        return False
    if feature == "cloud_ai":
        return settings.allows_cloud_ai(identity.user.login, identity.user.provider_user_id)
    return settings.allows_google_connectors(identity.user.login, identity.user.provider_user_id)


def _require_production_cloud_feature(
    request: Request,
    feature: Literal["cloud_ai", "google_connectors"],
) -> None:
    """Fail closed before any cost-bearing or credentialed provider operation."""
    if _production_cloud_feature_allowed(request, feature):
        return
    label = "Cloud AI" if feature == "cloud_ai" else "Google connector"
    raise CloudFeatureForbiddenError(f"{label} access is disabled for this production identity.")


def _is_private_api_path(path: str) -> bool:
    """Identify learner API routes while leaving auth and operational probes public."""
    if not path.startswith(f"{API_PREFIX}/"):
        return False
    public_prefixes = (
        f"{API_PREFIX}/auth/",
        f"{API_PREFIX}/health",
        f"{API_PREFIX}/version",
        f"{API_PREFIX}/docs",
        f"{API_PREFIX}/openapi.json",
    )
    return not path.startswith(public_prefixes)


def _csrf_valid(request: Request, expected_hash: str, settings: Settings) -> bool:
    """Verify same-origin mutations or a double-submit token fallback."""
    origin = request.headers.get("Origin")
    if origin:
        return origin.rstrip("/") in settings.allowed_origins
    cookie_token = request.cookies.get("ivrit_csrf", "")
    header_token = request.headers.get("X-CSRF-Token", "")
    if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
        return False
    return hmac.compare_digest(bearer_hash(header_token, settings.session_secret), expected_hash)


def _require_safe_auth_post(
    request: Request,
    settings: Settings,
    *,
    require_session_csrf: bool,
) -> None:
    """Reject simple-form and cross-site auth POSTs before session rotation."""
    content_type = request.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
    if content_type != "application/json":
        raise AuthRequestSafetyError("Authentication POST requests require application/json.")
    origin = request.headers.get("Origin")
    if origin and origin.rstrip("/") not in settings.allowed_origins:
        raise AuthRequestSafetyError("Authentication POST origin is not allowed.")
    fetch_site = request.headers.get("Sec-Fetch-Site", "").strip().lower()
    if fetch_site and fetch_site != "same-origin":
        raise AuthRequestSafetyError("Authentication POST Fetch Metadata is not same-origin.")
    identity = getattr(request.state, "session_identity", None)
    if (
        require_session_csrf
        and identity is not None
        and not _csrf_valid(request, identity.csrf_hash, settings)
    ):
        raise AuthRequestSafetyError(
            "The existing session requires valid same-origin CSRF verification."
        )


def _set_session_cookies(response: Any, grant: Any, settings: Settings) -> None:
    """Set hardened session and double-submit CSRF cookies."""
    response.set_cookie(
        settings.session_cookie_name,
        grant.token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        "ivrit_csrf",
        grant.csrf_token,
        max_age=settings.session_ttl_seconds,
        httponly=False,
        secure=settings.session_cookie_secure,
        samesite="strict",
        path="/",
    )


def _clear_session_cookies(response: Any, settings: Settings) -> None:
    """Remove both browser credentials during logout or rotation."""
    response.delete_cookie(
        settings.session_cookie_name,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )
    response.delete_cookie(
        "ivrit_csrf",
        httponly=False,
        secure=settings.session_cookie_secure,
        samesite="strict",
        path="/",
    )


def _clear_oauth_state_cookie(response: Any, settings: Settings) -> None:
    """Remove the short-lived browser OAuth binding after success or cancellation."""
    response.delete_cookie(
        "ivrit_oauth_state",
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="lax",
        path=f"{API_PREFIX}/auth/github/callback",
    )


def _local_auth_payload() -> dict[str, Any]:
    """Represent legacy local-first mode as a writable device-local identity."""
    return {
        "authenticated": True,
        "demo": False,
        "read_only": False,
        "user": {
            "id": "local-device",
            "display_name": "Local learner",
            "avatar_url": None,
            "login": None,
        },
        "mode": "local",
        "capabilities": {
            "cloud_learning": False,
            "ai": True,
            "audio_scoring": True,
            "connectors": True,
            "local_first": True,
        },
    }


def register_routes(app: FastAPI) -> None:
    """Register all versioned API routes.

    Args:
        app: FastAPI application.

    Returns:
        None.

    Example:
        Called exactly once by `create_app`.
    """

    @app.get(f"{API_PREFIX}/auth/me")
    def auth_me(request: Request) -> dict[str, Any]:
        if not services(request).settings.cloud_mode:
            return _local_auth_payload()
        return auth_payload(getattr(request.state, "session_identity", None))

    @app.get(f"{API_PREFIX}/auth/github/start")
    def auth_github_start(
        request: Request,
        next_path: str = Query(default="/", alias="next", max_length=500),
    ) -> Any:
        container = services(request)
        state, authorize_url = container.auth.start_github(next_path)
        if "application/json" in request.headers.get("Accept", ""):
            response: Any = JSONResponse({"authorize_url": authorize_url})
        else:
            response = RedirectResponse(authorize_url, status_code=302)
        response.set_cookie(
            "ivrit_oauth_state",
            state,
            max_age=600,
            httponly=True,
            secure=container.settings.session_cookie_secure,
            samesite="lax",
            path=f"{API_PREFIX}/auth/github/callback",
        )
        return response

    @app.get(f"{API_PREFIX}/auth/github/callback")
    def auth_github_callback(
        request: Request,
        state: str = Query(min_length=1, max_length=500),
        code: str | None = Query(default=None, min_length=1, max_length=500),
        error: str | None = Query(default=None, min_length=1, max_length=100),
    ) -> Any:
        container = services(request)
        browser_state = request.cookies.get("ivrit_oauth_state")
        if error is not None:
            redirect_path = container.auth.cancel_github(state, browser_state)
            response = RedirectResponse(redirect_path, status_code=303)
            _clear_oauth_state_cookie(response, container.settings)
            return response
        if code is None:
            raise AuthenticationError("GitHub did not return an authorization code")
        grant, redirect_path = container.auth.finish_github(
            code,
            state,
            browser_state,
        )
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = RedirectResponse(redirect_path, status_code=303)
        _clear_oauth_state_cookie(response, container.settings)
        _set_session_cookies(response, grant, container.settings)
        return response

    @app.post(f"{API_PREFIX}/auth/demo")
    def auth_demo(request: Request) -> Any:
        container = services(request)
        _require_safe_auth_post(request, container.settings, require_session_csrf=False)
        grant = container.auth.start_demo()
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = JSONResponse(auth_payload(grant.identity))
        _set_session_cookies(response, grant, container.settings)
        return response

    @app.post(f"{API_PREFIX}/auth/logout")
    def auth_logout(request: Request) -> Any:
        container = services(request)
        _require_safe_auth_post(request, container.settings, require_session_csrf=True)
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = JSONResponse(
            _local_auth_payload() if not container.settings.cloud_mode else auth_payload(None)
        )
        _clear_session_cookies(response, container.settings)
        return response

    async def live_payload(request: Request) -> dict[str, Any]:
        return {
            "status": "alive",
            "version": __version__,
            "commit": services(request).settings.build_commit,
            "request_id": request.state.request_id,
        }

    def ready_payload(request: Request) -> Any:
        container = services(request)
        try:
            dictionary_ready = container.dictionary.stats()["entries"] >= 0
        except sqlite3.Error:
            dictionary_ready = False
        database_ready = container.cloud_store.ready() if container.settings.cloud_mode else True
        ready = dictionary_ready and database_ready
        return JSONResponse(
            status_code=200 if ready else 503,
            content={
                "status": "ready" if ready else "not_ready",
                "version": __version__,
                "checks": {
                    "dictionary": dictionary_ready,
                    "postgresql": database_ready
                    if container.settings.cloud_mode
                    else "not_configured",
                },
                "request_id": request.state.request_id,
            },
        )

    async def version_payload(request: Request) -> dict[str, Any]:
        container = services(request)
        return {
            "name": "Ivrit Sheli",
            "version": __version__,
            "commit": container.settings.build_commit,
            "environment": container.settings.app_env,
            "storage": "postgresql" if container.settings.cloud_mode else "sqlite",
        }

    app.add_api_route("/health/live", live_payload, methods=["GET"], tags=["operations"])
    app.add_api_route("/health/ready", ready_payload, methods=["GET"], tags=["operations"])
    app.add_api_route("/version", version_payload, methods=["GET"], tags=["operations"])
    app.add_api_route(
        f"{API_PREFIX}/health/live", live_payload, methods=["GET"], tags=["operations"]
    )
    app.add_api_route(
        f"{API_PREFIX}/health/ready", ready_payload, methods=["GET"], tags=["operations"]
    )
    app.add_api_route(
        f"{API_PREFIX}/version", version_payload, methods=["GET"], tags=["operations"]
    )

    @app.get(f"{API_PREFIX}/health")
    def health(request: Request) -> dict[str, Any]:
        container = services(request)
        return {
            "status": "ok",
            "version": __version__,
            "environment": container.settings.app_env,
            "ai_provider": container.settings.ai_provider,
            "cloud_processing_enabled": container.settings.allow_cloud_processing,
            "dictionary": container.dictionary.stats(),
            "request_id": request.state.request_id,
        }

    @app.get(f"{API_PREFIX}/dashboard")
    def dashboard(request: Request) -> dict[str, Any]:
        payload = repository_for(request).dashboard()
        payload["dictionary"] = services(request).dictionary.stats()
        payload["system"] = {
            "offline_ready": not services(request).settings.cloud_mode,
            "cloud_available": bool(
                services(request).settings.allow_cloud_processing
                and services(request).settings.openai_api_key
                and _production_cloud_feature_allowed(request, "cloud_ai")
            ),
        }
        return payload

    @app.get(f"{API_PREFIX}/profile")
    def get_profile(request: Request) -> dict[str, Any]:
        return repository_for(request).get_profile()

    @app.put(f"{API_PREFIX}/profile")
    def update_profile(request: Request, payload: ProfilePayload) -> dict[str, Any]:
        return repository_for(request).update_profile(payload.model_dump(exclude_none=True))

    @app.get(f"{API_PREFIX}/items")
    def list_items(
        request: Request,
        q: str = Query(default="", max_length=500),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> dict[str, Any]:
        return {"items": repository_for(request).list_items(limit, q)}

    @app.get(f"{API_PREFIX}/items/{{item_id}}")
    def get_item(request: Request, item_id: int) -> dict[str, Any]:
        return repository_for(request).get_item(item_id)

    @app.post(f"{API_PREFIX}/items", status_code=201)
    def create_item(request: Request, payload: LearningItemPayload) -> dict[str, Any]:
        return repository_for(request).create_item(payload.model_dump())

    @app.get(f"{API_PREFIX}/reviews/next")
    def next_reviews(
        request: Request, limit: int = Query(default=10, ge=1, le=100)
    ) -> dict[str, Any]:
        return {"items": repository_for(request).next_reviews(limit)}

    @app.post(f"{API_PREFIX}/reviews/{{item_id}}")
    def submit_review(request: Request, item_id: int, payload: ReviewPayload) -> dict[str, Any]:
        return repository_for(request).submit_review(item_id, payload.model_dump())

    @app.get(f"{API_PREFIX}/recommendations")
    def recommendations(
        request: Request, limit: int = Query(default=8, ge=1, le=50)
    ) -> dict[str, Any]:
        return {"recommendations": repository_for(request).recommendations(limit)}

    @app.get(f"{API_PREFIX}/progress")
    def progress(request: Request) -> dict[str, Any]:
        return repository_for(request).progress()

    @app.get(f"{API_PREFIX}/dictionary/search")
    def dictionary_search(
        request: Request,
        q: str = Query(min_length=1, max_length=500),
        limit: int = Query(default=20, ge=1, le=100),
    ) -> dict[str, Any]:
        results = services(request).dictionary.search(q, limit)
        repository = repository_for(request)
        if not isinstance(repository, CloudLearningRepository) or not repository.seed_demo:
            repository.log_event(
                "dictionary_lookup",
                entity_type="dictionary_query",
                entity_id=q[:100],
                payload={"result_count": len(results)},
                xp_action=XPAction.DICTIONARY_EXPLORE,
            )
        return {"query": q, "results": results}

    @app.get(f"{API_PREFIX}/dictionary/lookup")
    def dictionary_lookup(
        request: Request,
        word: str = Query(min_length=1, max_length=500),
    ) -> dict[str, Any]:
        results = services(request).dictionary.lookup(word)
        repository = repository_for(request)
        if not isinstance(repository, CloudLearningRepository) or not repository.seed_demo:
            repository.log_event(
                "dictionary_lookup",
                entity_type="dictionary_word",
                entity_id=word[:100],
                payload={"result_count": len(results)},
                xp_action=XPAction.DICTIONARY_EXPLORE,
            )
        return {"word": word, "results": results}

    @app.get(f"{API_PREFIX}/dictionary/entries/{{entry_id}}")
    def dictionary_entry(request: Request, entry_id: int) -> dict[str, Any]:
        return services(request).dictionary.get(entry_id)

    @app.get(f"{API_PREFIX}/dictionary/stats")
    def dictionary_stats(request: Request) -> dict[str, Any]:
        return services(request).dictionary.stats()

    @app.post(f"{API_PREFIX}/dictionary/{{entry_id}}/learn", status_code=201)
    def learn_dictionary_entry(request: Request, entry_id: int) -> dict[str, Any]:
        card = services(request).dictionary.get(entry_id)
        first_sense = card["senses"][0] if card["senses"] else {}
        return repository_for(request).create_item(
            {
                "hebrew_text": card["word"],
                "hebrew_with_niqqud": card["display_niqqud"],
                "transliteration": card.get("romanization"),
                "translation_en": first_sense.get("gloss_en"),
                "translation_es": first_sense.get("gloss_es"),
                "item_type": card.get("pos") or "word",
                "root": card.get("root"),
                "binyan": card.get("binyan"),
                "grammatical_gender": card.get("gender"),
                "source_label": f"dictionary:{entry_id}",
                "priority": 0.65,
            }
        )

    ai_routes = {
        "analyze": "analyze",
        "correct": "correct",
        "exercises": "exercises",
        "dialogue": "dialogue",
        "roleplay": "roleplay",
        "weekly-plan": "weekly_plan",
        "enrich-item": "enrich_item",
        "mission": "mission",
        "niqqud": "niqqud",
        "transliteration": "transliteration",
    }

    def make_ai_handler(task_name: str) -> Any:
        """Create an endpoint closure for one structured AI task."""

        def handler(request: Request, body: AITaskPayload) -> dict[str, Any]:
            if body.cloud_requested:
                _require_production_cloud_feature(request, "cloud_ai")
            repository = repository_for(request)
            context = {**profile_ai_context(repository), **body.learner_context}
            if isinstance(repository, CloudLearningRepository):
                return repository.run_with_database(
                    lambda database: AIEngine(services(request).settings, database).run(
                        task_name,
                        body.payload,
                        context,
                        cloud_requested=body.cloud_requested,
                    ),
                    write=True,
                )
            return services(request).ai.run(
                task_name, body.payload, context, cloud_requested=body.cloud_requested
            )

        return handler

    for route_name, task_name in ai_routes.items():
        app.add_api_route(
            f"{API_PREFIX}/ai/{route_name}",
            make_ai_handler(task_name),
            methods=["POST"],
            name=f"ai_{task_name}",
        )

    @app.post(f"{API_PREFIX}/audio/tts")
    def tts(request: Request, payload: TTSPayload) -> dict[str, Any]:
        if payload.cloud_requested:
            _require_production_cloud_feature(request, "cloud_ai")
        repository = repository_for(request)
        if isinstance(repository, CloudLearningRepository):
            if payload.retain:
                raise ValueError(
                    "Cloud audio retention is disabled; generated audio stays in the response only"
                )
            return repository.run_with_database(
                lambda database: AudioService(services(request).settings, database).tts(
                    payload.text,
                    cloud_requested=payload.cloud_requested,
                    voice=payload.voice,
                    retain=False,
                ),
                write=False,
            )
        return services(request).audio.tts(
            payload.text,
            cloud_requested=payload.cloud_requested,
            voice=payload.voice,
            retain=payload.retain,
        )

    @app.post(f"{API_PREFIX}/audio/stt")
    def stt(
        request: Request,
        file: Annotated[UploadFile, File()],
        cloud_requested: Annotated[bool, Query()] = False,
        language: Annotated[str, Query(max_length=10)] = "he",
    ) -> dict[str, Any]:
        if cloud_requested:
            _require_production_cloud_feature(request, "cloud_ai")
        suffix = Path(file.filename or "recording.webm").suffix.lower() or ".webm"
        temporary = (
            services(request).settings.data_dir / "private" / f"upload-{uuid4().hex}{suffix}"
        )
        written = 0
        try:
            with temporary.open("wb") as handle:
                while chunk := file.file.read(1024 * 1024):
                    written += len(chunk)
                    if written > MAX_AUDIO_BYTES:
                        raise ValueError("Audio upload exceeds 25 MB")
                    handle.write(chunk)
            repository = repository_for(request)
            if isinstance(repository, CloudLearningRepository):
                return repository.run_with_database(
                    lambda database: AudioService(services(request).settings, database).transcribe(
                        temporary,
                        cloud_requested=cloud_requested,
                        language=language,
                        delete_after=True,
                    ),
                    write=False,
                )
            return services(request).audio.transcribe(
                temporary, cloud_requested=cloud_requested, language=language, delete_after=True
            )
        finally:
            temporary.unlink(missing_ok=True)
            file.file.close()

    @app.post(f"{API_PREFIX}/audio/pronunciation-score")
    def pronunciation_score(request: Request, payload: PronunciationPayload) -> dict[str, Any]:
        repository = repository_for(request)
        if isinstance(repository, CloudLearningRepository):
            return repository.run_with_database(
                lambda database: AudioService(services(request).settings, database).score(
                    payload.target_text,
                    payload.transcript,
                    item_id=payload.item_id,
                    provider=payload.provider,
                ),
                write=True,
            )
        return services(request).audio.score(
            payload.target_text,
            payload.transcript,
            item_id=payload.item_id,
            provider=payload.provider,
        )

    @app.get(f"{API_PREFIX}/gamification/status")
    def gamification_status(request: Request) -> dict[str, Any]:
        return repository_for(request).gamification_status()

    @app.get(f"{API_PREFIX}/achievements")
    def achievements(request: Request) -> dict[str, Any]:
        return {"achievements": repository_for(request).gamification_status()["achievements"]}

    @app.post(f"{API_PREFIX}/missions", status_code=201)
    def create_mission(request: Request, payload: MissionPayload) -> dict[str, Any]:
        return repository_for(request).create_mission(payload.model_dump())

    @app.post(f"{API_PREFIX}/missions/{{mission_id}}/complete")
    def complete_mission(
        request: Request, mission_id: int, payload: MissionCompletionPayload
    ) -> dict[str, Any]:
        return repository_for(request).complete_mission(mission_id, payload.model_dump())

    @app.get(f"{API_PREFIX}/connectors")
    def connector_states(request: Request) -> dict[str, Any]:
        repository = repository_for(request)
        if isinstance(repository, CloudLearningRepository):
            states = repository.run_with_database(
                lambda database: ConnectorService(services(request).settings, database).states(),
                write=False,
            )
            return {"connectors": states}
        return {"connectors": services(request).connectors.states()}

    @app.post(f"{API_PREFIX}/connectors/ics/preview")
    def preview_ics(request: Request, file: Annotated[UploadFile, File()]) -> dict[str, Any]:
        temporary = services(request).settings.data_dir / "private" / f"calendar-{uuid4().hex}.ics"
        written = 0
        try:
            with temporary.open("wb") as handle:
                while chunk := file.file.read(512 * 1024):
                    written += len(chunk)
                    if written > 5 * 1024 * 1024:
                        raise ValueError("ICS preview is limited to 5 MB")
                    handle.write(chunk)
            repository = repository_for(request)
            if isinstance(repository, CloudLearningRepository):
                previews = repository.run_with_database(
                    lambda database: ConnectorService(
                        services(request).settings, database
                    ).preview_ics(temporary),
                    write=True,
                )
            else:
                previews = services(request).connectors.preview_ics(temporary)
            return {"previews": [preview_to_dict(item) for item in previews]}
        finally:
            temporary.unlink(missing_ok=True)
            file.file.close()

    @app.post(f"{API_PREFIX}/connectors/google/preview")
    def preview_google(request: Request, payload: GooglePreviewPayload) -> dict[str, Any]:
        _require_production_cloud_feature(request, "google_connectors")
        repository = repository_for(request)
        if isinstance(repository, CloudLearningRepository):
            previews = repository.run_with_database(
                lambda database: ConnectorService(
                    services(request).settings, database
                ).preview_google(payload.service, payload.resource_id),
                write=True,
            )
        else:
            previews = services(request).connectors.preview_google(
                payload.service, payload.resource_id
            )
        return {"previews": [preview_to_dict(item) for item in previews]}

    @app.post(f"{API_PREFIX}/connectors/import", status_code=201)
    def import_connector_phrases(
        request: Request, payload: ConnectorImportPayload
    ) -> dict[str, Any]:
        item_payloads: list[dict[str, Any]] = []
        for phrase in payload.phrases:
            hebrew = phrase.hebrew.strip()
            if not hebrew:
                continue
            item_payloads.append(
                {
                    "hebrew_text": hebrew,
                    "translation_en": phrase.en,
                    "translation_es": phrase.es,
                    "context_label": payload.context_label,
                    "source_label": f"connector:{payload.source}",
                    "priority": 0.72,
                }
            )
        if not item_payloads:
            return {"created": [], "count": 0}
        repository = repository_for(request)
        created = (
            repository.create_items(item_payloads)
            if isinstance(repository, CloudLearningRepository)
            else [repository.create_item(item) for item in item_payloads]
        )
        return {"created": created, "count": len(created)}

    @app.post(f"{API_PREFIX}/bug-reports", status_code=201)
    def create_bug_report(request: Request, payload: BugReportPayload) -> dict[str, Any]:
        data = payload.model_dump()
        data["request_id"] = data.get("request_id") or request.state.request_id
        data["diagnostics"] = limited_diagnostics(data.get("diagnostics") or {})
        return repository_for(request).create_bug_report(data)

    @app.get(f"{API_PREFIX}/export")
    def export_data(request: Request) -> FileResponse:
        destination = (
            services(request).settings.data_dir
            / "backups"
            / f"ivrit-sheli-export-{uuid4().hex[:8]}.json"
        )
        repository_for(request).export_json(destination)
        background = (
            BackgroundTask(destination.unlink, missing_ok=True)
            if services(request).settings.cloud_mode
            else None
        )
        return FileResponse(
            destination,
            media_type="application/json",
            filename="ivrit-sheli-export.json",
            background=background,
        )


def register_error_handlers(app: FastAPI, settings: Settings) -> None:
    """Install consistent, request-ID-aware JSON error responses.

    Args:
        app: FastAPI application.
        settings: Runtime debug policy.

    Returns:
        None.

    Example:
        Called by `create_app`.
    """

    @app.exception_handler(KeyError)
    async def key_error(request: Request, error: KeyError) -> JSONResponse:
        return error_response(request, 404, "not_found", str(error).strip("'"))

    @app.exception_handler(ValueError)
    async def value_error(request: Request, error: ValueError) -> JSONResponse:
        return error_response(request, 400, "invalid_request", str(error))

    @app.exception_handler(CloudSnapshotLimitError)
    async def cloud_snapshot_limit_error(
        request: Request, error: CloudSnapshotLimitError
    ) -> JSONResponse:
        return error_response(
            request,
            413,
            "cloud_snapshot_limit_exceeded",
            str(error),
        )

    @app.exception_handler(RequestBodyTooLarge)
    async def request_body_too_large(request: Request, _error: RequestBodyTooLarge) -> JSONResponse:
        return error_response(
            request,
            413,
            "request_body_too_large",
            "Request body exceeds the configured limit for this route.",
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
        details = [
            {
                "field": ".".join(str(part) for part in item["loc"]),
                "message": item["msg"],
            }
            for item in error.errors()[:20]
        ]
        return error_response(
            request,
            422,
            "validation_error",
            "Request validation failed",
            details=details,
        )

    @app.exception_handler(AuthenticationConfigurationError)
    async def auth_configuration_error(
        request: Request, error: AuthenticationConfigurationError
    ) -> JSONResponse:
        return error_response(request, 503, "auth_not_configured", str(error))

    @app.exception_handler(AuthRequestSafetyError)
    async def auth_request_safety_error(
        request: Request, error: AuthRequestSafetyError
    ) -> JSONResponse:
        return error_response(request, 403, "auth_request_forbidden", str(error))

    @app.exception_handler(AuthenticationCapacityError)
    async def authentication_capacity_error(
        request: Request, error: AuthenticationCapacityError
    ) -> JSONResponse:
        response = error_response(request, 429, "authentication_busy", str(error))
        response.headers["Retry-After"] = "60"
        return response

    @app.exception_handler(AuthenticationError)
    async def authentication_error(request: Request, error: AuthenticationError) -> JSONResponse:
        return error_response(request, 400, "authentication_failed", str(error))

    @app.exception_handler(CloudFeatureForbiddenError)
    async def cloud_feature_forbidden(
        request: Request, error: CloudFeatureForbiddenError
    ) -> JSONResponse:
        return error_response(
            request,
            403,
            "cloud_feature_not_allowed",
            str(error),
        )

    @app.exception_handler(ConnectorError)
    async def connector_error(request: Request, error: ConnectorError) -> JSONResponse:
        return error_response(request, 502, "connector_error", str(error))

    @app.exception_handler(AudioProviderError)
    async def audio_error(request: Request, error: AudioProviderError) -> JSONResponse:
        return error_response(request, 502, "audio_provider_error", str(error))

    @app.exception_handler(sqlite3.Error)
    async def database_error(request: Request, error: sqlite3.Error) -> JSONResponse:
        LOGGER.error("SQLite request failure [%s]: %s", request.state.request_id, error)
        return error_response(
            request,
            503,
            "database_unavailable",
            "Local data storage could not complete the request.",
        )

    @app.exception_handler(PostgresError)
    async def postgres_error(request: Request, error: PostgresError) -> JSONResponse:
        LOGGER.error(
            "PostgreSQL request failure",
            extra={"event": "database.postgres.failure", "request_id": request.state.request_id},
        )
        return error_response(
            request,
            503,
            "database_unavailable",
            "Cloud data storage could not complete the request.",
        )

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, error: Exception) -> JSONResponse:
        LOGGER.exception("Unexpected request failure [%s]", request.state.request_id)
        message = str(error) if settings.debug else "An unexpected error occurred."
        return error_response(request, 500, "internal_error", message)


def error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    *,
    details: list[dict[str, Any]] | None = None,
) -> JSONResponse:
    """Build the standard API error envelope.

    Args:
        request: Current request.
        status_code: HTTP status.
        code: Stable machine code.
        message: Actionable human message.
        details: Optional validation details.

    Returns:
        JSON response.

    Example:
        Used by registered exception handlers.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or [],
                "request_id": getattr(request.state, "request_id", "unknown"),
            }
        },
    )


def profile_ai_context(repository: Any) -> dict[str, Any]:
    """Build bounded learner features for a coaching task.

    Args:
        repository: Learning repository.

    Returns:
        Safe context mapping.

    Example:
        Used by all AI routes.
    """
    profile = repository.get_profile()
    progress = repository.progress()
    return {
        "hebrew_level": profile["hebrew_level"],
        "daily_minutes": profile["daily_minutes"],
        "interface_language": profile["interface_language"],
        "active_goals": [goal["goal_type"] for goal in profile["goals"] if goal["is_active"]][:10],
        "mistake_categories": [row["mistake_category"] for row in progress["mistakes"][:5]],
        "focus": (
            progress["mistakes"][0]["mistake_category"]
            if progress["mistakes"]
            else "speaking confidence"
        ),
    }


def preview_to_dict(preview: ContextPreview) -> dict[str, Any]:
    """Serialize a connector preview.

    Args:
        preview: Dataclass preview.

    Returns:
        JSON-ready mapping.

    Example:
        >>> preview_to_dict(ContextPreview("ics", "x", "daily_life", "x", (), [], {}))["source"]
        'ics'
    """
    data = asdict(preview)
    data["redactions"] = list(preview.redactions)
    return data


def limited_diagnostics(diagnostics: dict[str, Any]) -> dict[str, Any]:
    """Keep local bug diagnostics small and free of obvious secrets.

    Args:
        diagnostics: Browser-provided non-sensitive diagnostic values.

    Returns:
        Allow-listed diagnostic mapping.

    Example:
        >>> limited_diagnostics({"user_agent": "Demo", "token": "secret"})
        {'user_agent': 'Demo'}
    """
    allowed = {"user_agent", "viewport", "app_version", "online", "locale", "route"}
    return {key: str(value)[:500] for key, value in diagnostics.items() if key in allowed}


def register_frontend(app: FastAPI, frontend_dist: Path) -> None:
    """Serve the compiled React app when a production build exists.

    Args:
        app: FastAPI application.
        frontend_dist: Vite output directory.

    Returns:
        None.

    Example:
        Development uses Vite; production Docker uses this fallback.
    """
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    async def root() -> Any:
        index = frontend_dist / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse(
            {
                "name": "Ivrit Sheli Ultimate",
                "api": f"{API_PREFIX}/docs",
                "message": "Frontend is not built. Run npm install && npm run build in frontend/.",
            }
        )

    @app.get("/{path:path}", include_in_schema=False)
    async def spa_fallback(path: str) -> Any:
        # API misses must remain JSON 404s instead of returning the SPA shell.
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        candidate = frontend_dist / path
        if candidate.is_file() and frontend_dist.resolve() in candidate.resolve().parents:
            return FileResponse(candidate)
        index = frontend_dist / "index.html"
        if index.exists():
            return FileResponse(index)
        raise HTTPException(status_code=404, detail="Frontend is not built")


def configure_logging(level: str) -> None:
    """Configure structured production-safe JSON logging once.

    Args:
        level: Logging level name.

    Returns:
        None.

    Example:
        >>> configure_logging("INFO")
    """
    configure_json_logging(level)


app = create_app()
