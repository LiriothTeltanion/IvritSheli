"""
Module: SQLite schema migration tests
Purpose: Verify safe bootstrap, upgrades, rollback, version guards, and data preservation.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-16 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

import pytest

from ivrit_sheli.database import (
    MIGRATIONS,
    SCHEMA_SQL,
    SCHEMA_VERSION,
    Database,
    Migration,
    SchemaMigrationError,
)


@contextmanager
def _open(path: Path) -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _create_versioned_fixture(path: Path, version: int = 1) -> None:
    with _open(path) as connection:
        connection.executescript(
            """
            CREATE TABLE app_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE migration_probe (
                id INTEGER PRIMARY KEY,
                value TEXT NOT NULL
            );
            INSERT INTO migration_probe(id, value) VALUES(1, 'preserve me');
            """
        )
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('schema_version', ?)",
            (str(version),),
        )


def test_fresh_database_bootstraps_to_latest_schema(tmp_path: Path) -> None:
    path = tmp_path / "fresh.db"
    database = Database(path)

    database.initialize()

    with _open(path) as connection:
        version = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()["value"]
        tables = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }
    assert version == str(SCHEMA_VERSION)
    assert {
        "profiles",
        "learning_items",
        "attempts",
        "audio_attempts",
        "learning_core_state",
        "reading_support_state",
        "learning_core_attempts",
        "learning_core_idempotency",
        "practice_sessions",
        "practice_step_events",
        "curriculum_progress",
    } <= tables


def test_initialize_is_idempotent_and_preserves_existing_data(tmp_path: Path) -> None:
    path = tmp_path / "idempotent.db"
    database = Database(path)
    database.initialize()
    with _open(path) as connection:
        connection.execute(
            """
            INSERT INTO learning_items(
                hebrew_text, normalized_text, created_at, updated_at
            ) VALUES('שלום', 'שלום', '2026-07-16T00:00:00Z', '2026-07-16T00:00:00Z')
            """
        )

    database.initialize()
    database.initialize()

    with _open(path) as connection:
        rows = connection.execute(
            "SELECT id, hebrew_text FROM learning_items ORDER BY id"
        ).fetchall()
        version = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()["value"]
    assert [(row["id"], row["hebrew_text"]) for row in rows] == [(1, "שלום")]
    assert version == str(SCHEMA_VERSION)


def test_unversioned_existing_schema_is_adopted_without_data_loss(tmp_path: Path) -> None:
    path = tmp_path / "legacy.db"
    with _open(path) as connection:
        connection.executescript(SCHEMA_SQL)
        connection.execute(
            """
            INSERT INTO learning_items(
                hebrew_text, normalized_text, created_at, updated_at
            ) VALUES('תודה', 'תודה', '2026-07-16T00:00:00Z', '2026-07-16T00:00:00Z')
            """
        )

    Database(path).initialize()

    with _open(path) as connection:
        word = connection.execute("SELECT hebrew_text FROM learning_items").fetchone()[0]
        version = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()[0]
    assert word == "תודה"
    assert version == str(SCHEMA_VERSION)


def test_22_profile_upgrade_preserves_level_and_skips_new_beginner_gates(
    tmp_path: Path,
) -> None:
    path = tmp_path / "returning-learner.db"
    with _open(path) as connection:
        connection.executescript(SCHEMA_SQL)
        connection.execute(
            """
            INSERT INTO profiles(
                id, display_name, interface_language, hebrew_level, daily_minutes,
                transliteration_mode, niqqud_mode, weekly_rest_day, cloud_consent,
                created_at, updated_at
            ) VALUES(1, 'Returning learner', 'es', 'B2', 27, 'hidden', 'difficult',
                     5, 1, '2026-07-16T00:00:00Z', '2026-07-16T00:00:00Z')
            """
        )

    Database(path).initialize()

    with _open(path) as connection:
        profile = connection.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
    assert profile["hebrew_level"] == "B2"
    assert profile["daily_minutes"] == 27
    assert profile["onboarding_step"] == 4
    assert profile["onboarding_completed"] == 1
    assert profile["first_steps_step"] == 5
    assert profile["first_steps_completed"] == 1
    assert profile["learner_mode"] == "guided"
    assert profile["curriculum_track"] == "modern_conversation"
    assert profile["cefr_band"] == "B2"


def test_legacy_guided_boolean_migrates_to_explicit_learner_mode(tmp_path: Path) -> None:
    path = tmp_path / "learner-mode.db"
    with _open(path) as connection:
        connection.executescript(SCHEMA_SQL)
        connection.executescript(MIGRATIONS[1].sql)
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('schema_version', '2')"
        )
        connection.execute(
            """
            INSERT INTO profiles(
                id, display_name, interface_language, hebrew_level, daily_minutes,
                transliteration_mode, niqqud_mode, weekly_rest_day, cloud_consent,
                onboarding_step, onboarding_completed, guided_mode,
                first_steps_step, first_steps_completed, created_at, updated_at
            ) VALUES(1, 'Explorer', 'en', 'B1', 15, 'hidden', 'hidden', 5, 0,
                     4, 1, 0, 5, 1, '2026-07-22T00:00:00Z', '2026-07-22T00:00:00Z')
            """
        )

    Database(path).initialize()

    with _open(path) as connection:
        profile = connection.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
    assert profile["guided_mode"] == 0
    assert profile["learner_mode"] == "explorer"
    assert profile["curriculum_track"] == "modern_conversation"
    assert profile["cefr_band"] == "B1"


def test_learning_core_migration_preserves_existing_mastery_and_adds_skill_defaults(
    tmp_path: Path,
) -> None:
    path = tmp_path / "learning-core.db"
    with _open(path) as connection:
        connection.executescript(SCHEMA_SQL)
        connection.executescript(MIGRATIONS[1].sql)
        connection.executescript(MIGRATIONS[2].sql)
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('schema_version', '3')"
        )
        connection.execute(
            """
            INSERT INTO profiles(
                id, display_name, interface_language, hebrew_level, daily_minutes,
                transliteration_mode, niqqud_mode, weekly_rest_day, cloud_consent,
                onboarding_step, onboarding_completed, guided_mode, learner_mode,
                first_steps_step, first_steps_completed, created_at, updated_at
            ) VALUES(1, 'Kevin', 'en', 'C1', 18, 'hints', 'difficult', 5, 0,
                     4, 1, 0, 'experienced', 5, 1,
                     '2026-07-22T00:00:00Z', '2026-07-22T00:00:00Z')
            """
        )
        connection.execute(
            """
            INSERT INTO skill_mastery(
                concept_key, concept_type, recognition, production,
                listening, speaking, observations, updated_at
            ) VALUES('item:1', 'learning_item', 0.7, 0.4, 0.2, 0.1, 6,
                     '2026-07-22T00:00:00Z')
            """
        )

    Database(path).initialize()

    with _open(path) as connection:
        profile = connection.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
        mastery = connection.execute(
            "SELECT * FROM skill_mastery WHERE concept_key = 'item:1'"
        ).fetchone()
    assert profile["cefr_band"] == "C1"
    assert profile["learner_mode"] == "experienced"
    assert mastery["recognition"] == 0.7
    assert mastery["production"] == 0.4
    assert mastery["pointed_reading"] == 0
    assert mastery["unpointed_reading"] == 0
    assert mastery["contextual_transfer"] == 0

    with _open(path) as connection:
        state_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(learning_core_state)")
        }
    assert "state_version" in state_columns


def test_daily_practice_migration_preserves_profile_and_adds_accessibility_fields(
    tmp_path: Path,
) -> None:
    path = tmp_path / "daily-practice-v5.db"
    with _open(path) as connection:
        for migration in MIGRATIONS[:5]:
            connection.executescript(migration.sql)
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('schema_version', '5')"
        )
        connection.execute(
            """
            INSERT INTO profiles(
                id, display_name, learner_mode, curriculum_track, cefr_band,
                created_at, updated_at
            ) VALUES(1, 'Returning learner', 'experienced', 'formal_professional', 'B2',
                     '2026-07-22T00:00:00Z', '2026-07-22T00:00:00Z')
            """
        )

    Database(path).initialize()

    with _open(path) as connection:
        profile = connection.execute(
            "SELECT display_name, text_scale, focus_status FROM profiles WHERE id = 1"
        ).fetchone()
        tables = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }
    assert dict(profile) == {
        "display_name": "Returning learner",
        "text_scale": 1.0,
        "focus_status": "available",
    }
    assert {
        "practice_sessions",
        "practice_step_events",
        "curriculum_progress",
    } <= tables


def test_replay_protection_migration_preserves_v4_learning_state(tmp_path: Path) -> None:
    path = tmp_path / "learning-core-v4.db"
    with _open(path) as connection:
        for migration in MIGRATIONS[:4]:
            connection.executescript(migration.sql)
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('schema_version', '4')"
        )
        connection.execute(
            """
            INSERT INTO profiles(
                id, display_name, learner_mode, curriculum_track, cefr_band,
                created_at, updated_at
            ) VALUES(1, 'Returning learner', 'experienced', 'formal_professional', 'B2',
                     '2026-07-22T00:00:00Z', '2026-07-22T00:00:00Z')
            """
        )
        connection.execute(
            """
            INSERT INTO learning_core_state(profile_id, current_item_id, phase, updated_at)
            VALUES(1, NULL, 'reflection', '2026-07-22T00:00:00Z')
            """
        )

    Database(path).initialize()

    with _open(path) as connection:
        state = connection.execute(
            "SELECT phase, updated_at, state_version FROM learning_core_state WHERE profile_id = 1"
        ).fetchone()
        replay_table = connection.execute(
            """
            SELECT 1 FROM sqlite_master
            WHERE type = 'table' AND name = 'learning_core_idempotency'
            """
        ).fetchone()
        version = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()[0]

    assert dict(state) == {
        "phase": "reflection",
        "updated_at": "2026-07-22T00:00:00Z",
        "state_version": 0,
    }
    assert replay_table is not None
    assert version == str(SCHEMA_VERSION)


def test_newer_database_is_rejected_without_modification(tmp_path: Path) -> None:
    path = tmp_path / "future.db"
    database = Database(path)
    database.initialize()
    with _open(path) as connection:
        connection.execute(
            "UPDATE app_meta SET value = ? WHERE key = 'schema_version'",
            (str(SCHEMA_VERSION + 1),),
        )
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('sentinel', 'untouched')"
        )

    with pytest.raises(SchemaMigrationError, match="newer than supported"):
        database.initialize()

    with _open(path) as connection:
        metadata = dict(connection.execute("SELECT key, value FROM app_meta").fetchall())
    assert metadata["schema_version"] == str(SCHEMA_VERSION + 1)
    assert metadata["sentinel"] == "untouched"


def test_invalid_schema_version_is_rejected(tmp_path: Path) -> None:
    path = tmp_path / "invalid.db"
    Database(path).initialize()
    with _open(path) as connection:
        connection.execute(
            "UPDATE app_meta SET value = 'not-a-version' WHERE key = 'schema_version'"
        )

    with pytest.raises(SchemaMigrationError, match="Invalid database schema version"):
        Database(path).initialize()


def test_pending_migrations_run_in_order(tmp_path: Path) -> None:
    path = tmp_path / "ordered.db"
    _create_versioned_fixture(path)

    class UpgradingDatabase(Database):
        migrations = (
            MIGRATIONS[0],
            Migration(
                version=2,
                name="add_probe_note",
                sql="ALTER TABLE migration_probe ADD COLUMN note TEXT;",
            ),
            Migration(
                version=3,
                name="populate_probe_note",
                sql="UPDATE migration_probe SET note = value || ' upgraded';",
            ),
        )

    UpgradingDatabase(path).initialize()

    with _open(path) as connection:
        row = connection.execute(
            "SELECT value, note FROM migration_probe WHERE id = 1"
        ).fetchone()
        version = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()[0]
    assert tuple(row) == ("preserve me", "preserve me upgraded")
    assert version == "3"


def test_failed_migration_rolls_back_entire_upgrade(tmp_path: Path) -> None:
    path = tmp_path / "rollback.db"
    _create_versioned_fixture(path)

    class FailingDatabase(Database):
        migrations = (
            MIGRATIONS[0],
            Migration(
                version=2,
                name="add_probe_note",
                sql="ALTER TABLE migration_probe ADD COLUMN note TEXT;",
            ),
            Migration(
                version=3,
                name="fail_after_schema_change",
                sql="INSERT INTO table_that_does_not_exist(value) VALUES('boom');",
            ),
        )

    with pytest.raises(sqlite3.OperationalError, match="no such table"):
        FailingDatabase(path).initialize()

    with _open(path) as connection:
        columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(migration_probe)")
        }
        version = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()[0]
        value = connection.execute(
            "SELECT value FROM migration_probe WHERE id = 1"
        ).fetchone()[0]
    assert "note" not in columns
    assert version == "1"
    assert value == "preserve me"


@pytest.mark.parametrize(
    "migrations",
    [
        (),
        (Migration(version=2, name="starts_too_late", sql="SELECT 1;"),),
        (
            Migration(version=1, name="first", sql="SELECT 1;"),
            Migration(version=3, name="gap", sql="SELECT 1;"),
        ),
    ],
)
def test_invalid_migration_sequence_is_rejected(
    tmp_path: Path, migrations: tuple[Migration, ...]
) -> None:
    class InvalidDatabase(Database):
        pass

    InvalidDatabase.migrations = migrations

    with pytest.raises(SchemaMigrationError, match="ordered, and contiguous"):
        InvalidDatabase(tmp_path / "invalid-sequence.db").initialize()
