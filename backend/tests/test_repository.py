"""
Module: learner repository integration tests
Purpose: Verify capture, adaptive reviews, mastery, XP, achievements, missions, profile updates, and export.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ivrit_sheli.repository import LearningRepository


def test_capture_creates_review_state_and_meaningful_achievements(
    repository: LearningRepository,
) -> None:
    item = repository.create_item(
        {
            "hebrew_text": "אני אטפל בזה",
            "translation_en": "I'll take care of it",
            "translation_es": "Me encargaré de eso",
            "context_label": "workplace",
            "priority": 0.95,
        }
    )
    assert item["normalized_text"] == "אני אטפל בזה"
    assert repository.next_reviews(1)[0]["id"] == item["id"]

    status = repository.gamification_status()
    assert status["xp"]["total"] >= 33  # capture XP plus first achievement reward
    assert next(row for row in status["achievements"] if row["key"] == "first_word")["unlocked"] is True

    for entry_id in range(1, 100):
        repository.get_or_create_dictionary_item(
            entry_id,
            {"hebrew_text": f"מילה {entry_id}"},
        )
    # Simulate a duplicate created before the 2.2 atomic dictionary-link path.
    repository.create_item(
        {"hebrew_text": "מילה ישנה", "source_label": "dictionary:1"}
    )
    status = repository.gamification_status()
    explorer = next(row for row in status["achievements"] if row["key"] == "dictionary_100")
    assert explorer["unlocked"] is False

    repository.get_or_create_dictionary_item(100, {"hebrew_text": "מילה 100"})
    status = repository.gamification_status()
    explorer = next(row for row in status["achievements"] if row["key"] == "dictionary_100")
    assert explorer["unlocked"] is True


def test_review_updates_schedule_mastery_and_xp(repository: LearningRepository) -> None:
    item = repository.create_item({"hebrew_text": "תודה", "context_label": "daily_life"})
    result = repository.submit_review(
        item["id"],
        {
            "is_correct": True,
            "confidence": 4,
            "response_ms": 1200,
            "hints_used": 0,
            "modality": "speaking",
            "exercise_type": "speak_phrase",
        },
    )
    assert result["schedule"]["repetitions"] == 1
    assert result["mastery"]["speaking"] > 0
    assert result["xp_awarded"] >= 30  # correct review + speaking attempt
    assert repository.progress()["modalities"][0]["attempts"] == 1


def test_incorrect_review_records_mistake_and_short_interval(repository: LearningRepository) -> None:
    item = repository.create_item({"hebrew_text": "אני צריך"})
    result = repository.submit_review(
        item["id"],
        {
            "is_correct": False,
            "confidence": 2,
            "response_ms": 3500,
            "hints_used": 1,
            "modality": "production",
            "exercise_type": "meaning_to_hebrew",
            "mistake_category": "gender_agreement",
        },
    )
    assert result["schedule"]["lapses"] == 1
    assert result["schedule"]["interval_days"] < 0.01
    assert repository.progress()["mistakes"][0]["mistake_category"] == "gender_agreement"


def test_profile_update_replaces_goal_weights(repository: LearningRepository) -> None:
    profile = repository.update_profile(
        {
            "display_name": "Lirioth",
            "interface_language": "es",
            "daily_minutes": 24,
            "cloud_consent": True,
            "goals": [
                {"goal_type": "workplace", "weight": 0.7, "is_active": 1},
                {"goal_type": "speaking", "weight": 0.3, "is_active": 1},
            ],
        }
    )
    assert profile["display_name"] == "Lirioth"
    assert profile["cloud_consent"] == 1
    assert {goal["goal_type"] for goal in profile["goals"]} == {"workplace", "speaking"}


def test_real_life_mission_rewards_success_and_reflection(repository: LearningRepository) -> None:
    mission = repository.create_mission(
        {"mission_text": "Use תודה with a cashier", "context_label": "daily_life"}
    )
    completed = repository.complete_mission(
        mission["id"],
        {"success": True, "confidence_after": 4, "reflection": "It felt natural."},
    )
    assert completed["mission"]["success"] == 1
    assert completed["xp_awarded"] == 127


def test_repository_search_and_explainable_recommendations(repository: LearningRepository) -> None:
    repository.create_item({"hebrew_text": "פגישה", "translation_en": "meeting", "priority": 0.9})
    repository.create_item({"hebrew_text": "תודה", "translation_en": "thank you", "priority": 0.3})
    assert repository.list_items(query="meeting")[0]["hebrew_text"] == "פגישה"
    recommendation = repository.recommendations(1)[0]
    assert recommendation["item_id"] == 1
    assert recommendation["reason"]
    assert "components" in recommendation


def test_export_excludes_provider_secrets(repository: LearningRepository, tmp_path: Path) -> None:
    repository.create_item({"hebrew_text": "שלום"})
    destination = repository.export_json(tmp_path / "backup.json")
    payload = json.loads(destination.read_text(encoding="utf-8"))
    assert payload["format"] == "ivrit-sheli-export-v1"
    assert payload["tables"]["learning_items"][0]["hebrew_text"] == "שלום"
    assert "connector_states" not in payload["tables"]
    assert "ai_interactions" not in payload["tables"]


def test_missing_item_and_invalid_bug_report_fail_actionably(repository: LearningRepository) -> None:
    with pytest.raises(KeyError, match="not found"):
        repository.get_item(404)
    with pytest.raises(ValueError, match="required"):
        repository.create_bug_report({"title": "", "description": ""})
