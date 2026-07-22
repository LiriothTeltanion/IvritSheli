"""Tenant-scoped PostgreSQL repository adapter for the mature SQLite learning engine.

Each request hydrates an isolated in-memory SQLite database from the authenticated user's
PostgreSQL JSONB state. Mutations are serialized beneath a PostgreSQL row lock, executed by the
same well-tested domain repository used in local mode, and written back atomically. This keeps
offline behavior stable while making PostgreSQL the durable cloud system of record.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any, TypeVar, cast

from ivrit_sheli.cloud_store import CloudStore
from ivrit_sheli.database import Database
from ivrit_sheli.repository import LearningRepository
from ivrit_sheli.seed import STARTER_ITEMS

STATE_FORMAT = "ivrit-sheli-postgres-state-v2"
STATE_TABLES = (
    "profiles",
    "goals",
    "learning_items",
    "review_state",
    "attempts",
    "skill_mastery",
    "user_events",
    "xp_ledger",
    "unlocked_achievements",
    "missions",
    "ai_interactions",
    "audio_attempts",
    "connector_states",
    "bug_reports",
)
Result = TypeVar("Result")


class CloudLearningRepository:
    """Expose the local domain repository against one authenticated tenant document."""

    def __init__(
        self,
        store: CloudStore,
        user_id: str,
        display_name: str,
        *,
        seed_demo: bool = False,
    ) -> None:
        self.store = store
        self.user_id = user_id
        self.display_name = display_name
        self.seed_demo = seed_demo
        self._ensure_initialized()

    def _ensure_initialized(self) -> None:
        if self.store.read_state(self.user_id):
            return

        def initialize(current: dict[str, Any]) -> tuple[dict[str, Any], None]:
            if current:
                return current, None
            database, repository = self._hydrate({})
            try:
                repository.ensure_default_profile(self.display_name)
                if self.seed_demo:
                    for payload in STARTER_ITEMS[:6]:
                        repository.create_item(dict(payload))
                return self._snapshot(database), None
            finally:
                database.close()

        self.store.mutate_state(self.user_id, initialize)

    def _hydrate(self, state: dict[str, Any]) -> tuple[Database, LearningRepository]:
        database = Database(Path(":memory:"))
        database.initialize()
        tables = state.get("tables") if state.get("format") == STATE_FORMAT else None
        if isinstance(tables, dict):
            connection = database.connect()
            connection.execute("PRAGMA defer_foreign_keys = ON")
            for table in STATE_TABLES:
                allowed_columns = {
                    str(row["name"])
                    for row in connection.execute(f"PRAGMA table_info({table})").fetchall()
                }
                rows = tables.get(table, [])
                if not isinstance(rows, list):
                    continue
                for row in rows:
                    if not isinstance(row, dict) or not row:
                        continue
                    hydrated_row = dict(row)
                    if table == "profiles" and "onboarding_completed" not in hydrated_row:
                        # A 2.2 cloud snapshot belongs to a returning learner. Keep every
                        # stored preference (especially level) and skip only the new-tour gates.
                        hydrated_row.update(
                            {
                                "onboarding_step": 4,
                                "onboarding_completed": 1,
                                "first_steps_step": 5,
                                "first_steps_completed": 1,
                            }
                        )
                    if table == "profiles" and "learner_mode" not in hydrated_row:
                        hydrated_row["learner_mode"] = (
                            "guided" if bool(hydrated_row.get("guided_mode", 1)) else "explorer"
                        )
                    columns = tuple(
                        column for column in hydrated_row if column in allowed_columns
                    )
                    if not columns:
                        continue
                    placeholders = ", ".join("?" for _ in columns)
                    column_sql = ", ".join(columns)
                    connection.execute(
                        f"INSERT INTO {table}({column_sql}) VALUES({placeholders})",
                        tuple(hydrated_row[column] for column in columns),
                    )
            connection.commit()
        return database, LearningRepository(database)

    @staticmethod
    def _snapshot(database: Database) -> dict[str, Any]:
        connection = database.connect()
        return {
            "format": STATE_FORMAT,
            "tables": {
                table: [
                    dict(row) for row in connection.execute(f"SELECT * FROM {table}").fetchall()
                ]
                for table in STATE_TABLES
            },
        }

    def _read(self, method: str, *args: Any, **kwargs: Any) -> Any:
        database, repository = self._hydrate(self.store.read_state(self.user_id))
        try:
            target = getattr(repository, method)
            return target(*args, **kwargs)
        finally:
            database.close()

    def _write(self, method: str, *args: Any, **kwargs: Any) -> Any:
        def operation(state: dict[str, Any]) -> tuple[dict[str, Any], Any]:
            database, repository = self._hydrate(state)
            try:
                target: Callable[..., Any] = getattr(repository, method)
                result = target(*args, **kwargs)
                return self._snapshot(database), result
            finally:
                database.close()

        return self.store.mutate_state(self.user_id, operation)

    def run_with_database(
        self,
        operation: Callable[[Database], Result],
        *,
        write: bool,
    ) -> Result:
        """Run a database-bound AI/audio/connector service inside this tenant state."""
        if not write:
            database, _ = self._hydrate(self.store.read_state(self.user_id))
            try:
                return operation(database)
            finally:
                database.close()

        def mutate(state: dict[str, Any]) -> tuple[dict[str, Any], Result]:
            database, _ = self._hydrate(state)
            try:
                result = operation(database)
                return self._snapshot(database), result
            finally:
                database.close()

        return self.store.mutate_state(self.user_id, mutate)

    def ensure_default_profile(self, display_name: str = "Learner") -> None:
        self._write("ensure_default_profile", display_name)

    def create_item(self, payload: dict[str, Any]) -> dict[str, Any]:
        return cast(dict[str, Any], self._write("create_item", payload))

    def get_or_create_dictionary_item(
        self,
        entry_id: int,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Atomically link one exact dictionary entry inside one tenant mutation."""
        return cast(
            dict[str, Any],
            self._write("get_or_create_dictionary_item", entry_id, payload),
        )

    def create_items(self, payloads: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Create one bounded batch beneath a single hydrate/lock/snapshot cycle."""

        def operation(state: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
            database, repository = self._hydrate(state)
            try:
                created = [repository.create_item(payload) for payload in payloads]
                return self._snapshot(database), created
            finally:
                database.close()

        return self.store.mutate_state(self.user_id, operation)

    def get_item(self, item_id: int) -> dict[str, Any]:
        return cast(dict[str, Any], self._read("get_item", item_id))

    def list_items(self, limit: int = 100, query: str = "") -> list[dict[str, Any]]:
        return cast(list[dict[str, Any]], self._read("list_items", limit, query))

    def registry_items(
        self,
        *,
        limit: int = 200,
        offset: int = 0,
        query: str = "",
        status: str = "all",
        due: str = "all",
        sort: str = "last_activity_desc",
    ) -> dict[str, Any]:
        """Read the authenticated tenant's searchable learning registry."""
        return cast(
            dict[str, Any],
            self._read(
                "registry_items",
                limit=limit,
                offset=offset,
                query=query,
                status=status,
                due=due,
                sort=sort,
            ),
        )

    def learning_states_for_sources(
        self,
        source_labels: list[str],
    ) -> dict[str, dict[str, Any]]:
        """Read exact dictionary-entry links from only this tenant's hydrated state."""
        return cast(
            dict[str, dict[str, Any]],
            self._read("learning_states_for_sources", source_labels),
        )

    def next_reviews(self, limit: int = 10) -> list[dict[str, Any]]:
        return cast(list[dict[str, Any]], self._read("next_reviews", limit))

    def submit_review(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        return cast(dict[str, Any], self._write("submit_review", item_id, payload))

    def recommendations(self, limit: int = 8) -> list[dict[str, Any]]:
        return cast(list[dict[str, Any]], self._read("recommendations", limit))

    def dashboard(self) -> dict[str, Any]:
        return cast(dict[str, Any], self._read("dashboard"))

    def export_json(self, destination: Path) -> Path:
        return cast(Path, self._read("export_json", destination))

    def create_bug_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        return cast(dict[str, Any], self._write("create_bug_report", payload))

    def get_profile(self) -> dict[str, Any]:
        return cast(dict[str, Any], self._read("get_profile"))

    def update_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        return cast(dict[str, Any], self._write("update_profile", payload))

    def progress(self) -> dict[str, Any]:
        return cast(dict[str, Any], self._read("progress"))

    def gamification_status(self) -> dict[str, Any]:
        return cast(dict[str, Any], self._read("gamification_status"))

    def log_event(
        self,
        event_type: str,
        entity_type: str | None = None,
        entity_id: str | None = None,
        payload: dict[str, Any] | None = None,
        xp_action: Any | None = None,
    ) -> None:
        self._write(
            "log_event",
            event_type,
            entity_type,
            entity_id,
            payload,
            xp_action,
        )

    def create_mission(self, payload: dict[str, Any]) -> dict[str, Any]:
        return cast(dict[str, Any], self._write("create_mission", payload))

    def get_mission(self, mission_id: int) -> dict[str, Any]:
        return cast(dict[str, Any], self._read("get_mission", mission_id))

    def complete_mission(self, mission_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        return cast(dict[str, Any], self._write("complete_mission", mission_id, payload))
