"""Hebrew Alphabet Studio catalog, persistence, API, and isolation tests."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.dictionary import DEMO_ENTRIES
from ivrit_sheli.hebrew_alphabet import (
    ALPHABET_BY_KEY,
    ALPHABET_CONTRACT_VERSION,
    BASE_ALPHABET,
    FINAL_FORMS,
    HEBREW_ALPHABET,
    alphabet_unit,
    build_alphabet_activity,
)
from ivrit_sheli.local_learning_engine import LocalLearningEngine
from ivrit_sheli.repository import LearningRepository


def _answer(
    repository: LearningRepository | CloudLearningRepository,
    letter_key: str,
    *,
    idempotency_key: str,
    answer_key: str | None = None,
) -> dict[str, object]:
    catalog = repository.alphabet_catalog(letter_key)
    activity = catalog["next_activity"]
    return repository.submit_alphabet_attempt(
        letter_key,
        {
            "activity_token": activity["activity_token"],
            "idempotency_key": idempotency_key,
            "answer_key": answer_key or letter_key,
            "confidence": 4,
            "response_ms": 750,
            "hints_used": 0,
        },
    )


def test_reviewed_catalog_has_22_letters_and_five_positional_finals() -> None:
    assert len(HEBREW_ALPHABET) == 27
    assert len(BASE_ALPHABET) == 22
    assert len(FINAL_FORMS) == 5
    assert len({unit.key for unit in HEBREW_ALPHABET}) == 27
    assert [unit.order for unit in HEBREW_ALPHABET] == list(range(1, 28))
    assert {unit.letter for unit in FINAL_FORMS} == {"ך", "ם", "ן", "ף", "ץ"}
    assert {unit.base_key for unit in FINAL_FORMS} == {
        "kaf",
        "mem",
        "nun",
        "pe",
        "tsadi",
    }
    with pytest.raises(TypeError):
        ALPHABET_BY_KEY["invented"] = HEBREW_ALPHABET[0]  # type: ignore[index]

    for unit in BASE_ALPHABET:
        assert unit.example.word.startswith(unit.letter)
    for unit in FINAL_FORMS:
        assert unit.example.word.endswith(unit.letter)
    reviewed_dictionary_words = {str(entry["word"]) for entry in DEMO_ENTRIES}
    assert all(
        unit.example.word in reviewed_dictionary_words for unit in HEBREW_ALPHABET
    )


def test_catalog_labels_modern_variants_and_uses_pointed_names_for_tts() -> None:
    bet = alphabet_unit("bet").to_dict()
    vav = alphabet_unit("vav").to_dict()
    ayin = alphabet_unit("ayin").to_dict()
    shin = alphabet_unit("shin").to_dict()

    assert {(sound["form"], sound["ipa"]) for sound in bet["sounds"]} == {
        ("בּ", "/b/"),
        ("ב", "/v/"),
    }
    assert {sound["form"] for sound in vav["sounds"]} == {"ו", "וֹ", "וּ"}
    assert any(sound["usage"] == "heritage" for sound in ayin["sounds"])
    assert {sound["form"] for sound in shin["sounds"]} == {"שׁ", "שׂ"}
    assert all(sound["mastery_required"] for sound in bet["sounds"])
    assert {
        sound["key"]: sound["mastery_required"] for sound in vav["sounds"]
    } == {"v": True, "holam": False, "shuruk": False}
    assert {
        sound["key"]: sound["mastery_required"]
        for sound in alphabet_unit("yod").to_dict()["sounds"]
    } == {"y": True, "i_marker": False}
    for unit in HEBREW_ALPHABET:
        public = unit.to_dict()
        assert public["tts_text"] == public["name_niqqud"]
        assert public["example"]["dictionary_query"] == unit.example.word
        assert set(public["name"]) == {"en", "es", "he"}
        assert set(public["explanation"]) == {"en", "es", "he"}
        assert public["content_revision"] == "2026-07-27.1"
        assert public["editorial_status"] == "reviewed"
        assert public["visual_confusions"] == public["confusions"]
        assert len(public["source_refs"]) == 4
        assert len(public["sources"]) == 4

    public_units = {
        unit.key: unit.to_dict() for unit in HEBREW_ALPHABET
    }
    expected_sound_confusions = {
        "bet": {"vav"},
        "vav": {"bet"},
        "shin": {"samekh"},
        "samekh": {"shin"},
        "pe": {"final_pe"},
        "final_pe": {"pe"},
        "kaf": {"het", "final_kaf"},
        "het": {"kaf", "final_kaf"},
        "final_kaf": {"kaf", "het"},
    }
    for key, expected in expected_sound_confusions.items():
        assert expected <= set(public_units[key]["sound_confusions"])
    for unit in HEBREW_ALPHABET:
        unit_modern_ipas = {
            sound.ipa for sound in unit.sounds if sound.usage != "heritage"
        }
        for other_key in public_units[unit.key]["sound_confusions"]:
            other = alphabet_unit(str(other_key))
            other_modern_ipas = {
                sound.ipa
                for sound in other.sounds
                if sound.usage != "heritage"
            }
            assert unit.key in public_units[other.key]["sound_confusions"]
            assert unit_modern_ipas & other_modern_ipas


def test_every_sound_activity_uses_distinct_ipa_and_exact_sounded_forms() -> None:
    progress = {
        "recognition_successes": 2,
        "sound_successes": 0,
        "word_successes": 0,
    }
    for unit in HEBREW_ALPHABET:
        activity = build_alphabet_activity(unit.key, progress)
        assert activity["exercise_type"] == "sound_choice"
        displayed_ipa = [option["ipa"] for option in activity["options"]]
        assert len(displayed_ipa) == len(set(displayed_ipa)) == 4
        correct = next(
            option
            for option in activity["options"]
            if option["key"] == unit.key
        )
        assert correct["letter"] == unit.sounds[0].form
        assert correct["sound_key"] == unit.sounds[0].key
        assert activity["sound_key"] == unit.sounds[0].key
        assert activity["prompt_key"].endswith(f".{unit.sounds[0].key}")

    assert next(
        option
        for option in build_alphabet_activity("bet", progress)["options"]
        if option["key"] == "bet"
    )["letter"] == "בּ"
    assert next(
        option
        for option in build_alphabet_activity("kaf", progress)["options"]
        if option["key"] == "kaf"
    )["letter"] == "כּ"
    assert next(
        option
        for option in build_alphabet_activity("pe", progress)["options"]
        if option["key"] == "pe"
    )["letter"] == "פּ"
    assert next(
        option
        for option in build_alphabet_activity("shin", progress)["options"]
        if option["key"] == "shin"
    )["letter"] == "שׁ"
    bounded_prompt = build_alphabet_activity("bet", progress)["prompt"]
    assert "of these forms" in bounded_prompt["en"]
    assert "in this activity" in bounded_prompt["en"]
    assert "de estas formas" in bounded_prompt["es"]
    assert "en esta actividad" in bounded_prompt["es"]
    assert "מהצורות האלה" in bounded_prompt["he"]
    assert "בפעילות הזאת" in bounded_prompt["he"]


@pytest.mark.parametrize(
    ("letter_key", "first_key", "first_form", "second_key", "second_form"),
    (
        ("bet", "b", "בּ", "v", "ב"),
        ("kaf", "k", "כּ", "kh", "כ"),
        ("pe", "p", "פּ", "f", "פ"),
        ("shin", "sh", "שׁ", "s", "שׂ"),
    ),
)
def test_two_common_sounds_rotate_before_mastery(
    letter_key: str,
    first_key: str,
    first_form: str,
    second_key: str,
    second_form: str,
) -> None:
    first = build_alphabet_activity(
        letter_key,
        {
            "recognition_successes": 2,
            "sound_successes": 0,
            "word_successes": 0,
        },
    )
    second = build_alphabet_activity(
        letter_key,
        {
            "recognition_successes": 2,
            "sound_successes": 1,
            "word_successes": 0,
        },
    )

    assert first["sound_key"] == first_key
    assert first["prompt_key"].endswith(f".{first_key}")
    assert second["sound_key"] == second_key
    assert second["prompt_key"].endswith(f".{second_key}")
    assert next(
        option["letter"]
        for option in first["options"]
        if option["key"] == letter_key
    ) == first_form
    assert next(
        option["letter"]
        for option in second["options"]
        if option["key"] == letter_key
    ) == second_form
    assert len({option["ipa"] for option in first["options"]}) == 4
    assert len({option["ipa"] for option in second["options"]}) == 4


def test_wrong_sound_answer_does_not_advance_required_variant(
    repository: LearningRepository,
) -> None:
    _answer(
        repository,
        "bet",
        idempotency_key="alphabet-bet-recognition-0001",
    )
    _answer(
        repository,
        "bet",
        idempotency_key="alphabet-bet-recognition-0002",
    )
    first_sound = repository.alphabet_catalog("bet")["next_activity"]
    assert first_sound["exercise_type"] == "sound_choice"
    assert first_sound["sound_key"] == "b"
    wrong_key = next(
        option["key"]
        for option in first_sound["options"]
        if option["key"] != "bet"
    )

    wrong = repository.submit_alphabet_attempt(
        "bet",
        {
            "activity_token": first_sound["activity_token"],
            "idempotency_key": "alphabet-bet-sound-wrong-0003",
            "answer_key": wrong_key,
        },
    )

    assert wrong["is_correct"] is False
    assert wrong["letter_progress"]["sound_successes"] == 0
    retry = repository.alphabet_catalog("bet")["next_activity"]
    assert retry["sound_key"] == "b"
    assert retry["prompt_key"].endswith(".b")
    assert retry["activity_token"] != first_sound["activity_token"]

    first_correct = repository.submit_alphabet_attempt(
        "bet",
        {
            "activity_token": retry["activity_token"],
            "idempotency_key": "alphabet-bet-sound-correct-0004",
            "answer_key": "bet",
        },
    )
    assert first_correct["letter_progress"]["sound_successes"] == 1
    second_sound = repository.alphabet_catalog("bet")["next_activity"]
    assert second_sound["sound_key"] == "v"
    assert second_sound["prompt_key"].endswith(".v")

    second_correct = repository.submit_alphabet_attempt(
        "bet",
        {
            "activity_token": second_sound["activity_token"],
            "idempotency_key": "alphabet-bet-sound-correct-0005",
            "answer_key": "bet",
        },
    )
    assert second_correct["letter_progress"]["sound_successes"] == 2
    assert (
        repository.alphabet_catalog("bet")["next_activity"]["exercise_type"]
        == "word_spotting"
    )


def test_word_spotting_keeps_positional_glyphs_for_final_forms() -> None:
    activity = build_alphabet_activity(
        "final_mem",
        {
            "recognition_successes": 2,
            "sound_successes": 2,
            "word_successes": 0,
        },
    )
    assert activity["exercise_type"] == "word_spotting"
    correct = next(
        option
        for option in activity["options"]
        if option["key"] == "final_mem"
    )
    assert correct["letter"] == "ם"
    assert "final form" in activity["prompt"]["en"]


def test_catalog_api_keeps_legacy_22_entry_track_and_adds_real_progress(
    client: TestClient,
) -> None:
    alphabet = client.get("/api/v1/alphabet", params={"letter_key": "alef"})
    curriculum = client.get("/api/v1/curriculum/path")
    dashboard = client.get("/api/v1/dashboard")
    progress = client.get("/api/v1/progress")

    assert alphabet.status_code == 200
    payload = alphabet.json()
    assert payload["contract_version"] == ALPHABET_CONTRACT_VERSION
    assert payload["content_revision"] == "2026-07-27.1"
    assert payload["editorial_status"] == "reviewed"
    assert {source["id"] for source in payload["source_refs"]} == {
        "academy_overview",
        "academy_final_forms",
        "academy_orthography",
        "ut_consonants",
    }
    assert payload["facts"]["base_letters"] == 22
    assert payload["facts"]["final_forms"] == 5
    assert len(payload["units"]) == 27
    assert payload["progress"]["can_save"] is True
    assert payload["progress"]["completion_percent"] == 0
    assert payload["next_activity"]["letter_key"] == "alef"
    assert payload["next_activity"]["can_submit"] is True
    assert payload["next_activity"]["token_kind"] == "sha256_concurrency_token"

    path = curriculum.json()
    assert len(path["reading_track"]["entries"]) == 22
    assert len(path["reading_track"]["units"]) == 27
    assert path["reading_track"]["base_letters"] == 22
    assert path["reading_track"]["final_forms"] == 5
    sounds = next(lesson for lesson in path["lessons"] if lesson["key"] == "a0.sounds")
    assert sounds["concept_target"] == 12
    assert sounds["progress"]["units_practiced"] == 0
    assert sounds["progress"]["units_mastered"] == 0
    assert sounds["progress"]["unit_target"] == 27
    assert path["coverage"]["concept_target"] == 240
    assert sum(
        int(lesson["concept_target"]) for lesson in path["lessons"]
    ) == path["coverage"]["concept_target"]
    assert dashboard.json()["alphabet_summary"]["total_forms"] == 27
    assert progress.json()["alphabet"]["completion_percent"] == 0


def test_curriculum_completes_sounds_only_after_all_forms_are_mastered() -> None:
    engine = LocalLearningEngine()
    practiced_only = engine.curriculum_path(
        {"cefr_band": "A0", "learner_mode": "guided"},
        {},
        available_concepts=0,
        alphabet_summary={
            "practiced_units": 27,
            "mastered_units": 0,
            "total_forms": 27,
            "total_attempts": 27,
            "correct_attempts": 27,
        },
    )
    practiced_lesson = next(
        lesson
        for lesson in practiced_only["lessons"]
        if lesson["key"] == "a0.sounds"
    )
    assert practiced_lesson["progress"]["status"] == "in_progress"
    assert practiced_lesson["progress"]["units_practiced"] == 27
    assert practiced_lesson["progress"]["units_mastered"] == 0

    mastered = engine.curriculum_path(
        {"cefr_band": "A0", "learner_mode": "guided"},
        {},
        available_concepts=0,
        alphabet_summary={
            "practiced_units": 27,
            "mastered_units": 27,
            "total_forms": 27,
            "total_attempts": 54,
            "correct_attempts": 54,
        },
    )
    mastered_lesson = next(
        lesson
        for lesson in mastered["lessons"]
        if lesson["key"] == "a0.sounds"
    )
    assert mastered_lesson["progress"]["status"] == "completed"
    assert mastered_lesson["progress"]["units_mastered"] == 27


def test_attempt_is_graded_server_side_replay_safe_and_spaced(
    client: TestClient,
) -> None:
    catalog = client.get(
        "/api/v1/alphabet",
        params={"letter_key": "alef"},
    ).json()
    activity = catalog["next_activity"]
    body = {
        "activity_token": activity["activity_token"],
        "idempotency_key": "alphabet-alef-correct-0001",
        "answer_key": "alef",
        "confidence": 4,
        "response_ms": 620,
        "hints_used": 0,
    }

    first = client.post("/api/v1/alphabet/alef/attempt", json=body)
    replay = client.post("/api/v1/alphabet/alef/attempt", json=body)

    assert first.status_code == replay.status_code == 200
    result = first.json()
    assert result["is_correct"] is True
    assert result["saved"] is True
    assert result["idempotent_replay"] is False
    assert result["letter_progress"]["stage"] == "practiced"
    assert result["progress"]["practiced_units"] == 1
    assert result["progress"]["completion_percent"] == 4
    assert result["xp_awarded"] == 6
    assert {row["key"] for row in result["achievements_unlocked"]} == {
        "alphabet_first"
    }
    # A correct first encounter is scheduled rather than immediately repeated.
    assert result["next_activity"]["letter_key"] == "bet"
    assert replay.json()["idempotent_replay"] is True
    assert replay.json()["attempt_id"] == result["attempt_id"]
    assert client.get("/api/v1/dashboard").json()["alphabet_summary"][
        "practiced_units"
    ] == 1
    assert client.get("/api/v1/progress").json()["alphabet"][
        "practiced_units"
    ] == 1

    different_answer = next(
        option["key"]
        for option in activity["options"]
        if option["key"] != "alef"
    )
    conflicting_reuse = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={**body, "answer_key": different_answer},
    )
    assert conflicting_reuse.status_code == 409
    assert conflicting_reuse.json()["error"]["code"] == "alphabet_conflict"

    connection = client.app.state.services.database.connect()
    attempts = connection.execute("SELECT COUNT(*) FROM alphabet_attempts").fetchone()[0]
    alphabet_xp = connection.execute(
        "SELECT COUNT(*) FROM xp_ledger WHERE action = 'alphabet_practice'"
    ).fetchone()[0]
    assert attempts == 1
    assert alphabet_xp == 1

    stale = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={**body, "idempotency_key": "alphabet-alef-stale-0002"},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "alphabet_conflict"

    continued = client.get(
        "/api/v1/alphabet",
        params={"letter_key": "alef"},
    ).json()["next_activity"]
    second = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={
            "activity_token": continued["activity_token"],
            "idempotency_key": "alphabet-alef-correct-0003",
            "answer_key": "alef",
        },
    )
    assert second.status_code == 200
    late_replay = client.post("/api/v1/alphabet/alef/attempt", json=body).json()
    assert late_replay["idempotent_replay"] is True
    assert late_replay["attempt_id"] == result["attempt_id"]
    assert late_replay["is_correct"] is True
    assert late_replay["xp_awarded"] == result["xp_awarded"]
    assert late_replay["achievements_unlocked"] == result["achievements_unlocked"]
    assert late_replay["letter_progress"]["review_count"] == 2
    assert late_replay["progress"]["total_attempts"] == 2


def test_wrong_option_cannot_claim_success_or_xp(client: TestClient) -> None:
    catalog = client.get(
        "/api/v1/alphabet",
        params={"letter_key": "alef"},
    ).json()
    activity = catalog["next_activity"]
    wrong_key = next(
        option["key"] for option in activity["options"] if option["key"] != "alef"
    )
    response = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={
            "activity_token": activity["activity_token"],
            "idempotency_key": "alphabet-alef-wrong-0001",
            "answer_key": wrong_key,
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["is_correct"] is False
    assert result["expected_key"] == "alef"
    assert result["xp_awarded"] == 0
    assert result["achievements_unlocked"] == []
    assert result["letter_progress"]["stage"] == "learning"
    assert result["progress"]["practiced_units"] == 0
    assert result["next_activity"]["letter_key"] == "alef"
    sounds_lesson = next(
        lesson
        for lesson in client.get("/api/v1/curriculum/path").json()["lessons"]
        if lesson["key"] == "a0.sounds"
    )
    assert sounds_lesson["progress"]["status"] == "not_started"
    assert sounds_lesson["progress"]["meaningful_attempts"] == 0

    rejected_claim = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={
            "activity_token": activity["activity_token"],
            "idempotency_key": "alphabet-client-claim-0002",
            "answer_key": wrong_key,
            "is_correct": True,
        },
    )
    assert rejected_claim.status_code == 422


def test_correct_alphabet_attempt_advances_global_daily_goal_once(
    client: TestClient,
) -> None:
    local_start = datetime.now(ZoneInfo("Asia/Jerusalem")).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    outside_today = (
        (local_start - timedelta(seconds=1)).astimezone(timezone.utc).isoformat(
            timespec="seconds"
        ),
        (local_start + timedelta(days=1)).astimezone(timezone.utc).isoformat(
            timespec="seconds"
        ),
    )
    with client.app.state.services.database.transaction() as connection:
        for index, created_at in enumerate(outside_today):
            connection.execute(
                """
                INSERT INTO alphabet_attempts(
                    letter_key, exercise_type, prompt_key, answer_key,
                    is_correct, confidence, response_ms, hints_used,
                    idempotency_key, request_hash, activity_token,
                    response_json, created_at
                ) VALUES(
                    'alef', 'review', 'boundary-probe', 'alef',
                    1, 3, 0, 0, ?, ?, ?, '{}', ?
                )
                """,
                (
                    f"alphabet-boundary-probe-{index}",
                    f"{index:064x}",
                    f"{index + 1:064x}",
                    created_at,
                ),
            )

    initial_goal = client.get("/api/v1/dashboard").json()["today"]["daily_goal"]
    assert initial_goal == {
        "target": 5,
        "completed": 0,
        "achieved": False,
        "evidence": "meaningful_practice_and_alphabet_events",
    }

    first_activity = client.get(
        "/api/v1/alphabet",
        params={"letter_key": "alef"},
    ).json()["next_activity"]
    wrong_key = next(
        option["key"]
        for option in first_activity["options"]
        if option["key"] != "alef"
    )
    wrong_body = {
        "activity_token": first_activity["activity_token"],
        "idempotency_key": "alphabet-daily-wrong-0001",
        "answer_key": wrong_key,
    }
    assert client.post(
        "/api/v1/alphabet/alef/attempt",
        json=wrong_body,
    ).status_code == 200
    assert client.post(
        "/api/v1/alphabet/alef/attempt",
        json=wrong_body,
    ).json()["idempotent_replay"] is True
    assert client.get("/api/v1/dashboard").json()["today"]["daily_goal"][
        "completed"
    ] == 0

    retry_activity = client.get(
        "/api/v1/alphabet",
        params={"letter_key": "alef"},
    ).json()["next_activity"]
    correct_body = {
        "activity_token": retry_activity["activity_token"],
        "idempotency_key": "alphabet-daily-correct-0002",
        "answer_key": "alef",
    }
    assert client.post(
        "/api/v1/alphabet/alef/attempt",
        json=correct_body,
    ).json()["is_correct"] is True
    assert client.get("/api/v1/dashboard").json()["today"]["daily_goal"][
        "completed"
    ] == 1
    assert client.post(
        "/api/v1/alphabet/alef/attempt",
        json=correct_body,
    ).json()["idempotent_replay"] is True
    assert client.get("/api/v1/dashboard").json()["today"]["daily_goal"][
        "completed"
    ] == 1
    connection = client.app.state.services.database.connect()
    assert connection.execute(
        "SELECT COUNT(*) FROM alphabet_attempts"
    ).fetchone()[0] == 4


def test_due_mastered_letter_is_recommended_and_wrong_review_requeues_it(
    client: TestClient,
) -> None:
    with client.app.state.services.database.transaction() as connection:
        connection.execute(
            """
            INSERT INTO alphabet_progress(
                letter_key, stage, recognition_successes, sound_successes,
                word_successes, total_failures, review_count,
                first_practiced_at, last_practiced_at, next_review_at,
                revision, updated_at
            ) VALUES(
                'alef', 'mastered', 2, 2, 1, 0, 5,
                '2000-01-01T00:00:00+00:00',
                '2000-01-02T00:00:00+00:00',
                '2000-01-03T00:00:00+00:00',
                5, '2000-01-02T00:00:00+00:00'
            )
            """
        )

    due = client.get("/api/v1/alphabet").json()
    assert due["recommended_key"] == "alef"
    assert due["next_activity"]["exercise_type"] == "review"
    wrong_key = next(
        option["key"]
        for option in due["next_activity"]["options"]
        if option["key"] != "alef"
    )
    wrong = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={
            "activity_token": due["next_activity"]["activity_token"],
            "idempotency_key": "alphabet-mastered-wrong-0001",
            "answer_key": wrong_key,
        },
    )
    assert wrong.status_code == 200
    demoted = wrong.json()
    assert demoted["is_correct"] is False
    assert demoted["letter_progress"]["stage"] == "practiced"
    assert demoted["letter_progress"]["recognition_successes"] == 2
    assert demoted["letter_progress"]["sound_successes"] == 2
    assert demoted["letter_progress"]["word_successes"] == 1
    assert demoted["letter_progress"]["total_failures"] == 1
    assert demoted["next_activity"]["letter_key"] == "alef"

    restored = client.post(
        "/api/v1/alphabet/alef/attempt",
        json={
            "activity_token": demoted["next_activity"]["activity_token"],
            "idempotency_key": "alphabet-mastered-retry-0002",
            "answer_key": "alef",
        },
    )
    assert restored.status_code == 200
    restored_progress = restored.json()["letter_progress"]
    assert restored_progress["stage"] == "mastered"
    assert restored_progress["recognition_successes"] == 3
    assert restored_progress["sound_successes"] == 2
    assert restored_progress["word_successes"] == 1
    assert restored_progress["total_failures"] == 1


def test_portable_export_and_cloud_snapshots_include_isolated_alphabet_state(
    repository: LearningRepository,
    tmp_path: Path,
) -> None:
    _answer(
        repository,
        "alef",
        idempotency_key="alphabet-local-export-0001",
    )
    export_path = repository.export_json(tmp_path / "alphabet-export.json")
    exported = json.loads(export_path.read_text(encoding="utf-8"))
    assert len(exported["tables"]["alphabet_progress"]) == 1
    assert len(exported["tables"]["alphabet_attempts"]) == 1
    with repository.database.transaction() as connection:
        connection.execute("DELETE FROM alphabet_attempts")
        connection.execute("DELETE FROM alphabet_progress")
    assert repository.alphabet_catalog()["progress"]["practiced_units"] == 0
    repository.import_json(export_path)
    assert repository.alphabet_catalog()["progress"]["practiced_units"] == 1

    store = MemoryCloudStore()
    first = store.create_test_user("First alphabet learner")
    second = store.create_test_user("Second alphabet learner")
    first_repository = CloudLearningRepository(store, first.id, first.display_name)
    CloudLearningRepository(store, second.id, second.display_name)
    _answer(
        first_repository,
        "bet",
        idempotency_key="alphabet-cloud-first-0001",
    )

    first_state = store.read_state(first.id)["tables"]
    second_state = store.read_state(second.id)["tables"]
    assert len(first_state["alphabet_progress"]) == 1
    assert len(first_state["alphabet_attempts"]) == 1
    assert second_state["alphabet_progress"] == []
    assert second_state["alphabet_attempts"] == []
    resumed = CloudLearningRepository(store, first.id, first.display_name)
    assert resumed.alphabet_catalog()["progress"]["practiced_units"] == 1


def test_demo_catalog_is_truthful_and_never_mutates_state() -> None:
    store = MemoryCloudStore()
    demo = store.ensure_demo_user()
    repository = CloudLearningRepository(
        store,
        demo.id,
        demo.display_name,
        seed_demo=True,
    )
    before = store.read_state(demo.id)

    catalog = repository.alphabet_catalog()

    assert catalog["progress"]["can_save"] is False
    assert catalog["progress"]["persistence"] == "read_only_preview"
    assert catalog["next_activity"]["can_submit"] is False
    assert store.read_state(demo.id) == before
    with pytest.raises(ValueError, match="read-only"):
        repository.submit_alphabet_attempt(
            "alef",
            {
                "activity_token": catalog["next_activity"]["activity_token"],
                "idempotency_key": "alphabet-demo-blocked-0001",
                "answer_key": "alef",
            },
        )
    assert store.read_state(demo.id) == before


def test_repeated_cloud_practice_keeps_snapshot_well_below_default_cap() -> None:
    store = MemoryCloudStore()
    user = store.create_test_user("Long-running alphabet learner")
    repository = CloudLearningRepository(store, user.id, user.display_name)

    for index in range(300):
        letter_key = HEBREW_ALPHABET[index % len(HEBREW_ALPHABET)].key
        _answer(
            repository,
            letter_key,
            idempotency_key=f"alphabet-longitudinal-{index:04d}",
        )

    state = store.read_state(user.id)
    snapshot_bytes = len(
        json.dumps(
            state,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    )
    assert snapshot_bytes < 1_000_000
    attempt_rows = state["tables"]["alphabet_attempts"]
    assert len(attempt_rows) == 300
    for row in attempt_rows:
        replay_facts = json.loads(row["response_json"])
        assert "progress" not in replay_facts
        assert "letter_progress" not in replay_facts
        assert "next_activity" not in replay_facts
