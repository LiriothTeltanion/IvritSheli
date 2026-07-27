"""
Module: configuration
Purpose: Load safe local defaults and optional provider settings from environment variables.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from ivrit_sheli.cloud_store import RUNTIME_DATABASE_ROLE

SUPPORTED_APP_ENVS = frozenset({"development", "local", "test", "production"})


def parse_bool(value: str | bool | None, default: bool = False) -> bool:
    """Parse a permissive environment-style boolean.

    Args:
        value: Raw boolean or string value.
        default: Value returned when `value` is missing.

    Returns:
        Parsed boolean.

    Raises:
        ValueError: If a non-empty string is not a recognized boolean.

    Example:
        >>> parse_bool("yes")
        True
    """
    if value is None:
        return default
    if isinstance(value, bool):
        return value

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"Unsupported boolean value: {value!r}")


def parse_csv(value: str, *, casefold: bool = False) -> tuple[str, ...]:
    """Parse a comma-separated allowlist into unique, non-empty values.

    Args:
        value: Raw comma-separated setting.
        casefold: Whether entries should be normalized case-insensitively.

    Returns:
        Stable tuple with duplicates removed in input order.

    Example:
        >>> parse_csv("Kevin, kevin", casefold=True)
        ('kevin',)
    """
    normalized = (
        item.strip().casefold() if casefold else item.strip()
        for item in value.split(",")
    )
    return tuple(dict.fromkeys(item for item in normalized if item))


def load_env_file(path: Path) -> dict[str, str]:
    """Read a small `.env` file without adding a dependency.

    Args:
        path: File to read.

    Returns:
        Key/value pairs. Missing files return an empty mapping.

    Raises:
        OSError: If an existing file cannot be read.

    Example:
        >>> load_env_file(Path("missing.env"))
        {}
    """
    if not path.exists():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


@dataclass(frozen=True, slots=True)
class Settings:
    """Application settings with local-first defaults.

    Args:
        root_dir: Repository root.
        data_dir: Directory for mutable local data.
        db_path: Main learning database.
        dictionary_db_path: Rebuildable dictionary database.
        frontend_dist: Production frontend output directory.
        host: API bind host.
        port: API bind port.
        app_env: Runtime environment label.
        log_level: Python logging level.
        debug: Whether debug responses may include extra detail.
        ai_provider: Preferred provider name.
        allow_cloud_processing: Explicit master consent for cloud calls.
        openai_api_key: Optional OpenAI key.
        openai_text_model: Structured-output model.
        openai_embedding_model: Embedding model.
        openai_transcribe_model: Speech-to-text model.
        openai_tts_model: Text-to-speech model.
        openai_tts_voice: Voice identifier.
        openai_tts_voice_masculine: Provider voice mapped to the masculine style profile.
        openai_tts_voice_feminine: Provider voice mapped to the feminine style profile.
        self_hosted_speech_enabled: Whether the private Faster Whisper worker is enabled.
        whisper_preload_on_start: Whether startup must load the model before readiness.
        whisper_model: Multilingual Faster Whisper model identifier.
        whisper_model_cache_dir: Private model cache outside learner exports.
        whisper_device: Inference device for the v2.9 worker.
        whisper_compute_type: CTranslate2 compute type for the worker.
        whisper_language: Forced learning language.
        whisper_timeout_seconds: Per-request transcription deadline.
        whisper_max_duration_seconds: Maximum accepted recording duration.
        push_notifications_enabled: Whether opt-in Web Push is exposed.
        vapid_public_key: Public application-server key sent to subscribed browsers.
        vapid_private_key: Private signing key used only by the reminder worker.
        vapid_subject: VAPID contact URI.
        push_encryption_key: Separate key for encrypted subscription documents.
        dicta_nakdan_url: Optional Dicta-compatible endpoint.
        google_client_id: Optional OAuth client ID.
        google_client_secret: Optional OAuth client secret.
        google_refresh_token: Optional refresh token.
        google_access_token: Optional access token.
        google_auth_client_id: Optional Google sign-in OAuth client ID.
        google_auth_client_secret: Optional Google sign-in OAuth client secret.
        google_auth_redirect_uri: Exact Google sign-in callback URI.

    Example:
        >>> settings = Settings.from_env({"APP_PORT": "9000"})
        >>> settings.port
        9000
    """

    root_dir: Path
    data_dir: Path
    db_path: Path
    dictionary_db_path: Path
    frontend_dist: Path
    host: str = "127.0.0.1"
    port: int = 8000
    app_env: str = "development"
    log_level: str = "INFO"
    debug: bool = False
    ai_provider: str = "offline"
    allow_cloud_processing: bool = False
    openai_api_key: str = ""
    openai_text_model: str = "gpt-5.6-luna"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_transcribe_model: str = "gpt-4o-transcribe"
    openai_tts_model: str = "gpt-4o-mini-tts"
    openai_tts_voice: str = "coral"
    openai_tts_voice_masculine: str = "onyx"
    openai_tts_voice_feminine: str = "coral"
    self_hosted_speech_enabled: bool = False
    whisper_preload_on_start: bool = False
    whisper_model: str = "small"
    whisper_model_cache_dir: Path | None = None
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    whisper_language: str = "he"
    whisper_timeout_seconds: int = 45
    whisper_max_duration_seconds: float = 20.0
    push_notifications_enabled: bool = False
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject: str = ""
    push_encryption_key: str = ""
    dicta_nakdan_url: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    google_access_token: str = ""
    google_redirect_uri: str = "http://127.0.0.1:8765/oauth/callback"
    google_auth_client_id: str = ""
    google_auth_client_secret: str = ""
    google_auth_redirect_uri: str = (
        "http://127.0.0.1:8000/api/v1/auth/google/callback"
    )
    database_url: str = ""
    auth_required: bool = False
    session_secret: str = ""
    session_cookie_name: str = "ivrit_session"
    session_cookie_secure: bool = False
    session_ttl_seconds: int = 604_800
    session_retention_seconds: int = 604_800
    demo_session_limit: int = 64
    user_session_limit: int = 8
    oauth_state_limit: int = 1_024
    trusted_proxy_mode: str = "direct"
    railway_environment_id: str = ""
    auth_client_rate_limit_requests: int = 20
    auth_global_rate_limit_requests: int = 1_000
    auth_rate_limit_window_seconds: int = 60
    auth_rate_limit_max_client_keys: int = 10_000
    authenticated_write_rate_limit_requests: int = 120
    authenticated_write_rate_limit_window_seconds: int = 60
    authenticated_write_rate_limit_max_users: int = 10_000
    max_cloud_snapshot_bytes: int = 4_194_304
    max_request_body_bytes: int = 1_048_576
    max_ics_upload_body_bytes: int = 6_291_456
    max_audio_upload_body_bytes: int = 9_437_184
    max_import_upload_body_bytes: int = 33_554_432
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://127.0.0.1:8000/api/v1/auth/github/callback"
    public_base_url: str = "http://127.0.0.1:8000"
    allowed_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    )
    build_commit: str = "development"
    cloud_ai_allowed_github_logins: tuple[str, ...] = ()
    cloud_ai_allowed_github_ids: tuple[str, ...] = ()
    cloud_ai_allowed_google_subjects: tuple[str, ...] = ()
    google_connectors_allowed_github_logins: tuple[str, ...] = ()
    google_connectors_allowed_github_ids: tuple[str, ...] = ()
    google_connectors_allowed_google_subjects: tuple[str, ...] = ()

    @classmethod
    def from_env(cls, overrides: Mapping[str, str] | None = None) -> Settings:
        """Create settings from `.env`, process environment, and overrides.

        Args:
            overrides: Highest-priority values, useful for tests.

        Returns:
            Validated settings instance.

        Raises:
            ValueError: If numeric or boolean settings are invalid.

        Example:
            >>> Settings.from_env({"AI_PROVIDER": "offline"}).ai_provider
            'offline'
        """
        root_dir = Path(__file__).resolve().parents[3]
        file_values = load_env_file(root_dir / ".env")
        values: dict[str, str] = {**file_values, **os.environ}
        if overrides:
            values.update(overrides)

        # The one-click launcher must stay private and writable even when a
        # developer's .env contains production Railway credentials. This
        # explicit process-local marker takes precedence over those values;
        # deployment entrypoints never set it.
        if parse_bool(values.get("IVRIT_LOCAL_ONLY"), False):
            values.update(
                {
                    "APP_ENV": "local",
                    "DATABASE_URL": "",
                    "AUTH_REQUIRED": "false",
                    "SESSION_COOKIE_SECURE": "false",
                    "TRUSTED_PROXY_MODE": "direct",
                    "RAILWAY_ENVIRONMENT_ID": "",
                    "GITHUB_CLIENT_ID": "",
                    "GITHUB_CLIENT_SECRET": "",
                    "GOOGLE_AUTH_CLIENT_ID": "",
                    "GOOGLE_AUTH_CLIENT_SECRET": "",
                }
            )

        def value(name: str, default: str) -> str:
            return str(values.get(name, default))

        data_dir = Path(value("APP_DATA_DIR", str(root_dir / "data"))).expanduser()
        if not data_dir.is_absolute():
            data_dir = (root_dir / data_dir).resolve()

        db_path = Path(value("APP_DB_PATH", str(data_dir / "ivrit_sheli.db"))).expanduser()
        dictionary_path = Path(
            value("DICTIONARY_DB_PATH", str(data_dir / "hebrew_dictionary.db"))
        ).expanduser()
        if str(db_path) != ":memory:" and not db_path.is_absolute():
            db_path = (root_dir / db_path).resolve()
        if str(dictionary_path) != ":memory:" and not dictionary_path.is_absolute():
            dictionary_path = (root_dir / dictionary_path).resolve()
        whisper_cache_value = value("WHISPER_MODEL_CACHE_DIR", "").strip()
        whisper_model_cache_dir = (
            Path(whisper_cache_value).expanduser()
            if whisper_cache_value
            else data_dir / "models" / "faster-whisper"
        )
        if not whisper_model_cache_dir.is_absolute():
            whisper_model_cache_dir = (root_dir / whisper_model_cache_dir).resolve()

        app_env = value("APP_ENV", "development").strip().lower()
        if app_env not in SUPPORTED_APP_ENVS:
            supported = ", ".join(sorted(SUPPORTED_APP_ENVS))
            raise ValueError(f"APP_ENV must be one of: {supported}")
        public_base_url = value(
            "PUBLIC_BASE_URL", "http://127.0.0.1:8000"
        ).strip().rstrip("/")
        configured_origins = tuple(
            item.strip().rstrip("/")
            for item in value("ALLOWED_ORIGINS", "").split(",")
            if item.strip()
        )
        default_origins = (
            (public_base_url,)
            if app_env == "production"
            else (
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8000",
                "http://127.0.0.1:8000",
            )
        )
        public_origin = _origin(public_base_url)
        allowed_origins = tuple(
            dict.fromkeys((*default_origins, *configured_origins, public_origin))
        )

        settings = cls(
            root_dir=root_dir,
            data_dir=data_dir,
            db_path=db_path,
            dictionary_db_path=dictionary_path,
            frontend_dist=root_dir / "frontend" / "dist",
            host=value("APP_HOST", "127.0.0.1"),
            port=int(value("APP_PORT", "8000")),
            app_env=app_env,
            log_level=value("LOG_LEVEL", "INFO").upper(),
            debug=parse_bool(values.get("DEBUG"), False),
            ai_provider=value("AI_PROVIDER", "offline").lower(),
            allow_cloud_processing=parse_bool(
                values.get("ALLOW_CLOUD_PROCESSING"), False
            ),
            openai_api_key=value("OPENAI_API_KEY", ""),
            openai_text_model=value("OPENAI_TEXT_MODEL", "gpt-5.6-luna"),
            openai_embedding_model=value(
                "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
            ),
            openai_transcribe_model=value(
                "OPENAI_TRANSCRIBE_MODEL", "gpt-4o-transcribe"
            ),
            openai_tts_model=value("OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
            openai_tts_voice=value("OPENAI_TTS_VOICE", "coral"),
            openai_tts_voice_masculine=value(
                "OPENAI_TTS_VOICE_MASCULINE", "onyx"
            ),
            openai_tts_voice_feminine=value(
                "OPENAI_TTS_VOICE_FEMININE", "coral"
            ),
            self_hosted_speech_enabled=parse_bool(
                values.get("SELF_HOSTED_SPEECH_ENABLED"), False
            ),
            whisper_preload_on_start=parse_bool(
                values.get("WHISPER_PRELOAD_ON_START"), False
            ),
            whisper_model=value("WHISPER_MODEL", "small").strip(),
            whisper_model_cache_dir=whisper_model_cache_dir,
            whisper_device=value("WHISPER_DEVICE", "cpu").strip().lower(),
            whisper_compute_type=value(
                "WHISPER_COMPUTE_TYPE", "int8"
            ).strip().lower(),
            whisper_language=value("WHISPER_LANGUAGE", "he").strip().lower(),
            whisper_timeout_seconds=int(value("WHISPER_TIMEOUT_SECONDS", "45")),
            whisper_max_duration_seconds=float(
                value("WHISPER_MAX_DURATION_SECONDS", "20")
            ),
            push_notifications_enabled=parse_bool(
                values.get("PUSH_NOTIFICATIONS_ENABLED"), False
            ),
            vapid_public_key=value("VAPID_PUBLIC_KEY", "").strip(),
            vapid_private_key=value("VAPID_PRIVATE_KEY", "").strip(),
            vapid_subject=value("VAPID_SUBJECT", "").strip(),
            push_encryption_key=value("PUSH_ENCRYPTION_KEY", "").strip(),
            dicta_nakdan_url=value("DICTA_NAKDAN_URL", ""),
            google_client_id=value("GOOGLE_CLIENT_ID", ""),
            google_client_secret=value("GOOGLE_CLIENT_SECRET", ""),
            google_refresh_token=value("GOOGLE_REFRESH_TOKEN", ""),
            google_access_token=value("GOOGLE_ACCESS_TOKEN", ""),
            google_redirect_uri=value(
                "GOOGLE_REDIRECT_URI", "http://127.0.0.1:8765/oauth/callback"
            ),
            google_auth_client_id=value("GOOGLE_AUTH_CLIENT_ID", ""),
            google_auth_client_secret=value("GOOGLE_AUTH_CLIENT_SECRET", ""),
            google_auth_redirect_uri=value(
                "GOOGLE_AUTH_REDIRECT_URI",
                f"{public_base_url}/api/v1/auth/google/callback",
            ).strip().rstrip("/"),
            database_url=value("DATABASE_URL", ""),
            auth_required=parse_bool(values.get("AUTH_REQUIRED"), app_env == "production"),
            session_secret=value("SESSION_SECRET", ""),
            session_cookie_name=value("SESSION_COOKIE_NAME", "ivrit_session"),
            session_cookie_secure=parse_bool(
                values.get("SESSION_COOKIE_SECURE"), app_env == "production"
            ),
            session_ttl_seconds=int(value("SESSION_TTL_SECONDS", "604800")),
            session_retention_seconds=int(
                value("SESSION_RETENTION_SECONDS", "604800")
            ),
            demo_session_limit=int(value("DEMO_SESSION_LIMIT", "64")),
            user_session_limit=int(value("USER_SESSION_LIMIT", "8")),
            oauth_state_limit=int(value("OAUTH_STATE_LIMIT", "1024")),
            trusted_proxy_mode=value("TRUSTED_PROXY_MODE", "direct").strip().lower(),
            railway_environment_id=value("RAILWAY_ENVIRONMENT_ID", "").strip(),
            auth_client_rate_limit_requests=int(
                value("AUTH_CLIENT_RATE_LIMIT_REQUESTS", "20")
            ),
            auth_global_rate_limit_requests=int(
                value("AUTH_GLOBAL_RATE_LIMIT_REQUESTS", "1000")
            ),
            auth_rate_limit_window_seconds=int(
                value("AUTH_RATE_LIMIT_WINDOW_SECONDS", "60")
            ),
            auth_rate_limit_max_client_keys=int(
                value("AUTH_RATE_LIMIT_MAX_CLIENT_KEYS", "10000")
            ),
            authenticated_write_rate_limit_requests=int(
                value("AUTHENTICATED_WRITE_RATE_LIMIT_REQUESTS", "120")
            ),
            authenticated_write_rate_limit_window_seconds=int(
                value("AUTHENTICATED_WRITE_RATE_LIMIT_WINDOW_SECONDS", "60")
            ),
            authenticated_write_rate_limit_max_users=int(
                value("AUTHENTICATED_WRITE_RATE_LIMIT_MAX_USERS", "10000")
            ),
            max_cloud_snapshot_bytes=int(
                value("MAX_CLOUD_SNAPSHOT_BYTES", "4194304")
            ),
            max_request_body_bytes=int(
                value("MAX_REQUEST_BODY_BYTES", "1048576")
            ),
            max_ics_upload_body_bytes=int(
                value("MAX_ICS_UPLOAD_BODY_BYTES", "6291456")
            ),
            max_audio_upload_body_bytes=int(
                value("MAX_AUDIO_UPLOAD_BODY_BYTES", "9437184")
            ),
            max_import_upload_body_bytes=int(
                value("MAX_IMPORT_UPLOAD_BODY_BYTES", "33554432")
            ),
            github_client_id=value("GITHUB_CLIENT_ID", ""),
            github_client_secret=value("GITHUB_CLIENT_SECRET", ""),
            github_redirect_uri=value(
                "GITHUB_REDIRECT_URI",
                f"{public_base_url}/api/v1/auth/github/callback",
            ).strip().rstrip("/"),
            public_base_url=public_base_url,
            allowed_origins=allowed_origins,
            build_commit=(
                value("BUILD_COMMIT", "").strip()
                or value("RAILWAY_GIT_COMMIT_SHA", "").strip()
                or "development"
            )[:80],
            cloud_ai_allowed_github_logins=parse_csv(
                value("CLOUD_AI_ALLOWED_GITHUB_LOGINS", ""), casefold=True
            ),
            cloud_ai_allowed_github_ids=parse_csv(
                value("CLOUD_AI_ALLOWED_GITHUB_IDS", "")
            ),
            cloud_ai_allowed_google_subjects=parse_csv(
                value("CLOUD_AI_ALLOWED_GOOGLE_SUBJECTS", "")
            ),
            google_connectors_allowed_github_logins=parse_csv(
                value("GOOGLE_CONNECTORS_ALLOWED_GITHUB_LOGINS", ""),
                casefold=True,
            ),
            google_connectors_allowed_github_ids=parse_csv(
                value("GOOGLE_CONNECTORS_ALLOWED_GITHUB_IDS", "")
            ),
            google_connectors_allowed_google_subjects=parse_csv(
                value("GOOGLE_CONNECTORS_ALLOWED_GOOGLE_SUBJECTS", "")
            ),
        )
        settings.validate_cloud_configuration()
        settings.ensure_directories()
        return settings

    @property
    def cloud_mode(self) -> bool:
        """Return whether PostgreSQL-backed multi-user mode is configured."""
        return bool(self.database_url)

    @property
    def github_auth_configured(self) -> bool:
        """Return whether the complete GitHub login credential pair is present."""
        return bool(self.github_client_id and self.github_client_secret)

    @property
    def google_auth_configured(self) -> bool:
        """Return whether the complete Google login credential pair is present."""
        return bool(self.google_auth_client_id and self.google_auth_client_secret)

    @property
    def auth_providers(self) -> tuple[str, ...]:
        """Return configured sign-in providers in beginner-first display order."""
        providers: list[str] = []
        if self.google_auth_configured:
            providers.append("google")
        if self.github_auth_configured:
            providers.append("github")
        return tuple(providers)

    @property
    def cloud_ai_allowlist_configured(self) -> bool:
        """Return whether at least one explicit identity may use paid cloud AI."""
        return bool(
            self.cloud_ai_allowed_github_logins
            or self.cloud_ai_allowed_github_ids
            or self.cloud_ai_allowed_google_subjects
        )

    @property
    def google_connector_allowlist_configured(self) -> bool:
        """Return whether at least one explicit identity may use Google previews."""
        return bool(
            self.google_connectors_allowed_github_logins
            or self.google_connectors_allowed_github_ids
            or self.google_connectors_allowed_google_subjects
        )

    def allows_cloud_ai(
        self,
        login: str | None,
        provider_user_id: str | None,
        provider: str = "github",
    ) -> bool:
        """Match one authenticated provider identity against the cloud-AI allowlist."""
        if provider == "google":
            return self._subject_allowed(
                provider_user_id,
                self.cloud_ai_allowed_google_subjects,
            )
        if provider != "github":
            return False
        return self._github_identity_allowed(
            login,
            provider_user_id,
            self.cloud_ai_allowed_github_logins,
            self.cloud_ai_allowed_github_ids,
        )

    def allows_google_connectors(
        self,
        login: str | None,
        provider_user_id: str | None,
        provider: str = "github",
    ) -> bool:
        """Match one authenticated provider identity against the connector allowlist."""
        if provider == "google":
            return self._subject_allowed(
                provider_user_id,
                self.google_connectors_allowed_google_subjects,
            )
        if provider != "github":
            return False
        return self._github_identity_allowed(
            login,
            provider_user_id,
            self.google_connectors_allowed_github_logins,
            self.google_connectors_allowed_github_ids,
        )

    @staticmethod
    def _subject_allowed(
        provider_user_id: str | None,
        allowed_subjects: tuple[str, ...],
    ) -> bool:
        """Match an opaque provider subject without relying on email or display name."""
        normalized_id = provider_user_id.strip() if provider_user_id else ""
        return bool(normalized_id and normalized_id in allowed_subjects)

    @staticmethod
    def _github_identity_allowed(
        login: str | None,
        github_id: str | None,
        allowed_logins: tuple[str, ...],
        allowed_ids: tuple[str, ...],
    ) -> bool:
        normalized_login = login.strip().casefold() if login else ""
        normalized_id = github_id.strip() if github_id else ""
        return bool(
            (normalized_login and normalized_login in allowed_logins)
            or (normalized_id and normalized_id in allowed_ids)
        )

    def validate_cloud_configuration(self) -> None:
        """Reject unsafe production authentication and database settings early."""
        if bool(self.github_client_id) != bool(self.github_client_secret):
            raise ValueError("GitHub sign-in requires both client ID and client secret")
        if bool(self.google_auth_client_id) != bool(self.google_auth_client_secret):
            raise ValueError("Google sign-in requires both client ID and client secret")
        if self.whisper_model != "small":
            raise ValueError("WHISPER_MODEL must be small for the v2.9 speech worker")
        if self.whisper_device != "cpu":
            raise ValueError("WHISPER_DEVICE must be cpu for the v2.9 speech worker")
        if self.whisper_compute_type != "int8":
            raise ValueError(
                "WHISPER_COMPUTE_TYPE must be int8 for the v2.9 speech worker"
            )
        if self.whisper_language != "he":
            raise ValueError("WHISPER_LANGUAGE must be he")
        if self.whisper_preload_on_start and not self.self_hosted_speech_enabled:
            raise ValueError(
                "WHISPER_PRELOAD_ON_START requires SELF_HOSTED_SPEECH_ENABLED=true"
            )
        if not 1 <= self.whisper_timeout_seconds <= 45:
            raise ValueError("WHISPER_TIMEOUT_SECONDS must be between 1 and 45")
        if not 1 <= self.whisper_max_duration_seconds <= 20:
            raise ValueError(
                "WHISPER_MAX_DURATION_SECONDS must be between 1 and 20"
            )
        if self.push_notifications_enabled:
            if not self.cloud_mode or not self.auth_required:
                raise ValueError(
                    "Web Push requires authenticated PostgreSQL cloud mode"
                )
            if not self.public_base_url.startswith("https://"):
                raise ValueError("Web Push requires an HTTPS PUBLIC_BASE_URL")
            if not self.vapid_public_key:
                raise ValueError("Web Push requires VAPID_PUBLIC_KEY")
            if bool(self.vapid_private_key) != bool(self.vapid_subject):
                raise ValueError(
                    "VAPID_PRIVATE_KEY and VAPID_SUBJECT must be configured together"
                )
            if self.vapid_subject and not self.vapid_subject.startswith(
                ("mailto:", "https://")
            ):
                raise ValueError("VAPID_SUBJECT must be a mailto: or HTTPS URI")
            if len(self.push_encryption_key) < 32:
                raise ValueError(
                    "PUSH_ENCRYPTION_KEY must contain at least 32 characters"
                )
        if not 60 <= self.session_ttl_seconds <= 31_536_000:
            raise ValueError("SESSION_TTL_SECONDS must be between 60 and 31536000")
        if not 0 <= self.session_retention_seconds <= 31_536_000:
            raise ValueError(
                "SESSION_RETENTION_SECONDS must be between 0 and 31536000"
            )
        if not 1 <= self.demo_session_limit <= 1024:
            raise ValueError("DEMO_SESSION_LIMIT must be between 1 and 1024")
        if not 1 <= self.user_session_limit <= 100:
            raise ValueError("USER_SESSION_LIMIT must be between 1 and 100")
        if not 1 <= self.oauth_state_limit <= 100_000:
            raise ValueError("OAUTH_STATE_LIMIT must be between 1 and 100000")
        if self.trusted_proxy_mode not in {"direct", "railway"}:
            raise ValueError("TRUSTED_PROXY_MODE must be direct or railway")
        if self.trusted_proxy_mode == "railway" and self.app_env != "production":
            raise ValueError(
                "TRUSTED_PROXY_MODE=railway is valid only in production"
            )
        if self.trusted_proxy_mode == "railway" and not self.railway_environment_id:
            raise ValueError(
                "TRUSTED_PROXY_MODE=railway requires RAILWAY_ENVIRONMENT_ID"
            )
        if not 1 <= self.auth_client_rate_limit_requests <= 1_000:
            raise ValueError(
                "AUTH_CLIENT_RATE_LIMIT_REQUESTS must be between 1 and 1000"
            )
        if not 10 <= self.auth_global_rate_limit_requests <= 100_000:
            raise ValueError(
                "AUTH_GLOBAL_RATE_LIMIT_REQUESTS must be between 10 and 100000"
            )
        if (
            self.app_env == "production"
            and self.auth_global_rate_limit_requests
            < self.auth_client_rate_limit_requests * 10
        ):
            raise ValueError(
                "Production AUTH_GLOBAL_RATE_LIMIT_REQUESTS must be at least "
                "10x AUTH_CLIENT_RATE_LIMIT_REQUESTS"
            )
        if not 1 <= self.auth_rate_limit_window_seconds <= 3_600:
            raise ValueError(
                "AUTH_RATE_LIMIT_WINDOW_SECONDS must be between 1 and 3600"
            )
        if not 1 <= self.auth_rate_limit_max_client_keys <= 100_000:
            raise ValueError(
                "AUTH_RATE_LIMIT_MAX_CLIENT_KEYS must be between 1 and 100000"
            )
        if not 1 <= self.authenticated_write_rate_limit_requests <= 10_000:
            raise ValueError(
                "AUTHENTICATED_WRITE_RATE_LIMIT_REQUESTS must be between 1 and 10000"
            )
        if not 1 <= self.authenticated_write_rate_limit_window_seconds <= 3_600:
            raise ValueError(
                "AUTHENTICATED_WRITE_RATE_LIMIT_WINDOW_SECONDS must be between 1 and 3600"
            )
        if not 1 <= self.authenticated_write_rate_limit_max_users <= 100_000:
            raise ValueError(
                "AUTHENTICATED_WRITE_RATE_LIMIT_MAX_USERS must be between 1 and 100000"
            )
        if not 1_024 <= self.max_cloud_snapshot_bytes <= 67_108_864:
            raise ValueError(
                "MAX_CLOUD_SNAPSHOT_BYTES must be between 1024 and 67108864"
            )
        request_limits = {
            "MAX_REQUEST_BODY_BYTES": self.max_request_body_bytes,
            "MAX_ICS_UPLOAD_BODY_BYTES": self.max_ics_upload_body_bytes,
            "MAX_AUDIO_UPLOAD_BODY_BYTES": self.max_audio_upload_body_bytes,
            "MAX_IMPORT_UPLOAD_BODY_BYTES": self.max_import_upload_body_bytes,
        }
        for name, limit in request_limits.items():
            if not 1 <= limit <= 104_857_600:
                raise ValueError(f"{name} must be between 1 and 104857600")
        if self.cloud_mode and self.auth_required and len(self.session_secret) < 32:
            raise ValueError(
                "Cloud authentication SESSION_SECRET must contain at least 32 characters"
            )
        if self.app_env == "production" and self.debug:
            raise ValueError("Production DEBUG must be false")
        if self.app_env == "production" and not self.auth_required:
            raise ValueError("Production requires authentication")
        if self.app_env == "production" and self.auth_required:
            if not self.database_url.startswith(("postgresql://", "postgres://")):
                raise ValueError("Production authentication requires a PostgreSQL DATABASE_URL")
            database_username = urlparse(self.database_url).username or ""
            if database_username != RUNTIME_DATABASE_ROLE:
                raise ValueError(
                    f"Production DATABASE_URL must authenticate as {RUNTIME_DATABASE_ROLE}"
                )
            if len(self.session_secret) < 32:
                raise ValueError("Production SESSION_SECRET must contain at least 32 characters")
            if not self.session_cookie_secure:
                raise ValueError("Production session cookies must be Secure")
            if not self.public_base_url.startswith("https://"):
                raise ValueError("Production PUBLIC_BASE_URL must use HTTPS")
            if not self.auth_providers:
                raise ValueError(
                    "Production authentication requires at least one OAuth provider"
                )
            expected_github_callback = (
                f"{self.public_base_url}/api/v1/auth/github/callback"
            )
            if (
                self.github_auth_configured
                and self.github_redirect_uri != expected_github_callback
            ):
                raise ValueError(
                    "GITHUB_REDIRECT_URI must use PUBLIC_BASE_URL and the GitHub callback path"
                )
            expected_google_callback = (
                f"{self.public_base_url}/api/v1/auth/google/callback"
            )
            if (
                self.google_auth_configured
                and self.google_auth_redirect_uri != expected_google_callback
            ):
                raise ValueError(
                    "GOOGLE_AUTH_REDIRECT_URI must use PUBLIC_BASE_URL and the Google callback path"
                )
        if self.app_env == "production":
            for origin in self.allowed_origins:
                if (
                    "*" in origin
                    or not origin.startswith("https://")
                    or _origin(origin) != origin
                ):
                    raise ValueError(
                        "Production ALLOWED_ORIGINS must contain only exact HTTPS origins"
                    )
        if self.app_env == "production" and self.cloud_mode:
            if self.allow_cloud_processing and not self.cloud_ai_allowlist_configured:
                raise ValueError(
                    "Production cloud AI requires an explicit provider identity allowlist"
                )
            google_credentials_present = any(
                (
                    self.google_client_id,
                    self.google_client_secret,
                    self.google_refresh_token,
                    self.google_access_token,
                )
            )
            if google_credentials_present and not self.google_connector_allowlist_configured:
                raise ValueError(
                    "Production Google connectors require an explicit provider identity allowlist"
                )

    def ensure_directories(self) -> None:
        """Create mutable directories required by the application.

        Returns:
            None.

        Raises:
            OSError: If a directory cannot be created.

        Example:
            >>> settings = Settings.from_env()
            >>> settings.ensure_directories()
        """
        self.data_dir.mkdir(parents=True, exist_ok=True)
        for child in ("backups", "imports", "audio", "private"):
            (self.data_dir / child).mkdir(parents=True, exist_ok=True)
        if self.self_hosted_speech_enabled and self.whisper_model_cache_dir is not None:
            self.whisper_model_cache_dir.mkdir(parents=True, exist_ok=True)


def _origin(url: str) -> str:
    """Return the scheme and authority used for strict Origin checks."""
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f"Invalid absolute URL: {url!r}")
    return f"{parsed.scheme}://{parsed.netloc}"
