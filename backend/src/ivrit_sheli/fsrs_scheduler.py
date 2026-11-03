"""
Module: FSRS review scheduler
Purpose: Schedule reviews with FSRS behind the same inputs and outputs as the SM-2 policy.
Notes: Opt-in through REVIEW_SCHEDULER=fsrs. SM-2 stays the default and stays usable,
    because this policy keeps the SM-2 columns current while it adds its own memory state.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fsrs import Card, Rating, Scheduler, State

from ivrit_sheli.scheduler import (
    ReviewDecision,
    ReviewPolicy,
    ReviewState,
    answer_quality,
    schedule_review,
)

# The quick retry after a miss stays at ten minutes, exactly like the SM-2 policy, so a
# learner who switches policies never sees a failed card vanish for hours.
RETRY_STEP = timedelta(minutes=10)
# Same ceiling as SM-2 so neither policy can push a word further than a year away.
MAXIMUM_INTERVAL_DAYS = 365
DESIRED_RETENTION = 0.9

# Fuzzing is off on purpose: the rest of the learning engine is deterministic and tested
# that way. Turning it on later only spreads due dates; it never changes memory state.
_SCHEDULER = Scheduler(
    desired_retention=DESIRED_RETENTION,
    learning_steps=(RETRY_STEP,),
    relearning_steps=(RETRY_STEP,),
    maximum_interval=MAXIMUM_INTERVAL_DAYS,
    enable_fuzzing=False,
)


@dataclass(frozen=True, slots=True)
class FsrsMemory:
    """FSRS memory state stored next to the SM-2 columns of one item.

    Args:
        stability: Days until recall probability falls to 90%.
        difficulty: Item difficulty from 1 (easy) to 10 (hard).
        state: FSRS card state (1 learning, 2 review, 3 relearning).
        step: Current short-step index while learning or relearning, else None.

    Example:
        >>> FsrsMemory(2.3, 5.0, 2, None).state
        2
    """

    stability: float
    difficulty: float
    state: int
    step: int | None


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    """One scheduling decision plus the policy that made it.

    Args:
        decision: Updated SM-2-compatible state, quality, success flag, and reason.
        policy: Policy that produced the decision.
        memory: FSRS memory after the review, or None for SM-2.

    Example:
        >>> result = schedule_with_policy("sm2", ReviewState.new(), True, 4)
        >>> result.memory is None
        True
    """

    decision: ReviewDecision
    policy: ReviewPolicy
    memory: FsrsMemory | None


def rating_from_quality(quality: int) -> Rating:
    """Map the shared 0–5 answer quality onto the four FSRS ratings.

    Args:
        quality: Value from `answer_quality`.

    Returns:
        Again below 3, then Hard, Good, and Easy for 3, 4, and 5.

    Example:
        >>> rating_from_quality(4).name
        'Good'
    """
    if quality < 3:
        return Rating.Again
    if quality == 3:
        return Rating.Hard
    if quality == 4:
        return Rating.Good
    return Rating.Easy


def difficulty_from_ease(ease_factor: float) -> float:
    """Translate an SM-2 ease factor into an FSRS difficulty.

    SM-2 ease runs from 1.3 (hard) to 3.0 (easy) in this app; FSRS difficulty runs from
    10 (hard) to 1 (easy). The default ease of 2.5 lands on the FSRS midpoint of 5.

    Args:
        ease_factor: Stored SM-2 ease.

    Returns:
        Difficulty clamped to the FSRS range.

    Example:
        >>> difficulty_from_ease(2.5)
        5.0
    """
    return round(max(1.0, min(10.0, 5.0 + (2.5 - ease_factor) * (10.0 / 3.0))), 4)


def _as_utc(value: datetime) -> datetime:
    """Return the same instant with the exact `timezone.utc` object FSRS requires."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def seed_card(
    previous: ReviewState,
    memory: FsrsMemory | None,
    last_reviewed_at: datetime | None,
) -> Card:
    """Build the FSRS card for an item, converting SM-2 state when needed.

    Items FSRS already scheduled keep their exact memory. Items SM-2 scheduled are
    converted without touching history: the current interval stands in for stability,
    the ease factor becomes difficulty, and the existing due date is kept.

    Args:
        previous: SM-2-compatible state from `review_state`.
        memory: Stored FSRS memory, only when FSRS made the last decision.
        last_reviewed_at: Time of the last review, if recorded.

    Returns:
        Card ready for `Scheduler.review_card`.

    Example:
        >>> seed_card(ReviewState.new(), None, None).state.name
        'Learning'
    """
    due = _as_utc(previous.due_at)
    last_review = _as_utc(last_reviewed_at) if last_reviewed_at else None
    if memory is not None:
        return Card(
            card_id=1,
            state=State(memory.state),
            step=memory.step,
            stability=memory.stability,
            difficulty=memory.difficulty,
            due=due,
            last_review=last_review,
        )
    if previous.repetitions == 0 and previous.lapses == 0:
        # Never answered: FSRS starts from its own first-review parameters.
        return Card(card_id=1, state=State.Learning, step=0, due=due)
    if last_review is None:
        last_review = due - timedelta(days=previous.interval_days)
    return Card(
        card_id=1,
        state=State.Review,
        step=None,
        stability=max(previous.interval_days, 0.5),
        difficulty=difficulty_from_ease(previous.ease_factor),
        due=due,
        last_review=last_review,
    )


def schedule_review_fsrs(
    previous: ReviewState,
    memory: FsrsMemory | None,
    is_correct: bool,
    confidence: int,
    hints_used: int = 0,
    now: datetime | None = None,
    last_reviewed_at: datetime | None = None,
) -> PolicyDecision:
    """Schedule the next review with FSRS and keep the SM-2 columns meaningful.

    The returned `ReviewState` carries the real FSRS interval and due date, counts
    repetitions and lapses the same way SM-2 does, and leaves the ease factor as it was,
    so switching back to SM-2 continues from sensible values.

    Args:
        previous: Current SM-2-compatible state.
        memory: Stored FSRS memory when FSRS made the last decision, else None.
        is_correct: Whether the answer was correct.
        confidence: Learner confidence from 1 to 5.
        hints_used: Number of hints used.
        now: Optional review timestamp.
        last_reviewed_at: Time of the previous review, if recorded.

    Returns:
        Decision, policy name, and the FSRS memory to store.

    Raises:
        ValueError: If confidence or hints are outside accepted ranges.

    Example:
        >>> start = datetime(2026, 11, 3, tzinfo=timezone.utc)
        >>> schedule_review_fsrs(ReviewState.new(start), None, True, 4, now=start).decision.state.repetitions
        1
    """
    current = _as_utc(now or datetime.now(timezone.utc))
    quality = answer_quality(is_correct, confidence, hints_used)
    rating = rating_from_quality(quality)
    card = seed_card(previous, memory, last_reviewed_at)
    reviewed, _log = _SCHEDULER.review_card(card, rating, review_datetime=current)

    successful = rating != Rating.Again
    if successful:
        repetitions = previous.repetitions + 1
        lapses = previous.lapses
        reason = "Successful recall: FSRS raised memory stability and spaced the next review."
    else:
        repetitions = 0
        lapses = previous.lapses + 1
        reason = "Incorrect recall: retry soon while FSRS re-estimates memory stability."

    interval = round((reviewed.due - current).total_seconds() / 86400, 4)
    state = ReviewState(
        interval_days=interval,
        ease_factor=previous.ease_factor,
        repetitions=repetitions,
        lapses=lapses,
        due_at=reviewed.due,
    )
    if reviewed.stability is None or reviewed.difficulty is None:
        raise RuntimeError("FSRS returned a reviewed card without memory state")
    new_memory = FsrsMemory(
        stability=round(reviewed.stability, 6),
        difficulty=round(reviewed.difficulty, 6),
        state=int(reviewed.state),
        step=reviewed.step,
    )
    return PolicyDecision(ReviewDecision(state, quality, successful, reason), "fsrs", new_memory)


def schedule_with_policy(
    policy: ReviewPolicy,
    previous: ReviewState,
    is_correct: bool,
    confidence: int,
    hints_used: int = 0,
    now: datetime | None = None,
    *,
    memory: FsrsMemory | None = None,
    last_reviewed_at: datetime | None = None,
) -> PolicyDecision:
    """Dispatch one review to the configured policy.

    Args:
        policy: `sm2` or `fsrs`.
        previous: Current SM-2-compatible state.
        is_correct: Whether the answer was correct.
        confidence: Learner confidence from 1 to 5.
        hints_used: Number of hints used.
        now: Optional review timestamp.
        memory: Stored FSRS memory when FSRS made the last decision.
        last_reviewed_at: Time of the previous review, if recorded.

    Returns:
        The decision, the policy that made it, and FSRS memory when applicable.

    Example:
        >>> schedule_with_policy("fsrs", ReviewState.new(), True, 4).policy
        'fsrs'
    """
    if policy == "fsrs":
        return schedule_review_fsrs(
            previous,
            memory,
            is_correct,
            confidence,
            hints_used,
            now=now,
            last_reviewed_at=last_reviewed_at,
        )
    decision = schedule_review(previous, is_correct, confidence, hints_used, now=now)
    return PolicyDecision(decision, "sm2", None)
