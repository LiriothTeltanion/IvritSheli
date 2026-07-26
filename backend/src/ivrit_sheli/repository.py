"""
Module: learning repository
Purpose: Persist learner items and coordinate atomic review, mastery, XP, and achievement updates.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import sqlite3
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, cast
from uuid import uuid4
from zoneinfo import ZoneInfo

from ivrit_sheli.database import Database
from ivrit_sheli.gamification import (
    ACHIEVEMENTS,
    XPAction,
    evaluate_achievement_keys,
    level_progress,
    xp_for_action,
)
from ivrit_sheli.learning_core import (
    CEFR_BANDS,
    CONTRACT_VERSION,
    CURRICULUM_TRACKS,
    EVIDENCE_KINDS,
    LEARNER_MODES,
    LESSON_PHASES,
    READING_EVIDENCE_THRESHOLD,
    READING_SUPPORT_LADDER,
    SKILL_DIMENSIONS,
    LearnerMode,
    LearningCoreConflictError,
    LessonPhase,
    ReadingSupport,
    activity_prompt_key,
    activity_rationale,
    apply_reading_evidence,
    build_activity_token,
    evidence_kind_for_activity,
    reading_evidence_to_advance,
    skill_for_activity,
    transition_phase,
)
from ivrit_sheli.local_learning_engine import (
    LocalLearningEngine,
    PracticeConflictError,
)
from ivrit_sheli.normalization import normalize_hebrew
from ivrit_sheli.personalization import MasteryState, focus_summary, update_mastery
from ivrit_sheli.recommendation import RecommendationCandidate, rank_candidates
from ivrit_sheli.scheduler import ReviewState, review_urgency, schedule_review

PRONUNCIATION_MASTERY_THRESHOLD = 70
# One full lesson loop is 7 attempts, so a single active session can easily
# exceed a small cap; 200 keeps replay/conflict protection durable across a
# long session while remaining a bounded table.
LEARNING_CORE_IDEMPOTENCY_RETENTION = 200
PRACTICE_TIMEZONE = ZoneInfo("Asia/Jerusalem")
REGISTRY_STATUSES = {"all", "active", "mastered", "needs_review"}
REGISTRY_DUE_FILTERS = {"all", "due", "upcoming"}
REGISTRY_SORTS = {
    "alphabetical",
    "due_asc",
    "last_activity_desc",
    "saved_asc",
    "saved_desc",
    "mastery_desc",
}


def utc_now() -> datetime:
    """Return the current UTC timestamp.

    Returns:
        Timezone-aware datetime.

    Example:
        >>> utc_now().tzinfo is not None
        True
    """
    return datetime.now(timezone.utc)


def iso_now() -> str:
    """Return a compact UTC ISO timestamp.

    Returns:
        ISO timestamp.

    Example:
        >>> iso_now().endswith('+00:00')
        True
    """
    return utc_now().isoformat(timespec="seconds")


class LearningRepository:
    """High-level persistence API for the learning domain.

    Args:
        database: Initialized application database.

    Example:
        >>> db = Database(Path(":memory:")); db.initialize()
        >>> repo = LearningRepository(db); repo.ensure_default_profile()
    """

    def __init__(self, database: Database) -> None:
        self.database = database

    def ensure_default_profile(self, display_name: str = "Kevin") -> None:
        """Create the single local profile and starter goals if absent.

        Args:
            display_name: Friendly local display name.

        Returns:
            None.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize()
            >>> LearningRepository(db).ensure_default_profile("Kevin")
        """
        now = iso_now()
        with self.database.transaction() as connection:
            connection.execute(
                """
                INSERT OR IGNORE INTO profiles(
                    id, display_name, interface_language, hebrew_level,
                    daily_minutes, transliteration_mode, niqqud_mode,
                    weekly_rest_day, cloud_consent, created_at, updated_at
                ) VALUES(1, ?, 'en', 'A0', 10, 'hints', 'always', 5, 0, ?, ?)
                """,
                (display_name, now, now),
            )
            for goal_type, weight in (
                ("daily_life", 0.35),
                ("workplace", 0.30),
                ("speaking", 0.20),
                ("reading", 0.10),
                ("writing", 0.05),
            ):
                connection.execute(
                    """
                    INSERT OR IGNORE INTO goals(profile_id, goal_type, weight)
                    VALUES(1, ?, ?)
                    """,
                    (goal_type, weight),
                )

    def create_item(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a learning item and immediate review state.

        Args:
            payload: Item fields; `hebrew_text` is required.

        Returns:
            Created item record.

        Raises:
            ValueError: If Hebrew text is missing.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize()
            >>> repo = LearningRepository(db); repo.ensure_default_profile()
            >>> repo.create_item({"hebrew_text": "שלום"})["hebrew_text"]
            'שלום'
        """
        hebrew_text, normalized = self._validate_item_identity(payload)
        with self.database.transaction() as connection:
            item_id = self._create_item_in_transaction(
                connection,
                payload,
                hebrew_text=hebrew_text,
                normalized=normalized,
            )

        return self.get_item(item_id)

    def get_or_create_dictionary_item(
        self,
        entry_id: int,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Atomically link one exact dictionary entry to the learner collection."""
        if entry_id < 1:
            raise ValueError("entry_id must be positive")
        source_label = f"dictionary:{entry_id}"
        dictionary_payload = {
            **payload,
            "context_label": "dictionary",
            "source_label": source_label,
        }
        hebrew_text, normalized = self._validate_item_identity(dictionary_payload)
        with self.database.transaction() as connection:
            existing = connection.execute(
                """
                SELECT id
                FROM learning_items
                WHERE source_label = ? AND archived_at IS NULL
                ORDER BY id
                LIMIT 1
                """,
                (source_label,),
            ).fetchone()
            if existing is not None:
                item_id = int(existing["id"])
            else:
                item_id = self._create_item_in_transaction(
                    connection,
                    dictionary_payload,
                    hebrew_text=hebrew_text,
                    normalized=normalized,
                )
        return self.get_item(item_id)

    @staticmethod
    def _validate_item_identity(payload: dict[str, Any]) -> tuple[str, str]:
        """Validate and normalize the identity fields shared by item creation paths."""
        hebrew_text = str(payload.get("hebrew_text", "")).strip()
        if not hebrew_text:
            raise ValueError("hebrew_text is required")
        normalized = normalize_hebrew(hebrew_text)
        if not normalized:
            raise ValueError("hebrew_text must contain searchable text")
        return hebrew_text, normalized

    def _create_item_in_transaction(
        self,
        connection: sqlite3.Connection,
        payload: dict[str, Any],
        *,
        hebrew_text: str,
        normalized: str,
    ) -> int:
        """Insert one item and its coupled review/event/XP state in the active transaction."""
        now = iso_now()
        cursor = connection.execute(
            """
            INSERT INTO learning_items(
                hebrew_text, normalized_text, hebrew_with_niqqud,
                transliteration, translation_en, translation_es, item_type,
                root, binyan, grammatical_gender, register_label,
                context_label, source_label, personal_note, priority,
                created_at, updated_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                hebrew_text,
                normalized,
                payload.get("hebrew_with_niqqud"),
                payload.get("transliteration"),
                payload.get("translation_en"),
                payload.get("translation_es"),
                payload.get("item_type", "phrase"),
                payload.get("root"),
                payload.get("binyan"),
                payload.get("grammatical_gender"),
                payload.get("register_label"),
                payload.get("context_label", "daily_life"),
                payload.get("source_label", "manual"),
                payload.get("personal_note"),
                max(0.0, min(1.0, float(payload.get("priority", 0.5)))),
                now,
                now,
            ),
        )
        item_id_raw = cursor.lastrowid
        if item_id_raw is None:
            raise sqlite3.DatabaseError("SQLite did not return a learning item ID")
        item_id = int(item_id_raw)
        connection.execute(
            "INSERT INTO review_state(item_id, due_at) VALUES(?, ?)",
            (item_id, now),
        )
        connection.execute(
            """
            INSERT INTO user_events(event_type, entity_type, entity_id, payload_json, created_at)
            VALUES('item_created', 'learning_item', ?, ?, ?)
            """,
            (
                str(item_id),
                json.dumps({"context": payload.get("context_label", "daily_life")}),
                now,
            ),
        )
        self._award_xp(connection, XPAction.NEW_CAPTURE, "learning_item", str(item_id))
        # Achievements should react to the behavior that satisfies them, not a later review.
        self._unlock_achievements(connection, now)
        return item_id

    def get_item(self, item_id: int) -> dict[str, Any]:
        """Retrieve one learning item.

        Args:
            item_id: Item identifier.

        Returns:
            Item dictionary.

        Raises:
            KeyError: If the item does not exist.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); item = repo.create_item({"hebrew_text": "כן"})
            >>> repo.get_item(item["id"])["hebrew_text"]
            'כן'
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            row = connection.execute(
                "SELECT * FROM learning_items WHERE id = ?", (item_id,)
            ).fetchone()
            if row is None:
                raise KeyError(f"Learning item {item_id} not found")
            return dict(row)
        finally:
            if should_close:
                connection.close()

    def list_items(self, limit: int = 100, query: str = "") -> list[dict[str, Any]]:
        """List active learning items with optional normalized search.

        Args:
            limit: Maximum rows.
            query: Optional Hebrew or translation query.

        Returns:
            Item dictionaries.

        Raises:
            ValueError: If limit is outside 1–500.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); len(repo.list_items())
            0
        """
        if not 1 <= limit <= 500:
            raise ValueError("limit must be between 1 and 500")
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            if query.strip():
                normalized = f"%{normalize_hebrew(query)}%"
                raw = f"%{query.strip()}%"
                rows = connection.execute(
                    """
                    SELECT * FROM learning_items
                    WHERE archived_at IS NULL
                      AND (normalized_text LIKE ? OR translation_en LIKE ? OR translation_es LIKE ?)
                    ORDER BY priority DESC, created_at DESC
                    LIMIT ?
                    """,
                    (normalized, raw, raw, limit),
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT * FROM learning_items
                    WHERE archived_at IS NULL
                    ORDER BY priority DESC, created_at DESC
                    LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
            return [dict(row) for row in rows]
        finally:
            if should_close:
                connection.close()

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
        """Return the learner's active vocabulary with review and mastery context.

        Registry labels are derived only from stored learning signals. An item that is due is
        ``needs_review``. A non-due item is ``mastered`` after five successful repetitions, a
        two-week interval, and at least 65% mastery in two modalities; all others stay ``active``.
        """
        if not 1 <= limit <= 500:
            raise ValueError("limit must be between 1 and 500")
        if offset < 0:
            raise ValueError("offset must be zero or greater")
        if status not in REGISTRY_STATUSES:
            raise ValueError("status must be all, active, mastered, or needs_review")
        if due not in REGISTRY_DUE_FILTERS:
            raise ValueError("due must be all, due, or upcoming")
        if sort not in REGISTRY_SORTS:
            raise ValueError(
                "sort must be alphabetical, due_asc, last_activity_desc, saved_asc, "
                "saved_desc, or mastery_desc"
            )

        now = iso_now()
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            parameters: dict[str, Any] = {"now": now}
            search_clause = ""
            if query.strip():
                parameters.update(
                    {
                        "normalized_query": f"%{normalize_hebrew(query)}%",
                        "raw_query": f"%{query.strip().lower()}%",
                    }
                )
                search_clause = """
                    AND (
                        i.normalized_text LIKE :normalized_query
                        OR lower(COALESCE(i.translation_en, '')) LIKE :raw_query
                        OR lower(COALESCE(i.translation_es, '')) LIKE :raw_query
                        OR lower(COALESCE(i.transliteration, '')) LIKE :raw_query
                        OR lower(COALESCE(i.root, '')) LIKE :raw_query
                    )
                """

            registry_cte = f"""
                WITH attempt_stats AS (
                    SELECT item_id, COUNT(*) AS review_count, MAX(created_at) AS last_attempt_at
                    FROM attempts
                    GROUP BY item_id
                ),
                registry_rows AS (
                    SELECT i.*, r.interval_days, r.ease_factor, r.repetitions, r.lapses,
                           r.due_at, r.last_reviewed_at,
                           COALESCE(a.review_count, 0) AS review_count,
                           a.last_attempt_at,
                           COALESCE(m.recognition, 0) AS mastery_recognition,
                           COALESCE(m.production, 0) AS mastery_production,
                           COALESCE(m.listening, 0) AS mastery_listening,
                           COALESCE(m.speaking, 0) AS mastery_speaking,
                           COALESCE(m.observations, 0) AS mastery_observations,
                           m.updated_at AS mastery_updated_at,
                           CASE
                               WHEN r.due_at <= :now THEN 'needs_review'
                               WHEN r.repetitions >= 5
                                    AND r.interval_days >= 14
                                    AND (
                                        CASE WHEN COALESCE(m.recognition, 0) >= 0.65 THEN 1 ELSE 0 END
                                        + CASE WHEN COALESCE(m.production, 0) >= 0.65 THEN 1 ELSE 0 END
                                        + CASE WHEN COALESCE(m.listening, 0) >= 0.65 THEN 1 ELSE 0 END
                                        + CASE WHEN COALESCE(m.speaking, 0) >= 0.65 THEN 1 ELSE 0 END
                                    ) >= 2
                               THEN 'mastered'
                               ELSE 'active'
                           END AS _registry_status,
                           CASE WHEN r.due_at <= :now THEN 'due' ELSE 'upcoming' END
                               AS _registry_due_state,
                           MAX(
                               COALESCE(a.last_attempt_at, ''),
                               COALESCE(r.last_reviewed_at, ''),
                               COALESCE(m.updated_at, ''),
                               i.created_at
                           ) AS _registry_last_activity,
                           MAX(
                               COALESCE(m.recognition, 0),
                               COALESCE(m.production, 0),
                               COALESCE(m.listening, 0),
                               COALESCE(m.speaking, 0)
                           ) AS _registry_mastery_score
                    FROM learning_items i
                    JOIN review_state r ON r.item_id = i.id
                    LEFT JOIN attempt_stats a ON a.item_id = i.id
                    LEFT JOIN skill_mastery m ON m.concept_key = 'item:' || i.id
                    WHERE i.archived_at IS NULL
                    {search_clause}
                )
            """
            filters: list[str] = []
            if status != "all":
                filters.append("_registry_status = :status")
                parameters["status"] = status
            if due != "all":
                filters.append("_registry_due_state = :due")
                parameters["due"] = due
            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
            summary_where_clause = (
                "WHERE _registry_due_state = :due" if due != "all" else ""
            )
            order_clause = {
                "alphabetical": "normalized_text ASC, id ASC",
                "due_asc": "due_at ASC, id ASC",
                "saved_asc": "created_at ASC, id ASC",
                "saved_desc": "created_at DESC, id DESC",
                "mastery_desc": (
                    "_registry_mastery_score DESC, _registry_last_activity DESC, id DESC"
                ),
                "last_activity_desc": "_registry_last_activity DESC, id DESC",
            }[sort]

            summary_rows = connection.execute(
                f"""
                {registry_cte}
                SELECT _registry_status AS status, COUNT(*) AS count
                FROM registry_rows
                {summary_where_clause}
                GROUP BY _registry_status
                """,
                parameters,
            ).fetchall()
            summary = {"active": 0, "mastered": 0, "needs_review": 0}
            summary.update({str(row["status"]): int(row["count"]) for row in summary_rows})

            total = int(
                connection.execute(
                    f"""
                    {registry_cte}
                    SELECT COUNT(*)
                    FROM registry_rows
                    {where_clause}
                    """,
                    parameters,
                ).fetchone()[0]
            )
            page_parameters = {**parameters, "limit": limit, "offset": offset}
            rows = connection.execute(
                f"""
                {registry_cte}
                SELECT *
                FROM registry_rows
                {where_clause}
                ORDER BY {order_clause}
                LIMIT :limit OFFSET :offset
                """,
                page_parameters,
            ).fetchall()
            records = [self._registry_record(dict(row), now) for row in rows]
            next_offset = offset + len(records)
            has_more = next_offset < total
            return {
                "items": records,
                "total": total,
                "summary": summary,
                "offset": offset,
                "limit": limit,
                "has_more": has_more,
                "next_offset": next_offset if has_more else None,
            }
        finally:
            if should_close:
                connection.close()

    def learning_states_for_sources(
        self,
        source_labels: list[str],
    ) -> dict[str, dict[str, Any]]:
        """Return active item state keyed by exact dictionary source identity."""
        sources = sorted({source.strip() for source in source_labels if source.strip()})
        if not sources:
            return {}
        placeholders = ", ".join("?" for _ in sources)
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            rows = connection.execute(
                f"""
                SELECT i.*, r.interval_days, r.ease_factor, r.repetitions, r.lapses,
                       r.due_at, r.last_reviewed_at, 0 AS review_count,
                       NULL AS last_attempt_at,
                       COALESCE(m.recognition, 0) AS mastery_recognition,
                       COALESCE(m.production, 0) AS mastery_production,
                       COALESCE(m.listening, 0) AS mastery_listening,
                       COALESCE(m.speaking, 0) AS mastery_speaking,
                       COALESCE(m.observations, 0) AS mastery_observations,
                       m.updated_at AS mastery_updated_at
                FROM learning_items i
                JOIN review_state r ON r.item_id = i.id
                LEFT JOIN skill_mastery m ON m.concept_key = 'item:' || i.id
                WHERE i.archived_at IS NULL AND i.source_label IN ({placeholders})
                ORDER BY i.created_at
                """,
                sources,
            ).fetchall()
            now = iso_now()
            states: dict[str, dict[str, Any]] = {}
            for row in rows:
                record = self._registry_record(dict(row), now)
                states.setdefault(
                    str(row["source_label"]),
                    {
                        "item_id": record["id"],
                        "status": record["status"],
                        "due_state": record["due_state"],
                    },
                )
            return states
        finally:
            if should_close:
                connection.close()

    @staticmethod
    def _registry_record(row: dict[str, Any], now: str) -> dict[str, Any]:
        """Convert one joined database row into a stable registry contract."""
        computed_status = row.pop("_registry_status", None)
        computed_due_state = row.pop("_registry_due_state", None)
        computed_last_activity = row.pop("_registry_last_activity", None)
        row.pop("_registry_mastery_score", None)
        modalities = {
            "recognition": round(float(row.pop("mastery_recognition", 0)), 4),
            "production": round(float(row.pop("mastery_production", 0)), 4),
            "listening": round(float(row.pop("mastery_listening", 0)), 4),
            "speaking": round(float(row.pop("mastery_speaking", 0)), 4),
        }
        observations = int(row.pop("mastery_observations", 0))
        mastery_updated_at = row.pop("mastery_updated_at", None)
        last_attempt_at = row.pop("last_attempt_at", None)
        is_due = str(row["due_at"]) <= now
        strong_modalities = sum(value >= 0.65 for value in modalities.values())
        mastered = (
            not is_due
            and int(row["repetitions"]) >= 5
            and float(row["interval_days"]) >= 14
            and strong_modalities >= 2
        )
        if computed_status is not None:
            registry_status = str(computed_status)
        elif is_due:
            registry_status = "needs_review"
        elif mastered:
            registry_status = "mastered"
        else:
            registry_status = "active"
        due_state = (
            str(computed_due_state)
            if computed_due_state is not None
            else "due"
            if is_due
            else "upcoming"
        )
        # Application timestamps use canonical ISO-8601 UTC, so lexical max is chronological.
        last_activity_at = (
            str(computed_last_activity)
            if computed_last_activity
            else max(
                str(value)
                for value in (
                    last_attempt_at,
                    row.get("last_reviewed_at"),
                    mastery_updated_at,
                    row["created_at"],
                )
                if value
            )
        )
        row.update(
            {
                "status": registry_status,
                "due_state": due_state,
                "review_count": int(row["review_count"]),
                "saved_at": row["created_at"],
                "last_activity_at": last_activity_at,
                "mastery": {**modalities, "observations": observations},
            }
        )
        return row

    def next_reviews(self, limit: int = 10) -> list[dict[str, Any]]:
        """Return reviews that are due now in priority order.

        Args:
            limit: Maximum review count.

        Returns:
            Item and review-state records.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.create_item({"hebrew_text": "כן"})
            >>> len(repo.next_reviews())
            1
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            rows = connection.execute(
                """
                SELECT i.*, r.interval_days, r.ease_factor, r.repetitions,
                       r.lapses, r.due_at, r.last_reviewed_at
                FROM review_state r
                JOIN learning_items i ON i.id = r.item_id
                WHERE i.archived_at IS NULL
                  AND r.due_at <= ?
                ORDER BY r.due_at ASC, i.priority DESC
                LIMIT ?
                """,
                (iso_now(), limit),
            ).fetchall()
            return [dict(row) for row in rows]
        finally:
            if should_close:
                connection.close()

    def learning_core_state(self) -> dict[str, Any]:
        """Return the stable v2.6 curriculum, skill, and current-journey state."""
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            payload, _item = self._learning_core_read_model(connection)
            return payload
        finally:
            if should_close:
                connection.close()

    def next_learning_core_activity(self) -> dict[str, Any]:
        """Return one explainable activity without mutating learner state."""
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            state_payload, item = self._learning_core_read_model(connection)
            activity = self._learning_core_activity(state_payload, item)
            return {
                "contract_version": CONTRACT_VERSION,
                "available": bool(activity and activity["can_submit"]),
                "activity": activity,
                "state": state_payload["state"],
            }
        finally:
            if should_close:
                connection.close()

    def curriculum_path(self) -> dict[str, Any]:
        """Return the deterministic curriculum path with persisted lesson progress."""
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            profile_row = connection.execute(
                "SELECT cefr_band, learner_mode FROM profiles WHERE id = 1"
            ).fetchone()
            if profile_row is None:
                raise KeyError("Local profile is not initialized")
            progress_rows = connection.execute(
                "SELECT * FROM curriculum_progress ORDER BY lesson_key"
            ).fetchall()
            available_concepts = int(
                connection.execute(
                    "SELECT COUNT(*) FROM learning_items WHERE archived_at IS NULL"
                ).fetchone()[0]
            )
            return LocalLearningEngine().curriculum_path(
                dict(profile_row),
                {str(row["lesson_key"]): dict(row) for row in progress_rows},
                available_concepts=available_concepts,
            )
        finally:
            if should_close:
                connection.close()

    def practice_today(self, persist: bool = True) -> dict[str, Any]:
        """Return or create today's resumable practice plan.

        `persist=False` is reserved for the read-only public demo. It returns the same
        deterministic starter plan without changing tenant state.
        """
        local_date = datetime.now(PRACTICE_TIMEZONE).date().isoformat()
        if not persist:
            connection = self.database.connect()
            should_close = str(self.database.path) != ":memory:"
            try:
                plan = self._build_practice_plan(connection)
                return {
                    "session": {
                        "id": f"demo-{local_date}",
                        "local_date": local_date,
                        "status": "preview",
                        "current_step": 0,
                        "current_step_key": plan["steps"][0]["key"],
                        "plan": plan,
                        "events": [],
                        "daily_goal": {
                            "target": 5,
                            "completed": 0,
                            "achieved": False,
                        },
                        "summary": None,
                        "persisted": False,
                    }
                }
            finally:
                if should_close:
                    connection.close()

        with self.database.transaction() as connection:
            session = connection.execute(
                """
                SELECT * FROM practice_sessions
                WHERE profile_id = 1 AND local_date = ?
                """,
                (local_date,),
            ).fetchone()
            if session is None:
                now = iso_now()
                session_id = uuid4().hex
                plan = self._build_practice_plan(connection)
                connection.execute(
                    """
                    INSERT INTO practice_sessions(
                        id, profile_id, local_date, plan_json, current_step,
                        status, created_at, updated_at
                    ) VALUES(?, 1, ?, ?, 0, 'active', ?, ?)
                    """,
                    (
                        session_id,
                        local_date,
                        json.dumps(
                            plan,
                            ensure_ascii=False,
                            sort_keys=True,
                            separators=(",", ":"),
                        ),
                        now,
                        now,
                    ),
                )
                session = connection.execute(
                    "SELECT * FROM practice_sessions WHERE id = ?",
                    (session_id,),
                ).fetchone()
            if session is None:  # pragma: no cover - defensive SQLite boundary
                raise sqlite3.DatabaseError("SQLite did not return the practice session")
            return {"session": self._practice_session_payload(connection, session)}

    def submit_practice_step(
        self,
        session_id: str,
        step_key: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Persist one current practice step with replay-safe idempotency."""
        clean_session_id = session_id.strip()
        clean_step_key = step_key.strip()
        idempotency_key = str(payload.get("idempotency_key", "")).strip()
        outcome = str(payload.get("outcome", "")).strip()
        if not clean_session_id or len(clean_session_id) > 128:
            raise ValueError("session_id must be between 1 and 128 characters")
        if not clean_step_key or len(clean_step_key) > 128:
            raise ValueError("step_key must be between 1 and 128 characters")
        if not 8 <= len(idempotency_key) <= 128 or any(
            not (character.isascii() and (character.isalnum() or character in "._:-"))
            for character in idempotency_key
        ):
            raise ValueError(
                "idempotency_key must be 8-128 ASCII letters, numbers, dots, "
                "underscores, colons, or hyphens"
            )
        if outcome not in {"completed", "failed", "unsupported"}:
            raise ValueError("outcome must be completed, failed, or unsupported")

        confidence_raw = payload.get("confidence")
        confidence = int(confidence_raw) if confidence_raw is not None else None
        response_ms = int(payload.get("response_ms", 0))
        hints_used = int(payload.get("hints_used", 0))
        if confidence is not None and not 1 <= confidence <= 5:
            raise ValueError("confidence must be between 1 and 5")
        if not 0 <= response_ms <= 3_600_000:
            raise ValueError("response_ms must be between 0 and 3600000")
        if not 0 <= hints_used <= 100:
            raise ValueError("hints_used must be between 0 and 100")
        for field_name in ("answer_text", "transcript"):
            field_value = payload.get(field_name)
            if field_value is not None and len(str(field_value)) > 10_000:
                raise ValueError(f"{field_name} must not exceed 10000 characters")
        unsupported_reason_raw = payload.get("unsupported_reason")
        unsupported_reason = (
            str(unsupported_reason_raw).strip()
            if unsupported_reason_raw is not None
            else None
        )
        if outcome == "unsupported" and not unsupported_reason:
            raise ValueError("unsupported_reason is required for an unsupported step")
        if unsupported_reason is not None and len(unsupported_reason) > 100:
            raise ValueError("unsupported_reason must not exceed 100 characters")

        normalized_payload = {
            "outcome": outcome,
            "is_correct": payload.get("is_correct"),
            "confidence": confidence,
            "response_ms": response_ms,
            "hints_used": hints_used,
            "answer_text": payload.get("answer_text"),
            "transcript": payload.get("transcript"),
            "unsupported_reason": unsupported_reason,
        }
        request_hash = hashlib.sha256(
            json.dumps(
                {
                    "session_id": clean_session_id,
                    "step_key": clean_step_key,
                    **normalized_payload,
                },
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest()
        with self.database.transaction() as connection:
            duplicate = connection.execute(
                """
                SELECT request_hash, response_json
                FROM practice_step_events
                WHERE session_id = ? AND idempotency_key = ?
                """,
                (clean_session_id, idempotency_key),
            ).fetchone()
            if duplicate is not None:
                if not hmac.compare_digest(str(duplicate["request_hash"]), request_hash):
                    raise PracticeConflictError(
                        "The idempotency key was already used with different practice evidence."
                    )
                stored = json.loads(str(duplicate["response_json"]))
                if not isinstance(stored, dict):
                    raise sqlite3.DatabaseError(
                        "Stored practice idempotency response is invalid"
                    )
                return {**stored, "duplicate": True}

            session = connection.execute(
                "SELECT * FROM practice_sessions WHERE id = ?",
                (clean_session_id,),
            ).fetchone()
            if session is None:
                raise KeyError("Practice session is not available")
            plan = self._decode_practice_plan(session["plan_json"])
            current_step = int(session["current_step"])
            steps = plan["steps"]
            if str(session["status"]) != "active" or current_step >= len(steps):
                raise PracticeConflictError("The practice session is already complete.")
            expected_step = steps[current_step]
            if clean_step_key != str(expected_step["key"]):
                raise PracticeConflictError(
                    f"Expected practice step {expected_step['key']!r}; refresh today's session."
                )

            engine = LocalLearningEngine()
            meaningful = engine.is_meaningful_step(expected_step) and outcome != "unsupported"
            now = iso_now()
            outcome_json = {
                **normalized_payload,
                "meaningful": meaningful,
            }
            cursor = connection.execute(
                """
                INSERT INTO practice_step_events(
                    session_id, step_key, idempotency_key, request_hash,
                    outcome, meaningful, outcome_json, response_json, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?, '{}', ?)
                """,
                (
                    clean_session_id,
                    clean_step_key,
                    idempotency_key,
                    request_hash,
                    outcome,
                    int(meaningful),
                    json.dumps(
                        outcome_json,
                        ensure_ascii=False,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                    now,
                ),
            )
            event_id_raw = cursor.lastrowid
            if event_id_raw is None:
                raise sqlite3.DatabaseError("SQLite did not return a practice event ID")

            progress_payload = None
            if meaningful:
                concept = expected_step.get("concept")
                lesson_key = (
                    str(concept.get("lesson_key", "a0.first_sentences"))
                    if isinstance(concept, dict)
                    else "a0.first_sentences"
                )
                successful = outcome == "completed" and normalized_payload["is_correct"] is not False
                progress_payload = self._record_curriculum_progress(
                    connection,
                    lesson_key=lesson_key,
                    successful=successful,
                    updated_at=now,
                )

            step_completed = outcome == "completed"
            next_index = current_step + 1 if step_completed else current_step
            completed = next_index >= len(steps)
            connection.execute(
                """
                UPDATE practice_sessions
                SET current_step = ?,
                    status = ?,
                    updated_at = ?,
                    completed_at = ?
                WHERE id = ?
                """,
                (
                    next_index,
                    "completed" if completed else "active",
                    now,
                    now if completed else None,
                    clean_session_id,
                ),
            )
            updated_session = connection.execute(
                "SELECT * FROM practice_sessions WHERE id = ?",
                (clean_session_id,),
            ).fetchone()
            if updated_session is None:  # pragma: no cover - defensive SQLite boundary
                raise sqlite3.DatabaseError("SQLite lost the practice session")
            response = {
                "accepted": True,
                "saved": True,
                "duplicate": False,
                "xp_awarded": 0,
                "next_action": (
                    "continue"
                    if step_completed
                    else "manual_fallback"
                    if outcome == "unsupported"
                    else "retry"
                ),
                "event": {
                    "id": int(event_id_raw),
                    "step_key": clean_step_key,
                    "outcome": outcome,
                    "meaningful": meaningful,
                    "created_at": now,
                },
                "curriculum_progress": progress_payload,
                "session": self._practice_session_payload(connection, updated_session),
            }
            connection.execute(
                """
                UPDATE practice_step_events
                SET response_json = ?
                WHERE id = ?
                """,
                (
                    json.dumps(
                        response,
                        ensure_ascii=False,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                    int(event_id_raw),
                ),
            )
            return response

    def submit_learning_core_attempt(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Accept evidence for the server-owned activity and advance the learning loop.

        The request intentionally contains no phase, skill, mastery, interval, or XP fields.
        Those values are derived from persisted state and trusted domain rules.
        """
        item_id = int(payload.get("item_id", 0))
        is_correct = bool(payload.get("is_correct", False))
        confidence = int(payload.get("confidence", 3))
        response_ms = int(payload.get("response_ms", 0))
        hints_used = int(payload.get("hints_used", 0))
        answer_text_raw = payload.get("answer_text")
        answer_text = str(answer_text_raw) if answer_text_raw is not None else None
        activity_token = str(payload.get("activity_token", "")).strip()
        idempotency_key = str(payload.get("idempotency_key", "")).strip()
        if item_id < 1:
            raise ValueError("item_id must be positive")
        if not 1 <= confidence <= 5:
            raise ValueError("confidence must be between 1 and 5")
        if not 0 <= response_ms <= 3_600_000:
            raise ValueError("response_ms must be between 0 and 3600000")
        if not 0 <= hints_used <= 100:
            raise ValueError("hints_used must be between 0 and 100")
        if answer_text is not None and len(answer_text) > 10_000:
            raise ValueError("answer_text must not exceed 10000 characters")
        if len(activity_token) != 64 or any(
            character not in "0123456789abcdef" for character in activity_token
        ):
            raise ValueError("activity_token must be a 64-character lowercase hexadecimal token")
        if not 8 <= len(idempotency_key) <= 128 or any(
            not (character.isascii() and (character.isalnum() or character in "._:-"))
            for character in idempotency_key
        ):
            raise ValueError(
                "idempotency_key must be 8-128 ASCII letters, numbers, dots, underscores, "
                "colons, or hyphens"
            )

        request_hash = self._learning_core_request_hash(
            {
                "item_id": item_id,
                "is_correct": is_correct,
                "confidence": confidence,
                "response_ms": response_ms,
                "hints_used": hints_used,
                "answer_text": answer_text,
                "activity_token": activity_token,
            }
        )

        now_dt = utc_now()
        now = now_dt.isoformat(timespec="seconds")
        mastery: MasteryState | None = None
        schedule: dict[str, Any] | None = None

        with self.database.transaction() as connection:
            replay = connection.execute(
                """
                SELECT request_hash, response_json
                FROM learning_core_idempotency
                WHERE idempotency_key = ?
                """,
                (idempotency_key,),
            ).fetchone()
            if replay is not None:
                if not hmac.compare_digest(str(replay["request_hash"]), request_hash):
                    raise LearningCoreConflictError(
                        "The idempotency key was already used with a different attempt payload."
                    )
                try:
                    replayed_response = json.loads(str(replay["response_json"]))
                except (TypeError, json.JSONDecodeError) as error:
                    raise sqlite3.DatabaseError(
                        "Stored learning-core idempotency response is invalid"
                    ) from error
                if not isinstance(replayed_response, dict):
                    raise sqlite3.DatabaseError(
                        "Stored learning-core idempotency response is not an object"
                    )
                replayed_response["duplicate"] = True
                return cast(dict[str, Any], replayed_response)

            state_payload, item = self._learning_core_read_model(connection, now_dt=now_dt)
            current = state_payload["state"]
            if item is None:
                raise KeyError("No learning-core activity is currently available")
            if int(item["id"]) != item_id:
                raise LearningCoreConflictError(
                    "The activity token and item do not match the current learning activity. "
                    "Fetch /api/v1/learning-core/next and retry with a new idempotency key."
                )
            if current["wait_until"] is not None:
                raise LearningCoreConflictError(
                    "The delayed review is not due yet; use wait_until from learning-core state"
                )
            current_activity = self._learning_core_activity(state_payload, item)
            if current_activity is None or not hmac.compare_digest(
                str(current_activity["activity_token"]),
                activity_token,
            ):
                raise LearningCoreConflictError(
                    "The activity token is stale or does not match the current item and phase. "
                    "Fetch /api/v1/learning-core/next and retry with a new idempotency key."
                )

            phase = cast(LessonPhase, current["phase"])
            support = cast(ReadingSupport, current["reading_support"])
            skill = skill_for_activity(phase, support)
            if (
                phase in {"retrieval", "delayed_review"}
                and not bool(current["niqqud_available"])
            ):
                skill = "unpointed_reading"
            evidence_kind = evidence_kind_for_activity(phase, hints_used)
            cursor = connection.execute(
                """
                INSERT INTO learning_core_attempts(
                    item_id, phase, skill_dimension, evidence_kind, reading_support, is_correct,
                    confidence, response_ms, hints_used, answer_text, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    phase,
                    skill,
                    evidence_kind,
                    support,
                    int(is_correct),
                    confidence,
                    response_ms,
                    hints_used,
                    answer_text,
                    now,
                ),
            )
            attempt_id_raw = cursor.lastrowid
            if attempt_id_raw is None:
                raise sqlite3.DatabaseError("SQLite did not return a learning-core attempt ID")
            attempt_id = int(attempt_id_raw)

            support_state = self._reading_support_record(connection, item_id)
            reading_decision = None
            if phase in {"retrieval", "delayed_review"}:
                reading_decision = apply_reading_evidence(
                    support,
                    success_streak=int(support_state["success_streak"]),
                    total_successes=int(support_state["total_successes"]),
                    total_failures=int(support_state["total_failures"]),
                    is_correct=is_correct,
                    hints_used=hints_used,
                    has_niqqud=bool(current["niqqud_available"]),
                )
                connection.execute(
                    """
                    INSERT INTO reading_support_state(
                        concept_key, support_level, success_streak,
                        total_successes, total_failures, updated_at
                    ) VALUES(?, ?, ?, ?, ?, ?)
                    ON CONFLICT(concept_key) DO UPDATE SET
                        support_level = excluded.support_level,
                        success_streak = excluded.success_streak,
                        total_successes = excluded.total_successes,
                        total_failures = excluded.total_failures,
                        updated_at = excluded.updated_at
                    """,
                    (
                        f"item:{item_id}",
                        reading_decision.level,
                        reading_decision.success_streak,
                        reading_decision.total_successes,
                        reading_decision.total_failures,
                        now,
                    ),
                )

            mastery_evidence = phase == "corrected_retry" or (
                phase in {"retrieval", "delayed_review", "transfer"} and hints_used == 0
            )
            if mastery_evidence:
                mastery = self._update_item_mastery(
                    connection,
                    item_id=item_id,
                    modality=skill,
                    is_correct=is_correct,
                    confidence=confidence,
                    response_ms=response_ms,
                    hints_used=hints_used,
                    updated_at=now,
                )

            if (phase == "corrected_retry" and is_correct) or phase == "delayed_review":
                schedule = self._schedule_learning_core_review(
                    connection,
                    item_id=item_id,
                    is_correct=is_correct,
                    confidence=confidence,
                    hints_used=hints_used,
                    now_dt=now_dt,
                )

            transition = transition_phase(phase, is_correct=is_correct)
            next_item_id = None if phase == "reflection" else item_id
            next_state_version = int(current["state_version"]) + 1
            connection.execute(
                """
                INSERT INTO learning_core_state(
                    profile_id, current_item_id, phase, updated_at, state_version
                ) VALUES(1, ?, ?, ?, ?)
                ON CONFLICT(profile_id) DO UPDATE SET
                    current_item_id = excluded.current_item_id,
                    phase = excluded.phase,
                    updated_at = excluded.updated_at,
                    state_version = excluded.state_version
                """,
                (next_item_id, transition.to_phase, now, next_state_version),
            )
            connection.execute(
                """
                INSERT INTO user_events(
                    event_type, entity_type, entity_id, payload_json, created_at
                ) VALUES('learning_core_attempted', 'learning_item', ?, ?, ?)
                """,
                (
                    str(item_id),
                    json.dumps(
                        {
                            "phase": phase,
                            "skill_dimension": skill,
                            "evidence_kind": evidence_kind,
                            "correct": is_correct,
                            "reading_support": support,
                        }
                    ),
                    now,
                ),
            )
            reading_payload = (
                asdict(reading_decision)
                if reading_decision is not None
                else {
                    "level": support_state["support_level"],
                    "success_streak": int(support_state["success_streak"]),
                    "total_successes": int(support_state["total_successes"]),
                    "total_failures": int(support_state["total_failures"]),
                    "evidence_to_advance": int(support_state["evidence_to_advance"]),
                    "advanced": False,
                    "restored": False,
                    "reason": "This phase does not change reading-support evidence.",
                }
            )
            next_state_payload, next_item = self._learning_core_read_model(
                connection,
                now_dt=now_dt,
            )
            response = {
                "contract_version": CONTRACT_VERSION,
                "accepted": True,
                "duplicate": False,
                "attempt": {
                    "id": attempt_id,
                    "item_id": item_id,
                    "phase": phase,
                    "skill_dimension": skill,
                    "evidence_kind": evidence_kind,
                    "evidence_source": "learner_self_report",
                    "is_correct": is_correct,
                    "reading_support": support,
                },
                "transition": asdict(transition),
                "mastery": asdict(mastery) if mastery is not None else None,
                "reading_support_state": reading_payload,
                "schedule": schedule,
                "next_activity": self._learning_core_activity(next_state_payload, next_item),
                "state": next_state_payload["state"],
            }
            connection.execute(
                """
                INSERT INTO learning_core_idempotency(
                    idempotency_key, request_hash, activity_token,
                    response_json, created_at
                ) VALUES(?, ?, ?, ?, ?)
                """,
                (
                    idempotency_key,
                    request_hash,
                    activity_token,
                    json.dumps(
                        response,
                        ensure_ascii=False,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                    now,
                ),
            )
            connection.execute(
                """
                DELETE FROM learning_core_idempotency
                WHERE idempotency_key IN (
                    SELECT idempotency_key
                    FROM learning_core_idempotency
                    ORDER BY created_at DESC, idempotency_key DESC
                    LIMIT -1 OFFSET ?
                )
                """,
                (LEARNING_CORE_IDEMPOTENCY_RETENTION,),
            )
            return response

    def submit_review(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        """Record a review and atomically update adaptive systems.

        Args:
            item_id: Reviewed item.
            payload: Correctness, modality, confidence, timing, hints, and answer.

        Returns:
            Updated schedule, mastery, XP, and newly unlocked achievements.

        Raises:
            KeyError: If the item does not exist.
            ValueError: If review values are invalid.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); item = repo.create_item({"hebrew_text": "כן"})
            >>> repo.submit_review(item["id"], {"is_correct": True, "confidence": 4})["schedule"]["repetitions"]
            1
        """
        confidence = int(payload.get("confidence", 3))
        is_correct = bool(payload.get("is_correct", False))
        response_ms = int(payload.get("response_ms", 0))
        hints_used = int(payload.get("hints_used", 0))
        modality = str(payload.get("modality", "recognition"))
        exercise_type = str(payload.get("exercise_type", "mixed_review"))
        now_dt = utc_now()
        now = now_dt.isoformat(timespec="seconds")

        with self.database.transaction() as connection:
            row = connection.execute(
                """
                SELECT i.*, r.interval_days, r.ease_factor, r.repetitions,
                       r.lapses, r.due_at
                FROM learning_items i
                JOIN review_state r ON r.item_id = i.id
                WHERE i.id = ?
                """,
                (item_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"Learning item {item_id} not found")

            previous = ReviewState(
                interval_days=float(row["interval_days"]),
                ease_factor=float(row["ease_factor"]),
                repetitions=int(row["repetitions"]),
                lapses=int(row["lapses"]),
                due_at=datetime.fromisoformat(row["due_at"]),
            )
            decision = schedule_review(
                previous,
                is_correct=is_correct,
                confidence=confidence,
                hints_used=hints_used,
                now=now_dt,
            )
            connection.execute(
                """
                UPDATE review_state
                SET interval_days = ?, ease_factor = ?, repetitions = ?,
                    lapses = ?, due_at = ?, last_reviewed_at = ?
                WHERE item_id = ?
                """,
                (
                    decision.state.interval_days,
                    decision.state.ease_factor,
                    decision.state.repetitions,
                    decision.state.lapses,
                    decision.state.due_at.isoformat(timespec="seconds"),
                    now,
                    item_id,
                ),
            )
            connection.execute(
                """
                INSERT INTO attempts(
                    item_id, exercise_type, modality, is_correct, response_ms,
                    confidence, hints_used, mistake_category, answer_text, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    exercise_type,
                    modality,
                    int(is_correct),
                    response_ms,
                    confidence,
                    hints_used,
                    payload.get("mistake_category"),
                    payload.get("answer_text"),
                    now,
                ),
            )

            mastery = self._update_item_mastery(
                connection,
                item_id=item_id,
                modality=modality,
                is_correct=is_correct,
                confidence=confidence,
                response_ms=response_ms,
                hints_used=hints_used,
                updated_at=now,
            )

            xp_before = self._total_xp(connection)
            xp_awarded = 0
            if is_correct:
                multiplier = 1.8 if previous.lapses >= 3 and decision.was_successful else 1.0
                action = XPAction.DIFFICULT_MASTERY if multiplier > 1 else XPAction.CORRECT_REVIEW
                xp_awarded = self._award_xp(connection, action, "attempt", str(item_id), multiplier)
            if modality == "speaking":
                xp_awarded += self._award_xp(
                    connection, XPAction.SPEAKING_ATTEMPT, "attempt", str(item_id)
                )

            newly_unlocked = self._unlock_achievements(connection, now)
            xp_awarded += sum(achievement.xp_reward for achievement in newly_unlocked)

            connection.execute(
                """
                INSERT INTO user_events(event_type, entity_type, entity_id, payload_json, created_at)
                VALUES('review_submitted', 'learning_item', ?, ?, ?)
                """,
                (
                    str(item_id),
                    json.dumps(
                        {
                            "correct": is_correct,
                            "modality": modality,
                            "quality": decision.quality,
                            "xp_awarded": xp_awarded,
                        }
                    ),
                    now,
                ),
            )
            xp_after = self._total_xp(connection)

        return {
            "item_id": item_id,
            "schedule": {
                **asdict(decision.state),
                "due_at": decision.state.due_at.isoformat(timespec="seconds"),
                "quality": decision.quality,
                "reason": decision.reason,
            },
            "mastery": asdict(mastery),
            "xp_awarded": xp_after - xp_before,
            "xp": level_progress(xp_after),
            "new_achievements": [asdict(item) for item in newly_unlocked],
        }

    def record_pronunciation_attempt(
        self,
        *,
        target_text: str,
        transcript: str,
        score: int,
        breakdown: dict[str, Any],
        provider: str,
        item_id: int | None = None,
        retained_path: str | None = None,
        verified_speech_evidence: bool = False,
    ) -> dict[str, Any]:
        """Atomically store pronunciation history and trusted learning signals.

        An explicit item link must match the target text. Without an explicit link,
        exactly one active item with the same normalized Hebrew text is linked
        automatically. Client-supplied transcripts remain history-only; only
        server-verified speech evidence may change mastery or XP.
        """
        if not 0 <= score <= 100:
            raise ValueError("Pronunciation score must be between 0 and 100")
        normalized_target = normalize_hebrew(target_text)
        if not normalized_target:
            raise ValueError("Pronunciation target must contain Hebrew text")

        now = iso_now()
        provider_name = provider.strip() or "unknown"
        stored_provider = (
            provider_name
            if verified_speech_evidence
            else f"unverified:{provider_name.removeprefix('unverified:')}"
        )
        with self.database.transaction() as connection:
            linked_item_id = self._resolve_pronunciation_item(
                connection,
                normalized_target=normalized_target,
                requested_item_id=item_id,
            )
            learning_eligible = linked_item_id is not None and verified_speech_evidence
            cursor = connection.execute(
                """
                INSERT INTO audio_attempts(
                    item_id, target_text, transcript, score, breakdown_json,
                    provider, retained_path, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    linked_item_id,
                    target_text,
                    transcript,
                    score,
                    json.dumps(breakdown, ensure_ascii=False),
                    stored_provider,
                    retained_path,
                    now,
                ),
            )
            attempt_id_raw = cursor.lastrowid
            if attempt_id_raw is None:
                raise sqlite3.DatabaseError("SQLite did not return an audio attempt ID")
            attempt_id = int(attempt_id_raw)

            xp_before = self._total_xp(connection)
            mastery: MasteryState | None = None
            newly_unlocked: list[Any] = []
            is_correct: bool | None = None
            if learning_eligible:
                assert linked_item_id is not None
                is_correct = score >= PRONUNCIATION_MASTERY_THRESHOLD
                assessment_confidence = max(1, min(5, (score + 19) // 20))
                connection.execute(
                    """
                    INSERT INTO attempts(
                        item_id, exercise_type, modality, is_correct, response_ms,
                        confidence, hints_used, mistake_category, answer_text, created_at
                    ) VALUES(?, 'pronunciation', 'speaking', ?, 0, ?, 0, ?, ?, ?)
                    """,
                    (
                        linked_item_id,
                        int(is_correct),
                        assessment_confidence,
                        None if is_correct else "pronunciation_transcript_mismatch",
                        transcript,
                        now,
                    ),
                )
                mastery = self._update_item_mastery(
                    connection,
                    item_id=linked_item_id,
                    modality="speaking",
                    is_correct=is_correct,
                    confidence=assessment_confidence,
                    response_ms=0,
                    hints_used=0,
                    updated_at=now,
                )
                self._award_xp(
                    connection,
                    XPAction.SPEAKING_ATTEMPT,
                    "audio_attempt",
                    str(attempt_id),
                )
                newly_unlocked = self._unlock_achievements(connection, now)

            xp_after = self._total_xp(connection)
            connection.execute(
                """
                INSERT INTO user_events(event_type, entity_type, entity_id, payload_json, created_at)
                VALUES('pronunciation_scored', ?, ?, ?, ?)
                """,
                (
                    "learning_item" if learning_eligible else "audio_attempt",
                    str(linked_item_id if learning_eligible else attempt_id),
                    json.dumps(
                        {
                            "audio_attempt_id": attempt_id,
                            "score": score,
                            "method": "transcript_similarity",
                            "provider": stored_provider,
                            "evidence_verified": verified_speech_evidence,
                            "is_correct": is_correct,
                            "xp_awarded": xp_after - xp_before,
                        }
                    ),
                    now,
                ),
            )

        return {
            "attempt_id": attempt_id,
            "linked_item_id": linked_item_id,
            "learning_updated": learning_eligible,
            "evidence_verified": verified_speech_evidence,
            "is_correct": is_correct,
            "mastery": asdict(mastery) if mastery is not None else None,
            "xp_awarded": xp_after - xp_before,
            "xp": level_progress(xp_after),
            "new_achievements": [asdict(item) for item in newly_unlocked],
            "mastery_threshold": PRONUNCIATION_MASTERY_THRESHOLD,
        }

    def recommendations(self, limit: int = 8) -> list[dict[str, Any]]:
        """Build explainable recommendations from stored review and attempt signals.

        Args:
            limit: Maximum recommendations.

        Returns:
            Serialized recommendations.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.create_item({"hebrew_text": "כן"})
            >>> repo.recommendations(1)[0]["item_id"]
            1
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            rows = connection.execute(
                """
                SELECT i.id, i.hebrew_text, i.context_label, i.priority, i.created_at,
                       r.due_at, r.lapses, r.repetitions,
                       COALESCE(AVG(CASE WHEN a.is_correct = 0 THEN 1.0 ELSE 0.0 END), 0) AS error_rate,
                       COUNT(a.id) AS attempt_count
                FROM learning_items i
                JOIN review_state r ON r.item_id = i.id
                LEFT JOIN attempts a ON a.item_id = i.id
                WHERE i.archived_at IS NULL
                GROUP BY i.id
                """
            ).fetchall()
            now = utc_now()
            candidates: list[RecommendationCandidate] = []
            for row in rows:
                created = datetime.fromisoformat(row["created_at"])
                age_days = max(0.0, (now - created).total_seconds() / 86400)
                freshness = max(0.0, 1.0 - age_days / 30)
                context = row["context_label"]
                goal_alignment = 0.9 if context in {"workplace", "daily_life", "speaking"} else 0.55
                modality = "speaking" if float(row["error_rate"]) > 0.45 else "mixed_review"
                candidates.append(
                    RecommendationCandidate(
                        item_id=int(row["id"]),
                        label=row["hebrew_text"],
                        urgency=review_urgency(datetime.fromisoformat(row["due_at"]), now),
                        weakness=min(1.0, float(row["error_rate"]) + int(row["lapses"]) * 0.1),
                        relevance=float(row["priority"]),
                        goal_alignment=goal_alignment,
                        freshness=freshness,
                        exploration_bonus=0.08 if int(row["attempt_count"]) == 0 else 0.0,
                        repetition_penalty=min(0.2, int(row["repetitions"]) * 0.015),
                        recommended_exercise=modality,
                        estimated_minutes=3 if modality == "speaking" else 2,
                    )
                )
            return [asdict(item) for item in rank_candidates(candidates, limit)]
        finally:
            if should_close:
                connection.close()

    def dashboard(self) -> dict[str, Any]:
        """Return the personalized dashboard payload.

        Returns:
            Profile, XP, due reviews, focus, recommendations, and achievements.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.dashboard()["profile"]["display_name"]
            'Kevin'
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            profile = connection.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
            if profile is None:
                self.ensure_default_profile()
                return self.dashboard()
            due_count = connection.execute(
                "SELECT COUNT(*) FROM review_state WHERE due_at <= ?", (iso_now(),)
            ).fetchone()[0]
            total_items = connection.execute(
                "SELECT COUNT(*) FROM learning_items WHERE archived_at IS NULL"
            ).fetchone()[0]
            error_rows = connection.execute(
                """
                SELECT mistake_category, COUNT(*) AS count
                FROM attempts
                WHERE mistake_category IS NOT NULL
                GROUP BY mistake_category
                """
            ).fetchall()
            error_counts = {row["mistake_category"]: int(row["count"]) for row in error_rows}
            total_xp = self._total_xp(connection)
            achievements = [
                dict(row)
                for row in connection.execute(
                    "SELECT * FROM unlocked_achievements ORDER BY unlocked_at DESC"
                ).fetchall()
            ]
            recent_accuracy_row = connection.execute(
                """
                SELECT AVG(is_correct) AS accuracy
                FROM (SELECT is_correct FROM attempts ORDER BY created_at DESC LIMIT 50)
                """
            ).fetchone()
            accuracy = float(recent_accuracy_row["accuracy"] or 0)
            daily_goal = self._daily_goal_state(connection)
        finally:
            if should_close:
                connection.close()

        return {
            "profile": dict(profile),
            "today": {
                "due_reviews": int(due_count),
                "new_phrases": 2 if due_count < 12 else 0,
                "speaking_drills": 1,
                "estimated_minutes": int(profile["daily_minutes"]),
                "daily_goal": daily_goal,
            },
            "stats": {
                "total_items": int(total_items),
                "recent_accuracy": round(accuracy, 4),
                "mastery_percent": round(accuracy * 100),
                "streak_days": self._calculate_streak(),
            },
            "xp": level_progress(total_xp),
            "focus": focus_summary(error_counts),
            "recommendations": self.recommendations(5),
            "achievements": achievements,
            "mission": {
                "title": "Use one confident workplace phrase",
                "hebrew": "אני אטפל בזה",
                "translation_en": "I’ll take care of it.",
                "translation_es": "Me encargaré de eso.",
            },
        }

    @staticmethod
    def _daily_goal_state(connection: sqlite3.Connection) -> dict[str, Any]:
        """Return meaningful daily actions independently from XP and accuracy."""
        local_date = datetime.now(PRACTICE_TIMEZONE).date().isoformat()
        row = connection.execute(
            """
            SELECT COUNT(e.id) AS completed
            FROM practice_sessions s
            LEFT JOIN practice_step_events e
              ON e.session_id = s.id AND e.meaningful = 1
            WHERE s.profile_id = 1 AND s.local_date = ?
            """,
            (local_date,),
        ).fetchone()
        completed = int(row["completed"] if row is not None else 0)
        target = 5
        return {
            "target": target,
            "completed": min(target, completed),
            "achieved": completed >= target,
            "evidence": "meaningful_practice_events",
        }

    def export_json(self, destination: Path) -> Path:
        """Export portable learner data without secrets or raw provider tokens.

        Args:
            destination: JSON output path.

        Returns:
            Resolved destination path.

        Raises:
            OSError: If the file cannot be written.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.export_json(Path('/tmp/ivrit-export.json')).exists()
            True
        """
        tables = (
            "profiles",
            "goals",
            "learning_items",
            "review_state",
            "attempts",
            "skill_mastery",
            "learning_core_state",
            "reading_support_state",
            "learning_core_attempts",
            "practice_sessions",
            "practice_step_events",
            "curriculum_progress",
            "user_events",
            "xp_ledger",
            "unlocked_achievements",
            "missions",
            "audio_attempts",
        )
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            payload = {
                "format": "ivrit-sheli-export-v1",
                "exported_at": iso_now(),
                "tables": {
                    table: [
                        dict(row) for row in connection.execute(f"SELECT * FROM {table}").fetchall()
                    ]
                    for table in tables
                },
            }
        finally:
            if should_close:
                connection.close()
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return destination.resolve()

    def create_bug_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Store a privacy-conscious local bug report.

        Args:
            payload: Title, description, route, request ID, and diagnostics.

        Returns:
            Created report summary.

        Raises:
            ValueError: If title or description is missing.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.create_bug_report({"title": "Demo", "description": "Example"})["status"]
            'open'
        """
        title = str(payload.get("title", "")).strip()
        description = str(payload.get("description", "")).strip()
        if not title or not description:
            raise ValueError("title and description are required")
        created_at = iso_now()
        with self.database.transaction() as connection:
            cursor = connection.execute(
                """
                INSERT INTO bug_reports(title, description, route, request_id, diagnostics_json, created_at)
                VALUES(?, ?, ?, ?, ?, ?)
                """,
                (
                    title,
                    description,
                    payload.get("route"),
                    payload.get("request_id"),
                    json.dumps(payload.get("diagnostics", {})),
                    created_at,
                ),
            )
            report_id_raw = cursor.lastrowid
            if report_id_raw is None:
                raise sqlite3.DatabaseError("SQLite did not return a bug report ID")
            report_id = int(report_id_raw)
        return {"id": report_id, "title": title, "status": "open", "created_at": created_at}

    def get_profile(self) -> dict[str, Any]:
        """Return the local profile and weighted learning goals.

        Returns:
            Profile fields plus active goals.

        Raises:
            KeyError: If profile initialization failed.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.get_profile()["display_name"]
            'Kevin'
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            profile = connection.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
            if profile is None:
                raise KeyError("Local profile is not initialized")
            goals = [
                dict(row)
                for row in connection.execute(
                    "SELECT * FROM goals WHERE profile_id = 1 AND is_active = 1 ORDER BY weight DESC"
                ).fetchall()
            ]
            return {**dict(profile), "goals": goals}
        finally:
            if should_close:
                connection.close()

    def update_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Update allow-listed learner preferences and goal weights.

        Args:
            payload: Profile fields and optional `goals` list.

        Returns:
            Updated profile.

        Raises:
            ValueError: If a field value is invalid.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.update_profile({"daily_minutes": 20})["daily_minutes"]
            20
        """
        allowed_fields = {
            "display_name",
            "interface_language",
            "hebrew_level",
            "daily_minutes",
            "transliteration_mode",
            "niqqud_mode",
            "weekly_rest_day",
            "cloud_consent",
            "onboarding_step",
            "onboarding_completed",
            "guided_mode",
            "learner_mode",
            "first_steps_step",
            "first_steps_completed",
            "curriculum_track",
            "cefr_band",
            "text_scale",
            "focus_status",
        }
        clean: dict[str, Any] = {
            key: value for key, value in payload.items() if key in allowed_fields
        }
        if "daily_minutes" in clean and not 5 <= int(clean["daily_minutes"]) <= 180:
            raise ValueError("daily_minutes must be between 5 and 180")
        if "weekly_rest_day" in clean and not 0 <= int(clean["weekly_rest_day"]) <= 6:
            raise ValueError("weekly_rest_day must use Python weekday 0–6")
        if "interface_language" in clean and clean["interface_language"] not in {"en", "es", "he"}:
            raise ValueError("interface_language must be en, es, or he")
        if "learner_mode" in clean and clean["learner_mode"] not in {
            "guided",
            "explorer",
            "experienced",
        }:
            raise ValueError("learner_mode must be guided, explorer, or experienced")
        if "curriculum_track" in clean and clean["curriculum_track"] not in CURRICULUM_TRACKS:
            raise ValueError(
                "curriculum_track must be modern_conversation, pointed_reading, "
                "or formal_professional"
            )
        if "cefr_band" in clean:
            clean["cefr_band"] = str(clean["cefr_band"]).upper()
            if clean["cefr_band"] not in CEFR_BANDS:
                raise ValueError("cefr_band must be one of A0, A1, A2, B1, B2, C1, or C2")
        if "text_scale" in clean and not 0.8 <= float(clean["text_scale"]) <= 2.0:
            raise ValueError("text_scale must be between 0.8 and 2.0")
        if "focus_status" in clean and clean["focus_status"] not in {
            "available",
            "busy",
        }:
            raise ValueError("focus_status must be available or busy")
        if "cloud_consent" in clean:
            clean["cloud_consent"] = int(bool(clean["cloud_consent"]))
        if "onboarding_step" in clean and not 0 <= int(clean["onboarding_step"]) <= 4:
            raise ValueError("onboarding_step must be between 0 and 4")
        if "first_steps_step" in clean and not 0 <= int(clean["first_steps_step"]) <= 5:
            raise ValueError("first_steps_step must be between 0 and 5")
        for boolean_field in (
            "onboarding_completed",
            "first_steps_completed",
        ):
            if boolean_field in clean:
                clean[boolean_field] = int(bool(clean[boolean_field]))

        # Keep the v2.3 boolean contract synchronized for old clients and old
        # exports while exposing three explicit modes to current clients.
        if "learner_mode" in clean:
            clean["guided_mode"] = int(clean["learner_mode"] == "guided")
        elif "guided_mode" in clean:
            guided = bool(clean["guided_mode"])
            clean["guided_mode"] = int(guided)
            clean["learner_mode"] = "guided" if guided else "explorer"

        # Keep the historical profile field readable by v2.5 clients while the
        # learning core uses the explicit CEFR-aligned band.
        if "cefr_band" in clean:
            clean["hebrew_level"] = clean["cefr_band"]
        elif "hebrew_level" in clean:
            legacy_level = str(clean["hebrew_level"]).upper()
            if legacy_level in CEFR_BANDS:
                clean["hebrew_level"] = legacy_level
                clean["cefr_band"] = legacy_level

        with self.database.transaction() as connection:
            if clean:
                columns = ", ".join(f"{key} = ?" for key in clean)
                values = list(clean.values())
                connection.execute(
                    f"UPDATE profiles SET {columns}, updated_at = ? WHERE id = 1",
                    (*values, iso_now()),
                )
            if "goals" in payload:
                # An explicit list represents the complete active goal set.
                connection.execute("UPDATE goals SET is_active = 0 WHERE profile_id = 1")
            for goal in payload.get("goals", []) or []:
                goal_type = str(goal.get("goal_type", "")).strip()
                if not goal_type:
                    continue
                weight = max(0.0, min(1.0, float(goal.get("weight", 0))))
                connection.execute(
                    """
                    INSERT INTO goals(profile_id, goal_type, weight, is_active, target_date)
                    VALUES(1, ?, ?, ?, ?)
                    ON CONFLICT(profile_id, goal_type) DO UPDATE SET
                        weight = excluded.weight,
                        is_active = excluded.is_active,
                        target_date = excluded.target_date
                    """,
                    (
                        goal_type,
                        weight,
                        int(bool(goal.get("is_active", True))),
                        goal.get("target_date"),
                    ),
                )
        return self.get_profile()

    def progress(self) -> dict[str, Any]:
        """Return mastery, accuracy, error, and activity trends.

        Returns:
            JSON-ready progress summary.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); "modalities" in repo.progress()
            True
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            modality_rows = connection.execute(
                """
                WITH meaningful_evidence AS (
                    SELECT modality, is_correct, confidence, response_ms, 'legacy' AS source
                    FROM attempts
                    UNION ALL
                    SELECT skill_dimension AS modality, is_correct, confidence,
                           response_ms, 'learning_core' AS source
                    FROM learning_core_attempts
                    WHERE evidence_kind IN ('unassisted', 'correction_uptake')
                )
                SELECT modality, COUNT(*) AS attempts, AVG(is_correct) AS accuracy,
                       AVG(confidence) AS confidence, AVG(response_ms) AS response_ms,
                       SUM(CASE WHEN source = 'legacy' THEN 1 ELSE 0 END) AS legacy_attempts,
                       SUM(CASE WHEN source = 'learning_core' THEN 1 ELSE 0 END)
                           AS learning_core_attempts
                FROM meaningful_evidence
                GROUP BY modality
                ORDER BY attempts DESC, modality
                """
            ).fetchall()
            mistake_rows = connection.execute(
                """
                SELECT mistake_category, COUNT(*) AS count
                FROM attempts
                WHERE mistake_category IS NOT NULL
                GROUP BY mistake_category
                ORDER BY count DESC
                LIMIT 10
                """
            ).fetchall()
            activity_rows = connection.execute(
                """
                WITH practice_events AS (
                    SELECT created_at, is_correct, 1 AS meaningful
                    FROM attempts
                    WHERE created_at >= ?
                    UNION ALL
                    SELECT created_at, is_correct,
                           CASE
                               WHEN evidence_kind IN ('unassisted', 'correction_uptake') THEN 1
                               ELSE 0
                           END AS meaningful
                    FROM learning_core_attempts
                    WHERE created_at >= ?
                )
                SELECT substr(created_at, 1, 10) AS day,
                       SUM(meaningful) AS attempts,
                       SUM(CASE WHEN meaningful = 1 THEN is_correct ELSE 0 END) AS correct,
                       COUNT(*) AS practice_events,
                       SUM(CASE WHEN meaningful = 0 THEN 1 ELSE 0 END)
                           AS assisted_or_exposure_events
                FROM practice_events
                GROUP BY day
                ORDER BY day
                """,
                (
                    (utc_now() - timedelta(days=30)).isoformat(timespec="seconds"),
                    (utc_now() - timedelta(days=30)).isoformat(timespec="seconds"),
                ),
            ).fetchall()
            mastery_rows = connection.execute(
                """
                SELECT concept_key, recognition, production, listening,
                       speaking, pointed_reading, unpointed_reading,
                       contextual_transfer, observations, updated_at
                FROM skill_mastery
                ORDER BY updated_at DESC
                LIMIT 100
                """
            ).fetchall()
            activity_log_rows = connection.execute(
                """
                SELECT e.id, e.event_type, e.entity_type, e.entity_id,
                       e.payload_json, e.created_at, i.hebrew_text,
                       (
                           SELECT COALESCE(SUM(x.amount), 0)
                           FROM xp_ledger x
                           WHERE x.source_type = e.entity_type
                             AND x.source_id = e.entity_id
                             AND x.created_at = e.created_at
                       ) AS linked_xp
                FROM user_events e
                LEFT JOIN learning_items i
                  ON e.entity_type = 'learning_item'
                 AND CAST(i.id AS TEXT) = e.entity_id
                WHERE e.event_type IN (
                    'item_created',
                    'review_submitted',
                    'learning_core_attempted',
                    'pronunciation_scored',
                    'mission_completed'
                )
                ORDER BY e.created_at DESC, e.id DESC
                LIMIT 30
                """
            ).fetchall()
            activity_log: list[dict[str, Any]] = []
            for row in activity_log_rows:
                try:
                    metadata = json.loads(row["payload_json"] or "{}")
                except (TypeError, json.JSONDecodeError):
                    metadata = {}
                safe_details: dict[str, Any] = {}
                if row["event_type"] == "item_created":
                    safe_details = {"xp_awarded": max(0, int(row["linked_xp"] or 0))}
                elif row["event_type"] == "review_submitted":
                    safe_details = {
                        "correct": bool(metadata.get("correct", False)),
                        "modality": str(metadata.get("modality", "recognition")),
                        "xp_awarded": max(0, int(metadata.get("xp_awarded", 0) or 0)),
                    }
                elif row["event_type"] == "learning_core_attempted":
                    evidence_kind = str(metadata.get("evidence_kind", "exposure"))
                    safe_details = {
                        "phase": str(metadata.get("phase", "encounter")),
                        "skill_dimension": str(
                            metadata.get("skill_dimension", "recognition")
                        ),
                        "evidence_kind": evidence_kind,
                        "reading_support": str(
                            metadata.get("reading_support", "full_niqqud")
                        ),
                        "xp_awarded": 0,
                    }
                    if evidence_kind != "exposure":
                        safe_details["correct"] = bool(metadata.get("correct", False))
                elif row["event_type"] == "pronunciation_scored":
                    safe_details = {
                        "score": max(0, min(100, int(metadata.get("score", 0) or 0))),
                        "xp_awarded": max(0, int(metadata.get("xp_awarded", 0) or 0)),
                    }
                elif row["event_type"] == "mission_completed":
                    safe_details = {
                        "success": bool(metadata.get("success", False)),
                        "xp_awarded": max(0, int(metadata.get("xp", 0) or 0)),
                    }
                activity_log.append(
                    {
                        "id": int(row["id"]),
                        "type": str(row["event_type"]),
                        "source": str(row["entity_type"] or "learning"),
                        "source_id": row["entity_id"],
                        "hebrew_text": row["hebrew_text"],
                        "details": safe_details,
                        "created_at": str(row["created_at"]),
                    }
                )
            return {
                "modalities": [
                    {
                        "modality": row["modality"],
                        "attempts": int(row["attempts"]),
                        "accuracy": round(float(row["accuracy"] or 0), 4),
                        "confidence": round(float(row["confidence"] or 0), 2),
                        "average_response_ms": round(float(row["response_ms"] or 0)),
                        "legacy_attempts": int(row["legacy_attempts"]),
                        "learning_core_attempts": int(row["learning_core_attempts"]),
                    }
                    for row in modality_rows
                ],
                "mistakes": [dict(row) for row in mistake_rows],
                "activity": [dict(row) for row in activity_rows],
                "activity_log": activity_log,
                "mastery": [dict(row) for row in mastery_rows],
                "retention_checkpoints": self._retention_checkpoints(connection),
                "streak_days": self._calculate_streak(connection),
            }
        finally:
            if should_close:
                connection.close()

    def gamification_status(self) -> dict[str, Any]:
        """Return XP, achievement definitions, unlock state, and streak.

        Returns:
            Complete gamification status.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.gamification_status()["xp"]["level"]
            1
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            total_xp = self._total_xp(connection)
            metrics = self._metrics(connection)
            unlocked = {
                row["achievement_key"]: dict(row)
                for row in connection.execute("SELECT * FROM unlocked_achievements").fetchall()
            }
            ledger = [
                dict(row)
                for row in connection.execute(
                    "SELECT * FROM xp_ledger ORDER BY created_at DESC LIMIT 30"
                ).fetchall()
            ]
            return {
                "xp": {"total": total_xp, **level_progress(total_xp)},
                "streak_days": self._calculate_streak(connection),
                "achievements": [
                    {
                        **asdict(definition),
                        "unlocked": definition.key in unlocked,
                        "unlocked_at": unlocked.get(definition.key, {}).get("unlocked_at"),
                        "current_value": metrics.get(definition.metric, 0),
                        "progress_percent": (
                            100.0
                            if definition.key in unlocked
                            else min(
                                100.0,
                                round(
                                    metrics.get(definition.metric, 0)
                                    / definition.threshold
                                    * 100,
                                    1,
                                ),
                            )
                        ),
                        "remaining": (
                            0
                            if definition.key in unlocked
                            else max(
                                0,
                                definition.threshold
                                - metrics.get(definition.metric, 0),
                            )
                        ),
                    }
                    for definition in ACHIEVEMENTS
                ],
                "recent_ledger": ledger,
            }
        finally:
            if should_close:
                connection.close()

    def log_event(
        self,
        event_type: str,
        *,
        entity_type: str | None = None,
        entity_id: str | None = None,
        payload: dict[str, Any] | None = None,
        xp_action: XPAction | None = None,
    ) -> None:
        """Append a bounded user event and optional XP award.

        Args:
            event_type: Stable event name.
            entity_type: Optional entity family.
            entity_id: Optional entity ID.
            payload: Small JSON metadata mapping.
            xp_action: Optional XP action.

        Returns:
            None.

        Raises:
            ValueError: If event type is empty.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.log_event("dictionary_lookup")
        """
        if not event_type.strip():
            raise ValueError("event_type is required")
        metadata = payload or {}
        encoded = json.dumps(metadata, ensure_ascii=False)
        if len(encoded) > 20_000:
            raise ValueError("event payload is too large")
        with self.database.transaction() as connection:
            connection.execute(
                """
                INSERT INTO user_events(
                    event_type, entity_type, entity_id, payload_json, created_at
                ) VALUES(?, ?, ?, ?, ?)
                """,
                (event_type, entity_type, entity_id, encoded, iso_now()),
            )
            if xp_action is not None:
                self._award_xp(
                    connection,
                    xp_action,
                    entity_type or "event",
                    entity_id or event_type,
                )

    def create_mission(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a real-life Hebrew mission.

        Args:
            payload: Mission text, context, item, and scheduled date.

        Returns:
            Created mission.

        Raises:
            ValueError: If mission text is absent.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); repo.create_mission({"mission_text": "Say תודה"})["id"]
            1
        """
        mission_text = str(payload.get("mission_text", "")).strip()
        if not mission_text:
            raise ValueError("mission_text is required")
        now = iso_now()
        with self.database.transaction() as connection:
            cursor = connection.execute(
                """
                INSERT INTO missions(
                    item_id, mission_text, context_label, scheduled_for, created_at
                ) VALUES(?, ?, ?, ?, ?)
                """,
                (
                    payload.get("item_id"),
                    mission_text,
                    payload.get("context_label", "daily_life"),
                    payload.get("scheduled_for"),
                    now,
                ),
            )
            mission_id_raw = cursor.lastrowid
            if mission_id_raw is None:
                raise sqlite3.DatabaseError("SQLite did not return a mission ID")
            mission_id = int(mission_id_raw)
        return self.get_mission(mission_id)

    def get_mission(self, mission_id: int) -> dict[str, Any]:
        """Return one mission.

        Args:
            mission_id: Mission ID.

        Returns:
            Mission dictionary.

        Raises:
            KeyError: If mission does not exist.

        Example:
            Used by mission creation and completion.
        """
        connection = self.database.connect()
        should_close = str(self.database.path) != ":memory:"
        try:
            row = connection.execute(
                "SELECT * FROM missions WHERE id = ?", (mission_id,)
            ).fetchone()
            if row is None:
                raise KeyError(f"Mission {mission_id} not found")
            return dict(row)
        finally:
            if should_close:
                connection.close()

    def complete_mission(self, mission_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        """Complete a mission and reward real-life use and reflection.

        Args:
            mission_id: Mission ID.
            payload: Success, confidence, and reflection.

        Returns:
            Updated mission and XP status.

        Raises:
            KeyError: If mission does not exist.
            ValueError: If confidence is invalid.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo.ensure_default_profile(); mission = repo.create_mission({"mission_text": "Say תודה"})
            >>> repo.complete_mission(mission["id"], {"success": True, "confidence_after": 4})["mission"]["success"]
            1
        """
        confidence = int(payload.get("confidence_after", 3))
        if not 1 <= confidence <= 5:
            raise ValueError("confidence_after must be between 1 and 5")
        with self.database.transaction() as connection:
            exists = connection.execute(
                "SELECT id FROM missions WHERE id = ?", (mission_id,)
            ).fetchone()
            if exists is None:
                raise KeyError(f"Mission {mission_id} not found")
            success = bool(payload.get("success", False))
            now = iso_now()
            connection.execute(
                """
                UPDATE missions
                SET completed_at = ?, success = ?, confidence_after = ?, reflection = ?
                WHERE id = ?
                """,
                (
                    now,
                    int(success),
                    confidence,
                    payload.get("reflection"),
                    mission_id,
                ),
            )
            xp = self._award_xp(connection, XPAction.REAL_LIFE_MISSION, "mission", str(mission_id))
            if success:
                xp += self._award_xp(
                    connection, XPAction.REAL_LIFE_SUCCESS, "mission", str(mission_id)
                )
            if str(payload.get("reflection", "")).strip():
                xp += self._award_xp(connection, XPAction.REFLECTION, "mission", str(mission_id))
            connection.execute(
                """
                INSERT INTO user_events(
                    event_type, entity_type, entity_id, payload_json, created_at
                ) VALUES('mission_completed', 'mission', ?, ?, ?)
                """,
                (str(mission_id), json.dumps({"success": success, "xp": xp}), now),
            )
            total_xp = self._total_xp(connection)
        return {
            "mission": self.get_mission(mission_id),
            "xp_awarded": xp,
            "xp": {"total": total_xp, **level_progress(total_xp)},
        }

    @staticmethod
    def _resolve_pronunciation_item(
        connection: Any,
        *,
        normalized_target: str,
        requested_item_id: int | None,
    ) -> int | None:
        """Resolve a safe learning-item link for pronunciation evidence."""
        if requested_item_id is not None:
            row = connection.execute(
                """
                SELECT id, normalized_text
                FROM learning_items
                WHERE id = ? AND archived_at IS NULL
                """,
                (requested_item_id,),
            ).fetchone()
            if row is None:
                raise KeyError(f"Learning item {requested_item_id} not found")
            if row["normalized_text"] != normalized_target:
                raise ValueError("Pronunciation target does not match the selected learning item")
            return int(row["id"])

        matches = connection.execute(
            """
            SELECT id
            FROM learning_items
            WHERE normalized_text = ? AND archived_at IS NULL
            ORDER BY id
            LIMIT 2
            """,
            (normalized_target,),
        ).fetchall()
        return int(matches[0]["id"]) if len(matches) == 1 else None

    @staticmethod
    def _update_item_mastery(
        connection: Any,
        *,
        item_id: int,
        modality: str,
        is_correct: bool,
        confidence: int,
        response_ms: int,
        hints_used: int,
        updated_at: str,
    ) -> MasteryState:
        """Update one learning item's mastery inside an existing transaction."""
        concept_key = f"item:{item_id}"
        mastery_row = connection.execute(
            "SELECT * FROM skill_mastery WHERE concept_key = ?", (concept_key,)
        ).fetchone()
        previous_mastery = MasteryState(
            recognition=float(mastery_row["recognition"]) if mastery_row else 0.0,
            production=float(mastery_row["production"]) if mastery_row else 0.0,
            listening=float(mastery_row["listening"]) if mastery_row else 0.0,
            speaking=float(mastery_row["speaking"]) if mastery_row else 0.0,
            pointed_reading=float(mastery_row["pointed_reading"]) if mastery_row else 0.0,
            unpointed_reading=(
                float(mastery_row["unpointed_reading"]) if mastery_row else 0.0
            ),
            contextual_transfer=(
                float(mastery_row["contextual_transfer"]) if mastery_row else 0.0
            ),
            observations=int(mastery_row["observations"]) if mastery_row else 0,
        )
        mastery = update_mastery(
            previous_mastery,
            modality=modality,
            is_correct=is_correct,
            confidence=confidence,
            response_ms=response_ms,
            hints_used=hints_used,
        )
        connection.execute(
            """
            INSERT INTO skill_mastery(
                concept_key, concept_type, recognition, production,
                listening, speaking, pointed_reading, unpointed_reading,
                contextual_transfer, observations, updated_at
            ) VALUES(?, 'learning_item', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(concept_key) DO UPDATE SET
                recognition = excluded.recognition,
                production = excluded.production,
                listening = excluded.listening,
                speaking = excluded.speaking,
                pointed_reading = excluded.pointed_reading,
                unpointed_reading = excluded.unpointed_reading,
                contextual_transfer = excluded.contextual_transfer,
                observations = excluded.observations,
                updated_at = excluded.updated_at
            """,
            (
                concept_key,
                mastery.recognition,
                mastery.production,
                mastery.listening,
                mastery.speaking,
                mastery.pointed_reading,
                mastery.unpointed_reading,
                mastery.contextual_transfer,
                mastery.observations,
                updated_at,
            ),
        )
        return mastery

    def _build_practice_plan(self, connection: sqlite3.Connection) -> dict[str, Any]:
        """Build a daily plan from due/important learner items and reviewed fallbacks."""
        profile = connection.execute(
            "SELECT cefr_band, learner_mode FROM profiles WHERE id = 1"
        ).fetchone()
        if profile is None:
            raise KeyError("Local profile is not initialized")
        rows = connection.execute(
            """
            SELECT i.id AS item_id,
                   'item:' || i.id AS concept_key,
                   CASE
                       WHEN upper(COALESCE(p.cefr_band, 'A0')) = 'A0'
                           THEN 'a0.first_sentences'
                       WHEN upper(p.cefr_band) = 'A1'
                           THEN 'a1.daily_life'
                       WHEN upper(p.cefr_band) = 'A2'
                           THEN 'a2.conversation'
                       WHEN upper(p.cefr_band) = 'B1'
                           THEN 'b1.work_laboratory'
                       ELSE 'b2.personal_laboratory'
                   END AS lesson_key,
                   i.hebrew_text,
                   i.hebrew_with_niqqud,
                   i.transliteration,
                   i.translation_en,
                   i.translation_es,
                   i.priority,
                   i.context_label,
                   r.due_at,
                   CASE WHEN r.due_at IS NOT NULL AND r.due_at <= ? THEN 1 ELSE 0 END
                       AS due_now,
                   COALESCE(evidence.recent_accuracy, 0.5) AS recent_accuracy,
                   COALESCE(evidence.average_response_ms, 0) AS average_response_ms,
                   COALESCE(evidence.average_confidence, 3) AS average_confidence,
                   evidence.mistake_focus,
                   CASE
                       WHEN lower(i.context_label) = lower(COALESCE(primary_goal.goal_type, ''))
                           THEN 1
                       ELSE 0
                   END AS goal_alignment,
                   CASE
                       WHEN julianday(?) - julianday(i.created_at) BETWEEN 0 AND 7
                           THEN 1
                       ELSE 0
                   END AS fresh,
                   'personal' AS source
            FROM learning_items i
            JOIN profiles p ON p.id = 1
            LEFT JOIN review_state r ON r.item_id = i.id
            LEFT JOIN (
                SELECT item_id,
                       AVG(is_correct) AS recent_accuracy,
                       AVG(response_ms) AS average_response_ms,
                       AVG(confidence) AS average_confidence,
                       MAX(CASE WHEN is_correct = 0 THEN mistake_category END)
                           AS mistake_focus
                FROM attempts
                GROUP BY item_id
            ) evidence ON evidence.item_id = i.id
            LEFT JOIN (
                SELECT goal_type
                FROM goals
                WHERE profile_id = 1 AND is_active = 1
                ORDER BY weight DESC, goal_type ASC
                LIMIT 1
            ) primary_goal ON 1 = 1
            WHERE i.archived_at IS NULL
            ORDER BY
                CASE WHEN r.due_at IS NOT NULL AND r.due_at <= ? THEN 0 ELSE 1 END,
                i.priority DESC,
                COALESCE(r.due_at, i.created_at) ASC,
                i.id ASC
            LIMIT 12
            """,
            (iso_now(), iso_now(), iso_now()),
        ).fetchall()
        return LocalLearningEngine().build_daily_plan(
            dict(profile),
            [dict(row) for row in rows],
        )

    @staticmethod
    def _decode_practice_plan(raw_plan: Any) -> dict[str, Any]:
        """Validate the minimum persisted practice-plan shape."""
        try:
            plan = json.loads(str(raw_plan))
        except json.JSONDecodeError as error:
            raise sqlite3.DatabaseError("Stored practice plan is invalid JSON") from error
        if not isinstance(plan, dict) or not isinstance(plan.get("steps"), list):
            raise sqlite3.DatabaseError("Stored practice plan is invalid")
        return cast(dict[str, Any], plan)

    def _practice_session_payload(
        self,
        connection: sqlite3.Connection,
        session: sqlite3.Row,
    ) -> dict[str, Any]:
        """Build one safe session response from its persisted plan and events."""
        plan = self._decode_practice_plan(session["plan_json"])
        rows = connection.execute(
            """
            SELECT id, step_key, outcome, meaningful, outcome_json, created_at
            FROM practice_step_events
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session["id"],),
        ).fetchall()
        events: list[dict[str, Any]] = []
        for row in rows:
            outcome_payload = json.loads(str(row["outcome_json"]))
            events.append(
                {
                    "id": int(row["id"]),
                    "step_key": str(row["step_key"]),
                    "outcome": str(row["outcome"]),
                    "meaningful": bool(row["meaningful"]),
                    "is_correct": (
                        outcome_payload.get("is_correct")
                        if isinstance(outcome_payload, dict)
                        else None
                    ),
                    "created_at": str(row["created_at"]),
                }
            )
        current_step = int(session["current_step"])
        steps = plan["steps"]
        status = str(session["status"])
        meaningful_actions = sum(bool(event["meaningful"]) for event in events)
        daily_goal_target = sum(
            LocalLearningEngine.is_meaningful_step(step) for step in steps
        )
        return {
            "id": str(session["id"]),
            "local_date": str(session["local_date"]),
            "status": status,
            "current_step": current_step,
            "current_step_key": (
                str(steps[current_step]["key"])
                if status == "active" and current_step < len(steps)
                else None
            ),
            "plan": plan,
            "events": events,
            "daily_goal": {
                "target": daily_goal_target,
                "completed": min(daily_goal_target, meaningful_actions),
                "achieved": meaningful_actions >= daily_goal_target,
            },
            "summary": (
                LocalLearningEngine.session_summary(events)
                if status == "completed"
                else None
            ),
            "persisted": True,
            "created_at": str(session["created_at"]),
            "updated_at": str(session["updated_at"]),
            "completed_at": session["completed_at"],
        }

    @staticmethod
    def _record_curriculum_progress(
        connection: sqlite3.Connection,
        *,
        lesson_key: str,
        successful: bool,
        updated_at: str,
    ) -> dict[str, Any]:
        """Increment meaningful lesson evidence inside the session transaction."""
        current = connection.execute(
            "SELECT * FROM curriculum_progress WHERE lesson_key = ?",
            (lesson_key,),
        ).fetchone()
        meaningful_attempts = int(current["meaningful_attempts"]) + 1 if current else 1
        successful_attempts = (
            int(current["successful_attempts"]) + int(successful) if current else int(successful)
        )
        status = LocalLearningEngine.progress_status(
            meaningful_attempts,
            successful_attempts,
        )
        completed_at = (
            str(current["completed_at"])
            if current is not None and current["completed_at"] is not None
            else updated_at if status == "completed" else None
        )
        connection.execute(
            """
            INSERT INTO curriculum_progress(
                lesson_key, status, meaningful_attempts, successful_attempts,
                last_practiced_at, completed_at, updated_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(lesson_key) DO UPDATE SET
                status = excluded.status,
                meaningful_attempts = excluded.meaningful_attempts,
                successful_attempts = excluded.successful_attempts,
                last_practiced_at = excluded.last_practiced_at,
                completed_at = excluded.completed_at,
                updated_at = excluded.updated_at
            """,
            (
                lesson_key,
                status,
                meaningful_attempts,
                successful_attempts,
                updated_at,
                completed_at,
                updated_at,
            ),
        )
        return {
            "lesson_key": lesson_key,
            "status": status,
            "meaningful_attempts": meaningful_attempts,
            "successful_attempts": successful_attempts,
            "last_practiced_at": updated_at,
            "completed_at": completed_at,
        }

    def _learning_core_read_model(
        self,
        connection: Any,
        *,
        now_dt: datetime | None = None,
    ) -> tuple[dict[str, Any], dict[str, Any] | None]:
        """Build the v2.6 read model without changing persisted learner state."""
        current_time = now_dt or utc_now()
        now = current_time.isoformat(timespec="seconds")
        profile_row = connection.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
        if profile_row is None:
            raise KeyError("Local profile is not initialized")
        profile = dict(profile_row)
        raw_track = str(profile.get("curriculum_track", "modern_conversation"))
        track = raw_track if raw_track in CURRICULUM_TRACKS else "modern_conversation"
        raw_band = str(profile.get("cefr_band", profile.get("hebrew_level", "A0"))).upper()
        band = raw_band if raw_band in CEFR_BANDS else "A0"
        raw_mode = str(profile.get("learner_mode", "guided"))
        mode = raw_mode if raw_mode in LEARNER_MODES else "guided"

        persisted_state = connection.execute(
            """
            SELECT current_item_id, phase, state_version, updated_at
            FROM learning_core_state
            WHERE profile_id = 1
            """
        ).fetchone()
        item = None
        phase: LessonPhase = "encounter"
        next_due_at: str | None = None
        state_version = int(persisted_state["state_version"]) if persisted_state else 0
        state_updated_at = (
            str(persisted_state["updated_at"]) if persisted_state else "bootstrap"
        )
        if persisted_state is not None and persisted_state["current_item_id"] is not None:
            item_row = connection.execute(
                """
                SELECT i.*, r.interval_days, r.ease_factor, r.repetitions,
                       r.lapses, r.due_at, r.last_reviewed_at
                FROM learning_items i
                JOIN review_state r ON r.item_id = i.id
                WHERE i.id = ? AND i.archived_at IS NULL
                  AND (
                      NULLIF(TRIM(COALESCE(i.translation_en, '')), '') IS NOT NULL
                      OR NULLIF(TRIM(COALESCE(i.translation_es, '')), '') IS NOT NULL
                  )
                """,
                (int(persisted_state["current_item_id"]),),
            ).fetchone()
            if item_row is not None:
                item = dict(item_row)
                raw_phase = str(persisted_state["phase"])
                phase = raw_phase if raw_phase in LESSON_PHASES else "encounter"

        if item is None:
            candidate = connection.execute(
                """
                SELECT i.*, r.interval_days, r.ease_factor, r.repetitions,
                       r.lapses, r.due_at, r.last_reviewed_at
                FROM learning_items i
                JOIN review_state r ON r.item_id = i.id
                WHERE i.archived_at IS NULL
                  AND r.due_at <= ?
                  AND (
                      NULLIF(TRIM(COALESCE(i.translation_en, '')), '') IS NOT NULL
                      OR NULLIF(TRIM(COALESCE(i.translation_es, '')), '') IS NOT NULL
                  )
                ORDER BY r.due_at ASC, i.priority DESC, i.id ASC
                LIMIT 1
                """,
                (now,),
            ).fetchone()
            if candidate is None:
                candidate = connection.execute(
                    """
                    SELECT i.*, r.interval_days, r.ease_factor, r.repetitions,
                           r.lapses, r.due_at, r.last_reviewed_at
                    FROM learning_items i
                    JOIN review_state r ON r.item_id = i.id
                    WHERE i.archived_at IS NULL
                      AND r.repetitions = 0
                      AND (
                          NULLIF(TRIM(COALESCE(i.translation_en, '')), '') IS NOT NULL
                          OR NULLIF(TRIM(COALESCE(i.translation_es, '')), '') IS NOT NULL
                      )
                      AND NOT EXISTS (
                          SELECT 1 FROM learning_core_attempts a WHERE a.item_id = i.id
                      )
                    ORDER BY i.priority DESC, i.id ASC
                    LIMIT 1
                    """
                ).fetchone()
            item = dict(candidate) if candidate is not None else None
            phase = (
                "delayed_review"
                if item is not None and int(item.get("repetitions", 0)) > 0
                else "encounter"
            )
            if item is None:
                future_review = connection.execute(
                    """
                    SELECT MIN(r.due_at) AS due_at
                    FROM review_state r
                    JOIN learning_items i ON i.id = r.item_id
                    WHERE i.archived_at IS NULL
                      AND r.due_at > ?
                      AND (
                          NULLIF(TRIM(COALESCE(i.translation_en, '')), '') IS NOT NULL
                          OR NULLIF(TRIM(COALESCE(i.translation_es, '')), '') IS NOT NULL
                      )
                    """,
                    (now,),
                ).fetchone()
                if future_review is not None and future_review["due_at"] is not None:
                    next_due_at = str(future_review["due_at"])

        support_state: dict[str, Any] = (
            self._reading_support_record(connection, int(item["id"]))
            if item is not None
            else {
                "support_level": "full_niqqud",
                "success_streak": 0,
                "total_successes": 0,
                "total_failures": 0,
                "evidence_to_advance": READING_EVIDENCE_THRESHOLD,
            }
        )
        support = cast(ReadingSupport, support_state["support_level"])
        niqqud_available = bool(
            item is not None and str(item.get("hebrew_with_niqqud") or "").strip()
        )
        wait_until = next_due_at
        if item is not None and phase == "delayed_review":
            due_at = datetime.fromisoformat(str(item["due_at"]))
            if due_at > current_time:
                wait_until = due_at.isoformat(timespec="seconds")

        skill_rows = connection.execute(
            """
            WITH meaningful_evidence AS (
                SELECT modality AS skill_dimension, is_correct
                FROM attempts
                UNION ALL
                SELECT skill_dimension, is_correct
                FROM learning_core_attempts
                WHERE evidence_kind IN ('unassisted', 'correction_uptake')
            )
            SELECT skill_dimension, COUNT(*) AS evidence_count,
                   AVG(is_correct) AS accuracy
            FROM meaningful_evidence
            GROUP BY skill_dimension
            """
        ).fetchall()
        skill_map: dict[str, float] = {dimension: 0.0 for dimension in SKILL_DIMENSIONS}
        skill_evidence_counts: dict[str, int] = {
            dimension: 0 for dimension in SKILL_DIMENSIONS
        }
        for row in skill_rows:
            dimension = str(row["skill_dimension"])
            if dimension not in skill_map:
                continue
            skill_map[dimension] = round(float(row["accuracy"] or 0), 4)
            skill_evidence_counts[dimension] = int(row["evidence_count"])
        state = {
            "current_item_id": int(item["id"]) if item is not None else None,
            "phase": phase,
            "reading_support": support,
            "niqqud_available": niqqud_available,
            "reading_evidence": {
                "success_streak": int(support_state["success_streak"]),
                "total_successes": int(support_state["total_successes"]),
                "total_failures": int(support_state["total_failures"]),
                "evidence_to_advance": int(support_state["evidence_to_advance"]),
            },
            "wait_until": wait_until,
            "state_version": state_version,
            "updated_at": state_updated_at,
        }
        payload = {
            "contract_version": CONTRACT_VERSION,
            "profile": {
                "curriculum_track": track,
                "cefr_band": band,
                "learner_mode": mode,
            },
            "curriculum": {
                "tracks": list(CURRICULUM_TRACKS),
                "cefr_bands": list(CEFR_BANDS),
                "ux_modes": list(LEARNER_MODES),
                "lesson_phases": list(LESSON_PHASES),
                "skill_dimensions": list(SKILL_DIMENSIONS),
                "evidence_kinds": list(EVIDENCE_KINDS),
                "reading_support_ladder": list(READING_SUPPORT_LADDER),
                "evidence_source": "learner_self_report",
                "skill_map_metric": "meaningful_attempt_accuracy",
                "selection_policy": "shared_due_queue_pilot",
                "track_status": "preference_only",
                "cefr_status": "self_selected_planning_band",
            },
            "state": state,
            "skill_map": skill_map,
            "skill_evidence_counts": skill_evidence_counts,
            "retention_checkpoints": self._retention_checkpoints(connection),
        }
        return payload, item

    @staticmethod
    def _reading_support_record(connection: Any, item_id: int) -> dict[str, Any]:
        row = connection.execute(
            "SELECT * FROM reading_support_state WHERE concept_key = ?",
            (f"item:{item_id}",),
        ).fetchone()
        if row is None:
            return {
                "support_level": "full_niqqud",
                "success_streak": 0,
                "total_successes": 0,
                "total_failures": 0,
                "evidence_to_advance": READING_EVIDENCE_THRESHOLD,
            }
        payload = dict(row)
        level = cast(ReadingSupport, str(payload["support_level"]))
        payload["evidence_to_advance"] = reading_evidence_to_advance(
            level,
            int(payload["success_streak"]),
        )
        return payload

    @staticmethod
    def _learning_core_request_hash(payload: dict[str, Any]) -> str:
        """Hash a normalized attempt for idempotency comparison without storing answer text."""
        encoded = json.dumps(
            payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    @staticmethod
    def _retention_checkpoints(connection: Any) -> list[dict[str, Any]]:
        """Summarize delayed evidence without exposing text or inventing percentages."""
        rows = connection.execute(
            """
            SELECT delayed.is_correct,
                   (
                       julianday(delayed.created_at) - julianday((
                           SELECT MAX(learned.created_at)
                           FROM learning_core_attempts learned
                           WHERE learned.item_id = delayed.item_id
                             AND learned.phase = 'corrected_retry'
                             AND learned.is_correct = 1
                             AND learned.created_at < delayed.created_at
                       ))
                   ) * 24 AS elapsed_hours
            FROM learning_core_attempts delayed
            WHERE delayed.phase = 'delayed_review'
              AND delayed.evidence_kind = 'unassisted'
            """
        ).fetchall()
        windows = {
            "24h": (18, 54),
            "7d": (120, 240),
            "30d": (504, 1080),
        }
        buckets: dict[str, list[bool]] = {checkpoint: [] for checkpoint in windows}
        for row in rows:
            if row["elapsed_hours"] is None:
                continue
            elapsed_hours = float(row["elapsed_hours"])
            for checkpoint, (minimum, maximum) in windows.items():
                if minimum <= elapsed_hours <= maximum:
                    buckets[checkpoint].append(bool(row["is_correct"]))
                    break

        results: list[dict[str, Any]] = []
        for checkpoint in ("24h", "7d", "30d"):
            observations = buckets[checkpoint]
            attempts = len(observations)
            correct = sum(observations)
            enough = attempts >= 3
            results.append(
                {
                    "checkpoint": checkpoint,
                    "evidence_source": "learner_self_report",
                    "window_hours": {
                        "minimum": windows[checkpoint][0],
                        "maximum": windows[checkpoint][1],
                    },
                    "attempts": attempts,
                    "correct": correct,
                    "accuracy": round(correct / attempts, 4) if enough else None,
                    "status": "observed" if enough else "insufficient_evidence",
                }
            )
        return results

    @staticmethod
    def _learning_core_activity(
        state_payload: dict[str, Any],
        item: dict[str, Any] | None,
    ) -> dict[str, Any] | None:
        if item is None:
            return None
        state = state_payload["state"]
        phase = cast(LessonPhase, state["phase"])
        support = cast(ReadingSupport, state["reading_support"])
        mode = cast(LearnerMode, state_payload["profile"]["learner_mode"])
        wait_until = state["wait_until"]
        niqqud_available = bool(state["niqqud_available"])
        skill = skill_for_activity(phase, support)
        if phase in {"retrieval", "delayed_review"} and not niqqud_available:
            skill = "unpointed_reading"
        rationale = activity_rationale(
            phase,
            support,
            niqqud_available=niqqud_available,
        )
        activity_token = build_activity_token(
            item_id=int(item["id"]),
            phase=phase,
            state_version=int(state["state_version"]),
            state_updated_at=str(state["updated_at"]),
            due_at=str(item["due_at"]),
            item_updated_at=str(item["updated_at"]),
            support=support,
            niqqud_available=niqqud_available,
        )
        if wait_until:
            review_reason = (
                f"Delayed review is scheduled for {wait_until}; spacing is preserved until then."
            )
        elif phase == "delayed_review":
            review_reason = "The scheduler's delayed review is due now."
        elif phase in {"encounter", "retrieval", "focused_feedback", "corrected_retry"}:
            review_reason = (
                "A delayed review will be scheduled after a correct corrected-retry response."
            )
        else:
            review_reason = (
                "The existing review interval is retained while transfer and reflection are recorded."
            )
        return {
            "item": LearningRepository._learning_core_public_item(item),
            "phase": phase,
            "skill_dimension": skill,
            "reading_support": support,
            "niqqud_available": niqqud_available,
            "prompt_key": activity_prompt_key(phase, mode),
            "rationale": rationale,
            "next_review_reason": review_reason,
            "can_submit": wait_until is None,
            "wait_until": wait_until,
            "activity_token": activity_token,
        }

    @staticmethod
    def _learning_core_public_item(item: dict[str, Any]) -> dict[str, Any]:
        """Return only fields required by the learning UI, excluding private capture metadata."""
        fields = (
            "id",
            "hebrew_text",
            "hebrew_with_niqqud",
            "transliteration",
            "translation_en",
            "translation_es",
            "item_type",
            "root",
            "binyan",
            "grammatical_gender",
            "register_label",
            "context_label",
        )
        return {field: item.get(field) for field in fields}

    @staticmethod
    def _schedule_learning_core_review(
        connection: Any,
        *,
        item_id: int,
        is_correct: bool,
        confidence: int,
        hints_used: int,
        now_dt: datetime,
    ) -> dict[str, Any]:
        row = connection.execute(
            "SELECT * FROM review_state WHERE item_id = ?",
            (item_id,),
        ).fetchone()
        previous = (
            ReviewState(
                interval_days=float(row["interval_days"]),
                ease_factor=float(row["ease_factor"]),
                repetitions=int(row["repetitions"]),
                lapses=int(row["lapses"]),
                due_at=datetime.fromisoformat(str(row["due_at"])),
            )
            if row is not None
            else ReviewState.new(now_dt)
        )
        decision = schedule_review(
            previous,
            is_correct=is_correct,
            confidence=confidence,
            hints_used=hints_used,
            now=now_dt,
        )
        connection.execute(
            """
            INSERT INTO review_state(
                item_id, interval_days, ease_factor, repetitions,
                lapses, due_at, last_reviewed_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(item_id) DO UPDATE SET
                interval_days = excluded.interval_days,
                ease_factor = excluded.ease_factor,
                repetitions = excluded.repetitions,
                lapses = excluded.lapses,
                due_at = excluded.due_at,
                last_reviewed_at = excluded.last_reviewed_at
            """,
            (
                item_id,
                decision.state.interval_days,
                decision.state.ease_factor,
                decision.state.repetitions,
                decision.state.lapses,
                decision.state.due_at.isoformat(timespec="seconds"),
                now_dt.isoformat(timespec="seconds"),
            ),
        )
        return {
            **asdict(decision.state),
            "due_at": decision.state.due_at.isoformat(timespec="seconds"),
            "quality": decision.quality,
            "reason": decision.reason,
        }

    def _unlock_achievements(self, connection: Any, unlocked_at: str) -> list[Any]:
        """Persist newly satisfied achievements inside an active transaction.

        Args:
            connection: Active SQLite connection.
            unlocked_at: ISO timestamp shared by the triggering action.

        Returns:
            Newly unlocked achievement definitions.

        Example:
            Used after captures and reviews so rewards arrive immediately.
        """
        metrics = self._metrics(connection)
        existing = {
            row["achievement_key"]
            for row in connection.execute(
                "SELECT achievement_key FROM unlocked_achievements"
            ).fetchall()
        }
        newly_unlocked = evaluate_achievement_keys(metrics, existing)
        for achievement in newly_unlocked:
            connection.execute(
                """
                INSERT INTO unlocked_achievements(achievement_key, unlocked_at, xp_reward)
                VALUES(?, ?, ?)
                """,
                (achievement.key, unlocked_at, achievement.xp_reward),
            )
            connection.execute(
                """
                INSERT INTO xp_ledger(action, amount, source_type, source_id, metadata_json, created_at)
                VALUES('achievement', ?, 'achievement', ?, ?, ?)
                """,
                (
                    achievement.xp_reward,
                    achievement.key,
                    json.dumps({"title_en": achievement.title_en}),
                    unlocked_at,
                ),
            )
        return newly_unlocked

    def _award_xp(
        self,
        connection: Any,
        action: XPAction,
        source_type: str,
        source_id: str,
        multiplier: float = 1.0,
    ) -> int:
        """Append an XP ledger row inside an existing transaction.

        Args:
            connection: Active SQLite connection.
            action: XP action.
            source_type: Source entity type.
            source_id: Source entity ID.
            multiplier: Situational multiplier.

        Returns:
            Awarded XP.

        Example:
            This helper is exercised through `create_item` and `submit_review`.
        """
        today = utc_now().date().isoformat()
        earned = connection.execute(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM xp_ledger
            WHERE action = ? AND substr(created_at, 1, 10) = ?
            """,
            (action.value, today),
        ).fetchone()[0]
        amount = xp_for_action(action, int(earned), multiplier)
        connection.execute(
            """
            INSERT INTO xp_ledger(action, amount, source_type, source_id, metadata_json, created_at)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
            (
                action.value,
                amount,
                source_type,
                source_id,
                json.dumps({"multiplier": multiplier}),
                iso_now(),
            ),
        )
        return amount

    @staticmethod
    def _total_xp(connection: Any) -> int:
        """Return total XP from an active connection.

        Args:
            connection: SQLite connection.

        Returns:
            Lifetime XP.

        Example:
            Used internally by dashboard and review transactions.
        """
        return int(
            connection.execute("SELECT COALESCE(SUM(amount), 0) FROM xp_ledger").fetchone()[0]
        )

    def _metrics(self, connection: Any) -> dict[str, int]:
        """Build achievement metrics inside an active transaction.

        Args:
            connection: SQLite connection.

        Returns:
            Metric mapping.

        Example:
            Used internally after review submission.
        """
        return {
            "captured_items": int(
                connection.execute("SELECT COUNT(*) FROM learning_items").fetchone()[0]
            ),
            "speaking_attempts": int(
                connection.execute(
                    "SELECT COUNT(*) FROM attempts WHERE modality = 'speaking'"
                ).fetchone()[0]
            ),
            "dictionary_items_saved": int(
                connection.execute(
                    """
                    SELECT COUNT(DISTINCT source_label)
                    FROM learning_items
                    WHERE archived_at IS NULL AND source_label LIKE 'dictionary:%'
                    """
                ).fetchone()[0]
            ),
            "real_life_successes": int(
                connection.execute("SELECT COUNT(*) FROM missions WHERE success = 1").fetchone()[0]
            ),
            "locales_used": int(
                connection.execute(
                    "SELECT COUNT(DISTINCT json_extract(payload_json, '$.locale')) FROM user_events WHERE event_type = 'locale_used'"
                ).fetchone()[0]
            ),
            "streak_days": self._calculate_streak(connection),
        }

    def _calculate_streak(self, existing_connection: Any | None = None) -> int:
        """Calculate meaningful-practice streak with a weekly rest-day grace.

        Args:
            existing_connection: Optional active connection.

        Returns:
            Current streak days.

        Example:
            >>> db = Database(Path(":memory:")); db.initialize(); repo = LearningRepository(db)
            >>> repo._calculate_streak()
            0
        """
        connection = existing_connection or self.database.connect()
        should_close = existing_connection is None and str(self.database.path) != ":memory:"
        try:
            profile = connection.execute(
                "SELECT weekly_rest_day FROM profiles WHERE id = 1"
            ).fetchone()
            rest_day = int(profile["weekly_rest_day"]) if profile else 5
            rows = connection.execute(
                """
                SELECT day
                FROM (
                    SELECT DISTINCT substr(created_at, 1, 10) AS day
                    FROM user_events
                    WHERE event_type IN ('review_submitted', 'mission_completed')
                    UNION
                    SELECT DISTINCT substr(created_at, 1, 10) AS day
                    FROM learning_core_attempts
                    WHERE evidence_kind IN ('unassisted', 'correction_uptake')
                )
                ORDER BY day DESC
                """
            ).fetchall()
            active_days = {datetime.fromisoformat(row["day"]).date() for row in rows}
            streak = 0
            cursor = utc_now().date()
            for _ in range(400):
                if cursor in active_days:
                    streak += 1
                elif cursor.weekday() != rest_day:
                    break
                cursor -= timedelta(days=1)
            return streak
        finally:
            if should_close:
                connection.close()
