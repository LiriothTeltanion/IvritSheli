"""Regression tests for short-lived speech evidence and replay-safe learning."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.audio import AudioService
from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.repository import LearningRepository
from ivrit_sheli.speech_evidence import SpeechEvidenceError, SpeechEvidenceSigner

TEST_SECRET = "test-speech-evidence-secret-with-at-least-32-bytes"


def test_speech_evidence_rejects_tamper_cross_user_mismatch_and_expiry() -> None:
    signer = SpeechEvidenceSigner(TEST_SECRET, ttl_seconds=60)
    grant = signer.issue(
        subject="user:alpha",
        provider="self_hosted",
        target_text="שָׁלוֹם",
        transcript="שלום",
        now=1_000,
    )

    assert signer.verify(
        grant.token,
        subject="user:alpha",
        provider="self_hosted",
        target_text="שָׁלוֹם",
        transcript="שלום",
        now=1_030,
    ) == grant.evidence_id

    encoded_payload, signature = grant.token.split(".")
    replacement = "A" if signature[0] != "A" else "B"
    with pytest.raises(SpeechEvidenceError, match="signature"):
        signer.verify(
            f"{encoded_payload}.{replacement}{signature[1:]}",
            subject="user:alpha",
            provider="self_hosted",
            target_text="שָׁלוֹם",
            transcript="שלום",
            now=1_030,
        )
    with pytest.raises(SpeechEvidenceError, match="does not match"):
        signer.verify(
            grant.token,
            subject="user:beta",
            provider="self_hosted",
            target_text="שָׁלוֹם",
            transcript="שלום",
            now=1_030,
        )
    with pytest.raises(SpeechEvidenceError, match="does not match"):
        signer.verify(
            grant.token,
            subject="user:alpha",
            provider="self_hosted",
            target_text="שָׁלוֹם",
            transcript="תודה",
            now=1_030,
        )
    with pytest.raises(SpeechEvidenceError, match="expired"):
        signer.verify(
            grant.token,
            subject="user:alpha",
            provider="self_hosted",
            target_text="שָׁלוֹם",
            transcript="שלום",
            now=1_060,
        )


def test_verified_pronunciation_evidence_is_idempotent_after_portable_restore(
    settings: Settings,
    database: Database,
    tmp_path: Path,
) -> None:
    repository = LearningRepository(database)
    repository.ensure_default_profile()
    repository.create_item({"hebrew_text": "שלום"})
    service = AudioService(settings, database)

    first = service.score(
        "שלום",
        "שלום",
        item_id=1,
        provider="self_hosted",
        verified_speech_evidence=True,
        evidence_key="speech:portable-replay-proof",
    )
    backup = repository.export_json(tmp_path / "speech.json")
    repository.import_json(backup)
    replay = service.score(
        "שלום",
        "שלום",
        item_id=1,
        provider="self_hosted",
        verified_speech_evidence=True,
        evidence_key="speech:portable-replay-proof",
    )

    connection = database.connect()
    assert first["replayed"] is False
    assert replay["replayed"] is True
    assert replay["attempt_id"] == first["attempt_id"]
    assert replay["xp_awarded"] == 0
    assert connection.execute("SELECT COUNT(*) FROM audio_attempts").fetchone()[0] == 1
    assert connection.execute(
        "SELECT COUNT(*) FROM attempts WHERE exercise_type = 'pronunciation'"
    ).fetchone()[0] == 1
    assert connection.execute(
        "SELECT COUNT(*) FROM xp_ledger WHERE action = 'speaking_attempt'"
    ).fetchone()[0] == 1


def test_stt_issues_evidence_only_for_supplied_target_and_score_consumes_it(
    settings: Settings,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with TestClient(create_app(settings)) as client:
        service = client.app.state.services.audio
        transcription_calls = 0

        def fake_transcribe(*_args: object, **_kwargs: object) -> dict[str, object]:
            nonlocal transcription_calls
            transcription_calls += 1
            return {
                "transcript": "שלום",
                "normalized_text": "שלום",
                "provider": "self_hosted",
                "model": "small",
                "duration_seconds": 0.5,
                "latency_ms": 4,
                "warnings": [],
                "audio_deleted": transcription_calls > 1,
            }

        monkeypatch.setattr(service, "transcribe", fake_transcribe)
        without_target = client.post(
            "/api/v1/audio/stt",
            files={"file": ("recording.webm", b"audio", "audio/webm")},
        )
        with_target = client.post(
            "/api/v1/audio/stt",
            params={"target_text": "שלום"},
            files={"file": ("recording.webm", b"audio", "audio/webm")},
        )

        assert without_target.status_code == 200
        assert "evidence_token" not in without_target.json()
        assert without_target.json()["audio_deleted"] is False
        assert with_target.status_code == 200
        token = with_target.json()["evidence_token"]
        scored = client.post(
            "/api/v1/audio/pronunciation-score",
            json={
                "target_text": "שלום",
                "transcript": "שלום",
                "provider": "self_hosted",
                "evidence_token": token,
            },
        )
        replay = client.post(
            "/api/v1/audio/pronunciation-score",
            json={
                "target_text": "שלום",
                "transcript": "שלום",
                "provider": "self_hosted",
                "evidence_token": token,
            },
        )
        tampered = client.post(
            "/api/v1/audio/pronunciation-score",
            json={
                "target_text": "שלום",
                "transcript": "תודה",
                "provider": "self_hosted",
                "evidence_token": token,
            },
        )

    assert scored.status_code == 200
    assert scored.json()["evidence_verified"] is True
    assert replay.status_code == 200
    assert replay.json()["replayed"] is True
    assert replay.json()["xp_awarded"] == 0
    assert tampered.status_code == 400
