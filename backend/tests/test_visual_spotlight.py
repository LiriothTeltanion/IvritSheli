"""Tests for the exact-scene Today dashboard spotlight."""

from pathlib import Path

import pytest

from ivrit_sheli.dictionary import DictionaryStore
from ivrit_sheli.visual_spotlight import build_visual_spotlight


def test_visual_spotlight_returns_six_unique_reviewed_scenes() -> None:
    dictionary = DictionaryStore(Path(":memory:"))
    dictionary.initialize()
    dictionary.seed_demo()

    spotlight = build_visual_spotlight(
        dictionary,
        seed="2026-07-26|A0|guided|3",
    )

    assert len(spotlight) == 6
    assert len({entry["visual"]["key"] for entry in spotlight}) == 6
    for entry in spotlight:
        assert entry["word"]
        assert entry["display_niqqud"]
        assert entry["translation_en"]
        assert entry["translation_es"]
        assert entry["translation_he"]
        assert all(entry["visual"]["alt"][locale] for locale in ("en", "es", "he"))


def test_visual_spotlight_prioritizes_recommended_exact_scene_words() -> None:
    dictionary = DictionaryStore(Path(":memory:"))
    dictionary.initialize()
    dictionary.seed_demo()

    spotlight = build_visual_spotlight(
        dictionary,
        seed="stable-visit",
        preferred_words=("אמא", "מילה שאינה קיימת"),
    )

    assert spotlight[0]["word"] == "אמא"
    assert spotlight[0]["visual"]["key"] == "family.mother"


def test_ambient_number_spotlight_leads_with_two_cups_not_a_hand_gesture() -> None:
    dictionary = DictionaryStore(Path(":memory:"))
    dictionary.initialize()
    dictionary.seed_demo()

    spotlight = build_visual_spotlight(
        dictionary,
        seed="2026-08-27|A0|guided|0",
    )

    assert spotlight[0]["word"] == "שתיים"
    assert spotlight[0]["visual"]["key"] == "numbers.two"
    assert {entry["visual"]["key"] for entry in spotlight} == {
        "numbers.one",
        "numbers.two",
        "numbers.three",
        "numbers.four",
        "numbers.five",
        "numbers.six",
    }


@pytest.mark.parametrize("limit", (0, 7))
def test_visual_spotlight_rejects_invalid_limits(limit: int) -> None:
    dictionary = DictionaryStore(Path(":memory:"))

    with pytest.raises(ValueError, match="limit must be between 1 and 6"):
        build_visual_spotlight(dictionary, seed="test", limit=limit)
