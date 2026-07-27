"""
Module: AI, audio, and personalization connector tests
Purpose: Verify offline fallbacks, cloud consent/redaction, speech scoring, audio safety, ICS previews, and read-only states.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
import wave
from pathlib import Path
from typing import Any

import pytest

from ivrit_sheli.ai_engine import (
    SUPPORTED_TASKS,
    TASK_SCHEMAS,
    AIEngine,
    OfflineCoach,
    OpenAIResponsesProvider,
)
from ivrit_sheli.audio import MAX_AUDIO_BYTES, AudioService, validate_audio_file
from ivrit_sheli.config import Settings
from ivrit_sheli.connectors import (
    ConnectorService,
    build_context_preview,
    detect_context,
    parse_ics,
)
from ivrit_sheli.database import Database
from ivrit_sheli.repository import LearningRepository


class FakeCloudProvider:
    """Small provider double that records redacted payloads."""

    name = "openai"
    model = "fake-structured-model"

    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.payload: dict[str, Any] | None = None

    def run(self, task: str, payload: dict[str, Any], learner_context: dict[str, Any]) -> dict[str, Any]:
        self.payload = payload
        if self.fail:
            raise RuntimeError("provider unavailable")
        return {"corrected": str(payload.get("text", "")), "is_correct": True}


class FakeAudioProvider:
    """Small speech provider double used without network access."""

    def __init__(self) -> None:
        self.last_voice: str | None = None
        self.last_instructions = ""

    def synthesize(
        self,
        text: str,
        *,
        voice: str | None = None,
        instructions: str = "",
    ) -> bytes:
        self.last_voice = voice
        self.last_instructions = instructions
        return f"audio:{voice}:{text}".encode()

    def transcribe(self, audio_path: Path, language: str = "he") -> dict[str, Any]:
        return {"provider": "fake", "model": "fake-stt", "transcript": "שלום", "language": language}


class FakeHTTPResponse:
    """Minimal successful HTTP response for provider contract tests."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        """Represent a successful provider response."""

    def json(self) -> dict[str, Any]:
        """Return the configured JSON payload."""
        return self.payload


class FakeHTTPSession:
    """Record the exact OpenAI request without using the network."""

    def __init__(self, response_payload: dict[str, Any]) -> None:
        self.response_payload = response_payload
        self.last_request: dict[str, Any] | None = None

    def post(self, url: str, **kwargs: Any) -> FakeHTTPResponse:
        """Capture a POST request and return the deterministic response."""
        self.last_request = {"url": url, **kwargs}
        return FakeHTTPResponse(self.response_payload)


def assert_schema_shape(schema: dict[str, Any], value: Any, path: str = "result") -> None:
    """Validate the required structural subset of a JSON Schema.

    Args:
        schema: Task output schema.
        value: Offline result to inspect.
        path: Human-readable assertion path.

    Returns:
        None.

    Example:
        Used to contract-test every offline AI task.
    """
    schema_type = schema.get("type")
    if schema_type == "object":
        assert isinstance(value, dict), f"{path} must be an object"
        required = set(schema.get("required", []))
        assert required.issubset(value), f"{path} missing {sorted(required - set(value))}"
        for key, child_schema in schema.get("properties", {}).items():
            if key in value:
                assert_schema_shape(child_schema, value[key], f"{path}.{key}")
    elif schema_type == "array":
        assert isinstance(value, list), f"{path} must be an array"
        for index, item in enumerate(value):
            assert_schema_shape(schema.get("items", {}), item, f"{path}[{index}]")
    elif schema_type == "string":
        assert isinstance(value, str), f"{path} must be a string"
    elif schema_type == "integer":
        assert isinstance(value, int) and not isinstance(value, bool), f"{path} must be an integer"
    elif schema_type == "number":
        assert isinstance(value, (int, float)) and not isinstance(value, bool), f"{path} must be a number"
    elif schema_type == "boolean":
        assert isinstance(value, bool), f"{path} must be a boolean"


def cloud_settings(tmp_path: Path) -> Settings:
    """Create settings that explicitly permit a fake cloud provider."""
    return Settings.from_env(
        {
            "APP_DATA_DIR": str(tmp_path / "cloud"),
            "APP_DB_PATH": str(tmp_path / "cloud" / "app.db"),
            "DICTIONARY_DB_PATH": str(tmp_path / "cloud" / "dictionary.db"),
            "AI_PROVIDER": "openai",
            "ALLOW_CLOUD_PROCESSING": "true",
            "OPENAI_API_KEY": "test-only-key",
        }
    )


@pytest.mark.parametrize("task", sorted(SUPPORTED_TASKS))
def test_every_offline_ai_function_matches_its_contract(task: str) -> None:
    """Keep every visible AI tool functional without credentials."""
    result = OfflineCoach().run(
        task,
        {
            "text": "אני עדיין לומד עברית",
            "translation_en": "I am still learning Hebrew",
            "translation_es": "Todavía estoy aprendiendo hebreo",
            "context_label": "workplace",
        },
        {
            "hebrew_level": "A2",
            "daily_minutes": 20,
            "focus": "speaking",
            "active_goals": ["workplace", "daily_life"],
        },
    )
    assert_schema_shape(TASK_SCHEMAS[task], result)
    json.dumps(result, ensure_ascii=False)


def test_openai_provider_uses_current_responses_json_schema_contract(tmp_path: Path) -> None:
    """Verify model selection and strict structured-output request shape."""
    settings = cloud_settings(tmp_path)
    session = FakeHTTPSession({"output_text": '{"corrected":"שלום","is_correct":true}'})
    provider = OpenAIResponsesProvider(settings, session=session)  # type: ignore[arg-type]

    result = provider.run("correct", {"text": "שלום"}, {"hebrew_level": "A2"})

    assert result["corrected"] == "שלום"
    assert session.last_request is not None
    request_body = session.last_request["json"]
    assert request_body["model"] == "gpt-5.6-luna"
    assert request_body["text"]["format"]["type"] == "json_schema"
    assert request_body["text"]["format"]["strict"] is True
    assert request_body["text"]["format"]["schema"] == TASK_SCHEMAS["correct"]


def test_ai_offline_mode_is_always_available(settings: Settings, database: Database) -> None:
    result = AIEngine(settings, database).run("correct", {"text": "אני  לומד"})
    assert result["provider"] == "offline"
    assert result["data"]["corrected"] == "אני לומד"
    assert result["degraded_mode"] is False


def test_cloud_ai_receives_redacted_selected_text(tmp_path: Path) -> None:
    settings = cloud_settings(tmp_path)
    database = Database(settings.db_path)
    database.initialize()
    provider = FakeCloudProvider()
    try:
        result = AIEngine(settings, database, cloud_provider=provider).run(
            "correct",
            {"text": "Contact learner@example.com about שלום"},
            cloud_requested=True,
        )
        assert result["provider"] == "openai"
        assert result["redactions"] == 1
        assert provider.payload is not None
        assert provider.payload["text"] == "Contact [EMAIL] about שלום"
    finally:
        database.close()


def test_cloud_failure_falls_back_to_offline_without_breaking_session(tmp_path: Path) -> None:
    settings = cloud_settings(tmp_path)
    database = Database(settings.db_path)
    database.initialize()
    try:
        result = AIEngine(settings, database, cloud_provider=FakeCloudProvider(fail=True)).run(
            "correct", {"text": "שלום"}, cloud_requested=True
        )
        assert result["provider"] == "offline"
        assert result["degraded_mode"] is True
        assert result["data"]["corrected"] == "שלום"
    finally:
        database.close()


def test_audio_browser_fallback_and_scoring(settings: Settings, database: Database) -> None:
    service = AudioService(settings, database)
    masculine = service.tts("שלום", voice_style="masculine")
    feminine = service.tts("שלום", voice_style="feminine")
    assert masculine["provider"] == "browser"
    assert masculine["voice_profile"]["pitch"] < feminine["voice_profile"]["pitch"]
    scored = service.score("תודה רבה", "תודה")
    assert scored["score"] < 100
    assert scored["method"] == "transcript_similarity"
    assert scored["assessment_type"] == "transcript_recognition_match"
    assert scored["display_label"] == "Recognition match"
    assert scored["verified_speech_evidence"] is False
    assert scored["audio_retained"] is False
    assert "does not assess phonemes" in scored["limitations"]


def test_verified_pronunciation_updates_linked_mastery_xp_and_events_atomically(
    settings: Settings,
    database: Database,
) -> None:
    repository = LearningRepository(database)
    repository.ensure_default_profile()
    item = repository.create_item({"hebrew_text": "תודה רבה"})

    scored = AudioService(settings, database).score(
        "תודה רבה",
        "תודה רבה",
        provider="server-test",
        verified_speech_evidence=True,
        evidence_key="speech:test-verified-pronunciation",
    )

    assert scored["linked_item_id"] == item["id"]
    assert scored["learning_updated"] is True
    assert scored["mastery"]["speaking"] > 0
    assert scored["xp_awarded"] >= 20
    connection = database.connect()
    assert connection.execute("SELECT COUNT(*) FROM audio_attempts").fetchone()[0] == 1
    attempt = connection.execute(
        "SELECT modality, exercise_type, is_correct FROM attempts"
    ).fetchone()
    assert dict(attempt) == {
        "modality": "speaking",
        "exercise_type": "pronunciation",
        "is_correct": 1,
    }
    assert connection.execute(
        "SELECT COUNT(*) FROM xp_ledger WHERE action = 'speaking_attempt'"
    ).fetchone()[0] == 1
    event = connection.execute(
        "SELECT payload_json FROM user_events WHERE event_type = 'pronunciation_scored'"
    ).fetchone()
    event_payload = json.loads(event["payload_json"])
    assert event_payload["audio_attempt_id"] == scored["attempt_id"]
    assert event_payload["evidence_verified"] is True


def test_pronunciation_item_mismatch_rolls_back_without_partial_evidence(
    settings: Settings,
    database: Database,
) -> None:
    repository = LearningRepository(database)
    repository.ensure_default_profile()
    item = repository.create_item({"hebrew_text": "שלום"})

    with pytest.raises(ValueError, match="does not match"):
        AudioService(settings, database).score(
            "תודה",
            "תודה",
            item_id=item["id"],
        )

    connection = database.connect()
    assert connection.execute("SELECT COUNT(*) FROM audio_attempts").fetchone()[0] == 0
    assert connection.execute("SELECT COUNT(*) FROM attempts").fetchone()[0] == 0
    assert connection.execute(
        "SELECT COUNT(*) FROM user_events WHERE event_type = 'pronunciation_scored'"
    ).fetchone()[0] == 0


def test_fake_cloud_audio_can_synthesize_and_transcribe(tmp_path: Path) -> None:
    settings = cloud_settings(tmp_path)
    database = Database(settings.db_path)
    database.initialize()
    provider = FakeAudioProvider()
    service = AudioService(settings, database, provider=provider)  # type: ignore[arg-type]
    recording = tmp_path / "voice.wav"
    with wave.open(str(recording), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(8_000)
        wav_file.writeframes(b"\0\0" * 8_000)
    try:
        tts = service.tts("שלום", cloud_requested=True, voice_style="masculine")
        assert tts["provider"] == "openai"
        assert tts["voice_style"] == "masculine"
        assert provider.last_voice == settings.openai_tts_voice_masculine
        assert "synthetic style" in provider.last_instructions
        transcript = service.transcribe(recording, cloud_requested=True, delete_after=True)
        assert transcript["transcript"] == "שלום"
        assert not recording.exists()
    finally:
        database.close()


def test_audio_validation_rejects_empty_unknown_and_oversized_files(tmp_path: Path) -> None:
    empty = tmp_path / "empty.wav"
    empty.touch()
    with pytest.raises(ValueError, match="empty"):
        validate_audio_file(empty)

    unknown = tmp_path / "voice.exe"
    unknown.write_bytes(b"x")
    with pytest.raises(ValueError, match="Unsupported"):
        validate_audio_file(unknown)

    oversized = tmp_path / "large.wav"
    with oversized.open("wb") as handle:
        handle.truncate(MAX_AUDIO_BYTES + 1)
    with pytest.raises(ValueError, match="8 MB"):
        validate_audio_file(oversized)


def test_ics_parser_and_connector_preview_are_bounded(
    settings: Settings, database: Database, tmp_path: Path
) -> None:
    source = tmp_path / "calendar.ics"
    source.write_text(
        "BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:1\nDTSTART:20260716T090000Z\n"
        "SUMMARY:Sprint planning\nLOCATION:Team room\n"
        "DESCRIPTION:Contact learner@example.com before the meeting\n"
        "END:VEVENT\nEND:VCALENDAR\n",
        encoding="utf-8",
    )
    parsed = parse_ics(source.read_text(encoding="utf-8"))
    assert parsed[0]["summary"] == "Sprint planning"

    service = ConnectorService(settings, database)
    preview = service.preview_ics(source)[0]
    assert preview.context_label == "workplace"
    assert "[EMAIL]" in preview.redacted_excerpt
    assert preview.phrases
    assert len(service.states()) == 4


def test_context_detection_and_preview_cover_medical_and_daily_life() -> None:
    assert detect_context("Doctor appointment tomorrow") == "medical"
    assert detect_context("Coffee with a neighbor") == "daily_life"
    preview = build_context_preview("test", "Clinic", "My phone is 054-123-4567 at the clinic", {})
    assert "phone" in preview.redactions
