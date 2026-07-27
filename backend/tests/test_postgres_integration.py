"""Real PostgreSQL provisioning, persistence, and least-privilege integration tests."""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit
from uuid import uuid4

import psycopg
import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from psycopg import sql
from psycopg.rows import dict_row
from sqlalchemy.exc import DBAPIError

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import (
    PUSH_WORKER_DATABASE_ROLE,
    CloudSnapshotLimitError,
    PostgresCloudStore,
)
from ivrit_sheli.db_admin import provision_postgres
from ivrit_sheli.migrations import MIGRATION_HEAD
from ivrit_sheli.push_notifications import (
    encrypt_subscription,
    endpoint_hash,
    validate_subscription,
)

BACKEND_DIR = Path(__file__).resolve().parents[1]
MIGRATION_URL = os.environ.get("MIGRATION_DATABASE_URL")
RUNTIME_URL = os.environ.get("DATABASE_URL")
HAS_POSTGRES_BOUNDARY = bool(MIGRATION_URL and RUNTIME_URL)
pytestmark = pytest.mark.postgres


def _database_url_for_role(database_url: str, role: str, password: str) -> str:
    """Replace credentials without changing the integration database boundary."""
    parsed = urlsplit(database_url.replace("postgres://", "postgresql://", 1))
    hostname = parsed.hostname or ""
    rendered_host = f"[{hostname}]" if ":" in hostname else hostname
    rendered_port = f":{parsed.port}" if parsed.port is not None else ""
    netloc = (
        f"{quote(role, safe='')}:{quote(password, safe='')}@"
        f"{rendered_host}{rendered_port}"
    )
    return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, ""))


def test_migration_graph_has_one_v29_head() -> None:
    """The migration graph must remain linear and independently inspectable."""
    configuration = Config(str(BACKEND_DIR / "alembic.ini"))
    scripts = ScriptDirectory.from_config(configuration)
    assert scripts.get_heads() == [MIGRATION_HEAD]
    google_migration = (
        BACKEND_DIR
        / "migrations"
        / "versions"
        / "20260718_0002_google_identity_and_oauth_provider.py"
    ).read_text(encoding="utf-8")
    assert "RAISE EXCEPTION" in google_migration
    assert "DELETE FROM users WHERE provider = 'google'" not in google_migration
    push_migration = (
        BACKEND_DIR
        / "migrations"
        / "versions"
        / "20260727_0003_private_push_subscriptions.py"
    ).read_text(encoding="utf-8")
    assert "subscription_ciphertext TEXT NOT NULL" in push_migration
    assert "endpoint_hash CHAR(64) NOT NULL" in push_migration
    assert "ENABLE ROW LEVEL SECURITY" in push_migration
    assert "FORCE ROW LEVEL SECURITY" in push_migration
    assert "CREATE POLICY push_subscription_owner_policy" in push_migration
    assert "CREATE POLICY push_subscription_worker_policy" in push_migration
    assert "CREATE TABLE push_delivery_state" in push_migration
    assert "CREATE POLICY push_delivery_worker_policy" in push_migration
    assert "ivrit_sheli_push_worker" in push_migration
    assert "ON DELETE CASCADE" in push_migration
    assert (
        "GRANT SELECT, INSERT, UPDATE, DELETE\n"
        "            ON TABLE push_subscriptions TO ivrit_sheli_runtime"
        in push_migration
    )
    assert (
        "GRANT SELECT, INSERT\n"
        "            ON TABLE push_delivery_state TO ivrit_sheli_runtime"
        in push_migration
    )
    assert (
        "ON TABLE push_subscriptions, push_delivery_state TO ivrit_sheli_runtime"
        not in push_migration
    )
    ownership_migration = (
        BACKEND_DIR
        / "migrations"
        / "versions"
        / "20260727_0004_push_endpoint_ownership.py"
    ).read_text(encoding="utf-8")
    assert "UNIQUE(endpoint_hash)" in ownership_migration
    assert "push_subscription_endpoint_transfer_policy" in ownership_migration
    assert "REVOKE UPDATE, DELETE" in ownership_migration
    safe_transfer_migration = (
        BACKEND_DIR
        / "migrations"
        / "versions"
        / "20260727_0005_safe_push_endpoint_transfer.py"
    ).read_text(encoding="utf-8")
    assert "SECURITY DEFINER" in safe_transfer_migration
    assert "ivrit_sheli_push_transfer" in safe_transfer_migration
    assert "Push subscription tenant mismatch" in safe_transfer_migration
    assert "Push subscription endpoint mismatch" in safe_transfer_migration
    assert "FROM PUBLIC" in safe_transfer_migration


def test_runtime_store_rejects_an_administrator_url_before_connecting() -> None:
    with pytest.raises(ValueError, match="authenticate directly as ivrit_sheli_runtime"):
        PostgresCloudStore(
            "postgresql://database_owner:password@postgres/ivrit_sheli",
            "test-only-session-secret-at-least-32-characters",
        )


@pytest.mark.skipif(
    not HAS_POSTGRES_BOUNDARY,
    reason="requires MIGRATION_DATABASE_URL and restricted DATABASE_URL",
)
def test_real_postgres_idempotent_provisioning_least_privilege_and_rls() -> None:
    """Exercise two-DSN provisioning, auth state, cleanup, and SQL-level denial."""
    assert MIGRATION_URL is not None
    assert RUNTIME_URL is not None
    nonce = uuid4().hex
    escalation_role = f"ivrit_sheli_escalation_{nonce}"
    push_password = f"integration-push-{nonce}"
    push_url = _database_url_for_role(
        MIGRATION_URL,
        PUSH_WORKER_DATABASE_ROLE,
        push_password,
    )
    normalized_admin_url = MIGRATION_URL.replace("postgres://", "postgresql://", 1)
    normalized_runtime_url = RUNTIME_URL.replace("postgres://", "postgresql://", 1)
    normalized_push_url = push_url.replace("postgres://", "postgresql://", 1)

    provision_postgres(MIGRATION_URL, RUNTIME_URL, BACKEND_DIR, push_url)

    # Simulate a stale or manually granted membership. NOINHERIT alone still permits
    # SET ROLE, so the second provisioning pass must remove this escalation path.
    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        connection.execute(
            sql.SQL("CREATE ROLE {} NOLOGIN CREATEDB").format(
                sql.Identifier(escalation_role)
            )
        )
        connection.execute(
            sql.SQL("GRANT {} TO ivrit_sheli_runtime").format(
                sql.Identifier(escalation_role)
            )
        )
        connection.execute(
            sql.SQL("GRANT {} TO {}").format(
                sql.Identifier(escalation_role),
                sql.Identifier(PUSH_WORKER_DATABASE_ROLE),
            )
        )
    with psycopg.connect(normalized_runtime_url, row_factory=dict_row) as connection:
        connection.execute(
            sql.SQL("SET ROLE {}").format(sql.Identifier(escalation_role))
        )
        assert connection.execute("SELECT CURRENT_USER AS current_user").fetchone() == {
            "current_user": escalation_role
        }
    with psycopg.connect(normalized_push_url, row_factory=dict_row) as connection:
        connection.execute(
            sql.SQL("SET ROLE {}").format(sql.Identifier(escalation_role))
        )
        assert connection.execute("SELECT CURRENT_USER AS current_user").fetchone() == {
            "current_user": escalation_role
        }

    provision_postgres(MIGRATION_URL, RUNTIME_URL, BACKEND_DIR, push_url)

    store = PostgresCloudStore(
        RUNTIME_URL,
        os.environ["SESSION_SECRET"],
    )
    assert store.ready() is True
    alpha = store.upsert_github_user(
        {"id": f"alpha-{nonce}", "login": f"alpha-{nonce}", "name": "Alpha"}
    )
    beta = store.upsert_github_user(
        {"id": f"beta-{nonce}", "login": f"beta-{nonce}", "name": "Beta"}
    )
    google = store.upsert_google_user(
        {
            "id": f"google-{nonce}",
            "name": "Google Learner",
            "avatar_url": "https://lh3.googleusercontent.com/a/test",
        }
    )
    assert google.provider == "google"
    assert google.login is None
    alpha_repository = CloudLearningRepository(store, alpha.id, alpha.display_name)
    beta_repository = CloudLearningRepository(store, beta.id, beta.display_name)
    item = alpha_repository.create_item({"hebrew_text": "מידע מבודד"})
    assert alpha_repository.get_item(item["id"])["hebrew_text"] == "מידע מבודד"
    with pytest.raises(KeyError):
        beta_repository.get_item(item["id"])

    before_limited_save = store.read_state(alpha.id)
    store.configure_security(store.session_secret, 1)
    with pytest.raises(CloudSnapshotLimitError):
        alpha_repository.create_item({"hebrew_text": "שמירה גדולה מדי"})
    assert store.read_state(alpha.id) == before_limited_save
    store.configure_security(store.session_secret, 4_194_304)

    google_repository = CloudLearningRepository(store, google.id, google.display_name)
    google_repository.create_item({"hebrew_text": "מידע למחיקה"})
    push_secret = f"push-encryption-{nonce}-at-least-32-characters"
    alpha_endpoint = f"https://fcm.googleapis.com/fcm/send/alpha/{nonce}"
    beta_endpoint = f"https://fcm.googleapis.com/fcm/send/beta/{nonce}"
    google_endpoint = f"https://fcm.googleapis.com/fcm/send/google/{nonce}"
    transfer_endpoint = f"https://fcm.googleapis.com/fcm/send/transfer/{nonce}"

    def store_push(user_id: str, endpoint: str) -> str:
        subscription = validate_subscription(
            {
                "endpoint": endpoint,
                "keys": {"p256dh": f"p256dh-{nonce}", "auth": f"auth-{nonce}"},
            }
        )
        hashed_endpoint = endpoint_hash(endpoint, push_secret)
        store.upsert_push_subscription(
            user_id,
            hashed_endpoint,
            encrypt_subscription(subscription, push_secret),
            {
                "enabled": True,
                "locale": "es",
                "timezone": "Asia/Jerusalem",
                "preferred_time": "19:00",
                "weekly_rest_day": 5,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
            },
            None,
        )
        return hashed_endpoint

    alpha_endpoint_hash = store_push(alpha.id, alpha_endpoint)
    beta_endpoint_hash = store_push(beta.id, beta_endpoint)
    store_push(google.id, google_endpoint)
    transfer_endpoint_hash = store_push(alpha.id, transfer_endpoint)
    assert store_push(beta.id, transfer_endpoint) == transfer_endpoint_hash
    assert store.delete_push_subscription(alpha.id, beta_endpoint_hash) is False
    assert store.delete_push_subscription(alpha.id, transfer_endpoint_hash) is False

    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        push_rows = connection.execute(
            """
            SELECT user_id::text, endpoint_hash, subscription_ciphertext
            FROM push_subscriptions
            WHERE user_id IN (%s, %s, %s)
            ORDER BY user_id
            """,
            (alpha.id, beta.id, google.id),
        ).fetchall()
    assert len(push_rows) == 4
    serialized_push_rows = str(push_rows)
    assert alpha_endpoint not in serialized_push_rows
    assert beta_endpoint not in serialized_push_rows
    assert google_endpoint not in serialized_push_rows
    assert transfer_endpoint not in serialized_push_rows
    assert f"p256dh-{nonce}" not in serialized_push_rows
    assert f"auth-{nonce}" not in serialized_push_rows
    assert any(
        row["endpoint_hash"] == alpha_endpoint_hash
        for row in push_rows
        if row["user_id"] == alpha.id
    )
    assert sum(
        row["endpoint_hash"] == transfer_endpoint_hash
        for row in push_rows
    ) == 1
    assert any(
        row["endpoint_hash"] == transfer_endpoint_hash
        for row in push_rows
        if row["user_id"] == beta.id
    )

    google_token = f"google-session-{nonce}"
    store.create_session(google.id, google_token, f"google-csrf-{nonce}", 300)
    assert store.resolve_session(google_token) is not None

    # Downgrading must never silently delete a Google learner or their private state.
    configuration = Config(str(BACKEND_DIR / "alembic.ini"))
    with pytest.raises(
        DBAPIError,
        match="Cannot downgrade while Google learner accounts exist",
    ):
        command.downgrade(configuration, "20260716_0001")
    assert store.ready() is True
    assert google_repository.list_items()[0]["hebrew_text"] == "מידע למחיקה"

    store.delete_user(google.id)
    assert store.resolve_session(google_token) is None
    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        deleted_counts = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM users WHERE id = %s) AS users,
                (SELECT COUNT(*) FROM sessions WHERE user_id = %s) AS sessions,
                (SELECT COUNT(*) FROM learner_states WHERE user_id = %s) AS learner_states,
                (SELECT COUNT(*) FROM push_subscriptions WHERE user_id = %s)
                    AS push_subscriptions,
                (SELECT COUNT(*) FROM push_delivery_state WHERE user_id = %s)
                    AS push_delivery_state
            """,
            (google.id, google.id, google.id, google.id, google.id),
        ).fetchone()
    assert deleted_counts == {
        "users": 0,
        "sessions": 0,
        "learner_states": 0,
        "push_subscriptions": 0,
        "push_delivery_state": 0,
    }

    token = f"session-{nonce}"
    csrf = f"csrf-{nonce}"
    store.create_session(alpha.id, token, csrf, 300)
    identity = store.resolve_session(token)
    assert identity is not None
    assert identity.user.id == alpha.id

    bounded_tokens = [f"bounded-{index}-{nonce}" for index in range(3)]
    for bounded_token in bounded_tokens:
        store.create_session(
            alpha.id,
            bounded_token,
            f"csrf-{bounded_token}",
            300,
            max_live_sessions=2,
            retention_seconds=0,
        )
    assert store.resolve_session(bounded_tokens[-1]) is not None
    assert sum(
        store.resolve_session(candidate) is not None
        for candidate in (token, *bounded_tokens)
    ) == 2

    expired_token = f"expired-{nonce}"
    revoked_token = f"revoked-{nonce}"
    store.create_session(alpha.id, expired_token, "expired-csrf", -1, retention_seconds=0)
    store.create_session(alpha.id, revoked_token, "revoked-csrf", 300, retention_seconds=0)
    store.revoke_session(revoked_token)
    store.store_oauth_state(f"expired-state-{nonce}", "verifier", "/", ttl_seconds=-1)
    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        active_before = int(
            connection.execute(
                "SELECT COUNT(*) AS count FROM oauth_states WHERE expires_at > NOW()"
            ).fetchone()["count"]
        )
    bounded_state = f"bounded-state-{nonce}"
    blocked_state = f"blocked-state-{nonce}"
    assert store.store_oauth_state(
        bounded_state,
        "bounded-verifier",
        "/bounded",
        provider="google",
        max_active_states=active_before + 1,
    )
    assert not store.store_oauth_state(
        blocked_state,
        "blocked-verifier",
        "/blocked",
        max_active_states=active_before + 1,
    )
    assert store.consume_oauth_state(bounded_state, provider="github") is None
    assert store.consume_oauth_state(bounded_state, provider="google") == (
        "bounded-verifier",
        "/bounded",
    )
    assert store.store_oauth_state(
        blocked_state,
        "replacement-verifier",
        "/replacement",
        max_active_states=active_before + 1,
    )
    assert store.consume_oauth_state(blocked_state) == (
        "replacement-verifier",
        "/replacement",
    )
    live_state = f"live-state-{nonce}"
    store.store_oauth_state(live_state, "live-verifier", "/next", ttl_seconds=300)
    store.create_session(
        alpha.id,
        f"cleanup-{nonce}",
        "cleanup-csrf",
        300,
        retention_seconds=0,
    )
    assert store.consume_oauth_state(live_state) == ("live-verifier", "/next")

    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        stale = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM sessions WHERE token_hash IN (%s, %s)) AS sessions,
                (SELECT COUNT(*) FROM oauth_states WHERE state_hash = %s) AS oauth_states
            """,
            (
                store.hash_bearer(expired_token),
                store.hash_bearer(revoked_token),
                store.hash_bearer(f"expired-state-{nonce}"),
            ),
        ).fetchone()
        assert stale == {"sessions": 0, "oauth_states": 0}

    with psycopg.connect(normalized_runtime_url, row_factory=dict_row) as connection:
        role = connection.execute(
            """
            SELECT
                SESSION_USER AS session_user,
                CURRENT_USER AS current_user,
                rolcanlogin,
                rolsuper,
                rolcreatedb,
                rolcreaterole,
                rolinherit,
                rolreplication,
                rolbypassrls,
                (SELECT COUNT(*) FROM pg_auth_members WHERE member = pg_roles.oid)
                    AS role_membership_count
            FROM pg_roles
            WHERE rolname = SESSION_USER
            """
        ).fetchone()
        assert role == {
            "session_user": "ivrit_sheli_runtime",
            "current_user": "ivrit_sheli_runtime",
            "rolcanlogin": True,
            "rolsuper": False,
            "rolcreatedb": False,
            "rolcreaterole": False,
            "rolinherit": False,
            "rolreplication": False,
            "rolbypassrls": False,
            "role_membership_count": 0,
        }

        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(
                sql.SQL("SET ROLE {}").format(sql.Identifier(escalation_role))
            )
        connection.rollback()

        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(f"CREATE TABLE forbidden_{nonce} (value INTEGER)")
        connection.rollback()

        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(f"CREATE ROLE forbidden_{nonce}")
        connection.rollback()

        connection.execute("SELECT set_config('app.user_id', %s, true)", (alpha.id,))
        hidden = connection.execute(
            "SELECT state FROM learner_states WHERE user_id = %s", (beta.id,)
        ).fetchone()
        assert hidden is None
        visible_push = connection.execute(
            """
            SELECT endpoint_hash
            FROM push_subscriptions
            WHERE user_id = %s AND endpoint_hash = %s
            """,
            (alpha.id, alpha_endpoint_hash),
        ).fetchone()
        assert visible_push == {"endpoint_hash": alpha_endpoint_hash}
        hidden_push = connection.execute(
            """
            SELECT endpoint_hash
            FROM push_subscriptions
            WHERE user_id = %s AND endpoint_hash = %s
            """,
            (beta.id, beta_endpoint_hash),
        ).fetchone()
        assert hidden_push is None
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(
                "UPDATE learner_states SET user_id = %s WHERE user_id = %s",
                (beta.id, alpha.id),
            )
        connection.rollback()
        assert connection.execute("SELECT 1 AS value").fetchone() == {"value": 1}

    with psycopg.connect(normalized_push_url, row_factory=dict_row) as connection:
        push_role = connection.execute(
            """
            SELECT
                SESSION_USER AS session_user,
                CURRENT_USER AS current_user,
                rolcanlogin,
                rolsuper,
                rolcreatedb,
                rolcreaterole,
                rolinherit,
                rolreplication,
                rolbypassrls,
                (SELECT COUNT(*) FROM pg_auth_members WHERE member = pg_roles.oid)
                    AS role_membership_count,
                has_table_privilege(
                    CURRENT_USER, 'push_subscriptions', 'SELECT'
                ) AS can_select_push,
                has_table_privilege(
                    CURRENT_USER, 'push_subscriptions', 'UPDATE'
                ) AS can_update_push,
                has_table_privilege(
                    CURRENT_USER, 'push_subscriptions', 'INSERT'
                ) AS can_insert_push,
                has_table_privilege(
                    CURRENT_USER, 'push_subscriptions', 'DELETE'
                ) AS can_delete_push,
                has_table_privilege(
                    CURRENT_USER, 'push_delivery_state', 'SELECT'
                ) AS can_select_claims,
                has_table_privilege(
                    CURRENT_USER, 'push_delivery_state', 'INSERT'
                ) AS can_insert_claims,
                has_table_privilege(
                    CURRENT_USER, 'push_delivery_state', 'UPDATE'
                ) AS can_update_claims,
                has_table_privilege(
                    CURRENT_USER, 'push_delivery_state', 'DELETE'
                ) AS can_delete_claims,
                has_table_privilege(CURRENT_USER, 'users', 'SELECT')
                    AS can_read_users,
                has_table_privilege(CURRENT_USER, 'learner_states', 'SELECT')
                    AS can_read_learner_states
            FROM pg_roles
            WHERE rolname = SESSION_USER
            """
        ).fetchone()
        assert push_role == {
            "session_user": PUSH_WORKER_DATABASE_ROLE,
            "current_user": PUSH_WORKER_DATABASE_ROLE,
            "rolcanlogin": True,
            "rolsuper": False,
            "rolcreatedb": False,
            "rolcreaterole": False,
            "rolinherit": False,
            "rolreplication": False,
            "rolbypassrls": False,
            "role_membership_count": 0,
            "can_select_push": True,
            "can_update_push": True,
            "can_insert_push": False,
            "can_delete_push": False,
            "can_select_claims": True,
            "can_insert_claims": True,
            "can_update_claims": True,
            "can_delete_claims": False,
            "can_read_users": False,
            "can_read_learner_states": False,
        }
        worker_rows = connection.execute(
            """
            SELECT id, subscription_ciphertext
            FROM push_subscriptions
            WHERE user_id IN (%s, %s)
            ORDER BY user_id
            """,
            (alpha.id, beta.id),
        ).fetchall()
        # Alpha retains its first endpoint, Beta retains its first endpoint and
        # owns the transferred browser endpoint: three rows, with no duplicate.
        assert len(worker_rows) == 3
        assert alpha_endpoint not in str(worker_rows)
        assert beta_endpoint not in str(worker_rows)
        assert transfer_endpoint not in str(worker_rows)
        connection.execute(
            """
            UPDATE push_subscriptions
            SET failure_count = failure_count
            WHERE id = %s
            """,
            (worker_rows[0]["id"],),
        )
        assert connection.execute(
            "SELECT COUNT(*) AS count FROM push_delivery_state"
        ).fetchone()["count"] >= 2

        first_claim = str(uuid4())
        claimed = connection.execute(
            """
            UPDATE push_delivery_state
            SET claim_token = %s::uuid,
                claim_expires_at = NOW() + INTERVAL '5 minutes'
            WHERE user_id = %s
              AND (claim_expires_at IS NULL OR claim_expires_at <= NOW())
            RETURNING user_id::text
            """,
            (first_claim, alpha.id),
        ).fetchone()
        assert claimed == {"user_id": alpha.id}
        connection.commit()
        with psycopg.connect(normalized_push_url, row_factory=dict_row) as contender:
            blocked = contender.execute(
                """
                UPDATE push_delivery_state
                SET claim_token = %s::uuid,
                    claim_expires_at = NOW() + INTERVAL '5 minutes'
                WHERE user_id = %s
                  AND (claim_expires_at IS NULL OR claim_expires_at <= NOW())
                RETURNING user_id::text
                """,
                (str(uuid4()), alpha.id),
            ).fetchone()
            assert blocked is None
        connection.execute(
            """
            UPDATE push_delivery_state
            SET claim_token = NULL, claim_expires_at = NULL
            WHERE user_id = %s AND claim_token = %s::uuid
            """,
            (alpha.id, first_claim),
        )
        connection.commit()

        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute("SELECT id FROM users LIMIT 1")
        connection.rollback()
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute("SELECT user_id FROM learner_states LIMIT 1")
        connection.rollback()
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(
                """
                DELETE FROM push_subscriptions
                WHERE id = %s
                """,
                (worker_rows[0]["id"],),
            )
        connection.rollback()
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(
                sql.SQL("SET ROLE {}").format(sql.Identifier(escalation_role))
            )
        connection.rollback()
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(f"CREATE TABLE forbidden_push_{nonce} (value INTEGER)")
        connection.rollback()
        assert connection.execute("SELECT 1 AS value").fetchone() == {"value": 1}

    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        connection.execute("UPDATE alembic_version SET version_num = 'stale-test-head'")
    assert store.ready() is False
    with psycopg.connect(normalized_admin_url, row_factory=dict_row) as connection:
        connection.execute(
            "UPDATE alembic_version SET version_num = %s", (MIGRATION_HEAD,)
        )
        connection.execute(
            sql.SQL("DROP ROLE {}").format(sql.Identifier(escalation_role))
        )
    assert store.ready() is True

    store.close()
