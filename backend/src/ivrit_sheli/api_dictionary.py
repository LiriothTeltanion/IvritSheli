"""Dictionary API route registration.

This module owns only the HTTP boundary for shared dictionary reads and the
learner-specific "learn this entry" mutation. It deliberately receives its
service/repository accessors from ``api.py`` so authentication, tenant
selection, CSRF, rate limiting and middleware remain centralized in the
application shell.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import FastAPI, Query, Request

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.dictionary import DictionaryStore
from ivrit_sheli.repository import LearningRepository

Repository = LearningRepository | CloudLearningRepository
RepositoryGetter = Callable[[Request], Repository]
DictionaryGetter = Callable[[Request], DictionaryStore]
DictionaryDecorator = Callable[[Repository, list[dict[str, Any]]], list[dict[str, Any]]]


def register_dictionary_routes(
    app: FastAPI,
    *,
    api_prefix: str,
    repository_for: RepositoryGetter,
    dictionary_for: DictionaryGetter,
    decorate_entries: DictionaryDecorator,
) -> None:
    """Register dictionary routes without duplicating auth or tenant logic."""

    @app.get(f"{api_prefix}/dictionary/search")
    def dictionary_search(
        request: Request,
        q: str = Query(min_length=1, max_length=500),
        limit: int = Query(default=20, ge=1, le=100),
    ) -> dict[str, Any]:
        repository = repository_for(request)
        results = decorate_entries(
            repository,
            dictionary_for(request).search(q, limit),
        )
        return {"query": q, "results": results}

    @app.get(f"{api_prefix}/dictionary/browse")
    def dictionary_browse(
        request: Request,
        category: str = Query(min_length=1, max_length=64),
        limit: int = Query(default=24, ge=1, le=100),
    ) -> dict[str, Any]:
        repository = repository_for(request)
        results = decorate_entries(
            repository,
            dictionary_for(request).browse(category, limit),
        )
        return {"category": category, "results": results}

    @app.get(f"{api_prefix}/dictionary/lookup")
    def dictionary_lookup(
        request: Request,
        word: str = Query(min_length=1, max_length=500),
    ) -> dict[str, Any]:
        repository = repository_for(request)
        results = decorate_entries(
            repository,
            dictionary_for(request).lookup(word),
        )
        return {"word": word, "results": results}

    @app.get(f"{api_prefix}/dictionary/entries/{{entry_id}}")
    def dictionary_entry(request: Request, entry_id: int) -> dict[str, Any]:
        entry = dictionary_for(request).get(entry_id)
        return decorate_entries(repository_for(request), [entry])[0]

    @app.get(f"{api_prefix}/dictionary/stats")
    def dictionary_stats(request: Request) -> dict[str, Any]:
        return dictionary_for(request).stats()

    @app.post(f"{api_prefix}/dictionary/{{entry_id}}/learn", status_code=201)
    def learn_dictionary_entry(request: Request, entry_id: int) -> dict[str, Any]:
        card = dictionary_for(request).get(entry_id)
        repository = repository_for(request)
        first_sense = card["senses"][0] if card["senses"] else {}
        return repository.get_or_create_dictionary_item(
            entry_id,
            {
                "hebrew_text": card["word"],
                "hebrew_with_niqqud": card["display_niqqud"],
                "transliteration": card.get("romanization"),
                "translation_en": first_sense.get("gloss_en"),
                "translation_es": first_sense.get("gloss_es"),
                "item_type": card.get("pos") or "word",
                "root": card.get("root"),
                "binyan": card.get("binyan"),
                "grammatical_gender": card.get("gender"),
                "priority": 0.65,
            },
        )
