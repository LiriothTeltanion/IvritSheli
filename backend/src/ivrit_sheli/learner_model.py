"""Bounded and explainable learner-model updates for the local coach."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any, Literal, cast

DifficultyFeedback = Literal["too_easy", "right", "too_hard"]
CONTEXT_KEYS = (
    "daily_life",
    "family",
    "food",
    "health",
    "listening",
    "shopping",
    "social",
    "study",
    "travel",
    "work",
)
MODEL_VERSION = 1
MAX_SINGLE_DIFFICULTY_DELTA = 0.08
MAX_SINGLE_LENGTH_DELTA = 0.04
MAX_SINGLE_WEIGHT_DELTA = 0.06


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _clean_weights(
    value: object,
    *,
    allowed_keys: tuple[str, ...] | None,
) -> dict[str, float]:
    if not isinstance(value, Mapping):
        return {}
    cleaned: dict[str, float] = {}
    for index, (key, raw_weight) in enumerate(value.items()):
        if index >= 128:
            break
        name = str(key).strip()
        if not name or len(name) > 100 or (allowed_keys is not None and name not in allowed_keys):
            continue
        if not isinstance(raw_weight, (int, float)) or isinstance(raw_weight, bool):
            continue
        cleaned[name] = round(_clamp(float(raw_weight), -0.35, 0.35), 4)
    return cleaned


@dataclass(frozen=True, slots=True)
class LearnerModelState:
    """Resettable derived preferences; no raw learner note is retained here."""

    version: int = MODEL_VERSION
    feedback_count: int = 0
    difficulty_bias: float = 0.0
    length_bias: float = 0.0
    context_weights: dict[str, float] = field(default_factory=dict)
    pattern_weights: dict[str, float] = field(default_factory=dict)

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any] | None) -> LearnerModelState:
        """Hydrate a defensive, bounded state from persisted JSON."""
        if value is None:
            return cls()
        feedback_count_value = value.get("feedback_count", 0)
        feedback_count = (
            int(feedback_count_value)
            if isinstance(feedback_count_value, int) and not isinstance(feedback_count_value, bool)
            else 0
        )
        difficulty_value = value.get("difficulty_bias", 0.0)
        length_value = value.get("length_bias", 0.0)
        difficulty = (
            float(difficulty_value)
            if isinstance(difficulty_value, (int, float)) and not isinstance(difficulty_value, bool)
            else 0.0
        )
        length = (
            float(length_value)
            if isinstance(length_value, (int, float)) and not isinstance(length_value, bool)
            else 0.0
        )
        return cls(
            version=MODEL_VERSION,
            feedback_count=max(0, feedback_count),
            difficulty_bias=round(_clamp(difficulty, -0.5, 0.5), 4),
            length_bias=round(_clamp(length, -0.3, 0.3), 4),
            context_weights=_clean_weights(
                value.get("context_weights"),
                allowed_keys=CONTEXT_KEYS,
            ),
            pattern_weights=_clean_weights(
                value.get("pattern_weights"),
                allowed_keys=None,
            ),
        )

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-compatible state for repository persistence."""
        return {
            "version": self.version,
            "feedback_count": self.feedback_count,
            "difficulty_bias": self.difficulty_bias,
            "length_bias": self.length_bias,
            "context_weights": dict(sorted(self.context_weights.items())),
            "pattern_weights": dict(sorted(self.pattern_weights.items())),
        }


@dataclass(frozen=True, slots=True)
class LearningFeedback:
    """Validated explicit learner response about one coach recommendation."""

    useful: bool | None = None
    difficulty: DifficultyFeedback | None = None
    relevant: bool | None = None
    context: str | None = None
    pattern_id: str | None = None
    note: str | None = None

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> LearningFeedback:
        """Validate the public feedback vocabulary without guessing intent."""
        useful = value.get("useful")
        relevant = value.get("relevant")
        if useful is not None and not isinstance(useful, bool):
            raise ValueError("useful must be true, false, or null")
        if relevant is not None and not isinstance(relevant, bool):
            raise ValueError("relevant must be true, false, or null")

        difficulty_value = value.get("difficulty")
        if difficulty_value not in {None, "too_easy", "right", "too_hard"}:
            raise ValueError("difficulty must be too_easy, right, too_hard, or null")
        difficulty = cast(DifficultyFeedback | None, difficulty_value)

        context = _optional_text(value.get("context"), "context", 40)
        if context is not None and context not in CONTEXT_KEYS:
            raise ValueError(f"unsupported feedback context: {context}")
        pattern_id = _optional_text(value.get("pattern_id"), "pattern_id", 100)
        note = _optional_text(value.get("note"), "note", 500)
        if all(item is None for item in (useful, difficulty, relevant, note)):
            raise ValueError("feedback must include at least one response")
        return cls(
            useful=useful,
            difficulty=difficulty,
            relevant=relevant,
            context=context,
            pattern_id=pattern_id,
            note=note,
        )


@dataclass(frozen=True, slots=True)
class LearnerModelUpdate:
    """One explainable state transition."""

    state: LearnerModelState
    changes: dict[str, float]
    reason_en: tuple[str, ...]
    reason_es: tuple[str, ...]
    reason_he: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "state": self.state.to_dict(),
            "changes": dict(sorted(self.changes.items())),
            "reasons": {
                "en": list(self.reason_en),
                "es": list(self.reason_es),
                "he": list(self.reason_he),
            },
        }


def _optional_text(value: object, field_name: str, max_length: int) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be text or null")
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must not exceed {max_length} characters")
    return cleaned


def update_learner_model(
    previous: LearnerModelState,
    feedback: LearningFeedback,
) -> LearnerModelUpdate:
    """Apply one small, diminishing and fully inspectable preference update."""
    # New learners get enough movement to notice personalization, while repeated
    # feedback gradually lowers the learning rate without ever becoming inert.
    rate = max(0.35, 1.0 / (1.0 + previous.feedback_count / 20.0))
    difficulty_delta = 0.0
    length_delta = 0.0
    context_delta = 0.0
    pattern_delta = 0.0
    en: list[str] = []
    es: list[str] = []
    he: list[str] = []

    if feedback.difficulty == "too_easy":
        difficulty_delta = MAX_SINGLE_DIFFICULTY_DELTA * rate
        length_delta = MAX_SINGLE_LENGTH_DELTA * rate
        en.append("Future examples will become slightly more challenging.")
        es.append("Los próximos ejemplos serán un poco más exigentes.")
        he.append("הדוגמאות הבאות יהיו מעט מאתגרות יותר.")
    elif feedback.difficulty == "too_hard":
        difficulty_delta = -MAX_SINGLE_DIFFICULTY_DELTA * rate
        length_delta = -MAX_SINGLE_LENGTH_DELTA * rate
        en.append("Future examples will become slightly shorter and easier.")
        es.append("Los próximos ejemplos serán un poco más cortos y fáciles.")
        he.append("הדוגמאות הבאות יהיו מעט קצרות וקלות יותר.")
    elif feedback.difficulty == "right":
        en.append("The current difficulty was reinforced without a large change.")
        es.append("Se reforzó la dificultad actual sin un cambio grande.")
        he.append("רמת הקושי הנוכחית חוזקה ללא שינוי גדול.")

    if feedback.relevant is not None and feedback.context is not None:
        direction = 1.0 if feedback.relevant else -1.0
        context_delta = direction * MAX_SINGLE_WEIGHT_DELTA * rate
        if feedback.relevant:
            en.append(
                f"The {feedback.context.replace('_', ' ')} context gained a small preference."
            )
            es.append(
                f"El contexto {feedback.context.replace('_', ' ')} ganó una preferencia pequeña."
            )
            he.append("ההקשר שסומן כרלוונטי יקבל עדיפות קטנה.")
        else:
            en.append(f"The {feedback.context.replace('_', ' ')} context was gently reduced.")
            es.append(
                f"El contexto {feedback.context.replace('_', ' ')} se redujo de forma gradual."
            )
            he.append("ההקשר שסומן כלא רלוונטי יקבל פחות עדיפות.")

    if feedback.useful is not None and feedback.pattern_id is not None:
        direction = 1.0 if feedback.useful else -1.0
        pattern_delta = direction * MAX_SINGLE_WEIGHT_DELTA * rate
        if feedback.useful:
            en.append("This reviewed pattern gained a small preference.")
            es.append("Este patrón revisado ganó una preferencia pequeña.")
            he.append("התבנית שנמצאה שימושית תקבל עדיפות קטנה.")
        else:
            en.append("This reviewed pattern will appear slightly less often.")
            es.append("Este patrón revisado aparecerá un poco menos.")
            he.append("התבנית תופיע מעט פחות.")

    context_weights = dict(previous.context_weights)
    if feedback.context is not None and context_delta:
        old_context = context_weights.get(feedback.context, 0.0)
        context_weights[feedback.context] = round(
            _clamp(old_context + context_delta, -0.35, 0.35),
            4,
        )

    pattern_weights = dict(previous.pattern_weights)
    if feedback.pattern_id is not None and pattern_delta:
        old_pattern = pattern_weights.get(feedback.pattern_id, 0.0)
        pattern_weights[feedback.pattern_id] = round(
            _clamp(old_pattern + pattern_delta, -0.35, 0.35),
            4,
        )

    next_difficulty = round(
        _clamp(previous.difficulty_bias + difficulty_delta, -0.5, 0.5),
        4,
    )
    next_length = round(
        _clamp(previous.length_bias + length_delta, -0.3, 0.3),
        4,
    )
    next_state = LearnerModelState(
        version=MODEL_VERSION,
        feedback_count=previous.feedback_count + 1,
        difficulty_bias=next_difficulty,
        length_bias=next_length,
        context_weights=context_weights,
        pattern_weights=pattern_weights,
    )
    changes: dict[str, float] = {
        "difficulty_bias": round(next_difficulty - previous.difficulty_bias, 4),
        "length_bias": round(next_length - previous.length_bias, 4),
    }
    if feedback.context is not None:
        changes[f"context:{feedback.context}"] = round(
            context_weights.get(feedback.context, 0.0)
            - previous.context_weights.get(feedback.context, 0.0),
            4,
        )
    if feedback.pattern_id is not None:
        changes[f"pattern:{feedback.pattern_id}"] = round(
            pattern_weights.get(feedback.pattern_id, 0.0)
            - previous.pattern_weights.get(feedback.pattern_id, 0.0),
            4,
        )

    if feedback.note is not None:
        en.append("Your optional note can be reviewed, but it is not silently profiled.")
        es.append("Tu nota opcional puede revisarse, pero no se perfila automáticamente.")
        he.append("אפשר לעיין בהערה, אך היא אינה משמשת לפרופיל אוטומטי.")
    if not en:
        en.append("Feedback was recorded without changing derived preferences.")
        es.append("El feedback se registró sin cambiar las preferencias derivadas.")
        he.append("המשוב נשמר ללא שינוי בהעדפות.")
    return LearnerModelUpdate(
        state=next_state,
        changes=changes,
        reason_en=tuple(en),
        reason_es=tuple(es),
        reason_he=tuple(he),
    )


def reset_learner_model() -> LearnerModelState:
    """Return a clean derived state without implying deletion of learning data."""
    return LearnerModelState()


def apply_feedback(
    state_data: Mapping[str, Any] | None,
    feedback_data: Mapping[str, Any],
) -> dict[str, Any]:
    """Convenience boundary for repository/API integrations using JSON data."""
    state = LearnerModelState.from_mapping(state_data)
    feedback = LearningFeedback.from_mapping(feedback_data)
    return update_learner_model(state, feedback).to_dict()
