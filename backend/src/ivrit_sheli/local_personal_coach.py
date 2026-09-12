"""Deterministic example selection for Ivrit Sheli's local personal coach."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

from ivrit_sheli.coach_patterns import (
    REVIEWED_PATTERNS,
    Level,
)
from ivrit_sheli.dictionary import STARTER_SOURCE_NAME
from ivrit_sheli.learner_model import LearnerModelState
from ivrit_sheli.normalization import contains_hebrew, normalize_hebrew

ExampleBand = Literal["easy", "current", "stretch"]
VALID_LEVELS: tuple[Level, ...] = ("A0", "A1", "A2", "B1", "B2")
LEVEL_DIFFICULTY: dict[Level, float] = {
    "A0": 0.9,
    "A1": 1.5,
    "A2": 2.3,
    "B1": 3.1,
    "B2": 3.8,
}
LEVEL_TOKEN_TARGET: dict[Level, int] = {
    "A0": 4,
    "A1": 7,
    "A2": 10,
    "B1": 14,
    "B2": 18,
}
GOAL_CONTEXTS: dict[str, tuple[str, ...]] = {
    "daily": ("daily_life",),
    "conversation": ("daily_life", "social"),
    "family": ("family", "daily_life"),
    "health": ("health", "daily_life"),
    "listening": ("listening", "study"),
    "shopping": ("shopping", "daily_life"),
    "travel": ("travel", "daily_life"),
    "work": ("work",),
    "career": ("work",),
    "study": ("study",),
}


def _required_text(value: object, field_name: str, max_length: int = 180) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} must be non-empty text")
    cleaned = value.strip()
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must not exceed {max_length} characters")
    return cleaned


def _optional_text(value: object, default: str, max_length: int = 80) -> str:
    if value is None:
        return default
    if not isinstance(value, str):
        return default
    cleaned = value.strip()
    return cleaned[:max_length] if cleaned else default


def _level(value: object) -> Level:
    candidate = str(value or "A0").upper()
    if candidate in VALID_LEVELS:
        return candidate
    return "A0"


def _text_tuple(value: object, *, limit: int = 24) -> tuple[str, ...]:
    if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
        return ()
    return tuple(text for item in value[:limit] if isinstance(item, str) and (text := item.strip()))


@dataclass(frozen=True, slots=True)
class ConceptForCoach:
    """Reviewed concept facts needed by deterministic example generation."""

    hebrew: str
    niqqud: str
    translation_en: str
    translation_es: str
    romanization: str
    part_of_speech: str
    category: str
    level: Level
    register: str
    source_key: str
    source_name: str
    dictionary_examples: tuple[Mapping[str, Any], ...]

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> ConceptForCoach:
        hebrew = _required_text(
            value.get("hebrew") or value.get("word") or value.get("hebrew_text"),
            "hebrew",
            120,
        )
        if not contains_hebrew(hebrew):
            raise ValueError("hebrew must contain Hebrew text")
        translation_en = _required_text(
            value.get("translation_en") or value.get("gloss_en") or _first_sense(value, "gloss_en"),
            "translation_en",
        )
        translation_es = _required_text(
            value.get("translation_es") or value.get("gloss_es") or _first_sense(value, "gloss_es"),
            "translation_es",
        )
        examples_value = value.get("examples")
        examples = (
            tuple(item for item in examples_value[:12] if isinstance(item, Mapping))
            if isinstance(examples_value, Sequence) and not isinstance(examples_value, (str, bytes))
            else ()
        )
        source_name = _optional_text(value.get("source_name"), "", 180)
        explicitly_reviewed = value.get("review_status") == "product_reviewed"
        if source_name != STARTER_SOURCE_NAME and not explicitly_reviewed:
            raise ValueError(
                "The personal coach currently accepts only product-reviewed dictionary concepts"
            )
        return cls(
            hebrew=hebrew,
            niqqud=_optional_text(
                value.get("niqqud")
                or value.get("hebrew_with_niqqud")
                or value.get("display_niqqud"),
                hebrew,
                120,
            ),
            translation_en=translation_en,
            translation_es=translation_es,
            romanization=_optional_text(value.get("romanization"), "", 160),
            part_of_speech=_optional_text(
                value.get("part_of_speech") or value.get("pos"),
                "unknown",
                40,
            ).lower(),
            category=_optional_text(value.get("category"), "general", 40).lower(),
            level=_level(value.get("level")),
            register=_optional_text(
                value.get("register") or value.get("register_label"),
                "neutral",
                40,
            ).lower(),
            source_key=_optional_text(
                value.get("source_key") or value.get("id"),
                f"concept:{normalize_hebrew(hebrew)}",
                160,
            ),
            source_name=source_name or "product_reviewed",
            dictionary_examples=examples,
        )


def _first_sense(value: Mapping[str, Any], key: str) -> object:
    senses = value.get("senses")
    if not isinstance(senses, Sequence) or isinstance(senses, (str, bytes)):
        return None
    for sense in senses[:12]:
        if isinstance(sense, Mapping) and sense.get(key):
            return sense[key]
    return None


@dataclass(frozen=True, slots=True)
class LearnerSignals:
    """Bounded signals that affect selection, never free-form generation."""

    level: Level
    mode: str
    goals: tuple[str, ...]
    known_words: tuple[str, ...]
    error_counts: dict[str, int]
    confidence: float
    response_ms: int
    repetitions: int

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any] | None) -> LearnerSignals:
        data: Mapping[str, Any] = value or {}
        errors_value = data.get("error_counts")
        errors: dict[str, int] = {}
        if isinstance(errors_value, Mapping):
            for index, (key, raw_count) in enumerate(errors_value.items()):
                if index >= 64:
                    break
                if isinstance(raw_count, int) and not isinstance(raw_count, bool):
                    errors[str(key)] = max(0, min(raw_count, 10_000))

        confidence_value = data.get("confidence", data.get("average_confidence", 3))
        confidence = (
            float(confidence_value)
            if isinstance(confidence_value, (int, float)) and not isinstance(confidence_value, bool)
            else 3.0
        )
        response_value = data.get("response_ms", data.get("median_response_ms", 4_000))
        response_ms = (
            int(response_value)
            if isinstance(response_value, int) and not isinstance(response_value, bool)
            else 4_000
        )
        repetitions_value = data.get("repetitions", 0)
        repetitions = (
            int(repetitions_value)
            if isinstance(repetitions_value, int) and not isinstance(repetitions_value, bool)
            else 0
        )
        return cls(
            level=_level(data.get("level") or data.get("cefr_band") or data.get("hebrew_level")),
            mode=_optional_text(data.get("mode") or data.get("learner_mode"), "guided", 24),
            goals=_text_tuple(data.get("goals")),
            known_words=tuple(
                normalize_hebrew(word) for word in _text_tuple(data.get("known_words"), limit=500)
            ),
            error_counts=errors,
            confidence=max(1.0, min(5.0, confidence)),
            response_ms=max(0, min(response_ms, 600_000)),
            repetitions=max(0, min(repetitions, 10_000)),
        )


@dataclass(frozen=True, slots=True)
class CandidateExample:
    hebrew: str
    translation_en: str
    translation_es: str
    romanization: str
    source_kind: Literal["dictionary", "reviewed_pattern"]
    source_id: str
    provenance: str
    difficulty: float
    contexts: tuple[str, ...]
    registers: tuple[str, ...]
    grammar: tuple[str, ...]
    kind: Literal["usage", "practice_frame"]


def _hebrew_token_count(text: str) -> int:
    return max(1, len(normalize_hebrew(text).split()))


def _dictionary_candidates(concept: ConceptForCoach) -> list[CandidateExample]:
    candidates: list[CandidateExample] = []
    for index, example in enumerate(concept.dictionary_examples):
        hebrew_value = example.get("hebrew") or example.get("hebrew_text")
        en_value = example.get("translation_en")
        es_value = example.get("translation_es")
        if not all(
            isinstance(value, str) and value.strip() for value in (hebrew_value, en_value, es_value)
        ):
            continue
        hebrew = str(hebrew_value).strip()
        if not contains_hebrew(hebrew):
            continue
        token_count = _hebrew_token_count(hebrew)
        difficulty = min(5.0, 0.55 + token_count * 0.22)
        candidates.append(
            CandidateExample(
                hebrew=hebrew,
                translation_en=str(en_value).strip(),
                translation_es=str(es_value).strip(),
                romanization=_optional_text(example.get("romanization"), "", 240),
                source_kind="dictionary",
                source_id=f"{concept.source_key}:example:{index + 1}",
                provenance=_optional_text(
                    example.get("source_text") or example.get("provenance"),
                    f"Reviewed dictionary example from {concept.source_key}",
                    240,
                ),
                difficulty=difficulty,
                contexts=(concept.category, "daily_life"),
                registers=(concept.register,),
                grammar=("reviewed dictionary example",),
                kind="usage",
            )
        )
    return candidates


def _pattern_candidates(
    concept: ConceptForCoach,
    learner: LearnerSignals,
) -> list[CandidateExample]:
    target_he = concept.niqqud or concept.hebrew
    candidates: list[CandidateExample] = []
    for pattern in REVIEWED_PATTERNS:
        if not pattern.is_compatible(
            level=learner.level,
            part_of_speech=concept.part_of_speech,
            category=concept.category,
        ):
            continue
        try:
            hebrew, translation_en, translation_es = pattern.render(
                target_he=target_he,
                target_en=concept.translation_en,
                target_es=concept.translation_es,
            )
        except ValueError:
            continue
        candidates.append(
            CandidateExample(
                hebrew=hebrew,
                translation_en=translation_en,
                translation_es=translation_es,
                romanization="",
                source_kind="reviewed_pattern",
                source_id=pattern.pattern_id,
                provenance=f"{pattern.provenance}; {pattern.pattern_id}@{pattern.version}",
                difficulty=pattern.difficulty,
                contexts=pattern.contexts,
                registers=pattern.registers,
                grammar=pattern.grammar,
                kind=pattern.kind,
            )
        )
    return candidates


def _goal_context_scores(goals: tuple[str, ...]) -> dict[str, float]:
    scores: dict[str, float] = {}
    normalized_goals = " ".join(goals).lower()
    for keyword, contexts in GOAL_CONTEXTS.items():
        if keyword not in normalized_goals:
            continue
        for context in contexts:
            scores[context] = scores.get(context, 0.0) + 0.18
    return scores


def _adapted_difficulty(
    learner: LearnerSignals,
    state: LearnerModelState,
) -> tuple[float, list[str]]:
    target = LEVEL_DIFFICULTY[learner.level] + state.difficulty_bias
    evidence: list[str] = [f"level:{learner.level}"]
    if learner.confidence <= 2.0:
        target -= 0.3
        evidence.append("low_confidence")
    elif learner.confidence >= 4.5:
        target += 0.2
        evidence.append("high_confidence")
    if learner.response_ms >= 12_000:
        target -= 0.25
        evidence.append("slow_response")
    elif 0 < learner.response_ms <= 2_500:
        target += 0.15
        evidence.append("fast_response")
    if learner.repetitions >= 5:
        target += 0.15
        evidence.append("repeated_exposure")
    if learner.error_counts.get("word_order", 0) >= 3:
        target -= 0.15
        evidence.append("word_order_support")
    return max(0.5, min(4.5, target)), evidence


def _candidate_score(
    candidate: CandidateExample,
    *,
    desired_difficulty: float,
    learner: LearnerSignals,
    state: LearnerModelState,
    context_scores: Mapping[str, float],
) -> float:
    score = -abs(candidate.difficulty - desired_difficulty)
    if candidate.source_kind == "dictionary":
        score += 1.2
    else:
        score += state.pattern_weights.get(candidate.source_id, 0.0)
    for context in candidate.contexts:
        score += context_scores.get(context, 0.0)
        score += state.context_weights.get(context, 0.0)

    desired_tokens = LEVEL_TOKEN_TARGET[learner.level] * (1.0 + state.length_bias)
    token_distance = abs(_hebrew_token_count(candidate.hebrew) - desired_tokens)
    score -= token_distance * 0.025
    normalized_tokens = {
        normalize_hebrew(token) for token in candidate.hebrew.split() if token.strip()
    }
    known = set(learner.known_words)
    if known and normalized_tokens:
        score += 0.18 * (len(normalized_tokens & known) / len(normalized_tokens))
    if learner.mode == "guided" and candidate.kind == "practice_frame":
        score += 0.08
    if learner.mode == "experienced" and candidate.kind == "usage":
        score += 0.08
    return score


def _select_examples(
    candidates: Sequence[CandidateExample],
    *,
    learner: LearnerSignals,
    state: LearnerModelState,
    target_difficulty: float,
) -> dict[ExampleBand, CandidateExample]:
    bands: tuple[tuple[ExampleBand, float], ...] = (
        ("easy", max(0.4, target_difficulty - 0.8)),
        ("current", target_difficulty),
        ("stretch", min(5.0, target_difficulty + 0.8)),
    )
    context_scores = _goal_context_scores(learner.goals)
    remaining = list(candidates)
    selected: dict[ExampleBand, CandidateExample] = {}

    # Guarantee that reviewed dictionary material is used when supplied. It is
    # assigned to the closest band, then all remaining bands are ranked.
    dictionary = [item for item in remaining if item.source_kind == "dictionary"]
    if dictionary:
        first = min(
            dictionary,
            key=lambda item: (abs(item.difficulty - target_difficulty), item.source_id),
        )
        closest_band = min(
            bands,
            key=lambda band: (abs(first.difficulty - band[1]), band[0]),
        )[0]
        selected[closest_band] = first
        remaining.remove(first)

    used_text = {normalize_hebrew(item.hebrew) for item in selected.values()}
    for band, desired in bands:
        if band in selected:
            continue
        eligible = [item for item in remaining if normalize_hebrew(item.hebrew) not in used_text]
        if not eligible:
            raise ValueError("The reviewed catalog could not produce three unique examples")
        chosen = max(
            eligible,
            key=lambda item: (
                _candidate_score(
                    item,
                    desired_difficulty=desired,
                    learner=learner,
                    state=state,
                    context_scores=context_scores,
                ),
                item.source_id,
            ),
        )
        selected[band] = chosen
        used_text.add(normalize_hebrew(chosen.hebrew))
        remaining.remove(chosen)
    return selected


def generate_examples(
    concept_data: Mapping[str, Any],
    learner_data: Mapping[str, Any] | None = None,
    model_data: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Return three sourced examples adapted without free-form generation."""
    concept = ConceptForCoach.from_mapping(concept_data)
    learner = LearnerSignals.from_mapping(learner_data)
    state = LearnerModelState.from_mapping(model_data)
    target_difficulty, evidence = _adapted_difficulty(learner, state)
    candidates = _dictionary_candidates(concept)
    candidates.extend(_pattern_candidates(concept, learner))
    selected = _select_examples(
        candidates,
        learner=learner,
        state=state,
        target_difficulty=target_difficulty,
    )
    dictionary_count = sum(item.source_kind == "dictionary" for item in selected.values())
    goals = ", ".join(learner.goals[:2])
    reason_en = f"Matched your {learner.level} level"
    reason_es = f"Ajustado a tu nivel {learner.level}"
    reason_he = f"מותאם לרמת {learner.level}"
    if goals:
        reason_en += f" and goals ({goals})"
        reason_es += f" y objetivos ({goals})"
        reason_he += " ולמטרות שלך"
    if dictionary_count:
        reason_en += "; reviewed dictionary examples were preferred"
        reason_es += "; se priorizaron ejemplos revisados del diccionario"
        reason_he += "; ניתנה עדיפות לדוגמאות מהמילון"
    reason_en += "."
    reason_es += "."
    reason_he += "."

    band_order: tuple[ExampleBand, ...] = ("easy", "current", "stretch")
    return {
        "concept": {
            "hebrew": concept.hebrew,
            "niqqud": concept.niqqud,
            "translation_en": concept.translation_en,
            "translation_es": concept.translation_es,
            "source_key": concept.source_key,
        },
        "examples": [
            {
                "band": band,
                "hebrew": selected[band].hebrew,
                "translation_en": selected[band].translation_en,
                "translation_es": selected[band].translation_es,
                "romanization": selected[band].romanization,
                "source_kind": selected[band].source_kind,
                "source_id": selected[band].source_id,
                "provenance": selected[band].provenance,
                "contexts": list(selected[band].contexts),
                "registers": list(selected[band].registers),
                "grammar": list(selected[band].grammar),
                "kind": selected[band].kind,
                "difficulty": round(selected[band].difficulty, 2),
            }
            for band in band_order
        ],
        "reason": {
            "en": reason_en,
            "es": reason_es,
            "he": reason_he,
        },
        "evidence": {
            "level": learner.level,
            "mode": learner.mode,
            "target_difficulty": round(target_difficulty, 2),
            "signals_used": evidence,
            "dictionary_examples_available": len(_dictionary_candidates(concept)),
            "dictionary_examples_used": dictionary_count,
            "reviewed_pattern_catalog": "2026.07-v1",
            "free_form_generation": False,
        },
    }


def build_examples(
    concept: Mapping[str, Any],
    profile: Mapping[str, Any] | None = None,
    dictionary_examples: Sequence[Mapping[str, Any]] | None = None,
    learner_state: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Integration-friendly wrapper with an explicit dictionary-example input."""
    concept_data = dict(concept)
    if dictionary_examples is not None:
        concept_data["examples"] = [dict(example) for example in dictionary_examples[:12]]
    return generate_examples(concept_data, profile, learner_state)
