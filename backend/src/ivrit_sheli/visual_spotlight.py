"""Build a small, exact-scene vocabulary spotlight for the Today dashboard."""

from __future__ import annotations

from hashlib import sha256
from typing import Any

from ivrit_sheli.dictionary import DictionaryStore

SPOTLIGHT_ROTATIONS: tuple[tuple[str, ...], ...] = (
    ("שלום", "תודה", "בבקשה", "כן", "לא", "סליחה"),
    ("בוקר טוב", "להתראות", "מה נשמע", "נעים מאוד", "ערב טוב", "לילה טוב"),
    ("מים", "אוכל", "רעב", "לחם", "חלב", "קפה"),
    ("תה", "תפוח", "גבינה", "ביצה", "מסעדה", "טעים"),
    ("בית", "חדר", "מפתח", "שירותים", "מטבח", "מיטה"),
    ("שולחן", "כיסא", "דלת", "חלון", "אמא", "אבא"),
    ("אח", "אחות", "סבתא", "סבא", "משפחה", "הורים"),
    ("בן", "בת", "ילד", "ילדה", "ישראל", "ירושלים"),
    ("תל אביב", "חיפה", "באר שבע", "עיר", "ים", "חוף"),
    ("פארק", "בית ספר", "שקל", "כמה זה עולה", "היום", "מחר"),
    ("עכשיו", "שעה", "דקה", "יום", "שבוע", "חודש"),
    ("שנה", "אתמול", "בוקר", "ערב", "חם", "קר"),
)
EXACT_VISUAL_WORDS = frozenset(
    word for rotation in SPOTLIGHT_ROTATIONS for word in rotation
)


def _spotlight_card(entry: dict[str, Any]) -> dict[str, Any] | None:
    """Reduce a reviewed dictionary entry to the Today dashboard contract."""
    visual = entry.get("visual")
    senses = entry.get("senses")
    if not isinstance(visual, dict) or not isinstance(senses, list):
        return None
    first_sense = next(
        (
            sense
            for sense in senses
            if isinstance(sense, dict)
            and sense.get("visual") is not None
            and sense.get("gloss_en")
            and sense.get("gloss_es")
        ),
        None,
    )
    if first_sense is None:
        return None
    alt = visual.get("alt")
    translation_he = (
        str(alt.get("he", "")).strip()
        if isinstance(alt, dict)
        else ""
    )
    return {
        "entry_id": entry["id"],
        "word": entry["word"],
        "display_niqqud": entry["display_niqqud"],
        "romanization": entry.get("romanization") or "",
        "translation_en": first_sense["gloss_en"],
        "translation_es": first_sense["gloss_es"],
        "translation_he": translation_he or entry["display_niqqud"],
        "visual": visual,
    }


def build_visual_spotlight(
    dictionary: DictionaryStore,
    *,
    seed: str,
    preferred_words: tuple[str, ...] = (),
    limit: int = 6,
) -> list[dict[str, Any]]:
    """Return unique reviewed words whose exact semantic scenes are implemented.

    Personalized recommendation labels are considered first. The deterministic
    rotations are exact-scene backfill only, keeping the result stable during a
    visit without promoting generic visual fallbacks.
    """
    if not 1 <= limit <= 6:
        raise ValueError("limit must be between 1 and 6")
    digest = sha256(seed.encode("utf-8")).digest()
    start = int.from_bytes(digest[:2], "big") % len(SPOTLIGHT_ROTATIONS)
    ordered_rotations = (
        SPOTLIGHT_ROTATIONS[start:] + SPOTLIGHT_ROTATIONS[:start]
    )

    cards: list[dict[str, Any]] = []
    seen_visuals: set[str] = set()
    for word in preferred_words:
        entries = dictionary.lookup(word, limit=1)
        if not entries:
            continue
        card = _spotlight_card(entries[0])
        if card is None or card["word"] not in EXACT_VISUAL_WORDS:
            continue
        visual_key = str(card["visual"]["key"])
        if visual_key in seen_visuals:
            continue
        cards.append(card)
        seen_visuals.add(visual_key)
        if len(cards) == limit:
            return cards

    for rotation in ordered_rotations:
        for word in rotation:
            entries = dictionary.lookup(word, limit=1)
            if not entries:
                continue
            card = _spotlight_card(entries[0])
            if card is None:
                continue
            visual_key = str(card["visual"]["key"])
            if visual_key in seen_visuals:
                continue
            cards.append(card)
            seen_visuals.add(visual_key)
            if len(cards) == limit:
                return cards
    return cards
