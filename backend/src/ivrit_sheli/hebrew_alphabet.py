"""Reviewed Modern Hebrew alphabet content and deterministic practice activities.

The catalog distinguishes the 22 Hebrew letters from the five positional final
forms.  It teaches mainstream Israeli pronunciation first while labelling
heritage variants honestly.  It deliberately avoids isolated-glyph TTS and any
claim of phoneme or accent scoring.
"""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Literal

ALPHABET_CONTRACT_VERSION = "2.9.1"
ALPHABET_CONTENT_REVISION = "2026-07-27.1"
ALPHABET_EDITORIAL_STATUS = "reviewed"
ACADEMY_OVERVIEW = "https://eng.hebrew-academy.org.il/overview-of-hebrew/"
ACADEMY_FINAL_FORMS = (
    "https://hebrew-academy.org.il/category/"
    "%D7%90%D7%95%D7%AA%D7%99%D7%95%D7%AA-%D7%A1%D7%95%D7%A4%D7%99%D7%95%D7%AA/"
)
ACADEMY_ORTHOGRAPHY = (
    "https://eng.hebrew-academy.org.il/our-work/language-decisions/orthography/"
)
UT_CONSONANTS = (
    "https://hebrew.laits.utexas.edu/drupal/themes/hebrewgrid/"
    "bh/bhonline/grammar/consonants.pdf"
)
CATALOG_SOURCES = (
    ACADEMY_OVERVIEW,
    ACADEMY_FINAL_FORMS,
    ACADEMY_ORTHOGRAPHY,
    UT_CONSONANTS,
)
SOURCE_REFERENCES = (
    (
        "academy_overview",
        "Academy of the Hebrew Language: Overview of Hebrew",
        ACADEMY_OVERVIEW,
    ),
    (
        "academy_final_forms",
        "Academy of the Hebrew Language: Final letters",
        ACADEMY_FINAL_FORMS,
    ),
    (
        "academy_orthography",
        "Academy of the Hebrew Language: Orthography decisions",
        ACADEMY_ORTHOGRAPHY,
    ),
    (
        "ut_consonants",
        "University of Texas at Austin: Hebrew consonants",
        UT_CONSONANTS,
    ),
)

SoundUsage = Literal["common", "contextual", "heritage"]


class AlphabetConflictError(RuntimeError):
    """Raised when an alphabet activity is stale or replayed inconsistently."""


@dataclass(frozen=True, slots=True)
class LocalizedText:
    """One immutable trilingual learner-facing string."""

    en: str
    es: str
    he: str

    def to_dict(self) -> dict[str, str]:
        """Return a JSON-ready copy."""
        return {"en": self.en, "es": self.es, "he": self.he}


@dataclass(frozen=True, slots=True)
class SoundVariant:
    """One reviewed pronunciation or orthographic use of a letter."""

    key: str
    form: str
    ipa: str
    approximation: LocalizedText
    context: LocalizedText
    usage: SoundUsage = "common"

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-ready copy."""
        return {
            "key": self.key,
            "form": self.form,
            "ipa": self.ipa,
            "approximation": self.approximation.to_dict(),
            "context": self.context.to_dict(),
            "usage": self.usage,
            "mastery_required": self.usage == "common",
        }


@dataclass(frozen=True, slots=True)
class AlphabetExample:
    """One reviewed example that anchors a letter in a familiar word."""

    word: str
    niqqud: str
    transliteration: str
    meaning: LocalizedText

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-ready copy."""
        return {
            "word": self.word,
            "niqqud": self.niqqud,
            "transliteration": self.transliteration,
            "meaning": self.meaning.to_dict(),
            "dictionary_query": self.word,
        }


@dataclass(frozen=True, slots=True)
class AlphabetUnit:
    """One base letter or positional final-form learning unit."""

    key: str
    order: int
    letter: str
    base_key: str
    is_final: bool
    name: LocalizedText
    name_niqqud: str
    transliteration: str
    sounds: tuple[SoundVariant, ...]
    explanation: LocalizedText
    example: AlphabetExample
    confusions: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        """Return the reviewed public contract without mutable shared state."""
        modern_ipas = {
            sound.ipa for sound in self.sounds if sound.usage != "heritage"
        }
        sound_confusions = [
            unit.key
            for unit in HEBREW_ALPHABET
            if unit.key != self.key
            and modern_ipas
            & {
                sound.ipa
                for sound in unit.sounds
                if sound.usage != "heritage"
            }
        ]
        return {
            "key": self.key,
            "order": self.order,
            "letter": self.letter,
            "base_key": self.base_key,
            "is_final": self.is_final,
            "name": self.name.to_dict(),
            "name_niqqud": self.name_niqqud,
            # A pointed full name is more reliable than asking a browser voice
            # to pronounce one isolated glyph. The example has its own control.
            "tts_text": self.name_niqqud,
            "transliteration": self.transliteration,
            "sounds": [sound.to_dict() for sound in self.sounds],
            "explanation": self.explanation.to_dict(),
            "example": self.example.to_dict(),
            "confusions": list(self.confusions),
            "visual_confusions": list(self.confusions),
            "sound_confusions": sound_confusions,
            "content_revision": ALPHABET_CONTENT_REVISION,
            "editorial_status": ALPHABET_EDITORIAL_STATUS,
            "source_refs": [reference[0] for reference in SOURCE_REFERENCES],
            "sources": list(CATALOG_SOURCES),
        }


def _text(en: str, es: str, he: str) -> LocalizedText:
    return LocalizedText(en, es, he)


def _sound(
    key: str,
    form: str,
    ipa: str,
    approximation: tuple[str, str, str],
    context: tuple[str, str, str],
    usage: SoundUsage = "common",
) -> SoundVariant:
    return SoundVariant(
        key,
        form,
        ipa,
        _text(*approximation),
        _text(*context),
        usage,
    )


def _example(
    word: str,
    niqqud: str,
    transliteration: str,
    en: str,
    es: str,
    he: str,
) -> AlphabetExample:
    return AlphabetExample(word, niqqud, transliteration, _text(en, es, he))


_SAMEKH_SOUND = _sound(
    "s",
    "ס",
    "/s/",
    ("s as in sun", "s como en sol", "ס כמו במילה סֵפֶר"),
    ("Regular consonant sound.", "Sonido consonántico regular.", "צליל עיצורי רגיל."),
)
_KH_SOUND = _sound(
    "kh",
    "כ",
    "/χ/",
    (
        "kh, made at the back of the mouth",
        "j fuerte, como en jamón, aproximadamente",
        "צליל חיכי כמו בכָל",
    ),
    (
        "Mainstream Israeli pronunciation without dagesh.",
        "Pronunciación israelí común sin daguesh.",
        "ההגייה הישראלית הרווחת בלי דגש.",
    ),
)


HEBREW_ALPHABET: tuple[AlphabetUnit, ...] = (
    AlphabetUnit(
        "alef",
        1,
        "א",
        "alef",
        False,
        _text("Alef", "Álef", "אָלֶף"),
        "אָלֶף",
        "alef",
        (
            _sound(
                "glottal_or_silent",
                "א",
                "/ʔ/ or ∅",
                (
                    "a light glottal stop or no separate sound",
                    "un leve cierre glotal o sin sonido propio",
                    "סדק קולי קל או ללא צליל נפרד",
                ),
                (
                    "Often carries a vowel in mainstream Modern Hebrew.",
                    "A menudo porta una vocal en el hebreo moderno común.",
                    "לעיתים קרובות נושאת תנועה בעברית הישראלית.",
                ),
            ),
        ),
        _text(
            "Alef often carries the word's vowel rather than adding a strong consonant.",
            "Álef suele portar la vocal de la palabra en vez de añadir una consonante fuerte.",
            "אָלֶף נושאת לעיתים את תנועת המילה בלי להוסיף עיצור חזק.",
        ),
        _example("אבא", "אַבָּא", "aba", "father", "padre", "אבא"),
        ("ayin", "he"),
    ),
    AlphabetUnit(
        "bet",
        2,
        "ב",
        "bet",
        False,
        _text("Bet", "Bet", "בֵּית"),
        "בֵּית",
        "bet",
        (
            _sound(
                "b",
                "בּ",
                "/b/",
                ("b as in book", "b como en barco", "בּ כמו בבַּיִת"),
                (
                    "With a dagesh dot.",
                    "Con punto daguesh.",
                    "עם נקודת דגש.",
                ),
            ),
            _sound(
                "v",
                "ב",
                "/v/",
                ("v as in very", "v como en vaso", "ב כמו באב"),
                (
                    "Without a dagesh dot.",
                    "Sin punto daguesh.",
                    "בלי נקודת דגש.",
                ),
            ),
        ),
        _text(
            "The inner dot changes Bet from /v/ to /b/.",
            "El punto interior cambia Bet de /v/ a /b/.",
            "הנקודה שבתוך האות משנה את הצליל מ־/v/ ל־/b/.",
        ),
        _example("בית", "בַּיִת", "bayit", "house", "casa", "בית"),
        ("kaf", "pe"),
    ),
    AlphabetUnit(
        "gimel",
        3,
        "ג",
        "gimel",
        False,
        _text("Gimel", "Guímel", "גִּימֶל"),
        "גִּימֶל",
        "gimel",
        (
            _sound(
                "g",
                "ג",
                "/g/",
                ("g as in garden", "g como en gato", "ג כמו בגַּן"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Gimel normally represents /g/ in Modern Hebrew.",
            "Guímel normalmente representa /g/ en hebreo moderno.",
            "גִּימֶל מייצגת בדרך כלל /g/ בעברית מודרנית.",
        ),
        _example(
            "גינה",
            "גִּנָּה",
            "gina",
            "garden; neighborhood park",
            "jardín; parque de barrio",
            "גינה; פארק שכונתי",
        ),
        ("nun", "zayin"),
    ),
    AlphabetUnit(
        "dalet",
        4,
        "ד",
        "dalet",
        False,
        _text("Dalet", "Dálet", "דָּלֶת"),
        "דָּלֶת",
        "dalet",
        (
            _sound(
                "d",
                "ד",
                "/d/",
                ("d as in door", "d como en dado", "ד כמו בדֶּלֶת"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Dalet represents /d/ in mainstream Modern Hebrew.",
            "Dálet representa /d/ en el hebreo moderno común.",
            "דָּלֶת מייצגת /d/ בעברית הישראלית הרווחת.",
        ),
        _example("דלת", "דֶּלֶת", "delet", "door", "puerta", "דלת"),
        ("resh", "final_kaf"),
    ),
    AlphabetUnit(
        "he",
        5,
        "ה",
        "he",
        False,
        _text("He", "He", "הֵא"),
        "הֵא",
        "he",
        (
            _sound(
                "h",
                "ה",
                "/h/",
                ("h as in house", "h aspirada suave", "ה כמו בהַר"),
                (
                    "Usually heard at the beginning or middle of a word.",
                    "Suele oírse al inicio o en medio de una palabra.",
                    "נשמעת בדרך כלל בתחילת מילה או באמצעה.",
                ),
            ),
            _sound(
                "final_silent",
                "ה",
                "∅",
                (
                    "often silent at the end",
                    "a menudo muda al final",
                    "לעיתים קרובות שקטה בסוף מילה",
                ),
                (
                    "Common word-final behavior.",
                    "Comportamiento común al final de palabra.",
                    "התנהגות נפוצה בסוף מילה.",
                ),
                "contextual",
            ),
        ),
        _text(
            "He is /h/ in many positions and is often silent at the end of a word.",
            "He suena /h/ en muchas posiciones y suele ser muda al final.",
            "הֵא נשמעת /h/ במקומות רבים ולעיתים שקטה בסוף מילה.",
        ),
        _example("הר", "הַר", "har", "mountain", "montaña", "הר"),
        ("het", "tav"),
    ),
    AlphabetUnit(
        "vav",
        6,
        "ו",
        "vav",
        False,
        _text("Vav", "Vav", "וָו"),
        "וָו",
        "vav",
        (
            _sound(
                "v",
                "ו",
                "/v/",
                ("v as in very", "v como en vaso", "ו כמו בוֶרֶד"),
                ("As a consonant.", "Como consonante.", "כעיצור."),
            ),
            _sound(
                "holam",
                "וֹ",
                "/o/",
                ("o as in more", "o como en sol", "וֹ מסמנת תנועת o"),
                (
                    "As a vowel indicator with holam.",
                    "Como indicador vocálico con jólam.",
                    "כסימן לתנועת o עם חולם.",
                ),
                "contextual",
            ),
            _sound(
                "shuruk",
                "וּ",
                "/u/",
                ("oo as in food", "u como en luna", "וּ מסמנת תנועת u"),
                (
                    "As a vowel indicator with shuruk.",
                    "Como indicador vocálico con shuruk.",
                    "כסימן לתנועת u עם שורוק.",
                ),
                "contextual",
            ),
        ),
        _text(
            "Vav is /v/ as a consonant and can indicate the vowels /o/ or /u/.",
            "Vav suena /v/ como consonante y puede indicar las vocales /o/ o /u/.",
            "וָו נשמעת /v/ כעיצור ויכולה לסמן את התנועות /o/ או /u/.",
        ),
        _example(
            "ועד בית",
            "וַעַד בַּיִת",
            "va'ad bayit",
            "building committee",
            "comité del edificio",
            "ועד בית",
        ),
        ("zayin", "final_nun"),
    ),
    AlphabetUnit(
        "zayin",
        7,
        "ז",
        "zayin",
        False,
        _text("Zayin", "Záyin", "זַיִן"),
        "זַיִן",
        "zayin",
        (
            _sound(
                "z",
                "ז",
                "/z/",
                ("z as in zoo", "z sonora como en zigzag", "ז כמו בזְמַן"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Zayin represents the voiced /z/ sound.",
            "Záyin representa el sonido sonoro /z/.",
            "זַיִן מייצגת את הצליל הקולי /z/.",
        ),
        _example("זול", "זוֹל", "zol", "cheap", "barato", "זול"),
        ("vav", "final_nun"),
    ),
    AlphabetUnit(
        "het",
        8,
        "ח",
        "het",
        False,
        _text("Het", "Jet", "חֵית"),
        "חֵית",
        "het",
        (
            _sound(
                "kh",
                "ח",
                "/χ/",
                (
                    "kh, made at the back of the mouth",
                    "j fuerte, como en jamón, aproximadamente",
                    "ח כמו בחָתוּל",
                ),
                (
                    "Mainstream Israeli pronunciation.",
                    "Pronunciación israelí común.",
                    "ההגייה הישראלית הרווחת.",
                ),
            ),
            _sound(
                "pharyngeal",
                "ח",
                "/ħ/",
                (
                    "a deeper pharyngeal h",
                    "una h faríngea más profunda",
                    "ח לועית עמוקה יותר",
                ),
                (
                    "Preserved in some heritage pronunciations.",
                    "Conservada en algunas tradiciones de pronunciación.",
                    "נשמרת בחלק ממסורות ההגייה.",
                ),
                "heritage",
            ),
        ),
        _text(
            "Het is usually the back-of-mouth /kh/ in mainstream Israeli Hebrew.",
            "Jet suele ser la /j/ fuerte posterior en el hebreo israelí común.",
            "חֵית נשמעת בדרך כלל /χ/ בעברית הישראלית הרווחת.",
        ),
        _example("חתול", "חָתוּל", "khatul", "cat", "gato", "חתול"),
        ("he", "kaf"),
    ),
    AlphabetUnit(
        "tet",
        9,
        "ט",
        "tet",
        False,
        _text("Tet", "Tet", "טֵית"),
        "טֵית",
        "tet",
        (
            _sound(
                "t",
                "ט",
                "/t/",
                ("t as in top", "t como en taza", "ט כמו בטוֹב"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Tet and Tav share /t/ in mainstream Modern Hebrew, but spell different words.",
            "Tet y Tav comparten /t/ en hebreo moderno, pero escriben palabras distintas.",
            "טֵית ותָּו נשמעות /t/ בעברית מודרנית אך מאייתות מילים שונות.",
        ),
        _example("טעים", "טָעִים", "ta'im", "tasty", "sabroso", "טעים"),
        ("tav", "mem"),
    ),
    AlphabetUnit(
        "yod",
        10,
        "י",
        "yod",
        False,
        _text("Yod", "Yod", "יוֹד"),
        "יוֹד",
        "yod",
        (
            _sound(
                "y",
                "י",
                "/j/",
                ("y as in yes", "y como en yo", "י כמו ביָד"),
                ("As a consonant.", "Como consonante.", "כעיצור."),
            ),
            _sound(
                "i_marker",
                "י",
                "/i/",
                (
                    "can help mark an ee vowel",
                    "puede ayudar a marcar una vocal i",
                    "יכולה לסמן תנועת i",
                ),
                (
                    "As a vowel indicator in many spellings.",
                    "Como indicador vocálico en muchas grafías.",
                    "כסימן לתנועה בכתיבים רבים.",
                ),
                "contextual",
            ),
        ),
        _text(
            "Yod is /y/ as a consonant and can also help mark the vowel /i/.",
            "Yod suena /y/ como consonante y también puede ayudar a marcar /i/.",
            "יוֹד נשמעת /j/ כעיצור ויכולה גם לסמן את התנועה /i/.",
        ),
        _example("יום", "יוֹם", "yom", "day", "día", "יום"),
        ("vav", "final_nun"),
    ),
    AlphabetUnit(
        "kaf",
        11,
        "כ",
        "kaf",
        False,
        _text("Kaf", "Kaf", "כַּף"),
        "כַּף",
        "kaf",
        (
            _sound(
                "k",
                "כּ",
                "/k/",
                ("k as in key", "k como en kilo", "כּ כמו בכֶּלֶב"),
                ("With a dagesh dot.", "Con punto daguesh.", "עם נקודת דגש."),
            ),
            _KH_SOUND,
        ),
        _text(
            "Kaf is /k/ with a dagesh and /kh/ without one; ך is its final form.",
            "Kaf suena /k/ con daguesh y /j/ fuerte sin él; ך es su forma final.",
            "כַּף נשמעת /k/ עם דגש ו־/χ/ בלעדיו; ך היא הצורה הסופית.",
        ),
        _example("כלב", "כֶּלֶב", "kelev", "dog", "perro", "כלב"),
        ("bet", "pe", "final_kaf"),
    ),
    AlphabetUnit(
        "lamed",
        12,
        "ל",
        "lamed",
        False,
        _text("Lamed", "Lámed", "לָמֶד"),
        "לָמֶד",
        "lamed",
        (
            _sound(
                "l",
                "ל",
                "/l/",
                ("l as in light", "l como en luz", "ל כמו בלֶחֶם"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Lamed is the only Hebrew letter that rises above the usual writing line.",
            "Lámed es la única letra hebrea que sube sobre la línea normal de escritura.",
            "לָמֶד היא האות היחידה שעולה מעל קו הכתיבה הרגיל.",
        ),
        _example("לחם", "לֶחֶם", "lekhem", "bread", "pan", "לחם"),
        ("final_kaf", "resh"),
    ),
    AlphabetUnit(
        "mem",
        13,
        "מ",
        "mem",
        False,
        _text("Mem", "Mem", "מֵם"),
        "מֵם",
        "mem",
        (
            _sound(
                "m",
                "מ",
                "/m/",
                ("m as in moon", "m como en mamá", "מ כמו במַיִם"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Mem represents /m/; ם is used only at the end of a word.",
            "Mem representa /m/; ם se usa solamente al final de palabra.",
            "מֵם מייצגת /m/; ם משמשת רק בסוף מילה.",
        ),
        _example("מים", "מַיִם", "mayim", "water", "agua", "מים"),
        ("samekh", "final_mem"),
    ),
    AlphabetUnit(
        "nun",
        14,
        "נ",
        "nun",
        False,
        _text("Nun", "Nun", "נוּן"),
        "נוּן",
        "nun",
        (
            _sound(
                "n",
                "נ",
                "/n/",
                ("n as in name", "n como en nube", "נ כמו בנֵר"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Nun represents /n/; ן is used only at the end of a word.",
            "Nun representa /n/; ן se usa solamente al final de palabra.",
            "נוּן מייצגת /n/; ן משמשת רק בסוף מילה.",
        ),
        _example(
            "נעים מאוד",
            "נָעִים מְאֹד",
            "na'im me'od",
            "nice to meet you",
            "mucho gusto",
            "נעים מאוד",
        ),
        ("gimel", "final_nun"),
    ),
    AlphabetUnit(
        "samekh",
        15,
        "ס",
        "samekh",
        False,
        _text("Samekh", "Sámej", "סָמֶךְ"),
        "סָמֶךְ",
        "samekh",
        (_SAMEKH_SOUND,),
        _text(
            "Samekh and Sin share /s/ in Modern Hebrew, but their spelling differs.",
            "Sámej y Sin comparten /s/ en hebreo moderno, pero se escriben distinto.",
            "סָמֶךְ ושִׂין נשמעות /s/ בעברית מודרנית אך נכתבות אחרת.",
        ),
        _example("סליחה", "סְלִיחָה", "slikha", "excuse me", "disculpe", "סליחה"),
        ("shin", "final_mem"),
    ),
    AlphabetUnit(
        "ayin",
        16,
        "ע",
        "ayin",
        False,
        _text("Ayin", "Áyin", "עַיִן"),
        "עַיִן",
        "ayin",
        (
            _sound(
                "glottal_or_silent",
                "ע",
                "/ʔ/ or ∅",
                (
                    "a light glottal stop or no separate sound",
                    "un leve cierre glotal o sin sonido propio",
                    "סדק קולי קל או ללא צליל נפרד",
                ),
                (
                    "Common mainstream Israeli pronunciation.",
                    "Pronunciación israelí común.",
                    "ההגייה הישראלית הרווחת.",
                ),
            ),
            _sound(
                "pharyngeal",
                "ע",
                "/ʕ/",
                (
                    "a voiced pharyngeal sound",
                    "un sonido faríngeo sonoro",
                    "ע לועית קולית",
                ),
                (
                    "Preserved in some heritage pronunciations.",
                    "Conservada en algunas tradiciones de pronunciación.",
                    "נשמרת בחלק ממסורות ההגייה.",
                ),
                "heritage",
            ),
        ),
        _text(
            "Ayin is often not separately heard in mainstream speech; some traditions keep /ʕ/.",
            "Áyin suele no oírse por separado; algunas tradiciones conservan /ʕ/.",
            "עַיִן לעיתים אינה נשמעת בנפרד; במסורות מסוימות נשמר /ʕ/.",
        ),
        _example(
            "עבודה",
            "עֲבוֹדָה",
            "avoda",
            "work; job",
            "trabajo; empleo",
            "עבודה; משרה",
        ),
        ("alef", "tsadi"),
    ),
    AlphabetUnit(
        "pe",
        17,
        "פ",
        "pe",
        False,
        _text("Pe", "Pe", "פֵּא"),
        "פֵּא",
        "pe",
        (
            _sound(
                "p",
                "פּ",
                "/p/",
                ("p as in park", "p como en pan", "פּ כמו בפֶּה"),
                ("With a dagesh dot.", "Con punto daguesh.", "עם נקודת דגש."),
            ),
            _sound(
                "f",
                "פ",
                "/f/",
                ("f as in food", "f como en familia", "פ כמו בקפה"),
                ("Without a dagesh dot.", "Sin punto daguesh.", "בלי נקודת דגש."),
            ),
        ),
        _text(
            "Pe is /p/ with a dagesh and /f/ without one; ף is its final form.",
            "Pe suena /p/ con daguesh y /f/ sin él; ף es su forma final.",
            "פֵּא נשמעת /p/ עם דגש ו־/f/ בלעדיו; ף היא הצורה הסופית.",
        ),
        _example("פרח", "פֶּרַח", "perakh", "flower", "flor", "פרח"),
        ("bet", "kaf", "final_pe"),
    ),
    AlphabetUnit(
        "tsadi",
        18,
        "צ",
        "tsadi",
        False,
        _text("Tsadi", "Tsadi", "צָדִי"),
        "צָדִי",
        "tsadi",
        (
            _sound(
                "ts",
                "צ",
                "/ts/",
                ("ts as in cats", "ts como en tsunami", "צ כמו בצִפּוֹר"),
                ("Regular modern sound.", "Sonido moderno regular.", "הצליל המודרני הרגיל."),
            ),
        ),
        _text(
            "Tsadi represents the two-part /ts/ sound; ץ is its final form.",
            "Tsadi representa el sonido doble /ts/; ץ es su forma final.",
            "צָדִי מייצגת את הצליל /ts/; ץ היא הצורה הסופית.",
        ),
        _example("ציפור", "צִפּוֹר", "tsipor", "bird", "pájaro", "ציפור"),
        ("ayin", "final_tsadi"),
    ),
    AlphabetUnit(
        "qof",
        19,
        "ק",
        "qof",
        False,
        _text("Qof", "Kuf", "קוֹף"),
        "קוֹף",
        "qof",
        (
            _sound(
                "k",
                "ק",
                "/k/",
                ("k as in key", "k como en kilo", "ק כמו בקָפֶה"),
                (
                    "Mainstream Israeli pronunciation.",
                    "Pronunciación israelí común.",
                    "ההגייה הישראלית הרווחת.",
                ),
            ),
            _sound(
                "uvular_stop",
                "ק",
                "/q/",
                (
                    "a deeper uvular k",
                    "una k uvular más profunda",
                    "ק ענבלית עמוקה יותר",
                ),
                (
                    "Preserved in some heritage pronunciations.",
                    "Conservada en algunas tradiciones de pronunciación.",
                    "נשמרת בחלק ממסורות ההגייה.",
                ),
                "heritage",
            ),
        ),
        _text(
            "Qof is usually /k/ in mainstream Israeli Hebrew; some traditions keep /q/.",
            "Kuf suele sonar /k/ en hebreo israelí; algunas tradiciones conservan /q/.",
            "קוֹף נשמעת בדרך כלל /k/ בעברית ישראלית; במסורות מסוימות נשמר /q/.",
        ),
        _example("קפה", "קָפֶה", "kafe", "coffee", "café", "קפה"),
        ("kaf", "he"),
    ),
    AlphabetUnit(
        "resh",
        20,
        "ר",
        "resh",
        False,
        _text("Resh", "Resh", "רֵישׁ"),
        "רֵישׁ",
        "resh",
        (
            _sound(
                "israeli_r",
                "ר",
                "/ʁ/",
                (
                    "a common Israeli back-of-mouth r",
                    "una r israelí posterior común",
                    "ר ישראלית אחורית נפוצה",
                ),
                (
                    "A common mainstream Israeli realization.",
                    "Una realización israelí común.",
                    "מימוש ישראלי רווח.",
                ),
            ),
            _sound(
                "rolled_r",
                "ר",
                "/r/",
                (
                    "a tapped or rolled r",
                    "una r vibrante",
                    "ר מתגלגלת או מתנפנפת",
                ),
                (
                    "Also used by many speakers and traditions.",
                    "También usada por muchos hablantes y tradiciones.",
                    "משמשת גם דוברים ומסורות רבות.",
                ),
                "heritage",
            ),
        ),
        _text(
            "Resh pronunciation varies naturally; both back and rolled forms are understood.",
            "La pronunciación de Resh varía; se entienden formas posteriores y vibrantes.",
            "הגיית רֵישׁ משתנה באופן טבעי; מובנות הגיות אחוריות ומתגלגלות.",
        ),
        _example("רכבת", "רַכֶּבֶת", "rakevet", "train", "tren", "רכבת"),
        ("dalet", "final_kaf"),
    ),
    AlphabetUnit(
        "shin",
        21,
        "ש",
        "shin",
        False,
        _text("Shin / Sin", "Shin / Sin", "שִׁין / שִׂין"),
        "שִׁין",
        "shin",
        (
            _sound(
                "sh",
                "שׁ",
                "/ʃ/",
                ("sh as in shoe", "sh como en show", "שׁ כמו בשָׁלוֹם"),
                (
                    "Dot on the upper right.",
                    "Punto en la parte superior derecha.",
                    "נקודה בצד הימני העליון.",
                ),
            ),
            _sound(
                "s",
                "שׂ",
                "/s/",
                ("s as in sun", "s como en sol", "שׂ נשמעת כמו ס"),
                (
                    "Dot on the upper left.",
                    "Punto en la parte superior izquierda.",
                    "נקודה בצד השמאלי העליון.",
                ),
            ),
        ),
        _text(
            "The upper-right dot makes /sh/; the upper-left dot makes /s/.",
            "El punto superior derecho produce /sh/; el izquierdo produce /s/.",
            "נקודה ימנית עליונה מסמנת /ʃ/; נקודה שמאלית מסמנת /s/.",
        ),
        _example("שלום", "שָׁלוֹם", "shalom", "hello / peace", "hola / paz", "שלום"),
        ("samekh", "tsadi"),
    ),
    AlphabetUnit(
        "tav",
        22,
        "ת",
        "tav",
        False,
        _text("Tav", "Tav", "תָּו"),
        "תָּו",
        "tav",
        (
            _sound(
                "t",
                "ת",
                "/t/",
                ("t as in top", "t como en taza", "ת כמו בתּוֹדָה"),
                ("Mainstream modern sound.", "Sonido moderno común.", "הצליל המודרני הרווח."),
            ),
        ),
        _text(
            "Tav and Tet share /t/ in mainstream Modern Hebrew, but spell different words.",
            "Tav y Tet comparten /t/ en hebreo moderno, pero escriben palabras distintas.",
            "תָּו וטֵית נשמעות /t/ בעברית מודרנית אך מאייתות מילים שונות.",
        ),
        _example("תודה", "תּוֹדָה", "toda", "thank you", "gracias", "תודה"),
        ("tet", "he"),
    ),
    AlphabetUnit(
        "final_kaf",
        23,
        "ך",
        "kaf",
        True,
        _text("Final Kaf", "Kaf final", "כַּף סוֹפִית"),
        "כַּף סוֹפִית",
        "kaf sofit",
        (
            _sound(
                "kh",
                "ך",
                "/χ/",
                (
                    "kh, made at the back of the mouth",
                    "j fuerte, como en jamón, aproximadamente",
                    "ך כמו במֶלֶךְ",
                ),
                (
                    "Only at the end of a word.",
                    "Solo al final de palabra.",
                    "רק בסוף מילה.",
                ),
            ),
        ),
        _text(
            "Final Kaf replaces כ only at the end of a word and normally keeps /kh/.",
            "Kaf final reemplaza כ solo al final de palabra y normalmente conserva /j/ fuerte.",
            "כַּף סוֹפִית מחליפה את כ רק בסוף מילה ונשמעת בדרך כלל /χ/.",
        ),
        _example("מסמך", "מִסְמָךְ", "mismakh", "document", "documento", "מסמך"),
        ("kaf", "final_nun"),
    ),
    AlphabetUnit(
        "final_mem",
        24,
        "ם",
        "mem",
        True,
        _text("Final Mem", "Mem final", "מֵם סוֹפִית"),
        "מֵם סוֹפִית",
        "mem sofit",
        (
            _sound(
                "m",
                "ם",
                "/m/",
                ("m as in moon", "m como en mamá", "ם כמו במַיִם"),
                (
                    "Only at the end of a word.",
                    "Solo al final de palabra.",
                    "רק בסוף מילה.",
                ),
            ),
        ),
        _text(
            "Final Mem replaces מ only at the end of a word; its sound stays /m/.",
            "Mem final reemplaza מ solo al final; su sonido sigue siendo /m/.",
            "מֵם סוֹפִית מחליפה את מ רק בסוף מילה והצליל נשאר /m/.",
        ),
        _example("מים", "מַיִם", "mayim", "water", "agua", "מים"),
        ("mem", "samekh"),
    ),
    AlphabetUnit(
        "final_nun",
        25,
        "ן",
        "nun",
        True,
        _text("Final Nun", "Nun final", "נוּן סוֹפִית"),
        "נוּן סוֹפִית",
        "nun sofit",
        (
            _sound(
                "n",
                "ן",
                "/n/",
                ("n as in name", "n como en nube", "ן כמו בגַּן"),
                (
                    "Only at the end of a word.",
                    "Solo al final de palabra.",
                    "רק בסוף מילה.",
                ),
            ),
        ),
        _text(
            "Final Nun replaces נ only at the end of a word; its sound stays /n/.",
            "Nun final reemplaza נ solo al final; su sonido sigue siendo /n/.",
            "נוּן סוֹפִית מחליפה את נ רק בסוף מילה והצליל נשאר /n/.",
        ),
        _example("חלון", "חַלּוֹן", "khalon", "window", "ventana", "חלון"),
        ("nun", "final_kaf"),
    ),
    AlphabetUnit(
        "final_pe",
        26,
        "ף",
        "pe",
        True,
        _text("Final Pe", "Pe final", "פֵּא סוֹפִית"),
        "פֵּא סוֹפִית",
        "pe sofit",
        (
            _sound(
                "f",
                "ף",
                "/f/",
                ("f as in food", "f como en familia", "ף כמו בכֶּסֶף"),
                (
                    "Only at the end of a word.",
                    "Solo al final de palabra.",
                    "רק בסוף מילה.",
                ),
            ),
        ),
        _text(
            "Final Pe replaces פ only at the end of a word and normally sounds /f/.",
            "Pe final reemplaza פ solo al final y normalmente suena /f/.",
            "פֵּא סוֹפִית מחליפה את פ רק בסוף מילה ונשמעת בדרך כלל /f/.",
        ),
        _example("כסף", "כֶּסֶף", "kesef", "money", "dinero", "כסף"),
        ("pe", "final_tsadi"),
    ),
    AlphabetUnit(
        "final_tsadi",
        27,
        "ץ",
        "tsadi",
        True,
        _text("Final Tsadi", "Tsadi final", "צָדִי סוֹפִית"),
        "צָדִי סוֹפִית",
        "tsadi sofit",
        (
            _sound(
                "ts",
                "ץ",
                "/ts/",
                ("ts as in cats", "ts como en tsunami", "ץ כמו באֶרֶץ"),
                (
                    "Only at the end of a word.",
                    "Solo al final de palabra.",
                    "רק בסוף מילה.",
                ),
            ),
        ),
        _text(
            "Final Tsadi replaces צ only at the end of a word; its sound stays /ts/.",
            "Tsadi final reemplaza צ solo al final; su sonido sigue siendo /ts/.",
            "צָדִי סוֹפִית מחליפה את צ רק בסוף מילה והצליל נשאר /ts/.",
        ),
        _example("עץ", "עֵץ", "ets", "tree", "árbol", "עץ"),
        ("tsadi", "final_pe"),
    ),
)

ALPHABET_BY_KEY = MappingProxyType(
    {unit.key: unit for unit in HEBREW_ALPHABET}
)
BASE_ALPHABET = tuple(unit for unit in HEBREW_ALPHABET if not unit.is_final)
FINAL_FORMS = tuple(unit for unit in HEBREW_ALPHABET if unit.is_final)


def alphabet_facts() -> dict[str, Any]:
    """Return stable facts that prevent the five final forms being miscounted."""
    return {
        "base_letters": 22,
        "final_forms": 5,
        "total_forms": 27,
        "direction": "rtl",
        "has_case": False,
        "letter_count_note": _text(
            "Hebrew has 22 letters. Five have a positional final form, making 27 forms to recognize.",
            "El hebreo tiene 22 letras. Cinco tienen una forma final, para reconocer 27 formas.",
            "בעברית 22 אותיות. לחמש מהן צורה סופית, ולכן מזהים 27 צורות.",
        ).to_dict(),
        "niqqud_role": _text(
            "Niqqud marks vowels and reading details; it is not a second alphabet.",
            "El niqqud marca vocales y detalles de lectura; no es un segundo alfabeto.",
            "הניקוד מסמן תנועות ופרטי קריאה; הוא אינו אלפבית נוסף.",
        ).to_dict(),
        "pronunciation_scope": _text(
            "Mainstream Israeli pronunciation first, with labelled heritage variants.",
            "Primero la pronunciación israelí común, con variantes tradicionales señaladas.",
            "תחילה הגייה ישראלית רווחת, לצד וריאציות מסורתיות מסומנות.",
        ).to_dict(),
    }


def public_source_references() -> list[dict[str, str]]:
    """Return stable source identifiers with titles and canonical URLs."""
    return [
        {"id": reference_id, "title": title, "url": url}
        for reference_id, title, url in SOURCE_REFERENCES
    ]


def public_alphabet_units() -> list[dict[str, Any]]:
    """Return defensive JSON-ready copies of all 27 reviewed units."""
    return [unit.to_dict() for unit in HEBREW_ALPHABET]


def alphabet_unit(letter_key: str) -> AlphabetUnit:
    """Resolve one stable unit key or raise a learner-safe error."""
    try:
        return ALPHABET_BY_KEY[letter_key.strip().casefold()]
    except KeyError as error:
        raise KeyError(f"Alphabet unit {letter_key!r} is not available") from error


def _activity_kind(progress: dict[str, Any], unit: AlphabetUnit) -> str:
    recognition = int(progress.get("recognition_successes", 0))
    sound = int(progress.get("sound_successes", 0))
    word = int(progress.get("word_successes", 0))
    if recognition < 2:
        return "letter_recognition"
    if sound < 2:
        return "sound_choice"
    if word < 1:
        return "word_spotting"
    return "review"


def _required_sounds(unit: AlphabetUnit) -> tuple[SoundVariant, ...]:
    """Return only common variants that count toward sound mastery."""
    required = tuple(sound for sound in unit.sounds if sound.usage == "common")
    if not required:  # pragma: no cover - reviewed catalog invariant
        raise RuntimeError(f"Alphabet unit {unit.key!r} has no common sound")
    return required


def _required_sound(
    unit: AlphabetUnit,
    progress: dict[str, Any],
) -> SoundVariant:
    """Rotate bounded sound checks without counting reference-only variants."""
    required = _required_sounds(unit)
    successes = max(0, int(progress.get("sound_successes", 0)))
    return required[min(successes, len(required) - 1)]


def _sound_choice_options(
    unit: AlphabetUnit,
    target_sound: SoundVariant,
) -> tuple[tuple[AlphabetUnit, SoundVariant], ...]:
    """Return four forms whose displayed sound variants have distinct IPA."""
    selected: list[tuple[AlphabetUnit, SoundVariant]] = [(unit, target_sound)]
    used_ipa = {target_sound.ipa}
    same_family = FINAL_FORMS if unit.is_final else BASE_ALPHABET
    candidates = (
        tuple(
            ALPHABET_BY_KEY[key]
            for key in unit.confusions
            if ALPHABET_BY_KEY[key] in same_family
        )
        + same_family
    )
    for candidate in candidates:
        if any(selected_unit == candidate for selected_unit, _ in selected):
            continue
        candidate_sound = next(
            (
                sound
                for sound in _required_sounds(candidate)
                if sound.ipa not in used_ipa
            ),
            None,
        )
        if candidate_sound is None:
            continue
        selected.append((candidate, candidate_sound))
        used_ipa.add(candidate_sound.ipa)
        if len(selected) == 4:
            break
    if len(selected) != 4:  # pragma: no cover - reviewed catalog invariant
        raise RuntimeError(
            f"Alphabet sound activity {unit.key!r} lacks four distinct IPA options"
        )
    return tuple(sorted(selected, key=lambda item: item[0].order))


def _option_units(
    unit: AlphabetUnit,
) -> tuple[AlphabetUnit, ...]:
    """Return four meaningful written-form options."""
    selected: list[AlphabetUnit] = [unit]
    same_family = FINAL_FORMS if unit.is_final else BASE_ALPHABET
    for key in unit.confusions:
        candidate = ALPHABET_BY_KEY[key]
        if candidate not in selected:
            selected.append(candidate)
    start = same_family.index(unit)
    offset = 1
    while len(selected) < 4:
        candidate = same_family[(start + offset) % len(same_family)]
        if candidate not in selected:
            selected.append(candidate)
        offset += 1
    return tuple(sorted(selected[:4], key=lambda item: item.order))


def build_alphabet_activity(letter_key: str, progress: dict[str, Any]) -> dict[str, Any]:
    """Build a deterministic server-owned recognition activity without its answer."""
    unit = alphabet_unit(letter_key)
    exercise_type = _activity_kind(progress, unit)
    target_sound: SoundVariant | None = None
    if exercise_type == "letter_recognition":
        prompt = _text(
            f"Choose the letter {unit.name.en}.",
            f"Elige la letra {unit.name.es}.",
            f"בחרו באות {unit.name.he}.",
        )
    elif exercise_type == "sound_choice":
        target_sound = _required_sound(unit, progress)
        prompt = _text(
            (
                "Which of these forms can represent "
                f"{target_sound.approximation.en} in this activity?"
            ),
            (
                "¿Cuál de estas formas puede representar "
                f"{target_sound.approximation.es} en esta actividad?"
            ),
            (
                "איזו מהצורות האלה יכולה לייצג את הצליל "
                f"{target_sound.approximation.he} בפעילות הזאת?"
            ),
        )
    elif exercise_type == "word_spotting":
        prompt = (
            _text(
                (
                    f"Which final form ends {unit.example.niqqud} "
                    f"({unit.example.meaning.en})?"
                ),
                (
                    f"¿Qué forma final termina {unit.example.niqqud} "
                    f"({unit.example.meaning.es})?"
                ),
                f"איזו אות סופית מסיימת את המילה {unit.example.niqqud}?",
            )
            if unit.is_final
            else _text(
                (
                    f"Which letter begins {unit.example.niqqud} "
                    f"({unit.example.meaning.en})?"
                ),
                (
                    f"¿Qué letra inicia {unit.example.niqqud} "
                    f"({unit.example.meaning.es})?"
                ),
                f"איזו אות פותחת את המילה {unit.example.niqqud}?",
            )
        )
    else:
        prompt = _text(
            f"Review {unit.name.en}: choose its written form.",
            f"Repasa {unit.name.es}: elige su forma escrita.",
            f"חזרה על {unit.name.he}: בחרו בצורה הכתובה.",
        )
    if target_sound is not None:
        sound_options = _sound_choice_options(unit, target_sound)
        options = [
            {
                "key": option.key,
                "letter": sound.form,
                "name": option.name.to_dict(),
                "sound_key": sound.key,
                "ipa": sound.ipa,
            }
            for option, sound in sound_options
        ]
        prompt_key = (
            f"alphabet.{exercise_type}.{unit.key}.{target_sound.key}"
        )
    else:
        option_units = _option_units(unit)
        options = [
            {
                "key": option.key,
                "letter": option.letter,
                "name": option.name.to_dict(),
            }
            for option in option_units
        ]
        prompt_key = f"alphabet.{exercise_type}.{unit.key}"
    return {
        "letter_key": unit.key,
        "exercise_type": exercise_type,
        "prompt_key": prompt_key,
        "prompt": prompt.to_dict(),
        "sound_key": target_sound.key if target_sound is not None else None,
        "mastery_sound_keys": [
            sound.key for sound in _required_sounds(unit)
        ],
        "options": options,
    }
