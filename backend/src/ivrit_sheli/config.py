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
        dicta_nakdan_url: Optional Dicta-compatible endpoint.
        google_client_id: Optional OAuth client ID.
        google_client_secret: Optional OAuth client secret.
        google_refresh_token: Optional refresh token.
        google_access_token: Optional access token.

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
    dicta_nakdan_url: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    google_access_token: str = ""
    google_redirect_uri: str = "http://127.0.0.1:8765/oauth/callback"

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

        settings = cls(
            root_dir=root_dir,
            data_dir=data_dir,
            db_path=db_path,
            dictionary_db_path=dictionary_path,
            frontend_dist=root_dir / "frontend" / "dist",
            host=value("APP_HOST", "127.0.0.1"),
            port=int(value("APP_PORT", "8000")),
            app_env=value("APP_ENV", "development"),
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
            dicta_nakdan_url=value("DICTA_NAKDAN_URL", ""),
            google_client_id=value("GOOGLE_CLIENT_ID", ""),
            google_client_secret=value("GOOGLE_CLIENT_SECRET", ""),
            google_refresh_token=value("GOOGLE_REFRESH_TOKEN", ""),
            google_access_token=value("GOOGLE_ACCESS_TOKEN", ""),
            google_redirect_uri=value(
                "GOOGLE_REDIRECT_URI", "http://127.0.0.1:8765/oauth/callback"
            ),
        )
        settings.ensure_directories()
        return settings

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
