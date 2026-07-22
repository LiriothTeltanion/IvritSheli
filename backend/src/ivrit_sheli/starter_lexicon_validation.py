"""Validation rules for the reviewed built-in Hebrew starter lexicon."""

from __future__ import annotations

from collections import Counter
from collections.abc import Sequence
from typing import Any

from ivrit_sheli.normalization import normalize_hebrew

EXPECTED_STARTER_CATEGORY_COUNTS: dict[str, int] = {
    "greetings": 12,
    "family": 12,
    "home": 12,
    "food": 12,
    "transport": 12,
    "shopping": 12,
    "health": 12,
    "places": 12,
}
EXPECTED_STARTER_ENTRY_COUNT = sum(EXPECTED_STARTER_CATEGORY_COUNTS.values())
HEBREW_START = "\u0590"
HEBREW_END = "\u05ff"


def _contains_hebrew(value: str) -> bool:
    return any(HEBREW_START <= character <= HEBREW_END for character in value)


def _require_text(entry: dict[str, Any], field: str, index: int) -> str:
    value = entry.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Starter entry {index} requires non-empty {field}")
    return value.strip()


def validate_starter_vocabulary(entries: Sequence[dict[str, Any]]) -> None:
    """Validate count, completeness, uniqueness, and editorial attribution.

    Args:
        entries: Flat exact-sense records consumed by ``DictionaryStore.seed_demo``.

    Raises:
        ValueError: If the reviewed starter contract is incomplete or ambiguous.
    """
    if len(entries) != EXPECTED_STARTER_ENTRY_COUNT:
        raise ValueError(
            f"Starter vocabulary must contain exactly {EXPECTED_STARTER_ENTRY_COUNT} entries"
        )

    category_counts = Counter(_require_text(entry, "category", index) for index, entry in enumerate(entries))
    if category_counts != Counter(EXPECTED_STARTER_CATEGORY_COUNTS):
        raise ValueError(
            "Starter vocabulary category distribution must be "
            f"{EXPECTED_STARTER_CATEGORY_COUNTS}, got {dict(category_counts)}"
        )

    visual_keys: set[str] = set()
    exact_senses: set[tuple[str, str]] = set()
    source_keys: set[str] = set()
    for index, entry in enumerate(entries):
        word = _require_text(entry, "word", index)
        pos = _require_text(entry, "pos", index)
        romanization = _require_text(entry, "romanization", index)
        level = _require_text(entry, "level", index)
        visual_key = _require_text(entry, "visual_key", index)
        provenance = _require_text(entry, "provenance", index)

        if not _contains_hebrew(word):
            raise ValueError(f"Starter entry {index} word must contain Hebrew text")
        if level not in {"A0", "A1"}:
            raise ValueError(f"Starter entry {index} has unsupported level {level}")
        for field in (
            "gloss_en",
            "gloss_es",
            "visual_emoji",
            "visual_alt_en",
            "visual_alt_es",
            "visual_alt_he",
        ):
            _require_text(entry, field, index)
        if not _contains_hebrew(str(entry["visual_alt_he"])):
            raise ValueError(f"Starter entry {index} requires Hebrew visual alternative text")
        if "review" not in provenance.lower():
            raise ValueError(f"Starter entry {index} requires explicit reviewed provenance")

        forms = entry.get("forms")
        if not isinstance(forms, list) or len(forms) != 1 or not isinstance(forms[0], dict):
            raise ValueError(f"Starter entry {index} requires one reviewed niqqud form")
        niqqud = forms[0].get("form")
        if not isinstance(niqqud, str) or not _contains_hebrew(niqqud):
            raise ValueError(f"Starter entry {index} has invalid niqqud form")
        if "with-niqqud" not in forms[0].get("tags", []):
            raise ValueError(f"Starter entry {index} niqqud form must be tagged")

        examples = entry.get("examples")
        if not isinstance(examples, list) or len(examples) != 1:
            raise ValueError(f"Starter entry {index} requires one practical example")
        example = examples[0]
        if not isinstance(example, dict):
            raise ValueError(f"Starter entry {index} example must be an object")
        for field in ("hebrew", "translation_en", "translation_es", "romanization"):
            value = example.get(field)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"Starter entry {index} example requires {field}")
        if not _contains_hebrew(str(example["hebrew"])):
            raise ValueError(f"Starter entry {index} example must contain Hebrew text")

        normalized_word = normalize_hebrew(word)
        sense_key = (normalized_word, pos)
        if sense_key in exact_senses:
            raise ValueError(f"Duplicate starter exact sense: {word!r} ({pos})")
        exact_senses.add(sense_key)
        if visual_key in visual_keys:
            raise ValueError(f"Duplicate starter visual key: {visual_key}")
        visual_keys.add(visual_key)
        source_key = str(entry.get("source_key") or f"builtin:{normalized_word}:{pos}")
        if source_key in source_keys:
            raise ValueError(f"Duplicate starter source key: {source_key}")
        source_keys.add(source_key)

        # Root and binyan may be reviewed facts or unknown, never blank placeholders.
        for field in ("root", "binyan"):
            value = entry.get(field)
            if value is not None and (not isinstance(value, str) or not value.strip()):
                raise ValueError(f"Starter entry {index} {field} must be text or None")

        # Keeping this binding explicit makes failures easier to diagnose in type checks.
        if not romanization:
            raise ValueError(f"Starter entry {index} requires romanization")
