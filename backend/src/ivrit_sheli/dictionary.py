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

from ivrit_sheli.normalization import normalize_hebrew

LOGGER = logging.getLogger(__name__)
DICTIONARY_SCHEMA_VERSION = 1
DEFAULT_DICTIONARY_URL = (
    "https://kaikki.org/dictionary/Hebrew/kaikki.org-dictionary-Hebrew.jsonl"
)
ALLOWED_DOWNLOAD_HOSTS = {"kaikki.org", "www.kaikki.org"}

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


DEMO_ENTRIES: tuple[dict[str, Any], ...] = (
    {
        "word": "שלום",
        "pos": "noun",
        "romanization": "shalom",
        "gender": "masculine",
        "gloss_en": "peace; hello; goodbye",
        "gloss_es": "paz; hola; adiós",
        "forms": [{"form": "שָׁלוֹם", "tags": ["with-niqqud"]}],
        "examples": [
            {
                "hebrew": "שלום, מה שלומך?",
                "translation_en": "Hello, how are you?",
                "romanization": "Shalom, ma shlomkha?",
            }
        ],
    },
    {
        "word": "תודה",
        "pos": "interjection",
        "romanization": "toda",
        "gloss_en": "thank you",
        "gloss_es": "gracias",
        "forms": [{"form": "תּוֹדָה", "tags": ["with-niqqud"]}],
        "examples": [
            {
                "hebrew": "תודה רבה על העזרה.",
                "translation_en": "Thank you very much for the help.",
                "romanization": "Toda raba al ha-ezra.",
            }
        ],
    },
    {
        "word": "ללמוד",
        "pos": "verb",
        "romanization": "lilmod",
        "root": "למד",
        "binyan": "pa'al",
        "gloss_en": "to learn; to study",
        "gloss_es": "aprender; estudiar",
        "forms": [
            {"form": "לִלְמוֹד", "tags": ["infinitive", "with-niqqud"]},
            {"form": "לומד", "tags": ["present", "masculine", "singular"]},
            {"form": "לומדת", "tags": ["present", "feminine", "singular"]},
        ],
    },
    {
        "word": "לדבר",
        "pos": "verb",
        "romanization": "ledaber",
        "root": "דבר",
        "binyan": "pi'el",
        "gloss_en": "to speak; to talk",
        "gloss_es": "hablar",
        "forms": [
            {"form": "לְדַבֵּר", "tags": ["infinitive", "with-niqqud"]},
            {"form": "מדבר", "tags": ["present", "masculine", "singular"]},
        ],
    },
    {
        "word": "עבודה",
        "pos": "noun",
        "romanization": "avoda",
        "root": "עבד",
        "gender": "feminine",
        "gloss_en": "work; job",
        "gloss_es": "trabajo; empleo",
        "forms": [
            {"form": "עֲבוֹדָה", "tags": ["singular", "with-niqqud"]},
            {"form": "עבודות", "tags": ["plural"]},
        ],
    },
    {
        "word": "פגישה",
        "pos": "noun",
        "romanization": "pgisha",
        "root": "פגש",
        "gender": "feminine",
        "gloss_en": "meeting; appointment",
        "gloss_es": "reunión; cita",
        "forms": [
            {"form": "פְּגִישָׁה", "tags": ["singular", "with-niqqud"]},
            {"form": "פגישות", "tags": ["plural"]},
        ],
    },
    {
        "word": "בסדר",
        "pos": "adverb",
        "romanization": "beseder",
        "gloss_en": "okay; all right; in order",
        "gloss_es": "bien; de acuerdo; en orden",
        "forms": [{"form": "בְּסֵדֶר", "tags": ["with-niqqud"]}],
    },
    {
        "word": "צריך",
        "pos": "adjective",
        "romanization": "tsarikh",
        "root": "צרך",
        "gloss_en": "need; must; necessary (masculine singular)",
        "gloss_es": "necesitar; deber; necesario (masculino singular)",
        "forms": [
            {"form": "צָרִיךְ", "tags": ["masculine", "singular", "with-niqqud"]},
            {"form": "צריכה", "tags": ["feminine", "singular"]},
            {"form": "צריכים", "tags": ["masculine", "plural"]},
            {"form": "צריכות", "tags": ["feminine", "plural"]},
        ],
    },
    {
        "word": "להבין",
        "pos": "verb",
        "romanization": "lehavin",
        "root": "בין",
        "binyan": "hif'il",
        "gloss_en": "to understand",
        "gloss_es": "entender",
        "forms": [{"form": "לְהָבִין", "tags": ["infinitive", "with-niqqud"]}],
    },
    {
        "word": "אפשר",
        "pos": "adjective",
        "romanization": "efshar",
        "gloss_en": "possible; may/can one",
        "gloss_es": "posible; se puede",
        "forms": [{"form": "אֶפְשָׁר", "tags": ["with-niqqud"]}],
    },
    {
        "word": "להצליח",
        "pos": "verb",
        "romanization": "lehatsliakh",
        "root": "צלח",
        "binyan": "hif'il",
        "gloss_en": "to succeed",
        "gloss_es": "tener éxito",
        "forms": [{"form": "לְהַצְלִיחַ", "tags": ["infinitive", "with-niqqud"]}],
    },
    {
        "word": "בבקשה",
        "pos": "interjection",
        "romanization": "bevakasha",
        "gloss_en": "please; you are welcome; here you go",
        "gloss_es": "por favor; de nada; aquí tienes",
        "forms": [{"form": "בְּבַקָּשָׁה", "tags": ["with-niqqud"]}],
    },
)


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
        12
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
        try:
            connection.executescript(DICTIONARY_SCHEMA)
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('schema_version', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (str(DICTIONARY_SCHEMA_VERSION),),
            )
            connection.commit()
        finally:
            if should_close:
                connection.close()

    def seed_demo(self) -> int:
        """Install a compact trilingual lexicon for immediate offline use.

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
                source_key = f"builtin:{normalize_hebrew(entry['word'])}:{entry['pos']}"
                cursor = connection.execute(
                    """
                    INSERT OR IGNORE INTO dictionary_entries(
                        source_key, word, normalized_word, pos, romanization,
                        root, binyan, gender, source_name, source_url,
                        license_name, raw_json
                    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        source_key,
                        entry["word"],
                        normalize_hebrew(entry["word"]),
                        entry.get("pos"),
                        entry.get("romanization"),
                        entry.get("root"),
                        entry.get("binyan"),
                        entry.get("gender"),
                        "Ivrit Sheli demo lexicon",
                        None,
                        "MIT application sample data",
                        json.dumps(entry, ensure_ascii=False),
                    ),
                )
                if cursor.rowcount == 0:
                    continue
                inserted += 1
                entry_id_raw = cursor.lastrowid
                if entry_id_raw is None:
                    raise sqlite3.DatabaseError("SQLite did not return an entry ID")
                entry_id = int(entry_id_raw)
                connection.execute(
                    """
                    INSERT INTO dictionary_senses(
                        entry_id, sense_order, gloss_en, gloss_es
                    ) VALUES(?, 0, ?, ?)
                    """,
                    (entry_id, entry.get("gloss_en"), entry.get("gloss_es")),
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
                            entry_id, hebrew_text, translation_en, romanization
                        ) VALUES(?, ?, ?, ?)
                        """,
                        (
                            entry_id,
                            example["hebrew"],
                            example.get("translation_en"),
                            example.get("romanization"),
                        ),
                    )
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('dataset', 'demo') "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
            )
            connection.commit()
            return inserted
        finally:
            if should_close:
                connection.close()

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        """Search words, inflected forms, and English/Spanish glosses.

        Args:
            query: Hebrew word/form or translation text.
            limit: Maximum number of entry cards.

        Returns:
            Rich dictionary cards ordered by exactness.

        Raises:
            ValueError: If query is empty or limit is invalid.

        Example:
            >>> store = DictionaryStore(Path(":memory:")); store.initialize(); store.seed_demo()
            >>> store.search("learn")[0]["word"]
            'ללמוד'
        """
        raw_query = query.strip()
        if not raw_query:
            raise ValueError("query is required")
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")

        normalized = normalize_hebrew(raw_query)
        like_normalized = f"%{normalized}%"
        like_raw = f"%{raw_query.lower()}%"
        like_root = f"%{raw_query}%"
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            rows = connection.execute(
                """
                SELECT DISTINCT e.id,
                    CASE
                        WHEN e.normalized_word = ? THEN 0
                        WHEN f.normalized_form = ? THEN 1
                        WHEN e.normalized_word LIKE ? THEN 2
                        WHEN f.normalized_form LIKE ? THEN 3
                        WHEN e.root = ? THEN 4
                        ELSE 5
                    END AS rank
                FROM dictionary_entries e
                LEFT JOIN dictionary_forms f ON f.entry_id = e.id
                LEFT JOIN dictionary_senses s ON s.entry_id = e.id
                WHERE e.normalized_word LIKE ?
                   OR f.normalized_form LIKE ?
                   OR lower(COALESCE(s.gloss_en, '')) LIKE ?
                   OR lower(COALESCE(s.gloss_es, '')) LIKE ?
                   OR COALESCE(e.root, '') LIKE ?
                ORDER BY rank, length(e.word), e.word
                LIMIT ?
                """,
                (
                    normalized,
                    normalized,
                    f"{normalized}%",
                    f"{normalized}%",
                    raw_query,
                    like_normalized,
                    like_normalized,
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
            >>> store.lookup("לומדת")[0]["word"]
            'ללמוד'
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
                    CASE WHEN e.normalized_word = ? THEN 0 ELSE 1 END AS rank
                FROM dictionary_entries e
                LEFT JOIN dictionary_forms f ON f.entry_id = e.id
                WHERE e.normalized_word = ? OR f.normalized_form = ?
                ORDER BY rank, e.pos
                LIMIT ?
                """,
                (normalized, normalized, normalized, limit),
            ).fetchall()
            if not rows:
                # A clicked token may contain a Hebrew prefix such as ו/ב/ל/כ/מ/ש.
                stripped = normalized[1:] if len(normalized) > 2 and normalized[0] in "ובלכמשה" else normalized
                rows = connection.execute(
                    """
                    SELECT DISTINCT e.id, 2 AS rank
                    FROM dictionary_entries e
                    LEFT JOIN dictionary_forms f ON f.entry_id = e.id
                    WHERE e.normalized_word = ? OR f.normalized_form = ?
                    ORDER BY e.pos
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

    def _entry_card(
        self, connection: sqlite3.Connection, entry_id: int
    ) -> dict[str, Any]:
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

        senses = [
            {
                **dict(sense),
                "tags": json.loads(sense["tags_json"]),
                "topics": json.loads(sense["topics_json"]),
            }
            for sense in connection.execute(
                "SELECT * FROM dictionary_senses WHERE entry_id = ? ORDER BY sense_order",
                (entry_id,),
            ).fetchall()
        ]
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
        card.update(
            {
                "senses": senses,
                "forms": forms,
                "examples": examples,
                "sounds": sounds,
                "display_niqqud": next(
                    (
                        form["form"]
                        for form in forms
                        if "with-niqqud" in form["tags"]
                    ),
                    row["word"],
                ),
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
            12
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
                    """
                )
                connection.commit()

            for record in iter_jsonl(source, max_records=max_records):
                counters["records_read"] += 1
                try:
                    inserted = self._import_record(connection, record, counters, source_url=source_url)
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
            connection.execute(
                "INSERT INTO dictionary_meta(key, value) VALUES('license', 'CC BY-SA 4.0 / GFDL') "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
            )
            connection.commit()
            return ImportStats(**counters)
        finally:
            if should_close:
                connection.close()

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
                str(gloss).strip()
                for gloss in sense.get("glosses", [])
                if str(gloss).strip()
            ]
            raw_glosses = [
                str(gloss).strip()
                for gloss in sense.get("raw_glosses", [])
                if str(gloss).strip()
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
            str(category.get("name", ""))
            for category in record.get("categories", []) or []
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
            headers={"User-Agent": "Ivrit-Sheli-Ultimate/1.0"},
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
