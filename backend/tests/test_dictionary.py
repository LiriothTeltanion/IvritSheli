"""
Module: local Hebrew dictionary tests
Purpose: Verify demo content, niqqud-insensitive lookup, inflected forms, source attribution, and streamed JSONL import.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
from pathlib import Path

from ivrit_sheli.dictionary import DictionaryStore


def test_demo_dictionary_is_trilingual_and_clickable(dictionary_store: DictionaryStore) -> None:
    assert dictionary_store.seed_demo() == 12
    results = dictionary_store.lookup("שָׁלוֹם")
    assert results[0]["word"] == "שלום"
    assert results[0]["senses"][0]["gloss_en"] == "peace; hello; goodbye"
    assert results[0]["senses"][0]["gloss_es"] == "paz; hola; adiós"
    assert results[0]["source_name"] == "Ivrit Sheli demo lexicon"


def test_lookup_resolves_an_inflected_form(dictionary_store: DictionaryStore) -> None:
    dictionary_store.seed_demo()
    results = dictionary_store.lookup("עבודות")
    assert results[0]["word"] == "עבודה"
    assert any(form["form"] == "עבודות" for form in results[0]["forms"])


def test_dictionary_search_supports_english_and_spanish(dictionary_store: DictionaryStore) -> None:
    dictionary_store.seed_demo()
    assert dictionary_store.search("thank you")[0]["word"] == "תודה"
    assert dictionary_store.search("trabajo")[0]["word"] == "עבודה"


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


def test_import_skips_non_hebrew_records(dictionary_store: DictionaryStore, tmp_path: Path) -> None:
    source = tmp_path / "mixed.jsonl"
    source.write_text('{"word":"hello","lang_code":"en","pos":"noun"}\n', encoding="utf-8")
    stats = dictionary_store.import_jsonl(source)
    assert stats.entries_imported == 0
    assert stats.entries_skipped == 1
