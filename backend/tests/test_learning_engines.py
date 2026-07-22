"""
Module: adaptive learning engine tests
Purpose: Verify scheduling, mastery, explainable ranking, XP, levels, and achievement rules.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from ivrit_sheli.gamification import (
    XPAction,
    evaluate_achievement_keys,
    level_from_xp,
    level_progress,
    xp_for_action,
)
from ivrit_sheli.personalization import MasteryState, choose_focus, update_mastery
from ivrit_sheli.recommendation import RecommendationCandidate, rank_candidates, score_candidate
from ivrit_sheli.scheduler import ReviewState, answer_quality, review_urgency, schedule_review


def test_review_scheduler_expands_successful_intervals() -> None:
    now = datetime(2026, 7, 15, tzinfo=timezone.utc)
    first = schedule_review(ReviewState.new(now), True, 4, now=now)
    second = schedule_review(first.state, True, 5, now=now)
    assert first.state.interval_days == 1.0
    assert second.state.interval_days == 6.0
    assert second.state.repetitions == 2


def test_review_scheduler_retries_failures_soon() -> None:
    decision = schedule_review(ReviewState.new(), False, 2)
    assert decision.was_successful is False
    assert decision.state.repetitions == 0
    assert decision.state.lapses == 1
    assert decision.state.interval_days < 0.01


def test_review_quality_validates_confidence() -> None:
    assert answer_quality(True, 5) == 5
    with pytest.raises(ValueError, match="confidence"):
        answer_quality(True, 0)


def test_review_urgency_distinguishes_overdue_and_future_items() -> None:
    now = datetime(2026, 7, 15, tzinfo=timezone.utc)
    assert review_urgency(now - timedelta(days=8), now) == 1.0
    assert review_urgency(now + timedelta(days=7), now) < 0.55


def test_mastery_updates_only_selected_modality() -> None:
    updated = update_mastery(MasteryState(), "speaking", True, 4, 1400)
    assert updated.speaking > 0
    assert updated.recognition == 0
    assert updated.observations == 1


def test_mastery_state_preserves_legacy_positional_observation_argument() -> None:
    legacy = MasteryState(0.1, 0.2, 0.3, 0.4, 7)
    assert legacy.observations == 7
    assert legacy.pointed_reading == 0
    assert legacy.unpointed_reading == 0
    assert legacy.contextual_transfer == 0


def test_mastery_rejects_unsupported_modality() -> None:
    with pytest.raises(ValueError, match="Unsupported modality"):
        update_mastery(MasteryState(), "reading", True, 4, 1000)


def test_focus_selects_largest_error_pattern() -> None:
    focus = choose_focus({"preposition": 8, "gender_agreement": 3})
    assert focus[0]["category"] == "preposition"
    assert focus[0]["share"] == pytest.approx(8 / 11, abs=0.0001)


def test_recommendation_score_exposes_components() -> None:
    candidate = RecommendationCandidate(
        1,
        "אני אטפל בזה",
        urgency=1,
        weakness=0.8,
        relevance=0.9,
        goal_alignment=1,
        freshness=0.7,
        recommended_exercise="speaking",
    )
    result = score_candidate(candidate)
    assert result.total > 0.8
    assert result.components["urgency"] == 0.35
    assert "due now" in result.reason.lower()


def test_recommendations_rank_deterministically() -> None:
    rows = [
        RecommendationCandidate(2, "low", 0.1, 0, 0.1, 0, 0),
        RecommendationCandidate(1, "high", 1, 1, 1, 1, 1),
    ]
    assert [item.item_id for item in rank_candidates(rows)] == [1, 2]
    with pytest.raises(ValueError, match="positive"):
        rank_candidates(rows, 0)


def test_xp_levels_and_soft_caps_are_predictable() -> None:
    assert xp_for_action(XPAction.CORRECT_REVIEW) == 10
    assert xp_for_action(XPAction.CORRECT_REVIEW, earned_today_for_action=300) == 2
    assert level_from_xp(400) == 3
    assert level_progress(50)["percent"] == 50.0


def test_achievement_evaluation_excludes_existing_unlocks() -> None:
    unlocked = evaluate_achievement_keys(
        {"captured_items": 1, "streak_days": 7}, already_unlocked={"first_word"}
    )
    assert [achievement.key for achievement in unlocked] == [
        "week_streak",
        "three_day_flow",
    ]
