"""Cross-stack release contract for exact semantic scenes and category fallbacks."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from ivrit_sheli.visual_spotlight import EXACT_VISUAL_WORDS

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RECIPES_PATH = PROJECT_ROOT / "frontend" / "src" / "visuals" / "a0VisualRecipes.ts"
OFFLINE_DICTIONARY_PATH = (
    PROJECT_ROOT / "frontend" / "public" / "content" / "starter-dictionary-v2.8.json"
)
KNOWN_SCENE_ALTS = {
    "family.boy": {
        "en": "A young boy beside a clear masculine square marker",
        "es": "Un niño junto a un marcador masculino cuadrado y claro",
        "he": "ילד צעיר לצד סמן זכרי מרובע וברור",
    },
    "family.girl": {
        "en": "A young girl beside a clear feminine circle marker",
        "es": "Una niña junto a un marcador femenino circular y claro",
        "he": "ילדה צעירה לצד סמן נקבי עגול וברור",
    },
    "food.egg": {
        "en": "An egg cracking above a pan with the yolk visible",
        "es": "Un huevo se rompe sobre una sartén con la yema visible",
        "he": "ביצה נשברת מעל מחבת והחלמון נראה",
    },
    "greetings.good_night": {
        "en": "A person settling into bed beneath a moonlit window",
        "es": "Una persona se acomoda en la cama bajo una ventana iluminada por la luna",
        "he": "אדם נכנס למיטה מתחת לחלון מואר באור הירח",
    },
    "health.help": {
        "en": "One person reaches out to help another stand up",
        "es": "Una persona tiende la mano para ayudar a otra a levantarse",
        "he": "אדם מושיט יד ועוזר לאדם אחר לקום",
    },
    "register.offer_help": {
        "en": "Illustration of a helper reaching with open hands toward a heavy box another person is carrying alone",
        "es": "Ilustración de una persona que extiende las manos hacia una caja pesada que otra lleva sola",
        "he": "איור של אדם שמושיט ידיים לעבר ארגז כבד שאדם אחר נושא לבדו",
    },
    "time.hour": {
        "en": "A tall pendulum clock with twelve hour marks and a one-hour arc",
        "es": "Un reloj alto de péndulo con doce marcas horarias y un arco de una hora",
        "he": "שעון מטוטלת גבוה עם שנים עשר סימוני שעות וקשת של שעה אחת",
    },
    "time.minute": {
        "en": "A stopwatch shows one complete minute on a dial with sixty second marks",
        "es": "Un cronómetro muestra un minuto completo en una esfera con sesenta marcas de segundos",
        "he": "שעון עצר מציג דקה שלמה על חוגה עם שישים סימוני שניות",
    },
    "time.year": {
        "en": "A circular year wheel divided into four changing seasons",
        "es": "Una rueda anual circular dividida en cuatro estaciones",
        "he": "גלגל שנה עגול המחולק לארבע עונות מתחלפות",
    },
    "time.yesterday": {
        "en": "Two calendar pages with an arrow pointing back to the previous day",
        "es": "Dos páginas de calendario con una flecha hacia el día anterior",
        "he": "שני דפי לוח שנה עם חץ החוזר אל היום הקודם",
    },
}


def test_visual_catalog_has_240_exact_scenes_and_no_reviewed_fallbacks() -> None:
    recipe_source = RECIPES_PATH.read_text(encoding="utf-8")
    exact_keys = set(re.findall(r"^  '([^']+)': \{$", recipe_source, flags=re.MULTILINE))
    payload: dict[str, Any] = json.loads(
        OFFLINE_DICTIONARY_PATH.read_text(encoding="utf-8")
    )
    entries = payload["entries"]
    catalog_by_visual = {
        str(entry["visual"]["key"]): entry
        for entry in entries
        if entry.get("visual") is not None
    }

    assert len(catalog_by_visual) == 240
    assert len(exact_keys) == 240
    assert len(EXACT_VISUAL_WORDS) == 240
    assert exact_keys <= catalog_by_visual.keys()
    assert catalog_by_visual.keys() - exact_keys == set()
    exact_words_in_catalog = {
        str(entry["word"])
        for visual_key, entry in catalog_by_visual.items()
        if visual_key in exact_keys
    }
    assert EXACT_VISUAL_WORDS == exact_words_in_catalog
    for visual_key in exact_keys:
        visual = catalog_by_visual[visual_key]["visual"]
        assert visual["key"] == visual_key
        assert all(visual["alt"][locale].strip() for locale in ("en", "es", "he"))
    for visual_key, expected_alt in KNOWN_SCENE_ALTS.items():
        assert catalog_by_visual[visual_key]["visual"]["alt"] == expected_alt
