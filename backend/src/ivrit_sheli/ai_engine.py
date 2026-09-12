"""
Module: adaptive AI engine
Purpose: Expose structured Hebrew coaching with a deterministic offline provider and consent-gated cloud adapter.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any, Protocol

import requests

from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.normalization import normalize_hebrew, redact_sensitive_text
from ivrit_sheli.repository import iso_now

LOGGER = logging.getLogger(__name__)
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings"

SUPPORTED_TASKS = {
    "analyze",
    "word_insight",
    "correct",
    "exercises",
    "dialogue",
    "roleplay",
    "weekly_plan",
    "enrich_item",
    "mission",
    "niqqud",
    "transliteration",
}

TASK_SCHEMAS: dict[str, dict[str, Any]] = {
    "analyze": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "hebrew": {"type": "string"},
            "translation_en": {"type": "string"},
            "translation_es": {"type": "string"},
            "transliteration": {"type": "string"},
            "niqqud": {"type": "string"},
            "root": {"type": "string"},
            "binyan": {"type": "string"},
            "register": {"type": "string"},
            "naturalness_score": {"type": "integer", "minimum": 0, "maximum": 100},
            "grammar_notes": {"type": "array", "items": {"type": "string"}},
            "word_breakdown": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "word": {"type": "string"},
                        "lemma": {"type": "string"},
                        "part_of_speech": {"type": "string"},
                        "meaning_en": {"type": "string"},
                        "meaning_es": {"type": "string"},
                    },
                    "required": ["word", "lemma", "part_of_speech", "meaning_en", "meaning_es"],
                },
            },
        },
        "required": [
            "hebrew",
            "translation_en",
            "translation_es",
            "transliteration",
            "niqqud",
            "root",
            "binyan",
            "register",
            "naturalness_score",
            "grammar_notes",
            "word_breakdown",
        ],
    },
    "word_insight": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "word": {"type": "string"},
            "niqqud": {"type": "string"},
            "transliteration": {"type": "string"},
            "meanings_en": {"type": "array", "items": {"type": "string"}},
            "meanings_es": {"type": "array", "items": {"type": "string"}},
            "grammar": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "part_of_speech": {"type": "string"},
                    "gender": {"type": "string"},
                    "number": {"type": "string"},
                    "root": {"type": "string"},
                    "binyan": {"type": "string"},
                },
                "required": ["part_of_speech", "gender", "number", "root", "binyan"],
            },
            "forms": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "hebrew": {"type": "string"},
                        "label_en": {"type": "string"},
                        "label_es": {"type": "string"},
                    },
                    "required": ["hebrew", "label_en", "label_es"],
                },
            },
            "usage_notes_en": {"type": "array", "items": {"type": "string"}},
            "usage_notes_es": {"type": "array", "items": {"type": "string"}},
            "examples": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "hebrew": {"type": "string"},
                        "translation_en": {"type": "string"},
                        "translation_es": {"type": "string"},
                    },
                    "required": ["hebrew", "translation_en", "translation_es"],
                },
            },
            "confidence_note_en": {"type": "string"},
            "confidence_note_es": {"type": "string"},
        },
        "required": [
            "word", "niqqud", "transliteration", "meanings_en", "meanings_es",
            "grammar", "forms", "usage_notes_en", "usage_notes_es", "examples",
            "confidence_note_en", "confidence_note_es",
        ],
    },
    "correct": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "original": {"type": "string"},
            "corrected": {"type": "string"},
            "is_correct": {"type": "boolean"},
            "naturalness_score": {"type": "integer", "minimum": 0, "maximum": 100},
            "register": {"type": "string"},
            "explanation_en": {"type": "string"},
            "explanation_es": {"type": "string"},
            "mistakes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "category": {"type": "string"},
                        "original": {"type": "string"},
                        "replacement": {"type": "string"},
                        "reason_en": {"type": "string"},
                        "reason_es": {"type": "string"},
                    },
                    "required": ["category", "original", "replacement", "reason_en", "reason_es"],
                },
            },
            "alternatives": {"type": "array", "items": {"type": "string"}},
        },
        "required": [
            "original",
            "corrected",
            "is_correct",
            "naturalness_score",
            "register",
            "explanation_en",
            "explanation_es",
            "mistakes",
            "alternatives",
        ],
    },
    "exercises": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "focus": {"type": "string"},
            "estimated_minutes": {"type": "integer", "minimum": 1, "maximum": 60},
            "exercises": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "type": {"type": "string"},
                        "prompt": {"type": "string"},
                        "answer": {"type": "string"},
                        "hint": {"type": "string"},
                        "skill": {"type": "string"},
                        "difficulty": {"type": "integer", "minimum": 1, "maximum": 5},
                    },
                    "required": ["type", "prompt", "answer", "hint", "skill", "difficulty"],
                },
            },
        },
        "required": ["focus", "estimated_minutes", "exercises"],
    },
    "dialogue": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "scenario": {"type": "string"},
            "level": {"type": "string"},
            "turns": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "speaker": {"type": "string"},
                        "hebrew": {"type": "string"},
                        "translation_en": {"type": "string"},
                        "translation_es": {"type": "string"},
                        "transliteration": {"type": "string"},
                    },
                    "required": ["speaker", "hebrew", "translation_en", "translation_es", "transliteration"],
                },
            },
            "challenge": {"type": "string"},
        },
        "required": ["scenario", "level", "turns", "challenge"],
    },
    "roleplay": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "reply_hebrew": {"type": "string"},
            "translation_en": {"type": "string"},
            "translation_es": {"type": "string"},
            "coach_hint": {"type": "string"},
            "correction": {"type": "string"},
            "next_goal": {"type": "string"},
        },
        "required": ["reply_hebrew", "translation_en", "translation_es", "coach_hint", "correction", "next_goal"],
    },
    "weekly_plan": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "theme": {"type": "string"},
            "target_outcome": {"type": "string"},
            "total_minutes": {"type": "integer", "minimum": 5, "maximum": 600},
            "days": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "day": {"type": "string"},
                        "minutes": {"type": "integer", "minimum": 0, "maximum": 180},
                        "focus": {"type": "string"},
                        "activities": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["day", "minutes", "focus", "activities"],
                },
            },
            "success_metric": {"type": "string"},
        },
        "required": ["theme", "target_outcome", "total_minutes", "days", "success_metric"],
    },
    "enrich_item": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "hebrew_text": {"type": "string"},
            "hebrew_with_niqqud": {"type": "string"},
            "transliteration": {"type": "string"},
            "translation_en": {"type": "string"},
            "translation_es": {"type": "string"},
            "root": {"type": "string"},
            "binyan": {"type": "string"},
            "grammatical_gender": {"type": "string"},
            "register_label": {"type": "string"},
            "context_label": {"type": "string"},
            "example_sentences": {"type": "array", "items": {"type": "string"}},
            "usage_warning": {"type": "string"},
        },
        "required": [
            "hebrew_text",
            "hebrew_with_niqqud",
            "transliteration",
            "translation_en",
            "translation_es",
            "root",
            "binyan",
            "grammatical_gender",
            "register_label",
            "context_label",
            "example_sentences",
            "usage_warning",
        ],
    },
    "mission": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "title": {"type": "string"},
            "mission_text": {"type": "string"},
            "target_hebrew": {"type": "string"},
            "context": {"type": "string"},
            "difficulty": {"type": "integer", "minimum": 1, "maximum": 5},
            "success_check": {"type": "string"},
            "fallback_phrase": {"type": "string"},
        },
        "required": ["title", "mission_text", "target_hebrew", "context", "difficulty", "success_check", "fallback_phrase"],
    },
    "niqqud": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "original": {"type": "string"},
            "with_niqqud": {"type": "string"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "ambiguities": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["original", "with_niqqud", "confidence", "ambiguities"],
    },
    "transliteration": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "hebrew": {"type": "string"},
            "transliteration": {"type": "string"},
            "stress_note": {"type": "string"},
            "alternatives": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["hebrew", "transliteration", "stress_note", "alternatives"],
    },
}


class AIProviderError(RuntimeError):
    """Raised when a configured AI provider cannot return a valid result."""


@dataclass(frozen=True, slots=True)
class AIResult:
    """Normalized result returned by every AI task.

    Args:
        task: Task identifier.
        provider: Provider that produced the final data.
        model: Provider model or deterministic engine version.
        data: Structured task result.
        degraded_mode: Whether fallback was used.
        latency_ms: End-to-end execution time.
        redactions: Count of privacy redactions before a cloud request.

    Example:
        >>> AIResult("correct", "offline", "rules-v1", {}, True, 1, 0).provider
        'offline'
    """

    task: str
    provider: str
    model: str
    data: dict[str, Any]
    degraded_mode: bool
    latency_ms: int
    redactions: int = 0


class AIProvider(Protocol):
    """Protocol implemented by structured coaching providers."""

    name: str
    model: str

    def run(
        self,
        task: str,
        payload: dict[str, Any],
        learner_context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run a structured coaching task."""


class OfflineCoach:
    """Deterministic coach that keeps every app workflow available offline.

    Example:
        >>> OfflineCoach().run("correct", {"text": "שלום"}, {})["is_correct"]
        True
    """

    name = "offline"
    model = "rules-and-templates-v1"

    def run(
        self,
        task: str,
        payload: dict[str, Any],
        learner_context: dict[str, Any],
    ) -> dict[str, Any]:
        """Create a bounded deterministic response.

        Args:
            task: Supported AI task.
            payload: User-selected task data.
            learner_context: Non-sensitive learner signals.

        Returns:
            Task-specific structured result.

        Raises:
            ValueError: If the task is unsupported.

        Example:
            >>> OfflineCoach().run("mission", {"text": "תודה"}, {})["target_hebrew"]
            'תודה'
        """
        handlers = {
            "analyze": self._analyze,
            "word_insight": self._word_insight,
            "correct": self._correct,
            "exercises": self._exercises,
            "dialogue": self._dialogue,
            "roleplay": self._roleplay,
            "weekly_plan": self._weekly_plan,
            "enrich_item": self._enrich_item,
            "mission": self._mission,
            "niqqud": self._niqqud,
            "transliteration": self._transliteration,
        }
        try:
            handler = handlers[task]
        except KeyError as error:
            raise ValueError(f"Unsupported AI task: {task}") from error
        return handler(payload, learner_context)

    @staticmethod
    def _text(payload: dict[str, Any]) -> str:
        """Read a task's primary Hebrew text.

        Args:
            payload: Task payload.

        Returns:
            Trimmed text with a useful fallback.

        Example:
            >>> OfflineCoach._text({"hebrew_text": " תודה "})
            'תודה'
        """
        return str(
            payload.get("text")
            or payload.get("hebrew_text")
            or payload.get("target_text")
            or "שלום"
        ).strip()

    def _analyze(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        text = self._text(payload)
        words = [word for word in re.split(r"\s+", text) if word]
        return {
            "hebrew": text,
            "translation_en": str(payload.get("translation_en") or "Translation requires dictionary or cloud enrichment."),
            "translation_es": str(payload.get("translation_es") or "La traducción requiere el diccionario o enriquecimiento en la nube."),
            "transliteration": str(payload.get("transliteration") or simple_transliterate(text)),
            "niqqud": str(payload.get("hebrew_with_niqqud") or text),
            "root": str(payload.get("root") or ""),
            "binyan": str(payload.get("binyan") or ""),
            "register": str(payload.get("register_label") or "neutral"),
            "naturalness_score": 70 if len(words) > 1 else 65,
            "grammar_notes": [
                "Offline analysis is conservative; tap each Hebrew word for dictionary detail.",
                f"Current learner level: {learner_context.get('hebrew_level', 'A2')}.",
            ],
            "word_breakdown": [
                {
                    "word": word,
                    "lemma": normalize_hebrew(word),
                    "part_of_speech": "unknown",
                    "meaning_en": "Open dictionary",
                    "meaning_es": "Abrir diccionario",
                }
                for word in words
            ],
        }

    def _word_insight(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        """Build a deterministic dictionary-backed word explanation offline."""
        word = self._text(payload)
        entry_value = payload.get("dictionary_entry")
        entry = entry_value if isinstance(entry_value, dict) else {}
        senses_value = entry.get("senses")
        senses = senses_value if isinstance(senses_value, list) else []
        forms_value = entry.get("forms")
        forms = forms_value if isinstance(forms_value, list) else []
        examples_value = entry.get("examples")
        examples = examples_value if isinstance(examples_value, list) else []

        def strings(key: str) -> list[str]:
            return [
                str(sense[key])
                for sense in senses
                if isinstance(sense, dict) and sense.get(key)
            ][:8]

        return {
            "word": word,
            "niqqud": str(entry.get("display_niqqud") or word),
            "transliteration": str(
                entry.get("romanization") or simple_transliterate(word)
            ),
            "meanings_en": strings("gloss_en"),
            "meanings_es": strings("gloss_es"),
            "grammar": {
                "part_of_speech": str(entry.get("pos") or "unknown"),
                "gender": str(entry.get("gender") or ""),
                "number": "",
                "root": str(entry.get("root") or ""),
                "binyan": str(entry.get("binyan") or ""),
            },
            "forms": [
                {
                    "hebrew": str(form.get("form") or ""),
                    "label_en": ", ".join(str(tag) for tag in form.get("tags", [])),
                    "label_es": ", ".join(str(tag) for tag in form.get("tags", [])),
                }
                for form in forms[:12]
                if isinstance(form, dict) and form.get("form")
            ],
            "usage_notes_en": [
                "Local dictionary facts are shown below; optional cloud enrichment may add context."
            ],
            "usage_notes_es": [
                "Abajo se muestran datos del diccionario local; el enriquecimiento opcional en la nube puede añadir contexto."
            ],
            "examples": [
                {
                    "hebrew": str(example.get("hebrew_text") or ""),
                    "translation_en": str(example.get("translation_en") or ""),
                    "translation_es": "",
                }
                for example in examples[:8]
                if isinstance(example, dict) and example.get("hebrew_text")
            ],
            "confidence_note_en": (
                "Dictionary-backed local result." if entry else "No local dictionary match."
            ),
            "confidence_note_es": (
                "Resultado local respaldado por el diccionario."
                if entry
                else "No hay coincidencia en el diccionario local."
            ),
        }

    def _correct(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        text = self._text(payload)
        corrected = re.sub(r"\s+", " ", text).strip()
        mistakes: list[dict[str, str]] = []
        if text != corrected:
            mistakes.append(
                {
                    "category": "spacing",
                    "original": text,
                    "replacement": corrected,
                    "reason_en": "Repeated spaces were normalized.",
                    "reason_es": "Se normalizaron los espacios repetidos.",
                }
            )
        # This small rule catches a frequent beginner agreement pattern without pretending
        # to be a complete Hebrew grammar checker.
        if "אני צריך" in corrected and str(payload.get("speaker_gender", "masculine")) == "feminine":
            replacement = corrected.replace("אני צריך", "אני צריכה")
            mistakes.append(
                {
                    "category": "gender_agreement",
                    "original": "אני צריך",
                    "replacement": "אני צריכה",
                    "reason_en": "The adjective must agree with a feminine speaker.",
                    "reason_es": "El adjetivo debe concordar con una hablante femenina.",
                }
            )
            corrected = replacement
        is_correct = not mistakes
        return {
            "original": text,
            "corrected": corrected,
            "is_correct": is_correct,
            "naturalness_score": 84 if is_correct else 68,
            "register": str(payload.get("register") or "neutral"),
            "explanation_en": (
                "No deterministic issue was detected. Use the cloud coach for deeper naturalness analysis."
                if is_correct
                else "A focused offline rule found a correctable pattern."
            ),
            "explanation_es": (
                "No se detectó un problema determinista. Usa el tutor en la nube para un análisis más profundo."
                if is_correct
                else "Una regla local detectó un patrón corregible."
            ),
            "mistakes": mistakes,
            "alternatives": [corrected],
        }

    def _exercises(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        text = self._text(payload)
        translation = str(payload.get("translation_en") or "the saved meaning")
        focus = str(payload.get("focus") or learner_context.get("focus") or "active recall")
        return {
            "focus": focus,
            "estimated_minutes": 8,
            "exercises": [
                {
                    "type": "recognition",
                    "prompt": f"What does “{text}” mean?",
                    "answer": translation,
                    "hint": str(payload.get("translation_es") or "Reveal the saved translation."),
                    "skill": "recognition",
                    "difficulty": 2,
                },
                {
                    "type": "production",
                    "prompt": f"Say this idea in Hebrew: {translation}",
                    "answer": text,
                    "hint": f"First letter: {text[:1]}",
                    "skill": "production",
                    "difficulty": 3,
                },
                {
                    "type": "speaking",
                    "prompt": f"Say “{text}” aloud, then compare the transcript.",
                    "answer": text,
                    "hint": simple_transliterate(text),
                    "skill": "speaking",
                    "difficulty": 3,
                },
            ],
        }

    def _dialogue(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        scenario = str(payload.get("scenario") or "workplace check-in")
        target = self._text(payload)
        return {
            "scenario": scenario,
            "level": str(learner_context.get("hebrew_level") or "A2"),
            "turns": [
                {
                    "speaker": "colleague",
                    "hebrew": "אפשר לדבר רגע?",
                    "translation_en": "Can we talk for a moment?",
                    "translation_es": "¿Podemos hablar un momento?",
                    "transliteration": "Efshar ledaber rega?",
                },
                {
                    "speaker": "learner",
                    "hebrew": target,
                    "translation_en": str(payload.get("translation_en") or "Use your target phrase."),
                    "translation_es": str(payload.get("translation_es") or "Usa tu frase objetivo."),
                    "transliteration": simple_transliterate(target),
                },
                {
                    "speaker": "colleague",
                    "hebrew": "מצוין, תודה.",
                    "translation_en": "Excellent, thank you.",
                    "translation_es": "Excelente, gracias.",
                    "transliteration": "Metsuyan, toda.",
                },
            ],
            "challenge": "Repeat the dialogue once without transliteration.",
        }

    def _roleplay(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        target = self._text(payload)
        user_turn = str(payload.get("user_turn") or "")
        return {
            "reply_hebrew": "בסדר, בוא נמשיך.",
            "translation_en": "Okay, let’s continue.",
            "translation_es": "Bien, continuemos.",
            "coach_hint": f"Try to include your target phrase: {target}",
            "correction": self._correct({"text": user_turn or target}, learner_context)["corrected"],
            "next_goal": "Ask one short follow-up question in Hebrew.",
        }

    def _weekly_plan(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        daily_minutes = int(learner_context.get("daily_minutes") or payload.get("daily_minutes") or 18)
        focus = str(learner_context.get("focus") or payload.get("focus") or "speaking confidence")
        days = [
            ("Sunday", "plan + capture", ["Review weak items", "Capture 3 useful phrases"]),
            ("Monday", focus, ["Adaptive review", "One speaking drill"]),
            ("Tuesday", "listening", ["Listen and transcribe", "Shadow 3 phrases"]),
            ("Wednesday", "production", ["Create 5 sentences", "Complete one mission"]),
            ("Thursday", "consolidation", ["Difficult-item review", "Weekly reflection"]),
            ("Friday", "optional light review", ["Five-minute review only"]),
            ("Saturday", "rest", ["No streak penalty; optional passive exposure"]),
        ]
        plan_days = [
            {
                "day": day,
                "minutes": 0 if focus_name == "rest" else (5 if "optional" in focus_name else daily_minutes),
                "focus": focus_name,
                "activities": activities,
            }
            for day, focus_name, activities in days
        ]
        return {
            "theme": focus,
            "target_outcome": "Use three recently learned phrases in real situations.",
            "total_minutes": sum(day["minutes"] for day in plan_days),
            "days": plan_days,
            "success_metric": "Three successful real-life uses and at least 75% review recall.",
        }

    def _enrich_item(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        text = self._text(payload)
        return {
            "hebrew_text": text,
            "hebrew_with_niqqud": str(payload.get("hebrew_with_niqqud") or text),
            "transliteration": str(payload.get("transliteration") or simple_transliterate(text)),
            "translation_en": str(payload.get("translation_en") or "Add or confirm the English meaning."),
            "translation_es": str(payload.get("translation_es") or "Añade o confirma el significado en español."),
            "root": str(payload.get("root") or ""),
            "binyan": str(payload.get("binyan") or ""),
            "grammatical_gender": str(payload.get("grammatical_gender") or "unspecified"),
            "register_label": str(payload.get("register_label") or "neutral"),
            "context_label": str(payload.get("context_label") or "daily_life"),
            "example_sentences": [f"היום אני משתמש בביטוי: {text}."],
            "usage_warning": "Offline enrichment is intentionally conservative; verify ambiguous forms.",
        }

    def _mission(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        target = self._text(payload)
        context = str(payload.get("context") or "daily_life")
        return {
            "title": "Use Hebrew in real life",
            "mission_text": f"Use “{target}” once in a natural {context.replace('_', ' ')} situation.",
            "target_hebrew": target,
            "context": context,
            "difficulty": int(payload.get("difficulty") or 2),
            "success_check": "Record whether the other person understood without switching languages.",
            "fallback_phrase": "אפשר להגיד את זה שוב, בבקשה?",
        }

    def _niqqud(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        text = self._text(payload)
        known = {
            "שלום": "שָׁלוֹם",
            "תודה": "תּוֹדָה",
            "בבקשה": "בְּבַקָּשָׁה",
            "אפשר": "אֶפְשָׁר",
            "עבודה": "עֲבוֹדָה",
            "פגישה": "פְּגִישָׁה",
        }
        pointed = " ".join(known.get(word, word) for word in text.split())
        return {
            "original": text,
            "with_niqqud": pointed,
            "confidence": 0.95 if all(word in known for word in text.split()) else 0.35,
            "ambiguities": [] if pointed != text else ["Unrecognized words were left unchanged."],
        }

    def _transliteration(
        self, payload: dict[str, Any], learner_context: dict[str, Any]
    ) -> dict[str, Any]:
        text = self._text(payload)
        return {
            "hebrew": text,
            "transliteration": simple_transliterate(text),
            "stress_note": "Offline transliteration is approximate; prefer dictionary audio for exact stress.",
            "alternatives": [],
        }


class OpenAIResponsesProvider:
    """Consent-gated OpenAI Responses API adapter using JSON Schema output.

    Args:
        settings: Validated settings with API key and model.
        session: Optional requests session for deterministic tests.

    Example:
        Instantiate through `AIEngine`; direct calls require explicit cloud consent.
    """

    name = "openai"

    def __init__(
        self, settings: Settings, session: requests.Session | None = None
    ) -> None:
        self.settings = settings
        self.model = settings.openai_text_model
        self.session = session or requests.Session()

    def run(
        self,
        task: str,
        payload: dict[str, Any],
        learner_context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run one task through the OpenAI Responses API.

        Args:
            task: Supported structured task.
            payload: Redacted user-selected content.
            learner_context: Bounded private learner signals.

        Returns:
            JSON object validated by the provider's strict schema.

        Raises:
            AIProviderError: If configuration, HTTP, or JSON output is invalid.

        Example:
            HTTP behavior is covered with a fake session in tests.
        """
        if not self.settings.openai_api_key:
            raise AIProviderError("OPENAI_API_KEY is not configured")
        schema = TASK_SCHEMAS.get(task)
        if schema is None:
            raise AIProviderError(f"No output schema for task: {task}")

        request_body = {
            "model": self.model,
            "input": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": build_system_prompt(task),
                        }
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": json.dumps(
                                {
                                    "task": task,
                                    "learner_context": learner_context,
                                    "payload": payload,
                                },
                                ensure_ascii=False,
                            ),
                        }
                    ],
                },
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": f"ivrit_sheli_{task}",
                    "strict": True,
                    "schema": schema,
                }
            },
        }
        try:
            response = self.session.post(
                OPENAI_RESPONSES_URL,
                json=request_body,
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                timeout=(10, 60),
            )
            response.raise_for_status()
            response_json = response.json()
            output_text = extract_response_text(response_json)
            result = json.loads(output_text)
        except (requests.RequestException, ValueError, TypeError, json.JSONDecodeError) as error:
            raise AIProviderError(f"OpenAI structured request failed: {error}") from error
        if not isinstance(result, dict):
            raise AIProviderError("OpenAI result was not a JSON object")
        return result

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Create embeddings for semantic recommendation support.

        Args:
            texts: Non-empty list of redacted strings.

        Returns:
            Embedding vectors in input order.

        Raises:
            AIProviderError: If the provider response is invalid.

        Example:
            HTTP behavior is covered with a fake session in tests.
        """
        if not texts:
            return []
        if not self.settings.openai_api_key:
            raise AIProviderError("OPENAI_API_KEY is not configured")
        try:
            response = self.session.post(
                OPENAI_EMBEDDINGS_URL,
                json={"model": self.settings.openai_embedding_model, "input": texts},
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                timeout=(10, 60),
            )
            response.raise_for_status()
            payload = response.json()
            rows = sorted(payload.get("data", []), key=lambda row: row.get("index", 0))
            vectors = [row["embedding"] for row in rows]
        except (requests.RequestException, KeyError, TypeError, ValueError) as error:
            raise AIProviderError(f"OpenAI embedding request failed: {error}") from error
        if len(vectors) != len(texts):
            raise AIProviderError("Embedding response count did not match input count")
        return vectors


class AIEngine:
    """Select providers, apply privacy gates, persist audit metadata, and fall back safely.

    Args:
        settings: Application configuration.
        database: Learner database for interaction metadata.
        cloud_provider: Optional provider override for tests.

    Example:
        >>> from pathlib import Path
        >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
        >>> db = Database(Path(":memory:")); db.initialize()
        >>> AIEngine(settings, db).run("correct", {"text": "שלום"})["provider"]
        'offline'
    """

    def __init__(
        self,
        settings: Settings,
        database: Database,
        cloud_provider: AIProvider | None = None,
    ) -> None:
        self.settings = settings
        self.database = database
        self.offline = OfflineCoach()
        self.cloud_provider = cloud_provider or OpenAIResponsesProvider(settings)

    def run(
        self,
        task: str,
        payload: dict[str, Any],
        learner_context: dict[str, Any] | None = None,
        *,
        cloud_requested: bool = False,
    ) -> dict[str, Any]:
        """Execute a task with explicit cloud choice and deterministic fallback.

        Args:
            task: Supported AI task.
            payload: User-selected content.
            learner_context: Bounded model features.
            cloud_requested: Whether the user explicitly chose cloud processing.

        Returns:
            Envelope containing provider, data, fallback status, and latency.

        Raises:
            ValueError: If task is unsupported.

        Example:
            >>> settings = Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"})
            >>> db = Database(__import__('pathlib').Path(":memory:")); db.initialize()
            >>> AIEngine(settings, db).run("mission", {"text": "תודה"})["data"]["target_hebrew"]
            'תודה'
        """
        if task not in SUPPORTED_TASKS:
            raise ValueError(f"Unsupported AI task: {task}")
        context = sanitize_context(learner_context or {})
        started = time.perf_counter()
        redacted_payload, redactions = redact_payload(payload)
        provider: AIProvider = self.offline
        degraded = False

        may_use_cloud = (
            cloud_requested
            and self.settings.allow_cloud_processing
            and self.settings.ai_provider == "openai"
            and bool(self.settings.openai_api_key)
        )
        if may_use_cloud:
            provider = self.cloud_provider
            try:
                data = provider.run(task, redacted_payload, context)
            except Exception as error:  # Provider errors must never break a learning session.
                LOGGER.warning("Cloud AI failed; using offline fallback: %s", error)
                provider = self.offline
                data = self.offline.run(task, payload, context)
                degraded = True
        else:
            data = self.offline.run(task, payload, context)
            degraded = cloud_requested

        latency_ms = max(0, round((time.perf_counter() - started) * 1000))
        result = AIResult(
            task=task,
            provider=provider.name,
            model=provider.model,
            data=data,
            degraded_mode=degraded,
            latency_ms=latency_ms,
            redactions=redactions if provider.name != "offline" else 0,
        )
        self._record(result, redacted_payload)
        return {
            "task": result.task,
            "provider": result.provider,
            "model": result.model,
            "data": result.data,
            "degraded_mode": result.degraded_mode,
            "latency_ms": result.latency_ms,
            "redactions": result.redactions,
            "privacy": {
                "cloud_requested": cloud_requested,
                "cloud_allowed": self.settings.allow_cloud_processing,
            },
        }

    def _record(self, result: AIResult, payload: dict[str, Any]) -> None:
        """Persist non-reversible task metadata and output for learner feedback.

        Args:
            result: Normalized AI result.
            payload: Redacted payload used for the cloud or hash only.

        Returns:
            None.

        Example:
            Called automatically by `run`.
        """
        input_hash = hashlib.sha256(
            json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
        ).hexdigest()
        with self.database.transaction() as connection:
            connection.execute(
                """
                INSERT INTO ai_interactions(
                    task, provider, model, input_hash, result_json,
                    degraded_mode, latency_ms, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    result.task,
                    result.provider,
                    result.model,
                    input_hash,
                    json.dumps(result.data, ensure_ascii=False),
                    int(result.degraded_mode),
                    result.latency_ms,
                    iso_now(),
                ),
            )


def sanitize_context(context: dict[str, Any]) -> dict[str, Any]:
    """Keep only bounded learner features suitable for an AI request.

    Args:
        context: Potentially broad context mapping.

    Returns:
        Safe allow-listed context.

    Example:
        >>> sanitize_context({"hebrew_level": "A2", "email": "x@y.com"})
        {'hebrew_level': 'A2'}
    """
    allowed = {
        "hebrew_level",
        "daily_minutes",
        "focus",
        "active_goals",
        "mistake_categories",
        "preferred_modality",
        "interface_language",
        "context_label",
        "known_words",
        "weak_words",
    }
    safe: dict[str, Any] = {}
    for key in allowed:
        if key not in context:
            continue
        value = context[key]
        if isinstance(value, str):
            safe[key] = value[:500]
        elif isinstance(value, (int, float, bool)):
            safe[key] = value
        elif isinstance(value, list):
            safe[key] = value[:30]
    return safe


def redact_payload(payload: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """Redact common identifiers from string fields before cloud processing.

    Args:
        payload: User-selected task payload.

    Returns:
        Redacted payload and total replacement count.

    Example:
        >>> redacted, count = redact_payload({"text": "mail me at a@b.com"})
        >>> count >= 1
        True
    """
    replacements = 0

    def visit(value: Any) -> Any:
        nonlocal replacements
        if isinstance(value, str):
            redacted, labels = redact_sensitive_text(value)
            replacements += len(labels)
            return redacted[:12_000]
        if isinstance(value, list):
            return [visit(item) for item in value[:100]]
        if isinstance(value, dict):
            return {str(key)[:80]: visit(item) for key, item in list(value.items())[:100]}
        if isinstance(value, (int, float, bool)) or value is None:
            return value
        return str(value)[:500]

    return visit(payload), replacements


def build_system_prompt(task: str) -> str:
    """Build the strict linguistic role prompt for one task.

    Args:
        task: Task name.

    Returns:
        Prompt text.

    Example:
        >>> "Hebrew" in build_system_prompt("correct")
        True
    """
    return (
        "You are the structured Hebrew-language engine for Ivrit Sheli. "
        "Return only data matching the supplied JSON Schema. Modern Israeli Hebrew is primary. "
        "Be accurate about niqqud, roots, binyanim, gender, number, prepositions, register, and naturalness. "
        "Provide English and Spanish learner support where requested. Never invent personal facts. "
        f"The current task is {task}. Keep explanations concise, concrete, and appropriate for a learner."
    )


def extract_response_text(response: dict[str, Any]) -> str:
    """Extract text from common Responses API response shapes.

    Args:
        response: Decoded provider response.

    Returns:
        Output text.

    Raises:
        AIProviderError: If no output text can be found.

    Example:
        >>> extract_response_text({"output_text": "{}"})
        '{}'
    """
    output_text = response.get("output_text")
    if isinstance(output_text, str):
        return output_text
    for output in response.get("output", []) or []:
        for content in output.get("content", []) or []:
            text = content.get("text")
            if isinstance(text, str):
                return text
            if isinstance(text, dict):
                value = text.get("value")
                if isinstance(value, str):
                    return value
    raise AIProviderError("Provider response did not contain output text")


_TRANSLITERATION_MAP = {
    "א": "",
    "ב": "v",
    "ג": "g",
    "ד": "d",
    "ה": "h",
    "ו": "v",
    "ז": "z",
    "ח": "kh",
    "ט": "t",
    "י": "y",
    "כ": "kh",
    "ך": "kh",
    "ל": "l",
    "מ": "m",
    "ם": "m",
    "נ": "n",
    "ן": "n",
    "ס": "s",
    "ע": "",
    "פ": "f",
    "ף": "f",
    "צ": "ts",
    "ץ": "ts",
    "ק": "k",
    "ר": "r",
    "ש": "sh",
    "ת": "t",
}


def simple_transliterate(text: str) -> str:
    """Create an explicitly approximate consonant-based transliteration.

    Args:
        text: Hebrew text.

    Returns:
        Lowercase transliteration preserving spaces and punctuation.

    Example:
        >>> simple_transliterate("שלום")
        'shlvm'
    """
    return "".join(_TRANSLITERATION_MAP.get(char, char) for char in normalize_hebrew(text)).lower()
