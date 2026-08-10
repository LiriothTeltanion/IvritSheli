"""
Module: configuration and Hebrew normalization tests
Purpose: Verify safe environment parsing, RTL text normalization, redaction, and transparent speech comparison.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from ivrit_sheli.config import Settings, load_env_file, parse_bool
from ivrit_sheli.normalization import (
    contains_hebrew,
    hebrew_tokens,
    normalize_hebrew,
    pronunciation_breakdown,
    redact_sensitive_text,
    similarity_ratio,
    strip_niqqud,
)


def test_parse_bool_accepts_common_values() -> None:
    assert parse_bool("YES") is True
    assert parse_bool("off") is False
    assert parse_bool(None, default=True) is True


def test_parse_bool_rejects_ambiguous_value() -> None:
    with pytest.raises(ValueError, match="Unsupported boolean"):
        parse_bool("sometimes")


def test_load_env_file_ignores_comments_and_quotes(tmp_path: Path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("# comment\nA=1\nB='two words'\ninvalid\n", encoding="utf-8")
    assert load_env_file(env_file) == {"A": "1", "B": "two words"}


def test_settings_create_private_data_directories(tmp_path: Path) -> None:
    settings = Settings.from_env(
        {
            "APP_DATA_DIR": str(tmp_path / "state"),
            "APP_DB_PATH": str(tmp_path / "state" / "app.db"),
            "DICTIONARY_DB_PATH": str(tmp_path / "state" / "dict.db"),
        }
    )
    assert settings.port == 8000
    assert (settings.data_dir / "private").is_dir()
    assert (settings.data_dir / "backups").is_dir()


def test_voice_style_provider_ids_are_server_configurable(tmp_path: Path) -> None:
    settings = Settings.from_env(
        {
            "APP_DATA_DIR": str(tmp_path / "state"),
            "APP_DB_PATH": str(tmp_path / "state" / "app.db"),
            "DICTIONARY_DB_PATH": str(tmp_path / "state" / "dict.db"),
            "OPENAI_TTS_VOICE_MASCULINE": "voice-low-test",
            "OPENAI_TTS_VOICE_FEMININE": "voice-bright-test",
        }
    )

    assert settings.openai_tts_voice_masculine == "voice-low-test"
    assert settings.openai_tts_voice_feminine == "voice-bright-test"


def test_local_only_launcher_marker_overrides_cloud_credentials(tmp_path: Path) -> None:
    settings = Settings.from_env(
        {
            "IVRIT_LOCAL_ONLY": "true",
            "APP_ENV": "production",
            "APP_DATA_DIR": str(tmp_path / "state"),
            "DATABASE_URL": "postgresql://ivrit_sheli_runtime:secret@db/ivrit",
            "AUTH_REQUIRED": "true",
            "SESSION_COOKIE_SECURE": "true",
            "TRUSTED_PROXY_MODE": "railway",
            "RAILWAY_ENVIRONMENT_ID": "railway-production",
            "GITHUB_CLIENT_ID": "github-client",
            "GITHUB_CLIENT_SECRET": "github-secret",
            "GOOGLE_AUTH_CLIENT_ID": "google-client",
            "GOOGLE_AUTH_CLIENT_SECRET": "google-secret",
        }
    )

    assert settings.app_env == "local"
    assert settings.cloud_mode is False
    assert settings.auth_required is False
    assert settings.session_cookie_secure is False
    assert settings.trusted_proxy_mode == "direct"
    assert settings.auth_providers == ()


def test_development_local_companion_requires_an_exact_loopback_origin(
    tmp_path: Path,
) -> None:
    base = {
        "APP_ENV": "development",
        "APP_DATA_DIR": str(tmp_path / "state"),
        "APP_DB_PATH": str(tmp_path / "state" / "app.db"),
        "DICTIONARY_DB_PATH": str(tmp_path / "state" / "dict.db"),
    }

    settings = Settings.from_env(
        {**base, "LOCAL_COMPANION_URL": "http://127.0.0.1:8001/"}
    )
    assert settings.local_companion_url == "http://127.0.0.1:8001"

    with pytest.raises(ValueError, match="exact loopback HTTP origin"):
        Settings.from_env(
            {**base, "LOCAL_COMPANION_URL": "https://example.test/local"}
        )

    invalid_values = (
        "http://127.0.0.1",
        "http://user@127.0.0.1:8001",
        "http://127.0.0.1:8001/workspace",
        "http://127.0.0.1:99999",
    )
    for invalid_value in invalid_values:
        with pytest.raises(ValueError, match="exact loopback HTTP origin"):
            Settings.from_env({**base, "LOCAL_COMPANION_URL": invalid_value})


def test_hebrew_normalization_is_niqqud_and_punctuation_insensitive() -> None:
    assert strip_niqqud("שָׁלוֹם") == "שלום"
    assert normalize_hebrew("  שָׁלוֹם!  ") == "שלום"
    assert similarity_ratio("שָׁלוֹם", "שלום") == 1.0


def test_hebrew_token_detection_preserves_order() -> None:
    text = "Say שלום, בבקשה — תודה!"
    assert contains_hebrew(text) is True
    assert hebrew_tokens(text) == ["שלום", "בבקשה", "תודה"]


def test_redaction_removes_common_personal_identifiers() -> None:
    redacted, labels = redact_sensitive_text(
        "Email me at learner@example.com or +972 54 123 4567; ID 123456789"
    )
    assert "learner@example.com" not in redacted
    assert "123456789" not in redacted
    assert {"email", "phone", "long_identifier"}.issubset(set(labels))


def test_pronunciation_breakdown_is_transparent() -> None:
    exact = pronunciation_breakdown("תודה רבה", "תודה רבה")
    partial = pronunciation_breakdown("תודה רבה", "תודה")
    assert exact.score == 100
    assert partial.score < exact.score
    assert "רבה" in partial.missing_words


def test_pronunciation_requires_a_target() -> None:
    with pytest.raises(ValueError, match="target"):
        pronunciation_breakdown("!!!", "שלום")
