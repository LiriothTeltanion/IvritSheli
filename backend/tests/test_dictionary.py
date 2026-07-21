"""
Module: local Hebrew dictionary tests
Purpose: Verify the visual starter vocabulary, multilingual search, safe upgrades, source attribution, and streamed JSONL import.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
import sqlite3
from collections import Counter
from pathlib import Path

from ivrit_sheli.dictionary import DEMO_ENTRIES, DICTIONARY_SCHEMA_VERSION, DictionaryStore


def test_demo_dictionary_is_trilingual_and_clickable(dictionary_store: DictionaryStore) -> None:
    assert dictionary_store.seed_demo() == 48
    results = dictionary_store.lookup("שָׁלוֹם")
    assert results[0]["word"] == "שלום"
    assert results[0]["senses"][0]["gloss_en"] == "hello"
    assert results[0]["senses"][0]["gloss_es"] == "hola"
    assert results[0]["source_name"] == "Ivrit Sheli reviewed starter vocabulary"
    assert results[0]["visual"] == {
        "key": "greetings.hello",
        "emoji": "👋",
        "alt": {
            "en": "A hand waving hello",
            "es": "Una mano saludando",
            "he": "יד מנופפת לשלום",
        },
    }
    assert results[0]["examples"][0]["translation_es"] == "Hola, soy Miriam."


def test_lookup_resolves_a_niqqud_form(dictionary_store: DictionaryStore) -> None:
    dictionary_store.seed_demo()
    results = dictionary_store.lookup("בּוֹקֶר טוֹב")
    assert results[0]["word"] == "בוקר טוב"
    assert results[0]["display_niqqud"] == "בּוֹקֶר טוֹב"


def test_dictionary_search_supports_english_and_spanish(dictionary_store: DictionaryStore) -> None:
    dictionary_store.seed_demo()
    assert dictionary_store.search("thank you")[0]["word"] == "תודה"
    assert dictionary_store.search("médico")[0]["word"] == "רופא"


def test_hebrew_romanization_english_and_spanish_converge(
    dictionary_store: DictionaryStore,
) -> None:
    dictionary_store.seed_demo()
    for query in ("שלום", "שָׁלוֹם", "shalom", "hello", "hola"):
        result = dictionary_store.search(query)
        assert result[0]["word"] == "שלום"
        assert result[0]["visual"]["key"] == "greetings.hello"


def test_starter_vocabulary_contract_has_48_reviewed_exact_senses(
    dictionary_store: DictionaryStore,
) -> None:
    expected_categories = {
        "greetings": 8,
        "family": 7,
        "home": 7,
        "food": 8,
        "transport": 6,
        "shopping": 6,
        "health": 6,
    }
    assert len(DEMO_ENTRIES) == 48
    assert Counter(str(entry["category"]) for entry in DEMO_ENTRIES) == expected_categories
    assert len({str(entry["visual_key"]) for entry in DEMO_ENTRIES}) == 48
    assert dictionary_store.seed_demo() == 48
    assert dictionary_store.seed_demo() == 0
    assert dictionary_store.stats()["entries"] == 48

    for source_entry in DEMO_ENTRIES:
        card = dictionary_store.lookup(str(source_entry["word"]))[0]
        sense = card["senses"][0]
        example = card["examples"][0]
        assert card["display_niqqud"] == source_entry["forms"][0]["form"]
        assert card["romanization"]
        assert sense["gloss_en"] and sense["gloss_es"]
        assert sense["level"] in {"A0", "A1"}
        assert sense["category"] in expected_categories
        assert sense["provenance"]
        assert sense["visual"]["key"] == source_entry["visual_key"]
        assert sense["visual"]["emoji"]
        assert all(sense["visual"]["alt"].values())
        assert example["hebrew_text"]
        assert example["translation_en"] and example["translation_es"]
        assert example["romanization"]


def test_unsupported_words_do_not_receive_guessed_visuals(
    dictionary_store: DictionaryStore,
) -> None:
    dictionary_store.seed_demo()
    assert dictionary_store.search("unicorn-that-is-not-curated") == []
    assert dictionary_store.lookup("חדקרן") == []


def test_get_missing_entry_raises(dictionary_store: DictionaryStore) -> None:
    dictionary_store.seed_demo()
    try:
        dictionary_store.get(99999)
    except KeyError as error:
        assert "not found" in str(error)
    else:
        raise AssertionError("Expected a missing dictionary entry to raise KeyError")


def test_streamed_jsonl_import_preserves_forms_examples_and_audio(
    dictionary_store: DictionaryStore, tmp_path: Path
) -> None:
    source = tmp_path / "hebrew.jsonl"
    record = {
        "id": "test-1",
        "word": "לכתוב",
        "pos": "verb",
        "lang_code": "he",
        "senses": [
            {
                "glosses": ["to write"],
                "tags": ["transitive"],
                "examples": [
                    {
                        "text": "אני אוהב לכתוב.",
                        "english": "I like to write.",
                        "roman": "Ani ohev likhtov.",
                    }
                ],
            }
        ],
        "forms": [{"form": "כותב", "tags": ["present", "masculine"]}],
        "sounds": [{"ipa": "/liχˈtov/", "ogg_url": "https://example.invalid/write.ogg"}],
        "etymology_text": "From the root כתב.",
        "derived": [],
        "head_templates": [{"args": {"tr": "likhtov"}}],
    }
    source.write_text(json.dumps(record, ensure_ascii=False) + "\n", encoding="utf-8")

    stats = dictionary_store.import_jsonl(source, source_url="https://example.invalid/source")
    assert stats.entries_imported == 1
    entry = dictionary_store.lookup("כותב")[0]
    assert entry["word"] == "לכתוב"
    assert entry["source_url"] == "https://example.invalid/source"
    assert entry["sounds"][0]["ipa"] == "/liχˈtov/"
    assert entry["examples"][0]["hebrew_text"] == "אני אוהב לכתוב."
    assert entry["examples"][0]["translation_es"] is None
    assert entry["visual"] is None
    assert entry["senses"][0]["visual"] is None
    assert dictionary_store.stats()["entries"] == 49
    assert dictionary_store.stats()["metadata"]["starter_entries"] == "48"


def test_kaikki_dictionary_keeps_the_starter_pack_and_ranks_curated_exact_match_first(
    dictionary_store: DictionaryStore, tmp_path: Path
) -> None:
    source = tmp_path / "hebrew-duplicate.jsonl"
    record = {
        "id": "kaikki-shalom",
        "word": "שלום",
        "pos": "noun",
        "lang_code": "he",
        "senses": [{"glosses": ["peace"]}],
    }
    source.write_text(json.dumps(record, ensure_ascii=False) + "\n", encoding="utf-8")

    stats = dictionary_store.import_jsonl(
        source, source_url="https://kaikki.org/dictionary/Hebrew/"
    )
    assert stats.entries_imported == 1
    results = dictionary_store.search("שלום")
    assert results[0]["source_name"] == "Ivrit Sheli reviewed starter vocabulary"
    assert results[0]["visual"]["key"] == "greetings.hello"
    imported = next(
        result for result in results if result["source_name"] == "Kaikki / English Wiktionary"
    )
    assert imported["visual"] is None
    assert dictionary_store.lookup("שלום")[0]["visual"]["key"] == "greetings.hello"
    metadata = dictionary_store.stats()["metadata"]
    assert metadata["dataset"] == "Kaikki/Wiktionary Hebrew + starter_visual_vocabulary_v1"
    assert "MIT starter data" in metadata["license"]
    assert dictionary_store.stats()["entries"] == 49

    dictionary_store.initialize()
    assert dictionary_store.stats()["entries"] == 49


def test_import_skips_non_hebrew_records(dictionary_store: DictionaryStore, tmp_path: Path) -> None:
    source = tmp_path / "mixed.jsonl"
    source.write_text('{"word":"hello","lang_code":"en","pos":"noun"}\n', encoding="utf-8")
    stats = dictionary_store.import_jsonl(source)
    assert stats.entries_imported == 0
    assert stats.entries_skipped == 1


def test_schema_v1_starter_database_upgrades_without_changing_existing_entry_id(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "dictionary-v1.db"
    connection = sqlite3.connect(database_path)
    connection.executescript(
        """
        CREATE TABLE dictionary_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE dictionary_entries (
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
        CREATE TABLE dictionary_senses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
            sense_order INTEGER NOT NULL DEFAULT 0,
            gloss_en TEXT,
            gloss_es TEXT,
            tags_json TEXT NOT NULL DEFAULT '[]',
            topics_json TEXT NOT NULL DEFAULT '[]'
        );
        CREATE TABLE dictionary_examples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
            hebrew_text TEXT NOT NULL,
            translation_en TEXT,
            romanization TEXT,
            source_text TEXT
        );
        INSERT INTO dictionary_meta(key, value) VALUES('schema_version', '1');
        INSERT INTO dictionary_meta(key, value) VALUES('dataset', 'demo');
        INSERT INTO dictionary_entries(
            id, source_key, word, normalized_word, pos, romanization, source_name
        ) VALUES(7, 'builtin:שלום:noun', 'שלום', 'שלום', 'noun', 'shalom', 'Old demo');
        INSERT INTO dictionary_senses(entry_id, gloss_en, gloss_es)
        VALUES(7, 'peace; hello; goodbye', 'paz; hola; adiós');
        """
    )
    connection.commit()
    connection.close()

    store = DictionaryStore(database_path)
    store.initialize()
    upgraded = store.lookup("שלום")[0]
    assert upgraded["id"] == 7
    assert upgraded["visual"]["key"] == "greetings.hello"
    assert upgraded["examples"][0]["translation_es"] == "Hola, soy Miriam."
    assert store.stats()["metadata"]["schema_version"] == str(DICTIONARY_SCHEMA_VERSION)
    assert store.stats()["metadata"]["starter_entries"] == "48"
    assert store.stats()["entries"] == 48
    store.close()
