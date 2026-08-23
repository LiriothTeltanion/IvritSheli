"""PostgreSQL cloud identity, session, OAuth-state, and tenant snapshot storage.

The existing SQLite learning engine remains the authoritative local-mode implementation.
Cloud mode serializes that mature relational domain state into one PostgreSQL JSONB document
per user. Explicit tenant predicates are reinforced by PostgreSQL row-level security against
missing or incorrect predicates; the packaged dictionary remains in its optimized read-only
SQLite database.
"""

from __future__ import annotations

import copy
import hashlib
import hmac
import json
import queue
import threading
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Protocol, TypeVar
from urllib.parse import unquote, urlparse
from uuid import UUID, uuid4

from ivrit_sheli.migrations import MIGRATION_HEAD

DEMO_USER_ID = "00000000-0000-4000-8000-000000000042"
RUNTIME_DATABASE_ROLE = "ivrit_sheli_runtime"
PUSH_WORKER_DATABASE_ROLE = "ivrit_sheli_push_worker"
OAUTH_PROVIDERS = frozenset({"github", "google"})
StateResult = TypeVar("StateResult")


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


def validate_oauth_provider(provider: str) -> None:
    """Reject state or identity writes outside the supported provider boundary."""
    if provider not in OAUTH_PROVIDERS:
        raise ValueError("OAuth provider must be github or google")


DEFAULT_TEST_SESSION_SECRET = "test-only-cloud-store-secret-at-least-32-characters"


def bearer_hash(value: str, session_secret: str) -> str:
    """Key bearer material so rotating SESSION_SECRET invalidates prior hashes."""
    secret_key = hashlib.blake2b(
        session_secret.encode("utf-8"),
        digest_size=32,
        person=b"ivrit-bearer-v1",
    ).digest()
    return hashlib.blake2b(
        value.encode("utf-8"),
        key=secret_key,
        digest_size=32,
        person=b"ivrit-token-v1",
    ).hexdigest()


class CloudSnapshotLimitError(ValueError):
    """Raised before a tenant document can exceed its configured durable ceiling."""


def encode_bounded_state(state: dict[str, Any], max_bytes: int) -> str:
    """Serialize one state and reject it before any PostgreSQL/memory save."""
    encoded = json.dumps(state, ensure_ascii=False)
    size = len(encoded.encode("utf-8"))
    if size > max_bytes:
        raise CloudSnapshotLimitError(
            f"Cloud learner snapshot would be {size} bytes; limit is {max_bytes} bytes"
        )
    return encoded


def validate_store_security(session_secret: str, max_snapshot_bytes: int) -> None:
    """Fail closed when a cloud store is created without a real keyed boundary."""
    if len(session_secret) < 32:
        raise ValueError("Cloud store session_secret must contain at least 32 characters")
    if max_snapshot_bytes < 1:
        raise ValueError("Cloud store max_snapshot_bytes must be positive")


@dataclass(frozen=True, slots=True)
class AuthUser:
    """Privacy-minimal authenticated identity exposed to the application."""

    id: str
    display_name: str
    provider: str
    login: str | None = None
    provider_user_id: str | None = None
    avatar_url: str | None = None
    is_demo: bool = False
    is_admin: bool = False

    def public_dict(self) -> dict[str, Any]:
        """Serialize only fields intentionally safe for the signed-in browser."""
        return {
            "id": self.id,
            "display_name": self.display_name,
            "provider": self.provider,
            "avatar_url": self.avatar_url,
            "login": self.login,
        }


@dataclass(frozen=True, slots=True)
class SessionIdentity:
    """Resolved session identity with the stored CSRF verifier."""

    user: AuthUser
    csrf_hash: str
    expires_at: datetime


class CloudStore(Protocol):
    """Storage contract used by authentication and tenant repositories."""

    def close(self) -> None: ...
    def configure_security(
        self, session_secret: str, max_snapshot_bytes: int
    ) -> None: ...
    def hash_bearer(self, value: str) -> str: ...
    def ready(self) -> bool: ...
    def ensure_demo_user(self) -> AuthUser: ...
    def upsert_github_user(self, profile: dict[str, Any]) -> AuthUser: ...
    def upsert_google_user(self, profile: dict[str, Any]) -> AuthUser: ...
    def delete_user(self, user_id: str) -> None: ...
    def upsert_push_subscription(
        self,
        user_id: str,
        endpoint_hash: str,
        subscription_ciphertext: str,
        preferences: dict[str, Any],
        expires_at: datetime | None,
    ) -> dict[str, Any]: ...
    def delete_push_subscription(self, user_id: str, endpoint_hash: str) -> bool: ...
    def update_push_subscription_preferences(
        self, user_id: str, preferences: dict[str, Any]
    ) -> None: ...
    def create_session(
        self,
        user_id: str,
        token: str,
        csrf_token: str,
        ttl_seconds: int,
        *,
        max_live_sessions: int | None = None,
        retention_seconds: int = 604_800,
    ) -> SessionIdentity: ...
    def resolve_session(self, token: str) -> SessionIdentity | None: ...
    def revoke_session(self, token: str) -> None: ...
    def store_oauth_state(
        self,
        state: str,
        verifier: str,
        redirect_path: str,
        ttl_seconds: int = 600,
        *,
        provider: str = "github",
        max_active_states: int | None = None,
    ) -> bool: ...
    def consume_oauth_state(
        self, state: str, *, provider: str = "github"
    ) -> tuple[str, str] | None: ...
    def read_state(self, user_id: str) -> dict[str, Any]: ...
    def mutate_state(
        self,
        user_id: str,
        operation: Callable[[dict[str, Any]], tuple[dict[str, Any], StateResult]],
    ) -> StateResult: ...


class MemoryCloudStore:
    """Thread-safe cloud-store double for deterministic auth and isolation tests."""

    def __init__(
        self,
        session_secret: str = DEFAULT_TEST_SESSION_SECRET,
        max_snapshot_bytes: int = 4_194_304,
    ) -> None:
        self._lock = threading.RLock()
        validate_store_security(session_secret, max_snapshot_bytes)
        self.session_secret = session_secret
        self.max_snapshot_bytes = max_snapshot_bytes
        self._users: dict[str, AuthUser] = {}
        self._provider_ids: dict[tuple[str, str], str] = {}
        self._sessions: dict[str, tuple[str, str, datetime, datetime, int]] = {}
        self._session_sequence = 0
        self._oauth_states: dict[str, tuple[str, str, str, datetime]] = {}
        self._states: dict[str, dict[str, Any]] = {}
        self._push_subscriptions: dict[tuple[str, str], dict[str, Any]] = {}

    def close(self) -> None:
        """Memory storage has no external resources."""

    def configure_security(
        self, session_secret: str, max_snapshot_bytes: int
    ) -> None:
        """Apply the application key and state ceiling to an injected test store."""
        validate_store_security(session_secret, max_snapshot_bytes)
        with self._lock:
            self.session_secret = session_secret
            self.max_snapshot_bytes = max_snapshot_bytes

    def hash_bearer(self, value: str) -> str:
        """Return the keyed storage digest for one bearer value."""
        return bearer_hash(value, self.session_secret)

    def ready(self) -> bool:
        """Memory storage is available for the lifetime of the process."""
        return True

    def ensure_demo_user(self) -> AuthUser:
        """Create the stable, non-admin demonstration identity idempotently."""
        with self._lock:
            user = AuthUser(
                id=DEMO_USER_ID,
                display_name="Ivrit Sheli Demo",
                provider="demo",
                login="ivrit-sheli-demo",
                provider_user_id="seeded-public-demo",
                avatar_url=None,
                is_demo=True,
                is_admin=False,
            )
            self._users[user.id] = user
            self._states.setdefault(user.id, {})
            return user

    def upsert_github_user(self, profile: dict[str, Any]) -> AuthUser:
        """Upsert a GitHub identity without retaining tokens or email addresses."""
        return self._upsert_oauth_user("github", profile)

    def upsert_google_user(self, profile: dict[str, Any]) -> AuthUser:
        """Upsert minimal Google OIDC identity fields without retaining tokens or email."""
        return self._upsert_oauth_user("google", profile)

    def _upsert_oauth_user(self, provider: str, profile: dict[str, Any]) -> AuthUser:
        validate_oauth_provider(provider)
        provider_id = str(profile["id"])
        key = (provider, provider_id)
        with self._lock:
            user_id = self._provider_ids.get(key, str(uuid4()))
            user = AuthUser(
                id=user_id,
                display_name=str(profile.get("name") or profile.get("login") or "Learner")[:100],
                provider=provider,
                login=str(profile.get("login") or "")[:100] or None,
                provider_user_id=provider_id,
                avatar_url=str(profile.get("avatar_url") or "")[:500] or None,
            )
            self._provider_ids[key] = user.id
            self._users[user.id] = user
            self._states.setdefault(user.id, {})
            return user

    def delete_user(self, user_id: str) -> None:
        """Delete one non-demo identity, all sessions, and its private learner state."""
        with self._lock:
            user = self._users.get(user_id)
            if user is None:
                raise KeyError("User is not available")
            if user.is_demo:
                raise ValueError("The shared demonstration account cannot be deleted")
            self._users.pop(user_id)
            self._states.pop(user_id, None)
            self._provider_ids = {
                key: stored_user_id
                for key, stored_user_id in self._provider_ids.items()
                if stored_user_id != user_id
            }
            self._sessions = {
                key: record
                for key, record in self._sessions.items()
                if record[0] != user_id
            }
            self._push_subscriptions = {
                key: record
                for key, record in self._push_subscriptions.items()
                if key[0] != user_id
            }

    def upsert_push_subscription(
        self,
        user_id: str,
        endpoint_hash: str,
        subscription_ciphertext: str,
        preferences: dict[str, Any],
        expires_at: datetime | None,
    ) -> dict[str, Any]:
        """Store an encrypted test subscription without exposing endpoint material."""
        with self._lock:
            if user_id not in self._users:
                raise KeyError("User is not available")
            now = utc_now()
            key = (user_id, endpoint_hash)
            for existing_key in tuple(self._push_subscriptions):
                if existing_key[1] == endpoint_hash and existing_key != key:
                    self._push_subscriptions.pop(existing_key)
            existing = self._push_subscriptions.get(key, {})
            record = {
                "user_id": user_id,
                "endpoint_hash": endpoint_hash,
                "subscription_ciphertext": subscription_ciphertext,
                "enabled": bool(preferences.get("enabled", False)),
                "locale": str(preferences.get("locale", "en")),
                "timezone": str(preferences.get("timezone", "Asia/Jerusalem")),
                "preferred_time": str(preferences.get("preferred_time", "19:00")),
                "weekly_rest_day": int(preferences.get("weekly_rest_day", 5)),
                "quiet_hours_start": str(preferences.get("quiet_hours_start", "22:00")),
                "quiet_hours_end": str(preferences.get("quiet_hours_end", "08:00")),
                "last_sent_local_date": existing.get("last_sent_local_date"),
                "failure_count": int(existing.get("failure_count", 0)),
                "expires_at": expires_at,
                "created_at": existing.get("created_at", now),
                "updated_at": now,
            }
            self._push_subscriptions[key] = record
            return {
                "active": record["enabled"],
                "created_at": record["created_at"].isoformat(),
                "updated_at": record["updated_at"].isoformat(),
            }

    def delete_push_subscription(self, user_id: str, endpoint_hash: str) -> bool:
        """Delete only the requesting tenant's matching subscription."""
        with self._lock:
            return self._push_subscriptions.pop((user_id, endpoint_hash), None) is not None

    def update_push_subscription_preferences(
        self, user_id: str, preferences: dict[str, Any]
    ) -> None:
        """Synchronize reminder scheduling fields across one tenant's subscriptions."""
        with self._lock:
            for (stored_user_id, _endpoint_hash), record in self._push_subscriptions.items():
                if stored_user_id != user_id:
                    continue
                for key in (
                    "enabled",
                    "locale",
                    "timezone",
                    "preferred_time",
                    "weekly_rest_day",
                    "quiet_hours_start",
                    "quiet_hours_end",
                ):
                    if key in preferences:
                        record[key] = preferences[key]
                record["updated_at"] = utc_now()

    def create_test_user(self, name: str) -> AuthUser:
        """Create a non-provider user for focused ownership tests."""
        return self.upsert_github_user(
            {"id": f"test-{name}", "name": name, "login": name.lower()}
        )

    def create_session(
        self,
        user_id: str,
        token: str,
        csrf_token: str,
        ttl_seconds: int,
        *,
        max_live_sessions: int | None = None,
        retention_seconds: int = 604_800,
    ) -> SessionIdentity:
        """Store only hashes of session and CSRF bearer values."""
        with self._lock:
            now = utc_now()
            session_cutoff = now - timedelta(seconds=max(0, retention_seconds))
            self._sessions = {
                key: record
                for key, record in self._sessions.items()
                if record[2] > session_cutoff
            }
            self._oauth_states = {
                key: record
                for key, record in self._oauth_states.items()
                if record[3] > now
            }
            if max_live_sessions is not None:
                keep_existing = max(0, max_live_sessions - 1)
                live = sorted(
                    (
                        (key, record)
                        for key, record in self._sessions.items()
                        if record[0] == user_id and record[2] > now
                    ),
                    key=lambda item: (item[1][3], item[1][4]),
                    reverse=True,
                )
                for key, _record in live[keep_existing:]:
                    self._sessions.pop(key, None)
            user = self._users[user_id]
            expires_at = now + timedelta(seconds=ttl_seconds)
            csrf_hash = self.hash_bearer(csrf_token)
            self._session_sequence += 1
            self._sessions[self.hash_bearer(token)] = (
                user_id,
                csrf_hash,
                expires_at,
                now,
                self._session_sequence,
            )
            return SessionIdentity(user, csrf_hash, expires_at)

    def resolve_session(self, token: str) -> SessionIdentity | None:
        """Resolve a live session and reject expired or unknown bearer values."""
        with self._lock:
            token_hash = self.hash_bearer(token)
            stored = self._sessions.get(token_hash)
            if stored is None:
                return None
            user_id, csrf_hash, expires_at, _created_at, _sequence = stored
            if expires_at <= utc_now():
                self._sessions.pop(token_hash, None)
                return None
            return SessionIdentity(self._users[user_id], csrf_hash, expires_at)

    def revoke_session(self, token: str) -> None:
        """Revoke one session without affecting a user's other devices."""
        with self._lock:
            self._sessions.pop(self.hash_bearer(token), None)

    def store_oauth_state(
        self,
        state: str,
        verifier: str,
        redirect_path: str,
        ttl_seconds: int = 600,
        *,
        provider: str = "github",
        max_active_states: int | None = None,
    ) -> bool:
        """Persist one bounded PKCE verifier keyed by hashed OAuth state."""
        validate_oauth_provider(provider)
        with self._lock:
            now = utc_now()
            self._oauth_states = {
                key: record
                for key, record in self._oauth_states.items()
                if record[3] > now
            }
            if (
                max_active_states is not None
                and len(self._oauth_states) >= max_active_states
            ):
                return False
            self._oauth_states[self.hash_bearer(state)] = (
                provider,
                verifier,
                redirect_path,
                now + timedelta(seconds=ttl_seconds),
            )
            return True

    def consume_oauth_state(
        self, state: str, *, provider: str = "github"
    ) -> tuple[str, str] | None:
        """Consume only an unexpired state created for the same provider."""
        validate_oauth_provider(provider)
        with self._lock:
            state_hash = self.hash_bearer(state)
            value = self._oauth_states.get(state_hash)
            if value is None:
                return None
            stored_provider, verifier, redirect_path, expires_at = value
            if expires_at <= utc_now():
                self._oauth_states.pop(state_hash, None)
                return None
            if not hmac.compare_digest(stored_provider, provider):
                return None
            self._oauth_states.pop(state_hash, None)
            return verifier, redirect_path

    def read_state(self, user_id: str) -> dict[str, Any]:
        """Return a defensive copy of one user's learner document."""
        with self._lock:
            if user_id not in self._users:
                raise KeyError("User is not available")
            return copy.deepcopy(self._states.setdefault(user_id, {}))

    def mutate_state(
        self,
        user_id: str,
        operation: Callable[[dict[str, Any]], tuple[dict[str, Any], StateResult]],
    ) -> StateResult:
        """Serialize one user's mutation beneath a process-local lock."""
        with self._lock:
            if user_id not in self._users:
                raise KeyError("User is not available")
            current = copy.deepcopy(self._states.setdefault(user_id, {}))
            updated, result = operation(current)
            encode_bounded_state(updated, self.max_snapshot_bytes)
            self._states[user_id] = copy.deepcopy(updated)
            return result


class PostgresCloudStore:
    """Small synchronous PostgreSQL store with explicit tenant and RLS boundaries."""

    def __init__(
        self,
        database_url: str,
        session_secret: str,
        max_snapshot_bytes: int = 4_194_304,
    ) -> None:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as error:  # pragma: no cover - dependency failure is actionable
            raise RuntimeError("Cloud mode requires psycopg[binary]") from error
        self._psycopg = psycopg
        self._dict_row = dict_row
        validate_store_security(session_secret, max_snapshot_bytes)
        self.database_url = database_url.replace("postgres://", "postgresql://", 1)
        self.session_secret = session_secret
        self.max_snapshot_bytes = max_snapshot_bytes
        self._pool: queue.Queue[Any] = queue.Queue(maxsize=8)

    def _create_raw_connection(self) -> Any:
        return self._psycopg.connect(
            self.database_url,
            row_factory=self._dict_row,
            connect_timeout=8,
            autocommit=True,
        )

    def _acquire_connection(self) -> Any:
        while True:
            try:
                connection = self._pool.get_nowait()
            except queue.Empty:
                return self._create_raw_connection()

            if getattr(connection, "closed", True):
                continue

            try:
                connection.execute("SELECT 1")
                return connection
            except Exception:
                try:
                    connection.close()
                except Exception:
                    pass
                continue

    def _release_connection(self, connection: Any) -> None:
        if getattr(connection, "closed", True):
            return
        try:
            connection.execute("DISCARD TEMP; RESET ALL;")
            self._pool.put_nowait(connection)
        except Exception:
            try:
                connection.close()
            except Exception:
                pass

    @contextmanager
    def _connection(self) -> Iterator[Any]:
        connection = self._acquire_connection()
        try:
            yield connection
        finally:
            self._release_connection(connection)

    @contextmanager
    def _tenant_connection(self, user_id: str) -> Iterator[Any]:
        UUID(user_id)
        with self._connection() as connection:
            connection.execute("SELECT set_config('app.user_id', %s, false)", (user_id,))
            yield connection

    def close(self) -> None:
        """Close and drain pooled PostgreSQL connections."""
        while not self._pool.empty():
            try:
                connection = self._pool.get_nowait()
                connection.close()
            except Exception:
                pass

    def configure_security(
        self, session_secret: str, max_snapshot_bytes: int
    ) -> None:
        """Apply the current bearer-digest secret and tenant document ceiling."""
        validate_store_security(session_secret, max_snapshot_bytes)
        self.session_secret = session_secret
        self.max_snapshot_bytes = max_snapshot_bytes

    def hash_bearer(self, value: str) -> str:
        """Return the keyed storage digest for one bearer value."""
        return bearer_hash(value, self.session_secret)

    def ready(self) -> bool:
        """Verify schema state and the direct least-privilege login identity."""
        try:
            with self._connection() as connection:
                row = connection.execute(
                    """
                    SELECT
                        (SELECT version_num FROM alembic_version LIMIT 1)
                            AS migration_revision,
                        SESSION_USER AS session_user,
                        CURRENT_USER AS current_user,
                        r.rolcanlogin,
                        r.rolsuper,
                        r.rolcreatedb,
                        r.rolcreaterole,
                        r.rolinherit,
                        r.rolreplication,
                        r.rolbypassrls,
                        (SELECT COUNT(*) FROM pg_auth_members WHERE member = r.oid)
                            AS role_membership_count,
                        has_schema_privilege(CURRENT_USER, 'public', 'CREATE')
                            AS can_create_in_public
                    FROM pg_roles r
                    WHERE r.rolname = SESSION_USER
                    """
                ).fetchone()
                return bool(
                    row
                    and row["migration_revision"] == MIGRATION_HEAD
                    and row["session_user"] == RUNTIME_DATABASE_ROLE
                    and row["current_user"] == RUNTIME_DATABASE_ROLE
                    and row["rolcanlogin"]
                    and not row["rolsuper"]
                    and not row["rolcreatedb"]
                    and not row["rolcreaterole"]
                    and not row["rolinherit"]
                    and not row["rolreplication"]
                    and not row["rolbypassrls"]
                    and row["role_membership_count"] == 0
                    and not row["can_create_in_public"]
                )
        except Exception:
            return False

    @staticmethod
    def _user(row: dict[str, Any]) -> AuthUser:
        return AuthUser(
            id=str(row["id"]),
            display_name=str(row["display_name"]),
            provider=str(row["provider"]),
            login=row.get("login"),
            provider_user_id=str(row.get("provider_user_id") or "") or None,
            avatar_url=row.get("avatar_url"),
            is_demo=bool(row.get("is_demo")),
            is_admin=bool(row.get("is_admin")),
        )

    def ensure_demo_user(self) -> AuthUser:
        """Create and return the deterministic read-only demonstration identity."""
        with self._connection() as connection:
            row = connection.execute(
                """
                INSERT INTO users(
                    id, provider, provider_user_id, login, display_name,
                    avatar_url, is_demo, is_admin
                ) VALUES(%s, 'demo', 'seeded-public-demo', 'ivrit-sheli-demo',
                         'Ivrit Sheli Demo', NULL, TRUE, FALSE)
                ON CONFLICT(provider, provider_user_id) DO UPDATE
                SET display_name = EXCLUDED.display_name, is_demo = TRUE, is_admin = FALSE
                RETURNING *
                """,
                (DEMO_USER_ID,),
            ).fetchone()
        if row is None:
            raise RuntimeError("PostgreSQL did not return the demo user")
        self._ensure_state(DEMO_USER_ID)
        return self._user(row)

    def upsert_github_user(self, profile: dict[str, Any]) -> AuthUser:
        """Upsert allow-listed GitHub profile fields and never store OAuth tokens."""
        return self._upsert_oauth_user("github", profile)

    def upsert_google_user(self, profile: dict[str, Any]) -> AuthUser:
        """Upsert Google sub/name/picture only; bearer tokens and email are discarded."""
        return self._upsert_oauth_user("google", profile)

    def _upsert_oauth_user(self, provider: str, profile: dict[str, Any]) -> AuthUser:
        validate_oauth_provider(provider)
        provider_id = str(profile["id"])
        with self._connection() as connection:
            row = connection.execute(
                """
                INSERT INTO users(
                    id, provider, provider_user_id, login, display_name, avatar_url,
                    is_demo, is_admin
                ) VALUES(%s, %s, %s, %s, %s, %s, FALSE, FALSE)
                ON CONFLICT(provider, provider_user_id) DO UPDATE SET
                    login = EXCLUDED.login,
                    display_name = EXCLUDED.display_name,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = NOW()
                RETURNING *
                """,
                (
                    str(uuid4()),
                    provider,
                    provider_id,
                    str(profile.get("login") or "")[:100] or None,
                    str(profile.get("name") or profile.get("login") or "Learner")[:100],
                    str(profile.get("avatar_url") or "")[:500] or None,
                ),
            ).fetchone()
        if row is None:
            raise RuntimeError("PostgreSQL did not return the OAuth user")
        user = self._user(row)
        self._ensure_state(user.id)
        return user

    def delete_user(self, user_id: str) -> None:
        """Delete a non-demo identity and cascade its sessions and learner state."""
        UUID(user_id)
        with self._tenant_connection(user_id) as connection:
            row = connection.execute(
                "DELETE FROM users WHERE id = %s AND is_demo = FALSE RETURNING id",
                (user_id,),
            ).fetchone()
        if row is None:
            raise KeyError("User is not available")

    def upsert_push_subscription(
        self,
        user_id: str,
        endpoint_hash: str,
        subscription_ciphertext: str,
        preferences: dict[str, Any],
        expires_at: datetime | None,
    ) -> dict[str, Any]:
        """Upsert one encrypted push subscription inside its tenant RLS context."""
        UUID(user_id)
        with self._tenant_connection(user_id) as connection:
            connection.execute(
                "SELECT set_config('app.push_endpoint_hash', %s, true)",
                (endpoint_hash,),
            )
            row = connection.execute(
                """
                SELECT active, created_at_value, updated_at_value
                FROM public.upsert_push_subscription_for_current_user(
                    %s::uuid, %s::uuid, %s::char(64), %s, %s, %s, %s,
                    %s::time, %s::smallint, %s::time, %s::time, %s
                )
                """,
                (
                    str(uuid4()),
                    user_id,
                    endpoint_hash,
                    subscription_ciphertext,
                    bool(preferences.get("enabled", False)),
                    str(preferences.get("locale", "en")),
                    str(preferences.get("timezone", "Asia/Jerusalem")),
                    str(preferences.get("preferred_time", "19:00")),
                    int(preferences.get("weekly_rest_day", 5)),
                    str(preferences.get("quiet_hours_start", "22:00")),
                    str(preferences.get("quiet_hours_end", "08:00")),
                    expires_at,
                ),
            ).fetchone()
            connection.execute(
                """
                INSERT INTO push_delivery_state(user_id)
                VALUES(%s)
                ON CONFLICT(user_id) DO NOTHING
                """,
                (user_id,),
            )
        if row is None:
            raise RuntimeError("PostgreSQL did not return the push subscription")
        return {
            "active": bool(row["active"]),
            "created_at": row["created_at_value"].isoformat(),
            "updated_at": row["updated_at_value"].isoformat(),
        }

    def delete_push_subscription(self, user_id: str, endpoint_hash: str) -> bool:
        """Delete only a matching subscription owned by the current tenant."""
        UUID(user_id)
        with self._tenant_connection(user_id) as connection:
            row = connection.execute(
                """
                DELETE FROM push_subscriptions
                WHERE user_id = %s AND endpoint_hash = %s
                RETURNING id
                """,
                (user_id, endpoint_hash),
            ).fetchone()
        return row is not None

    def update_push_subscription_preferences(
        self, user_id: str, preferences: dict[str, Any]
    ) -> None:
        """Synchronize scheduling policy for every active device owned by one learner."""
        UUID(user_id)
        with self._tenant_connection(user_id) as connection:
            connection.execute(
                """
                UPDATE push_subscriptions
                SET enabled = %s,
                    locale = %s,
                    timezone = %s,
                    preferred_time = %s::time,
                    weekly_rest_day = %s,
                    quiet_hours_start = %s::time,
                    quiet_hours_end = %s::time,
                    updated_at = NOW()
                WHERE user_id = %s
                """,
                (
                    bool(preferences.get("enabled", False)),
                    str(preferences.get("locale", "en")),
                    str(preferences.get("timezone", "Asia/Jerusalem")),
                    str(preferences.get("preferred_time", "19:00")),
                    int(preferences.get("weekly_rest_day", 5)),
                    str(preferences.get("quiet_hours_start", "22:00")),
                    str(preferences.get("quiet_hours_end", "08:00")),
                    user_id,
                ),
            )

    def _ensure_state(self, user_id: str) -> None:
        with self._tenant_connection(user_id) as connection:
            connection.execute(
                """
                INSERT INTO learner_states(user_id, state, revision)
                VALUES(%s, '{}'::jsonb, 0)
                ON CONFLICT(user_id) DO NOTHING
                """,
                (user_id,),
            )

    def create_session(
        self,
        user_id: str,
        token: str,
        csrf_token: str,
        ttl_seconds: int,
        *,
        max_live_sessions: int | None = None,
        retention_seconds: int = 604_800,
    ) -> SessionIdentity:
        """Create a hashed, expiring server-side session."""
        expires_at = utc_now() + timedelta(seconds=ttl_seconds)
        csrf_hash = self.hash_bearer(csrf_token)
        with self._connection() as connection:
            connection.execute("DELETE FROM oauth_states WHERE expires_at <= NOW()")
            connection.execute(
                """
                DELETE FROM sessions
                WHERE expires_at <= NOW() - (%s * INTERVAL '1 second')
                   OR (
                       revoked_at IS NOT NULL
                       AND revoked_at <= NOW() - (%s * INTERVAL '1 second')
                   )
                """,
                (max(0, retention_seconds), max(0, retention_seconds)),
            )
            if max_live_sessions is not None:
                connection.execute(
                    "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
                    (user_id,),
                )
                connection.execute(
                    """
                    DELETE FROM sessions
                    WHERE token_hash IN (
                        SELECT token_hash
                        FROM sessions
                        WHERE user_id = %s
                          AND revoked_at IS NULL
                          AND expires_at > NOW()
                        ORDER BY created_at DESC, token_hash DESC
                        OFFSET %s
                    )
                    """,
                    (user_id, max(0, max_live_sessions - 1)),
                )
            row = connection.execute(
                """
                INSERT INTO sessions(token_hash, user_id, csrf_hash, expires_at)
                VALUES(%s, %s, %s, %s)
                RETURNING expires_at
                """,
                (self.hash_bearer(token), user_id, csrf_hash, expires_at),
            ).fetchone()
            user_row = connection.execute(
                "SELECT * FROM users WHERE id = %s", (user_id,)
            ).fetchone()
        if row is None or user_row is None:
            raise RuntimeError("Session creation did not return an identity")
        return SessionIdentity(self._user(user_row), csrf_hash, row["expires_at"])

    def resolve_session(self, token: str) -> SessionIdentity | None:
        """Resolve only unexpired, non-revoked sessions."""
        with self._connection() as connection:
            row = connection.execute(
                """
                SELECT u.*, s.csrf_hash, s.expires_at
                FROM sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = %s
                  AND s.revoked_at IS NULL
                  AND s.expires_at > NOW()
                """,
                (self.hash_bearer(token),),
            ).fetchone()
        if row is None:
            return None
        return SessionIdentity(self._user(row), row["csrf_hash"], row["expires_at"])

    def revoke_session(self, token: str) -> None:
        """Mark a session revoked while preserving an audit-safe timestamp."""
        with self._connection() as connection:
            connection.execute(
                "UPDATE sessions SET revoked_at = NOW() WHERE token_hash = %s",
                (self.hash_bearer(token),),
            )

    def store_oauth_state(
        self,
        state: str,
        verifier: str,
        redirect_path: str,
        ttl_seconds: int = 600,
        *,
        provider: str = "github",
        max_active_states: int | None = None,
    ) -> bool:
        """Persist a globally bounded single-use OAuth state and PKCE verifier."""
        validate_oauth_provider(provider)
        with self._connection() as connection:
            # Serialize the count-and-insert decision across every application replica.
            connection.execute(
                "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
                ("ivrit_sheli.oauth_states",),
            )
            connection.execute("DELETE FROM oauth_states WHERE expires_at <= NOW()")
            if max_active_states is not None:
                row = connection.execute(
                    "SELECT COUNT(*) AS active_states FROM oauth_states"
                ).fetchone()
                if row is not None and int(row["active_states"]) >= max_active_states:
                    return False
            connection.execute(
                """
                INSERT INTO oauth_states(
                    state_hash, provider, code_verifier, redirect_path, expires_at
                ) VALUES(%s, %s, %s, %s, %s)
                """,
                (
                    self.hash_bearer(state),
                    provider,
                    verifier,
                    redirect_path,
                    utc_now() + timedelta(seconds=ttl_seconds),
                ),
            )
            return True

    def consume_oauth_state(
        self, state: str, *, provider: str = "github"
    ) -> tuple[str, str] | None:
        """Delete one valid state only when its callback provider matches."""
        validate_oauth_provider(provider)
        with self._connection() as connection:
            row = connection.execute(
                """
                DELETE FROM oauth_states
                WHERE state_hash = %s AND provider = %s AND expires_at > NOW()
                RETURNING code_verifier, redirect_path
                """,
                (self.hash_bearer(state), provider),
            ).fetchone()
        if row is None:
            return None
        return str(row["code_verifier"]), str(row["redirect_path"])

    def read_state(self, user_id: str) -> dict[str, Any]:
        """Read one tenant state, creating the row if absent, in a single connection."""
        with self._tenant_connection(user_id) as connection:
            connection.execute(
                """
                INSERT INTO learner_states(user_id, state, revision)
                VALUES(%s, '{}'::jsonb, 0)
                ON CONFLICT(user_id) DO NOTHING
                """,
                (user_id,),
            )
            row = connection.execute(
                "SELECT state FROM learner_states WHERE user_id = %s", (user_id,)
            ).fetchone()
        return copy.deepcopy(row["state"] if row else {})

    def mutate_state(
        self,
        user_id: str,
        operation: Callable[[dict[str, Any]], tuple[dict[str, Any], StateResult]],
    ) -> StateResult:
        """Lock, mutate, and revise one tenant document atomically."""
        with self._tenant_connection(user_id) as connection:
            connection.execute(
                """
                INSERT INTO learner_states(user_id, state, revision)
                VALUES(%s, '{}'::jsonb, 0)
                ON CONFLICT(user_id) DO NOTHING
                """,
                (user_id,),
            )
            row = connection.execute(
                """
                SELECT state, revision FROM learner_states
                WHERE user_id = %s
                FOR UPDATE
                """,
                (user_id,),
            ).fetchone()
            if row is None:
                raise KeyError("Learner state is not available")
            updated, result = operation(copy.deepcopy(row["state"]))
            encoded = encode_bounded_state(updated, self.max_snapshot_bytes)
            connection.execute(
                """
                UPDATE learner_states
                SET state = %s::jsonb, revision = revision + 1, updated_at = NOW()
                WHERE user_id = %s
                """,
                (encoded, user_id),
            )
            return result
