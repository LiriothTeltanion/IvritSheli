"""
Module: review scheduler
Purpose: Provide a deterministic spaced-repetition policy with confidence-aware quality scoring.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass(frozen=True, slots=True)
class ReviewState:
    """Current scheduling state for one learning item.

    Args:
        interval_days: Current interval.
        ease_factor: SM-2 style easiness factor.
        repetitions: Consecutive successful repetitions.
        lapses: Failed-review count.
        due_at: Next due time.

    Example:
        >>> ReviewState.new().repetitions
        0
    """

    interval_days: float
    ease_factor: float
    repetitions: int
    lapses: int
    due_at: datetime

    @classmethod
    def new(cls, now: datetime | None = None) -> ReviewState:
        """Create a review state due immediately.

        Args:
            now: Optional aware timestamp.

        Returns:
            Initial state.

        Example:
            >>> ReviewState.new().interval_days
            0.0
        """
        current = now or datetime.now(timezone.utc)
        return cls(0.0, 2.5, 0, 0, current)


@dataclass(frozen=True, slots=True)
class ReviewDecision:
    """Result of applying one answer to a review state.

    Args:
        state: Updated state.
        quality: Derived quality from 0 to 5.
        was_successful: Whether the answer counts as a successful repetition.
        reason: Human-readable scheduling explanation.

    Example:
        >>> schedule_review(ReviewState.new(), True, 4).was_successful
        True
    """

    state: ReviewState
    quality: int
    was_successful: bool
    reason: str


def answer_quality(is_correct: bool, confidence: int, hints_used: int = 0) -> int:
    """Convert correctness, confidence, and hints into a 0–5 quality value.

    Args:
        is_correct: Whether the final answer was correct.
        confidence: Learner rating from 1 to 5.
        hints_used: Count of revealed hints.

    Returns:
        Integer quality from 0 to 5.

    Raises:
        ValueError: If confidence or hints are outside accepted ranges.

    Example:
        >>> answer_quality(True, 5, 0)
        5
    """
    if not 1 <= confidence <= 5:
        raise ValueError("confidence must be between 1 and 5")
    if hints_used < 0:
        raise ValueError("hints_used cannot be negative")
    if not is_correct:
        return min(2, max(0, confidence - 2))

    quality = confidence
    if hints_used:
        quality -= min(2, hints_used)
    return max(3, min(5, quality))


def schedule_review(
    previous: ReviewState,
    is_correct: bool,
    confidence: int,
    hints_used: int = 0,
    now: datetime | None = None,
) -> ReviewDecision:
    """Schedule the next review with a bounded SM-2 policy.

    Args:
        previous: Current review state.
        is_correct: Whether the answer was correct.
        confidence: Learner confidence from 1 to 5.
        hints_used: Number of hints used.
        now: Optional scheduling timestamp.

    Returns:
        Updated state and explanation.

    Raises:
        ValueError: If inputs are invalid.

    Example:
        >>> decision = schedule_review(ReviewState.new(), True, 4)
        >>> decision.state.interval_days
        1.0
    """
    current = now or datetime.now(timezone.utc)
    quality = answer_quality(is_correct, confidence, hints_used)

    # SM-2 adjustment rewards difficult successful recall while staying bounded.
    ease = previous.ease_factor + (
        0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )
    ease = max(1.3, min(3.0, ease))

    if quality < 3:
        interval = 10 / (24 * 60)  # Ten minutes expressed in days.
        repetitions = 0
        lapses = previous.lapses + 1
        reason = "Incorrect recall: retry soon and reduce difficulty."
        successful = False
    else:
        repetitions = previous.repetitions + 1
        lapses = previous.lapses
        if repetitions == 1:
            interval = 1.0
        elif repetitions == 2:
            interval = 6.0
        else:
            interval = max(1.0, previous.interval_days * ease)
        if hints_used:
            interval *= 0.75
        reason = "Successful recall: interval expanded using confidence and hint use."
        successful = True

    interval = round(min(interval, 365.0), 4)
    state = ReviewState(
        interval_days=interval,
        ease_factor=round(ease, 4),
        repetitions=repetitions,
        lapses=lapses,
        due_at=current + timedelta(days=interval),
    )
    return ReviewDecision(state, quality, successful, reason)


def review_urgency(due_at: datetime, now: datetime | None = None) -> float:
    """Convert a due timestamp into a normalized urgency score.

    Args:
        due_at: Scheduled due time.
        now: Optional comparison time.

    Returns:
        Score from 0 to 1.

    Example:
        >>> review_urgency(datetime.now(timezone.utc) - timedelta(days=2))
        1.0
    """
    current = now or datetime.now(timezone.utc)
    seconds = (current - due_at).total_seconds()
    if seconds >= 0:
        return min(1.0, 0.55 + seconds / (7 * 86400) * 0.45)
    days_until = abs(seconds) / 86400
    return max(0.0, 0.55 - days_until / 14)
