"""
Module: FastAPI application
Purpose: Expose the complete local Hebrew-learning system through validated, observable HTTP endpoints.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import re
import sqlite3
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any, Literal, cast
from urllib.parse import quote
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from psycopg import Error as PostgresError
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.background import BackgroundTask
from starlette.concurrency import run_in_threadpool
from starlette.middleware.base import BaseHTTPMiddleware

from ivrit_sheli import __version__
from ivrit_sheli.ai_engine import AIEngine
from ivrit_sheli.api_dictionary import register_dictionary_routes
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
    AuthUser,
    CloudSnapshotLimitError,
    CloudStore,
    MemoryCloudStore,
    PostgresCloudStore,
    SessionIdentity,
    bearer_hash,
)
from ivrit_sheli.config import Settings
from ivrit_sheli.connectors import ConnectorError, ConnectorService, ContextPreview
from ivrit_sheli.database import Database
from ivrit_sheli.dictionary import DICTIONARY_SCHEMA_VERSION, DictionaryStore
from ivrit_sheli.hebrew_alphabet import AlphabetConflictError
from ivrit_sheli.learner_model import CONTEXT_KEYS
from ivrit_sheli.learning_core import (
    CefrBand,
    CurriculumTrack,
    LearningCoreConflictError,
)
from ivrit_sheli.local_learning_engine import PracticeConflictError
from ivrit_sheli.local_personal_coach import build_examples
from ivrit_sheli.normalization import hebrew_tokens, normalize_hebrew
from ivrit_sheli.push_notifications import (
    encrypt_subscription,
    endpoint_hash,
    validate_subscription,
)
from ivrit_sheli.repository import (
    MAX_PORTABLE_IMPORT_BYTES,
    LearningRepository,
)
from ivrit_sheli.request_limits import (
    AuthRateLimitMiddleware,
    RequestBodyLimitMiddleware,
    RequestBodyTooLarge,
    SlidingWindowLimiter,
)
from ivrit_sheli.speech_evidence import SpeechEvidenceSigner
from ivrit_sheli.structured_logging import configure_json_logging, privacy_user_hash
from ivrit_sheli.visual_spotlight import build_visual_spotlight

LOGGER = logging.getLogger(__name__)
API_PREFIX = "/api/v1"
MAX_TRANSCRIPT_ANALYSIS_TOKENS = 12
TRANSCRIPT_PROVENANCE_BY_PROVIDER = {
    "browser": "client_reported_browser_recognition",
    "self_hosted": "client_reported_self_hosted_transcription",
    "openai": "client_reported_cloud_transcription",
    "manual": "client_reported_manual_entry",
}
APP_CONTENT_SECURITY_POLICY = "; ".join(
    (
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        (
            "img-src 'self' data: blob: https://avatars.githubusercontent.com "
            "https://*.googleusercontent.com"
        ),
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
        (
            "img-src 'self' data: blob: https://avatars.githubusercontent.com "
            "https://*.googleusercontent.com"
        ),
        (
            "img-src 'self' data: blob: https://avatars.githubusercontent.com "
            "https://*.googleusercontent.com "
            "https://fastapi.tiangolo.com"
        ),
    )
)
NO_STORE_OPERATIONAL_PATHS = frozenset({"/health/live", "/health/ready", "/version"})
DEMO_SAFE_POST_PATHS = frozenset(
    {
        f"{API_PREFIX}/audio/transcript-analysis",
        f"{API_PREFIX}/audio/word-analysis",
    }
)


class CloudFeatureForbiddenError(RuntimeError):
    """Raised when a production-cloud identity is outside a provider allowlist."""


class CloudConsentRequiredError(RuntimeError):
    """Raised when a learner requests cloud processing without stored consent."""


class AuthRequestSafetyError(RuntimeError):
    """Raised when an auth POST does not meet the browser CSRF boundary."""


class StrictModel(BaseModel):
    """Base request model that rejects misspelled fields."""

    model_config = ConfigDict(extra="forbid")


class AccountDeletionPayload(StrictModel):
    """Explicit destructive-action confirmation for cloud account deletion."""

    confirm: Literal[True]


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

    @field_validator("source_label")
    @classmethod
    def reserve_server_source_labels(cls, value: str) -> str:
        """Keep trusted provenance namespaces under server control."""
        normalized = value.strip()
        lowered = normalized.casefold()
        reserved_prefixes = ("dictionary:", "connector:", "system:", "seed:")
        if not normalized:
            raise ValueError("source_label must not be blank")
        if lowered == "starter_pack" or lowered.startswith(reserved_prefixes):
            raise ValueError("source_label uses a server-reserved provenance namespace")
        return normalized


class ReviewPayload(StrictModel):
    """Validated adaptive review submission."""

    is_correct: bool
    confidence: int = Field(default=3, ge=1, le=5)
    response_ms: int = Field(default=0, ge=0, le=3_600_000)
    hints_used: int = Field(default=0, ge=0, le=100)
    modality: Literal[
        "recognition",
        "production",
        "listening",
        "speaking",
        "pointed_reading",
        "unpointed_reading",
        "contextual_transfer",
    ] = "recognition"
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
    onboarding_step: int | None = Field(default=None, ge=0, le=4)
    onboarding_completed: bool | None = None
    guided_mode: bool | None = None
    learner_mode: Literal["guided", "explorer", "experienced"] | None = None
    first_steps_step: int | None = Field(default=None, ge=0, le=5)
    first_steps_completed: bool | None = None
    curriculum_track: CurriculumTrack | None = None
    cefr_band: CefrBand | None = None
    text_scale: float | None = Field(default=None, ge=0.8, le=2.0)
    focus_status: Literal["available", "busy"] | None = None
    # No min_length: "" is how a learner clears the avatar she picked.
    avatar_preset_id: str | None = Field(default=None, max_length=64)
    goals: list[dict[str, Any]] | None = None


class LearningCoreAttemptPayload(StrictModel):
    """Evidence submitted for the current server-selected learning-core activity."""

    item_id: int = Field(ge=1)
    activity_token: str = Field(min_length=64, max_length=64, pattern=r"^[a-f0-9]{64}$")
    idempotency_key: str = Field(
        min_length=8,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:-]+$",
    )
    is_correct: bool
    confidence: int = Field(default=3, ge=1, le=5)
    response_ms: int = Field(default=0, ge=0, le=3_600_000)
    hints_used: int = Field(default=0, ge=0, le=100)
    answer_text: str | None = Field(default=None, max_length=10_000)


class PracticeStepPayload(StrictModel):
    """Validated evidence for the current server-owned daily-practice step."""

    idempotency_key: str = Field(
        min_length=8,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:-]+$",
    )
    outcome: Literal["completed", "failed", "unsupported"]
    is_correct: bool | None = None
    confidence: int | None = Field(default=None, ge=1, le=5)
    response_ms: int = Field(default=0, ge=0, le=3_600_000)
    hints_used: int = Field(default=0, ge=0, le=100)
    answer_text: str | None = Field(default=None, max_length=10_000)
    transcript: str | None = Field(default=None, max_length=10_000)
    unsupported_reason: str | None = Field(default=None, max_length=100)


class AlphabetAttemptPayload(StrictModel):
    """One answer to the current server-owned alphabet activity."""

    activity_token: str = Field(
        min_length=64,
        max_length=64,
        pattern=r"^[a-f0-9]{64}$",
    )
    idempotency_key: str = Field(
        min_length=8,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:-]+$",
    )
    answer_key: str = Field(
        min_length=1,
        max_length=64,
        pattern=r"^[a-z_]+$",
    )
    confidence: int = Field(default=3, ge=1, le=5)
    response_ms: int = Field(default=0, ge=0, le=3_600_000)
    hints_used: int = Field(default=0, ge=0, le=100)


class AITaskPayload(StrictModel):
    """Flexible but bounded AI task request."""

    payload: dict[str, Any] = Field(default_factory=dict)
    learner_context: dict[str, Any] = Field(default_factory=dict)
    cloud_requested: bool = False


class TTSPayload(StrictModel):
    """Text-to-speech request."""

    text: str = Field(min_length=1, max_length=4000)
    cloud_requested: bool = False
    voice_style: Literal["masculine", "feminine"] = "feminine"
    retain: bool = False


class PronunciationPayload(StrictModel):
    """Transcript-based pronunciation score request."""

    target_text: str = Field(min_length=1, max_length=4000)
    transcript: str = Field(min_length=1, max_length=4000)
    item_id: int | None = Field(default=None, ge=1)
    provider: str = Field(default="browser", max_length=80)
    evidence_token: str | None = Field(default=None, min_length=20, max_length=2000)


class WordAnalysisPayload(StrictModel):
    """One transcript selected for dictionary and optional cloud enrichment."""

    transcript: str = Field(min_length=1, max_length=200)
    transcript_provider: Literal["browser", "self_hosted", "openai", "manual"] = "manual"
    cloud_requested: bool = False


class TranscriptAnalysisPayload(StrictModel):
    """A bounded transcript resolved only against exact sourced dictionary records."""

    transcript: str = Field(min_length=1, max_length=4000)
    transcript_provider: Literal["browser", "self_hosted", "openai", "manual"] = "manual"


class NotificationPreferencesPayload(StrictModel):
    """Opt-in reminder schedule with a hard maximum of one message per day."""

    enabled: bool | None = None
    preferred_time: str | None = Field(default=None, min_length=5, max_length=5)
    timezone: str | None = Field(default=None, min_length=1, max_length=100)
    quiet_hours_start: str | None = Field(default=None, min_length=5, max_length=5)
    quiet_hours_end: str | None = Field(default=None, min_length=5, max_length=5)


class PushSubscriptionKeysPayload(StrictModel):
    """Browser-generated Web Push encryption keys."""

    p256dh: str = Field(min_length=1, max_length=512)
    auth: str = Field(min_length=1, max_length=256)


class PushSubscriptionPayload(StrictModel):
    """One browser subscription; raw endpoint material is encrypted immediately."""

    endpoint: str = Field(min_length=1, max_length=2_048)
    expiration_time: float | None = Field(default=None, ge=0)
    keys: PushSubscriptionKeysPayload
    enable_reminders: bool = True


class PushSubscriptionDeletePayload(StrictModel):
    """Identify one device subscription for owner-scoped deletion."""

    endpoint: str = Field(min_length=1, max_length=2_048)


class CoachExamplesPayload(StrictModel):
    """Select a reviewed dictionary concept for deterministic personalized examples."""

    dictionary_entry_id: int | None = Field(default=None, ge=1)
    word: str | None = Field(default=None, min_length=1, max_length=200)


class LearningFeedbackPayload(StrictModel):
    """Explicit, idempotent feedback for one coach or recommendation surface."""

    feedback_key: str = Field(
        min_length=8,
        max_length=128,
        pattern=r"^[A-Za-z0-9._:-]+$",
    )
    target_type: Literal["example", "recommendation", "exercise", "coach_card"]
    target_key: str = Field(min_length=1, max_length=200)
    useful: bool | None = None
    difficulty: Literal[
        "too_easy",
        "appropriate",
        "too_difficult",
        "right",
        "too_hard",
    ] | None = None
    relevant: bool | None = None
    context: str | None = Field(default=None, max_length=40)
    pattern_id: str | None = Field(default=None, max_length=100)
    note: str | None = Field(default=None, max_length=500)


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
    speech_evidence: SpeechEvidenceSigner


def build_services(
    settings: Settings,
    cloud_store: CloudStore | None = None,
    oauth_client: OAuthClient | None = None,
    google_oauth_client: OAuthClient | None = None,
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
        auth=AuthService(
            settings,
            configured_store,
            oauth_client,
            google_oauth_client,
        ),
        speech_evidence=SpeechEvidenceSigner(settings.session_secret or None),
    )


def create_app(
    settings: Settings | None = None,
    *,
    cloud_store: CloudStore | None = None,
    oauth_client: OAuthClient | None = None,
    google_oauth_client: OAuthClient | None = None,
) -> FastAPI:
    """Create the configured FastAPI application.

    Args:
        settings: Optional settings override for tests.

    Returns:
        FastAPI application.

    Example:
        >>> app = create_app(Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"}))
        >>> app.title
        'Ivrit Sheli API'
    """
    runtime_settings = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        """Initialize and close retained local resources."""
        configure_logging(runtime_settings.log_level)
        app.state.services = build_services(
            runtime_settings,
            cloud_store,
            oauth_client,
            google_oauth_client,
        )
        stale_worker_files_deleted = await asyncio.to_thread(
            app.state.services.audio.self_hosted_provider.sweep_stale_worker_files
        )
        if stale_worker_files_deleted:
            LOGGER.info(
                "Stale private speech worker files deleted",
                extra={
                    "event": "speech.stale_workers_deleted",
                    "count": stale_worker_files_deleted,
                },
            )
        if runtime_settings.whisper_preload_on_start:
            preload_result = await asyncio.to_thread(
                app.state.services.audio.self_hosted_provider.preload
            )
            LOGGER.info(
                "Self-hosted speech model preloaded",
                extra={
                    "event": "speech.model_preloaded",
                    "model": preload_result["model"],
                    "load_latency_ms": preload_result["load_latency_ms"],
                },
            )
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
        title="Ivrit Sheli API",
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
        """Enforce auth/demo rules using Supabase JWT Bearer tokens."""
        container = getattr(request.app.state, "services", None)
        identity = None
        bearer_authenticated = False

        # 1. Try to extract Supabase Bearer token. Only when a project URL is
        #    actually configured — otherwise the feature stays off rather than
        #    reaching out to some default host.
        auth_header = request.headers.get("Authorization")
        if runtime_settings.supabase_url and auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                identity = await run_in_threadpool(
                    _resolve_supabase_bearer,
                    token,
                    runtime_settings.supabase_url,
                )
                bearer_authenticated = identity is not None
            except Exception:
                # A malformed or expired token is an ordinary event, not a fault:
                # fall through so the cookie path or the 401 below decides. Logged
                # without the token so a credential never reaches the log.
                LOGGER.info(
                    "supabase bearer token rejected",
                    extra={"path": request.url.path},
                )

        # 2. Fallback to existing cookie-based session for backward compatibility / demo mode
        if identity is None:
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
                "Sign in with Google or GitHub, or enter the seeded demonstration.",
            )
            
        if (
            identity is not None
            and identity.user.is_demo
            and _is_private_api_path(request.url.path)
            and request.method not in {"GET", "HEAD", "OPTIONS"}
            and request.url.path not in DEMO_SAFE_POST_PATHS
        ):
            return error_response(
                request,
                403,
                "demo_read_only",
                "This seeded demonstration is read-only. Sign in to save your progress.",
            )
            
        if (
            identity is not None
            and not identity.user.is_demo
            and _is_private_api_path(request.url.path)
            and request.method not in {"GET", "HEAD", "OPTIONS"}
            # A Bearer token is never attached cross-site by the browser, so it
            # carries no CSRF risk. Keying this on how the request authenticated
            # rather than on an empty csrf_hash means a caller cannot opt out of
            # the check by presenting a blank one.
            and not bearer_authenticated
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
            f"{API_PREFIX}/import": runtime_settings.max_import_upload_body_bytes,
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


def _speech_evidence_subject(request: Request) -> str:
    """Return the authenticated tenant or this local app instance as token owner."""
    identity = getattr(request.state, "session_identity", None)
    if identity is not None:
        return f"user:{identity.user.id}"
    return "local:installation"


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
        return settings.allows_cloud_ai(
            identity.user.login,
            identity.user.provider_user_id,
            provider=identity.user.provider,
        )
    return settings.allows_google_connectors(
        identity.user.login,
        identity.user.provider_user_id,
        provider=identity.user.provider,
    )


def _require_production_cloud_feature(
    request: Request,
    feature: Literal["cloud_ai", "google_connectors"],
) -> None:
    """Fail closed before any cost-bearing or credentialed provider operation."""
    if _production_cloud_feature_allowed(request, feature):
        return
    label = "Cloud AI" if feature == "cloud_ai" else "Google connector"
    raise CloudFeatureForbiddenError(f"{label} access is disabled for this production identity.")


def _require_cloud_processing_consent(
    repository: LearningRepository | CloudLearningRepository,
    operation: str,
) -> None:
    """Fail closed before learner content can leave the local application boundary."""
    profile = repository.get_profile()
    if bool(profile.get("cloud_consent", 0)):
        return
    raise CloudConsentRequiredError(
        f"Cloud processing consent is required before using {operation}. "
        "Enable it in Settings, or choose the local option."
    )


def _with_dictionary_learning_state(
    repository: LearningRepository | CloudLearningRepository,
    entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Decorate shared dictionary cards with only the current learner's item state."""
    states = repository.learning_states_for_sources(
        [f"dictionary:{int(entry['id'])}" for entry in entries if entry.get("id")]
    )
    decorated: list[dict[str, Any]] = []
    for entry in entries:
        state = states.get(f"dictionary:{int(entry['id'])}") if entry.get("id") else None
        decorated.append(
            {
                **entry,
                "learning_item_id": state["item_id"] if state else None,
                "learning_status": state["status"] if state else None,
                "learning_due_state": state["due_state"] if state else None,
            }
        )
    return decorated


def _with_coach_speaking_target(
    repository: LearningRepository | CloudLearningRepository,
    examples: dict[str, Any],
) -> dict[str, Any]:
    """Attach one exact concept target without trusting a client-supplied item link."""
    concept = cast(dict[str, Any], examples["concept"])
    target_text = str(concept.get("niqqud") or concept["hebrew"])
    source_key = str(concept.get("source_key") or "").strip() or None
    return {
        **examples,
        "speaking_target": repository.coach_speaking_target(
            target_text,
            source_label=source_key,
        ),
    }


def _dictionary_readiness(container: Services) -> dict[str, Any]:
    """Validate that the dictionary schema and learner-facing data are usable."""
    mode = "shared_cloud" if container.settings.cloud_mode else "device_local"
    details: dict[str, Any] = {
        "ready": False,
        "mode": mode,
        "required": True,
        "entries": 0,
        "senses": 0,
        "schema_version": None,
        "expected_schema_version": DICTIONARY_SCHEMA_VERSION,
    }
    try:
        stats = container.dictionary.stats()
        metadata = stats.get("metadata", {})
        schema_version = int(metadata.get("schema_version", -1))
        entries = int(stats.get("entries", 0))
        senses = int(stats.get("senses", 0))
        details.update(
            {
                "entries": entries,
                "senses": senses,
                "schema_version": schema_version,
                "ready": (
                    schema_version == DICTIONARY_SCHEMA_VERSION and entries >= 1 and senses >= 1
                ),
            }
        )
    except (KeyError, TypeError, ValueError, sqlite3.Error):
        # Readiness is intentionally fail-closed and contains no database error details.
        pass
    return details


# Supabase access tokens are signed with an asymmetric key published as a JWKS.
# HS256 must never appear beside those keys: a public key is public, so it also
# works as a guessable HMAC secret, which is the classic algorithm-confusion
# attack.
SUPABASE_JWT_ALGORITHMS = ("ES256", "RS256")


@lru_cache(maxsize=4)
def _supabase_jwk_client(jwks_url: str) -> Any:
    """Return one cached JWKS client per project.

    Building the client per request meant refetching the key set on every
    authenticated call, since its cache lives on the instance.
    """
    from jwt import PyJWKClient

    return PyJWKClient(jwks_url, cache_keys=True, lifespan=3600, timeout=8)


def _resolve_supabase_bearer(token: str, supabase_url: str) -> SessionIdentity | None:
    """Verify one Supabase access token and map it onto a session identity.

    Called through run_in_threadpool: fetching the key set is blocking network
    I/O and must not run on the event loop.
    """
    import jwt

    base = supabase_url.rstrip("/")
    signing_key = _supabase_jwk_client(
        f"{base}/auth/v1/.well-known/jwks.json"
    ).get_signing_key_from_jwt(token)
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=list(SUPABASE_JWT_ALGORITHMS),
        audience="authenticated",
        issuer=f"{base}/auth/v1",
        options={"require": ["exp", "sub"]},
    )
    user_id = payload.get("sub")
    if not user_id:
        return None
    metadata = payload.get("user_metadata") or {}
    return SessionIdentity(
        user=AuthUser(
            id=str(user_id),
            display_name=metadata.get("full_name") or metadata.get("name") or "Learner",
            provider="google",
            login=payload.get("email", ""),
        ),
        csrf_hash="",
        expires_at=datetime.fromtimestamp(int(payload["exp"]), tz=timezone.utc),
    )


# The only documents /notes/ may publish. Everything else under docs/ is
# internal and must not be reachable without authentication.
PUBLISHED_NOTES = frozenset({"LIVING_HEBREW_FIELD_NOTES.md"})


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


def _oauth_state_cookie_name(provider: Literal["github", "google"]) -> str:
    """Keep provider attempts separate while preserving the established GitHub cookie."""
    return "ivrit_oauth_state" if provider == "github" else "ivrit_google_oauth_state"


def _oauth_failure_redirect(
    settings: Settings,
    provider: Literal["github", "google"],
    reason: str,
) -> RedirectResponse:
    """Send a failed sign-in back to the application, not to a page of JSON.

    2026-08-24. A callback that raised left the learner looking at a raw error
    document at an /api/ URL: no interface, no explanation she could read, and
    no way back except typing the address again. The provider-cancelled path
    already redirected; only the failure paths did not.

    The destination is always the application root. It is never taken from the
    request, because the state that would have carried a safe redirect target
    is precisely what failed to validate.
    """
    response = RedirectResponse(f"/?auth_error={quote(reason, safe='')}", status_code=303)
    _clear_oauth_state_cookie(response, settings, provider)
    return response


def _oauth_callback_path(provider: Literal["github", "google"]) -> str:
    return f"{API_PREFIX}/auth/{provider}/callback"


def _set_oauth_state_cookie(
    response: Any,
    state: str,
    settings: Settings,
    provider: Literal["github", "google"],
) -> None:
    """Bind one short-lived browser state cookie to its provider callback path."""
    response.set_cookie(
        _oauth_state_cookie_name(provider),
        state,
        max_age=600,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path=_oauth_callback_path(provider),
    )


def _clear_oauth_state_cookie(
    response: Any,
    settings: Settings,
    provider: Literal["github", "google"],
) -> None:
    """Remove the short-lived browser OAuth binding after success or cancellation."""
    response.delete_cookie(
        _oauth_state_cookie_name(provider),
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="lax",
        path=_oauth_callback_path(provider),
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
        "auth_providers": [],
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
        container = services(request)
        if not container.settings.cloud_mode:
            return _local_auth_payload()
        return auth_payload(
            getattr(request.state, "session_identity", None),
            container.settings.auth_providers,
            container.settings.local_companion_url,
        )

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
        _set_oauth_state_cookie(response, state, container.settings, "github")
        return response

    @app.get(f"{API_PREFIX}/auth/github/callback")
    def auth_github_callback(
        request: Request,
        state: str = Query(min_length=1, max_length=500),
        code: str | None = Query(default=None, min_length=1, max_length=500),
        error: str | None = Query(default=None, min_length=1, max_length=100),
    ) -> Any:
        container = services(request)
        browser_state = request.cookies.get(_oauth_state_cookie_name("github"))
        if error is not None:
            try:
                redirect_path = container.auth.cancel_github(state, browser_state)
            except AuthenticationError:
                return _oauth_failure_redirect(container.settings, "github", "authentication_failed")
            response = RedirectResponse(redirect_path, status_code=303)
            _clear_oauth_state_cookie(response, container.settings, "github")
            return response
        if code is None:
            return _oauth_failure_redirect(container.settings, "github", "authentication_failed")
        try:
            grant, redirect_path = container.auth.finish_github(
                code,
                state,
                browser_state,
            )
        except AuthenticationError:
            return _oauth_failure_redirect(container.settings, "github", "authentication_failed")
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = RedirectResponse(redirect_path, status_code=303)
        _clear_oauth_state_cookie(response, container.settings, "github")
        _set_session_cookies(response, grant, container.settings)
        return response

    @app.get(f"{API_PREFIX}/auth/google/start")
    def auth_google_start(
        request: Request,
        next_path: str = Query(default="/", alias="next", max_length=500),
    ) -> Any:
        container = services(request)
        state, authorize_url = container.auth.start_google(next_path)
        if "application/json" in request.headers.get("Accept", ""):
            response: Any = JSONResponse({"authorize_url": authorize_url})
        else:
            response = RedirectResponse(authorize_url, status_code=302)
        _set_oauth_state_cookie(response, state, container.settings, "google")
        return response

    @app.get(f"{API_PREFIX}/auth/google/callback")
    def auth_google_callback(
        request: Request,
        state: str = Query(min_length=1, max_length=500),
        code: str | None = Query(default=None, min_length=1, max_length=500),
        error: str | None = Query(default=None, min_length=1, max_length=100),
    ) -> Any:
        container = services(request)
        browser_state = request.cookies.get(_oauth_state_cookie_name("google"))
        if error is not None:
            try:
                redirect_path = container.auth.cancel_google(state, browser_state)
            except AuthenticationError:
                # Cancelling with a stale state is not worth an error page.
                return _oauth_failure_redirect(container.settings, "google", "authentication_failed")
            response = RedirectResponse(redirect_path, status_code=303)
            _clear_oauth_state_cookie(response, container.settings, "google")
            return response
        if code is None:
            return _oauth_failure_redirect(container.settings, "google", "authentication_failed")
        try:
            grant, redirect_path = container.auth.finish_google(
                code,
                state,
                browser_state,
            )
        except AuthenticationError:
            return _oauth_failure_redirect(container.settings, "google", "authentication_failed")
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = RedirectResponse(redirect_path, status_code=303)
        _clear_oauth_state_cookie(response, container.settings, "google")
        _set_session_cookies(response, grant, container.settings)
        return response

    @app.post(f"{API_PREFIX}/auth/demo")
    def auth_demo(request: Request) -> Any:
        container = services(request)
        _require_safe_auth_post(request, container.settings, require_session_csrf=False)
        grant = container.auth.start_demo()
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = JSONResponse(
            auth_payload(
                grant.identity,
                container.settings.auth_providers,
                container.settings.local_companion_url,
            )
        )
        _set_session_cookies(response, grant, container.settings)
        return response

    @app.post(f"{API_PREFIX}/auth/logout")
    def auth_logout(request: Request) -> Any:
        container = services(request)
        _require_safe_auth_post(request, container.settings, require_session_csrf=True)
        container.auth.logout(request.cookies.get(container.settings.session_cookie_name))
        response = JSONResponse(
            _local_auth_payload()
            if not container.settings.cloud_mode
            else auth_payload(
                None,
                container.settings.auth_providers,
                container.settings.local_companion_url,
            )
        )
        _clear_session_cookies(response, container.settings)
        return response

    @app.delete(f"{API_PREFIX}/account")
    def delete_account(request: Request, _payload: AccountDeletionPayload) -> Any:
        """Permanently delete the current cloud identity and its learner workspace."""
        container = services(request)
        identity = getattr(request.state, "session_identity", None)
        if not container.settings.cloud_mode or identity is None:
            raise HTTPException(status_code=401, detail="A cloud account session is required")
        if identity.user.is_demo:
            raise HTTPException(status_code=403, detail="The shared demo cannot be deleted")
        container.cloud_store.delete_user(identity.user.id)
        response = JSONResponse(
            auth_payload(
                None,
                container.settings.auth_providers,
                container.settings.local_companion_url,
            )
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
        dictionary_check = _dictionary_readiness(container)
        dictionary_ready = bool(dictionary_check["ready"])
        database_ready = container.cloud_store.ready() if container.settings.cloud_mode else True
        speech_status = container.audio.self_hosted_provider.capabilities()["status"]
        speech_ready: bool | str = (
            speech_status == "ready"
            if container.settings.whisper_preload_on_start
            else "not_required"
        )
        ready = (
            dictionary_ready
            and database_ready
            and speech_ready is not False
        )
        return JSONResponse(
            status_code=200 if ready else 503,
            content={
                "status": "ready" if ready else "not_ready",
                "version": __version__,
                "checks": {
                    "dictionary": dictionary_ready,
                    "dictionary_details": dictionary_check,
                    "postgresql": database_ready
                    if container.settings.cloud_mode
                    else "not_configured",
                    "self_hosted_speech": speech_ready,
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
        repository = repository_for(request)
        payload = repository.dashboard()
        container = services(request)
        payload["dictionary"] = container.dictionary.stats()
        profile = payload.get("profile", {})
        today = payload.get("today", {})
        spotlight_seed = "|".join(
            (
                datetime.now(ZoneInfo("Asia/Jerusalem")).date().isoformat(),
                str(profile.get("hebrew_level", "A0")),
                str(profile.get("learner_mode", profile.get("guided_mode", "guided"))),
                str(today.get("due_reviews", 0)),
            )
        )
        recommendation_words = tuple(
            str(recommendation["label"])
            for recommendation in payload.get("recommendations", ())
            if isinstance(recommendation, dict) and recommendation.get("label")
        )
        visual_spotlight = build_visual_spotlight(
            container.dictionary,
            seed=spotlight_seed,
            preferred_words=recommendation_words,
        )
        payload["visual_spotlight"] = visual_spotlight
        payload["coach_card"] = None
        if visual_spotlight:
            try:
                concept = container.dictionary.get(
                    int(visual_spotlight[0]["entry_id"])
                )
                first_sense = concept["senses"][0] if concept.get("senses") else {}
                learner = repository.coach_learner_context()
                examples = _with_coach_speaking_target(
                    repository,
                    build_examples(
                        {
                            **concept,
                            "translation_en": first_sense.get("gloss_en"),
                            "translation_es": first_sense.get("gloss_es"),
                            "source_key": f"dictionary:{concept['id']}",
                        },
                        profile=learner,
                        dictionary_examples=concept.get("examples", []),
                        learner_state=learner["learner_state"],
                    ),
                )
                current = next(
                    example
                    for example in examples["examples"]
                    if example["band"] == "current"
                )
                payload["coach_card"] = {
                    "concept": examples["concept"],
                    "speaking_target": examples["speaking_target"],
                    "primary_action": current,
                    "suggestions": [
                        example
                        for example in examples["examples"]
                        if example["band"] != "current"
                    ][:2],
                    "reason": examples["reason"],
                    "evidence": {
                        "level": examples["evidence"]["level"],
                        "mode": examples["evidence"]["mode"],
                        "signals_used": examples["evidence"]["signals_used"],
                        "free_form_generation": False,
                    },
                    "feedback_target": {
                        "target_type": "coach_card",
                        "target_key": (
                            f"{datetime.now(ZoneInfo('Asia/Jerusalem')).date().isoformat()}:"
                            f"dictionary:{concept['id']}:{current['source_id']}"
                        ),
                        "context": (
                            current["contexts"][0]
                            if (
                                current["contexts"]
                                and current["contexts"][0] in CONTEXT_KEYS
                            )
                            else None
                        ),
                        "pattern_id": (
                            current["source_id"]
                            if current["source_kind"] == "reviewed_pattern"
                            else None
                        ),
                    },
                }
            except (KeyError, StopIteration, ValueError):
                # The dashboard remains usable if an imported dictionary entry lacks
                # the reviewed trilingual data required by the local coach.
                payload["coach_card"] = None
        payload["system"] = {
            "offline_ready": not container.settings.cloud_mode,
            "cloud_available": bool(
                container.settings.allow_cloud_processing
                and container.settings.openai_api_key
                and _production_cloud_feature_allowed(request, "cloud_ai")
            ),
        }
        return payload

    @app.get(f"{API_PREFIX}/profile")
    def get_profile(request: Request) -> dict[str, Any]:
        return repository_for(request).get_profile()

    @app.put(f"{API_PREFIX}/profile")
    def update_profile(request: Request, payload: ProfilePayload) -> dict[str, Any]:
        repository = repository_for(request)
        updated = repository.update_profile(payload.model_dump(exclude_none=True))
        identity = getattr(request.state, "session_identity", None)
        if identity is not None and not identity.user.is_demo:
            preferences = repository.notification_preferences()
            services(request).cloud_store.update_push_subscription_preferences(
                identity.user.id,
                {
                    **preferences,
                    "weekly_rest_day": updated["weekly_rest_day"],
                    "locale": updated["interface_language"],
                },
            )
        return updated

    @app.get(f"{API_PREFIX}/notifications/push/capabilities")
    def push_capabilities(request: Request) -> dict[str, Any]:
        """Expose only public Web Push configuration and truthful availability."""
        container = services(request)
        settings = container.settings
        identity = getattr(request.state, "session_identity", None)
        configured = bool(
            getattr(settings, "push_notifications_enabled", False)
            and getattr(settings, "vapid_public_key", "")
        )
        secure_origin = settings.public_base_url.startswith("https://")
        eligible_identity = bool(
            settings.cloud_mode
            and identity is not None
            and not identity.user.is_demo
        )
        available = configured and secure_origin and eligible_identity
        return {
            "available": available,
            "configured": configured,
            "secure_context_required": True,
            "secure_origin": secure_origin,
            "authenticated_account_required": True,
            "requires_opt_in": True,
            "max_daily": 1,
            "vapid_public_key": (
                getattr(settings, "vapid_public_key", "") if available else None
            ),
            "fallback": "in_app",
        }

    @app.get(f"{API_PREFIX}/notifications/preferences")
    def notification_preferences(request: Request) -> dict[str, Any]:
        """Return quiet reminder defaults without exposing device subscriptions."""
        return repository_for(request).notification_preferences()

    @app.put(f"{API_PREFIX}/notifications/preferences")
    def update_notification_preferences(
        request: Request,
        payload: NotificationPreferencesPayload,
    ) -> dict[str, Any]:
        """Persist explicit consent and synchronize cloud device schedules."""
        repository = repository_for(request)
        clean = payload.model_dump(exclude_none=True)
        if clean.get("enabled") and not push_capabilities(request)["available"]:
            raise ValueError(
                "Push reminders require an authenticated account on a configured HTTPS server"
            )
        updated = repository.update_notification_preferences(clean)
        identity = getattr(request.state, "session_identity", None)
        if identity is not None and not identity.user.is_demo:
            profile = repository.get_profile()
            services(request).cloud_store.update_push_subscription_preferences(
                identity.user.id,
                {
                    **updated,
                    "weekly_rest_day": profile["weekly_rest_day"],
                    "locale": profile["interface_language"],
                },
            )
        return updated

    @app.post(f"{API_PREFIX}/notifications/push/subscription", status_code=201)
    def subscribe_push(
        request: Request,
        payload: PushSubscriptionPayload,
    ) -> dict[str, Any]:
        """Encrypt and save one browser subscription for its authenticated owner."""
        capability = push_capabilities(request)
        if not capability["available"]:
            raise ValueError(
                "Web Push is unavailable; use in-app practice until HTTPS push is configured"
            )
        identity = getattr(request.state, "session_identity", None)
        if identity is None or identity.user.is_demo:
            raise ValueError("A personal cloud account is required for reminders")
        container = services(request)
        subscription = validate_subscription(
            {
                "endpoint": payload.endpoint,
                "expirationTime": payload.expiration_time,
                "keys": payload.keys.model_dump(),
            }
        )
        encryption_secret = container.settings.push_encryption_key
        repository = repository_for(request)
        preferences = repository.update_notification_preferences(
            {"enabled": payload.enable_reminders}
        )
        profile = repository.get_profile()
        stored = container.cloud_store.upsert_push_subscription(
            identity.user.id,
            endpoint_hash(subscription.endpoint, encryption_secret),
            encrypt_subscription(subscription, encryption_secret),
            {
                **preferences,
                "weekly_rest_day": profile["weekly_rest_day"],
                "locale": profile["interface_language"],
            },
            subscription.expiration_time,
        )
        return {
            "saved": True,
            **stored,
            "max_daily": 1,
            "audio_or_vocabulary_in_message": False,
        }

    @app.delete(f"{API_PREFIX}/notifications/push/subscription")
    def unsubscribe_push(
        request: Request,
        payload: PushSubscriptionDeletePayload,
    ) -> dict[str, Any]:
        """Remove only the requesting account's matching device subscription."""
        identity = getattr(request.state, "session_identity", None)
        if identity is None or identity.user.is_demo:
            raise ValueError("A personal cloud account is required for reminders")
        container = services(request)
        encryption_secret = container.settings.push_encryption_key
        deleted = container.cloud_store.delete_push_subscription(
            identity.user.id,
            endpoint_hash(payload.endpoint, encryption_secret),
        )
        return {"deleted": deleted}

    @app.get(f"{API_PREFIX}/learning-core")
    def learning_core_state(request: Request) -> dict[str, Any]:
        """Return the v2.6 curriculum contract and current learner state."""
        return repository_for(request).learning_core_state()

    @app.get(f"{API_PREFIX}/learning-core/next")
    def next_learning_core_activity(request: Request) -> dict[str, Any]:
        """Select one deterministic, explainable activity without mutating state."""
        return repository_for(request).next_learning_core_activity()

    @app.post(f"{API_PREFIX}/learning-core/attempt")
    def submit_learning_core_attempt(
        request: Request,
        payload: LearningCoreAttemptPayload,
    ) -> dict[str, Any]:
        """Persist learner self-report while deriving learning state server-side."""
        return repository_for(request).submit_learning_core_attempt(payload.model_dump())

    @app.get(f"{API_PREFIX}/curriculum/path")
    def curriculum_path(request: Request) -> dict[str, Any]:
        """Return the A0-A2 structured path and honestly labelled B1/B2 laboratory."""
        return repository_for(request).curriculum_path()

    @app.get(f"{API_PREFIX}/alphabet")
    def alphabet_catalog(
        request: Request,
        letter_key: str | None = Query(default=None, min_length=1, max_length=64),
    ) -> dict[str, Any]:
        """Return all reviewed forms, learner progress, and one next activity."""
        return repository_for(request).alphabet_catalog(letter_key)

    @app.post(f"{API_PREFIX}/alphabet/{{letter_key}}/attempt")
    def submit_alphabet_attempt(
        request: Request,
        letter_key: str,
        payload: AlphabetAttemptPayload,
    ) -> dict[str, Any]:
        """Grade server-side and persist one replay-safe alphabet attempt."""
        return repository_for(request).submit_alphabet_attempt(
            letter_key,
            payload.model_dump(),
        )

    @app.get(f"{API_PREFIX}/practice/today")
    def practice_today(request: Request) -> dict[str, Any]:
        """Return or create the current learner's resumable daily practice session."""
        return repository_for(request).practice_today()

    @app.post(f"{API_PREFIX}/practice/{{session_id}}/steps/{{step_key}}")
    def submit_practice_step(
        request: Request,
        session_id: str,
        step_key: str,
        payload: PracticeStepPayload,
    ) -> dict[str, Any]:
        """Persist one ordered step; an idempotency replay cannot duplicate evidence."""
        return repository_for(request).submit_practice_step(
            session_id,
            step_key,
            payload.model_dump(),
        )

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

    @app.get(f"{API_PREFIX}/registry")
    def registry_items(
        request: Request,
        q: str = Query(default="", max_length=500),
        status: Literal["all", "active", "mastered", "needs_review"] = "all",
        due: Literal["all", "due", "upcoming"] = "all",
        sort: Literal[
            "alphabetical",
            "due_asc",
            "last_activity_desc",
            "saved_asc",
            "saved_desc",
            "mastery_desc",
        ] = "last_activity_desc",
        limit: int = Query(default=200, ge=1, le=500),
        offset: int = Query(default=0, ge=0),
    ) -> dict[str, Any]:
        """Return one bounded page from the tenant-scoped saved-word registry."""
        return repository_for(request).registry_items(
            limit=limit,
            offset=offset,
            query=q,
            status=status,
            due=due,
            sort=sort,
        )

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

    @app.post(f"{API_PREFIX}/coach/examples")
    def coach_examples(
        request: Request,
        payload: CoachExamplesPayload,
    ) -> dict[str, Any]:
        """Build three reviewed examples without sending learner data to an LLM."""
        if payload.dictionary_entry_id is None and payload.word is None:
            raise ValueError("dictionary_entry_id or word is required")
        dictionary = services(request).dictionary
        if payload.dictionary_entry_id is not None:
            concept = dictionary.get(payload.dictionary_entry_id)
        else:
            matches = dictionary.lookup(str(payload.word))
            if not matches:
                raise KeyError(f"Dictionary entry not found for {payload.word}")
            concept = matches[0]
        first_sense = concept["senses"][0] if concept.get("senses") else {}
        concept_for_coach = {
            **concept,
            "translation_en": first_sense.get("gloss_en"),
            "translation_es": first_sense.get("gloss_es"),
            "source_key": f"dictionary:{concept['id']}",
        }
        learner = repository_for(request).coach_learner_context()
        return _with_coach_speaking_target(
            repository_for(request),
            build_examples(
                concept_for_coach,
                profile=learner,
                dictionary_examples=concept.get("examples", []),
                learner_state=learner["learner_state"],
            ),
        )

    @app.post(f"{API_PREFIX}/learning/feedback")
    def learning_feedback(
        request: Request,
        payload: LearningFeedbackPayload,
    ) -> dict[str, Any]:
        """Persist explicit feedback and make only one bounded learner-model update."""
        return repository_for(request).record_learning_feedback(
            payload.model_dump(exclude_none=True)
        )

    @app.get(f"{API_PREFIX}/personalization/profile")
    def personalization_profile(request: Request) -> dict[str, Any]:
        """Expose exactly what the local coach has learned and why."""
        return repository_for(request).personalization_profile()

    @app.post(f"{API_PREFIX}/personalization/reset")
    def reset_personalization(request: Request) -> dict[str, Any]:
        """Reset derived weights without deleting vocabulary, sessions, or mastery."""
        return repository_for(request).reset_personalization()

    register_dictionary_routes(
        app,
        api_prefix=API_PREFIX,
        repository_for=repository_for,
        dictionary_for=lambda request: services(request).dictionary,
        decorate_entries=_with_dictionary_learning_state,
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
            repository = repository_for(request)
            if body.cloud_requested:
                _require_production_cloud_feature(request, "cloud_ai")
                _require_cloud_processing_consent(repository, "cloud AI text")
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

    @app.get(f"{API_PREFIX}/audio/capabilities")
    def audio_capabilities(request: Request) -> dict[str, Any]:
        """Return the speech service contract without loading the Whisper model."""
        raw = services(request).audio.capabilities()
        self_hosted = cast(dict[str, Any], raw["self_hosted"])
        openai = cast(dict[str, Any], raw["openai"])
        limits = cast(dict[str, Any], raw["limits"])
        hostname = request.url.hostname or ""
        configured_secure_origin = services(request).settings.public_base_url.startswith(
            "https://"
        )
        secure_context = (
            configured_secure_origin
            or request.url.scheme == "https"
            or hostname in {"localhost", "127.0.0.1", "::1"}
        )
        return {
            "secure_context_required": True,
            "secure_context": secure_context,
            "public_base_url": services(request).settings.public_base_url,
            "self_hosted_available": bool(self_hosted["available"]),
            "self_hosted_status": self_hosted["status"],
            "openai_available": bool(openai["configured"]),
            "max_duration_seconds": limits["max_duration_seconds"],
            "max_upload_bytes": limits["max_bytes"],
            "timeout_seconds": self_hosted["timeout_seconds"],
            "model": self_hosted["model"],
            "language": "he",
            "fallbacks": ["browser", "manual"],
            "audio_retention": "device_only",
            "details": raw,
        }

    @app.post(f"{API_PREFIX}/audio/tts")
    def tts(request: Request, payload: TTSPayload) -> dict[str, Any]:
        repository = repository_for(request)
        if payload.cloud_requested:
            _require_production_cloud_feature(request, "cloud_ai")
            _require_cloud_processing_consent(repository, "cloud text-to-speech")
        if isinstance(repository, CloudLearningRepository):
            if payload.retain:
                raise ValueError(
                    "Cloud audio retention is disabled; generated audio stays in the response only"
                )
            return repository.run_with_database(
                lambda database: AudioService(services(request).settings, database).tts(
                    payload.text,
                    cloud_requested=payload.cloud_requested,
                    voice_style=payload.voice_style,
                    retain=False,
                ),
                write=False,
            )
        return services(request).audio.tts(
            payload.text,
            cloud_requested=payload.cloud_requested,
            voice_style=payload.voice_style,
            retain=payload.retain,
        )

    @app.post(f"{API_PREFIX}/audio/stt")
    def stt(
        request: Request,
        file: Annotated[UploadFile, File()],
        mode: Annotated[
            Literal["self_hosted", "openai"] | None,
            Query(),
        ] = None,
        cloud_requested: Annotated[bool, Query()] = False,
        language: Annotated[str, Query(max_length=10)] = "he",
        target_text: Annotated[
            str | None,
            Query(min_length=1, max_length=4000),
        ] = None,
    ) -> dict[str, Any]:
        repository = repository_for(request)
        selected_mode = mode or ("openai" if cloud_requested else "self_hosted")
        if selected_mode == "openai":
            _require_production_cloud_feature(request, "cloud_ai")
            _require_cloud_processing_consent(repository, "cloud speech-to-text")
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
                        raise ValueError("Audio upload exceeds 8 MB")
                    handle.write(chunk)
            if isinstance(repository, CloudLearningRepository):
                result = repository.run_with_database(
                    lambda database: AudioService(services(request).settings, database).transcribe(
                        temporary,
                        cloud_requested=cloud_requested,
                        mode=selected_mode,
                        language=language,
                        delete_after=True,
                    ),
                    write=False,
                )
            else:
                result = services(request).audio.transcribe(
                    temporary,
                    cloud_requested=cloud_requested,
                    mode=selected_mode,
                    language=language,
                    delete_after=True,
                )
            transcript = str(result.get("transcript", "")).strip()
            response: dict[str, Any] = {
                **result,
                "normalized_text": str(
                    result.get("normalized_text") or normalize_hebrew(transcript)
                ),
                "duration_seconds": result.get("duration_seconds"),
                "latency_ms": int(result.get("latency_ms", 0)),
                "warnings": list(result.get("warnings", [])),
                "audio_deleted": bool(result.get("audio_deleted", False)),
            }
            if target_text is not None and transcript:
                grant = services(request).speech_evidence.issue(
                    subject=_speech_evidence_subject(request),
                    provider=str(result.get("provider", selected_mode)),
                    target_text=target_text,
                    transcript=transcript,
                )
                response["evidence_token"] = grant.token
                response["evidence_expires_at"] = grant.expires_at
            return response
        finally:
            temporary.unlink(missing_ok=True)
            file.file.close()

    @app.post(f"{API_PREFIX}/audio/transcript-analysis")
    def transcript_analysis(
        request: Request,
        payload: TranscriptAnalysisPayload,
    ) -> dict[str, Any]:
        """Explain Hebrew transcript tokens using exact sourced dictionary data only."""
        extracted_tokens = hebrew_tokens(payload.transcript)
        ordered_tokens: list[dict[str, Any]] = []
        token_by_normalized: dict[str, dict[str, Any]] = {}
        valid_token_count = 0
        for raw_token in extracted_tokens:
            normalized_token = normalize_hebrew(raw_token)
            if (
                not normalized_token
                or re.search(r"[\u05D0-\u05EA]", normalized_token) is None
            ):
                continue
            valid_token_count += 1
            existing = token_by_normalized.get(normalized_token)
            if existing is not None:
                existing["occurrence_count"] = int(existing["occurrence_count"]) + 1
                continue
            record = {
                "token": raw_token,
                "normalized_token": normalized_token,
                "occurrence_count": 1,
            }
            token_by_normalized[normalized_token] = record
            ordered_tokens.append(record)

        if not ordered_tokens:
            raise ValueError("Transcript must contain at least one Hebrew word")

        analyzed_tokens: list[dict[str, Any]] = []
        for token_record in ordered_tokens[:MAX_TRANSCRIPT_ANALYSIS_TOKENS]:
            matches = services(request).dictionary.lookup_exact(
                str(token_record["token"]),
                limit=6,
            )
            first_entry = matches[0] if matches else None
            analyzed_tokens.append(
                {
                    **token_record,
                    "known": bool(matches),
                    "display_word": (
                        str(first_entry.get("display_niqqud") or token_record["token"])
                        if first_entry
                        else str(token_record["token"])
                    ),
                    "dictionary_matches": matches,
                }
            )

        provenance = {
            "transcript": TRANSCRIPT_PROVENANCE_BY_PROVIDER[payload.transcript_provider],
            "dictionary": "local_dictionary",
            "lookup": "exact_registered_headword_or_form",
            "enrichment": None,
            "audio_retained": False,
            "learning_progress_updated": False,
        }
        response: dict[str, Any] = {
            "mode": "word" if valid_token_count == 1 else "phrase",
            "transcript": payload.transcript.strip(),
            "normalized_text": normalize_hebrew(payload.transcript),
            "transcript_provider": payload.transcript_provider,
            "tokens": analyzed_tokens,
            "unknown_tokens": [
                str(analyzed_token["normalized_token"])
                for analyzed_token in analyzed_tokens
                if not analyzed_token["known"]
            ],
            "total_unique_tokens": len(ordered_tokens),
            "analyzed_token_count": len(analyzed_tokens),
            "token_limit": MAX_TRANSCRIPT_ANALYSIS_TOKENS,
            "truncated": len(ordered_tokens) > MAX_TRANSCRIPT_ANALYSIS_TOKENS,
            "provenance": provenance,
        }
        if valid_token_count == 1:
            word_token = analyzed_tokens[0]
            response.update(
                {
                    "word": word_token["normalized_token"],
                    "display_word": word_token["display_word"],
                    "dictionary_matches": word_token["dictionary_matches"],
                    "enrichment": None,
                }
            )
        return response

    @app.post(f"{API_PREFIX}/audio/word-analysis")
    def word_analysis(request: Request, payload: WordAnalysisPayload) -> dict[str, Any]:
        """Resolve one recognized Hebrew word without trusting it as learning evidence."""
        repository = repository_for(request)
        identity = getattr(request.state, "session_identity", None)
        if identity is not None and identity.user.is_demo and payload.cloud_requested:
            raise CloudFeatureForbiddenError(
                "Cloud word analysis is disabled in the read-only demonstration."
            )
        if payload.cloud_requested:
            _require_production_cloud_feature(request, "cloud_ai")
            _require_cloud_processing_consent(repository, "cloud word enrichment")

        tokens = hebrew_tokens(payload.transcript)
        if len(tokens) != 1:
            raise ValueError("Record or enter exactly one Hebrew word")
        word = tokens[0]
        normalized_word = normalize_hebrew(word)
        if (
            not normalized_word
            or re.search(r"[\u05D0-\u05EA]", word) is None
            or normalize_hebrew(payload.transcript) != normalized_word
        ):
            raise ValueError("Record or enter exactly one Hebrew word without extra text")

        matches = services(request).dictionary.lookup(word)
        first_entry = matches[0] if matches else None
        context = profile_ai_context(repository)

        def build_result(database: Database) -> dict[str, Any]:
            enrichment: dict[str, Any] | None = None
            enrichment_source: str | None = None
            if payload.cloud_requested:
                enrichment = AIEngine(services(request).settings, database).run(
                    "word_insight",
                    {
                        "text": word,
                        "dictionary_entry": first_entry or {},
                    },
                    context,
                    cloud_requested=True,
                )
                enrichment_source = (
                    "cloud_ai" if enrichment["provider"] != "offline" else "offline_fallback"
                )
                enrichment = {**enrichment, "source": enrichment_source}
            return {
                "word": normalized_word,
                "display_word": (
                    str(first_entry.get("display_niqqud") or word) if first_entry else word
                ),
                "transcript": payload.transcript.strip(),
                "transcript_provider": payload.transcript_provider,
                "dictionary_matches": matches,
                "enrichment": enrichment,
                "provenance": {
                    "transcript": TRANSCRIPT_PROVENANCE_BY_PROVIDER[
                        payload.transcript_provider
                    ],
                    "dictionary": "local_dictionary",
                    "enrichment": enrichment_source,
                    "audio_retained": False,
                    "learning_progress_updated": False,
                },
            }

        if isinstance(repository, CloudLearningRepository):
            return repository.run_with_database(
                build_result,
                write=payload.cloud_requested,
            )
        return build_result(services(request).database)

    @app.post(f"{API_PREFIX}/audio/pronunciation-score")
    def pronunciation_score(request: Request, payload: PronunciationPayload) -> dict[str, Any]:
        repository = repository_for(request)
        evidence_key: str | None = None
        if payload.evidence_token is not None:
            evidence_id = services(request).speech_evidence.verify(
                payload.evidence_token,
                subject=_speech_evidence_subject(request),
                provider=payload.provider,
                target_text=payload.target_text,
                transcript=payload.transcript,
            )
            evidence_key = f"speech:{evidence_id}"
        evidence_verified = evidence_key is not None
        if isinstance(repository, CloudLearningRepository):
            return repository.run_with_database(
                lambda database: AudioService(services(request).settings, database).score(
                    payload.target_text,
                    payload.transcript,
                    item_id=payload.item_id,
                    provider=payload.provider,
                    verified_speech_evidence=evidence_verified,
                    evidence_key=evidence_key,
                ),
                write=True,
            )
        return services(request).audio.score(
            payload.target_text,
            payload.transcript,
            item_id=payload.item_id,
            provider=payload.provider,
            verified_speech_evidence=evidence_verified,
            evidence_key=evidence_key,
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

    @app.post(f"{API_PREFIX}/import")
    def import_data(
        request: Request,
        file: Annotated[UploadFile, File()],
        confirm_replace: Annotated[bool, Query()] = False,
    ) -> dict[str, Any]:
        """Restore one portable learner backup only after explicit confirmation."""
        if not confirm_replace:
            raise ValueError(
                "Set confirm_replace=true to replace this account's learner data"
            )
        suffix = Path(file.filename or "ivrit-sheli-export.json").suffix.lower()
        if suffix != ".json":
            raise ValueError("Learner import must be a .json export")
        temporary = (
            services(request).settings.data_dir
            / "private"
            / f"import-{uuid4().hex}.json"
        )
        written = 0
        try:
            with temporary.open("wb") as handle:
                while chunk := file.file.read(1024 * 1024):
                    written += len(chunk)
                    if written > MAX_PORTABLE_IMPORT_BYTES:
                        raise ValueError("Learner import exceeds 32 MB")
                    handle.write(chunk)
            repository = repository_for(request)
            result = repository.import_json(temporary)
            preferences = repository.notification_preferences()
            identity = getattr(request.state, "session_identity", None)
            if (
                isinstance(repository, CloudLearningRepository)
                and identity is not None
            ):
                profile = repository.get_profile()
                services(request).cloud_store.update_push_subscription_preferences(
                    identity.user.id,
                    {
                        **preferences,
                        "enabled": False,
                        "locale": profile["interface_language"],
                        "weekly_rest_day": profile["weekly_rest_day"],
                    },
                )
            return {
                **result,
                "source": "uploaded_backup",
                "notification_preferences": preferences,
                "reauthorization_required": True,
            }
        finally:
            temporary.unlink(missing_ok=True)
            file.file.close()


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

    @app.exception_handler(LearningCoreConflictError)
    async def learning_core_conflict(
        request: Request,
        error: LearningCoreConflictError,
    ) -> JSONResponse:
        return error_response(request, 409, "learning_core_conflict", str(error))

    @app.exception_handler(PracticeConflictError)
    async def practice_conflict(
        request: Request,
        error: PracticeConflictError,
    ) -> JSONResponse:
        return error_response(request, 409, "practice_conflict", str(error))

    @app.exception_handler(AlphabetConflictError)
    async def alphabet_conflict(
        request: Request,
        error: AlphabetConflictError,
    ) -> JSONResponse:
        return error_response(request, 409, "alphabet_conflict", str(error))

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

    @app.exception_handler(CloudConsentRequiredError)
    async def cloud_consent_required(
        request: Request, error: CloudConsentRequiredError
    ) -> JSONResponse:
        return error_response(
            request,
            403,
            "cloud_consent_required",
            str(error),
        )

    @app.exception_handler(ConnectorError)
    async def connector_error(request: Request, error: ConnectorError) -> JSONResponse:
        return error_response(request, 502, "connector_error", str(error))

    @app.exception_handler(AudioProviderError)
    async def audio_error(request: Request, error: AudioProviderError) -> JSONResponse:
        response = error_response(
            request,
            error.status_code,
            error.code,
            str(error),
        )
        if error.retry_after is not None:
            response.headers["Retry-After"] = str(error.retry_after)
        return response

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
    notebook_dir = Path(__file__).resolve().parents[3] / "docs"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @lru_cache(maxsize=4)
    def _index_document(base_url: str, _revision: tuple[int, int]) -> str:
        """Serve index.html with absolute social-card image URLs.

        Date: 2026-08-26 | TZ: Asia/Jerusalem

        `docs/DEPLOYMENT.md` has carried a manual release step since 2.9 —
        "rewrite og:image and twitter:image from /social/... to an absolute URL
        against PUBLIC_BASE_URL" — because crawlers do not reliably resolve a
        relative image and the card then silently falls back to no image at all.

        A manual step is a step somebody forgets, and on 2026-08-26 somebody had:
        the first link sent to a real reader would have arrived in WhatsApp as
        title, description and a bare tunnel URL, with the artwork missing. It is
        done here instead, from `PUBLIC_BASE_URL`, so it is right on every host
        without anyone remembering.

        Cache by public base URL and the file's mtime/size revision. Vite replaces
        hashed entry bundles during a build, so caching only by base URL can leave
        a running local backend serving stale HTML that points at a deleted asset.
        Four entries cover the real/redirect base URLs across one build rollover.
        """
        raw = (frontend_dist / "index.html").read_text(encoding="utf-8")
        if not base_url:
            return raw
        return raw.replace('content="/social/', f'content="{base_url.rstrip("/")}/social/')

    def _index_response(request: Request) -> Any:
        index = frontend_dist / "index.html"
        if not index.exists():
            return None
        # The base URL lives on the request's services rather than in this
        # closure, and a request that arrives before startup finishes has none;
        # falling back to the raw document keeps the page serving in that
        # window, with a relative card image, which is what it did before.
        try:
            base_url = services(request).settings.public_base_url
        except Exception:  # noqa: BLE001 - a missing base URL must not 500 the page
            base_url = ""
        index_stat = index.stat()
        return HTMLResponse(
            _index_document(base_url, (index_stat.st_mtime_ns, index_stat.st_size)),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )

    @app.get("/", include_in_schema=False)
    async def root(request: Request) -> Any:
        document = _index_response(request)
        if document is not None:
            return document
        return JSONResponse(
            {
                "name": "Ivrit Sheli",
                "api": f"{API_PREFIX}/docs",
                "message": "Frontend is not built. Run npm install && npm run build in frontend/.",
            }
        )

    @app.get("/notes/{note_name}", include_in_schema=False)
    async def notebook_markdown(note_name: str) -> Any:
        # This route exists to publish one learner-facing notebook. Serving the
        # whole docs/ directory unauthenticated handed out the deployment,
        # architecture and connector documents to anyone who asked, so the
        # allowlist — not the traversal guards — is what bounds this endpoint.
        if note_name not in PUBLISHED_NOTES:
            raise HTTPException(status_code=404, detail="Note file not found")
        note = (notebook_dir / note_name).resolve()
        if notebook_dir.resolve() not in note.parents:
            raise HTTPException(status_code=404, detail="Note file not found")
        if not note.is_file():
            raise HTTPException(status_code=404, detail="Note file not found")
        return FileResponse(note, media_type="text/markdown; charset=utf-8")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa_fallback(path: str, request: Request) -> Any:
        # API misses must remain JSON 404s instead of returning the SPA shell.
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        candidate = frontend_dist / path
        if candidate.is_file() and frontend_dist.resolve() in candidate.resolve().parents:
            return FileResponse(candidate)
        document = _index_response(request)
        if document is not None:
            return document
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
