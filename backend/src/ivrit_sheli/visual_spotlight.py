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
    # Counting words: each now has an exact scene that can be counted, so they
    # belong in the spotlight rotation like every other reviewed scene.
    # Lead the ambient card with two coffee cups. The former first scene used a
    # raised-finger metaphor whose small rendering was culturally ambiguous.
    # One remains in the same set and now uses one coffee cup instead.
    ("שתיים", "אחת", "שלוש", "ארבע", "חמש", "שש"),
    ("שבע", "שמונה", "תשע", "עשר", "מאה", "מספר"),
    # Nature: each landscape is built on its own silhouette so the six of them
    # stay distinguishable, which is what earns them a place in the rotation.
    ("מדבר", "הר", "עץ", "פרח", "טבע", "גינה"),
    ("ציפור", "כלב", "חתול", "נחל", "שדה", "יער"),
    # Weather, minus חם and קר which already rotate above. Five apiece rather
    # than six: the rotation length is free, only the flattened set is checked.
    ("שמש", "גשם", "רוח", "ענן", "שמיים"),
    ("חורף", "קיץ", "מזג אוויר", "חמסין", "מטרייה"),
    # Transport: the four vehicles are separated by proportion and by what
    # stands next to them, so they earn separate rotation slots.
    ("אוטובוס", "רכבת", "מונית", "תחנה", "כרטיס", "רחוב"),
    ("אופניים", "רכב", "נהג", "מפה", "ימינה", "שמאלה"),
    # Health.
    ("רופא", "תרופה", "כאב", "חולה", "בריא", "עזרה"),
    ("בית מרקחת", "קופת חולים", "תור", "מרשם", "אלרגיה", "אמבולנס"),
    # Shopping: the five money words are separated by what each scene is about
    # — a bagful, a tag, one coin against a gem, notes offered, a card.
    ("חנות", "כסף", "מחיר", "זול", "יקר"),
    ("לקנות", "קבלה", "מזומן", "כרטיס אשראי", "מידה"),
    # The last four home and place words, which completes exact art for every
    # word the starter dictionary carries a scene for.
    ("מקלחת", "מקרר", "מלון", "בית כנסת"),
    # Verbs: the first category of abstract words to get exact art.
    ("לקום", "ללכת", "לבוא", "לעשות", "לעבוד", "ללמוד"),
    ("לקרוא", "לכתוב", "לדבר", "להקשיב", "לחכות", "לבחור"),
    # Work: the first A2 category to get exact art. The three words that put
    # people in a workplace are told apart by what stands between them — a
    # calendar, a shared document, a service counter.
    ("עבודה", "משרד", "פגישה", "משימה", "פרויקט", "צוות"),
    ("מנהל", "לקוח", "הודעה", "דואר אלקטרוני", "הפסקה", "משכורת"),
    # Services. The pairs at risk of collapsing into one drawing are kept
    # apart by what each scene is about, not by its label: the clinic is a
    # consulting room because the health fund already owns the facade, and
    # the hotline keeps a queue of waiting calls that customer service lacks.
    ("סופרמרקט", "דואר", "ספרייה", "מרפאה", "מיון", "מוקד"),
    ("משטרה", "חשבונית", "הזמנה", "משלוח", "שירות לקוחות", "שעות פתיחה"),
    # Housing. The four building words look at one from four distances, and
    # תקלה and תיקון are the same water heater broken and then mended, which
    # is what teaches the difference between the two.
    ("דירה", "שכונה", "קומה", "מעלית", "חוזה", "בעל דירה"),
    ("שכר דירה", "ארנונה", "ועד בית", "תקלה", "תיקון", "כתובת"),
    # Bureaucracy. Seven of the twelve are a piece of paper, so each is drawn
    # as the thing only it has — an empty form, a bundle in a folder, a hand
    # still writing, money moving both ways.
    ("תעודת זהות", "דרכון", "טופס", "מסמך", "חתימה", "חשבון"),
    ("בנק", "ביטוח", "עירייה", "משרד הפנים", "רישיון", "פקיד"),
    # Communication: practical speech acts now have exact art instead of a
    # category bubble, so Today can recommend them honestly.
    ("להבין", "להסביר", "לשאול", "לענות", "לבקש", "להציע"),
    ("להסכים", "לא להסכים", "לחזור", "להודיע", "לשלוח", "לקבל"),
    # Autonomy: phrase-level survival language, including grammatical-gender
    # pairs whose visual markers differ by shape rather than colour alone.
    ("אפשר", "אי אפשר", "איפה אפשר", "מתי אפשר", "אני צריך עזרה", "אני צריכה עזרה"),
    ("יש לי", "אין לי", "אני מחפש", "אני מחפשת", "אני לא מבין", "אני לא מבינה"),
    # Register: tone and social fluency complete the 240-scene catalog.
    ("לדעתי", "תודה רבה", "בשמחה", "אין בעיה", "רגע בבקשה", "אפשר לעזור"),
    ("כדאי", "חשוב", "בטח", "אולי", "אני מסכים", "אני מסכימה"),
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
