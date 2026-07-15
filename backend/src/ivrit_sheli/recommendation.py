"""
Module: recommendation engine
Purpose: Rank learning candidates with explainable, personalized educational signals.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class RecommendationCandidate:
    """Normalized signals for one possible learning activity.

    Args:
        item_id: Stable item identifier.
        label: Display label.
        urgency: Review urgency from 0 to 1.
        weakness: Demonstrated weakness from 0 to 1.
        relevance: Real-life relevance from 0 to 1.
        goal_alignment: Goal alignment from 0 to 1.
        freshness: Freshness from 0 to 1.
        exploration_bonus: Controlled novelty bonus from 0 to 0.2.
        repetition_penalty: Recent repetition penalty from 0 to 0.3.
        modality_penalty: Modality imbalance penalty from 0 to 0.2.
        recommended_exercise: Suggested activity type.
        estimated_minutes: Estimated effort.

    Example:
        >>> RecommendationCandidate(1, "שלום", 1, 1, 1, 1, 1).item_id
        1
    """

    item_id: int
    label: str
    urgency: float
    weakness: float
    relevance: float
    goal_alignment: float
    freshness: float
    exploration_bonus: float = 0.0
    repetition_penalty: float = 0.0
    modality_penalty: float = 0.0
    recommended_exercise: str = "mixed_review"
    estimated_minutes: int = 2


@dataclass(frozen=True, slots=True)
class Recommendation:
    """Scored recommendation with an explanation.

    Args:
        item_id: Stable item identifier.
        label: Display label.
        total: Final normalized score.
        components: Weighted component contributions.
        reason: Human-readable explanation.
        recommended_exercise: Suggested activity.
        estimated_minutes: Estimated effort.
        confidence: Confidence in recommendation quality.

    Example:
        >>> score_candidate(RecommendationCandidate(1, "שלום", 1, 1, 1, 1, 1)).total
        1.0
    """

    item_id: int
    label: str
    total: float
    components: dict[str, float] = field(default_factory=dict)
    reason: str = ""
    recommended_exercise: str = "mixed_review"
    estimated_minutes: int = 2
    confidence: float = 0.5


def _bounded(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    """Clamp a numeric signal to a safe range.

    Args:
        value: Input number.
        minimum: Lower bound.
        maximum: Upper bound.

    Returns:
        Clamped value.

    Example:
        >>> _bounded(2)
        1.0
    """
    return max(minimum, min(maximum, float(value)))


def score_candidate(candidate: RecommendationCandidate) -> Recommendation:
    """Score one candidate using the documented weighted model.

    Args:
        candidate: Candidate signals.

    Returns:
        Explainable recommendation.

    Example:
        >>> score_candidate(RecommendationCandidate(1, "שלום", .5, .5, .5, .5, .5)).total
        0.5
    """
    raw_components = {
        "urgency": _bounded(candidate.urgency) * 0.35,
        "weakness": _bounded(candidate.weakness) * 0.25,
        "relevance": _bounded(candidate.relevance) * 0.20,
        "goal_alignment": _bounded(candidate.goal_alignment) * 0.10,
        "freshness": _bounded(candidate.freshness) * 0.10,
        "exploration_bonus": _bounded(candidate.exploration_bonus, 0, 0.2),
        "repetition_penalty": -_bounded(candidate.repetition_penalty, 0, 0.3),
        "modality_penalty": -_bounded(candidate.modality_penalty, 0, 0.2),
    }
    total = _bounded(sum(raw_components.values()))

    positive = sorted(
        (
            (name, value)
            for name, value in raw_components.items()
            if value > 0 and name != "exploration_bonus"
        ),
        key=lambda pair: pair[1],
        reverse=True,
    )
    phrases = {
        "urgency": "due now",
        "weakness": "repeatedly difficult",
        "relevance": "useful in real life",
        "goal_alignment": "aligned with your current goal",
        "freshness": "recently encountered",
    }
    top_reasons = [phrases[name] for name, _ in positive[:2]]
    if candidate.exploration_bonus > 0.08:
        top_reasons.append("adds controlled variety")
    reason = ", ".join(top_reasons).capitalize() + "." if top_reasons else "Balanced practice candidate."

    signal_count = sum(
        1
        for value in (
            candidate.urgency,
            candidate.weakness,
            candidate.relevance,
            candidate.goal_alignment,
            candidate.freshness,
        )
        if value > 0
    )
    confidence = round(min(0.98, 0.40 + signal_count * 0.10 + total * 0.18), 3)
    return Recommendation(
        item_id=candidate.item_id,
        label=candidate.label,
        total=round(total, 4),
        components={name: round(value, 4) for name, value in raw_components.items()},
        reason=reason,
        recommended_exercise=candidate.recommended_exercise,
        estimated_minutes=max(1, candidate.estimated_minutes),
        confidence=confidence,
    )


def rank_candidates(
    candidates: list[RecommendationCandidate], limit: int = 10
) -> list[Recommendation]:
    """Rank candidates from highest to lowest score.

    Args:
        candidates: Candidate list.
        limit: Maximum results.

    Returns:
        Ranked recommendations.

    Raises:
        ValueError: If limit is not positive.

    Example:
        >>> rank_candidates([RecommendationCandidate(1, "a", 1, 1, 1, 1, 1)], 1)[0].item_id
        1
    """
    if limit <= 0:
        raise ValueError("limit must be positive")
    scored = [score_candidate(candidate) for candidate in candidates]
    return sorted(scored, key=lambda item: (-item.total, item.item_id))[:limit]
