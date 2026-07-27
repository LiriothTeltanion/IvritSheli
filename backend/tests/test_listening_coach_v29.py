"""Integration tests for the v2.9 listening and personal-coach boundaries."""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.config import Settings
from ivrit_sheli.database import SCHEMA_VERSION
from ivrit_sheli.repository import LearningRepository


def feedback_payload(key: str = "coach.feedback.0001") -> dict[str, object]:
    """Return one bounded, deterministic feedback request."""
    return {
        "feedback_key": key,
        "target_type": "coach_card",
        "target_key": "dictionary:1",
        "useful": True,
        "difficulty": "too_difficult",
        "relevant": True,
        "context": "daily_life",
        "pattern_id": "concept.today.word",
        "note": "Useful, but shorten the next example.",
    }


def test_schema_v8_contains_personalization_notifications_and_speech_evidence(
    repository: LearningRepository,
) -> None:
    connection = repository.database.connect()
    version = connection.execute(
        "SELECT value FROM app_meta WHERE key = 'schema_version'"
    ).fetchone()
    tables = {
        str(row["name"])
        for row in connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table'"
        ).fetchall()
    }

    assert SCHEMA_VERSION == 9
    assert version is not None and int(version["value"]) == SCHEMA_VERSION
    assert {
        "learning_feedback",
        "learner_model_state",
        "notification_preferences",
    }.issubset(tables)
    audio_columns = {
        str(row["name"])
        for row in connection.execute("PRAGMA table_info(audio_attempts)").fetchall()
    }
    assert "evidence_key" in audio_columns


def test_feedback_is_idempotent_bounded_and_reset_keeps_learning(
    repository: LearningRepository,
) -> None:
    item = repository.create_item({"hebrew_text": "מַיִם", "translation_en": "water"})
    session_before = repository.practice_today()

    first = repository.record_learning_feedback(feedback_payload())
    replay = repository.record_learning_feedback(feedback_payload())
    profile = repository.personalization_profile()

    assert first["replayed"] is False
    assert replay["replayed"] is True
    assert profile["state"]["feedback_count"] == 1
    assert -0.08 <= profile["state"]["difficulty_bias"] < 0
    assert 0 < profile["state"]["context_weights"]["daily_life"] <= 0.06
    with pytest.raises(ValueError, match="already used"):
        repository.record_learning_feedback(
            {**feedback_payload(), "difficulty": "too_easy"}
        )

    reset = repository.reset_personalization()
    assert reset["feedback_history_retained"] is True
    assert reset["vocabulary_retained"] is True
    assert repository.get_item(int(item["id"]))["hebrew_text"] == "מַיִם"
    assert repository.practice_today()["session"]["id"] == session_before["session"]["id"]
    after = repository.personalization_profile()
    assert after["state"]["feedback_count"] == 0
    assert len(after["recent_feedback"]) == 1


def test_coach_known_words_require_learning_evidence(
    repository: LearningRepository,
) -> None:
    untouched = repository.create_item({"hebrew_text": "שלום"})
    practiced = repository.create_item({"hebrew_text": "תודה"})

    before = repository.coach_learner_context()
    assert before["known_words"] == []

    repository.submit_review(
        int(practiced["id"]),
        {
            "is_correct": False,
            "confidence": 2,
            "response_ms": 2_100,
            "hints_used": 1,
            "modality": "recognition",
            "exercise_type": "hebrew_to_meaning",
        },
    )
    after = repository.coach_learner_context()

    assert after["known_words"] == ["תודה"]
    assert "שלום" not in after["known_words"]
    assert repository.get_item(int(untouched["id"]))["hebrew_text"] == "שלום"


def test_coach_speaking_target_prefers_exact_source_and_rejects_ambiguity(
    repository: LearningRepository,
) -> None:
    sourced = repository.get_or_create_dictionary_item(
        1,
        {"hebrew_text": "מים", "hebrew_with_niqqud": "מַיִם"},
    )
    repository.create_item({"hebrew_text": "מים"})

    exact_source = repository.coach_speaking_target(
        "מַיִם",
        source_label="dictionary:1",
    )
    assert exact_source == {
        "text": "מַיִם",
        "normalized_text": "מים",
        "learning_item_id": sourced["id"],
        "concept_key": "dictionary:1",
        "link_resolution": "exact_source",
    }

    ambiguous = repository.coach_speaking_target("מַיִם")
    assert ambiguous["learning_item_id"] is None
    assert ambiguous["link_resolution"] is None


def test_portable_round_trip_restores_feedback_model_and_preferences(
    repository: LearningRepository,
    tmp_path: Path,
) -> None:
    repository.update_profile({"display_name": "Before backup"})
    saved_item = repository.create_item(
        {"hebrew_text": "תודה", "translation_en": "thank you"}
    )
    repository.record_learning_feedback(feedback_payload())
    repository.update_notification_preferences(
        {
            "enabled": True,
            "preferred_time": "18:25",
            "timezone": "Asia/Jerusalem",
            "quiet_hours_start": "21:30",
            "quiet_hours_end": "07:15",
        }
    )
    backup = repository.export_json(tmp_path / "learner-backup.json")
    exported = json.loads(backup.read_text(encoding="utf-8"))

    assert "learning_feedback" in exported["tables"]
    assert "learner_model_state" in exported["tables"]
    assert "notification_preferences" in exported["tables"]
    assert "push_subscriptions" not in exported["tables"]

    repository.update_profile({"display_name": "Changed after backup"})
    repository.create_item({"hebrew_text": "מיותר", "translation_en": "extra"})
    restored = repository.import_json(backup)

    assert restored["personalization_restored"] is True
    assert restored["push_subscriptions_restored"] is False
    assert repository.get_profile()["display_name"] == "Before backup"
    assert [item["id"] for item in repository.list_items()] == [saved_item["id"]]
    assert repository.personalization_profile()["state"]["feedback_count"] == 1
    preferences = repository.notification_preferences()
    assert preferences["preferred_time"] == "18:25"
    assert preferences["quiet_hours_start"] == "21:30"
    assert preferences["enabled"] == 0
    assert restored["reauthorization_required"] is True


def test_invalid_portable_import_rolls_back_without_partial_deletion(
    repository: LearningRepository,
    tmp_path: Path,
) -> None:
    original = repository.create_item(
        {"hebrew_text": "שלום", "translation_en": "hello"}
    )
    backup = repository.export_json(tmp_path / "valid.json")
    payload = json.loads(backup.read_text(encoding="utf-8"))
    payload["tables"]["learning_items"][0]["unexpected_secret"] = "blocked"
    invalid = tmp_path / "invalid.json"
    invalid.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(ValueError, match="unsupported columns"):
        repository.import_json(invalid)

    assert repository.get_item(int(original["id"]))["hebrew_text"] == "שלום"


def test_notification_preferences_are_opt_in_and_strictly_validated(
    repository: LearningRepository,
) -> None:
    defaults = repository.notification_preferences()
    assert defaults["enabled"] == 0
    assert defaults["max_daily"] == 1

    with pytest.raises(ValueError, match="HH:MM"):
        repository.update_notification_preferences({"preferred_time": "7pm"})
    with pytest.raises(ValueError, match="IANA"):
        repository.update_notification_preferences({"timezone": "Kevin/Desk"})


def test_api_exposes_coach_transparency_feedback_and_safe_audio_capabilities(
    client: TestClient,
) -> None:
    dashboard = client.get("/api/v1/dashboard")
    capabilities = client.get("/api/v1/audio/capabilities")
    examples = client.post("/api/v1/coach/examples", json={"dictionary_entry_id": 1})
    feedback = client.post("/api/v1/learning/feedback", json=feedback_payload())
    personalization = client.get("/api/v1/personalization/profile")
    push = client.get("/api/v1/notifications/push/capabilities")

    assert dashboard.status_code == 200
    coach_card = dashboard.json()["coach_card"]
    assert coach_card["primary_action"]["band"] == "current"
    assert len(coach_card["suggestions"]) <= 2
    assert coach_card["reason"]["es"]
    assert coach_card["evidence"]["free_form_generation"] is False
    assert coach_card["speaking_target"]["concept_key"].startswith("dictionary:")
    assert coach_card["speaking_target"]["normalized_text"]

    assert capabilities.status_code == 200
    audio = capabilities.json()
    assert audio["secure_context"] is False
    assert audio["secure_context_required"] is True
    assert audio["max_duration_seconds"] == 20
    assert audio["max_upload_bytes"] == 8 * 1024 * 1024
    assert audio["fallbacks"] == ["browser", "manual"]
    assert audio["audio_retention"] == "device_only"

    assert examples.status_code == 200
    assert [row["band"] for row in examples.json()["examples"]] == [
        "easy",
        "current",
        "stretch",
    ]
    assert feedback.status_code == 200
    assert feedback.json()["state"]["feedback_count"] == 1
    assert personalization.json()["transparency"]["free_form_generation"] is False
    assert push.json()["available"] is False
    assert push.json()["requires_opt_in"] is True


def test_coach_examples_expose_server_derived_exact_speaking_item(
    client: TestClient,
) -> None:
    learned = client.post("/api/v1/dictionary/1/learn")
    assert learned.status_code == 201

    examples = client.post(
        "/api/v1/coach/examples",
        json={"dictionary_entry_id": 1},
    )

    assert examples.status_code == 200
    target = examples.json()["speaking_target"]
    assert target["learning_item_id"] == learned.json()["id"]
    assert target["concept_key"] == "dictionary:1"
    assert target["link_resolution"] == "exact_source"
    assert target["normalized_text"]


def test_audio_capabilities_accept_configured_https_proxy_origin(
    settings: Settings,
) -> None:
    https_settings = replace(
        settings,
        public_base_url="https://ivrit-staging.example",
    )
    with TestClient(create_app(https_settings)) as https_client:
        response = https_client.get("/api/v1/audio/capabilities")

    assert response.status_code == 200
    assert response.json()["secure_context"] is True
    assert response.json()["public_base_url"] == "https://ivrit-staging.example"


def test_api_import_requires_confirmation_and_restores_atomically(
    client: TestClient,
) -> None:
    client.put("/api/v1/profile", json={"display_name": "Backup learner"})
    exported = client.get("/api/v1/export")
    client.put("/api/v1/profile", json={"display_name": "Changed learner"})

    denied = client.post(
        "/api/v1/import",
        files={"file": ("backup.json", exported.content, "application/json")},
    )
    restored = client.post(
        "/api/v1/import",
        params={"confirm_replace": "true"},
        files={"file": ("backup.json", exported.content, "application/json")},
    )

    assert denied.status_code == 400
    assert restored.status_code == 200
    assert restored.json()["source"] == "uploaded_backup"
    assert restored.json()["reauthorization_required"] is True
    assert restored.json()["notification_preferences"]["enabled"] == 0
    assert client.get("/api/v1/profile").json()["display_name"] == "Backup learner"


def test_cloud_import_disables_existing_reminder_subscriptions(
    settings: Settings,
) -> None:
    secret = "cloud-import-reminder-safety-secret-over-32-bytes"
    runtime = replace(
        settings,
        database_url="memory://",
        auth_required=True,
        session_secret=secret,
        session_cookie_secure=False,
    )
    store = MemoryCloudStore(session_secret=secret)
    user = store.create_test_user("Backup learner")
    store.create_session(user.id, "session-token", "csrf-token", 300)
    store.upsert_push_subscription(
        user.id,
        "endpoint-hash",
        "encrypted-subscription",
        {
            "enabled": True,
            "locale": "en",
            "timezone": "Asia/Jerusalem",
            "preferred_time": "19:00",
            "weekly_rest_day": 5,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
        },
        None,
    )
    with TestClient(create_app(runtime, cloud_store=store)) as cloud_client:
        cloud_client.cookies.set(runtime.session_cookie_name, "session-token")
        cloud_client.cookies.set("ivrit_csrf", "csrf-token")
        exported = cloud_client.get("/api/v1/export")
        restored = cloud_client.post(
            "/api/v1/import",
            params={"confirm_replace": "true"},
            headers={"X-CSRF-Token": "csrf-token"},
            files={"file": ("backup.json", exported.content, "application/json")},
        )

    assert restored.status_code == 200
    assert restored.json()["reauthorization_required"] is True
    assert restored.json()["notification_preferences"]["enabled"] == 0
    assert store._push_subscriptions[(user.id, "endpoint-hash")]["enabled"] is False
