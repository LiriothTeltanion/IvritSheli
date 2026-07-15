"""
Module: FastAPI application
Purpose: Expose the complete local Hebrew-learning system through validated, observable HTTP endpoints.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import logging
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Annotated, Any, Literal, cast
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

from ivrit_sheli import __version__
from ivrit_sheli.ai_engine import AIEngine
from ivrit_sheli.audio import MAX_AUDIO_BYTES, AudioProviderError, AudioService
from ivrit_sheli.config import Settings
from ivrit_sheli.connectors import ConnectorError, ConnectorService, ContextPreview
from ivrit_sheli.database import Database
from ivrit_sheli.dictionary import DictionaryStore
from ivrit_sheli.gamification import XPAction
from ivrit_sheli.repository import LearningRepository

LOGGER = logging.getLogger(__name__)
API_PREFIX = "/api/v1"


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


class ConnectorImportPayload(StrictModel):
    """Explicitly selected phrase import from a connector preview."""

    source: str = Field(max_length=100)
    context_label: str = Field(default="daily_life", max_length=100)
    phrases: list[dict[str, str]] = Field(min_length=1, max_length=50)


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


def build_services(settings: Settings) -> Services:
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
    return Services(
        settings=settings,
        database=database,
        dictionary=dictionary,
        repository=repository,
        ai=AIEngine(settings, database),
        audio=AudioService(settings, database),
        connectors=ConnectorService(settings, database),
    )


def create_app(settings: Settings | None = None) -> FastAPI:
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
        app.state.services = build_services(runtime_settings)
        LOGGER.info("Ivrit Sheli API initialized on local data stores")
        yield
        app.state.services.database.close()
        app.state.services.dictionary.close()

    app = FastAPI(
        title="Ivrit Sheli Ultimate API",
        version=__version__,
        description="Private adaptive Hebrew-learning API",
        docs_url=f"{API_PREFIX}/docs",
        openapi_url=f"{API_PREFIX}/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next: Any) -> Any:
        """Attach an observable request ID without recording request bodies."""
        request_id = request.headers.get("X-Request-ID") or uuid4().hex
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
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


def register_routes(app: FastAPI) -> None:
    """Register all versioned API routes.

    Args:
        app: FastAPI application.

    Returns:
        None.

    Example:
        Called exactly once by `create_app`.
    """

    @app.get(f"{API_PREFIX}/health")
    async def health(request: Request) -> dict[str, Any]:
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
    async def dashboard(request: Request) -> dict[str, Any]:
        payload = services(request).repository.dashboard()
        payload["dictionary"] = services(request).dictionary.stats()
        payload["system"] = {
            "offline_ready": True,
            "cloud_available": bool(
                services(request).settings.allow_cloud_processing
                and services(request).settings.openai_api_key
            ),
        }
        return payload

    @app.get(f"{API_PREFIX}/profile")
    async def get_profile(request: Request) -> dict[str, Any]:
        return services(request).repository.get_profile()

    @app.put(f"{API_PREFIX}/profile")
    async def update_profile(
        request: Request, payload: ProfilePayload
    ) -> dict[str, Any]:
        return services(request).repository.update_profile(
            payload.model_dump(exclude_none=True)
        )

    @app.get(f"{API_PREFIX}/items")
    async def list_items(
        request: Request,
        q: str = Query(default="", max_length=500),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> dict[str, Any]:
        return {"items": services(request).repository.list_items(limit, q)}

    @app.get(f"{API_PREFIX}/items/{{item_id}}")
    async def get_item(request: Request, item_id: int) -> dict[str, Any]:
        return services(request).repository.get_item(item_id)

    @app.post(f"{API_PREFIX}/items", status_code=201)
    async def create_item(
        request: Request, payload: LearningItemPayload
    ) -> dict[str, Any]:
        return services(request).repository.create_item(payload.model_dump())

    @app.get(f"{API_PREFIX}/reviews/next")
    async def next_reviews(
        request: Request, limit: int = Query(default=10, ge=1, le=100)
    ) -> dict[str, Any]:
        return {"items": services(request).repository.next_reviews(limit)}

    @app.post(f"{API_PREFIX}/reviews/{{item_id}}")
    async def submit_review(
        request: Request, item_id: int, payload: ReviewPayload
    ) -> dict[str, Any]:
        return services(request).repository.submit_review(item_id, payload.model_dump())

    @app.get(f"{API_PREFIX}/recommendations")
    async def recommendations(
        request: Request, limit: int = Query(default=8, ge=1, le=50)
    ) -> dict[str, Any]:
        return {"recommendations": services(request).repository.recommendations(limit)}

    @app.get(f"{API_PREFIX}/progress")
    async def progress(request: Request) -> dict[str, Any]:
        return services(request).repository.progress()

    @app.get(f"{API_PREFIX}/dictionary/search")
    async def dictionary_search(
        request: Request,
        q: str = Query(min_length=1, max_length=500),
        limit: int = Query(default=20, ge=1, le=100),
    ) -> dict[str, Any]:
        results = services(request).dictionary.search(q, limit)
        services(request).repository.log_event(
            "dictionary_lookup",
            entity_type="dictionary_query",
            entity_id=q[:100],
            payload={"result_count": len(results)},
            xp_action=XPAction.DICTIONARY_EXPLORE,
        )
        return {"query": q, "results": results}

    @app.get(f"{API_PREFIX}/dictionary/lookup")
    async def dictionary_lookup(
        request: Request,
        word: str = Query(min_length=1, max_length=500),
    ) -> dict[str, Any]:
        results = services(request).dictionary.lookup(word)
        services(request).repository.log_event(
            "dictionary_lookup",
            entity_type="dictionary_word",
            entity_id=word[:100],
            payload={"result_count": len(results)},
            xp_action=XPAction.DICTIONARY_EXPLORE,
        )
        return {"word": word, "results": results}

    @app.get(f"{API_PREFIX}/dictionary/entries/{{entry_id}}")
    async def dictionary_entry(request: Request, entry_id: int) -> dict[str, Any]:
        return services(request).dictionary.get(entry_id)

    @app.get(f"{API_PREFIX}/dictionary/stats")
    async def dictionary_stats(request: Request) -> dict[str, Any]:
        return services(request).dictionary.stats()

    @app.post(f"{API_PREFIX}/dictionary/{{entry_id}}/learn", status_code=201)
    async def learn_dictionary_entry(request: Request, entry_id: int) -> dict[str, Any]:
        card = services(request).dictionary.get(entry_id)
        first_sense = card["senses"][0] if card["senses"] else {}
        return services(request).repository.create_item(
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

        async def handler(request: Request, body: AITaskPayload) -> dict[str, Any]:
            context = {**profile_ai_context(services(request).repository), **body.learner_context}
            return services(request).ai.run(
                task_name,
                body.payload,
                context,
                cloud_requested=body.cloud_requested,
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
    async def tts(request: Request, payload: TTSPayload) -> dict[str, Any]:
        return services(request).audio.tts(
            payload.text,
            cloud_requested=payload.cloud_requested,
            voice=payload.voice,
            retain=payload.retain,
        )

    @app.post(f"{API_PREFIX}/audio/stt")
    async def stt(
        request: Request,
        file: Annotated[UploadFile, File()],
        cloud_requested: Annotated[bool, Query()] = False,
        language: Annotated[str, Query(max_length=10)] = "he",
    ) -> dict[str, Any]:
        suffix = Path(file.filename or "recording.webm").suffix.lower() or ".webm"
        temporary = services(request).settings.data_dir / "private" / f"upload-{uuid4().hex}{suffix}"
        written = 0
        try:
            with temporary.open("wb") as handle:
                while chunk := await file.read(1024 * 1024):
                    written += len(chunk)
                    if written > MAX_AUDIO_BYTES:
                        raise ValueError("Audio upload exceeds 25 MB")
                    handle.write(chunk)
            return services(request).audio.transcribe(
                temporary,
                cloud_requested=cloud_requested,
                language=language,
                delete_after=True,
            )
        finally:
            temporary.unlink(missing_ok=True)
            await file.close()

    @app.post(f"{API_PREFIX}/audio/pronunciation-score")
    async def pronunciation_score(
        request: Request, payload: PronunciationPayload
    ) -> dict[str, Any]:
        return services(request).audio.score(
            payload.target_text,
            payload.transcript,
            item_id=payload.item_id,
            provider=payload.provider,
        )

    @app.get(f"{API_PREFIX}/gamification/status")
    async def gamification_status(request: Request) -> dict[str, Any]:
        return services(request).repository.gamification_status()

    @app.get(f"{API_PREFIX}/achievements")
    async def achievements(request: Request) -> dict[str, Any]:
        return {
            "achievements": services(request).repository.gamification_status()[
                "achievements"
            ]
        }

    @app.post(f"{API_PREFIX}/missions", status_code=201)
    async def create_mission(
        request: Request, payload: MissionPayload
    ) -> dict[str, Any]:
        return services(request).repository.create_mission(payload.model_dump())

    @app.post(f"{API_PREFIX}/missions/{{mission_id}}/complete")
    async def complete_mission(
        request: Request, mission_id: int, payload: MissionCompletionPayload
    ) -> dict[str, Any]:
        return services(request).repository.complete_mission(
            mission_id, payload.model_dump()
        )

    @app.get(f"{API_PREFIX}/connectors")
    async def connector_states(request: Request) -> dict[str, Any]:
        return {"connectors": services(request).connectors.states()}

    @app.post(f"{API_PREFIX}/connectors/ics/preview")
    async def preview_ics(
        request: Request, file: Annotated[UploadFile, File()]
    ) -> dict[str, Any]:
        temporary = (
            services(request).settings.data_dir
            / "private"
            / f"calendar-{uuid4().hex}.ics"
        )
        written = 0
        try:
            with temporary.open("wb") as handle:
                while chunk := await file.read(512 * 1024):
                    written += len(chunk)
                    if written > 5 * 1024 * 1024:
                        raise ValueError("ICS preview is limited to 5 MB")
                    handle.write(chunk)
            previews = services(request).connectors.preview_ics(temporary)
            return {"previews": [preview_to_dict(item) for item in previews]}
        finally:
            temporary.unlink(missing_ok=True)
            await file.close()

    @app.post(f"{API_PREFIX}/connectors/google/preview")
    async def preview_google(
        request: Request, payload: GooglePreviewPayload
    ) -> dict[str, Any]:
        previews = services(request).connectors.preview_google(
            payload.service, payload.resource_id
        )
        return {"previews": [preview_to_dict(item) for item in previews]}

    @app.post(f"{API_PREFIX}/connectors/import", status_code=201)
    async def import_connector_phrases(
        request: Request, payload: ConnectorImportPayload
    ) -> dict[str, Any]:
        created: list[dict[str, Any]] = []
        for phrase in payload.phrases:
            hebrew = str(phrase.get("hebrew", "")).strip()
            if not hebrew:
                continue
            created.append(
                services(request).repository.create_item(
                    {
                        "hebrew_text": hebrew,
                        "translation_en": phrase.get("en"),
                        "translation_es": phrase.get("es"),
                        "context_label": payload.context_label,
                        "source_label": f"connector:{payload.source}",
                        "priority": 0.72,
                    }
                )
            )
        return {"created": created, "count": len(created)}

    @app.post(f"{API_PREFIX}/bug-reports", status_code=201)
    async def create_bug_report(
        request: Request, payload: BugReportPayload
    ) -> dict[str, Any]:
        data = payload.model_dump()
        data["request_id"] = data.get("request_id") or request.state.request_id
        data["diagnostics"] = limited_diagnostics(data.get("diagnostics") or {})
        return services(request).repository.create_bug_report(data)

    @app.get(f"{API_PREFIX}/export")
    async def export_data(request: Request) -> FileResponse:
        destination = (
            services(request).settings.data_dir
            / "backups"
            / f"ivrit-sheli-export-{uuid4().hex[:8]}.json"
        )
        services(request).repository.export_json(destination)
        return FileResponse(
            destination,
            media_type="application/json",
            filename="ivrit-sheli-export.json",
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

    @app.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
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


def profile_ai_context(repository: LearningRepository) -> dict[str, Any]:
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
        "active_goals": [
            goal["goal_type"] for goal in profile["goals"] if goal["is_active"]
        ][:10],
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
    return {
        key: str(value)[:500]
        for key, value in diagnostics.items()
        if key in allowed
    }


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
    """Configure readable application logging once.

    Args:
        level: Logging level name.

    Returns:
        None.

    Example:
        >>> configure_logging("INFO")
    """
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


app = create_app()
