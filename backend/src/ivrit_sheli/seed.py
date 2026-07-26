"""
Module: starter data
Purpose: Seed a useful private demo profile, real-life Hebrew items, and offline dictionary content.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from typing import Any

from ivrit_sheli.dictionary import DictionaryStore
from ivrit_sheli.repository import LearningRepository

STARTER_ITEMS: tuple[dict[str, Any], ...] = (
    {
        "hebrew_text": "אני אטפל בזה",
        "hebrew_with_niqqud": "אֲנִי אֲטַפֵּל בָּזֶה",
        "transliteration": "Ani atapel bazeh",
        "translation_en": "I’ll take care of it.",
        "translation_es": "Me encargaré de eso.",
        "item_type": "phrase",
        "root": "טפל",
        "binyan": "pi'el",
        "register_label": "workplace-neutral",
        "context_label": "workplace",
        "source_label": "starter_pack",
        "priority": 0.95,
    },
    {
        "hebrew_text": "אפשר להגיד את זה שוב, בבקשה?",
        "hebrew_with_niqqud": "אֶפְשָׁר לְהַגִּיד אֶת זֶה שׁוּב, בְּבַקָּשָׁה?",
        "transliteration": "Efshar lehagid et ze shuv, bevakasha?",
        "translation_en": "Can you say that again, please?",
        "translation_es": "¿Puedes decirlo otra vez, por favor?",
        "item_type": "phrase",
        "root": "נגד",
        "binyan": "hif'il",
        "register_label": "polite",
        "context_label": "daily_life",
        "source_label": "starter_pack",
        "priority": 0.92,
    },
    {
        "hebrew_text": "למה אתה מתכוון?",
        "hebrew_with_niqqud": "לְמָה אַתָּה מִתְכַּוֵּן?",
        "transliteration": "Lama ata mitkaven?",
        "translation_en": "What do you mean?",
        "translation_es": "¿Qué quieres decir?",
        "item_type": "phrase",
        "root": "כון",
        "binyan": "hitpa'el",
        "register_label": "neutral-direct",
        "context_label": "workplace",
        "source_label": "starter_pack",
        "priority": 0.88,
    },
    {
        "hebrew_text": "מה הצעד הבא?",
        "hebrew_with_niqqud": "מָה הַצַּעַד הַבָּא?",
        "transliteration": "Ma hatsaad haba?",
        "translation_en": "What is the next step?",
        "translation_es": "¿Cuál es el siguiente paso?",
        "item_type": "phrase",
        "register_label": "workplace-neutral",
        "context_label": "workplace",
        "source_label": "starter_pack",
        "priority": 0.86,
    },
    {
        "hebrew_text": "אני צריך לקבוע תור",
        "hebrew_with_niqqud": "אֲנִי צָרִיךְ לִקְבֹּעַ תּוֹר",
        "transliteration": "Ani tsarikh likboa tor",
        "translation_en": "I need to schedule an appointment.",
        "translation_es": "Necesito concertar una cita.",
        "item_type": "phrase",
        "root": "קבע",
        "binyan": "pa'al",
        "grammatical_gender": "masculine speaker",
        "register_label": "neutral",
        "context_label": "medical",
        "source_label": "starter_pack",
        "priority": 0.8,
    },
    {
        "hebrew_text": "אילו מסמכים צריך להביא?",
        "hebrew_with_niqqud": "אֵילוּ מִסְמָכִים צָרִיךְ לְהָבִיא?",
        "transliteration": "Eilu mismakhim tsarikh lehavi?",
        "translation_en": "Which documents should I bring?",
        "translation_es": "¿Qué documentos debo llevar?",
        "item_type": "phrase",
        "register_label": "neutral-polite",
        "context_label": "bureaucracy",
        "source_label": "starter_pack",
        "priority": 0.78,
    },
    {
        "hebrew_text": "לאט יותר, בבקשה",
        "hebrew_with_niqqud": "לְאַט יוֹתֵר, בְּבַקָּשָׁה",
        "transliteration": "Leat yoter, bevakasha",
        "translation_en": "More slowly, please.",
        "translation_es": "Más despacio, por favor.",
        "item_type": "phrase",
        "register_label": "polite",
        "context_label": "daily_life",
        "source_label": "starter_pack",
        "priority": 0.9,
    },
    {
        "hebrew_text": "אני עדיין לומד עברית",
        "hebrew_with_niqqud": "אֲנִי עֲדַיִן לוֹמֵד עִבְרִית",
        "transliteration": "Ani adayin lomed Ivrit",
        "translation_en": "I am still learning Hebrew.",
        "translation_es": "Todavía estoy aprendiendo hebreo.",
        "item_type": "phrase",
        "root": "למד",
        "binyan": "pa'al",
        "grammatical_gender": "masculine speaker",
        "register_label": "neutral",
        "context_label": "daily_life",
        "source_label": "starter_pack",
        "priority": 0.84,
    },
)


def seed_all(
    repository: LearningRepository,
    dictionary: DictionaryStore,
    *,
    display_name: str = "Learner",
) -> dict[str, int]:
    """Install starter learner content idempotently.

    Args:
        repository: Learning repository.
        dictionary: Dictionary store.
        display_name: Local display name.

    Returns:
        Counts of inserted learning and dictionary entries.

    Example:
        Called by the CLI and application setup.
    """
    repository.ensure_default_profile(display_name)
    dictionary_entries = dictionary.seed_demo()
    existing = {
        item["normalized_text"] for item in repository.list_items(limit=500)
    }
    learning_items = 0
    for payload in STARTER_ITEMS:
        from ivrit_sheli.normalization import normalize_hebrew

        if normalize_hebrew(payload["hebrew_text"]) in existing:
            continue
        repository.create_item(payload)
        learning_items += 1
    return {
        "learning_items": learning_items,
        "dictionary_entries": dictionary_entries,
    }
