"""Self-hosted Hebrew speech recognition backed by Faster Whisper.

The provider is intentionally lazy: importing the application does not load a
model or allocate inference memory. A configured worker loads one multilingual
``small`` model on first use and serializes transcription jobs so an initial
CPU deployment cannot be exhausted by concurrent recordings.
"""

from __future__ import annotations

import importlib
import importlib.util
import shutil
import threading
import time
from collections.abc import Callable, Iterable
from concurrent.futures import (
    Future,
    ThreadPoolExecutor,
)
from concurrent.futures import (
    TimeoutError as FutureTimeout,
)
from pathlib import Path
from typing import Any, Protocol, cast
from uuid import uuid4

from ivrit_sheli.config import Settings
from ivrit_sheli.normalization import normalize_hebrew

MAX_SPEECH_AUDIO_BYTES = 8 * 1024 * 1024
MAX_SPEECH_AUDIO_SECONDS = 20.0
STALE_WORKER_MAX_AGE_SECONDS = 6 * 60 * 60
SUPPORTED_SPEECH_SUFFIXES = frozenset(
    {".flac", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".ogg", ".wav", ".webm"}
)


class SelfHostedSpeechError(RuntimeError):
    """Base error for bounded self-hosted transcription failures."""


class SelfHostedSpeechUnavailable(SelfHostedSpeechError):
    """Raised when the worker is disabled or its runtime is unavailable."""


class SelfHostedSpeechBusy(SelfHostedSpeechError):
    """Raised when the single v2.9 inference slot is occupied."""


class SelfHostedSpeechTimeout(SelfHostedSpeechError):
    """Raised when transcription exceeds the configured request deadline."""


class SelfHostedSpeechNoSpeech(SelfHostedSpeechError):
    """Raised when decoding succeeds but no Hebrew speech is present."""


class SpeechSegment(Protocol):
    """Minimal Faster Whisper segment contract used by the provider."""

    text: str


class SpeechInfo(Protocol):
    """Minimal Faster Whisper metadata contract used by the provider."""

    language: str
    language_probability: float


class WhisperModel(Protocol):
    """Model behavior required by ``SelfHostedSpeechProvider``."""

    def transcribe(
        self,
        audio: str,
        *,
        language: str,
        beam_size: int,
        vad_filter: bool,
        vad_parameters: dict[str, int],
        condition_on_previous_text: bool,
    ) -> tuple[Iterable[SpeechSegment], SpeechInfo]:
        """Return lazily decoded segments and provider metadata."""


ModelFactory = Callable[[Settings], WhisperModel]
DurationProbe = Callable[[Path], float]
_SHARED_PROVIDER_LOCK = threading.Lock()
_SHARED_PROVIDERS: dict[
    tuple[bool, str, str, str, str, int, float, str],
    SelfHostedSpeechProvider,
] = {}


def faster_whisper_runtime_available() -> bool:
    """Return whether both Faster Whisper and its audio decoder are importable."""

    return (
        importlib.util.find_spec("faster_whisper") is not None
        and importlib.util.find_spec("av") is not None
    )


def probe_audio_duration(path: Path) -> float:
    """Read media duration through PyAV, decoding metadata-free mobile fragments."""

    try:
        av = importlib.import_module("av")
        with av.open(str(path), mode="r") as container:
            if container.duration is not None:
                duration = float(container.duration / av.time_base)
            else:
                durations = [
                    float(stream.duration * stream.time_base)
                    for stream in container.streams.audio
                    if stream.duration is not None and stream.time_base is not None
                ]
                duration = max(durations, default=0.0)
            if duration <= 0:
                audio_streams = list(container.streams.audio)
                if not audio_streams:
                    raise ValueError("Audio file contains no audio stream")
                duration = 0.0
                decoded_samples = 0
                sample_rate = 0
                for frame in container.decode(audio=0):
                    frame_rate = int(getattr(frame, "sample_rate", 0) or 0)
                    frame_samples = int(getattr(frame, "samples", 0) or 0)
                    if frame_rate > 0 and frame_samples > 0:
                        decoded_samples += frame_samples
                        sample_rate = frame_rate
                        duration = max(duration, decoded_samples / sample_rate)
                    frame_time = getattr(frame, "time", None)
                    if frame_time is not None and frame_rate > 0:
                        duration = max(
                            duration,
                            float(frame_time) + (frame_samples / frame_rate),
                        )
                    if duration > MAX_SPEECH_AUDIO_SECONDS + 1:
                        break
    except Exception as error:
        raise ValueError("Audio duration could not be read") from error
    if duration <= 0:
        raise ValueError("Audio duration could not be read")
    return duration


def validate_speech_input(
    path: Path,
    *,
    duration_probe: DurationProbe = probe_audio_duration,
    max_bytes: int = MAX_SPEECH_AUDIO_BYTES,
    max_duration_seconds: float = MAX_SPEECH_AUDIO_SECONDS,
) -> float:
    """Validate the self-hosted speech file and return its measured duration."""

    if not path.exists():
        raise FileNotFoundError("Audio file was not found")
    if path.suffix.lower() not in SUPPORTED_SPEECH_SUFFIXES:
        raise ValueError(f"Unsupported audio format: {path.suffix or 'unknown'}")
    size = path.stat().st_size
    if size <= 0:
        raise ValueError("Audio file is empty")
    if size > max_bytes:
        raise ValueError("Audio file exceeds the 8 MB speech limit")
    duration = duration_probe(path)
    if duration > max_duration_seconds:
        raise ValueError("Audio recording exceeds the 20 second speech limit")
    return duration


def _default_model_factory(settings: Settings) -> WhisperModel:
    """Build the pinned CPU INT8 multilingual model lazily."""

    try:
        module = importlib.import_module("faster_whisper")
        model_type = module.WhisperModel
        model = model_type(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
            download_root=(
                str(settings.whisper_model_cache_dir)
                if settings.whisper_model_cache_dir is not None
                else None
            ),
        )
    except Exception as error:
        raise SelfHostedSpeechUnavailable(
            "The self-hosted Hebrew speech model could not be loaded"
        ) from error
    return cast(WhisperModel, model)


class SelfHostedSpeechProvider:
    """Bounded Faster Whisper provider for short Hebrew recordings."""

    name = "self_hosted"

    def __init__(
        self,
        settings: Settings,
        *,
        model_factory: ModelFactory = _default_model_factory,
        duration_probe: DurationProbe = probe_audio_duration,
        runtime_available: Callable[[], bool] = faster_whisper_runtime_available,
        executor: ThreadPoolExecutor | None = None,
    ) -> None:
        self.settings = settings
        self._model_factory = model_factory
        self._duration_probe = duration_probe
        self._runtime_available = runtime_available
        self._model: WhisperModel | None = None
        self._model_lock = threading.Lock()
        self._slot = threading.BoundedSemaphore(value=1)
        self._executor = executor
        self._executor_lock = threading.Lock()

    @property
    def available(self) -> bool:
        """Return whether the configured worker can accept a future request."""

        return self.settings.self_hosted_speech_enabled and self._runtime_available()

    @property
    def model_loaded(self) -> bool:
        """Return whether the model has already been initialized in this process."""

        return self._model is not None

    def capabilities(self) -> dict[str, Any]:
        """Describe the server-side speech contract without loading the model."""

        available = self.available
        if not self.settings.self_hosted_speech_enabled:
            status = "disabled"
        elif not available:
            status = "runtime_unavailable"
        elif self.model_loaded:
            status = "ready"
        else:
            status = "cold"
        return {
            "provider": self.name,
            "configured": self.settings.self_hosted_speech_enabled,
            "available": available,
            "status": status,
            "model": self.settings.whisper_model,
            "language": self.settings.whisper_language,
            "device": self.settings.whisper_device,
            "compute_type": self.settings.whisper_compute_type,
            "vad": True,
            "max_bytes": MAX_SPEECH_AUDIO_BYTES,
            "max_duration_seconds": self.settings.whisper_max_duration_seconds,
            "timeout_seconds": self.settings.whisper_timeout_seconds,
            "max_concurrency": 1,
        }

    def validate_input(self, audio_path: Path) -> float:
        """Validate one upload with this provider's bounded duration probe."""
        return validate_speech_input(
            audio_path,
            duration_probe=self._duration_probe,
            max_duration_seconds=self.settings.whisper_max_duration_seconds,
        )

    def preload(self) -> dict[str, Any]:
        """Load the configured model before the service reports ready."""

        if not self.settings.self_hosted_speech_enabled:
            raise SelfHostedSpeechUnavailable(
                "Self-hosted speech recognition is disabled in server settings"
            )
        if not self._runtime_available():
            raise SelfHostedSpeechUnavailable(
                "Self-hosted speech recognition dependencies are unavailable"
            )
        started = time.perf_counter()
        self._get_model()
        return {
            "provider": self.name,
            "model": self.settings.whisper_model,
            "status": "ready",
            "load_latency_ms": round((time.perf_counter() - started) * 1000),
        }

    def transcribe(
        self,
        audio_path: Path,
        language: str = "he",
        *,
        duration_seconds: float | None = None,
    ) -> dict[str, Any]:
        """Transcribe one validated Hebrew recording within bounded resources."""

        if not self.settings.self_hosted_speech_enabled:
            raise SelfHostedSpeechUnavailable(
                "Self-hosted speech recognition is disabled in server settings"
            )
        if not self._runtime_available():
            raise SelfHostedSpeechUnavailable(
                "Self-hosted speech recognition dependencies are unavailable"
            )
        if not self._slot.acquire(blocking=False):
            raise SelfHostedSpeechBusy(
                "The speech worker is processing another recording; retry shortly"
            )

        started = time.perf_counter()
        worker_path = audio_path.with_name(
            f".whisper-{uuid4().hex}{audio_path.suffix.lower()}"
        )
        try:
            measured_duration = (
                self.validate_input(audio_path)
                if duration_seconds is None
                else duration_seconds
            )
            if not 0 < measured_duration <= self.settings.whisper_max_duration_seconds:
                raise ValueError("Audio recording duration is outside the speech limit")
            shutil.copyfile(audio_path, worker_path)
            future: Future[tuple[str, str, float]] = self._get_executor().submit(
                self._transcribe_sync,
                worker_path,
            )
        except (FileNotFoundError, ValueError, SelfHostedSpeechError):
            self._delete_worker_audio(worker_path)
            self._slot.release()
            raise
        except Exception as error:
            self._delete_worker_audio(worker_path)
            self._slot.release()
            raise SelfHostedSpeechError(
                "Self-hosted audio could not be staged for private processing"
            ) from error
        future.add_done_callback(
            lambda completed: self._finish_worker(completed, worker_path)
        )
        try:
            transcript, detected_language, language_probability = future.result(
                timeout=self.settings.whisper_timeout_seconds
            )
        except FutureTimeout as error:
            raise SelfHostedSpeechTimeout(
                "Self-hosted transcription exceeded the 45 second timeout"
            ) from error

        if not transcript:
            raise SelfHostedSpeechNoSpeech("No Hebrew speech was detected")

        warnings: list[str] = []
        if language != self.settings.whisper_language:
            warnings.append(
                f"Requested language {language!r} was replaced with Hebrew for this learning mode."
            )
        if language_probability < 0.5:
            warnings.append("The recording had low Hebrew language confidence.")
        return {
            "provider": self.name,
            "model": self.settings.whisper_model,
            "transcript": transcript,
            "normalized_text": normalize_hebrew(transcript),
            "language": self.settings.whisper_language,
            "detected_language": detected_language,
            "duration_seconds": round(measured_duration, 3),
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "warnings": warnings,
            "worker_audio_deleted": True,
        }

    def _transcribe_sync(self, audio_path: Path) -> tuple[str, str, float]:
        try:
            model = self._get_model()
            segments, info = model.transcribe(
                str(audio_path),
                language=self.settings.whisper_language,
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
                condition_on_previous_text=False,
            )
            transcript = " ".join(
                segment.text.strip() for segment in segments if segment.text.strip()
            ).strip()
            return (
                transcript,
                str(getattr(info, "language", self.settings.whisper_language)),
                float(getattr(info, "language_probability", 1.0)),
            )
        except SelfHostedSpeechError:
            raise
        except Exception as error:
            raise SelfHostedSpeechError(
                "Self-hosted Hebrew transcription failed"
            ) from error
        finally:
            if not self._delete_worker_audio(audio_path):
                raise SelfHostedSpeechError(
                    "Private speech worker audio could not be deleted"
                )

    def _get_model(self) -> WhisperModel:
        if self._model is not None:
            return self._model
        with self._model_lock:
            if self._model is None:
                self._model = self._model_factory(self.settings)
        return self._model

    def _get_executor(self) -> ThreadPoolExecutor:
        if self._executor is not None:
            return self._executor
        with self._executor_lock:
            if self._executor is None:
                self._executor = ThreadPoolExecutor(
                    max_workers=1,
                    thread_name_prefix="ivrit-whisper",
                )
        return self._executor

    def _finish_worker(
        self,
        _future: Future[tuple[str, str, float]],
        worker_path: Path,
    ) -> None:
        try:
            self._delete_worker_audio(worker_path)
        finally:
            self._slot.release()

    @staticmethod
    def _delete_worker_audio(worker_path: Path) -> bool:
        """Delete one worker copy with bounded retries and no path logging."""
        for delay in (0.0, 0.05, 0.2):
            if delay:
                time.sleep(delay)
            try:
                worker_path.unlink(missing_ok=True)
            except OSError:
                continue
            if not worker_path.exists():
                return True
        return not worker_path.exists()

    def sweep_stale_worker_files(
        self,
        *,
        stale_after_seconds: float = STALE_WORKER_MAX_AGE_SECONDS,
        now: float | None = None,
    ) -> int:
        """Delete only old private ``.whisper-*`` worker copies at startup."""
        if stale_after_seconds < 1:
            raise ValueError("Stale worker age must be at least one second")
        private_dir = self.settings.data_dir / "private"
        if not private_dir.exists():
            return 0
        cutoff = (time.time() if now is None else now) - stale_after_seconds
        deleted = 0
        for candidate in private_dir.glob(".whisper-*"):
            try:
                metadata = candidate.lstat()
            except OSError:
                continue
            if candidate.is_dir() or metadata.st_mtime > cutoff:
                continue
            if self._delete_worker_audio(candidate):
                deleted += 1
        return deleted


def shared_self_hosted_speech_provider(settings: Settings) -> SelfHostedSpeechProvider:
    """Return one model worker per process/configuration for tenant-safe reuse."""

    if not settings.self_hosted_speech_enabled:
        return SelfHostedSpeechProvider(settings)
    cache_dir = (
        str(settings.whisper_model_cache_dir)
        if settings.whisper_model_cache_dir is not None
        else ""
    )
    key = (
        settings.self_hosted_speech_enabled,
        settings.whisper_model,
        settings.whisper_device,
        settings.whisper_compute_type,
        settings.whisper_language,
        settings.whisper_timeout_seconds,
        settings.whisper_max_duration_seconds,
        cache_dir,
    )
    with _SHARED_PROVIDER_LOCK:
        provider = _SHARED_PROVIDERS.get(key)
        if provider is None:
            provider = SelfHostedSpeechProvider(settings)
            _SHARED_PROVIDERS[key] = provider
        return provider
