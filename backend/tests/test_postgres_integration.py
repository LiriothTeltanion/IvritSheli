"""Real PostgreSQL provisioning, persistence, and least-privilege integration tests."""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

import psycopg
import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from psycopg import sql
from psycopg.rows import dict_row

from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import CloudSnapshotLimitError, PostgresCloudStore
from ivrit_sheli.db_admin import provision_postgres
from ivrit_sheli.migrations import MIGRATION_HEAD

BACKEND_DIR = Path(__file__).resolve().parents[1]
MIGRATION_URL = os.environ.get("MIGRATION_DATABASE_URL")
RUNTIME_URL = os.environ.get("DATABASE_URL")
HAS_POSTGRES_BOUNDARY = bool(MIGRATION_URL and RUNTIME_URL)
pytestmark = pytest.mark.postgres


def test_migration_graph_has_one_v2_head() -> None:
    """The migration graph must remain linear and independently inspectable."""
    configuration = Config(str(BACKEND_DIR / "alembic.ini"))
    scripts = ScriptDirectory.from_config(configuration)
    assert scripts.get_heads() == ["20260716_0001"]


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
    normalized_admin_url = MIGRATION_URL.replace("postgres://", "postgresql://", 1)
    normalized_runtime_url = RUNTIME_URL.replace("postgres://", "postgresql://", 1)

    provision_postgres(MIGRATION_URL, RUNTIME_URL, BACKEND_DIR)

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
    with psycopg.connect(normalized_runtime_url, row_factory=dict_row) as connection:
        connection.execute(
            sql.SQL("SET ROLE {}").format(sql.Identifier(escalation_role))
        )
        assert connection.execute("SELECT CURRENT_USER AS current_user").fetchone() == {
            "current_user": escalation_role
        }

    provision_postgres(MIGRATION_URL, RUNTIME_URL, BACKEND_DIR)

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
        max_active_states=active_before + 1,
    )
    assert not store.store_oauth_state(
        blocked_state,
        "blocked-verifier",
        "/blocked",
        max_active_states=active_before + 1,
    )
    assert store.consume_oauth_state(bounded_state) == (
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
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            connection.execute(
                "UPDATE learner_states SET user_id = %s WHERE user_id = %s",
                (beta.id, alpha.id),
            )
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
