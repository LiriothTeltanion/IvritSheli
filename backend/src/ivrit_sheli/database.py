"""
Module: database
Purpose: Own SQLite connections, schema creation, and transactional boundaries for local learner data.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path


class SchemaMigrationError(RuntimeError):
    """Raised when the stored schema cannot be migrated safely."""


@dataclass(frozen=True, slots=True)
class Migration:
    """One ordered SQLite schema migration."""

    version: int
    name: str
    sql: str

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    display_name TEXT NOT NULL DEFAULT 'Kevin',
    interface_language TEXT NOT NULL DEFAULT 'en',
    hebrew_level TEXT NOT NULL DEFAULT 'A2',
    daily_minutes INTEGER NOT NULL DEFAULT 18 CHECK (daily_minutes BETWEEN 5 AND 180),
    transliteration_mode TEXT NOT NULL DEFAULT 'hints',
    niqqud_mode TEXT NOT NULL DEFAULT 'difficult',
    weekly_rest_day INTEGER NOT NULL DEFAULT 5 CHECK (weekly_rest_day BETWEEN 0 AND 6),
    cloud_consent INTEGER NOT NULL DEFAULT 0 CHECK (cloud_consent IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL DEFAULT 1 REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    target_date TEXT,
    UNIQUE(profile_id, goal_type)
);

CREATE TABLE IF NOT EXISTS learning_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hebrew_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    hebrew_with_niqqud TEXT,
    transliteration TEXT,
    translation_en TEXT,
    translation_es TEXT,
    item_type TEXT NOT NULL DEFAULT 'phrase',
    root TEXT,
    binyan TEXT,
    grammatical_gender TEXT,
    register_label TEXT,
    context_label TEXT NOT NULL DEFAULT 'daily_life',
    source_label TEXT NOT NULL DEFAULT 'manual',
    personal_note TEXT,
    priority REAL NOT NULL DEFAULT 0.5 CHECK (priority BETWEEN 0 AND 1),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_learning_items_normalized
ON learning_items(normalized_text);

CREATE TABLE IF NOT EXISTS review_state (
    item_id INTEGER PRIMARY KEY REFERENCES learning_items(id) ON DELETE CASCADE,
    interval_days REAL NOT NULL DEFAULT 0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    due_at TEXT NOT NULL,
    last_reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_review_due ON review_state(due_at);

CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
    exercise_type TEXT NOT NULL,
    modality TEXT NOT NULL,
    is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    response_ms INTEGER NOT NULL DEFAULT 0 CHECK (response_ms >= 0),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
    mistake_category TEXT,
    answer_text TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attempts_item_created
ON attempts(item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS skill_mastery (
    concept_key TEXT PRIMARY KEY,
    concept_type TEXT NOT NULL,
    recognition REAL NOT NULL DEFAULT 0 CHECK (recognition BETWEEN 0 AND 1),
    production REAL NOT NULL DEFAULT 0 CHECK (production BETWEEN 0 AND 1),
    listening REAL NOT NULL DEFAULT 0 CHECK (listening BETWEEN 0 AND 1),
    speaking REAL NOT NULL DEFAULT 0 CHECK (speaking BETWEEN 0 AND 1),
    observations INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);

CREATE TABLE IF NOT EXISTS xp_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source_type TEXT,
    source_id TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_created ON xp_ledger(created_at DESC);

CREATE TABLE IF NOT EXISTS unlocked_achievements (
    achievement_key TEXT PRIMARY KEY,
    unlocked_at TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER REFERENCES learning_items(id) ON DELETE SET NULL,
    mission_text TEXT NOT NULL,
    context_label TEXT,
    scheduled_for TEXT,
    completed_at TEXT,
    success INTEGER CHECK (success IN (0, 1)),
    confidence_after INTEGER CHECK (confidence_after BETWEEN 1 AND 5),
    reflection TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    input_hash TEXT NOT NULL,
    result_json TEXT NOT NULL,
    degraded_mode INTEGER NOT NULL DEFAULT 0 CHECK (degraded_mode IN (0, 1)),
    learner_feedback INTEGER CHECK (learner_feedback BETWEEN -1 AND 1),
    latency_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audio_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER REFERENCES learning_items(id) ON DELETE SET NULL,
    target_text TEXT NOT NULL,
    transcript TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    breakdown_json TEXT NOT NULL,
    provider TEXT NOT NULL,
    retained_path TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connector_states (
    connector TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'disconnected',
    scopes_json TEXT NOT NULL DEFAULT '[]',
    last_sync_at TEXT,
    consent_at TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    route TEXT,
    request_id TEXT,
    diagnostics_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
);
"""


# Migration numbers are permanent and contiguous. Future schema changes append a
# new migration; existing entries must never be edited after release.
MIGRATIONS = (
    Migration(version=1, name="initial_schema", sql=SCHEMA_SQL),
    Migration(
        version=2,
        name="beginner_journey",
        sql="""
        ALTER TABLE profiles ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0
            CHECK (onboarding_step BETWEEN 0 AND 4);
        ALTER TABLE profiles ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0
            CHECK (onboarding_completed IN (0, 1));
        ALTER TABLE profiles ADD COLUMN guided_mode INTEGER NOT NULL DEFAULT 1
            CHECK (guided_mode IN (0, 1));
        ALTER TABLE profiles ADD COLUMN first_steps_step INTEGER NOT NULL DEFAULT 0
            CHECK (first_steps_step BETWEEN 0 AND 5);
        ALTER TABLE profiles ADD COLUMN first_steps_completed INTEGER NOT NULL DEFAULT 0
            CHECK (first_steps_completed IN (0, 1));

        -- Existing 2.2 learners keep their exact profile and continue where they were.
        -- Fresh installs have no profile row yet and therefore retain the beginner defaults.
        UPDATE profiles
        SET onboarding_step = 4,
            onboarding_completed = 1,
            first_steps_step = 5,
            first_steps_completed = 1;
        """,
    ),
    Migration(
        version=3,
        name="three_learner_modes",
        sql="""
        ALTER TABLE profiles ADD COLUMN learner_mode TEXT NOT NULL DEFAULT 'guided'
            CHECK (learner_mode IN ('guided', 'explorer', 'experienced'));

        -- Keep the legacy boolean meaningful for older clients while giving
        -- every existing learner a deterministic mode in the richer model.
        UPDATE profiles
        SET learner_mode = CASE
            WHEN guided_mode = 1 THEN 'guided'
            ELSE 'explorer'
        END;
        """,
    ),
)
SCHEMA_VERSION = MIGRATIONS[-1].version


class Database:
    """SQLite connection factory and schema manager.

    Args:
        path: Database file path. `:memory:` is supported for focused tests.

    Example:
        >>> db = Database(Path(":memory:"))
        >>> db.initialize()
    """

    migrations = MIGRATIONS

    def __init__(self, path: Path) -> None:
        self.path = path
        self._memory_connection: sqlite3.Connection | None = None

    def connect(self) -> sqlite3.Connection:
        """Open a configured SQLite connection.

        Returns:
            Connection with row access, foreign keys, and busy timeout enabled.

        Raises:
            sqlite3.Error: If SQLite cannot open the database.

        Example:
            >>> db = Database(Path(":memory:"))
            >>> db.connect().execute("SELECT 1").fetchone()[0]
            1
        """
        if str(self.path) == ":memory:":
            if self._memory_connection is None:
                self._memory_connection = sqlite3.connect(
                    ":memory:", timeout=10, check_same_thread=False
                )
                self._configure(self._memory_connection)
            return self._memory_connection

        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=10, check_same_thread=False)
        self._configure(connection)
        return connection

    @staticmethod
    def _configure(connection: sqlite3.Connection) -> None:
        """Configure one connection consistently.

        Args:
            connection: SQLite connection.

        Returns:
            None.

        Example:
            >>> connection = sqlite3.connect(":memory:")
            >>> Database._configure(connection)
        """
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 5000")
        connection.execute("PRAGMA journal_mode = WAL")

    def initialize(self) -> None:
        """Create or upgrade the application schema.

        Returns:
            None.

        Raises:
            SchemaMigrationError: If the stored version is invalid or newer than this app.
            sqlite3.Error: If a migration fails.

        Example:
            >>> db = Database(Path(":memory:"))
            >>> db.initialize()
        """
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            target_version = self._validate_migrations(self.migrations)
            connection.execute("BEGIN IMMEDIATE")
            current_version = self._read_schema_version(connection)

            if current_version > target_version:
                raise SchemaMigrationError(
                    "Database schema version "
                    f"{current_version} is newer than supported version {target_version}; "
                    "upgrade the application before opening this database."
                )

            for migration in self.migrations:
                if migration.version <= current_version:
                    continue
                self._execute_migration_sql(connection, migration.sql)
                self._write_schema_version(connection, migration.version)
                current_version = migration.version

            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            if should_close:
                connection.close()

    @staticmethod
    def _validate_migrations(migrations: tuple[Migration, ...]) -> int:
        """Validate ordering and return the application schema version."""
        versions = tuple(migration.version for migration in migrations)
        expected = tuple(range(1, len(migrations) + 1))
        if not migrations or versions != expected:
            raise SchemaMigrationError(
                "Schema migrations must be non-empty, ordered, and contiguous from version 1; "
                f"found versions {versions}."
            )
        return versions[-1]

    @staticmethod
    def _read_schema_version(connection: sqlite3.Connection) -> int:
        """Read the stored schema version, treating an unversioned database as version 0."""
        meta_exists = connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'app_meta'"
        ).fetchone()
        if meta_exists is None:
            return 0

        row = connection.execute(
            "SELECT value FROM app_meta WHERE key = 'schema_version'"
        ).fetchone()
        if row is None:
            return 0

        raw_version = row["value"]
        try:
            version = int(raw_version)
        except (TypeError, ValueError) as exc:
            raise SchemaMigrationError(
                f"Invalid database schema version {raw_version!r}; expected a non-negative integer."
            ) from exc
        if version < 0:
            raise SchemaMigrationError(
                f"Invalid database schema version {raw_version!r}; expected a non-negative integer."
            )
        return version

    @staticmethod
    def _write_schema_version(connection: sqlite3.Connection, version: int) -> None:
        """Persist a successfully applied migration version inside its transaction."""
        connection.execute(
            "INSERT INTO app_meta(key, value) VALUES('schema_version', ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (str(version),),
        )

    @staticmethod
    def _execute_migration_sql(connection: sqlite3.Connection, script: str) -> None:
        """Execute a SQL script without sqlite3.executescript's implicit commit."""
        buffer: list[str] = []
        for character in script:
            buffer.append(character)
            if character != ";":
                continue
            statement = "".join(buffer)
            if not sqlite3.complete_statement(statement):
                continue
            if statement.strip():
                connection.execute(statement)
            buffer.clear()

        trailing_statement = "".join(buffer).strip()
        if trailing_statement:
            connection.execute(trailing_statement)

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        """Yield a connection inside an immediate transaction.

        Yields:
            Transactional connection.

        Raises:
            sqlite3.Error: Re-raised after rollback.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize()
            >>> with db.transaction() as conn:
            ...     conn.execute("INSERT INTO app_meta VALUES('x', '1')")
        """
        connection = self.connect()
        should_close = str(self.path) != ":memory:"
        try:
            connection.execute("BEGIN IMMEDIATE")
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            if should_close:
                connection.close()

    def close(self) -> None:
        """Close the retained in-memory connection, if any.

        Returns:
            None.

        Example:
            >>> db = Database(Path(":memory:")); db.close()
        """
        if self._memory_connection is not None:
            self._memory_connection.close()
            self._memory_connection = None
