"""Learned-word registry contracts, dictionary links, and tenant-isolation tests."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.database import Database
from ivrit_sheli.repository import LearningRepository


def test_registry_exposes_real_status_mastery_and_activity(
    repository: LearningRepository,
    database: Database,
) -> None:
    needs_review = repository.create_item(
        {"hebrew_text": "שלום", "translation_en": "hello", "translation_es": "hola"}
    )
    active = repository.create_item(
        {"hebrew_text": "תודה", "translation_en": "thanks", "translation_es": "gracias"}
    )
    recognition_only = repository.create_item(
        {"hebrew_text": "כן", "translation_en": "yes", "translation_es": "sí"}
    )
    mastered = repository.create_item(
        {"hebrew_text": "בבקשה", "translation_en": "please", "translation_es": "por favor"}
    )
    with database.transaction() as connection:
        connection.execute(
            "UPDATE review_state SET due_at = ? WHERE item_id = ?",
            ("2099-01-02T00:00:00+00:00", active["id"]),
        )
        connection.execute(
            """
            UPDATE review_state
            SET due_at = ?, repetitions = 5, interval_days = 30,
                last_reviewed_at = ?
            WHERE item_id = ?
            """,
            ("2099-02-01T00:00:00+00:00", "2097-07-10T08:00:00+00:00", mastered["id"]),
        )
        connection.execute(
            """
            INSERT INTO skill_mastery(
                concept_key, concept_type, recognition, production,
                listening, speaking, observations, updated_at
            ) VALUES(?, 'learning_item', 0.82, 0.74, 0.61, 0.70, 12, ?)
            """,
            (f"item:{mastered['id']}", "2098-07-12T08:00:00+00:00"),
        )
        connection.execute(
            """
            INSERT INTO attempts(
                item_id, exercise_type, modality, is_correct, response_ms,
                confidence, hints_used, created_at
            ) VALUES(?, 'mixed_review', 'recognition', 1, 900, 4, 0, ?)
            """,
            (mastered["id"], "2097-07-11T08:00:00+00:00"),
        )
        connection.execute(
            """
            UPDATE review_state
            SET due_at = ?, repetitions = 6, interval_days = 30
            WHERE item_id = ?
            """,
            ("2099-02-01T00:00:00+00:00", recognition_only["id"]),
        )
        connection.execute(
            """
            INSERT INTO skill_mastery(
                concept_key, concept_type, recognition, production,
                listening, speaking, observations, updated_at
            ) VALUES(?, 'learning_item', 0.92, 0, 0, 0, 8, ?)
            """,
            (f"item:{recognition_only['id']}", "2098-07-13T08:00:00+00:00"),
        )

    payload = repository.registry_items(sort="alphabetical")

    by_id = {item["id"]: item for item in payload["items"]}
    assert payload["total"] == 4
    assert payload["offset"] == 0
    assert payload["limit"] == 200
    assert payload["has_more"] is False
    assert payload["next_offset"] is None
    assert payload["summary"] == {"active": 2, "mastered": 1, "needs_review": 1}
    assert by_id[needs_review["id"]]["status"] == "needs_review"
    assert by_id[needs_review["id"]]["due_state"] == "due"
    assert by_id[active["id"]]["status"] == "active"
    assert by_id[recognition_only["id"]]["status"] == "active"
    assert by_id[mastered["id"]]["status"] == "mastered"
    assert by_id[mastered["id"]]["mastery"] == {
        "recognition": 0.82,
        "production": 0.74,
        "listening": 0.61,
        "speaking": 0.7,
        "observations": 12,
    }
    assert by_id[mastered["id"]]["review_count"] == 1
    assert by_id[mastered["id"]]["saved_at"] == mastered["created_at"]
    assert by_id[mastered["id"]]["last_activity_at"] == "2098-07-12T08:00:00+00:00"

    spanish_search = repository.registry_items(query="gracias")
    assert [item["id"] for item in spanish_search["items"]] == [active["id"]]
    assert repository.registry_items(status="mastered")["total"] == 1
    due_registry = repository.registry_items(due="due")
    upcoming_registry = repository.registry_items(due="upcoming", status="mastered")
    assert due_registry["total"] == 1
    assert due_registry["summary"] == {"active": 0, "mastered": 0, "needs_review": 1}
    assert upcoming_registry["total"] == 1
    assert upcoming_registry["summary"] == {"active": 2, "mastered": 1, "needs_review": 0}


def test_registry_offset_pagination_reaches_items_beyond_500(
    repository: LearningRepository,
    database: Database,
) -> None:
    """Pages stay bounded while totals and summaries cover the complete registry."""
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    with database.transaction() as connection:
        for index in range(501):
            created_at = (start + timedelta(minutes=index)).isoformat(timespec="seconds")
            cursor = connection.execute(
                """
                INSERT INTO learning_items(
                    hebrew_text, normalized_text, translation_en, item_type,
                    context_label, source_label, priority, created_at, updated_at
                ) VALUES(?, ?, ?, 'word', 'dictionary', 'pagination-test', 0.5, ?, ?)
                """,
                (
                    f"מילה {index:03d}",
                    f"מילה {index:03d}",
                    f"word {index:03d}",
                    created_at,
                    created_at,
                ),
            )
            item_id = cursor.lastrowid
            assert item_id is not None
            connection.execute(
                "INSERT INTO review_state(item_id, due_at) VALUES(?, ?)",
                (item_id, "2099-01-01T00:00:00+00:00"),
            )

    pages = [
        repository.registry_items(limit=200, offset=offset, sort="saved_asc")
        for offset in (0, 200, 400)
    ]

    assert [len(page["items"]) for page in pages] == [200, 200, 101]
    assert [page["offset"] for page in pages] == [0, 200, 400]
    assert [page["next_offset"] for page in pages] == [200, 400, None]
    assert [page["has_more"] for page in pages] == [True, True, False]
    assert all(page["total"] == 501 for page in pages)
    assert all(
        page["summary"] == {"active": 501, "mastered": 0, "needs_review": 0} for page in pages
    )
    ids = [item["id"] for page in pages for item in page["items"]]
    assert len(ids) == len(set(ids)) == 501


def test_registry_api_and_dictionary_learning_state_are_linked(client: TestClient) -> None:
    first_lookup = client.get("/api/v1/dictionary/lookup", params={"word": "שלום"})
    assert first_lookup.status_code == 200
    entry = first_lookup.json()["results"][0]
    assert entry["learning_item_id"] is None
    assert entry["learning_status"] is None

    learned = client.post(f"/api/v1/dictionary/{entry['id']}/learn")
    assert learned.status_code == 201
    item_id = learned.json()["id"]

    repeated = client.post(f"/api/v1/dictionary/{entry['id']}/learn")
    registry = client.get(
        "/api/v1/registry",
        params={"q": "hello", "status": "needs_review", "sort": "due_asc"},
    )
    second_lookup = client.get("/api/v1/dictionary/lookup", params={"word": "שלום"})

    assert repeated.status_code == 201
    assert repeated.json()["id"] == item_id
    assert registry.status_code == 200
    assert registry.json()["total"] == 1
    assert registry.json()["offset"] == 0
    assert registry.json()["has_more"] is False
    assert registry.json()["items"][0]["id"] == item_id
    decorated = second_lookup.json()["results"][0]
    assert decorated["learning_item_id"] == item_id
    assert decorated["learning_status"] == "needs_review"


def test_dictionary_entry_links_are_atomic_and_homograph_safe(
    repository: LearningRepository,
) -> None:
    payload = {
        "hebrew_text": "שלום",
        "translation_en": "peace; hello",
        "item_type": "word",
    }
    with ThreadPoolExecutor(max_workers=2) as executor:
        duplicates = list(
            executor.map(
                lambda _: repository.get_or_create_dictionary_item(41, payload),
                range(2),
            )
        )

    second_sense = repository.get_or_create_dictionary_item(
        42,
        {
            **payload,
            "translation_en": "a distinct homograph sense",
        },
    )
    states = repository.learning_states_for_sources(["dictionary:41", "dictionary:42"])

    assert duplicates[0]["id"] == duplicates[1]["id"]
    assert second_sense["id"] != duplicates[0]["id"]
    assert len(repository.list_items()) == 2
    assert states["dictionary:41"]["item_id"] == duplicates[0]["id"]
    assert states["dictionary:42"]["item_id"] == second_sense["id"]


def test_cloud_registry_and_dictionary_state_remain_tenant_isolated() -> None:
    store = MemoryCloudStore()
    alpha = store.create_test_user("Alpha")
    beta = store.create_test_user("Beta")
    alpha_repository = CloudLearningRepository(store, alpha.id, alpha.display_name)
    beta_repository = CloudLearningRepository(store, beta.id, beta.display_name)
    alpha_item = alpha_repository.create_item({"hebrew_text": "סוד", "translation_en": "secret"})

    assert [item["id"] for item in alpha_repository.registry_items()["items"]] == [alpha_item["id"]]
    assert beta_repository.registry_items()["items"] == []
    with ThreadPoolExecutor(max_workers=2) as executor:
        linked_items = list(
            executor.map(
                lambda _: alpha_repository.get_or_create_dictionary_item(
                    77,
                    {"hebrew_text": "סוד", "translation_en": "secret"},
                ),
                range(2),
            )
        )
    linked = linked_items[0]
    assert linked_items[1]["id"] == linked["id"]
    assert (
        alpha_repository.learning_states_for_sources(["dictionary:77"])["dictionary:77"]["item_id"]
        == linked["id"]
    )
    second_page = alpha_repository.registry_items(limit=1, offset=1, sort="saved_asc")
    assert second_page["offset"] == 1
    assert second_page["total"] == 2
    assert [item["id"] for item in second_page["items"]] == [linked["id"]]
    assert second_page["has_more"] is False
    assert beta_repository.learning_states_for_sources(["dictionary:77"]) == {}
