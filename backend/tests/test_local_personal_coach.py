"""Tests for reviewed examples and bounded local personalization."""

from __future__ import annotations

import pytest

from ivrit_sheli.coach_patterns import REVIEWED_PATTERNS, validate_pattern_catalog
from ivrit_sheli.learner_model import (
    LearnerModelState,
    LearningFeedback,
    apply_feedback,
    reset_learner_model,
    update_learner_model,
)
from ivrit_sheli.local_personal_coach import build_examples, generate_examples
from ivrit_sheli.normalization import contains_hebrew


def reviewed_water() -> dict[str, object]:
    return {
        "word": "מים",
        "niqqud": "מַיִם",
        "gloss_en": "water",
        "gloss_es": "agua",
        "pos": "noun",
        "category": "food",
        "level": "A0",
        "source_key": "builtin:מים:noun",
        "source_name": "Ivrit Sheli reviewed starter vocabulary",
        "examples": [
            {
                "hebrew": "מַיִם, בְּבַקָּשָׁה.",
                "translation_en": "Water, please.",
                "translation_es": "Agua, por favor.",
                "romanization": "Mayim, bevakasha.",
                "source_text": "Ivrit Sheli reviewed starter vocabulary",
            }
        ],
    }


def test_reviewed_catalog_is_valid_and_ids_are_unique() -> None:
    validate_pattern_catalog()
    assert len({pattern.pattern_id for pattern in REVIEWED_PATTERNS}) == len(REVIEWED_PATTERNS)
    assert all(pattern.slots for pattern in REVIEWED_PATTERNS)
    assert all("reviewed" in pattern.provenance.lower() for pattern in REVIEWED_PATTERNS)


def test_examples_are_trilingual_sourced_and_use_dictionary_first() -> None:
    result = generate_examples(
        reviewed_water(),
        {
            "level": "A0",
            "mode": "guided",
            "goals": ["daily conversation"],
            "confidence": 2,
        },
    )

    examples = result["examples"]
    assert [example["band"] for example in examples] == ["easy", "current", "stretch"]
    assert len({example["hebrew"] for example in examples}) == 3
    assert sum(example["source_kind"] == "dictionary" for example in examples) == 1
    assert all(contains_hebrew(example["hebrew"]) for example in examples)
    assert all(example["translation_en"] for example in examples)
    assert all(example["translation_es"] for example in examples)
    assert all(example["provenance"] for example in examples)
    assert result["evidence"]["free_form_generation"] is False
    assert result["evidence"]["dictionary_examples_used"] == 1


def test_unknown_pos_uses_only_safe_practice_frames() -> None:
    result = generate_examples(
        {
            "hebrew": "אולי",
            "niqqud": "אוּלַי",
            "translation_en": "maybe",
            "translation_es": "quizás",
            "part_of_speech": "adverb",
            "category": "general",
            "source_key": "test:maybe",
            "review_status": "product_reviewed",
        },
        {"level": "A2", "mode": "explorer"},
    )

    assert len(result["examples"]) == 3
    assert {example["kind"] for example in result["examples"]} == {"practice_frame"}
    assert all(example["source_id"].startswith("concept.") for example in result["examples"])


def test_dictionary_example_requires_all_reviewed_languages() -> None:
    concept = reviewed_water()
    concept["examples"] = [
        {
            "hebrew": "מַיִם, בְּבַקָּשָׁה.",
            "translation_en": "Water, please.",
        }
    ]
    result = generate_examples(concept, {"level": "A0"})

    assert result["evidence"]["dictionary_examples_available"] == 0
    assert all(example["source_kind"] == "reviewed_pattern" for example in result["examples"])


def test_unreviewed_dictionary_concept_is_not_presented_as_coach_content() -> None:
    concept = reviewed_water()
    concept["source_name"] = "Kaikki/Wiktionary import"

    with pytest.raises(ValueError, match="product-reviewed"):
        generate_examples(concept, {"level": "A0"})


def test_work_goal_prefers_workplace_pattern_when_compatible() -> None:
    concept = {
        "hebrew": "אפשר לדבר?",
        "translation_en": "Can we talk?",
        "translation_es": "¿Podemos hablar?",
        "pos": "phrase",
        "category": "work",
        "level": "A2",
        "source_key": "test:work-phrase",
        "review_status": "product_reviewed",
    }
    result = generate_examples(
        concept,
        {
            "level": "A2",
            "mode": "experienced",
            "goals": ["workplace Hebrew"],
            "confidence": 4,
        },
        {"context_weights": {"work": 0.3}},
    )

    assert any(example["source_id"] == "phrase.workplace.meeting" for example in result["examples"])
    assert "goals" in result["reason"]["en"]


def test_low_confidence_and_slow_response_lower_target_difficulty() -> None:
    supported = generate_examples(
        reviewed_water(),
        {
            "level": "A2",
            "confidence": 1,
            "response_ms": 20_000,
            "error_counts": {"word_order": 5},
        },
    )
    fast = generate_examples(
        reviewed_water(),
        {
            "level": "A2",
            "confidence": 5,
            "response_ms": 1_500,
            "repetitions": 8,
        },
    )

    assert supported["evidence"]["target_difficulty"] < fast["evidence"]["target_difficulty"]
    assert "low_confidence" in supported["evidence"]["signals_used"]
    assert "repeated_exposure" in fast["evidence"]["signals_used"]


def test_single_feedback_update_is_bounded_and_explainable() -> None:
    feedback = LearningFeedback.from_mapping(
        {
            "useful": True,
            "difficulty": "too_hard",
            "relevant": False,
            "context": "work",
            "pattern_id": "phrase.workplace.meeting",
            "note": "Useful phrase, but not for today.",
        }
    )
    update = update_learner_model(LearnerModelState(), feedback)

    assert -0.08 <= update.changes["difficulty_bias"] < 0
    assert -0.04 <= update.changes["length_bias"] < 0
    assert -0.06 <= update.changes["context:work"] < 0
    assert 0 < update.changes["pattern:phrase.workplace.meeting"] <= 0.06
    assert update.state.feedback_count == 1
    assert update.reason_en
    assert update.reason_es
    assert update.reason_he
    assert "note" not in update.state.to_dict()


def test_repeated_feedback_changes_gradually_and_stays_clamped() -> None:
    state = LearnerModelState()
    first_delta = 0.0
    last_delta = 0.0
    feedback = LearningFeedback.from_mapping(
        {
            "difficulty": "too_easy",
            "relevant": True,
            "context": "listening",
        }
    )
    for index in range(100):
        update = update_learner_model(state, feedback)
        if index == 0:
            first_delta = update.changes["difficulty_bias"]
        last_delta = update.changes["difficulty_bias"]
        state = update.state

    assert state.difficulty_bias == 0.5
    assert state.length_bias == 0.3
    assert state.context_weights["listening"] == 0.35
    assert 0 <= last_delta <= first_delta <= 0.08


def test_state_hydration_filters_untrusted_keys_and_values() -> None:
    state = LearnerModelState.from_mapping(
        {
            "feedback_count": -8,
            "difficulty_bias": 99,
            "length_bias": -99,
            "context_weights": {"work": 99, "secret": 1},
            "pattern_weights": {"pattern": -99, "bad": "not-a-number"},
        }
    )

    assert state.feedback_count == 0
    assert state.difficulty_bias == 0.5
    assert state.length_bias == -0.3
    assert state.context_weights == {"work": 0.35}
    assert state.pattern_weights == {"pattern": -0.35}


def test_state_hydration_bounds_persisted_pattern_preferences() -> None:
    state = LearnerModelState.from_mapping(
        {
            "pattern_weights": {
                **{f"pattern-{index}": 0.1 for index in range(200)},
                "x" * 101: 0.2,
            }
        }
    )

    assert len(state.pattern_weights) == 128
    assert all(len(key) <= 100 for key in state.pattern_weights)


def test_reset_only_clears_derived_model() -> None:
    reset = reset_learner_model()
    assert reset.to_dict() == {
        "version": 1,
        "feedback_count": 0,
        "difficulty_bias": 0.0,
        "length_bias": 0.0,
        "context_weights": {},
        "pattern_weights": {},
    }


def test_json_convenience_boundaries_are_integration_ready() -> None:
    reviewed = reviewed_water()
    examples = reviewed.pop("examples")
    assert isinstance(examples, list)
    result = build_examples(
        reviewed,
        {"level": "A0"},
        [example for example in examples if isinstance(example, dict)],
        {},
    )
    update = apply_feedback(
        {},
        {"difficulty": "too_hard", "relevant": True, "context": "daily_life"},
    )

    assert len(result["examples"]) == 3
    assert update["state"]["feedback_count"] == 1
    assert update["changes"]["difficulty_bias"] < 0


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"difficulty": "impossible"},
        {"useful": "yes"},
        {"relevant": True, "context": "secret_context"},
        {"note": "x" * 501},
    ],
)
def test_feedback_contract_rejects_invalid_payloads(payload: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        LearningFeedback.from_mapping(payload)
