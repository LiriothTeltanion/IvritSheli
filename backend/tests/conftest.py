"""
Module: backend test fixtures
Purpose: Provide isolated settings, SQLite stores, repositories, and API clients for deterministic tests.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.config import Settings
from ivrit_sheli.database import Database
from ivrit_sheli.dictionary import DictionaryStore
from ivrit_sheli.repository import LearningRepository


@pytest.fixture()
def settings(tmp_path: Path) -> Settings:
    """Create local-only settings rooted in a temporary directory."""
    data_dir = tmp_path / "data"
    return Settings.from_env(
        {
            "APP_DATA_DIR": str(data_dir),
            "APP_DB_PATH": str(data_dir / "learning.db"),
            "DICTIONARY_DB_PATH": str(data_dir / "dictionary.db"),
            "AI_PROVIDER": "offline",
            "ALLOW_CLOUD_PROCESSING": "false",
            "OPENAI_API_KEY": "",
            "GOOGLE_ACCESS_TOKEN": "",
            "GOOGLE_REFRESH_TOKEN": "",
            "DEBUG": "true",
        }
    )


@pytest.fixture()
def database(settings: Settings) -> Iterator[Database]:
    """Create and close an isolated learner database."""
    instance = Database(settings.db_path)
    instance.initialize()
    yield instance
    instance.close()


@pytest.fixture()
def repository(database: Database) -> LearningRepository:
    """Create a repository with its single local profile."""
    instance = LearningRepository(database)
    instance.ensure_default_profile()
    return instance


@pytest.fixture()
def dictionary_store(settings: Settings) -> Iterator[DictionaryStore]:
    """Create and close an isolated dictionary store."""
    instance = DictionaryStore(settings.dictionary_db_path)
    instance.initialize()
    yield instance
    instance.close()


@pytest.fixture()
def client(settings: Settings) -> Iterator[TestClient]:
    """Create an API client that exercises the full FastAPI lifespan."""
    with TestClient(create_app(settings)) as test_client:
        yield test_client
