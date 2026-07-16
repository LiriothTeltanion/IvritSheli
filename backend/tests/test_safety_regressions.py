"""Safety regressions for cloud consent, review timing, and operational readiness."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi.testclient import TestClient

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.database import Database
from ivrit_sheli.dictionary import DICTIONARY_SCHEMA_VERSION
from ivrit_sheli.repository import LearningRepository


def test_cloud_provider_routes_require_stored_consent(
    client: TestClient,
) -> None:
    offline_ai = client.post(
        "/api/v1/ai/correct",
        json={"payload": {"text": "אני לומד"}, "cloud_requested": False},
    )
    browser_tts = client.post(
        "/api/v1/audio/tts",
        json={"text": "שלום", "cloud_requested": False},
    )
    assert offline_ai.status_code == 200
    assert offline_ai.json()["provider"] == "offline"
    assert browser_tts.status_code == 200
    assert browser_tts.json()["provider"] == "browser"

    guarded_responses = (
        client.post(
            "/api/v1/ai/correct",
            json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
        ),
        client.post(
            "/api/v1/audio/tts",
            json={"text": "שלום", "cloud_requested": True},
        ),
        client.post(
            "/api/v1/audio/stt?cloud_requested=true",
            files={"file": ("sample.webm", b"synthetic", "audio/webm")},
        ),
    )
    for response in guarded_responses:
        assert response.status_code == 403
        error = response.json()["error"]
        assert error["code"] == "cloud_consent_required"
        assert "Settings" in error["message"]

    consent = client.put("/api/v1/profile", json={"cloud_consent": True})
    assert consent.status_code == 200
    allowed_fallback = client.post(
        "/api/v1/ai/correct",
        json={"payload": {"text": "אני לומד"}, "cloud_requested": True},
    )
    assert allowed_fallback.status_code == 200
    assert allowed_fallback.json()["provider"] == "offline"


def test_sqlite_review_queue_excludes_future_items(
    repository: LearningRepository,
    database: Database,
) -> None:
    item = repository.create_item({"hebrew_text": "מחר"})
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(timespec="seconds")
    with database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET due_at = ? WHERE item_id = ?",
            (future, item["id"]),
        )
    assert repository.next_reviews() == []

    past = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat(timespec="seconds")
    with database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET due_at = ? WHERE item_id = ?",
            (past, item["id"]),
        )
    assert repository.next_reviews()[0]["id"] == item["id"]


def test_cloud_review_queue_uses_the_same_due_only_contract() -> None:
    store = MemoryCloudStore()
    user = store.create_test_user("Due Learner")
    repository = CloudLearningRepository(store, user.id, user.display_name)
    item = repository.create_item({"hebrew_text": "בעתיד"})
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(timespec="seconds")

    def postpone(state: dict[str, Any]) -> tuple[dict[str, Any], None]:
        state["tables"]["review_state"][0]["due_at"] = future
        return state, None

    store.mutate_state(user.id, postpone)
    assert repository.next_reviews() == []

    past = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat(timespec="seconds")

    def make_due(state: dict[str, Any]) -> tuple[dict[str, Any], None]:
        state["tables"]["review_state"][0]["due_at"] = past
        return state, None

    store.mutate_state(user.id, make_due)
    assert repository.next_reviews()[0]["id"] == item["id"]


def test_readiness_fails_closed_when_dictionary_has_no_usable_data(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    monkeypatch.setattr(
        client.app.state.services.dictionary,
        "stats",
        lambda: {
            "entries": 0,
            "senses": 0,
            "metadata": {"schema_version": str(DICTIONARY_SCHEMA_VERSION)},
        },
    )

    response = client.get("/health/ready")
    assert response.status_code == 503
    checks = response.json()["checks"]
    assert checks["dictionary"] is False
    assert checks["dictionary_details"] == {
        "ready": False,
        "mode": "device_local",
        "required": True,
        "entries": 0,
        "senses": 0,
        "schema_version": DICTIONARY_SCHEMA_VERSION,
        "expected_schema_version": DICTIONARY_SCHEMA_VERSION,
    }


def test_readiness_rejects_an_unknown_dictionary_schema(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    monkeypatch.setattr(
        client.app.state.services.dictionary,
        "stats",
        lambda: {
            "entries": 12,
            "senses": 12,
            "metadata": {"schema_version": "999"},
        },
    )

    response = client.get("/health/ready")
    assert response.status_code == 503
    details = response.json()["checks"]["dictionary_details"]
    assert details["ready"] is False
    assert details["schema_version"] == 999
