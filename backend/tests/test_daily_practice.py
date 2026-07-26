"""Daily practice, curriculum, persistence, and tenant-isolation tests."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.local_learning_engine import (
    CURRICULUM_LESSONS,
    LocalLearningEngine,
    PracticeConflictError,
)
from ivrit_sheli.repository import LearningRepository


def _submit_current(
    repository: LearningRepository | CloudLearningRepository,
    session: dict[str, Any],
    *,
    sequence: int,
    outcome: str = "completed",
) -> dict[str, Any]:
    step_key = session["current_step_key"]
    assert isinstance(step_key, str)
    return repository.submit_practice_step(
        session["id"],
        step_key,
        {
            "idempotency_key": f"daily-step-{sequence:04d}",
            "outcome": outcome,
            "is_correct": True,
            "confidence": 4,
            "response_ms": 800,
            "hints_used": 0,
        },
    )


def test_curriculum_contract_is_honest_and_sound_first() -> None:
    engine = LocalLearningEngine()
    path = engine.curriculum_path(
        {"cefr_band": "A0", "learner_mode": "guided"},
        {},
        available_concepts=0,
    )

    assert path["coverage"] == {
        "structured": ["A0", "A1", "A2"],
        "laboratory": ["B1", "B2"],
        "complete_course_claim": False,
        "concept_target": 240,
        "available_personal_concepts": 0,
    }
    assert sum(lesson.concept_target for lesson in CURRICULUM_LESSONS) == 240
    assert path["reading_track"]["approach"] == "sound_first"
    assert path["reading_track"]["base_letters"] == 22
    assert len(path["reading_track"]["entries"]) == 22
    assert all(
        not lesson["unlocked"]
        for lesson in path["lessons"]
        if lesson["coverage"] == "laboratory"
    )


def test_empty_account_gets_three_reviewed_words_and_all_exercise_families() -> None:
    plan = LocalLearningEngine().build_daily_plan(
        {"cefr_band": "A0", "learner_mode": "guided"},
        [],
    )

    concepts = {
        step["concept"]["hebrew_text"]
        for step in plan["steps"]
        if isinstance(step.get("concept"), dict)
    }
    exercise_types = {step["exercise_type"] for step in plan["steps"]}
    assert {"שלום", "תודה", "כן"} <= concepts
    assert {
        "visual_meaning",
        "audio_choice",
        "hebrew_to_meaning",
        "meaning_to_hebrew_word_bank",
        "cloze_order",
        "spoken_production",
    } <= exercise_types
    assert plan["source"] == "reviewed_starter"


def test_learning_engine_prioritizes_due_weak_low_confidence_evidence() -> None:
    plan = LocalLearningEngine().build_daily_plan(
        {"cefr_band": "A1", "learner_mode": "explorer"},
        [
            {
                "item_id": 1,
                "hebrew_text": "קל",
                "due_now": 0,
                "recent_accuracy": 1.0,
                "average_confidence": 5,
                "priority": 0.2,
            },
            {
                "item_id": 2,
                "hebrew_text": "חשוב",
                "due_now": 1,
                "recent_accuracy": 0.2,
                "average_confidence": 1,
                "average_response_ms": 9000,
                "priority": 0.9,
                "goal_alignment": 1,
            },
        ],
    )

    assert plan["steps"][0]["concept"]["hebrew_text"] == "חשוב"
    assert "due date, priority, and recent learning evidence" in plan["reason"]
    assert sum(step["kind"] == "retrieval" for step in plan["steps"]) == 4


def test_experienced_mode_plans_five_retrievals_when_content_is_available() -> None:
    plan = LocalLearningEngine().build_daily_plan(
        {"cefr_band": "A2", "learner_mode": "experienced"},
        [
            {
                "item_id": item_id,
                "hebrew_text": f"מילה {item_id}",
                "priority": 1 - item_id / 100,
            }
            for item_id in range(1, 6)
        ],
    )

    assert sum(step["kind"] == "retrieval" for step in plan["steps"]) == 5


def test_daily_session_resumes_and_idempotency_cannot_duplicate_evidence(
    repository: LearningRepository,
) -> None:
    first = repository.practice_today()["session"]
    resumed = repository.practice_today()["session"]
    assert first["id"] == resumed["id"]
    assert first["persisted"] is True
    assert first["status"] == "active"

    current_key = first["current_step_key"]
    payload = {
        "idempotency_key": "daily-idempotency-0001",
        "outcome": "completed",
        "is_correct": True,
        "confidence": 4,
    }
    accepted = repository.submit_practice_step(first["id"], current_key, payload)
    replayed = repository.submit_practice_step(first["id"], current_key, payload)
    assert accepted["saved"] is True
    assert accepted["duplicate"] is False
    assert replayed["duplicate"] is True
    assert replayed["event"]["id"] == accepted["event"]["id"]

    with repository.database.transaction() as connection:
        event_count = connection.execute(
            "SELECT COUNT(*) FROM practice_step_events"
        ).fetchone()[0]
    assert event_count == 1

    with pytest.raises(PracticeConflictError, match="different practice evidence"):
        repository.submit_practice_step(
            first["id"],
            current_key,
            {**payload, "outcome": "failed"},
        )


def test_daily_session_enforces_order_and_completes_with_persisted_summary(
    repository: LearningRepository,
) -> None:
    session = repository.practice_today()["session"]
    wrong_key = session["plan"]["steps"][1]["key"]
    with pytest.raises(PracticeConflictError, match="Expected practice step"):
        repository.submit_practice_step(
            session["id"],
            wrong_key,
            {
                "idempotency_key": "wrong-order-0001",
                "outcome": "completed",
            },
        )

    response: dict[str, Any] | None = None
    for sequence in range(len(session["plan"]["steps"])):
        current = (
            session
            if response is None
            else response["session"]
        )
        response = _submit_current(
            repository,
            current,
            sequence=sequence,
        )
    assert response is not None
    completed = response["session"]
    assert completed["status"] == "completed"
    assert completed["current_step_key"] is None
    assert completed["summary"]["saved"] is True
    assert completed["summary"]["meaningful_actions"] == 5
    assert completed["daily_goal"] == {
        "target": 5,
        "completed": 5,
        "achieved": True,
    }
    assert repository.dashboard()["today"]["daily_goal"] == {
        "target": 5,
        "completed": 5,
        "achieved": True,
        "evidence": "meaningful_practice_events",
    }
    assert response["xp_awarded"] == 0

    resumed = repository.practice_today()["session"]
    assert resumed["id"] == completed["id"]
    assert resumed["summary"] == completed["summary"]
    progress = repository.curriculum_path()["lessons"]
    assert any(
        lesson["progress"]["status"] == "in_progress"
        and lesson["progress"]["meaningful_attempts"] > 0
        for lesson in progress
    )


def test_unsupported_microphone_step_is_saved_without_false_mastery(
    repository: LearningRepository,
) -> None:
    session = repository.practice_today()["session"]
    response: dict[str, Any] | None = None
    while (
        response is None
        or response["session"]["current_step_key"] != "speaking:0"
    ):
        current = session if response is None else response["session"]
        response = _submit_current(
            repository,
            current,
            sequence=current["current_step"],
        )
    speaking = response["session"]
    unsupported = repository.submit_practice_step(
        speaking["id"],
        "speaking:0",
        {
            "idempotency_key": "microphone-unsupported-0001",
            "outcome": "unsupported",
            "unsupported_reason": "speech_recognition_unavailable",
        },
    )
    assert unsupported["saved"] is True
    assert unsupported["event"]["outcome"] == "unsupported"
    assert unsupported["event"]["meaningful"] is False
    assert unsupported["curriculum_progress"] is None
    assert unsupported["next_action"] == "manual_fallback"
    assert unsupported["session"]["current_step_key"] == "speaking:0"

    manual = repository.submit_practice_step(
        speaking["id"],
        "speaking:0",
        {
            "idempotency_key": "microphone-manual-fallback-0001",
            "outcome": "completed",
            "is_correct": True,
            "answer_text": "Manual self-report",
        },
    )
    assert manual["next_action"] == "continue"
    assert manual["session"]["current_step_key"] == "reflection:session"


def test_profile_fields_and_export_include_daily_learning_state(
    repository: LearningRepository,
    tmp_path: Path,
) -> None:
    profile = repository.update_profile(
        {"text_scale": 1.4, "focus_status": "busy"}
    )
    assert profile["text_scale"] == 1.4
    assert profile["focus_status"] == "busy"
    repository.practice_today()

    destination = repository.export_json(tmp_path / "export.json")
    payload = json.loads(destination.read_text(encoding="utf-8"))
    assert {
        "practice_sessions",
        "practice_step_events",
        "curriculum_progress",
    } <= payload["tables"].keys()
    assert payload["tables"]["profiles"][0]["text_scale"] == 1.4


def test_cloud_snapshot_persists_daily_session_and_isolates_tenants() -> None:
    store = MemoryCloudStore()
    first = store.create_test_user("First")
    second = store.create_test_user("Second")
    first_repository = CloudLearningRepository(store, first.id, first.display_name)
    second_repository = CloudLearningRepository(store, second.id, second.display_name)

    first_session = first_repository.practice_today()["session"]
    _submit_current(first_repository, first_session, sequence=1)
    second_session = second_repository.practice_today()["session"]

    assert first_session["id"] != second_session["id"]
    assert len(store.read_state(first.id)["tables"]["practice_step_events"]) == 1
    assert store.read_state(second.id)["tables"]["practice_step_events"] == []
    assert (
        CloudLearningRepository(store, first.id, first.display_name)
        .practice_today()["session"]["current_step"]
        == 1
    )


def test_demo_daily_plan_is_read_only_and_never_claims_persistence() -> None:
    store = MemoryCloudStore()
    demo = store.ensure_demo_user()
    repository = CloudLearningRepository(
        store,
        demo.id,
        demo.display_name,
        seed_demo=True,
    )
    before = store.read_state(demo.id)

    session = repository.practice_today()["session"]

    assert session["status"] == "preview"
    assert session["persisted"] is False
    assert store.read_state(demo.id) == before


def test_api_contract_validates_and_resumes_daily_practice(
    client: TestClient,
) -> None:
    path = client.get("/api/v1/curriculum/path")
    today = client.get("/api/v1/practice/today")
    assert path.status_code == today.status_code == 200
    assert path.json()["coverage"]["concept_target"] == 240

    session = today.json()["session"]
    invalid = client.post(
        f"/api/v1/practice/{session['id']}/steps/{session['current_step_key']}",
        json={"idempotency_key": "short", "outcome": "completed"},
    )
    assert invalid.status_code == 422

    out_of_order = client.post(
        f"/api/v1/practice/{session['id']}/steps/{session['plan']['steps'][1]['key']}",
        json={
            "idempotency_key": "api-wrong-order-0001",
            "outcome": "completed",
        },
    )
    assert out_of_order.status_code == 409
    assert out_of_order.json()["error"]["code"] == "practice_conflict"

    accepted = client.post(
        f"/api/v1/practice/{session['id']}/steps/{session['current_step_key']}",
        json={
            "idempotency_key": "api-daily-step-0001",
            "outcome": "completed",
            "is_correct": True,
        },
    )
    assert accepted.status_code == 200
    assert accepted.json()["saved"] is True
    assert client.get("/api/v1/practice/today").json()["session"]["current_step"] == 1
