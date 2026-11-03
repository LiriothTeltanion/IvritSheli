"""FSRS policy tests, including a synthetic SM-2 versus FSRS comparison.

Every answer in these tests is synthetic. The comparison feeds 20 fixed answer sequences
to both policies, so the numbers say how each policy spaces reviews, not how a real person
remembers Hebrew.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.fsrs_scheduler import (
    FsrsMemory,
    difficulty_from_ease,
    rating_from_quality,
    schedule_review_fsrs,
    schedule_with_policy,
    seed_card,
)
from ivrit_sheli.repository import LearningRepository
from ivrit_sheli.scheduler import ReviewPolicy, ReviewState, parse_review_policy

START = datetime(2026, 11, 3, 8, 0, tzinfo=timezone.utc)
CARD_COUNT = 20


def test_quality_maps_onto_the_four_fsrs_ratings() -> None:
    assert [rating_from_quality(q).name for q in range(6)] == [
        "Again",
        "Again",
        "Again",
        "Hard",
        "Good",
        "Easy",
    ]


def test_policy_name_is_validated() -> None:
    assert parse_review_policy(None) == "sm2"
    assert parse_review_policy(" FSRS ") == "fsrs"
    with pytest.raises(ValueError, match="REVIEW_SCHEDULER"):
        parse_review_policy("leitner")


def test_settings_default_to_sm2_and_accept_fsrs() -> None:
    assert Settings.from_env({}).review_scheduler == "sm2"
    assert Settings.from_env({"REVIEW_SCHEDULER": "fsrs"}).review_scheduler == "fsrs"


def test_new_card_failure_retries_in_ten_minutes_like_sm2() -> None:
    result = schedule_review_fsrs(ReviewState.new(START), None, False, 2, now=START)
    assert result.decision.was_successful is False
    assert result.decision.state.due_at - START == timedelta(minutes=10)
    assert result.decision.state.lapses == 1
    assert result.memory is not None and result.memory.state == 1


def test_new_card_success_graduates_to_review_with_days_of_spacing() -> None:
    result = schedule_review_fsrs(ReviewState.new(START), None, True, 4, now=START)
    assert result.decision.was_successful is True
    assert result.decision.state.repetitions == 1
    assert result.decision.state.interval_days >= 1
    assert result.memory is not None and result.memory.state == 2


def test_sm2_card_is_seeded_without_losing_its_schedule() -> None:
    sm2_state = ReviewState(12.0, 2.2, 3, 1, START + timedelta(days=2))
    card = seed_card(sm2_state, None, START - timedelta(days=10))
    assert card.state.name == "Review"
    assert card.stability == 12.0
    assert card.difficulty == difficulty_from_ease(2.2)
    assert card.due == START + timedelta(days=2)


def test_ease_maps_to_the_fsrs_difficulty_range() -> None:
    assert difficulty_from_ease(1.3) == 9.0
    assert difficulty_from_ease(2.5) == 5.0
    assert 1.0 <= difficulty_from_ease(3.0) < 5.0


def test_fsrs_keeps_sm2_columns_usable_for_switching_back() -> None:
    first = schedule_review_fsrs(ReviewState.new(START), None, True, 4, now=START)
    later = first.decision.state.due_at
    second = schedule_with_policy("sm2", first.decision.state, True, 4, now=later)
    assert second.decision.state.repetitions == 2
    assert second.decision.state.interval_days == 6.0


# --- Synthetic comparison -------------------------------------------------------------
#
# Both policies see the same 20 synthetic answer sequences and each card is reviewed
# exactly when it falls due. This compares how the policies space reviews for identical
# answers; it makes no claim about real retention, which needs real review logs.

REVIEWS_PER_CARD = 8
CONFIDENCE_BY_GROUP = (3, 4, 5, 4)


def _answers(card_index: int) -> list[tuple[bool, int]]:
    """Return one deterministic answer sequence per synthetic card.

    Cards 0–19 form four groups of five with confidence 3, 4, 5, and 4. In the first
    three groups, cards 0–3 miss once (on answer 2, 3, 4, or 5) and card 4 never misses.
    The last group is the struggling one: cards 0–3 miss twice, two answers apart, and
    card 4 misses its very first answer.
    """
    group, position = divmod(card_index, 5)
    confidence = CONFIDENCE_BY_GROUP[group]
    if group < 3:
        misses = {position + 1} if position < 4 else set()
    else:
        misses = {position + 1, position + 3} if position < 4 else {0}
    return [
        (False, 2) if review in misses else (True, confidence)
        for review in range(REVIEWS_PER_CARD)
    ]


@dataclass(frozen=True, slots=True)
class ComparisonResult:
    average_final_interval_days: float
    average_days_covered: float
    cards_reaching_30_days: int
    average_reviews_to_30_days: float


def _compare(policy: ReviewPolicy) -> ComparisonResult:
    final_intervals: list[float] = []
    days_covered: list[float] = []
    reviews_to_30: list[int] = []
    for card_index in range(CARD_COUNT):
        state = ReviewState.new(START)
        memory: FsrsMemory | None = None
        last_review: datetime | None = None
        now = START
        reached: int | None = None
        for review, (is_correct, confidence) in enumerate(_answers(card_index), start=1):
            result = schedule_with_policy(
                policy,
                state,
                is_correct,
                confidence,
                now=now,
                memory=memory,
                last_reviewed_at=last_review,
            )
            state, memory, last_review = result.decision.state, result.memory, now
            now = state.due_at
            if reached is None and state.interval_days >= 30:
                reached = review
        final_intervals.append(state.interval_days)
        days_covered.append((now - START).total_seconds() / 86400)
        if reached is not None:
            reviews_to_30.append(reached)
    return ComparisonResult(
        average_final_interval_days=round(sum(final_intervals) / CARD_COUNT, 1),
        average_days_covered=round(sum(days_covered) / CARD_COUNT, 1),
        cards_reaching_30_days=len(reviews_to_30),
        average_reviews_to_30_days=round(sum(reviews_to_30) / max(1, len(reviews_to_30)), 2),
    )


def test_synthetic_comparison_sm2_versus_fsrs() -> None:
    sm2 = _compare("sm2")
    fsrs = _compare("fsrs")
    # Printed with `pytest -s`; the PR description quotes these synthetic numbers.
    print(f"\nSYNTHETIC sm2={sm2}\nSYNTHETIC fsrs={fsrs}")

    assert len({tuple(_answers(index)) for index in range(CARD_COUNT)}) == CARD_COUNT
    for result in (sm2, fsrs):
        assert 0 < result.average_final_interval_days <= 365
    # With identical answers, FSRS (aiming at 90% retention) spaces confident cards
    # further apart than the bounded SM-2 policy and reaches a month sooner.
    assert fsrs.average_final_interval_days > sm2.average_final_interval_days
    assert fsrs.cards_reaching_30_days >= sm2.cards_reaching_30_days
    assert fsrs.average_reviews_to_30_days < sm2.average_reviews_to_30_days


# --- Persistence --------------------------------------------------------------------


def _repository(tmp_path: Path, policy: ReviewPolicy) -> LearningRepository:
    database = Database(tmp_path / "learning.db")
    database.initialize()
    repository = LearningRepository(database, policy)
    repository.ensure_default_profile()
    return repository


def test_fsrs_review_persists_memory_and_switching_back_keeps_data(tmp_path: Path) -> None:
    fsrs_repo = _repository(tmp_path, "fsrs")
    item = fsrs_repo.create_item({"hebrew_text": "שלום", "translation_en": "hello"})
    result = fsrs_repo.submit_review(item["id"], {"is_correct": True, "confidence": 4})
    assert result["schedule"]["scheduler"] == "fsrs"
    assert result["schedule"]["fsrs_stability"] > 0

    with fsrs_repo.database.transaction() as connection:
        row = connection.execute(
            "SELECT * FROM review_state WHERE item_id = ?", (item["id"],)
        ).fetchone()
        attempts = connection.execute(
            "SELECT COUNT(*) FROM attempts WHERE item_id = ?", (item["id"],)
        ).fetchone()[0]
    assert row["scheduler"] == "fsrs"
    assert row["fsrs_state"] == 2
    assert row["repetitions"] == 1
    # The answer itself stays in the review log for future FSRS parameter fitting.
    assert attempts == 1

    sm2_repo = LearningRepository(fsrs_repo.database, "sm2")
    again = sm2_repo.submit_review(item["id"], {"is_correct": True, "confidence": 4})
    assert again["schedule"]["scheduler"] == "sm2"
    assert again["schedule"]["repetitions"] == 2
    with sm2_repo.database.transaction() as connection:
        after = connection.execute(
            "SELECT * FROM review_state WHERE item_id = ?", (item["id"],)
        ).fetchone()
    # SM-2 never deletes FSRS memory; it only marks that SM-2 made the last decision.
    assert after["scheduler"] == "sm2"
    assert after["fsrs_stability"] == row["fsrs_stability"]


def test_default_policy_is_sm2_and_unchanged(tmp_path: Path) -> None:
    repository = _repository(tmp_path, "sm2")
    item = repository.create_item({"hebrew_text": "תודה", "translation_en": "thanks"})
    result = repository.submit_review(item["id"], {"is_correct": True, "confidence": 4})
    assert result["schedule"]["scheduler"] == "sm2"
    assert result["schedule"]["interval_days"] == 1.0
    assert "fsrs_stability" not in result["schedule"]
