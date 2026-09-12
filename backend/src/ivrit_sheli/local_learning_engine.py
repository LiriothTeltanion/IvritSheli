"""Deterministic curriculum and daily-practice planning.

The engine owns no persistence and performs no network calls. Repositories provide reviewed
learner content and stored progress; these pure rules return explainable plans that behave the
same in local SQLite mode and tenant-scoped PostgreSQL snapshot mode.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

from ivrit_sheli.hebrew_alphabet import (
    BASE_ALPHABET,
    FINAL_FORMS,
    HEBREW_ALPHABET,
    public_alphabet_units,
)

PRACTICE_CONTRACT_VERSION = "2.8"
CURRICULUM_CONTRACT_VERSION = "2.8"

PracticeOutcome = Literal["completed", "failed", "unsupported"]


class PracticeConflictError(RuntimeError):
    """Raised when a practice step is stale, out of order, or replayed inconsistently."""


@dataclass(frozen=True, slots=True)
class CurriculumLesson:
    """One stable curriculum lesson exposed to clients."""

    key: str
    band: str
    coverage: Literal["structured", "laboratory"]
    concept_target: int
    title_en: str
    title_es: str
    title_he: str


CURRICULUM_LESSONS: tuple[CurriculumLesson, ...] = (
    CurriculumLesson("a0.sounds", "A0", "structured", 12, "Letters and sounds", "Letras y sonidos", "אותיות וצלילים"),
    CurriculumLesson("a0.greetings", "A0", "structured", 12, "Greetings", "Saludos", "ברכות"),
    CurriculumLesson("a0.survival", "A0", "structured", 12, "Survival Hebrew", "Hebreo de supervivencia", "עברית להישרדות"),
    CurriculumLesson("a0.first_sentences", "A0", "structured", 12, "First sentences", "Primeras frases", "משפטים ראשונים"),
    CurriculumLesson("a1.daily_life", "A1", "structured", 18, "Daily life", "Vida diaria", "חיי יום־יום"),
    CurriculumLesson("a1.questions", "A1", "structured", 18, "Useful questions", "Preguntas útiles", "שאלות שימושיות"),
    CurriculumLesson("a1.people_places", "A1", "structured", 18, "People and places", "Personas y lugares", "אנשים ומקומות"),
    CurriculumLesson("a1.agreement", "A1", "structured", 18, "Gender and agreement", "Género y concordancia", "מין והתאמה"),
    CurriculumLesson("a2.common_verbs", "A2", "structured", 20, "Common verbs", "Verbos frecuentes", "פעלים נפוצים"),
    CurriculumLesson("a2.time_tense", "A2", "structured", 20, "Time and tense", "Tiempo y tiempos verbales", "זמן וזמנים"),
    CurriculumLesson("a2.independence", "A2", "structured", 20, "Independent living", "Vida independiente", "חיים עצמאיים"),
    CurriculumLesson("a2.conversation", "A2", "structured", 20, "Connected conversation", "Conversación conectada", "שיחה רציפה"),
    CurriculumLesson("b1.work_laboratory", "B1", "laboratory", 12, "Workplace laboratory", "Laboratorio de trabajo", "מעבדת עבודה"),
    CurriculumLesson("b1.services_laboratory", "B1", "laboratory", 12, "Services laboratory", "Laboratorio de servicios", "מעבדת שירותים"),
    CurriculumLesson("b2.register_laboratory", "B2", "laboratory", 8, "Register laboratory", "Laboratorio de registro", "מעבדת משלב"),
    CurriculumLesson("b2.personal_laboratory", "B2", "laboratory", 8, "Personal Hebrew laboratory", "Laboratorio de hebreo personal", "מעבדת עברית אישית"),
)

HEBREW_READING_TRACK: tuple[dict[str, str], ...] = tuple(
    {"letter": letter, "name": name, "sound": sound}
    for letter, name, sound in (
        ("א", "alef", "silent / glottal carrier"),
        ("ב", "bet", "b / v"),
        ("ג", "gimel", "g"),
        ("ד", "dalet", "d"),
        ("ה", "he", "h"),
        ("ו", "vav", "v / o / u"),
        ("ז", "zayin", "z"),
        ("ח", "het", "kh"),
        ("ט", "tet", "t"),
        ("י", "yod", "y / i"),
        ("כ/ך", "kaf", "k / kh"),
        ("ל", "lamed", "l"),
        ("מ/ם", "mem", "m"),
        ("נ/ן", "nun", "n"),
        ("ס", "samekh", "s"),
        ("ע", "ayin", "pharyngeal / silent"),
        ("פ/ף", "pe", "p / f"),
        ("צ/ץ", "tsadi", "ts"),
        ("ק", "qof", "k"),
        ("ר", "resh", "r"),
        ("ש", "shin", "sh / s"),
        ("ת", "tav", "t"),
    )
)

STARTER_CONCEPTS: tuple[dict[str, Any], ...] = (
    {
        "concept_key": "starter:shalom",
        "lesson_key": "a0.greetings",
        "hebrew_text": "שלום",
        "hebrew_with_niqqud": "שָׁלוֹם",
        "transliteration": "shalom",
        "translation_en": "hello / peace",
        "translation_es": "hola / paz",
        "visual_id": "greetings.hello",
        "visual": {
            "key": "greetings.hello",
            "emoji": "👋",
            "alt": {
                "en": "Two neighbors facing each other and waving hello",
                "es": "Dos vecinos frente a frente saludándose con la mano",
                "he": "שני שכנים עומדים זה מול זה ומנופפים לשלום",
            },
        },
        "source": "reviewed_starter",
    },
    {
        "concept_key": "starter:toda",
        "lesson_key": "a0.greetings",
        "hebrew_text": "תודה",
        "hebrew_with_niqqud": "תּוֹדָה",
        "transliteration": "toda",
        "translation_en": "thank you",
        "translation_es": "gracias",
        "visual_id": "greetings.thanks",
        "visual": {
            "key": "greetings.thanks",
            "emoji": "🙏",
            "alt": {
                "en": "Two neighbors sharing a small gift with gratitude",
                "es": "Dos vecinos compartiendo un pequeño regalo con gratitud",
                "he": "שני שכנים חולקים מתנה קטנה בהכרת תודה",
            },
        },
        "source": "reviewed_starter",
    },
    {
        "concept_key": "starter:ken",
        "lesson_key": "a0.survival",
        "hebrew_text": "כן",
        "hebrew_with_niqqud": "כֵּן",
        "transliteration": "ken",
        "translation_en": "yes",
        "translation_es": "sí",
        "visual_id": "greetings.yes",
        "visual": {
            "key": "greetings.yes",
            "emoji": "✅",
            "alt": {
                "en": "A clear green check meaning yes",
                "es": "Una marca verde clara que significa sí",
                "he": "סימן וי ירוק שמשמעו כן",
            },
        },
        "source": "reviewed_starter",
    },
)

_BAND_ORDER = {"A0": 0, "A1": 1, "A2": 2, "B1": 3, "B2": 4}
_MEANINGFUL_STEP_KINDS = frozenset({"retrieval", "listening", "speaking"})


class LocalLearningEngine:
    """Build explainable curriculum and practice responses from trusted inputs."""

    def curriculum_path(
        self,
        profile: Mapping[str, Any],
        progress: Mapping[str, Mapping[str, Any]],
        *,
        available_concepts: int,
        alphabet_summary: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Return the stable A0-A2 path and honestly labelled B1/B2 laboratory."""
        raw_band = str(profile.get("cefr_band", "A0")).upper()
        band = raw_band if raw_band in _BAND_ORDER else "A0"
        mode = str(profile.get("learner_mode", "guided"))
        alphabet = dict(alphabet_summary or {})
        lessons: list[dict[str, Any]] = []
        for lesson in CURRICULUM_LESSONS:
            lesson_progress = dict(progress.get(lesson.key, {}))
            lesson_concept_target = lesson.concept_target
            if lesson.key == "a0.sounds" and alphabet:
                practiced = int(alphabet.get("practiced_units", 0))
                mastered = int(alphabet.get("mastered_units", 0))
                total_forms = max(1, int(alphabet.get("total_forms", 27)))
                lesson_progress = {
                    "status": (
                        "not_started"
                        if practiced == 0 and mastered == 0
                        else "completed"
                        if mastered >= total_forms
                        else "in_progress"
                    ),
                    "meaningful_attempts": practiced,
                    "successful_attempts": mastered,
                    "units_practiced": practiced,
                    "units_mastered": mastered,
                    "unit_target": total_forms,
                    "last_practiced_at": alphabet.get("last_practiced_at"),
                }
            unlocked = _BAND_ORDER[lesson.band] <= _BAND_ORDER[band]
            if lesson.coverage == "laboratory":
                unlocked = unlocked and mode in {"explorer", "experienced"}
            lessons.append(
                {
                    "key": lesson.key,
                    "band": lesson.band,
                    "coverage": lesson.coverage,
                    "concept_target": lesson_concept_target,
                    "title": {
                        "en": lesson.title_en,
                        "es": lesson.title_es,
                        "he": lesson.title_he,
                    },
                    "unlocked": unlocked,
                    "progress": {
                        "status": lesson_progress.get("status", "not_started"),
                        "meaningful_attempts": int(
                            lesson_progress.get("meaningful_attempts", 0)
                        ),
                        "successful_attempts": int(
                            lesson_progress.get("successful_attempts", 0)
                        ),
                        "last_practiced_at": lesson_progress.get("last_practiced_at"),
                        **(
                            {
                                "units_practiced": int(
                                    lesson_progress.get("units_practiced", 0)
                                ),
                                "units_mastered": int(
                                    lesson_progress.get("units_mastered", 0)
                                ),
                                "unit_target": int(
                                    lesson_progress.get("unit_target", 27)
                                ),
                            }
                            if lesson.key == "a0.sounds" and alphabet
                            else {}
                        ),
                    },
                }
            )
        return {
            "contract_version": CURRICULUM_CONTRACT_VERSION,
            "profile": {"cefr_band": band, "learner_mode": mode},
            "coverage": {
                "structured": ["A0", "A1", "A2"],
                "laboratory": ["B1", "B2"],
                "complete_course_claim": False,
                "concept_target": sum(lesson.concept_target for lesson in CURRICULUM_LESSONS),
                "available_personal_concepts": max(0, available_concepts),
            },
            "lessons": lessons,
            "reading_track": {
                "approach": "sound_first",
                # 2026-08-25: the third hand-written copy of the same three
                # numbers, in a file that already imports the alphabet it was
                # counting. Derived now, like `alphabet_facts()`.
                "base_letters": len(BASE_ALPHABET),
                "final_forms": len(FINAL_FORMS),
                "total_forms": len(HEBREW_ALPHABET),
                "entries": list(HEBREW_READING_TRACK),
                "units": public_alphabet_units(),
                "progress": alphabet,
            },
        }

    def build_daily_plan(
        self,
        profile: Mapping[str, Any],
        candidates: Sequence[Mapping[str, Any]],
    ) -> dict[str, Any]:
        """Build one deterministic session, filling empty accounts with reviewed starters."""
        mode = str(profile.get("learner_mode", "guided"))
        band = str(profile.get("cefr_band", "A0")).upper()
        retrieval_target = {
            "guided": 3,
            "explorer": 4,
            "experienced": 5,
        }.get(mode, 3)
        selected = self._select_concepts(candidates, target_count=retrieval_target)
        steps: list[dict[str, Any]] = [
            self._step(
                "encounter",
                0,
                selected[0],
                "visual_meaning",
                "Meet one useful word in a meaningful visual context.",
            )
        ]
        retrieval_types = (
            "hebrew_to_meaning",
            "meaning_to_hebrew_word_bank",
            "cloze_order",
        )
        for index, concept in enumerate(selected):
            steps.append(
                self._step(
                    "retrieval",
                    index,
                    concept,
                    retrieval_types[index % len(retrieval_types)],
                    "Retrieve reviewed Hebrew before revealing the answer.",
                )
            )
        steps.extend(
            (
                self._step(
                    "listening",
                    0,
                    selected[0],
                    "audio_choice",
                    "Connect the reviewed written form with device audio.",
                ),
                self._step(
                    "speaking",
                    0,
                    selected[1],
                    "spoken_production",
                    "Produce the word aloud, with a manual fallback when recording is unavailable.",
                ),
                {
                    "key": "reflection:session",
                    "kind": "reflection",
                    "exercise_type": "confidence_reflection",
                    "required": True,
                    "meaningful": False,
                    "reason": "Record confidence without treating it as proof of mastery.",
                },
                {
                    "key": "summary:session",
                    "kind": "summary",
                    "exercise_type": "session_summary",
                    "required": True,
                    "meaningful": False,
                    "reason": "Review saved evidence and leave with one clear next action.",
                },
            )
        )
        return {
            "contract_version": PRACTICE_CONTRACT_VERSION,
            "profile": {"cefr_band": band, "learner_mode": mode},
            "source": (
                "personal_learning_items"
                if any(concept.get("source") == "personal" for concept in selected)
                else "reviewed_starter"
            ),
            "reason": self._plan_reason(selected),
            "steps": steps,
        }

    @staticmethod
    def progress_status(meaningful_attempts: int, successful_attempts: int) -> str:
        """Return conservative lesson progress without converting XP into mastery."""
        if meaningful_attempts <= 0:
            return "not_started"
        if meaningful_attempts >= 8 and successful_attempts / meaningful_attempts >= 0.7:
            return "completed"
        return "in_progress"

    @staticmethod
    def is_meaningful_step(step: Mapping[str, Any]) -> bool:
        """Return whether a step is valid evidence for daily progress."""
        return str(step.get("kind")) in _MEANINGFUL_STEP_KINDS

    @staticmethod
    def session_summary(events: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
        """Summarize persisted step outcomes without inflating unsupported attempts."""
        counts = {"completed": 0, "failed": 0, "unsupported": 0}
        meaningful = 0
        for event in events:
            outcome = str(event.get("outcome"))
            if outcome in counts:
                counts[outcome] += 1
            if bool(event.get("meaningful")) and outcome != "unsupported":
                meaningful += 1
        return {
            "saved": True,
            "outcomes": counts,
            "meaningful_actions": meaningful,
            "next_action": (
                "Return tomorrow for a new retrieval plan."
                if meaningful
                else "Reconnect or use the manual fallback to record one meaningful action."
            ),
        }

    @staticmethod
    def _step(
        kind: str,
        index: int,
        concept: Mapping[str, Any],
        exercise_type: str,
        reason: str,
    ) -> dict[str, Any]:
        public_concept = {
            key: concept.get(key)
            for key in (
                "concept_key",
                "lesson_key",
                "item_id",
                "hebrew_text",
                "hebrew_with_niqqud",
                "transliteration",
                "translation_en",
                "translation_es",
                "visual_id",
                "visual",
                "source",
            )
            if concept.get(key) is not None
        }
        return {
            "key": f"{kind}:{index}",
            "kind": kind,
            "exercise_type": exercise_type,
            "required": True,
            "meaningful": kind in _MEANINGFUL_STEP_KINDS,
            "reason": reason,
            "concept": public_concept,
        }

    @staticmethod
    def _select_concepts(
        candidates: Sequence[Mapping[str, Any]],
        *,
        target_count: int = 3,
    ) -> list[dict[str, Any]]:
        target_count = max(3, min(5, target_count))
        selected: list[dict[str, Any]] = []
        seen: set[str] = set()
        ranked = sorted(
            candidates,
            key=lambda candidate: (
                -LocalLearningEngine._candidate_score(candidate),
                int(candidate.get("item_id", candidate.get("id", 0))),
            ),
        )
        for candidate in ranked:
            hebrew = str(candidate.get("hebrew_text", "")).strip()
            if not hebrew or hebrew in seen:
                continue
            seen.add(hebrew)
            item = dict(candidate)
            item.setdefault("concept_key", f"item:{item.get('item_id', item.get('id', 0))}")
            item.setdefault("lesson_key", "a0.first_sentences")
            item.setdefault("source", "personal")
            item["selection_score"] = round(
                LocalLearningEngine._candidate_score(candidate),
                4,
            )
            selected.append(item)
            if len(selected) == target_count:
                break
        for starter in STARTER_CONCEPTS:
            if len(selected) >= target_count:
                break
            hebrew = str(starter["hebrew_text"])
            if hebrew in seen:
                continue
            selected.append(dict(starter))
            seen.add(hebrew)
            if len(selected) >= target_count:
                break
        return selected

    @staticmethod
    def _candidate_score(candidate: Mapping[str, Any]) -> float:
        """Rank reviewed content using only explainable stored learner signals."""

        def bounded(value: Any, default: float = 0.0) -> float:
            try:
                return max(0.0, min(1.0, float(value)))
            except (TypeError, ValueError):
                return default

        due = bounded(candidate.get("due_now"))
        weakness = 1.0 - bounded(candidate.get("recent_accuracy"), 0.5)
        priority = bounded(candidate.get("priority"), 0.5)
        try:
            confidence = float(candidate.get("average_confidence") or 3.0)
        except (TypeError, ValueError):
            confidence = 3.0
        low_confidence = 1.0 - bounded(confidence / 5.0, 3.0 / 5.0)
        try:
            response_ms = float(candidate.get("average_response_ms") or 0)
        except (TypeError, ValueError):
            response_ms = 0.0
        latency = bounded(response_ms / 10_000)
        goal_alignment = bounded(candidate.get("goal_alignment"))
        freshness = bounded(candidate.get("fresh"))
        return (
            0.30 * due
            + 0.20 * weakness
            + 0.15 * priority
            + 0.10 * low_confidence
            + 0.10 * latency
            + 0.10 * goal_alignment
            + 0.05 * freshness
        )

    @staticmethod
    def _plan_reason(selected: Sequence[Mapping[str, Any]]) -> str:
        personal = sum(concept.get("source") == "personal" for concept in selected)
        if personal:
            return (
                f"Selected {personal} personal item(s) using due date, priority, and recent "
                "learning evidence; reviewed starter words fill any remaining places."
            )
        return "No personal review items are ready, so today's plan uses three reviewed A0 words."
