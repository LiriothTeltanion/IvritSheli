"""Export the reviewed starter lexicon as a public, read-only PWA fallback.

The generated JSON contains no user data. Its shape mirrors the dictionary API
closely enough for cached lookup and browsing when the backend is unreachable.
"""

from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BACKEND_SOURCE = REPOSITORY_ROOT / "backend" / "src"
OFFLINE_CONTRACT_VERSION = "2.8"
FORBIDDEN_PUBLIC_FIELDS = frozenset(
    {
        "csrf",
        "email",
        "learning_due_state",
        "learning_item_id",
        "learning_status",
        "profile_id",
        "session_id",
        "token",
        "user_id",
    }
)
DEFAULT_OUTPUT = (
    REPOSITORY_ROOT
    / "frontend"
    / "public"
    / "content"
    / "starter-dictionary-v2.8.json"
)


def _normalize_hebrew(value: str) -> str:
    """Return a stable unpointed form used by the public search fallback."""

    return "".join(
        character
        for character in unicodedata.normalize("NFD", value)
        if unicodedata.category(character) != "Mn"
    ).strip()


def _entry_card(entry: dict[str, Any], entry_id: int) -> dict[str, Any]:
    visual_key = str(entry.get("visual_key") or f"word.{entry_id}")
    visual_emoji = str(entry.get("visual_emoji") or "🔤")
    visual_alt = {
        "en": str(entry.get("visual_alt_en") or "Hebrew learning illustration"),
        "es": str(entry.get("visual_alt_es") or "Ilustración para aprender hebreo"),
        "he": str(entry.get("visual_alt_he") or "איור ללימוד עברית"),
    }
    word = str(entry["word"])
    forms = [
        {
            "id": entry_id * 100 + form_index,
            "form": str(form.get("form") or ""),
            "romanization": form.get("romanization"),
            "tags": list(form.get("tags") or []),
        }
        for form_index, form in enumerate(entry.get("forms") or [], start=1)
    ]
    examples = [
        {
            "id": entry_id * 100 + example_index,
            "hebrew_text": str(example.get("hebrew") or example.get("hebrew_text") or ""),
            "translation_en": example.get("en") or example.get("translation_en"),
            "translation_es": example.get("es") or example.get("translation_es"),
            "romanization": example.get("romanization"),
        }
        for example_index, example in enumerate(entry.get("examples") or [], start=1)
    ]
    visual = {"key": visual_key, "emoji": visual_emoji, "alt": visual_alt}
    return {
        "id": entry_id,
        "word": _normalize_hebrew(word),
        "normalized_word": _normalize_hebrew(word),
        "display_niqqud": word,
        "pos": entry.get("pos"),
        "romanization": entry.get("romanization"),
        "root": entry.get("root"),
        "binyan": entry.get("binyan"),
        "gender": entry.get("gender"),
        "level": entry.get("level"),
        "category": entry.get("category"),
        "visual": visual,
        "etymology": None,
        "source_name": "Ivrit Sheli reviewed starter vocabulary",
        "source_url": "https://github.com/LiriothTeltanion/IvritSheli",
        "license_name": "MIT application sample data",
        "senses": [
            {
                "id": entry_id,
                "gloss_en": entry.get("gloss_en"),
                "gloss_es": entry.get("gloss_es"),
                "tags": [],
                "topics": [],
                "level": entry.get("level"),
                "category": entry.get("category"),
                "visual_key": visual_key,
                "visual_emoji": visual_emoji,
                "visual_alt_en": visual_alt["en"],
                "visual_alt_es": visual_alt["es"],
                "visual_alt_he": visual_alt["he"],
                "provenance": entry.get("provenance"),
                "reading_hints": list(entry.get("reading_hints") or []),
                "visual": visual,
            }
        ],
        "forms": forms,
        "examples": examples,
        "sounds": [],
    }


def _assert_public_content(value: object, path: str = "payload") -> None:
    """Reject fields that could turn the public fallback into a user snapshot."""

    if isinstance(value, dict):
        forbidden = FORBIDDEN_PUBLIC_FIELDS.intersection(value)
        if forbidden:
            names = ", ".join(sorted(forbidden))
            raise ValueError(f"Private fields are forbidden at {path}: {names}")
        for key, child in value.items():
            _assert_public_content(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _assert_public_content(child, f"{path}[{index}]")


def export_starter_content(output: Path) -> int:
    """Write deterministic UTF-8 JSON and return the exported entry count."""

    sys.path.insert(0, str(BACKEND_SOURCE))
    from ivrit_sheli.dictionary import DEMO_ENTRIES  # noqa: PLC0415
    from ivrit_sheli.starter_lexicon_validation import (  # noqa: PLC0415
        EXPECTED_STARTER_ENTRY_COUNT,
        validate_starter_vocabulary,
    )

    validate_starter_vocabulary(DEMO_ENTRIES)
    entries = [
        _entry_card(entry, entry_id)
        for entry_id, entry in enumerate(DEMO_ENTRIES, start=1)
    ]
    if len(entries) != EXPECTED_STARTER_ENTRY_COUNT:
        raise ValueError(
            "Offline starter export must contain exactly "
            f"{EXPECTED_STARTER_ENTRY_COUNT} reviewed entries"
        )
    payload = {
        "contract_version": OFFLINE_CONTRACT_VERSION,
        "content": "reviewed_starter_dictionary",
        "entry_count": len(entries),
        "entries": entries,
    }
    _assert_public_content(payload)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return len(entries)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export the reviewed starter dictionary for offline PWA lookup."
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    count = export_starter_content(args.output.resolve())
    print(f"Exported {count} reviewed entries to {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
