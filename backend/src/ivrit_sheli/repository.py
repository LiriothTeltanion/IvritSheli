"""
Module: learning repository
Purpose: Persist learner items and coordinate atomic review, mastery, XP, and achievement updates.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from ivrit_sheli.database import Database
from ivrit_sheli.gamification import (
    ACHIEVEMENTS,
    XPAction,
    evaluate_achievement_keys,
    level_progress,
    xp_for_action,
)
from ivrit_sheli.normalization import normalize_hebrew
from ivrit_sheli.personalization import MasteryState, focus_summary, update_mastery
from ivrit_sheli.recommendation import RecommendationCandidate, rank_candidates
from ivrit_sheli.scheduler import ReviewState, review_urgency, schedule_review

PRONUNCIATION_MASTERY_THRESHOLD = 70
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
                SELECT modality, COUNT(*) AS attempts, AVG(is_correct) AS accuracy,
                       AVG(confidence) AS confidence, AVG(response_ms) AS response_ms
                FROM attempts
                GROUP BY modality
                ORDER BY attempts DESC
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
                SELECT substr(created_at, 1, 10) AS day,
                       COUNT(*) AS attempts,
                       SUM(is_correct) AS correct
                FROM attempts
                WHERE created_at >= ?
                GROUP BY day
                ORDER BY day
                """,
                ((utc_now() - timedelta(days=30)).isoformat(timespec="seconds"),),
            ).fetchall()
            mastery_rows = connection.execute(
                """
                SELECT concept_key, recognition, production, listening,
                       speaking, observations, updated_at
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
                    }
                    for row in modality_rows
                ],
                "mistakes": [dict(row) for row in mistake_rows],
                "activity": [dict(row) for row in activity_rows],
                "activity_log": activity_log,
                "mastery": [dict(row) for row in mastery_rows],
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
                listening, speaking, observations, updated_at
            ) VALUES(?, 'learning_item', ?, ?, ?, ?, ?, ?)
            ON CONFLICT(concept_key) DO UPDATE SET
                recognition = excluded.recognition,
                production = excluded.production,
                listening = excluded.listening,
                speaking = excluded.speaking,
                observations = excluded.observations,
                updated_at = excluded.updated_at
            """,
            (
                concept_key,
                mastery.recognition,
                mastery.production,
                mastery.listening,
                mastery.speaking,
                mastery.observations,
                updated_at,
            ),
        )
        return mastery

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
                SELECT DISTINCT substr(created_at, 1, 10) AS day
                FROM user_events
                WHERE event_type IN ('review_submitted', 'mission_completed')
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
