"""
Module: gamification engine
Purpose: Reward meaningful language behavior through auditable XP, levels, and achievements.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum


class XPAction(str, Enum):
    """Supported XP-producing actions.

    Example:
        >>> XPAction.CORRECT_REVIEW.value
        'correct_review'
    """

    CORRECT_REVIEW = "correct_review"
    DIFFICULT_MASTERY = "difficult_mastery"
    SPEAKING_ATTEMPT = "speaking_attempt"
    REAL_LIFE_MISSION = "real_life_mission"
    REFLECTION = "reflection"
    REAL_LIFE_SUCCESS = "real_life_success"
    WEEKLY_PLAN = "weekly_plan"
    NEW_CAPTURE = "new_capture"
    DICTIONARY_EXPLORE = "dictionary_explore"


BASE_XP: Mapping[XPAction, int] = {
    XPAction.CORRECT_REVIEW: 10,
    XPAction.DIFFICULT_MASTERY: 18,
    XPAction.SPEAKING_ATTEMPT: 20,
    XPAction.REAL_LIFE_MISSION: 50,
    XPAction.REFLECTION: 12,
    XPAction.REAL_LIFE_SUCCESS: 65,
    XPAction.WEEKLY_PLAN: 100,
    XPAction.NEW_CAPTURE: 8,
    XPAction.DICTIONARY_EXPLORE: 3,
}

DAILY_SOFT_CAPS: Mapping[XPAction, int] = {
    XPAction.NEW_CAPTURE: 80,
    XPAction.DICTIONARY_EXPLORE: 30,
    XPAction.CORRECT_REVIEW: 300,
}


@dataclass(frozen=True, slots=True)
class AchievementDefinition:
    """Declarative achievement rule.

    Args:
        key: Stable achievement identifier.
        metric: Metric name used for evaluation.
        threshold: Minimum metric value.
        xp_reward: One-time XP reward.
        title_en: English title.
        title_es: Spanish title.
        title_he: Hebrew title.
        icon: Relative badge path.

    Example:
        >>> ACHIEVEMENTS[0].key
        'first_word'
    """

    key: str
    metric: str
    threshold: float
    xp_reward: int
    title_en: str
    title_es: str
    title_he: str
    icon: str


ACHIEVEMENTS: tuple[AchievementDefinition, ...] = (
    AchievementDefinition(
        "first_word", "captured_items", 1, 25, "First Word", "Primera palabra", "המילה הראשונה", "assets/badges/first-word.svg"
    ),
    AchievementDefinition(
        "week_streak", "streak_days", 7, 80, "Seven-Day Flow", "Racha de siete días", "רצף של שבעה ימים", "assets/badges/streak.svg"
    ),
    AchievementDefinition(
        "speaker_25", "speaking_attempts", 25, 120, "Voice Builder", "Constructor de voz", "בונה קול", "assets/badges/speaker.svg"
    ),
    AchievementDefinition(
        "dictionary_100", "dictionary_lookups", 100, 100, "Word Explorer", "Explorador de palabras", "חוקר מילים", "assets/badges/explorer.svg"
    ),
    AchievementDefinition(
        "real_world_10", "real_life_successes", 10, 180, "Israel in Action", "Israel en acción", "עברית בפעולה", "assets/badges/real-world.svg"
    ),
    AchievementDefinition(
        "trilingual", "locales_used", 3, 90, "Three-Language Mind", "Mente trilingüe", "חשיבה תלת־לשונית", "assets/badges/polyglot.svg"
    ),
)


def xp_for_action(
    action: XPAction,
    earned_today_for_action: int = 0,
    multiplier: float = 1.0,
) -> int:
    """Calculate XP with transparent anti-grind diminishing returns.

    Args:
        action: Completed action.
        earned_today_for_action: XP already earned from that action today.
        multiplier: Positive situational multiplier.

    Returns:
        XP award, never negative.

    Raises:
        ValueError: If multiplier is negative.

    Example:
        >>> xp_for_action(XPAction.CORRECT_REVIEW)
        10
    """
    if multiplier < 0:
        raise ValueError("multiplier cannot be negative")

    base = BASE_XP[action]
    cap = DAILY_SOFT_CAPS.get(action)
    if cap and earned_today_for_action >= cap:
        multiplier *= 0.25
    elif cap and earned_today_for_action >= cap * 0.75:
        multiplier *= 0.5
    return max(0, round(base * multiplier))


def level_from_xp(total_xp: int) -> int:
    """Calculate a one-based level from total XP.

    Args:
        total_xp: Non-negative lifetime XP.

    Returns:
        Current level.

    Raises:
        ValueError: If XP is negative.

    Example:
        >>> level_from_xp(400)
        3
    """
    if total_xp < 0:
        raise ValueError("total_xp cannot be negative")
    return int(math.sqrt(total_xp / 100)) + 1


def xp_threshold_for_level(level: int) -> int:
    """Return total XP required to start a level.

    Args:
        level: One-based level.

    Returns:
        XP threshold.

    Raises:
        ValueError: If level is below one.

    Example:
        >>> xp_threshold_for_level(3)
        400
    """
    if level < 1:
        raise ValueError("level must be at least 1")
    return 100 * (level - 1) ** 2


def level_progress(total_xp: int) -> dict[str, int | float]:
    """Describe XP progress inside the current level.

    Args:
        total_xp: Lifetime XP.

    Returns:
        Level, current threshold, next threshold, XP within level, and percent.

    Example:
        >>> level_progress(50)["percent"]
        50.0
    """
    level = level_from_xp(total_xp)
    current = xp_threshold_for_level(level)
    next_threshold = xp_threshold_for_level(level + 1)
    span = max(next_threshold - current, 1)
    return {
        "level": level,
        "current_threshold": current,
        "next_threshold": next_threshold,
        "xp_in_level": total_xp - current,
        "percent": round((total_xp - current) / span * 100, 2),
    }


def evaluate_achievement_keys(
    metrics: Mapping[str, float | int],
    already_unlocked: set[str] | None = None,
) -> list[AchievementDefinition]:
    """Find newly satisfied achievements.

    Args:
        metrics: Current aggregate metrics.
        already_unlocked: Achievement keys to exclude.

    Returns:
        Newly unlocked definitions.

    Example:
        >>> [a.key for a in evaluate_achievement_keys({"captured_items": 1})]
        ['first_word']
    """
    unlocked = already_unlocked or set()
    return [
        achievement
        for achievement in ACHIEVEMENTS
        if achievement.key not in unlocked
        and float(metrics.get(achievement.metric, 0)) >= achievement.threshold
    ]
