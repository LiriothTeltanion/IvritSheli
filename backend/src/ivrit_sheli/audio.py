"""
Module: audio learning
Purpose: Coordinate browser/OpenAI speech, transparent pronunciation scoring, and privacy-conscious attempt storage.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import base64
import logging
import mimetypes
import time
from dataclasses import asdict
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

import requests

from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.normalization import pronunciation_breakdown
from ivrit_sheli.repository import LearningRepository
from ivrit_sheli.self_hosted_speech import (
    MAX_SPEECH_AUDIO_BYTES,
    SUPPORTED_SPEECH_SUFFIXES,
    SelfHostedSpeechBusy,
    SelfHostedSpeechError,
    SelfHostedSpeechNoSpeech,
    SelfHostedSpeechProvider,
    SelfHostedSpeechTimeout,
    SelfHostedSpeechUnavailable,
    probe_audio_duration,
    shared_self_hosted_speech_provider,
    validate_speech_input,
)

LOGGER = logging.getLogger(__name__)
OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions"
OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech"
SUPPORTED_AUDIO_SUFFIXES = SUPPORTED_SPEECH_SUFFIXES
MAX_AUDIO_BYTES = MAX_SPEECH_AUDIO_BYTES
VoiceStyle = Literal["masculine", "feminine"]
TranscriptionMode = Literal["self_hosted", "openai"]


class AudioProviderError(RuntimeError):
    """Raised when a configured audio provider cannot complete a request."""

    status_code = 502
    code = "audio_provider_error"
    retry_after: int | None = None


class AudioServiceUnavailable(AudioProviderError):
    """Raised when the requested speech runtime is disabled or missing."""

    status_code = 503
    code = "audio_service_unavailable"


class AudioServiceBusy(AudioProviderError):
    """Raised when the bounded local worker is already processing audio."""

    status_code = 503
    code = "audio_service_busy"
    retry_after = 3


class AudioTranscriptionTimeout(AudioProviderError):
    """Raised when speech recognition exceeds its request deadline."""

    status_code = 504
    code = "audio_transcription_timeout"


class AudioNoSpeech(AudioProviderError):
    """Raised when valid audio contains no recognizable Hebrew speech."""

    status_code = 422
    code = "audio_no_speech"


class AudioProviderCapacityError(AudioProviderError):
    """Raised when cloud transcription is temporarily saturated."""

    status_code = 429
    code = "audio_provider_capacity"
    retry_after = 20


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

    @staticmethod
    def _parse_openai_error(payload: Any) -> tuple[str | None, str | None]:
        """Read machine code and message from an OpenAI error payload."""
        if not isinstance(payload, dict):
            return (None, None)
        error_payload = payload.get("error")
        if not isinstance(error_payload, dict):
            return (None, None)
        code = error_payload.get("code")
        if code is not None:
            code = str(code)
        message = error_payload.get("message")
        return (code, str(message) if message is not None else None)

    @staticmethod
    def _safe_json(response: requests.Response) -> dict[str, Any] | None:
        """Best-effort JSON read from an HTTP response."""
        try:
            parsed = response.json()
        except ValueError:
            return None
        return parsed if isinstance(parsed, dict) else None

    @staticmethod
    def _parse_retry_after(value: str | None) -> int | None:
        """Extract a bounded integer `Retry-After` value."""
        if not value:
            return None
        try:
            seconds = int(value.strip())
        except ValueError:
            return None
        if seconds <= 0:
            return None
        return min(seconds, 120)

    def _is_capacity_error(
        self,
        status_code: int,
        error_code: str | None,
        message: str | None,
    ) -> bool:
        """Detect provider saturation from OpenAI status/error metadata."""
        if status_code == 429:
            return True
        normalized_code = (error_code or "").lower()
        normalized_message = (message or "").lower()
        capacity_tokens = (
            "capacity",
            "overloaded",
            "overload",
            "busy",
            "too many requests",
            "rate limit",
            "service temporarily unavailable",
            "currently unavailable",
            "temporarily unavailable",
        )
        return (
            status_code == 503 and (
                normalized_code in {"rate_limit_exceeded", "service_overloaded"}
                or any(token in normalized_message for token in capacity_tokens)
            )
        )

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
            if not response.ok:
                error_payload = self._safe_json(response)
                error_code, error_message = self._parse_openai_error(error_payload)
                if self._is_capacity_error(
                    response.status_code,
                    error_code,
                    error_message,
                ):
                    error = AudioProviderCapacityError(
                        f"OpenAI speech transcription is temporarily unavailable: "
                        f"{error_message or 'service is at capacity'}"
                    )
                    error.retry_after = self._parse_retry_after(response.headers.get("Retry-After"))
                    raise error
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
        self_hosted_provider: SelfHostedSpeechProvider | None = None,
    ) -> None:
        self.settings = settings
        self.database = database
        self.provider = provider or OpenAIAudioProvider(settings)
        self.self_hosted_provider = (
            self_hosted_provider or shared_self_hosted_speech_provider(settings)
        )

    def capabilities(self) -> dict[str, Any]:
        """Describe server speech and client fallbacks without loading a model."""

        return {
            "self_hosted": self.self_hosted_provider.capabilities(),
            "openai": {
                "configured": bool(
                    self.settings.allow_cloud_processing
                    and self.settings.openai_api_key
                ),
                "model": self.settings.openai_transcribe_model,
                "requires_explicit_action": True,
            },
            "limits": {
                "max_bytes": MAX_AUDIO_BYTES,
                "max_duration_seconds": self.settings.whisper_max_duration_seconds,
            },
            "fallbacks": ["browser_speech_recognition", "manual_input"],
            "audio_retention": "device_only",
        }

    def tts(
        self,
        text: str,
        *,
        cloud_requested: bool = False,
        voice_style: VoiceStyle = "feminine",
        retain: bool = False,
    ) -> dict[str, Any]:
        """Return cloud-generated audio or browser speech instructions.

        Args:
            text: Hebrew text.
            cloud_requested: Explicit cloud action from the user.
            voice_style: Learner-facing synthetic voice profile.
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
        voice_id = self._voice_id(voice_style)
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
                "voice_style": voice_style,
                "voice_profile": {
                    "language": "he-IL",
                    "pitch": 0.9 if voice_style == "masculine" else 1.04,
                },
                "degraded_mode": cloud_requested,
                "message": "Use speechSynthesis in the browser; installed voices vary by device.",
            }

        started = time.perf_counter()
        try:
            content = self.provider.synthesize(
                clean_text,
                voice=voice_id,
                instructions=(
                    "Speak clear, natural modern Israeli Hebrew at a learner-friendly pace "
                    f"with a {voice_style} vocal style. This is a synthetic style direction, "
                    "not a claim about the speaker's identity."
                ),
            )
        except Exception as error:
            LOGGER.warning("Cloud TTS failed; returning browser fallback: %s", error)
            return {
                "provider": "browser",
                "model": "Web Speech API",
                "text": clean_text,
                "language": "he-IL",
                "voice_style": voice_style,
                "voice_profile": {
                    "language": "he-IL",
                    "pitch": 0.9 if voice_style == "masculine" else 1.04,
                },
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
            "voice": voice_id,
            "voice_style": voice_style,
            "mime_type": "audio/mpeg",
            "audio_base64": base64.b64encode(content).decode("ascii"),
            "retained_path": retained_path,
            "degraded_mode": False,
            "latency_ms": round((time.perf_counter() - started) * 1000),
        }

    def _voice_id(self, voice_style: VoiceStyle) -> str:
        """Resolve a learner-facing style to one server-controlled provider voice ID."""
        if voice_style == "masculine":
            return self.settings.openai_tts_voice_masculine
        if voice_style == "feminine":
            return self.settings.openai_tts_voice_feminine
        raise ValueError("Unsupported voice style")

    def transcribe(
        self,
        audio_path: Path,
        *,
        cloud_requested: bool = False,
        mode: TranscriptionMode | None = None,
        language: str = "he",
        delete_after: bool = True,
    ) -> dict[str, Any]:
        """Validate and transcribe an uploaded recording.

        Args:
            audio_path: Temporary local file.
            cloud_requested: Legacy explicit request for the OpenAI mode.
            mode: Self-hosted or OpenAI transcription mode. When omitted, the
                method preserves the previous explicit-cloud client behavior.
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
        selected_mode: TranscriptionMode = mode or "openai"
        result: dict[str, Any]
        duration_seconds: float | None = None
        audio_deleted = False
        reported_mode: TranscriptionMode = selected_mode
        try:
            validate_audio_file(audio_path)
            if selected_mode == "self_hosted":
                try:
                    result = self.self_hosted_provider.transcribe(
                        audio_path,
                        language=language,
                    )
                except SelfHostedSpeechUnavailable as error:
                    raise AudioServiceUnavailable(str(error)) from error
                except SelfHostedSpeechBusy as error:
                    raise AudioServiceBusy(str(error)) from error
                except SelfHostedSpeechTimeout as error:
                    raise AudioTranscriptionTimeout(str(error)) from error
                except SelfHostedSpeechNoSpeech as error:
                    raise AudioNoSpeech(str(error)) from error
                except SelfHostedSpeechError as error:
                    raise AudioProviderError(str(error)) from error
            elif selected_mode == "openai":
                duration_seconds = validate_speech_input(
                    audio_path,
                    duration_probe=probe_audio_duration,
                    max_duration_seconds=self.settings.whisper_max_duration_seconds,
                )
                if not cloud_requested:
                    raise ValueError(
                        "OpenAI transcription requires an explicit user action"
                    )
                if not self.settings.allow_cloud_processing:
                    raise ValueError("Cloud processing is disabled in server settings")
                try:
                    result = self.provider.transcribe(audio_path, language=language)
                except AudioProviderCapacityError as error:
                    if self.self_hosted_provider.available:
                        LOGGER.warning(
                            "OpenAI STT capacity; falling back to self-hosted provider: %s",
                            error,
                        )
                        result = self.self_hosted_provider.transcribe(
                            audio_path,
                            language=language,
                            duration_seconds=duration_seconds,
                        )
                        reported_mode = "self_hosted"
                    else:
                        raise
            else:
                raise ValueError(f"Unsupported transcription mode: {selected_mode}")
        finally:
            if delete_after:
                audio_deleted = _delete_temporary_audio(audio_path)
                if not audio_deleted:
                    raise AudioProviderError(
                        "Temporary speech audio could not be deleted safely"
                    )
        worker_audio_deleted = bool(result.get("worker_audio_deleted", True))
        if selected_mode == "self_hosted" and not worker_audio_deleted:
            raise AudioProviderError(
                "Private speech worker audio could not be deleted safely"
            )
        return {
            **result,
            "duration_seconds": result.get(
                "duration_seconds",
                round(duration_seconds, 3)
                if duration_seconds is not None
                else None,
            ),
            "mode": reported_mode,
            "audio_deleted": audio_deleted and worker_audio_deleted,
        }

    def score(
        self,
        target_text: str,
        transcript: str,
        *,
        item_id: int | None = None,
        provider: str = "browser",
        retained_path: str | None = None,
        verified_speech_evidence: bool = False,
        evidence_key: str | None = None,
    ) -> dict[str, Any]:
        """Score and store transparent transcript-similarity practice.

        Args:
            target_text: Expected phrase.
            transcript: Recognized learner speech.
            item_id: Optional learning-item link.
            provider: Speech recognition provider.
            retained_path: Optional local audio path retained by explicit choice.
            verified_speech_evidence: Whether the server attested the speech evidence.

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
        learning_update = LearningRepository(self.database).record_pronunciation_attempt(
            target_text=target_text,
            transcript=transcript,
            score=breakdown.score,
            breakdown=asdict(breakdown),
            provider=provider,
            item_id=item_id,
            retained_path=retained_path,
            verified_speech_evidence=verified_speech_evidence,
            evidence_key=evidence_key,
        )
        return {
            **learning_update,
            **asdict(breakdown),
            "feedback": feedback,
            "method": "transcript_similarity",
            "assessment_type": "transcript_recognition_match",
            "display_label": "Recognition match",
            "verified_speech_evidence": verified_speech_evidence,
            "audio_retained": retained_path is not None,
            "limitations": (
                "Recognition match measures transcript similarity and word coverage; it does "
                "not assess phonemes, accent, intelligibility, native-likeness, or clinical "
                "speech quality."
            ),
        }


def _delete_temporary_audio(path: Path) -> bool:
    """Delete one private temporary recording with short Windows-safe retries."""
    for delay in (0.0, 0.05, 0.2):
        if delay:
            time.sleep(delay)
        try:
            path.unlink(missing_ok=True)
        except OSError:
            continue
        if not path.exists():
            return True
    return not path.exists()


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
        raise ValueError("Audio file exceeds the 8 MB speech limit")


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
