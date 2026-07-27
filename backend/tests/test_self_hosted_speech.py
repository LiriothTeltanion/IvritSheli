"""Focused tests for the bounded self-hosted Hebrew speech worker."""

from __future__ import annotations

import os
import time
import wave
from dataclasses import dataclass, replace
from pathlib import Path

import pytest

from ivrit_sheli.audio import AudioProviderError, AudioService
from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.self_hosted_speech import (
    MAX_SPEECH_AUDIO_BYTES,
    SelfHostedSpeechBusy,
    SelfHostedSpeechProvider,
    SelfHostedSpeechTimeout,
    probe_audio_duration,
    shared_self_hosted_speech_provider,
    validate_speech_input,
)


@dataclass(frozen=True)
class FakeSegment:
    text: str


@dataclass(frozen=True)
class FakeInfo:
    language: str = "he"
    language_probability: float = 0.98


class FakeWhisperModel:
    """Capture inference options without importing Faster Whisper in unit tests."""

    def __init__(self, delays: list[float] | None = None) -> None:
        self.calls: list[dict[str, object]] = []
        self.delays = list(delays or [])

    def transcribe(self, audio: str, **options: object) -> tuple[list[FakeSegment], FakeInfo]:
        self.calls.append({"audio": audio, **options})
        if self.delays:
            time.sleep(self.delays.pop(0))
        return [FakeSegment(" שָׁלוֹם "), FakeSegment(" אמא ")], FakeInfo()


def speech_settings(tmp_path: Path) -> Settings:
    return Settings.from_env(
        {
            "IVRIT_LOCAL_ONLY": "true",
            "APP_DATA_DIR": str(tmp_path / "state"),
            "APP_DB_PATH": str(tmp_path / "state" / "app.db"),
            "DICTIONARY_DB_PATH": str(tmp_path / "state" / "dictionary.db"),
            "SELF_HOSTED_SPEECH_ENABLED": "true",
        }
    )


def test_provider_forces_hebrew_cpu_int8_vad_and_normalizes_result(
    tmp_path: Path,
) -> None:
    settings = speech_settings(tmp_path)
    recording = tmp_path / "sample.webm"
    recording.write_bytes(b"synthetic audio")
    model = FakeWhisperModel()
    provider = SelfHostedSpeechProvider(
        settings,
        model_factory=lambda _settings: model,
        duration_probe=lambda _path: 2.25,
        runtime_available=lambda: True,
    )

    result = provider.transcribe(recording, language="en")

    assert result["provider"] == "self_hosted"
    assert result["model"] == "small"
    assert result["transcript"] == "שָׁלוֹם אמא"
    assert result["normalized_text"] == "שלום אמא"
    assert result["duration_seconds"] == 2.25
    assert result["worker_audio_deleted"] is True
    assert result["warnings"]
    assert len(model.calls) == 1
    assert str(model.calls[0]["audio"]).endswith(".webm")
    assert ".whisper-" in str(model.calls[0]["audio"])
    assert not Path(str(model.calls[0]["audio"])).exists()
    assert {
        key: value
        for key, value in model.calls[0].items()
        if key != "audio"
    } == {
        "language": "he",
        "beam_size": 5,
        "vad_filter": True,
        "vad_parameters": {"min_silence_duration_ms": 500},
        "condition_on_previous_text": False,
    }


def test_provider_capabilities_do_not_load_model(tmp_path: Path) -> None:
    settings = speech_settings(tmp_path)
    model_loads = 0

    def factory(_settings: Settings) -> FakeWhisperModel:
        nonlocal model_loads
        model_loads += 1
        return FakeWhisperModel()

    provider = SelfHostedSpeechProvider(
        settings,
        model_factory=factory,
        runtime_available=lambda: True,
    )

    capabilities = provider.capabilities()

    assert capabilities["status"] == "cold"
    assert capabilities["available"] is True
    assert capabilities["max_bytes"] == 8 * 1024 * 1024
    assert capabilities["max_duration_seconds"] == 20
    assert capabilities["max_concurrency"] == 1
    assert model_loads == 0


def test_provider_preload_initializes_model_once_before_requests(
    tmp_path: Path,
) -> None:
    settings = speech_settings(tmp_path)
    model_loads = 0

    def factory(_settings: Settings) -> FakeWhisperModel:
        nonlocal model_loads
        model_loads += 1
        return FakeWhisperModel()

    provider = SelfHostedSpeechProvider(
        settings,
        model_factory=factory,
        runtime_available=lambda: True,
    )

    first = provider.preload()
    second = provider.preload()

    assert first["status"] == "ready"
    assert first["model"] == "small"
    assert second["status"] == "ready"
    assert provider.capabilities()["status"] == "ready"
    assert model_loads == 1


def test_enabled_services_share_one_process_worker(tmp_path: Path) -> None:
    settings = speech_settings(tmp_path)

    assert shared_self_hosted_speech_provider(
        settings
    ) is shared_self_hosted_speech_provider(settings)


def test_input_validation_rejects_oversized_and_long_recordings(
    tmp_path: Path,
) -> None:
    oversized = tmp_path / "oversized.wav"
    with oversized.open("wb") as handle:
        handle.truncate(MAX_SPEECH_AUDIO_BYTES + 1)
    with pytest.raises(ValueError, match="8 MB"):
        validate_speech_input(oversized, duration_probe=lambda _path: 1.0)

    long_recording = tmp_path / "long.wav"
    long_recording.write_bytes(b"audio")
    with pytest.raises(ValueError, match="20 second"):
        validate_speech_input(long_recording, duration_probe=lambda _path: 20.01)


def test_probe_audio_duration_uses_pyav_time_base_units(tmp_path: Path) -> None:
    recording = tmp_path / "one-second.wav"
    with wave.open(str(recording), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(8_000)
        wav_file.writeframes(b"\0\0" * 8_000)

    assert probe_audio_duration(recording) == pytest.approx(1.0, abs=0.01)


def test_timeout_keeps_single_slot_busy_until_worker_finishes(tmp_path: Path) -> None:
    settings = replace(speech_settings(tmp_path), whisper_timeout_seconds=0.01)
    first = tmp_path / "first.webm"
    second = tmp_path / "second.webm"
    first.write_bytes(b"first")
    second.write_bytes(b"second")
    model = FakeWhisperModel(delays=[0.08, 0.0])
    provider = SelfHostedSpeechProvider(
        settings,
        model_factory=lambda _settings: model,
        duration_probe=lambda _path: 1.0,
        runtime_available=lambda: True,
    )

    with pytest.raises(SelfHostedSpeechTimeout, match="45 second"):
        provider.transcribe(first)
    with pytest.raises(SelfHostedSpeechBusy):
        provider.transcribe(second)

    time.sleep(0.1)
    result = provider.transcribe(second)
    assert result["transcript"] == "שָׁלוֹם אמא"


def test_busy_worker_rejects_before_duration_decode(tmp_path: Path) -> None:
    settings = speech_settings(tmp_path)
    recording = tmp_path / "busy.webm"
    recording.write_bytes(b"audio")
    probe_calls = 0

    def duration_probe(_path: Path) -> float:
        nonlocal probe_calls
        probe_calls += 1
        return 1.0

    provider = SelfHostedSpeechProvider(
        settings,
        model_factory=lambda _settings: FakeWhisperModel(),
        duration_probe=duration_probe,
        runtime_available=lambda: True,
    )
    assert provider._slot.acquire(blocking=False)
    try:
        with pytest.raises(SelfHostedSpeechBusy):
            provider.transcribe(recording)
    finally:
        provider._slot.release()

    assert probe_calls == 0


def test_startup_sweep_deletes_only_stale_worker_copies(tmp_path: Path) -> None:
    settings = speech_settings(tmp_path)
    private_dir = settings.data_dir / "private"
    private_dir.mkdir(parents=True, exist_ok=True)
    stale = private_dir / ".whisper-stale.webm"
    recent = private_dir / ".whisper-recent.webm"
    ordinary = private_dir / "upload-stale.webm"
    for path in (stale, recent, ordinary):
        path.write_bytes(b"audio")
    os.utime(stale, (100.0, 100.0))
    os.utime(ordinary, (100.0, 100.0))
    os.utime(recent, (999.0, 999.0))
    provider = SelfHostedSpeechProvider(settings, runtime_available=lambda: True)

    deleted = provider.sweep_stale_worker_files(
        stale_after_seconds=100,
        now=1_000,
    )

    assert deleted == 1
    assert not stale.exists()
    assert recent.exists()
    assert ordinary.exists()


def test_audio_service_deletes_temporary_input_on_success_and_failure(
    tmp_path: Path,
) -> None:
    settings = speech_settings(tmp_path)
    database = Database(settings.db_path)
    database.initialize()
    model = FakeWhisperModel()
    provider = SelfHostedSpeechProvider(
        settings,
        model_factory=lambda _settings: model,
        duration_probe=lambda _path: 1.5,
        runtime_available=lambda: True,
    )
    service = AudioService(
        settings,
        database,
        self_hosted_provider=provider,
    )

    successful = tmp_path / "successful.webm"
    successful.write_bytes(b"audio")
    result = service.transcribe(successful, mode="self_hosted")
    assert result["audio_deleted"] is True
    assert result["mode"] == "self_hosted"
    assert not successful.exists()

    invalid = tmp_path / "invalid.exe"
    invalid.write_bytes(b"not audio")
    with pytest.raises(ValueError, match="Unsupported"):
        service.transcribe(invalid, mode="self_hosted")
    assert not invalid.exists()

    unavailable = tmp_path / "unavailable.webm"
    unavailable.write_bytes(b"audio")
    disabled_settings = replace(settings, self_hosted_speech_enabled=False)
    disabled_provider = SelfHostedSpeechProvider(
        disabled_settings,
        model_factory=lambda _settings: model,
        duration_probe=lambda _path: 1.0,
        runtime_available=lambda: True,
    )
    disabled_service = AudioService(
        disabled_settings,
        database,
        self_hosted_provider=disabled_provider,
    )
    with pytest.raises(AudioProviderError, match="disabled"):
        disabled_service.transcribe(unavailable, mode="self_hosted")
    assert not unavailable.exists()
    database.close()


@pytest.mark.parametrize(
    ("name", "value", "message"),
    [
        ("WHISPER_MODEL", "large-v3", "WHISPER_MODEL"),
        ("WHISPER_DEVICE", "cuda", "WHISPER_DEVICE"),
        ("WHISPER_COMPUTE_TYPE", "float16", "WHISPER_COMPUTE_TYPE"),
        ("WHISPER_LANGUAGE", "en", "WHISPER_LANGUAGE"),
        ("WHISPER_TIMEOUT_SECONDS", "46", "WHISPER_TIMEOUT_SECONDS"),
        ("WHISPER_MAX_DURATION_SECONDS", "21", "WHISPER_MAX_DURATION_SECONDS"),
    ],
)
def test_v29_worker_configuration_is_bounded(
    tmp_path: Path,
    name: str,
    value: str,
    message: str,
) -> None:
    with pytest.raises(ValueError, match=message):
        Settings.from_env(
            {
                "IVRIT_LOCAL_ONLY": "true",
                "APP_DATA_DIR": str(tmp_path / name),
                name: value,
            }
        )


def test_whisper_preload_requires_enabled_self_hosted_worker(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="WHISPER_PRELOAD_ON_START"):
        Settings.from_env(
            {
                "IVRIT_LOCAL_ONLY": "true",
                "APP_DATA_DIR": str(tmp_path / "state"),
                "WHISPER_PRELOAD_ON_START": "true",
            }
        )
