"""Learning Core v2.6 domain, repository, and API contract tests."""

from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from itertools import count
from typing import Any

import pytest
from fastapi.testclient import TestClient

import ivrit_sheli.repository as repository_module
from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.learning_core import (
    CONTRACT_VERSION,
    READING_SUPPORT_LADDER,
    LearningCoreConflictError,
    apply_reading_evidence,
    evidence_kind_for_activity,
    skill_for_activity,
    transition_phase,
)
from ivrit_sheli.repository import LearningRepository

_ATTEMPT_SEQUENCE = count(1)


def _submit_core(
    repository: LearningRepository | CloudLearningRepository,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Submit the current server-issued activity with one unique retry key."""
    activity = repository.next_learning_core_activity()["activity"]
    assert activity is not None
    return repository.submit_learning_core_attempt(
        {
            **payload,
            "activity_token": activity["activity_token"],
            "idempotency_key": f"test-attempt-{next(_ATTEMPT_SEQUENCE):04d}",
        }
    )


def test_reading_support_requires_two_unassisted_successes_and_never_xp() -> None:
    first = apply_reading_evidence(
        "full_niqqud",
        success_streak=0,
        total_successes=0,
        total_failures=0,
        is_correct=True,
        hints_used=0,
    )
    assert first.level == "full_niqqud"
    assert first.evidence_to_advance == 1
    assert first.advanced is False

    hinted = apply_reading_evidence(
        first.level,
        success_streak=first.success_streak,
        total_successes=first.total_successes,
        total_failures=first.total_failures,
        is_correct=True,
        hints_used=1,
    )
    assert hinted.level == "full_niqqud"
    assert hinted.success_streak == 0
    assert "xp" not in asdict(hinted)

    second = apply_reading_evidence(
        hinted.level,
        success_streak=0,
        total_successes=hinted.total_successes,
        total_failures=hinted.total_failures,
        is_correct=True,
        hints_used=0,
    )
    advanced = apply_reading_evidence(
        second.level,
        success_streak=second.success_streak,
        total_successes=second.total_successes,
        total_failures=second.total_failures,
        is_correct=True,
        hints_used=0,
    )
    assert advanced.level == "partial_niqqud"
    assert advanced.advanced is True
    assert tuple(READING_SUPPORT_LADDER) == (
        "full_niqqud",
        "partial_niqqud",
        "hint_only",
        "unpointed",
    )

    restored = apply_reading_evidence(
        "hint_only",
        success_streak=1,
        total_successes=4,
        total_failures=0,
        is_correct=False,
        hints_used=0,
    )
    assert restored.level == "partial_niqqud"
    assert restored.restored is True
    assert restored.advanced is False
    assert "restored" in restored.reason

    full_failure = apply_reading_evidence(
        "full_niqqud",
        success_streak=1,
        total_successes=1,
        total_failures=0,
        is_correct=False,
        hints_used=0,
    )
    assert full_failure.level == "full_niqqud"
    assert full_failure.restored is False

    unavailable = apply_reading_evidence(
        "full_niqqud",
        success_streak=1,
        total_successes=1,
        total_failures=0,
        is_correct=True,
        hints_used=0,
        has_niqqud=False,
    )
    assert unavailable.level == "full_niqqud"
    assert unavailable.success_streak == 1
    assert unavailable.total_successes == 1
    assert unavailable.advanced is unavailable.restored is False
    assert "no reviewed niqqud" in unavailable.reason


def test_phase_and_skill_rules_are_server_deterministic() -> None:
    assert transition_phase("encounter", is_correct=False).to_phase == "retrieval"
    assert transition_phase("retrieval", is_correct=True).to_phase == "focused_feedback"
    assert transition_phase("corrected_retry", is_correct=False).to_phase == (
        "focused_feedback"
    )
    assert transition_phase("corrected_retry", is_correct=True).to_phase == "delayed_review"
    assert skill_for_activity("retrieval", "full_niqqud") == "pointed_reading"
    assert skill_for_activity("encounter", "full_niqqud") == "recognition"
    assert skill_for_activity("retrieval", "unpointed") == "unpointed_reading"
    assert skill_for_activity("transfer", "unpointed") == "contextual_transfer"
    assert evidence_kind_for_activity("encounter", 0) == "exposure"
    assert evidence_kind_for_activity("retrieval", 1) == "assisted"
    assert evidence_kind_for_activity("delayed_review", 0) == "unassisted"
    assert evidence_kind_for_activity("corrected_retry", 2) == "correction_uptake"


def test_repository_runs_complete_loop_without_xp_shortcuts(
    repository: LearningRepository,
) -> None:
    item = repository.create_item(
        {
            "hebrew_text": "אני לומד עברית",
            "hebrew_with_niqqud": "אֲנִי לוֹמֵד עִבְרִית",
            "translation_en": "I am learning Hebrew",
        }
    )
    initial_xp = repository.gamification_status()["xp"]["total"]
    core = repository.learning_core_state()
    assert core["contract_version"] == CONTRACT_VERSION
    assert core["profile"] == {
        "curriculum_track": "modern_conversation",
        "cefr_band": "A0",
        "learner_mode": "guided",
    }
    assert core["retention_checkpoints"][0]["status"] == "insufficient_evidence"
    assert core["curriculum"]["evidence_source"] == "learner_self_report"

    next_payload = repository.next_learning_core_activity()
    assert next_payload["available"] is True
    assert next_payload["activity"]["phase"] == "encounter"
    assert next_payload["activity"]["skill_dimension"] == "recognition"
    assert "optional audio" in next_payload["activity"]["rationale"]
    assert "rationale" in next_payload["activity"]
    assert "next_review_reason" in next_payload["activity"]

    encounter = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 500,
            "hints_used": 0,
        }
    )
    assert encounter["mastery"] is None
    assert encounter["state"]["phase"] == "retrieval"
    assert repository.gamification_status()["xp"]["total"] == initial_xp

    retrieval = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 1200,
            "hints_used": 0,
        }
    )
    assert retrieval["mastery"]["pointed_reading"] > 0
    assert retrieval["reading_support_state"]["evidence_to_advance"] == 1
    assert retrieval["state"]["phase"] == "focused_feedback"

    feedback = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 300,
            "hints_used": 0,
        }
    )
    assert feedback["mastery"] is None
    assert feedback["state"]["phase"] == "corrected_retry"

    retry = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 900,
            "hints_used": 0,
        }
    )
    assert retry["schedule"]["interval_days"] == 1.0
    assert retry["state"]["phase"] == "delayed_review"
    assert retry["next_activity"]["can_submit"] is False

    with repository.database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET due_at = ? WHERE item_id = ?",
            ((datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(), item["id"]),
        )
    delayed = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 950,
            "hints_used": 0,
        }
    )
    assert delayed["reading_support_state"]["level"] == "partial_niqqud"
    assert delayed["reading_support_state"]["advanced"] is True
    assert delayed["state"]["phase"] == "transfer"

    transferred = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 1400,
            "hints_used": 0,
        }
    )
    assert transferred["mastery"]["contextual_transfer"] > 0
    assert transferred["state"]["phase"] == "reflection"

    reflected = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "response_ms": 400,
            "hints_used": 0,
            "answer_text": "I can use this sentence at home.",
        }
    )
    assert reflected["mastery"] is None
    assert repository.gamification_status()["xp"]["total"] == initial_xp

    with repository.database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET due_at = ? WHERE item_id = ?",
            ((datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(), item["id"]),
        )
    restored_activity = repository.next_learning_core_activity()["activity"]
    assert restored_activity["phase"] == "delayed_review"
    assert restored_activity["reading_support"] == "partial_niqqud"
    restored = _submit_core(
        repository,
        {
            "item_id": item["id"],
            "is_correct": False,
            "confidence": 2,
            "response_ms": 1400,
            "hints_used": 0,
        },
    )
    assert restored["reading_support_state"]["level"] == "full_niqqud"
    assert restored["reading_support_state"]["restored"] is True
    assert restored["reading_support_state"]["advanced"] is False
    assert repository.gamification_status()["xp"]["total"] == initial_xp


def test_item_without_niqqud_uses_unpointed_skill_without_fading_support(
    repository: LearningRepository,
) -> None:
    item = repository.create_item(
        {
            "hebrew_text": "עברית",
            "hebrew_with_niqqud": None,
            "translation_en": "Hebrew",
        }
    )
    encounter = repository.next_learning_core_activity()["activity"]
    assert encounter["niqqud_available"] is False
    assert "no reviewed niqqud" in encounter["rationale"].lower()
    assert "remains visible" not in encounter["rationale"].lower()
    _submit_core(
        repository,
        {"item_id": item["id"], "is_correct": True, "confidence": 3},
    )

    retrieval = repository.next_learning_core_activity()["activity"]
    assert retrieval["skill_dimension"] == "unpointed_reading"
    result = _submit_core(
        repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "hints_used": 0,
        },
    )
    assert result["attempt"]["skill_dimension"] == "unpointed_reading"
    assert result["attempt"]["evidence_source"] == "learner_self_report"
    assert result["reading_support_state"] == {
        "level": "full_niqqud",
        "success_streak": 0,
        "total_successes": 0,
        "total_failures": 0,
        "evidence_to_advance": 2,
        "advanced": False,
        "restored": False,
        "reason": (
            "Reading support stayed unchanged because this item has no reviewed niqqud form."
        ),
    }


def test_learning_core_skips_items_without_a_usable_meaning(
    repository: LearningRepository,
) -> None:
    incomplete = repository.create_item(
        {"hebrew_text": "בלי משמעות", "priority": 100}
    )
    complete = repository.create_item(
        {"hebrew_text": "עם משמעות", "translation_en": "with meaning", "priority": 10}
    )

    activity = repository.next_learning_core_activity()["activity"]

    assert activity is not None
    assert activity["item"]["id"] == complete["id"]
    with repository.database.transaction() as connection:
        connection.execute(
            "UPDATE learning_items SET archived_at = ? WHERE id = ?",
            (datetime.now(timezone.utc).isoformat(), complete["id"]),
        )
    empty = repository.next_learning_core_activity()
    assert empty["available"] is False
    assert empty["activity"] is None
    assert empty["state"]["current_item_id"] is None
    assert incomplete["id"] != complete["id"]


def test_api_contract_rejects_client_owned_learning_state(client: TestClient) -> None:
    item = client.post(
        "/api/v1/items",
        json={"hebrew_text": "שלום", "translation_en": "hello"},
    ).json()
    root = client.get("/api/v1/learning-core")
    next_response = client.get("/api/v1/learning-core/next")
    assert root.status_code == next_response.status_code == 200
    assert root.json()["contract_version"] == "2.6"
    assert root.json()["curriculum"]["ux_modes"] == [
        "guided",
        "explorer",
        "experienced",
    ]
    assert root.json()["curriculum"]["selection_policy"] == "shared_due_queue_pilot"
    assert root.json()["curriculum"]["track_status"] == "preference_only"
    assert root.json()["curriculum"]["cefr_status"] == "self_selected_planning_band"
    assert root.json()["curriculum"]["evidence_source"] == "learner_self_report"
    activity = next_response.json()["activity"]
    assert activity["item"]["id"] == item["id"]
    assert len(activity["activity_token"]) == 64
    assert activity["niqqud_available"] is False

    forged = client.post(
        "/api/v1/learning-core/attempt",
        json={
            "item_id": item["id"],
            "activity_token": activity["activity_token"],
            "idempotency_key": "forged-attempt-0001",
            "is_correct": True,
            "phase": "reflection",
            "mastery": 1,
            "xp": 100000,
        },
    )
    assert forged.status_code == 422
    fields = {detail["field"] for detail in forged.json()["error"]["details"]}
    assert {"body.phase", "body.mastery", "body.xp"} <= fields

    accepted = client.post(
        "/api/v1/learning-core/attempt",
        json={
            "item_id": item["id"],
            "activity_token": activity["activity_token"],
            "idempotency_key": "accepted-attempt-0001",
            "is_correct": True,
            "confidence": 3,
        },
    )
    assert accepted.status_code == 200
    assert accepted.json()["attempt"]["phase"] == "encounter"
    assert accepted.json()["attempt"]["evidence_source"] == "learner_self_report"
    assert accepted.json()["mastery"] is None
    assert accepted.json()["duplicate"] is False


def test_api_attempt_is_idempotent_and_rejects_stale_or_reused_tokens(
    client: TestClient,
) -> None:
    item = client.post(
        "/api/v1/items",
        json={
            "hebrew_text": "עברית",
            "hebrew_with_niqqud": "עִבְרִית",
            "translation_en": "Hebrew",
        },
    ).json()
    activity = client.get("/api/v1/learning-core/next").json()["activity"]
    payload = {
        "item_id": item["id"],
        "activity_token": activity["activity_token"],
        "idempotency_key": "double-click-0001",
        "is_correct": True,
        "confidence": 4,
    }

    first = client.post("/api/v1/learning-core/attempt", json=payload)
    replay = client.post("/api/v1/learning-core/attempt", json=payload)
    assert first.status_code == replay.status_code == 200
    assert first.json()["duplicate"] is False
    assert replay.json()["duplicate"] is True
    assert replay.json()["attempt"]["id"] == first.json()["attempt"]["id"]
    assert replay.json()["state"]["state_version"] == first.json()["state"]["state_version"]

    reused_key = client.post(
        "/api/v1/learning-core/attempt",
        json={**payload, "is_correct": False},
    )
    assert reused_key.status_code == 409
    assert reused_key.json()["error"]["code"] == "learning_core_conflict"

    stale = client.post(
        "/api/v1/learning-core/attempt",
        json={**payload, "idempotency_key": "stale-token-0002"},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "learning_core_conflict"

    current = client.get("/api/v1/learning-core/next").json()["activity"]
    assert current["phase"] == "retrieval"
    assert current["activity_token"] != activity["activity_token"]
    other_item = client.post("/api/v1/items", json={"hebrew_text": "מילה"}).json()
    wrong_item = client.post(
        "/api/v1/learning-core/attempt",
        json={
            "item_id": other_item["id"],
            "activity_token": current["activity_token"],
            "idempotency_key": "wrong-item-0003",
            "is_correct": True,
        },
    )
    assert wrong_item.status_code == 409
    assert wrong_item.json()["error"]["code"] == "learning_core_conflict"
    second = client.post(
        "/api/v1/learning-core/attempt",
        json={
            "item_id": item["id"],
            "activity_token": current["activity_token"],
            "idempotency_key": "current-token-0004",
            "is_correct": True,
        },
    )
    assert second.status_code == 200
    assert second.json()["attempt"]["phase"] == "retrieval"

    services = client.app.state.services
    connection = services.database.connect()
    assert connection.execute("SELECT COUNT(*) FROM learning_core_attempts").fetchone()[0] == 2
    assert connection.execute("SELECT COUNT(*) FROM learning_core_idempotency").fetchone()[0] == 2


def test_learning_activity_and_bounded_replay_cache_exclude_private_item_fields(
    repository: LearningRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # The production retention is 200 so one long session keeps its replay
    # protection; shrink it here to prove the eviction bound without 200 writes.
    monkeypatch.setattr(repository_module, "LEARNING_CORE_IDEMPOTENCY_RETENTION", 25)
    secret = "PRIVATE-CAPTURE-NOTE-DO-NOT-REPLAY"
    item = repository.create_item(
        {
            "hebrew_text": "לשמור",
            "hebrew_with_niqqud": "לִשְׁמוֹר",
            "translation_en": "to keep",
            "personal_note": secret,
            "source_label": "private-family-context",
        }
    )
    activity = repository.next_learning_core_activity()["activity"]
    assert activity is not None
    assert activity["item"]["hebrew_text"] == "לשמור"
    assert "personal_note" not in activity["item"]
    assert "source_label" not in activity["item"]
    assert "due_at" not in activity["item"]

    for index in range(30):
        current = repository.next_learning_core_activity()["activity"]
        assert current is not None
        is_correct = current["phase"] != "corrected_retry"
        repository.submit_learning_core_attempt(
            {
                "item_id": item["id"],
                "activity_token": current["activity_token"],
                "idempotency_key": f"bounded-replay-{index:04d}",
                "is_correct": is_correct,
                "confidence": 3,
            }
        )

    connection = repository.database.connect()
    try:
        rows = connection.execute(
            """
            SELECT response_json
            FROM learning_core_idempotency
            ORDER BY created_at, idempotency_key
            """
        ).fetchall()
    finally:
        connection.close()
    assert len(rows) == 25
    assert all(secret not in str(row["response_json"]) for row in rows)
    assert all("personal_note" not in str(row["response_json"]) for row in rows)
    assert all("source_label" not in str(row["response_json"]) for row in rows)


def test_hints_are_logged_as_assistance_without_changing_independent_mastery(
    repository: LearningRepository,
) -> None:
    item = repository.create_item({"hebrew_text": "ללמוד", "translation_en": "to learn"})
    _submit_core(repository,
        {"item_id": item["id"], "is_correct": True, "confidence": 3}
    )
    assisted_retrieval = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "hints_used": 1,
        }
    )
    assert assisted_retrieval["attempt"]["evidence_kind"] == "assisted"
    assert assisted_retrieval["mastery"] is None
    assert assisted_retrieval["reading_support_state"]["total_successes"] == 0
    assert assisted_retrieval["reading_support_state"]["total_failures"] == 0

    _submit_core(repository,
        {"item_id": item["id"], "is_correct": True, "confidence": 3}
    )
    correction = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "hints_used": 1,
        }
    )
    assert correction["attempt"]["evidence_kind"] == "correction_uptake"
    assert correction["mastery"]["production"] > 0

    with repository.database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET due_at = ? WHERE item_id = ?",
            ((datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(), item["id"]),
        )
    assisted_delayed = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "hints_used": 1,
        }
    )
    assert assisted_delayed["attempt"]["evidence_kind"] == "assisted"
    assert assisted_delayed["mastery"] is None
    checkpoints = repository.learning_core_state()["retention_checkpoints"]
    assert all(checkpoint["attempts"] == 0 for checkpoint in checkpoints)

    assisted_transfer = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "hints_used": 1,
        }
    )
    assert assisted_transfer["attempt"]["evidence_kind"] == "assisted"
    assert assisted_transfer["mastery"] is None


def test_progress_counts_meaningful_core_evidence_without_awarding_xp(
    repository: LearningRepository,
) -> None:
    item = repository.create_item(
        {"hebrew_text": "להתקדם", "translation_en": "to progress"}
    )
    xp_before_core = repository.gamification_status()["xp"]["total"]

    _submit_core(repository,
        {"item_id": item["id"], "is_correct": True, "confidence": 3}
    )
    assisted = _submit_core(repository,
        {
            "item_id": item["id"],
            "is_correct": True,
            "confidence": 4,
            "hints_used": 1,
        }
    )
    assert assisted["attempt"]["evidence_kind"] == "assisted"
    assisted_progress = repository.progress()
    assert assisted_progress["modalities"] == []
    assert assisted_progress["streak_days"] == 0
    assert assisted_progress["activity"][0]["practice_events"] == 2
    assert assisted_progress["activity"][0]["attempts"] == 0
    assert assisted_progress["activity"][0]["assisted_or_exposure_events"] == 2
    exposure_event = next(
        event
        for event in assisted_progress["activity_log"]
        if event["details"].get("evidence_kind") == "exposure"
    )
    assert "correct" not in exposure_event["details"]
    assisted_event = next(
        event
        for event in assisted_progress["activity_log"]
        if event["details"].get("evidence_kind") == "assisted"
    )
    assert assisted_event["details"]["correct"] is True

    _submit_core(repository,
        {"item_id": item["id"], "is_correct": True, "confidence": 3}
    )
    correction = _submit_core(repository,
        {"item_id": item["id"], "is_correct": True, "confidence": 4}
    )
    assert correction["attempt"]["evidence_kind"] == "correction_uptake"
    assert repository.gamification_status()["xp"]["total"] == xp_before_core

    progress = repository.progress()
    production = next(
        row for row in progress["modalities"] if row["modality"] == "production"
    )
    assert production["attempts"] == 1
    assert production["legacy_attempts"] == 0
    assert production["learning_core_attempts"] == 1
    assert progress["activity"][0]["practice_events"] == 4
    assert progress["activity"][0]["attempts"] == 1
    assert progress["activity"][0]["correct"] == 1
    assert progress["activity"][0]["assisted_or_exposure_events"] == 3
    assert progress["streak_days"] == 1
    assert progress["activity_log"][0]["details"]["evidence_kind"] == (
        "correction_uptake"
    )
    assert progress["activity_log"][0]["details"]["xp_awarded"] == 0
    assert progress["activity_log"][0]["details"]["correct"] is True

    legacy_item = repository.create_item({"hebrew_text": "לתרגל"})
    repository.submit_review(
        legacy_item["id"],
        {
            "is_correct": True,
            "confidence": 4,
            "modality": "production",
            "response_ms": 1000,
        },
    )
    combined = next(
        row
        for row in repository.progress()["modalities"]
        if row["modality"] == "production"
    )
    assert combined["attempts"] == 2
    assert combined["legacy_attempts"] == 1
    assert combined["learning_core_attempts"] == 1


def test_profile_track_band_and_mode_remain_independent(client: TestClient) -> None:
    response = client.put(
        "/api/v1/profile",
        json={
            "curriculum_track": "formal_professional",
            "cefr_band": "B2",
            "learner_mode": "guided",
        },
    )
    assert response.status_code == 200
    profile = response.json()
    assert profile["curriculum_track"] == "formal_professional"
    assert profile["cefr_band"] == profile["hebrew_level"] == "B2"
    assert profile["learner_mode"] == "guided"

    core = client.get("/api/v1/learning-core").json()
    assert core["profile"] == {
        "curriculum_track": "formal_professional",
        "cefr_band": "B2",
        "learner_mode": "guided",
    }
    assert core["curriculum"]["selection_policy"] == "shared_due_queue_pilot"
    assert core["curriculum"]["track_status"] == "preference_only"
    assert core["curriculum"]["cefr_status"] == "self_selected_planning_band"


def test_skill_map_distinguishes_observed_failure_from_unmeasured_skill(
    repository: LearningRepository,
) -> None:
    item = repository.create_item({"hebrew_text": "לדבר"})
    repository.submit_review(
        item["id"],
        {
            "is_correct": False,
            "confidence": 2,
            "modality": "speaking",
            "response_ms": 1200,
        },
    )

    core = repository.learning_core_state()
    assert core["curriculum"]["skill_map_metric"] == "meaningful_attempt_accuracy"
    assert core["skill_map"]["speaking"] == 0
    assert core["skill_evidence_counts"]["speaking"] == 1
    assert core["skill_map"]["recognition"] == 0
    assert core["skill_evidence_counts"]["recognition"] == 0


def test_empty_core_reports_earliest_future_review_without_mutation(
    repository: LearningRepository,
) -> None:
    item = repository.create_item({"hebrew_text": "מחר", "translation_en": "tomorrow"})
    future_due = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(timespec="seconds")
    with repository.database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET repetitions = 1, due_at = ? WHERE item_id = ?",
            (future_due, item["id"]),
        )

    connection = repository.database.connect()
    try:
        before = connection.execute(
            "SELECT COUNT(*) FROM learning_core_state"
        ).fetchone()[0]
    finally:
        connection.close()
    next_payload = repository.next_learning_core_activity()
    connection = repository.database.connect()
    try:
        after = connection.execute(
            "SELECT COUNT(*) FROM learning_core_state"
        ).fetchone()[0]
    finally:
        connection.close()

    assert next_payload["available"] is False
    assert next_payload["activity"] is None
    assert next_payload["state"]["current_item_id"] is None
    assert next_payload["state"]["wait_until"] == future_due
    assert after == before == 0


def test_submitting_a_not_yet_due_review_is_a_conflict_not_a_bad_request(
    repository: LearningRepository,
) -> None:
    """A too-early submit is a server-owned scheduling conflict, like a stale token.

    The client distinguishes recoverable state conflicts (reload the activity) from
    malformed input by status code, so this path must stay on the 409 branch.
    """
    item = repository.create_item({"hebrew_text": "מחר", "translation_en": "tomorrow"})
    # Drive the loop to delayed_review, which is the only phase that parks the
    # learner behind a wait_until window.
    for _ in range(4):
        _submit_core(repository, {"item_id": item["id"], "is_correct": True, "confidence": 4})

    state = repository.learning_core_state()["state"]
    assert state["phase"] == "delayed_review"
    assert state["wait_until"] is not None

    activity = repository.next_learning_core_activity()["activity"]
    assert activity is not None, "a waiting delayed review still describes its activity"
    assert activity["can_submit"] is False

    with pytest.raises(LearningCoreConflictError):
        repository.submit_learning_core_attempt(
            {
                "item_id": item["id"],
                "activity_token": activity["activity_token"],
                "idempotency_key": "not-due-delayed-review-0001",
                "is_correct": True,
                "confidence": 4,
            }
        )


def test_v25_cloud_snapshot_hydrates_and_upgrades_on_next_write() -> None:
    store = MemoryCloudStore()
    user = store.create_test_user("Legacy")
    repository = CloudLearningRepository(store, user.id, user.display_name)
    repository.update_profile({"hebrew_level": "B2", "learner_mode": "experienced"})
    item = repository.create_item({"hebrew_text": "תודה", "translation_en": "thanks"})
    repository.submit_review(
        item["id"],
        {"is_correct": True, "confidence": 4, "modality": "recognition"},
    )
    repository.create_item({"hebrew_text": "בבקשה", "translation_en": "please"})
    old_state = store.read_state(user.id)
    for table in (
        "learning_core_state",
        "reading_support_state",
        "learning_core_attempts",
        "learning_core_idempotency",
    ):
        old_state["tables"].pop(table, None)
    for profile in old_state["tables"]["profiles"]:
        profile.pop("curriculum_track", None)
        profile.pop("cefr_band", None)
    for mastery in old_state["tables"]["skill_mastery"]:
        mastery.pop("pointed_reading", None)
        mastery.pop("unpointed_reading", None)
        mastery.pop("contextual_transfer", None)

    store.mutate_state(user.id, lambda _current: (old_state, None))
    migrated = CloudLearningRepository(store, user.id, user.display_name)
    core = migrated.learning_core_state()
    assert core["profile"]["curriculum_track"] == "modern_conversation"
    assert core["profile"]["cefr_band"] == "B2"
    assert core["profile"]["learner_mode"] == "experienced"
    assert core["skill_map"]["recognition"] > 0
    assert core["skill_map"]["pointed_reading"] == 0

    activity = migrated.next_learning_core_activity()["activity"]
    _submit_core(migrated,
        {"item_id": activity["item"]["id"], "is_correct": True, "confidence": 3}
    )
    upgraded = store.read_state(user.id)
    assert "learning_core_state" in upgraded["tables"]
    assert "learning_core_idempotency" in upgraded["tables"]
    assert "pointed_reading" in upgraded["tables"]["skill_mastery"][0]


def test_cloud_devices_serialize_idempotent_attempts_and_reject_stale_state() -> None:
    store = MemoryCloudStore()
    user = store.create_test_user("TwoDevices")
    first_device = CloudLearningRepository(store, user.id, user.display_name)
    second_device = CloudLearningRepository(store, user.id, user.display_name)
    item = first_device.create_item(
        {
            "hebrew_text": "להקשיב",
            "hebrew_with_niqqud": "לְהַקְשִׁיב",
            "translation_en": "to listen",
        }
    )
    activity = first_device.next_learning_core_activity()["activity"]
    assert activity is not None
    payload = {
        "item_id": item["id"],
        "activity_token": activity["activity_token"],
        "idempotency_key": "multi-device-0001",
        "is_correct": True,
        "confidence": 4,
    }

    first = first_device.submit_learning_core_attempt(payload)
    replay = second_device.submit_learning_core_attempt(payload)
    assert first["duplicate"] is False
    assert replay["duplicate"] is True
    assert replay["attempt"]["id"] == first["attempt"]["id"]

    with pytest.raises(LearningCoreConflictError, match="stale"):
        second_device.submit_learning_core_attempt(
            {**payload, "idempotency_key": "multi-device-stale-0002"}
        )

    snapshot = store.read_state(user.id)
    assert len(snapshot["tables"]["learning_core_attempts"]) == 1
    assert len(snapshot["tables"]["learning_core_idempotency"]) == 1
    assert snapshot["tables"]["learning_core_state"][0]["state_version"] == 1


def test_retention_accuracy_requires_three_timed_delayed_attempts(
    repository: LearningRepository,
) -> None:
    item_ids = [
        repository.create_item({"hebrew_text": text})["id"]
        for text in ("אחד", "שתיים", "שלוש")
    ]
    learned_at = datetime(2026, 7, 1, 8, tzinfo=timezone.utc)
    delayed_at = learned_at + timedelta(hours=24)
    with repository.database.transaction() as connection:
        for index, item_id in enumerate(item_ids):
            connection.execute(
                """
                INSERT INTO learning_core_attempts(
                    item_id, phase, skill_dimension, evidence_kind, reading_support, is_correct,
                    confidence, response_ms, hints_used, created_at
                ) VALUES(?, 'corrected_retry', 'production', 'correction_uptake',
                         'full_niqqud', 1, 4, 900, 0, ?)
                """,
                (item_id, (learned_at + timedelta(minutes=index)).isoformat()),
            )
            connection.execute(
                """
                INSERT INTO learning_core_attempts(
                    item_id, phase, skill_dimension, evidence_kind, reading_support, is_correct,
                    confidence, response_ms, hints_used, created_at
                ) VALUES(?, 'delayed_review', 'pointed_reading', 'unassisted',
                         'full_niqqud', ?, 4, 900, 0, ?)
                """,
                (
                    item_id,
                    int(index < 2),
                    (delayed_at + timedelta(minutes=index)).isoformat(),
                ),
            )

    checkpoints = {
        entry["checkpoint"]: entry
        for entry in repository.learning_core_state()["retention_checkpoints"]
    }
    assert checkpoints["24h"] == {
        "checkpoint": "24h",
        "evidence_source": "learner_self_report",
        "window_hours": {"minimum": 18, "maximum": 54},
        "attempts": 3,
        "correct": 2,
        "accuracy": 0.6667,
        "status": "observed",
    }
    assert checkpoints["7d"]["accuracy"] is None
    assert checkpoints["7d"]["status"] == "insufficient_evidence"


def test_retention_windows_ignore_attempts_outside_declared_boundaries(
    repository: LearningRepository,
) -> None:
    elapsed_cases = (17.9, 18.1, 53.9, 54.1, 120.1, 239.9, 240.1, 504.1, 1079.9, 1080.1)
    item_ids = [
        repository.create_item({"hebrew_text": f"חלון-{index}"})["id"]
        for index in range(len(elapsed_cases))
    ]
    base = datetime(2026, 1, 1, 8, tzinfo=timezone.utc)
    with repository.database.transaction() as connection:
        for index, (item_id, elapsed_hours) in enumerate(
            zip(item_ids, elapsed_cases, strict=True)
        ):
            learned_at = base + timedelta(days=index * 60)
            delayed_at = learned_at + timedelta(hours=elapsed_hours)
            connection.execute(
                """
                INSERT INTO learning_core_attempts(
                    item_id, phase, skill_dimension, evidence_kind, reading_support, is_correct,
                    confidence, response_ms, hints_used, created_at
                ) VALUES(?, 'corrected_retry', 'production', 'correction_uptake',
                         'full_niqqud', 1, 4, 900, 0, ?)
                """,
                (item_id, learned_at.isoformat()),
            )
            connection.execute(
                """
                INSERT INTO learning_core_attempts(
                    item_id, phase, skill_dimension, evidence_kind, reading_support, is_correct,
                    confidence, response_ms, hints_used, created_at
                ) VALUES(?, 'delayed_review', 'pointed_reading', 'unassisted',
                         'full_niqqud', 1, 4, 900, 0, ?)
                """,
                (item_id, delayed_at.isoformat()),
            )

    checkpoints = {
        entry["checkpoint"]: entry
        for entry in repository.learning_core_state()["retention_checkpoints"]
    }
    assert checkpoints["24h"] == {
        "checkpoint": "24h",
        "evidence_source": "learner_self_report",
        "window_hours": {"minimum": 18, "maximum": 54},
        "attempts": 2,
        "correct": 2,
        "accuracy": None,
        "status": "insufficient_evidence",
    }
    assert checkpoints["7d"]["window_hours"] == {"minimum": 120, "maximum": 240}
    assert checkpoints["7d"]["attempts"] == 2
    assert checkpoints["30d"]["window_hours"] == {"minimum": 504, "maximum": 1080}
    assert checkpoints["30d"]["attempts"] == 2
    assert sum(entry["attempts"] for entry in checkpoints.values()) == 6
