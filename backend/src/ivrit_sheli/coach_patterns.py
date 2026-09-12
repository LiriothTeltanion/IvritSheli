"""Reviewed Hebrew pattern catalog for the deterministic personal coach.

The catalog intentionally does not generate unrestricted Hebrew. A pattern may
only interpolate a reviewed dictionary concept and fixed, catalog-owned text.
Every rendered sentence keeps a stable provenance identifier so the API and
future editorial tools can explain where it came from.
"""

from __future__ import annotations

from dataclasses import dataclass
from string import Formatter
from typing import Literal

from ivrit_sheli.normalization import contains_hebrew

Level = Literal["A0", "A1", "A2", "B1", "B2"]
Register = Literal["neutral", "polite", "casual", "formal", "workplace"]
SlotSource = Literal["reviewed_concept", "catalog"]

CATALOG_VERSION = "2026.07-v1"
CATALOG_PROVENANCE = "Ivrit Sheli product-reviewed Hebrew pattern catalog"
SUPPORTED_LEVELS: tuple[Level, ...] = ("A0", "A1", "A2", "B1", "B2")


@dataclass(frozen=True, slots=True)
class SlotRule:
    """Declare where a pattern slot may obtain its value."""

    name: str
    source: SlotSource
    allowed_values: tuple[str, ...] = ()
    max_length: int = 120

    def accepts(self, value: str) -> bool:
        """Return whether one value is safe for this reviewed slot."""
        cleaned = value.strip()
        if not cleaned or len(cleaned) > self.max_length:
            return False
        if "{" in cleaned or "}" in cleaned or "\n" in cleaned or "\r" in cleaned:
            return False
        if self.source == "catalog":
            return cleaned in self.allowed_values
        return True


@dataclass(frozen=True, slots=True)
class ReviewedPattern:
    """One linguistically bounded, trilingual Hebrew example pattern."""

    pattern_id: str
    template_he: str
    template_en: str
    template_es: str
    levels: tuple[Level, ...]
    contexts: tuple[str, ...]
    registers: tuple[Register, ...]
    grammar: tuple[str, ...]
    parts_of_speech: tuple[str, ...]
    categories: tuple[str, ...]
    slots: tuple[SlotRule, ...]
    difficulty: float
    kind: Literal["usage", "practice_frame"]
    provenance: str = CATALOG_PROVENANCE
    version: str = CATALOG_VERSION

    def is_compatible(
        self,
        *,
        level: Level,
        part_of_speech: str,
        category: str,
    ) -> bool:
        """Return whether the reviewed pattern can safely host a concept."""
        level_ok = level in self.levels
        pos_ok = "*" in self.parts_of_speech or part_of_speech in self.parts_of_speech
        category_ok = "*" in self.categories or category in self.categories
        return level_ok and pos_ok and category_ok

    def render(
        self,
        *,
        target_he: str,
        target_en: str,
        target_es: str,
    ) -> tuple[str, str, str]:
        """Render the pattern after validating every interpolated slot."""
        values = {
            "target_he": target_he.strip(),
            "target_en": target_en.strip(),
            "target_es": target_es.strip(),
        }
        rules = {rule.name: rule for rule in self.slots}
        for template in (self.template_he, self.template_en, self.template_es):
            for _, field_name, _, _ in Formatter().parse(template):
                if field_name is None:
                    continue
                rule = rules.get(field_name)
                if rule is None:
                    raise ValueError(f"Pattern {self.pattern_id} uses undeclared slot {field_name}")
                if not rule.accepts(values[field_name]):
                    raise ValueError(f"Pattern {self.pattern_id} rejected slot {field_name}")

        rendered_he = self.template_he.format_map(values)
        if not contains_hebrew(rendered_he):
            raise ValueError(f"Pattern {self.pattern_id} must render Hebrew text")
        return (
            rendered_he,
            self.template_en.format_map(values),
            self.template_es.format_map(values),
        )


CONCEPT_SLOTS: tuple[SlotRule, ...] = (
    SlotRule("target_he", "reviewed_concept", max_length=120),
    SlotRule("target_en", "reviewed_concept", max_length=180),
    SlotRule("target_es", "reviewed_concept", max_length=180),
)

EVERY_LEVEL: tuple[Level, ...] = SUPPORTED_LEVELS
BEGINNER_LEVELS: tuple[Level, ...] = ("A0", "A1", "A2")
INDEPENDENT_LEVELS: tuple[Level, ...] = ("A1", "A2", "B1", "B2")

CONCRETE_NOUN_CATEGORIES = (
    "home",
    "food",
    "transport",
    "shopping",
    "health",
    "nature",
    "housing",
    "services",
)


REVIEWED_PATTERNS: tuple[ReviewedPattern, ...] = (
    ReviewedPattern(
        pattern_id="noun.presence.here",
        template_he="יֵשׁ כָּאן {target_he}.",
        template_en="There is {target_en} here.",
        template_es="Hay {target_es} aquí.",
        levels=BEGINNER_LEVELS,
        contexts=("daily_life", "home"),
        registers=("neutral",),
        grammar=("existential יש", "location adverb כאן"),
        parts_of_speech=("noun",),
        categories=CONCRETE_NOUN_CATEGORIES,
        slots=CONCEPT_SLOTS,
        difficulty=1.1,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="noun.find.daily",
        template_he="אֵיפֹה אֶפְשָׁר לִמְצֹא {target_he}?",
        template_en="Where can I find {target_en}?",
        template_es="¿Dónde puedo encontrar {target_es}?",
        levels=INDEPENDENT_LEVELS,
        contexts=("daily_life", "travel", "shopping"),
        registers=("neutral", "polite"),
        grammar=("question word איפה", "impersonal אפשר", "infinitive"),
        parts_of_speech=("noun",),
        categories=CONCRETE_NOUN_CATEGORIES + ("places", "bureaucracy"),
        slots=CONCEPT_SLOTS,
        difficulty=2.2,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="noun.request.polite",
        template_he="אֶפְשָׁר {target_he}, בְּבַקָּשָׁה?",
        template_en="May I have {target_en}, please?",
        template_es="¿Me da {target_es}, por favor?",
        levels=BEGINNER_LEVELS,
        contexts=("daily_life", "food", "shopping"),
        registers=("polite",),
        grammar=("impersonal אפשר", "polite marker בבקשה"),
        parts_of_speech=("noun",),
        categories=("food", "shopping", "services"),
        slots=CONCEPT_SLOTS,
        difficulty=1.5,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="verb.infinitive.possible",
        template_he="אֶפְשָׁר {target_he} כָּאן?",
        template_en="Is it possible {target_en} here?",
        template_es="¿Es posible {target_es} aquí?",
        levels=BEGINNER_LEVELS,
        contexts=("daily_life", "services"),
        registers=("neutral", "polite"),
        grammar=("impersonal אפשר", "infinitive"),
        parts_of_speech=("verb",),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=1.7,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="verb.infinitive.worthwhile",
        template_he="כְּדַאי {target_he}.",
        template_en="It is a good idea {target_en}.",
        template_es="Es buena idea {target_es}.",
        levels=INDEPENDENT_LEVELS,
        contexts=("daily_life", "study"),
        registers=("neutral",),
        grammar=("impersonal כדאי", "infinitive"),
        parts_of_speech=("verb",),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=2.1,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="verb.infinitive.important",
        template_he="חָשׁוּב {target_he} בְּכָל יוֹם.",
        template_en="It is important {target_en} every day.",
        template_es="Es importante {target_es} todos los días.",
        levels=("A2", "B1", "B2"),
        contexts=("study", "work"),
        registers=("neutral", "workplace"),
        grammar=("impersonal adjective חשוב", "infinitive", "time phrase"),
        parts_of_speech=("verb",),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=2.8,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="phrase.dialogue.daily",
        template_he='בַּשִּׂיחָה אָמְרוּ: "{target_he}".',
        template_en='In the conversation they said: "{target_en}".',
        template_es="En la conversación dijeron: «{target_es}».",
        levels=EVERY_LEVEL,
        contexts=("daily_life", "social"),
        registers=("neutral", "casual"),
        grammar=("reported speech", "gender-neutral plural verb"),
        parts_of_speech=("interjection", "particle", "phrase", "expression"),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=1.9,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="phrase.workplace.meeting",
        template_he='בַּפְּגִישָׁה אָמְרוּ: "{target_he}".',
        template_en='In the meeting they said: "{target_en}".',
        template_es="En la reunión dijeron: «{target_es}».",
        levels=("A2", "B1", "B2"),
        contexts=("work",),
        registers=("workplace", "neutral"),
        grammar=("reported speech", "gender-neutral plural verb"),
        parts_of_speech=("interjection", "particle", "phrase", "expression"),
        categories=("work", "communication", "register", "bureaucracy"),
        slots=CONCEPT_SLOTS,
        difficulty=2.7,
        kind="usage",
    ),
    ReviewedPattern(
        pattern_id="concept.today.word",
        template_he='הַמִּלָּה שֶׁל הַיּוֹם הִיא "{target_he}".',
        template_en="Today’s Hebrew word is “{target_en}”.",
        template_es="La palabra hebrea de hoy es «{target_es}».",
        levels=EVERY_LEVEL,
        contexts=("study",),
        registers=("neutral",),
        grammar=("nominal sentence", "quoted concept"),
        parts_of_speech=("*",),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=0.7,
        kind="practice_frame",
    ),
    ReviewedPattern(
        pattern_id="concept.listen.for",
        template_he='בַּהַקְלָטָה נַקְשִׁיב לַמִּלָּה "{target_he}".',
        template_en="In the recording, we will listen for “{target_en}”.",
        template_es="En la grabación, escucharemos «{target_es}».",
        levels=EVERY_LEVEL,
        contexts=("study", "listening"),
        registers=("neutral",),
        grammar=("first-person plural future", "quoted concept"),
        parts_of_speech=("*",),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=1.6,
        kind="practice_frame",
    ),
    ReviewedPattern(
        pattern_id="concept.recall.later",
        template_he='בְּסוֹף הַשִּׁעוּר נִזְכֹּר אֶת "{target_he}".',
        template_en="At the end of the lesson, we will recall “{target_en}”.",
        template_es="Al final de la lección, recordaremos «{target_es}».",
        levels=EVERY_LEVEL,
        contexts=("study",),
        registers=("neutral",),
        grammar=("first-person plural future", "direct object marker", "quoted concept"),
        parts_of_speech=("*",),
        categories=("*",),
        slots=CONCEPT_SLOTS,
        difficulty=2.5,
        kind="practice_frame",
    ),
)


def pattern_by_id(pattern_id: str) -> ReviewedPattern:
    """Return one stable reviewed pattern."""
    for pattern in REVIEWED_PATTERNS:
        if pattern.pattern_id == pattern_id:
            return pattern
    raise KeyError(pattern_id)


def validate_pattern_catalog(
    patterns: tuple[ReviewedPattern, ...] = REVIEWED_PATTERNS,
) -> None:
    """Validate IDs, slots, translations, provenance, and renderability."""
    pattern_ids: set[str] = set()
    for pattern in patterns:
        if pattern.pattern_id in pattern_ids:
            raise ValueError(f"Duplicate reviewed pattern ID: {pattern.pattern_id}")
        pattern_ids.add(pattern.pattern_id)
        if not pattern.provenance or not pattern.version:
            raise ValueError(f"Pattern {pattern.pattern_id} requires provenance")
        if not 0 <= pattern.difficulty <= 5:
            raise ValueError(f"Pattern {pattern.pattern_id} has invalid difficulty")
        if not contains_hebrew(pattern.template_he):
            raise ValueError(f"Pattern {pattern.pattern_id} requires Hebrew")
        if not pattern.template_en.strip() or not pattern.template_es.strip():
            raise ValueError(f"Pattern {pattern.pattern_id} requires EN/ES templates")
        declared = {slot.name for slot in pattern.slots}
        for template in (pattern.template_he, pattern.template_en, pattern.template_es):
            used = {
                field_name
                for _, field_name, _, _ in Formatter().parse(template)
                if field_name is not None
            }
            if not used.issubset(declared):
                raise ValueError(
                    f"Pattern {pattern.pattern_id} has undeclared slots {sorted(used - declared)}"
                )


validate_pattern_catalog()
