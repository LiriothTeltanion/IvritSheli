"""
Module: audio learning
Purpose: Coordinate browser/OpenAI speech, transparent pronunciation scoring, and privacy-conscious attempt storage.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import base64
import json
import logging
import mimetypes
import sqlite3
import time
from dataclasses import asdict
from pathlib import Path
from typing import Any
from uuid import uuid4

import requests

from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.normalization import pronunciation_breakdown
from ivrit_sheli.repository import iso_now

LOGGER = logging.getLogger(__name__)
OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions"
OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech"
SUPPORTED_AUDIO_SUFFIXES = {".flac", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".ogg", ".wav", ".webm"}
MAX_AUDIO_BYTES = 25 * 1024 * 1024


class AudioProviderError(RuntimeError):
    """Raised when a cloud audio provider cannot complete a request."""


class OpenAIAudioProvider:
    """Server-side OpenAI speech-to-text and text-to-speech adapter.

    Args:
        settings: Provider model and API configuration.
        session: Optional requests session for deterministic tests.

    Example:
        Use through `AudioService`; direct calls require explicit cloud consent.
    """

    name = "openai"

    def __init__(
        self, settings: Settings, session: requests.Session | None = None
    ) -> None:
        self.settings = settings
        self.session = session or requests.Session()

    def transcribe(self, audio_path: Path, language: str = "he") -> dict[str, Any]:
        """Transcribe an audio file.

        Args:
            audio_path: Validated local audio path.
            language: ISO language hint.

        Returns:
            Provider transcript payload.

        Raises:
            AudioProviderError: If configuration or request fails.

        Example:
            Network behavior is tested with a fake session.
        """
        self._require_key()
        mime_type = mimetypes.guess_type(audio_path.name)[0] or "application/octet-stream"
        try:
            with audio_path.open("rb") as handle:
                response = self.session.post(
                    OPENAI_TRANSCRIPTIONS_URL,
                    headers={"Authorization": f"Bearer {self.settings.openai_api_key}"},
                    files={"file": (audio_path.name, handle, mime_type)},
                    data={
                        "model": self.settings.openai_transcribe_model,
                        "language": language,
                        "response_format": "json",
                    },
                    timeout=(10, 120),
                )
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, OSError, ValueError) as error:
            raise AudioProviderError(f"Speech transcription failed: {error}") from error
        transcript = str(payload.get("text", "")).strip()
        if not transcript:
            raise AudioProviderError("Speech provider returned an empty transcript")
        return {
            "provider": self.name,
            "model": self.settings.openai_transcribe_model,
            "transcript": transcript,
            "raw": payload,
        }

    def synthesize(
        self,
        text: str,
        *,
        voice: str | None = None,
        instructions: str = "Speak clear, natural modern Israeli Hebrew at a learner-friendly pace.",
        response_format: str = "mp3",
    ) -> bytes:
        """Generate pronunciation audio.

        Args:
            text: Hebrew text to speak.
            voice: Optional provider voice.
            instructions: Speaking style guidance.
            response_format: Provider audio format.

        Returns:
            Raw audio bytes.

        Raises:
            AudioProviderError: If configuration or request fails.

        Example:
            Network behavior is tested with a fake session.
        """
        self._require_key()
        if not text.strip():
            raise ValueError("text is required")
        try:
            response = self.session.post(
                OPENAI_SPEECH_URL,
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.openai_tts_model,
                    "voice": voice or self.settings.openai_tts_voice,
                    "input": text[:4000],
                    "instructions": instructions[:500],
                    "response_format": response_format,
                },
                timeout=(10, 120),
            )
            response.raise_for_status()
        except requests.RequestException as error:
            raise AudioProviderError(f"Speech generation failed: {error}") from error
        if not response.content:
            raise AudioProviderError("Speech provider returned no audio")
        return bytes(response.content)

    def _require_key(self) -> None:
        """Validate provider configuration.

        Returns:
            None.

        Raises:
            AudioProviderError: If no key is configured.

        Example:
            Called internally before every provider request.
        """
        if not self.settings.openai_api_key:
            raise AudioProviderError("OPENAI_API_KEY is not configured")


class AudioService:
    """High-level audio service with browser fallback and attempt persistence.

    Args:
        settings: Application configuration.
        database: Learner database.
        provider: Optional cloud adapter override for tests.

    Example:
        >>> from pathlib import Path
        >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
        >>> db = Database(Path(":memory:")); db.initialize()
        >>> AudioService(settings, db).score("שלום", "שלום")["score"]
        100
    """

    def __init__(
        self,
        settings: Settings,
        database: Database,
        provider: OpenAIAudioProvider | None = None,
    ) -> None:
        self.settings = settings
        self.database = database
        self.provider = provider or OpenAIAudioProvider(settings)

    def tts(
        self,
        text: str,
        *,
        cloud_requested: bool = False,
        voice: str | None = None,
        retain: bool = False,
    ) -> dict[str, Any]:
        """Return cloud-generated audio or browser speech instructions.

        Args:
            text: Hebrew text.
            cloud_requested: Explicit cloud action from the user.
            voice: Optional provider voice.
            retain: Whether to save generated audio locally.

        Returns:
            Browser fallback metadata or base64 audio payload.

        Raises:
            ValueError: If text is empty.

        Example:
            >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
            >>> db = Database(Path(":memory:")); db.initialize()
            >>> AudioService(settings, db).tts("שלום")["provider"]
            'browser'
        """
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("text is required")
        may_use_cloud = (
            cloud_requested
            and self.settings.allow_cloud_processing
            and self.settings.ai_provider == "openai"
            and bool(self.settings.openai_api_key)
        )
        if not may_use_cloud:
            return {
                "provider": "browser",
                "model": "Web Speech API",
                "text": clean_text,
                "language": "he-IL",
                "degraded_mode": cloud_requested,
                "message": "Use speechSynthesis in the browser; installed voices vary by device.",
            }

        started = time.perf_counter()
        try:
            content = self.provider.synthesize(clean_text, voice=voice)
        except Exception as error:
            LOGGER.warning("Cloud TTS failed; returning browser fallback: %s", error)
            return {
                "provider": "browser",
                "model": "Web Speech API",
                "text": clean_text,
                "language": "he-IL",
                "degraded_mode": True,
                "message": "Cloud voice failed; browser speech remains available.",
            }

        retained_path: str | None = None
        if retain:
            output = self.settings.data_dir / "audio" / f"tts-{uuid4().hex}.mp3"
            output.write_bytes(content)
            retained_path = str(output)
        return {
            "provider": "openai",
            "model": self.settings.openai_tts_model,
            "voice": voice or self.settings.openai_tts_voice,
            "mime_type": "audio/mpeg",
            "audio_base64": base64.b64encode(content).decode("ascii"),
            "retained_path": retained_path,
            "degraded_mode": False,
            "latency_ms": round((time.perf_counter() - started) * 1000),
        }

    def transcribe(
        self,
        audio_path: Path,
        *,
        cloud_requested: bool,
        language: str = "he",
        delete_after: bool = True,
    ) -> dict[str, Any]:
        """Validate and transcribe an uploaded recording.

        Args:
            audio_path: Temporary local file.
            cloud_requested: Explicit user request.
            language: ISO language hint.
            delete_after: Delete temporary input after processing.

        Returns:
            Transcript result or an actionable browser fallback.

        Raises:
            ValueError: If file is unsafe or cloud consent is absent.
            AudioProviderError: If the provider fails.

        Example:
            Actual network behavior is covered by fake-provider tests.
        """
        validate_audio_file(audio_path)
        try:
            if not cloud_requested:
                raise ValueError("Cloud transcription requires an explicit user action")
            if not self.settings.allow_cloud_processing:
                raise ValueError("Cloud processing is disabled in server settings")
            return self.provider.transcribe(audio_path, language=language)
        finally:
            if delete_after:
                audio_path.unlink(missing_ok=True)

    def score(
        self,
        target_text: str,
        transcript: str,
        *,
        item_id: int | None = None,
        provider: str = "browser",
        retained_path: str | None = None,
    ) -> dict[str, Any]:
        """Score and store a transcript-based speaking attempt.

        Args:
            target_text: Expected phrase.
            transcript: Recognized learner speech.
            item_id: Optional learning-item link.
            provider: Speech recognition provider.
            retained_path: Optional local audio path retained by explicit choice.

        Returns:
            Transparent score breakdown and coaching feedback.

        Raises:
            ValueError: If target is empty.

        Example:
            >>> from pathlib import Path
            >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
            >>> db = Database(Path(":memory:")); db.initialize()
            >>> AudioService(settings, db).score("תודה רבה", "תודה")["score"] < 100
            True
        """
        breakdown = pronunciation_breakdown(target_text, transcript)
        feedback = pronunciation_feedback(breakdown.score, breakdown.missing_words, breakdown.extra_words)
        with self.database.transaction() as connection:
            cursor = connection.execute(
                """
                INSERT INTO audio_attempts(
                    item_id, target_text, transcript, score, breakdown_json,
                    provider, retained_path, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    target_text,
                    transcript,
                    breakdown.score,
                    json.dumps(asdict(breakdown), ensure_ascii=False),
                    provider,
                    retained_path,
                    iso_now(),
                ),
            )
            attempt_id_raw = cursor.lastrowid
            if attempt_id_raw is None:
                raise sqlite3.DatabaseError("SQLite did not return an audio attempt ID")
            attempt_id = int(attempt_id_raw)
        return {
            "attempt_id": attempt_id,
            **asdict(breakdown),
            "feedback": feedback,
            "method": "transcript_similarity",
            "limitations": (
                "This score measures transcription similarity and word coverage; "
                "it is not phoneme-level or clinical pronunciation assessment."
            ),
        }


def validate_audio_file(path: Path) -> None:
    """Validate audio extension and maximum provider upload size.

    Args:
        path: File to validate.

    Returns:
        None.

    Raises:
        FileNotFoundError: If file is missing.
        ValueError: If extension or size is unsupported.

    Example:
        The behavior is covered with temporary files in tests.
    """
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {path}")
    if path.suffix.lower() not in SUPPORTED_AUDIO_SUFFIXES:
        raise ValueError(f"Unsupported audio format: {path.suffix or 'unknown'}")
    size = path.stat().st_size
    if size <= 0:
        raise ValueError("Audio file is empty")
    if size > MAX_AUDIO_BYTES:
        raise ValueError("Audio file exceeds the 25 MB provider limit")


def pronunciation_feedback(
    score: int, missing_words: tuple[str, ...], extra_words: tuple[str, ...]
) -> dict[str, Any]:
    """Translate a numeric score into specific next actions.

    Args:
        score: Pronunciation score from 0 to 100.
        missing_words: Target words omitted by transcription.
        extra_words: Unexpected transcript words.

    Returns:
        Trilingual-friendly coaching object.

    Example:
        >>> pronunciation_feedback(92, (), ())["band"]
        'excellent'
    """
    if score >= 90:
        band = "excellent"
        message = "Clear match. Repeat once at natural speed."
    elif score >= 75:
        band = "good"
        message = "Good match. Slow down around the least stable word."
    elif score >= 55:
        band = "developing"
        message = "Practice in two chunks, then join the phrase."
    else:
        band = "retry"
        message = "Listen once, shadow slowly, and record again."
    return {
        "band": band,
        "message_en": message,
        "message_es": {
            "excellent": "Coincidencia clara. Repite una vez a velocidad natural.",
            "good": "Buena coincidencia. Reduce la velocidad en la palabra menos estable.",
            "developing": "Practica en dos partes y luego une la frase.",
            "retry": "Escucha una vez, repite lentamente y graba de nuevo.",
        }[band],
        "missing_words": list(missing_words),
        "extra_words": list(extra_words),
    }
