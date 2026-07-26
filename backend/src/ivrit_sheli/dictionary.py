"""
Module: Hebrew dictionary
Purpose: Provide a rebuildable, attributed Hebrew lexicon with streamed JSONL imports and fast lookup.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

from ivrit_sheli import __version__
from ivrit_sheli.normalization import normalize_hebrew
from ivrit_sheli.starter_lexicon_v2 import EXPANDED_STARTER_ENTRIES
from ivrit_sheli.starter_lexicon_v3 import LEARNING_EXPANSION_ENTRIES
from ivrit_sheli.starter_lexicon_v4 import A2_EXPANSION_ENTRIES
from ivrit_sheli.starter_lexicon_validation import validate_starter_vocabulary

LOGGER = logging.getLogger(__name__)
DICTIONARY_SCHEMA_VERSION = 3
DEFAULT_DICTIONARY_URL = "https://kaikki.org/dictionary/Hebrew/kaikki.org-dictionary-Hebrew.jsonl"
ALLOWED_DOWNLOAD_HOSTS = {"kaikki.org", "www.kaikki.org"}
STARTER_SOURCE_NAME = "Ivrit Sheli reviewed starter vocabulary"
STARTER_SOURCE_URL = (
    "https://github.com/LiriothTeltanion/IvritSheli/blob/main/backend/src/ivrit_sheli/dictionary.py"
)
STARTER_LICENSE = "MIT application sample data"
STARTER_PROVENANCE = "Ivrit Sheli editorial review; A0/A1 starter sense v1"

DICTIONARY_SCHEMA = """
CREATE TABLE IF NOT EXISTS dictionary_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dictionary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_key TEXT NOT NULL UNIQUE,
    word TEXT NOT NULL,
    normalized_word TEXT NOT NULL,
    pos TEXT,
    language_code TEXT NOT NULL DEFAULT 'he',
    language_name TEXT NOT NULL DEFAULT 'Hebrew',
    romanization TEXT,
    root TEXT,
    binyan TEXT,
    gender TEXT,
    etymology TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT,
    license_name TEXT,
    raw_json TEXT,
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dictionary_word
ON dictionary_entries(normalized_word, pos);

CREATE TABLE IF NOT EXISTS dictionary_senses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
    sense_order INTEGER NOT NULL DEFAULT 0,
    gloss_en TEXT,
    gloss_es TEXT,
    level TEXT,
    category TEXT,
    visual_key TEXT,
    visual_id TEXT,
    visual_emoji TEXT,
    visual_alt_en TEXT,
    visual_alt_es TEXT,
    visual_alt_he TEXT,
    provenance TEXT,
    reading_hints_json TEXT NOT NULL DEFAULT '[]',
    tags_json TEXT NOT NULL DEFAULT '[]',
    topics_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_dictionary_sense_entry
ON dictionary_senses(entry_id, sense_order);

CREATE TABLE IF NOT EXISTS dictionary_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
    form TEXT NOT NULL,
    normalized_form TEXT NOT NULL,
    tags_json TEXT NOT NULL DEFAULT '[]',
    romanization TEXT
);

CREATE INDEX IF NOT EXISTS idx_dictionary_form
ON dictionary_forms(normalized_form);

CREATE TABLE IF NOT EXISTS dictionary_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
    hebrew_text TEXT NOT NULL,
    translation_en TEXT,
    translation_es TEXT,
    romanization TEXT,
    source_text TEXT
);

CREATE TABLE IF NOT EXISTS dictionary_sounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
    audio_url TEXT,
    ipa TEXT,
    romanization TEXT,
    tags_json TEXT NOT NULL DEFAULT '[]'
);
"""


def _starter_concept(
    *,
    word: str,
    niqqud: str,
    romanization: str,
    pos: str,
    gloss_en: str,
    gloss_es: str,
    category: str,
    level: str,
    visual_key: str,
    visual_emoji: str,
    visual_alt_en: str,
    visual_alt_es: str,
    visual_alt_he: str,
    example_he: str,
    example_en: str,
    example_es: str,
    example_romanization: str,
    gender: str | None = None,
    root: str | None = None,
    binyan: str | None = None,
    source_key: str | None = None,
) -> dict[str, Any]:
    """Build one fully reviewed, exact-sense beginner concept."""
    return {
        "word": word,
        "pos": pos,
        "romanization": romanization,
        "gender": gender,
        "root": root,
        "binyan": binyan,
        "source_key": source_key,
        "gloss_en": gloss_en,
        "gloss_es": gloss_es,
        "level": level,
        "category": category,
        "visual_key": visual_key,
        "visual_emoji": visual_emoji,
        "visual_alt_en": visual_alt_en,
        "visual_alt_es": visual_alt_es,
        "visual_alt_he": visual_alt_he,
        "provenance": STARTER_PROVENANCE,
        "forms": [{"form": niqqud, "tags": ["with-niqqud"]}],
        "examples": [
            {
                "hebrew": example_he,
                "translation_en": example_en,
                "translation_es": example_es,
                "romanization": example_romanization,
            }
        ],
    }


# The visual belongs to this reviewed sense, never to the spelling alone. Imported
# entries intentionally keep these nullable fields empty rather than guessing an image.
DEMO_ENTRIES: tuple[dict[str, Any], ...] = (
    _starter_concept(
        word="שלום",
        niqqud="שָׁלוֹם",
        romanization="shalom",
        pos="interjection",
        gloss_en="hello",
        gloss_es="hola",
        category="greetings",
        level="A0",
        visual_key="greetings.hello",
        visual_emoji="👋",
        visual_alt_en="Two neighbors facing each other and waving hello",
        visual_alt_es="Dos vecinos frente a frente saludándose con la mano",
        visual_alt_he="שני שכנים עומדים זה מול זה ומנופפים לשלום",
        example_he="שָׁלוֹם, אֲנִי מִרְיָם.",
        example_en="Hello, I am Miriam.",
        example_es="Hola, soy Miriam.",
        example_romanization="Shalom, ani Miryam.",
        gender="masculine",
        source_key="builtin:שלום:noun",
    ),
    _starter_concept(
        word="תודה",
        niqqud="תּוֹדָה",
        romanization="toda",
        pos="interjection",
        gloss_en="thank you",
        gloss_es="gracias",
        category="greetings",
        level="A0",
        visual_key="greetings.thanks",
        visual_emoji="🙏",
        visual_alt_en="Two neighbors sharing a small gift with gratitude",
        visual_alt_es="Dos vecinos compartiendo un pequeño regalo con gratitud",
        visual_alt_he="שני שכנים חולקים מתנה קטנה בהכרת תודה",
        example_he="תּוֹדָה עַל הָעֶזְרָה.",
        example_en="Thank you for the help.",
        example_es="Gracias por la ayuda.",
        example_romanization="Toda al ha-ezra.",
    ),
    _starter_concept(
        word="בבקשה",
        niqqud="בְּבַקָּשָׁה",
        romanization="bevakasha",
        pos="interjection",
        gloss_en="please",
        gloss_es="por favor",
        category="greetings",
        level="A0",
        visual_key="greetings.please",
        visual_emoji="🤲",
        visual_alt_en="Two neighbors politely passing a glass of water",
        visual_alt_es="Dos vecinos pasando un vaso de agua con amabilidad",
        visual_alt_he="שני שכנים מעבירים כוס מים בנימוס",
        example_he="מַיִם, בְּבַקָּשָׁה.",
        example_en="Water, please.",
        example_es="Agua, por favor.",
        example_romanization="Mayim, bevakasha.",
    ),
    _starter_concept(
        word="כן",
        niqqud="כֵּן",
        romanization="ken",
        pos="particle",
        gloss_en="yes",
        gloss_es="sí",
        category="greetings",
        level="A0",
        visual_key="greetings.yes",
        visual_emoji="✅",
        visual_alt_en="A clear green check meaning yes",
        visual_alt_es="Una marca verde clara que significa sí",
        visual_alt_he="סימן וי ירוק שמשמעו כן",
        example_he="כֵּן, אֲנִי מוּכָנָה.",
        example_en="Yes, I am ready.",
        example_es="Sí, estoy lista.",
        example_romanization="Ken, ani mukhana.",
    ),
    _starter_concept(
        word="לא",
        niqqud="לֹא",
        romanization="lo",
        pos="particle",
        gloss_en="no",
        gloss_es="no",
        category="greetings",
        level="A0",
        visual_key="greetings.no",
        visual_emoji="❌",
        visual_alt_en="A gentle coral cross meaning no",
        visual_alt_es="Una cruz coral amable que significa no",
        visual_alt_he="סימן איקס בצבע אלמוג שמשמעו לא",
        example_he="לֹא, תּוֹדָה.",
        example_en="No, thank you.",
        example_es="No, gracias.",
        example_romanization="Lo, toda.",
    ),
    _starter_concept(
        word="סליחה",
        niqqud="סְלִיחָה",
        romanization="slikha",
        pos="interjection",
        gloss_en="excuse me",
        gloss_es="disculpe",
        category="greetings",
        level="A0",
        visual_key="greetings.excuse_me",
        visual_emoji="🙇",
        visual_alt_en="A passenger politely asking another person to make space on a city bus",
        visual_alt_es="Un pasajero pide con amabilidad que otra persona le deje pasar en un autobús",
        visual_alt_he="נוסע מבקש בנימוס מאדם אחר לפנות מעבר באוטובוס עירוני",
        example_he="סְלִיחָה, אֵיפֹה הַתַּחֲנָה?",
        example_en="Excuse me, where is the station?",
        example_es="Disculpe, ¿dónde está la estación?",
        example_romanization="Slikha, eifo ha-takhana?",
    ),
    _starter_concept(
        word="בוקר טוב",
        niqqud="בּוֹקֶר טוֹב",
        romanization="boker tov",
        pos="phrase",
        gloss_en="good morning",
        gloss_es="buenos días",
        category="greetings",
        level="A0",
        visual_key="greetings.good_morning",
        visual_emoji="🌅",
        visual_alt_en="Two people greet each other over breakfast as the sun rises through a window",
        visual_alt_es="Dos personas se saludan durante el desayuno mientras sale el sol por la ventana",
        visual_alt_he="שני אנשים מברכים זה את זה בארוחת הבוקר כשהשמש זורחת בחלון",
        example_he="בּוֹקֶר טוֹב, אִמָּא.",
        example_en="Good morning, Mom.",
        example_es="Buenos días, mamá.",
        example_romanization="Boker tov, ima.",
    ),
    _starter_concept(
        word="להתראות",
        niqqud="לְהִתְרָאוֹת",
        romanization="lehitraot",
        pos="interjection",
        gloss_en="goodbye",
        gloss_es="adiós",
        category="greetings",
        level="A0",
        visual_key="greetings.goodbye",
        visual_emoji="🚪",
        visual_alt_en="Two friends wave goodbye as one walks toward a departing bus",
        visual_alt_es="Dos amigos se despiden con la mano mientras uno camina hacia un autobús que parte",
        visual_alt_he="שני חברים מנופפים לשלום כשאחד הולך אל אוטובוס שיוצא",
        example_he="לְהִתְרָאוֹת מָחָר.",
        example_en="See you tomorrow.",
        example_es="Hasta mañana.",
        example_romanization="Lehitraot makhar.",
    ),
    _starter_concept(
        word="אמא",
        niqqud="אִמָּא",
        romanization="ima",
        pos="noun",
        gloss_en="mother",
        gloss_es="madre",
        category="family",
        level="A0",
        visual_key="family.mother",
        visual_emoji="👩",
        visual_alt_en="A family relationship diagram highlights the mother above her child",
        visual_alt_es="Un diagrama familiar destaca a la madre sobre su hijo",
        visual_alt_he="תרשים משפחתי מדגיש את האם מעל הילד",
        example_he="אִמָּא שֶׁלִּי בַּבַּיִת.",
        example_en="My mother is at home.",
        example_es="Mi madre está en casa.",
        example_romanization="Ima sheli ba-bayit.",
        gender="feminine",
    ),
    _starter_concept(
        word="אבא",
        niqqud="אַבָּא",
        romanization="aba",
        pos="noun",
        gloss_en="father",
        gloss_es="padre",
        category="family",
        level="A0",
        visual_key="family.father",
        visual_emoji="👨",
        visual_alt_en="A family relationship diagram highlights the father above his child",
        visual_alt_es="Un diagrama familiar destaca al padre sobre su hijo",
        visual_alt_he="תרשים משפחתי מדגיש את האב מעל הילד",
        example_he="אַבָּא שֶׁלִּי שׁוֹתֶה קָפֶה.",
        example_en="My father drinks coffee.",
        example_es="Mi padre toma café.",
        example_romanization="Aba sheli shote kafe.",
        gender="masculine",
    ),
    _starter_concept(
        word="אח",
        niqqud="אָח",
        romanization="akh",
        pos="noun",
        gloss_en="brother",
        gloss_es="hermano",
        category="family",
        level="A0",
        visual_key="family.brother",
        visual_emoji="👦",
        visual_alt_en="A family relationship diagram highlights a brother beside his sibling",
        visual_alt_es="Un diagrama familiar destaca a un hermano junto a su hermano o hermana",
        visual_alt_he="תרשים משפחתי מדגיש אח לצד אחיו או אחותו",
        example_he="יֵשׁ לִי אָח אֶחָד.",
        example_en="I have one brother.",
        example_es="Tengo un hermano.",
        example_romanization="Yesh li akh ekhad.",
        gender="masculine",
    ),
    _starter_concept(
        word="אחות",
        niqqud="אָחוֹת",
        romanization="akhot",
        pos="noun",
        gloss_en="sister",
        gloss_es="hermana",
        category="family",
        level="A0",
        visual_key="family.sister",
        visual_emoji="👧",
        visual_alt_en="A family relationship diagram highlights a sister beside her sibling",
        visual_alt_es="Un diagrama familiar destaca a una hermana junto a su hermano o hermana",
        visual_alt_he="תרשים משפחתי מדגיש אחות לצד אחיה או אחותה",
        example_he="יֵשׁ לִי אָחוֹת אַחַת.",
        example_en="I have one sister.",
        example_es="Tengo una hermana.",
        example_romanization="Yesh li akhot akhat.",
        gender="feminine",
    ),
    _starter_concept(
        word="סבתא",
        niqqud="סַבְתָּא",
        romanization="savta",
        pos="noun",
        gloss_en="grandmother",
        gloss_es="abuela",
        category="family",
        level="A0",
        visual_key="family.grandmother",
        visual_emoji="👵",
        visual_alt_en="A three-generation family diagram highlights the grandmother",
        visual_alt_es="Un diagrama familiar de tres generaciones destaca a la abuela",
        visual_alt_he="תרשים משפחתי בן שלושה דורות מדגיש את הסבתא",
        example_he="סַבְתָּא שֶׁלִּי מְדַבֶּרֶת עִבְרִית.",
        example_en="My grandmother speaks Hebrew.",
        example_es="Mi abuela habla hebreo.",
        example_romanization="Savta sheli medaberet Ivrit.",
        gender="feminine",
    ),
    _starter_concept(
        word="סבא",
        niqqud="סַבָּא",
        romanization="saba",
        pos="noun",
        gloss_en="grandfather",
        gloss_es="abuelo",
        category="family",
        level="A0",
        visual_key="family.grandfather",
        visual_emoji="👴",
        visual_alt_en="A three-generation family diagram highlights the grandfather",
        visual_alt_es="Un diagrama familiar de tres generaciones destaca al abuelo",
        visual_alt_he="תרשים משפחתי בן שלושה דורות מדגיש את הסבא",
        example_he="סַבָּא שֶׁלִּי גָּר בְּחֵיפָה.",
        example_en="My grandfather lives in Haifa.",
        example_es="Mi abuelo vive en Haifa.",
        example_romanization="Saba sheli gar be-Kheifa.",
        gender="masculine",
    ),
    _starter_concept(
        word="משפחה",
        niqqud="מִשְׁפָּחָה",
        romanization="mishpakha",
        pos="noun",
        gloss_en="family",
        gloss_es="familia",
        category="family",
        level="A0",
        visual_key="family.family",
        visual_emoji="👪",
        visual_alt_en="A warm multi-generation family diagram with every relative connected",
        visual_alt_es="Un cálido diagrama familiar multigeneracional con todos conectados",
        visual_alt_he="תרשים משפחתי חם ורב דורי שבו כולם מחוברים",
        example_he="הַמִּשְׁפָּחָה שֶׁלִּי גְּדוֹלָה.",
        example_en="My family is big.",
        example_es="Mi familia es grande.",
        example_romanization="Ha-mishpakha sheli gdola.",
        gender="feminine",
    ),
    _starter_concept(
        word="בית",
        niqqud="בַּיִת",
        romanization="bayit",
        pos="noun",
        gloss_en="house",
        gloss_es="casa",
        category="home",
        level="A0",
        visual_key="home.house",
        visual_emoji="🏠",
        visual_alt_en="A person approaches a whole house in an Israeli neighborhood",
        visual_alt_es="Una persona se acerca a una casa completa en un barrio israelí",
        visual_alt_he="אדם מתקרב לבית שלם בשכונה ישראלית",
        example_he="זֶה הַבַּיִת שֶׁלִּי.",
        example_en="This is my house.",
        example_es="Esta es mi casa.",
        example_romanization="Ze ha-bayit sheli.",
        gender="masculine",
    ),
    _starter_concept(
        word="חדר",
        niqqud="חֶדֶר",
        romanization="kheder",
        pos="noun",
        gloss_en="room",
        gloss_es="habitación",
        category="home",
        level="A0",
        visual_key="home.room",
        visual_emoji="🚪",
        visual_alt_en="A cutaway bedroom with four walls, a bed, a desk and a lamp",
        visual_alt_es="Una habitación vista por dentro con cuatro paredes, cama, escritorio y lámpara",
        visual_alt_he="חדר שינה פתוח למבט עם ארבעה קירות, מיטה, שולחן ומנורה",
        example_he="הַחֶדֶר שֶׁלִּי קָטָן.",
        example_en="My room is small.",
        example_es="Mi habitación es pequeña.",
        example_romanization="Ha-kheder sheli katan.",
        gender="masculine",
    ),
    _starter_concept(
        word="מטבח",
        niqqud="מִטְבָּח",
        romanization="mitbakh",
        pos="noun",
        gloss_en="kitchen",
        gloss_es="cocina",
        category="home",
        level="A0",
        visual_key="home.kitchen",
        visual_emoji="🍳",
        visual_alt_en="A pan in a kitchen",
        visual_alt_es="Una sartén en una cocina",
        visual_alt_he="מחבת במטבח",
        example_he="הַמִּטְבָּח נָקִי.",
        example_en="The kitchen is clean.",
        example_es="La cocina está limpia.",
        example_romanization="Ha-mitbakh naki.",
        gender="masculine",
    ),
    _starter_concept(
        word="מיטה",
        niqqud="מִטָּה",
        romanization="mita",
        pos="noun",
        gloss_en="bed",
        gloss_es="cama",
        category="home",
        level="A0",
        visual_key="home.bed",
        visual_emoji="🛏️",
        visual_alt_en="A bed ready for sleep",
        visual_alt_es="Una cama lista para dormir",
        visual_alt_he="מיטה מוכנה לשינה",
        example_he="הַמִּטָּה נוֹחָה.",
        example_en="The bed is comfortable.",
        example_es="La cama es cómoda.",
        example_romanization="Ha-mita nokha.",
        gender="feminine",
    ),
    _starter_concept(
        word="שולחן",
        niqqud="שֻׁלְחָן",
        romanization="shulkhan",
        pos="noun",
        gloss_en="table",
        gloss_es="mesa",
        category="home",
        level="A0",
        visual_key="home.table",
        visual_emoji="🍽️",
        visual_alt_en="A place setting on a table",
        visual_alt_es="Un servicio puesto sobre una mesa",
        visual_alt_he="כלי אוכל על שולחן",
        example_he="הַקָּפֶה עַל הַשֻּׁלְחָן.",
        example_en="The coffee is on the table.",
        example_es="El café está sobre la mesa.",
        example_romanization="Ha-kafe al ha-shulkhan.",
        gender="masculine",
    ),
    _starter_concept(
        word="כיסא",
        niqqud="כִּסֵּא",
        romanization="kise",
        pos="noun",
        gloss_en="chair",
        gloss_es="silla",
        category="home",
        level="A0",
        visual_key="home.chair",
        visual_emoji="🪑",
        visual_alt_en="A chair",
        visual_alt_es="Una silla",
        visual_alt_he="כיסא",
        example_he="אֶפְשָׁר לָשֶׁבֶת עַל הַכִּסֵּא.",
        example_en="You can sit on the chair.",
        example_es="Puedes sentarte en la silla.",
        example_romanization="Efshar lashevet al ha-kise.",
        gender="masculine",
    ),
    _starter_concept(
        word="מפתח",
        niqqud="מַפְתֵּחַ",
        romanization="mafteakh",
        pos="noun",
        gloss_en="key",
        gloss_es="llave",
        category="home",
        level="A0",
        visual_key="home.key",
        visual_emoji="🔑",
        visual_alt_en="A hand turns a key inside the lock of a front door",
        visual_alt_es="Una mano gira una llave dentro de la cerradura de una puerta principal",
        visual_alt_he="יד מסובבת מפתח בתוך המנעול של דלת הכניסה",
        example_he="אֵיפֹה הַמַּפְתֵּחַ?",
        example_en="Where is the key?",
        example_es="¿Dónde está la llave?",
        example_romanization="Eifo ha-mafteakh?",
        gender="masculine",
    ),
    _starter_concept(
        word="מים",
        niqqud="מַיִם",
        romanization="mayim",
        pos="noun",
        gloss_en="water",
        gloss_es="agua",
        category="food",
        level="A0",
        visual_key="food.water",
        visual_emoji="💧",
        visual_alt_en="A kitchen tap fills a transparent glass with clear water",
        visual_alt_es="Un grifo de cocina llena un vaso transparente con agua clara",
        visual_alt_he="ברז מטבח ממלא כוס שקופה במים צלולים",
        example_he="אֲנִי רוֹצָה מַיִם.",
        example_en="I want water.",
        example_es="Quiero agua.",
        example_romanization="Ani rotsa mayim.",
    ),
    _starter_concept(
        word="לחם",
        niqqud="לֶחֶם",
        romanization="lekhem",
        pos="noun",
        gloss_en="bread",
        gloss_es="pan",
        category="food",
        level="A0",
        visual_key="food.bread",
        visual_emoji="🍞",
        visual_alt_en="A loaf of bread",
        visual_alt_es="Una barra de pan",
        visual_alt_he="כיכר לחם",
        example_he="אֲנִי אוֹכֶלֶת לֶחֶם בַּבֹּקֶר.",
        example_en="I eat bread in the morning.",
        example_es="Como pan por la mañana.",
        example_romanization="Ani okhelet lekhem ba-boker.",
        gender="masculine",
    ),
    _starter_concept(
        word="חלב",
        niqqud="חָלָב",
        romanization="khalav",
        pos="noun",
        gloss_en="milk",
        gloss_es="leche",
        category="food",
        level="A0",
        visual_key="food.milk",
        visual_emoji="🥛",
        visual_alt_en="A glass of milk",
        visual_alt_es="Un vaso de leche",
        visual_alt_he="כוס חלב",
        example_he="יֵשׁ חָלָב בַּמְּקָרֵר.",
        example_en="There is milk in the refrigerator.",
        example_es="Hay leche en el refrigerador.",
        example_romanization="Yesh khalav ba-mekarer.",
        gender="masculine",
    ),
    _starter_concept(
        word="קפה",
        niqqud="קָפֶה",
        romanization="kafe",
        pos="noun",
        gloss_en="coffee",
        gloss_es="café",
        category="food",
        level="A0",
        visual_key="food.coffee",
        visual_emoji="☕",
        visual_alt_en="A warm cup of coffee",
        visual_alt_es="Una taza de café caliente",
        visual_alt_he="כוס קפה חם",
        example_he="קָפֶה אֶחָד, בְּבַקָּשָׁה.",
        example_en="One coffee, please.",
        example_es="Un café, por favor.",
        example_romanization="Kafe ekhad, bevakasha.",
        gender="masculine",
    ),
    _starter_concept(
        word="תה",
        niqqud="תֵּה",
        romanization="te",
        pos="noun",
        gloss_en="tea",
        gloss_es="té",
        category="food",
        level="A0",
        visual_key="food.tea",
        visual_emoji="🍵",
        visual_alt_en="A warm cup of tea",
        visual_alt_es="Una taza de té caliente",
        visual_alt_he="כוס תה חם",
        example_he="אֲנִי שׁוֹתָה תֵּה.",
        example_en="I drink tea.",
        example_es="Tomo té.",
        example_romanization="Ani shota te.",
        gender="masculine",
    ),
    _starter_concept(
        word="תפוח",
        niqqud="תַּפּוּחַ",
        romanization="tapuakh",
        pos="noun",
        gloss_en="apple",
        gloss_es="manzana",
        category="food",
        level="A0",
        visual_key="food.apple",
        visual_emoji="🍎",
        visual_alt_en="A red apple",
        visual_alt_es="Una manzana roja",
        visual_alt_he="תפוח אדום",
        example_he="הַתַּפּוּחַ אָדֹם.",
        example_en="The apple is red.",
        example_es="La manzana es roja.",
        example_romanization="Ha-tapuakh adom.",
        gender="masculine",
    ),
    _starter_concept(
        word="אוכל",
        niqqud="אֹכֶל",
        romanization="okhel",
        pos="noun",
        gloss_en="food",
        gloss_es="comida",
        category="food",
        level="A0",
        visual_key="food.food",
        visual_emoji="🍲",
        visual_alt_en="A prepared meal with a plate, pita, salad and vegetables on the table",
        visual_alt_es="Una comida preparada con plato, pita, ensalada y verduras sobre la mesa",
        visual_alt_he="ארוחה מוכנה עם צלחת, פיתה, סלט וירקות על השולחן",
        example_he="הָאֹכֶל טָעִים.",
        example_en="The food is tasty.",
        example_es="La comida está rica.",
        example_romanization="Ha-okhel taim.",
        gender="masculine",
    ),
    _starter_concept(
        word="רעב",
        niqqud="רָעֵב",
        romanization="raev",
        pos="adjective",
        gloss_en="hungry",
        gloss_es="hambriento",
        category="food",
        level="A0",
        visual_key="food.hungry",
        visual_emoji="😋",
        visual_alt_en="A person holds an empty stomach beside an empty plate and imagines food",
        visual_alt_es="Una persona se sostiene el estómago junto a un plato vacío e imagina comida",
        visual_alt_he="אדם מחזיק בבטן ליד צלחת ריקה ומדמיין אוכל",
        example_he="הוּא רָעֵב.",
        example_en="He is hungry.",
        example_es="Él tiene hambre.",
        example_romanization="Hu raev.",
        gender="masculine",
    ),
    _starter_concept(
        word="אוטובוס",
        niqqud="אוֹטוֹבּוּס",
        romanization="otobus",
        pos="noun",
        gloss_en="bus",
        gloss_es="autobús",
        category="transport",
        level="A1",
        visual_key="transport.bus",
        visual_emoji="🚌",
        visual_alt_en="A city bus",
        visual_alt_es="Un autobús urbano",
        visual_alt_he="אוטובוס עירוני",
        example_he="הָאוֹטוֹבּוּס מַגִּיעַ בְּעֶשֶׂר.",
        example_en="The bus arrives at ten.",
        example_es="El autobús llega a las diez.",
        example_romanization="Ha-otobus magia be-eser.",
        gender="masculine",
    ),
    _starter_concept(
        word="רכבת",
        niqqud="רַכֶּבֶת",
        romanization="rakevet",
        pos="noun",
        gloss_en="train",
        gloss_es="tren",
        category="transport",
        level="A1",
        visual_key="transport.train",
        visual_emoji="🚆",
        visual_alt_en="A passenger train",
        visual_alt_es="Un tren de pasajeros",
        visual_alt_he="רכבת נוסעים",
        example_he="הָרַכֶּבֶת לְתֵל אָבִיב מְהִירָה.",
        example_en="The train to Tel Aviv is fast.",
        example_es="El tren a Tel Aviv es rápido.",
        example_romanization="Ha-rakevet le-Tel Aviv mehira.",
        gender="feminine",
    ),
    _starter_concept(
        word="מונית",
        niqqud="מוֹנִית",
        romanization="monit",
        pos="noun",
        gloss_en="taxi",
        gloss_es="taxi",
        category="transport",
        level="A1",
        visual_key="transport.taxi",
        visual_emoji="🚕",
        visual_alt_en="A yellow taxi",
        visual_alt_es="Un taxi amarillo",
        visual_alt_he="מונית צהובה",
        example_he="אֲנִי צְרִיכָה מוֹנִית.",
        example_en="I need a taxi.",
        example_es="Necesito un taxi.",
        example_romanization="Ani tsrikha monit.",
        gender="feminine",
    ),
    _starter_concept(
        word="תחנה",
        niqqud="תַּחֲנָה",
        romanization="takhana",
        pos="noun",
        gloss_en="station",
        gloss_es="estación",
        category="transport",
        level="A1",
        visual_key="transport.station",
        visual_emoji="🚏",
        visual_alt_en="A public transport stop",
        visual_alt_es="Una parada de transporte público",
        visual_alt_he="תחנת תחבורה ציבורית",
        example_he="הַתַּחֲנָה קְרוֹבָה.",
        example_en="The station is nearby.",
        example_es="La estación está cerca.",
        example_romanization="Ha-takhana krova.",
        gender="feminine",
    ),
    _starter_concept(
        word="כרטיס",
        niqqud="כַּרְטִיס",
        romanization="kartis",
        pos="noun",
        gloss_en="ticket",
        gloss_es="billete",
        category="transport",
        level="A1",
        visual_key="transport.ticket",
        visual_emoji="🎫",
        visual_alt_en="A travel ticket",
        visual_alt_es="Un billete de viaje",
        visual_alt_he="כרטיס נסיעה",
        example_he="אֵיפֹה קוֹנִים כַּרְטִיס?",
        example_en="Where do you buy a ticket?",
        example_es="¿Dónde se compra un billete?",
        example_romanization="Eifo konim kartis?",
        gender="masculine",
    ),
    _starter_concept(
        word="רחוב",
        niqqud="רְחוֹב",
        romanization="rekhov",
        pos="noun",
        gloss_en="street",
        gloss_es="calle",
        category="transport",
        level="A1",
        visual_key="transport.street",
        visual_emoji="🛣️",
        visual_alt_en="A road through a neighborhood",
        visual_alt_es="Una calle que atraviesa un barrio",
        visual_alt_he="רחוב שעובר בשכונה",
        example_he="הַחֲנוּת בָּרְחוֹב הַזֶּה.",
        example_en="The store is on this street.",
        example_es="La tienda está en esta calle.",
        example_romanization="Ha-khanut ba-rekhov ha-ze.",
        gender="masculine",
    ),
    _starter_concept(
        word="חנות",
        niqqud="חֲנוּת",
        romanization="khanut",
        pos="noun",
        gloss_en="store",
        gloss_es="tienda",
        category="shopping",
        level="A1",
        visual_key="shopping.store",
        visual_emoji="🏪",
        visual_alt_en="A neighborhood store",
        visual_alt_es="Una tienda de barrio",
        visual_alt_he="חנות שכונתית",
        example_he="הַחֲנוּת פְּתוּחָה.",
        example_en="The store is open.",
        example_es="La tienda está abierta.",
        example_romanization="Ha-khanut ptukha.",
        gender="feminine",
    ),
    _starter_concept(
        word="כסף",
        niqqud="כֶּסֶף",
        romanization="kesef",
        pos="noun",
        gloss_en="money",
        gloss_es="dinero",
        category="shopping",
        level="A1",
        visual_key="shopping.money",
        visual_emoji="💰",
        visual_alt_en="A bag of money",
        visual_alt_es="Una bolsa de dinero",
        visual_alt_he="שק של כסף",
        example_he="אֵין לִי מַסְפִּיק כֶּסֶף.",
        example_en="I do not have enough money.",
        example_es="No tengo suficiente dinero.",
        example_romanization="Ein li maspik kesef.",
        gender="masculine",
    ),
    _starter_concept(
        word="מחיר",
        niqqud="מְחִיר",
        romanization="mekhir",
        pos="noun",
        gloss_en="price",
        gloss_es="precio",
        category="shopping",
        level="A1",
        visual_key="shopping.price",
        visual_emoji="🏷️",
        visual_alt_en="A price tag",
        visual_alt_es="Una etiqueta de precio",
        visual_alt_he="תג מחיר",
        example_he="מָה הַמְּחִיר?",
        example_en="What is the price?",
        example_es="¿Cuál es el precio?",
        example_romanization="Ma ha-mekhir?",
        gender="masculine",
    ),
    _starter_concept(
        word="זול",
        niqqud="זוֹל",
        romanization="zol",
        pos="adjective",
        gloss_en="cheap",
        gloss_es="barato",
        category="shopping",
        level="A1",
        visual_key="shopping.cheap",
        visual_emoji="🪙",
        visual_alt_en="A single coin for a low price",
        visual_alt_es="Una moneda para un precio bajo",
        visual_alt_he="מטבע אחד למחיר נמוך",
        example_he="זֶה זוֹל מְאֹד.",
        example_en="This is very cheap.",
        example_es="Esto es muy barato.",
        example_romanization="Ze zol meod.",
        gender="masculine",
    ),
    _starter_concept(
        word="יקר",
        niqqud="יָקָר",
        romanization="yakar",
        pos="adjective",
        gloss_en="expensive",
        gloss_es="caro",
        category="shopping",
        level="A1",
        visual_key="shopping.expensive",
        visual_emoji="💎",
        visual_alt_en="A valuable gem for a high price",
        visual_alt_es="Una gema valiosa para un precio alto",
        visual_alt_he="אבן יקרה למחיר גבוה",
        example_he="זֶה יָקָר מִדַּי.",
        example_en="This is too expensive.",
        example_es="Esto es demasiado caro.",
        example_romanization="Ze yakar midai.",
        gender="masculine",
    ),
    _starter_concept(
        word="לקנות",
        niqqud="לִקְנוֹת",
        romanization="liknot",
        pos="verb",
        gloss_en="to buy",
        gloss_es="comprar",
        category="shopping",
        level="A1",
        visual_key="shopping.buy",
        visual_emoji="🛍️",
        visual_alt_en="Shopping bags after a purchase",
        visual_alt_es="Bolsas después de una compra",
        visual_alt_he="שקיות לאחר קנייה",
        example_he="אֲנִי רוֹצָה לִקְנוֹת לֶחֶם.",
        example_en="I want to buy bread.",
        example_es="Quiero comprar pan.",
        example_romanization="Ani rotsa liknot lekhem.",
        root="קנה",
        binyan="pa'al",
    ),
    _starter_concept(
        word="רופא",
        niqqud="רוֹפֵא",
        romanization="rofe",
        pos="noun",
        gloss_en="doctor",
        gloss_es="médico",
        category="health",
        level="A1",
        visual_key="health.doctor",
        visual_emoji="🧑‍⚕️",
        visual_alt_en="A healthcare professional",
        visual_alt_es="Un profesional de la salud",
        visual_alt_he="איש צוות רפואי",
        example_he="אֲנִי צְרִיכָה רוֹפֵא.",
        example_en="I need a doctor.",
        example_es="Necesito un médico.",
        example_romanization="Ani tsrikha rofe.",
        gender="masculine",
    ),
    _starter_concept(
        word="תרופה",
        niqqud="תְּרוּפָה",
        romanization="trufa",
        pos="noun",
        gloss_en="medicine",
        gloss_es="medicina",
        category="health",
        level="A1",
        visual_key="health.medicine",
        visual_emoji="💊",
        visual_alt_en="A medicine capsule",
        visual_alt_es="Una cápsula de medicina",
        visual_alt_he="כמוסת תרופה",
        example_he="אֲנִי לוֹקַחַת תְּרוּפָה.",
        example_en="I take medicine.",
        example_es="Tomo una medicina.",
        example_romanization="Ani lokakhat trufa.",
        gender="feminine",
    ),
    _starter_concept(
        word="כאב",
        niqqud="כְּאֵב",
        romanization="keev",
        pos="noun",
        gloss_en="pain",
        gloss_es="dolor",
        category="health",
        level="A1",
        visual_key="health.pain",
        visual_emoji="🤕",
        visual_alt_en="A face with a bandage showing pain",
        visual_alt_es="Una cara con venda que muestra dolor",
        visual_alt_he="פנים עם תחבושת שמראות כאב",
        example_he="יֵשׁ לִי כְּאֵב רֹאשׁ.",
        example_en="I have a headache.",
        example_es="Me duele la cabeza.",
        example_romanization="Yesh li keev rosh.",
        gender="masculine",
    ),
    _starter_concept(
        word="חולה",
        niqqud="חוֹלֶה",
        romanization="khole",
        pos="adjective",
        gloss_en="sick",
        gloss_es="enfermo",
        category="health",
        level="A1",
        visual_key="health.sick",
        visual_emoji="🤒",
        visual_alt_en="A face with a thermometer",
        visual_alt_es="Una cara con termómetro",
        visual_alt_he="פנים עם מדחום",
        example_he="אֲנִי חוֹלָה הַיּוֹם.",
        example_en="I am sick today.",
        example_es="Estoy enferma hoy.",
        example_romanization="Ani khola ha-yom.",
        gender="masculine",
    ),
    _starter_concept(
        word="בריא",
        niqqud="בָּרִיא",
        romanization="bari",
        pos="adjective",
        gloss_en="healthy",
        gloss_es="saludable",
        category="health",
        level="A1",
        visual_key="health.healthy",
        visual_emoji="💚",
        visual_alt_en="A green heart representing health",
        visual_alt_es="Un corazón verde que representa salud",
        visual_alt_he="לב ירוק שמייצג בריאות",
        example_he="חָשׁוּב לֶאֱכֹל אֹכֶל בָּרִיא.",
        example_en="It is important to eat healthy food.",
        example_es="Es importante comer comida saludable.",
        example_romanization="Khashuv leekhol okhel bari.",
        gender="masculine",
    ),
    _starter_concept(
        word="עזרה",
        niqqud="עֶזְרָה",
        romanization="ezra",
        pos="noun",
        gloss_en="help",
        gloss_es="ayuda",
        category="health",
        level="A1",
        visual_key="health.help",
        visual_emoji="🆘",
        visual_alt_en="An emergency help sign",
        visual_alt_es="Una señal de ayuda de emergencia",
        visual_alt_he="סימן לעזרה דחופה",
        example_he="אֲנִי צְרִיכָה עֶזְרָה.",
        example_en="I need help.",
        example_es="Necesito ayuda.",
        example_romanization="Ani tsrikha ezra.",
        gender="feminine",
    ),
)

# Keep the original 48 source identities stable, then add the reviewed v2.5
# and v2.8 layers. Existing databases are updated in place and receive only
# missing rows.
DEMO_ENTRIES += EXPANDED_STARTER_ENTRIES
DEMO_ENTRIES += LEARNING_EXPANSION_ENTRIES
DEMO_ENTRIES += A2_EXPANSION_ENTRIES
validate_starter_vocabulary(DEMO_ENTRIES)


@dataclass(frozen=True, slots=True)
class ImportStats:
    """Summarize one dictionary import.

    Args:
        records_read: JSONL records visited.
        entries_imported: Valid Hebrew entries written.
        entries_skipped: Invalid or unsupported records.
        senses_imported: Sense rows written.
        forms_imported: Form rows written.
        examples_imported: Example rows written.
        sounds_imported: Sound rows written.

    Example:
        >>> ImportStats(1, 1, 0, 1, 0, 0, 0).entries_imported
        1
    """

    records_read: int
    entries_imported: int
    entries_skipped: int
    senses_imported: int
    forms_imported: int
    examples_imported: int
    sounds_imported: int


class DictionaryStore:
    """Own the rebuildable Hebrew dictionary database.

    Args:
        path: SQLite file path. `:memory:` is supported by tests.

    Example:
        >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
        96
    """

    def __init__(self, path: Path) -> None:
        self.path = path
        self._memory_connection: sqlite3.Connection | None = None

    def connect(self) -> sqlite3.Connection:
        """Open a configured dictionary connection.

        Returns:
            SQLite connection with foreign keys and row dictionaries.

        Raises:
            sqlite3.Error: If the database cannot be opened.

        Example:
            >>> DictionaryStore(Path(":memory:")).connect().execute("SELECT 1").fetchone()[0]
            1
        """
        if str(self.path) == ":memory:":
            if self._memory_connection is None:
                self._memory_connection = sqlite3.connect(
                    ":memory:", timeout=20, check_same_thread=False
                )
                self._configure(self._memory_connection)
            return self._memory_connection

        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=20, check_same_thread=False)
        self._configure(connection)
        return connection

    @staticmethod
    def _configure(connection: sqlite3.Connection) -> None:
        """Configure a dictionary connection.

        Args:
            connection: SQLite connection.

        Returns:
            None.

        Example:
            >>> connection = sqlite3.connect(":memory:")
            >>> DictionaryStore._configure(connection)
        """
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 10000")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = NORMAL")

    def initialize(self) -> None:
        """Create dictionary tables and metadata.

        Returns:
            None.

        Raises:
            sqlite3.Error: If schema creation fails.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize()
        """
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        refresh_starter = False
        try:
            connection.executescript(DICTIONARY_SCHEMA)
            for column_definition in (
                "level TEXT",
                "category TEXT",
                "visual_key TEXT",
                "visual_id TEXT",
                "visual_emoji TEXT",
                "visual_alt_en TEXT",
                "visual_alt_es TEXT",
                "visual_alt_he TEXT",
                "provenance TEXT",
                "reading_hints_json TEXT NOT NULL DEFAULT '[]'",
            ):
                self._ensure_column(connection, "dictionary_senses", column_definition)
            self._ensure_column(connection, "dictionary_examples", "translation_es TEXT")
            connection.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_dictionary_visual_key "
                "ON dictionary_senses(visual_key) WHERE visual_key IS NOT NULL"
            )
            refresh_starter = bool(
                connection.execute("SELECT COUNT(*) FROM dictionary_entries").fetchone()[0]
            )
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('schema_version', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (str(DICTIONARY_SCHEMA_VERSION),),
            )
            connection.commit()
        finally:
            if should_close:
                connection.close()
        if refresh_starter:
            # Upgrade the rebuildable built-in dataset while retaining entry IDs that
            # may already be referenced by a learner's saved-word history.
            self.seed_demo()

    @staticmethod
    def _ensure_column(connection: sqlite3.Connection, table: str, column_definition: str) -> None:
        """Add one allow-listed dictionary column to an older database."""
        allowed_definitions = {
            "dictionary_senses": {
                "level TEXT",
                "category TEXT",
                "visual_key TEXT",
                "visual_id TEXT",
                "visual_emoji TEXT",
                "visual_alt_en TEXT",
                "visual_alt_es TEXT",
                "visual_alt_he TEXT",
                "provenance TEXT",
                "reading_hints_json TEXT NOT NULL DEFAULT '[]'",
            },
            "dictionary_examples": {"translation_es TEXT"},
        }
        if column_definition not in allowed_definitions.get(table, set()):
            raise ValueError("Unsupported dictionary schema column")
        column_name = column_definition.split(" ", maxsplit=1)[0]
        columns = {
            str(row["name"]) for row in connection.execute(f"PRAGMA table_info({table})").fetchall()
        }
        if column_name not in columns:
            connection.execute(f"ALTER TABLE {table} ADD COLUMN {column_definition}")

    def seed_demo(self) -> int:
        """Install the reviewed 240-concept visual starter vocabulary.

        Returns:
            Number of new entries inserted.

        Raises:
            sqlite3.Error: If an insert fails.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize()
            >>> store.seed_demo() > 0
            True
        """
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        inserted = 0
        try:
            for entry in DEMO_ENTRIES:
                source_key = entry.get("source_key") or (
                    f"builtin:{normalize_hebrew(entry['word'])}:{entry['pos']}"
                )
                existing = connection.execute(
                    "SELECT id FROM dictionary_entries WHERE source_key = ?", (source_key,)
                ).fetchone()
                entry_values = (
                    entry["word"],
                    normalize_hebrew(entry["word"]),
                    entry.get("pos"),
                    entry.get("romanization"),
                    entry.get("root"),
                    entry.get("binyan"),
                    entry.get("gender"),
                    STARTER_SOURCE_NAME,
                    STARTER_SOURCE_URL,
                    STARTER_LICENSE,
                    json.dumps(entry, ensure_ascii=False, separators=(",", ":")),
                )
                if existing is None:
                    cursor = connection.execute(
                        """
                        INSERT INTO dictionary_entries(
                            source_key, word, normalized_word, pos, romanization,
                            root, binyan, gender, source_name, source_url,
                            license_name, raw_json
                        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (source_key, *entry_values),
                    )
                    entry_id_raw = cursor.lastrowid
                    if entry_id_raw is None:
                        raise sqlite3.DatabaseError("SQLite did not return an entry ID")
                    entry_id = int(entry_id_raw)
                    inserted += 1
                else:
                    entry_id = int(existing["id"])
                    connection.execute(
                        """
                        UPDATE dictionary_entries
                        SET word = ?, normalized_word = ?, pos = ?, romanization = ?,
                            root = ?, binyan = ?, gender = ?, source_name = ?,
                            source_url = ?, license_name = ?, raw_json = ?
                        WHERE id = ?
                        """,
                        (*entry_values, entry_id),
                    )
                    connection.execute(
                        "DELETE FROM dictionary_senses WHERE entry_id = ?", (entry_id,)
                    )
                    connection.execute(
                        "DELETE FROM dictionary_forms WHERE entry_id = ?", (entry_id,)
                    )
                    connection.execute(
                        "DELETE FROM dictionary_examples WHERE entry_id = ?", (entry_id,)
                    )
                connection.execute(
                    """
                    INSERT INTO dictionary_senses(
                        entry_id, sense_order, gloss_en, gloss_es, level, category,
                        visual_key, visual_id, visual_emoji, visual_alt_en, visual_alt_es,
                        visual_alt_he, provenance, reading_hints_json, tags_json, topics_json
                    ) VALUES(?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        entry_id,
                        entry.get("gloss_en"),
                        entry.get("gloss_es"),
                        entry.get("level"),
                        entry.get("category"),
                        entry.get("visual_key"),
                        entry.get("visual_id", entry.get("visual_key")),
                        entry.get("visual_emoji"),
                        entry.get("visual_alt_en"),
                        entry.get("visual_alt_es"),
                        entry.get("visual_alt_he"),
                        entry.get("provenance"),
                        json.dumps(entry.get("reading_hints", []), ensure_ascii=False),
                        json.dumps(["beginner", str(entry.get("level", "")).lower()]),
                        json.dumps([entry.get("category")]),
                    ),
                )
                for form in entry.get("forms", []):
                    connection.execute(
                        """
                        INSERT INTO dictionary_forms(
                            entry_id, form, normalized_form, tags_json, romanization
                        ) VALUES(?, ?, ?, ?, ?)
                        """,
                        (
                            entry_id,
                            form["form"],
                            normalize_hebrew(form["form"]),
                            json.dumps(form.get("tags", [])),
                            form.get("romanization"),
                        ),
                    )
                for example in entry.get("examples", []):
                    connection.execute(
                        """
                        INSERT INTO dictionary_examples(
                            entry_id, hebrew_text, translation_en, translation_es, romanization
                        ) VALUES(?, ?, ?, ?, ?)
                        """,
                        (
                            entry_id,
                            example["hebrew"],
                            example.get("translation_en"),
                            example.get("translation_es"),
                            example.get("romanization"),
                        ),
                    )
            non_starter_sources = {
                str(row["source_name"])
                for row in connection.execute(
                    "SELECT DISTINCT source_name FROM dictionary_entries WHERE source_name <> ?",
                    (STARTER_SOURCE_NAME,),
                ).fetchall()
            }
            if not non_starter_sources:
                dataset_name = "starter_visual_vocabulary_v4"
                dataset_license = STARTER_LICENSE
                connection.execute(
                    "INSERT INTO dictionary_meta(key, value) VALUES('source_url', ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (STARTER_SOURCE_URL,),
                )
            elif non_starter_sources == {"Kaikki / English Wiktionary"}:
                dataset_name = "Kaikki/Wiktionary Hebrew + starter_visual_vocabulary_v4"
                dataset_license = (
                    "Mixed per-entry licenses: MIT starter data; CC BY-SA 4.0 / GFDL Kaikki"
                )
            else:
                dataset_name = "mixed_with_starter_visual_vocabulary_v4"
                dataset_license = "Mixed dataset; see each entry's license_name"
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('dataset', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (dataset_name,),
            )
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('starter_entries', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (str(len(DEMO_ENTRIES)),),
            )
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('license', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (dataset_license,),
            )
            connection.commit()
            return inserted
        except Exception:
            connection.rollback()
            raise
        finally:
            if should_close:
                connection.close()

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        """Search Hebrew, romanization, forms, and English/Spanish glosses.

        Args:
            query: Hebrew word/form or translation text.
            limit: Maximum number of entry cards.

        Returns:
            Rich dictionary cards ordered by exactness.

        Raises:
            ValueError: If query is empty or limit is invalid.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
            >>> store.search("mother")[0]["word"]
            'אמא'
        """
        raw_query = query.strip()
        if not raw_query:
            raise ValueError("query is required")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")

        normalized = normalize_hebrew(raw_query)
        like_normalized = f"%{normalized}%"
        folded_query = raw_query.casefold()
        like_raw = f"%{folded_query}%"
        like_root = f"%{raw_query}%"
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            rows = connection.execute(
                """
                SELECT e.id,
                    MIN(CASE
                        WHEN e.normalized_word = ? THEN 0
                        WHEN f.normalized_form = ? THEN 1
                        WHEN lower(COALESCE(e.romanization, '')) = ? THEN 2
                        WHEN lower(COALESCE(s.gloss_en, '')) = ?
                          OR lower(COALESCE(s.gloss_es, '')) = ? THEN 3
                        WHEN e.normalized_word LIKE ? THEN 4
                        WHEN f.normalized_form LIKE ? THEN 5
                        WHEN lower(COALESCE(e.romanization, '')) LIKE ? THEN 6
                        WHEN e.root = ? THEN 7
                        ELSE 8
                    END) AS rank,
                    MAX(CASE WHEN s.visual_key IS NOT NULL THEN 1 ELSE 0 END) AS curated
                FROM dictionary_entries e
                LEFT JOIN dictionary_forms f ON f.entry_id = e.id
                LEFT JOIN dictionary_senses s ON s.entry_id = e.id
                WHERE e.normalized_word LIKE ?
                   OR f.normalized_form LIKE ?
                   OR lower(COALESCE(e.romanization, '')) LIKE ?
                   OR lower(COALESCE(s.gloss_en, '')) LIKE ?
                   OR lower(COALESCE(s.gloss_es, '')) LIKE ?
                   OR COALESCE(e.root, '') LIKE ?
                GROUP BY e.id
                ORDER BY rank, curated DESC, length(e.word), e.word
                LIMIT ?
                """,
                (
                    normalized,
                    normalized,
                    folded_query,
                    folded_query,
                    folded_query,
                    f"{normalized}%",
                    f"{normalized}%",
                    f"{folded_query}%",
                    raw_query,
                    like_normalized,
                    like_normalized,
                    like_raw,
                    like_raw,
                    like_raw,
                    like_root,
                    limit,
                ),
            ).fetchall()
            return [self._entry_card(connection, int(row["id"])) for row in rows]
        finally:
            if should_close:
                connection.close()

    def browse(self, category: str, limit: int = 24) -> list[dict[str, Any]]:
        """Return reviewed entry cards for one vocabulary category.

        Args:
            category: Reviewed starter category key, e.g. ``"weather"``.
            limit: Maximum number of entry cards.

        Returns:
            Curated-first cards ordered by level then Hebrew word.

        Raises:
            ValueError: If category is empty or limit is invalid.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
            >>> store.browse("greetings")[0]["senses"][0]["category"]
            'greetings'
        """
        normalized_category = category.strip().lower()
        if not normalized_category:
            raise ValueError("category is required")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            rows = connection.execute(
                """
                SELECT e.id,
                    MAX(CASE WHEN s.visual_key IS NOT NULL THEN 1 ELSE 0 END) AS curated,
                    MIN(COALESCE(s.level, 'Z9')) AS level
                FROM dictionary_entries e
                JOIN dictionary_senses s ON s.entry_id = e.id
                WHERE lower(COALESCE(s.category, '')) = ?
                GROUP BY e.id
                ORDER BY curated DESC, level, e.word
                LIMIT ?
                """,
                (normalized_category, limit),
            ).fetchall()
            return [self._entry_card(connection, int(row["id"])) for row in rows]
        finally:
            if should_close:
                connection.close()

    def lookup(self, word: str, limit: int = 12) -> list[dict[str, Any]]:
        """Resolve an exact Hebrew word or inflected form.

        Args:
            word: Clicked Hebrew token.
            limit: Maximum homographs/parts of speech.

        Returns:
            Exact dictionary cards, then prefix fallback results.

        Raises:
            ValueError: If word is empty.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
            >>> store.lookup("שָׁלוֹם")[0]["word"]
            'שלום'
        """
        normalized = normalize_hebrew(word)
        if not normalized:
            raise ValueError("word is required")
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            rows = connection.execute(
                """
                SELECT DISTINCT e.id,
                    CASE WHEN e.normalized_word = ? THEN 0 ELSE 1 END AS rank,
                    CASE WHEN EXISTS(
                        SELECT 1 FROM dictionary_senses curated
                        WHERE curated.entry_id = e.id AND curated.visual_key IS NOT NULL
                    ) THEN 1 ELSE 0 END AS curated
                FROM dictionary_entries e
                LEFT JOIN dictionary_forms f ON f.entry_id = e.id
                WHERE e.normalized_word = ? OR f.normalized_form = ?
                ORDER BY rank, curated DESC, e.pos
                LIMIT ?
                """,
                (normalized, normalized, normalized, limit),
            ).fetchall()
            if not rows:
                # A clicked token may contain a Hebrew prefix such as ו/ב/ל/כ/מ/ש.
                stripped = (
                    normalized[1:]
                    if len(normalized) > 2 and normalized[0] in "ובלכמשה"
                    else normalized
                )
                rows = connection.execute(
                    """
                    SELECT DISTINCT e.id, 2 AS rank,
                        CASE WHEN EXISTS(
                            SELECT 1 FROM dictionary_senses curated
                            WHERE curated.entry_id = e.id AND curated.visual_key IS NOT NULL
                        ) THEN 1 ELSE 0 END AS curated
                    FROM dictionary_entries e
                    LEFT JOIN dictionary_forms f ON f.entry_id = e.id
                    WHERE e.normalized_word = ? OR f.normalized_form = ?
                    ORDER BY curated DESC, e.pos
                    LIMIT ?
                    """,
                    (stripped, stripped, limit),
                ).fetchall()
            return [self._entry_card(connection, int(row["id"])) for row in rows]
        finally:
            if should_close:
                connection.close()

    def get(self, entry_id: int) -> dict[str, Any]:
        """Return one complete entry card.

        Args:
            entry_id: Dictionary entry ID.

        Returns:
            Entry card.

        Raises:
            KeyError: If the entry does not exist.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
            >>> store.get(1)["word"]
            'שלום'
        """
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            return self._entry_card(connection, entry_id)
        finally:
            if should_close:
                connection.close()

    def _entry_card(self, connection: sqlite3.Connection, entry_id: int) -> dict[str, Any]:
        """Hydrate an entry and all linked language information.

        Args:
            connection: Active dictionary connection.
            entry_id: Entry ID.

        Returns:
            JSON-ready entry card.

        Raises:
            KeyError: If entry does not exist.

        Example:
            Used by `search`, `lookup`, and `get`.
        """
        row = connection.execute(
            "SELECT * FROM dictionary_entries WHERE id = ?", (entry_id,)
        ).fetchone()
        if row is None:
            raise KeyError(f"Dictionary entry {entry_id} not found")

        senses: list[dict[str, Any]] = []
        for sense in connection.execute(
            "SELECT * FROM dictionary_senses WHERE entry_id = ? ORDER BY sense_order",
            (entry_id,),
        ).fetchall():
            sense_card = {
                **dict(sense),
                "tags": json.loads(sense["tags_json"]),
                "topics": json.loads(sense["topics_json"]),
                "reading_hints": json.loads(sense["reading_hints_json"]),
            }
            sense_card.pop("reading_hints_json", None)
            visual_fields = (
                sense["visual_key"],
                sense["visual_emoji"],
                sense["visual_alt_en"],
                sense["visual_alt_es"],
                sense["visual_alt_he"],
            )
            sense_card["visual"] = (
                {
                    "key": sense["visual_key"],
                    "emoji": sense["visual_emoji"],
                    "alt": {
                        "en": sense["visual_alt_en"],
                        "es": sense["visual_alt_es"],
                        "he": sense["visual_alt_he"],
                    },
                }
                if all(visual_fields)
                else None
            )
            senses.append(sense_card)
        forms = [
            {
                **dict(form),
                "tags": json.loads(form["tags_json"]),
            }
            for form in connection.execute(
                "SELECT * FROM dictionary_forms WHERE entry_id = ? ORDER BY id",
                (entry_id,),
            ).fetchall()
        ]
        examples = [
            dict(example)
            for example in connection.execute(
                "SELECT * FROM dictionary_examples WHERE entry_id = ? ORDER BY id LIMIT 12",
                (entry_id,),
            ).fetchall()
        ]
        sounds = [
            {
                **dict(sound),
                "tags": json.loads(sound["tags_json"]),
            }
            for sound in connection.execute(
                "SELECT * FROM dictionary_sounds WHERE entry_id = ? ORDER BY id LIMIT 12",
                (entry_id,),
            ).fetchall()
        ]
        card = dict(row)
        card.pop("raw_json", None)
        beginner_sense = next((sense for sense in senses if sense["visual"] is not None), None)
        card.update(
            {
                "senses": senses,
                "forms": forms,
                "examples": examples,
                "sounds": sounds,
                "display_niqqud": next(
                    (form["form"] for form in forms if "with-niqqud" in form["tags"]),
                    row["word"],
                ),
                "level": beginner_sense["level"] if beginner_sense else None,
                "category": beginner_sense["category"] if beginner_sense else None,
                "visual": beginner_sense["visual"] if beginner_sense else None,
            }
        )
        return card

    def close(self) -> None:
        """Close the retained in-memory connection, if any.

        Returns:
            None.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.close()
        """
        if self._memory_connection is not None:
            self._memory_connection.close()
            self._memory_connection = None

    def stats(self) -> dict[str, Any]:
        """Return dataset size and provenance metadata.

        Returns:
            Dictionary statistics.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
            >>> store.stats()["entries"]
            96
        """
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            metadata = {
                row["key"]: row["value"]
                for row in connection.execute("SELECT * FROM dictionary_meta").fetchall()
            }
            return {
                "entries": int(
                    connection.execute("SELECT COUNT(*) FROM dictionary_entries").fetchone()[0]
                ),
                "senses": int(
                    connection.execute("SELECT COUNT(*) FROM dictionary_senses").fetchone()[0]
                ),
                "forms": int(
                    connection.execute("SELECT COUNT(*) FROM dictionary_forms").fetchone()[0]
                ),
                "examples": int(
                    connection.execute("SELECT COUNT(*) FROM dictionary_examples").fetchone()[0]
                ),
                "sounds": int(
                    connection.execute("SELECT COUNT(*) FROM dictionary_sounds").fetchone()[0]
                ),
                "metadata": metadata,
            }
        finally:
            if should_close:
                connection.close()

    def import_jsonl(
        self,
        source: Path,
        *,
        replace: bool = True,
        batch_size: int = 500,
        max_records: int | None = None,
        source_url: str | None = None,
    ) -> ImportStats:
        """Stream a Kaikki/Wiktionary-style JSONL dictionary into SQLite.

        Args:
            source: UTF-8 JSONL path.
            replace: Whether to replace a previously imported dictionary.
            batch_size: Commit interval to bound memory and lock duration.
            max_records: Optional record limit for tests or previews.
            source_url: Optional dataset attribution URL used when a record omits one.

        Returns:
            Import counters.

        Raises:
            FileNotFoundError: If source is missing.
            ValueError: If batch size is invalid.
            sqlite3.Error: If persistence fails.

        Example:
            >>> # See backend/tests/test_dictionary.py for a compact fixture.
            >>> isinstance(batch_size := 500, int)
            True
        """
        if not source.exists():
            raise FileNotFoundError(f"Dictionary file not found: {source}")
        if batch_size < 1:
            raise ValueError("batch_size must be positive")

        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        counters = {
            "records_read": 0,
            "entries_imported": 0,
            "entries_skipped": 0,
            "senses_imported": 0,
            "forms_imported": 0,
            "examples_imported": 0,
            "sounds_imported": 0,
        }
        try:
            if replace:
                connection.executescript(
                    """
                    DELETE FROM dictionary_sounds;
                    DELETE FROM dictionary_examples;
                    DELETE FROM dictionary_forms;
                    DELETE FROM dictionary_senses;
                    DELETE FROM dictionary_entries;
                    DELETE FROM dictionary_meta
                    WHERE key IN ('dataset', 'source_file', 'source_url', 'license', 'starter_entries');
                    """
                )
                connection.commit()

            for record in iter_jsonl(source, max_records=max_records):
                counters["records_read"] += 1
                try:
                    inserted = self._import_record(
                        connection, record, counters, source_url=source_url
                    )
                except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
                    LOGGER.debug("Skipping malformed dictionary record: %s", error)
                    inserted = False
                if inserted:
                    counters["entries_imported"] += 1
                else:
                    counters["entries_skipped"] += 1
                if counters["records_read"] % batch_size == 0:
                    connection.commit()
                    LOGGER.info(
                        "Imported %s dictionary records",
                        counters["records_read"],
                    )

            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('dataset', 'Kaikki/Wiktionary Hebrew') "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
            )
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('source_file', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (source.name,),
            )
            if source_url:
                connection.execute(
                    "INSERT INTO dictionary_meta(key, value) VALUES('source_url', ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (source_url,),
                )
            else:
                connection.execute("DELETE FROM dictionary_meta WHERE key = 'source_url'")
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('license', 'CC BY-SA 4.0 / GFDL') "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
            )
            connection.commit()
            stats = ImportStats(**counters)
        finally:
            if should_close:
                connection.close()
        # The reviewed beginner layer is additive to an imported broad lexicon.
        # Imported entries retain their own source/license and never receive guessed visuals.
        self.seed_demo()
        return stats

    def _import_record(
        self,
        connection: sqlite3.Connection,
        record: dict[str, Any],
        counters: dict[str, int],
        *,
        source_url: str | None = None,
    ) -> bool:
        """Normalize and insert one Kaikki-like dictionary record.

        Args:
            connection: Active SQLite connection.
            record: Parsed JSON record.
            counters: Mutable child-row counters.
            source_url: Fallback dataset attribution URL.

        Returns:
            Whether a new entry was inserted.

        Example:
            Used only by `import_jsonl`.
        """
        word = str(record.get("word", "")).strip()
        language_code = str(record.get("lang_code", "he")).lower()
        language_name = str(record.get("lang", "Hebrew"))
        if not word or language_code not in {"he", "heb"}:
            return False
        normalized = normalize_hebrew(word)
        if not normalized:
            return False

        pos = str(record.get("pos", "unknown"))
        senses = record.get("senses") or []
        source_key = self._source_key(record, normalized, pos)
        romanization = self._first_romanization(record)
        root = self._extract_root(record)
        binyan = self._extract_binyan(record)
        gender = self._extract_gender(record)
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO dictionary_entries(
                source_key, word, normalized_word, pos, language_code,
                language_name, romanization, root, binyan, gender, etymology,
                source_name, source_url, license_name, raw_json
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                source_key,
                word,
                normalized,
                pos,
                language_code,
                language_name,
                romanization,
                root,
                binyan,
                gender,
                record.get("etymology_text"),
                "Kaikki / English Wiktionary",
                record.get("source") or source_url or "https://en.wiktionary.org/",
                "CC BY-SA 4.0 / GFDL",
                json.dumps(record, ensure_ascii=False, separators=(",", ":")),
            ),
        )
        if cursor.rowcount == 0:
            return False
        entry_id_raw = cursor.lastrowid
        if entry_id_raw is None:
            raise sqlite3.DatabaseError("SQLite did not return an entry ID")
        entry_id = int(entry_id_raw)

        for order, sense in enumerate(senses):
            glosses = [
                str(gloss).strip() for gloss in sense.get("glosses", []) if str(gloss).strip()
            ]
            raw_glosses = [
                str(gloss).strip() for gloss in sense.get("raw_glosses", []) if str(gloss).strip()
            ]
            gloss_en = "; ".join(glosses or raw_glosses) or None
            connection.execute(
                """
                INSERT INTO dictionary_senses(
                    entry_id, sense_order, gloss_en, tags_json, topics_json
                ) VALUES(?, ?, ?, ?, ?)
                """,
                (
                    entry_id,
                    order,
                    gloss_en,
                    json.dumps(sense.get("tags", [])),
                    json.dumps(sense.get("topics", [])),
                ),
            )
            counters["senses_imported"] += 1
            for example in sense.get("examples", []) or []:
                text = str(example.get("text", "")).strip()
                if not text:
                    continue
                connection.execute(
                    """
                    INSERT INTO dictionary_examples(
                        entry_id, hebrew_text, translation_en, romanization, source_text
                    ) VALUES(?, ?, ?, ?, ?)
                    """,
                    (
                        entry_id,
                        text,
                        example.get("english") or example.get("translation"),
                        example.get("roman"),
                        example.get("ref"),
                    ),
                )
                counters["examples_imported"] += 1

        seen_forms: set[tuple[str, str]] = set()
        for form in record.get("forms", []) or []:
            form_text = str(form.get("form", "")).strip()
            if not form_text:
                continue
            normalized_form = normalize_hebrew(form_text)
            if not normalized_form:
                continue
            tags = [str(tag) for tag in form.get("tags", [])]
            signature = (normalized_form, json.dumps(tags, sort_keys=True))
            if signature in seen_forms:
                continue
            seen_forms.add(signature)
            connection.execute(
                """
                INSERT INTO dictionary_forms(
                    entry_id, form, normalized_form, tags_json, romanization
                ) VALUES(?, ?, ?, ?, ?)
                """,
                (
                    entry_id,
                    form_text,
                    normalized_form,
                    json.dumps(tags),
                    form.get("roman"),
                ),
            )
            counters["forms_imported"] += 1

        for sound in record.get("sounds", []) or []:
            audio_url = sound.get("mp3_url") or sound.get("ogg_url")
            ipa = sound.get("ipa")
            sound_romanization = sound.get("roman")
            if not any((audio_url, ipa, sound_romanization)):
                continue
            connection.execute(
                """
                INSERT INTO dictionary_sounds(
                    entry_id, audio_url, ipa, romanization, tags_json
                ) VALUES(?, ?, ?, ?, ?)
                """,
                (
                    entry_id,
                    audio_url,
                    ipa,
                    sound_romanization,
                    json.dumps(sound.get("tags", [])),
                ),
            )
            counters["sounds_imported"] += 1
        return True

    @staticmethod
    def _source_key(record: dict[str, Any], normalized: str, pos: str) -> str:
        """Build a stable source identity from available Wiktionary fields.

        Args:
            record: Dictionary record.
            normalized: Niqqud-insensitive word.
            pos: Part of speech.

        Returns:
            Stable key.

        Example:
            >>> DictionaryStore._source_key({}, "שלום", "noun")
            'kaikki:שלום:noun:0:0'
        """
        etymology = record.get("etymology_number", 0)
        sense_id = record.get("senseid") or record.get("id") or 0
        return f"kaikki:{normalized}:{pos}:{etymology}:{sense_id}"

    @staticmethod
    def _first_romanization(record: dict[str, Any]) -> str | None:
        """Extract the first useful romanization.

        Args:
            record: Kaikki-like record.

        Returns:
            Romanization or None.

        Example:
            >>> DictionaryStore._first_romanization({"sounds": [{"roman": "shalom"}]})
            'shalom'
        """
        for sound in record.get("sounds", []) or []:
            if sound.get("roman"):
                return str(sound["roman"])
        for form in record.get("forms", []) or []:
            if form.get("roman"):
                return str(form["roman"])
        return None

    @staticmethod
    def _extract_root(record: dict[str, Any]) -> str | None:
        """Extract a root from form tags or head-template arguments.

        Args:
            record: Kaikki-like record.

        Returns:
            Root string when discoverable.

        Example:
            >>> DictionaryStore._extract_root({"head_templates": [{"args": {"root": "כתב"}}]})
            'כתב'
        """
        for template in record.get("head_templates", []) or []:
            args = template.get("args") or {}
            for key in ("root", "שורש", "tr"):
                candidate = args.get(key)
                if candidate and any("\u0590" <= char <= "\u05ff" for char in str(candidate)):
                    return str(candidate)
        return None

    @staticmethod
    def _extract_binyan(record: dict[str, Any]) -> str | None:
        """Extract an explicitly tagged Hebrew verb pattern.

        Args:
            record: Kaikki-like record.

        Returns:
            Binyan label or None.

        Example:
            >>> DictionaryStore._extract_binyan({"categories": [{"name": "Hebrew pa'al verbs"}]})
            "pa'al"
        """
        known = ("pa'al", "nif'al", "pi'el", "pu'al", "hif'il", "huf'al", "hitpa'el")
        text = " ".join(
            str(category.get("name", "")) for category in record.get("categories", []) or []
        ).lower()
        return next((name for name in known if name in text), None)

    @staticmethod
    def _extract_gender(record: dict[str, Any]) -> str | None:
        """Extract grammatical gender from record tags.

        Args:
            record: Kaikki-like record.

        Returns:
            Normalized gender label or None.

        Example:
            >>> DictionaryStore._extract_gender({"senses": [{"tags": ["feminine"]}]})
            'feminine'
        """
        tags: list[str] = []
        tags.extend(str(tag).lower() for tag in record.get("tags", []) or [])
        for sense in record.get("senses", []) or []:
            tags.extend(str(tag).lower() for tag in sense.get("tags", []) or [])
        for gender in ("masculine", "feminine", "common-gender"):
            if gender in tags:
                return gender
        return None


def iter_jsonl(source: Path, max_records: int | None = None) -> Iterator[dict[str, Any]]:
    """Yield valid JSON objects from a UTF-8 JSONL file.

    Args:
        source: Input path.
        max_records: Optional line limit.

    Yields:
        Parsed dictionaries.

    Raises:
        json.JSONDecodeError: If a non-empty line is invalid JSON.

    Example:
        >>> # This generator is exercised with temporary files in tests.
        >>> isinstance(iter_jsonl(Path("missing")), Iterable)
        True
    """
    yielded = 0
    with source.open("r", encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            if max_records is not None and yielded >= max_records:
                break
            line = raw_line.strip()
            if not line:
                continue
            try:
                parsed = json.loads(line)
            except json.JSONDecodeError as error:
                raise json.JSONDecodeError(
                    f"Invalid JSONL at line {line_number}: {error.msg}",
                    error.doc,
                    error.pos,
                ) from error
            if isinstance(parsed, dict):
                yielded += 1
                yield parsed


def download_dictionary(
    url: str,
    destination: Path,
    *,
    timeout_seconds: int = 60,
    maximum_bytes: int = 600_000_000,
    session: requests.Session | None = None,
) -> Path:
    """Download an allow-listed dictionary file with streaming size limits.

    Args:
        url: HTTPS Kaikki URL.
        destination: Local JSONL destination.
        timeout_seconds: Connect/read timeout.
        maximum_bytes: Hard safety limit.
        session: Optional HTTP session for tests.

    Returns:
        Resolved destination path.

    Raises:
        ValueError: If URL or size is unsafe.
        requests.RequestException: If the request fails.
        OSError: If the destination cannot be written.

    Example:
        Use the CLI `--download-dictionary` command for a real download.
    """
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_DOWNLOAD_HOSTS:
        raise ValueError("Dictionary downloads are restricted to HTTPS Kaikki hosts")

    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_suffix(destination.suffix + ".part")
    client = session or requests.Session()
    total = 0
    try:
        with client.get(
            url,
            stream=True,
            timeout=(10, timeout_seconds),
            headers={"User-Agent": f"Ivrit-Sheli-Ultimate/{__version__}"},
        ) as response:
            response.raise_for_status()
            declared_size = int(response.headers.get("content-length", "0") or 0)
            if declared_size and declared_size > maximum_bytes:
                raise ValueError("Dictionary download exceeds configured size limit")
            with partial.open("wb") as handle:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if not chunk:
                        continue
                    total += len(chunk)
                    if total > maximum_bytes:
                        raise ValueError("Dictionary download exceeded configured size limit")
                    handle.write(chunk)
        partial.replace(destination)
    except Exception:
        partial.unlink(missing_ok=True)
        raise
    return destination.resolve()
