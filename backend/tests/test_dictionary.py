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
from copy import deepcopy
from pathlib import Path

from pytest import MonkeyPatch

import ivrit_sheli.dictionary as dictionary_module
from ivrit_sheli.dictionary import DEMO_ENTRIES, DICTIONARY_SCHEMA_VERSION, DictionaryStore
from ivrit_sheli.normalization import normalize_hebrew
from ivrit_sheli.starter_lexicon_v2 import EXPANDED_STARTER_ENTRIES
from ivrit_sheli.starter_lexicon_v4 import A2_EXPANSION_ENTRIES
from ivrit_sheli.starter_lexicon_validation import (
    EXPECTED_STARTER_CATEGORY_COUNTS,
    EXPECTED_STARTER_ENTRY_COUNT,
    validate_starter_vocabulary,
)


def test_demo_dictionary_is_trilingual_and_clickable(dictionary_store: DictionaryStore) -> None:
    assert dictionary_store.seed_demo() == 240
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


def test_starter_vocabulary_contract_has_240_reviewed_exact_senses(
    dictionary_store: DictionaryStore,
) -> None:
    expected_categories = Counter(EXPECTED_STARTER_CATEGORY_COUNTS)
    assert len(DEMO_ENTRIES) == EXPECTED_STARTER_ENTRY_COUNT
    assert Counter(str(entry["category"]) for entry in DEMO_ENTRIES) == expected_categories
    assert len({str(entry["visual_key"]) for entry in DEMO_ENTRIES}) == 240
    validate_starter_vocabulary(DEMO_ENTRIES)
    assert dictionary_store.seed_demo() == 240
    assert dictionary_store.seed_demo() == 0
    assert dictionary_store.stats()["entries"] == 240

    for source_entry in DEMO_ENTRIES:
        card = dictionary_store.lookup(str(source_entry["word"]))[0]
        sense = card["senses"][0]
        example = card["examples"][0]
        assert card["display_niqqud"] == source_entry["forms"][0]["form"]
        assert card["romanization"]
        assert sense["gloss_en"] and sense["gloss_es"]
        assert sense["level"] in {"A0", "A1", "A2"}
        assert sense["category"] in EXPECTED_STARTER_CATEGORY_COUNTS
        assert sense["provenance"]
        assert sense["visual"]["key"] == source_entry["visual_key"]
        assert sense["visual"]["emoji"]
        assert all(sense["visual"]["alt"].values())
        assert example["hebrew_text"]
        assert example["translation_en"] and example["translation_es"]
        assert example["romanization"]


def test_v25_additions_leave_unverified_root_and_binyan_unknown() -> None:
    assert len(EXPANDED_STARTER_ENTRIES) == 48
    for entry in EXPANDED_STARTER_ENTRIES:
        assert entry["root"] is None
        assert entry["binyan"] is None


def test_a2_expansion_is_complete_unique_and_visually_described() -> None:
    assert len(A2_EXPANSION_ENTRIES) == 96
    assert len({normalize_hebrew(str(entry["word"])) for entry in DEMO_ENTRIES}) == 240
    assert len({str(entry["visual_id"]) for entry in A2_EXPANSION_ENTRIES}) == 96

    for entry in A2_EXPANSION_ENTRIES:
        assert entry["level"] == "A2"
        assert entry["category"] in EXPECTED_STARTER_CATEGORY_COUNTS
        assert entry["visual_id"] == entry["visual_key"]
        assert entry["gloss_en"] and entry["gloss_es"]
        assert all(
            entry[field]
            for field in ("visual_alt_en", "visual_alt_es", "visual_alt_he")
        )
        assert len(entry["forms"]) == 1
        assert len(entry["examples"]) == 1
        assert all(entry["examples"][0].values())


def test_a2_reading_hints_survive_dictionary_seeding(
    dictionary_store: DictionaryStore,
) -> None:
    dictionary_store.seed_demo()
    contract = dictionary_store.lookup("חוזה")[0]["senses"][0]
    assert contract["visual_id"] == "housing.contract"
    assert contract["reading_hints"] == [
        {
            "display": "חוֹזֶה",
            "note_en": "The first vowel is o: kho-ze.",
            "note_es": "La primera vocal es o: jo-ze.",
            "note_he": "התנועה הראשונה היא חוֹ: חוֹ־זֶה.",
        }
    ]


def test_v24_starter_database_expands_without_renumbering_existing_entries(
    dictionary_store: DictionaryStore,
    monkeypatch: MonkeyPatch,
) -> None:
    full_entries = dictionary_module.DEMO_ENTRIES
    with monkeypatch.context() as patch:
        patch.setattr(dictionary_module, "DEMO_ENTRIES", full_entries[:48])
        assert dictionary_store.seed_demo() == 48

    connection = dictionary_store.connect()
    original_ids = {
        str(row["source_key"]): int(row["id"])
        for row in connection.execute(
            "SELECT id, source_key FROM dictionary_entries ORDER BY id"
        ).fetchall()
    }
    assert len(original_ids) == 48

    assert dictionary_store.seed_demo() == 192
    assert dictionary_store.seed_demo() == 0
    expanded_ids = {
        str(row["source_key"]): int(row["id"])
        for row in connection.execute(
            "SELECT id, source_key FROM dictionary_entries ORDER BY id"
        ).fetchall()
    }
    assert len(expanded_ids) == 240
    assert all(expanded_ids[source_key] == entry_id for source_key, entry_id in original_ids.items())


def test_starter_validator_rejects_duplicate_visual_and_missing_attribution() -> None:
    duplicate_visual = deepcopy(list(DEMO_ENTRIES))
    duplicate_visual[-1]["visual_key"] = duplicate_visual[0]["visual_key"]
    try:
        validate_starter_vocabulary(duplicate_visual)
    except ValueError as error:
        assert "Duplicate starter visual key" in str(error)
    else:
        raise AssertionError("Expected duplicate visual metadata to fail validation")

    missing_attribution = deepcopy(list(DEMO_ENTRIES))
    missing_attribution[-1]["provenance"] = ""
    try:
        validate_starter_vocabulary(missing_attribution)
    except ValueError as error:
        assert "provenance" in str(error)
    else:
        raise AssertionError("Expected missing editorial provenance to fail validation")


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
    assert dictionary_store.stats()["entries"] == 241
    assert dictionary_store.stats()["metadata"]["starter_entries"] == "240"


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
    assert metadata["dataset"] == "Kaikki/Wiktionary Hebrew + starter_visual_vocabulary_v4"
    assert "MIT starter data" in metadata["license"]
    assert dictionary_store.stats()["entries"] == 241

    dictionary_store.initialize()
    assert dictionary_store.stats()["entries"] == 241


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
    assert store.stats()["metadata"]["starter_entries"] == "240"
    assert store.stats()["entries"] == 240
    store.close()
