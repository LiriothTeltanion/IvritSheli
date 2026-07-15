"""
Module: personalization engine
Purpose: Update an inspectable learner model from educational events without opaque profiling.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class MasteryState:
    """Separate skill dimensions for one concept.

    Args:
        recognition: Recognition mastery from 0 to 1.
        production: Production mastery from 0 to 1.
        listening: Listening mastery from 0 to 1.
        speaking: Speaking mastery from 0 to 1.
        observations: Number of incorporated events.

    Example:
        >>> MasteryState().recognition
        0.0
    """

    recognition: float = 0.0
    production: float = 0.0
    listening: float = 0.0
    speaking: float = 0.0
    observations: int = 0


def _clamp(value: float) -> float:
    """Clamp mastery-like values to 0–1.

    Args:
        value: Input number.

    Returns:
        Clamped number.

    Example:
        >>> _clamp(1.4)
        1.0
    """
    return max(0.0, min(1.0, value))


def update_mastery(
    previous: MasteryState,
    modality: str,
    is_correct: bool,
    confidence: int,
    response_ms: int,
    hints_used: int = 0,
    alpha: float = 0.22,
) -> MasteryState:
    """Update one modality using an exponential moving average.

    Args:
        previous: Existing state.
        modality: recognition, production, listening, or speaking.
        is_correct: Answer correctness.
        confidence: Self-rating from 1 to 5.
        response_ms: Response latency in milliseconds.
        hints_used: Number of hints.
        alpha: EMA learning rate.

    Returns:
        Updated mastery state.

    Raises:
        ValueError: If a field is outside its accepted range.

    Example:
        >>> update_mastery(MasteryState(), "recognition", True, 4, 1500).recognition > 0
        True
    """
    valid = {"recognition", "production", "listening", "speaking"}
    if modality not in valid:
        raise ValueError(f"Unsupported modality: {modality}")
    if not 1 <= confidence <= 5:
        raise ValueError("confidence must be between 1 and 5")
    if response_ms < 0 or hints_used < 0:
        raise ValueError("response_ms and hints_used cannot be negative")
    if not 0 < alpha <= 1:
        raise ValueError("alpha must be in (0, 1]")

    correctness = 1.0 if is_correct else 0.0
    confidence_factor = confidence / 5
    speed_factor = max(0.25, min(1.0, 5000 / max(response_ms, 500)))
    hint_factor = max(0.4, 1.0 - hints_used * 0.18)
    observation = correctness * (0.55 + 0.25 * confidence_factor + 0.20 * speed_factor) * hint_factor

    values = {
        "recognition": previous.recognition,
        "production": previous.production,
        "listening": previous.listening,
        "speaking": previous.speaking,
    }
    old_value = values[modality]
    values[modality] = _clamp(old_value * (1 - alpha) + observation * alpha)
    return MasteryState(
        recognition=round(values["recognition"], 4),
        production=round(values["production"], 4),
        listening=round(values["listening"], 4),
        speaking=round(values["speaking"], 4),
        observations=previous.observations + 1,
    )


def confidence_calibration(is_correct: bool, confidence: int) -> float:
    """Measure calibration error between confidence and correctness.

    Args:
        is_correct: Answer correctness.
        confidence: Self-rating from 1 to 5.

    Returns:
        Absolute calibration error from 0 to 1.

    Raises:
        ValueError: If confidence is outside 1–5.

    Example:
        >>> confidence_calibration(True, 5)
        0.0
    """
    if not 1 <= confidence <= 5:
        raise ValueError("confidence must be between 1 and 5")
    predicted = (confidence - 1) / 4
    actual = 1.0 if is_correct else 0.0
    return round(abs(predicted - actual), 4)


def choose_focus(error_counts: Mapping[str, int], limit: int = 3) -> list[dict[str, int | float | str]]:
    """Return the highest-frequency error categories with shares.

    Args:
        error_counts: Error category to count mapping.
        limit: Maximum categories.

    Returns:
        Sorted focus records.

    Raises:
        ValueError: If limit is not positive or counts are negative.

    Example:
        >>> choose_focus({"preposition": 3, "gender": 1}, 1)[0]["category"]
        'preposition'
    """
    if limit <= 0:
        raise ValueError("limit must be positive")
    if any(value < 0 for value in error_counts.values()):
        raise ValueError("error counts cannot be negative")
    total = sum(error_counts.values())
    if total == 0:
        return []
    ranked = sorted(error_counts.items(), key=lambda pair: (-pair[1], pair[0]))[:limit]
    return [
        {
            "category": category,
            "count": count,
            "share": round(count / total, 4),
        }
        for category, count in ranked
    ]


def focus_summary(error_counts: Mapping[str, int]) -> dict[str, str]:
    """Build one dashboard-ready focus recommendation.

    Args:
        error_counts: Error category to count mapping.

    Returns:
        Focus key, learner-facing reason, and suggested exercise.

    Raises:
        ValueError: If an error count is negative.

    Example:
        >>> focus_summary({"preposition": 3})["focus"]
        'preposition'
    """
    ranked = choose_focus(error_counts, limit=1)
    if not ranked:
        return {
            "focus": "active_recall",
            "reason": "No recurring mistake pattern yet; balanced practice will build a reliable baseline.",
            "suggested_exercise": "mixed_review",
        }

    primary = ranked[0]
    category = str(primary["category"])
    share = round(float(primary["share"]) * 100)
    exercise_by_category = {
        "preposition": "preposition_drill",
        "gender_agreement": "agreement_production",
        "verb_tense": "conjugation_drill",
        "word_order": "sentence_builder",
        "pronunciation": "speaking_shadowing",
        "vocabulary_recall": "active_recall",
    }
    readable = category.replace("_", " ")
    return {
        "focus": category,
        "reason": f"{readable.capitalize()} represents {share}% of your recorded mistakes.",
        "suggested_exercise": exercise_by_category.get(category, "targeted_review"),
    }
