"""Provision the least-privilege PostgreSQL runtime identity and migrate its schema.

This module is intentionally separate from application startup. It is run once by the
Compose migration service or Railway pre-deploy container with an administrator DSN. The
FastAPI process receives only the restricted runtime DSN after its entrypoint removes the
administrator variable from the process environment.
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict
from psycopg.rows import dict_row

from ivrit_sheli.cloud_store import RUNTIME_DATABASE_ROLE
from ivrit_sheli.migrations import MIGRATION_HEAD, upgrade_postgres
from ivrit_sheli.structured_logging import scrub_string

MIGRATION_LOCK_NAME = "ivrit-sheli-schema-provision-v2"


@dataclass(frozen=True, slots=True)
class DatabaseTarget:
    """Non-secret connection identity used to detect cross-wired DSNs."""

    host: str
    port: str
    database: str
    user: str
    password: str


def parse_database_target(database_url: str, *, variable_name: str) -> DatabaseTarget:
    """Parse one PostgreSQL URL without ever returning it in an error message."""
    if not database_url.startswith(("postgresql://", "postgres://")):
        raise ValueError(f"{variable_name} must be a PostgreSQL connection URL")
    try:
        values = conninfo_to_dict(database_url)
    except psycopg.Error as error:
        raise ValueError(f"{variable_name} is not a valid PostgreSQL connection URL") from error

    def text_value(name: str, default: str = "") -> str:
        raw = values.get(name, default)
        return "" if raw is None else str(raw)

    host = text_value("host").strip().casefold()
    port = text_value("port", "5432").strip() or "5432"
    database = text_value("dbname").strip()
    user = text_value("user").strip()
    password = text_value("password")
    if not host or not database or not user or not password:
        raise ValueError(
            f"{variable_name} must include host, database, user, and password"
        )
    return DatabaseTarget(host, port, database, user, password)


def validate_database_boundary(
    migration_database_url: str,
    runtime_database_url: str,
) -> tuple[DatabaseTarget, DatabaseTarget]:
    """Require distinct administrator/runtime identities on the same database."""
    migration = parse_database_target(
        migration_database_url, variable_name="MIGRATION_DATABASE_URL"
    )
    runtime = parse_database_target(runtime_database_url, variable_name="DATABASE_URL")
    if (migration.host, migration.port, migration.database) != (
        runtime.host,
        runtime.port,
        runtime.database,
    ):
        raise ValueError(
            "MIGRATION_DATABASE_URL and DATABASE_URL must target the same host, port, and database"
        )
    if runtime.user != RUNTIME_DATABASE_ROLE:
        raise ValueError(
            f"DATABASE_URL must authenticate directly as {RUNTIME_DATABASE_ROLE}"
        )
    if migration.user == runtime.user:
        raise ValueError("Migration and runtime database users must be different")
    return migration, runtime


def _migration_identity(connection: Any) -> dict[str, Any]:
    row = connection.execute(
        """
        SELECT rolname, rolsuper, rolcreaterole
        FROM pg_roles
        WHERE rolname = CURRENT_USER
        """
    ).fetchone()
    if row is None:
        raise RuntimeError("PostgreSQL did not expose the migration role")
    if not row["rolsuper"] and not row["rolcreaterole"]:
        raise RuntimeError(
            "The migration database user requires CREATEROLE for runtime-role provisioning"
        )
    if row["rolname"] == RUNTIME_DATABASE_ROLE:
        raise RuntimeError("The migration database user cannot be the runtime role")
    return dict(row)


def _membership_exists(connection: Any, *, member: str) -> bool:
    row = connection.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM pg_auth_members membership
            JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
            JOIN pg_roles member_role ON member_role.oid = membership.member
            WHERE granted_role.rolname = %s AND member_role.rolname = %s
        ) AS present
        """,
        (RUNTIME_DATABASE_ROLE, member),
    ).fetchone()
    return bool(row and row["present"])


def _roles_granted_to_member(connection: Any, *, member: str) -> list[str]:
    rows = connection.execute(
        """
        SELECT granted_role.rolname
        FROM pg_auth_members membership
        JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
        JOIN pg_roles member_role ON member_role.oid = membership.member
        WHERE member_role.rolname = %s
        ORDER BY granted_role.rolname
        """,
        (member,),
    ).fetchall()
    return [str(row["rolname"]) for row in rows]


def _harden_runtime_role(connection: Any, *, migration_user: str, password: str) -> None:
    role_exists = connection.execute(
        "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = %s) AS present",
        (RUNTIME_DATABASE_ROLE,),
    ).fetchone()
    if not role_exists or not role_exists["present"]:
        connection.execute(
            sql.SQL(
                "CREATE ROLE {} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
                "NOINHERIT NOREPLICATION NOBYPASSRLS"
            ).format(sql.Identifier(RUNTIME_DATABASE_ROLE))
        )

    # Generate a SCRAM verifier client-side. PostgreSQL receives no reusable plaintext
    # password even if DDL statement logging is enabled.
    verifier = connection.pgconn.encrypt_password(
        password.encode("utf-8"),
        RUNTIME_DATABASE_ROLE.encode("utf-8"),
        b"scram-sha-256",
    ).decode("utf-8")
    connection.execute(
        sql.SQL(
            "ALTER ROLE {} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
            "NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD {}"
        ).format(
            sql.Identifier(RUNTIME_DATABASE_ROLE),
            sql.Literal(verifier),
        )
    )

    if _membership_exists(connection, member=migration_user):
        connection.execute(
            sql.SQL("REVOKE {} FROM {}").format(
                sql.Identifier(RUNTIME_DATABASE_ROLE),
                sql.Identifier(migration_user),
            )
        )

    # NOINHERIT does not prevent SET ROLE. Remove every direct membership so a
    # pre-existing runtime login cannot switch into a more privileged role.
    for granted_role in _roles_granted_to_member(
        connection, member=RUNTIME_DATABASE_ROLE
    ):
        connection.execute(
            sql.SQL("REVOKE {} FROM {}").format(
                sql.Identifier(granted_role),
                sql.Identifier(RUNTIME_DATABASE_ROLE),
            )
        )

    # These statements are intentionally repeated after Alembic. They repair databases
    # used while 2.0 was being developed, where revision 0001 may already be recorded.
    connection.execute("REVOKE CREATE ON SCHEMA public FROM PUBLIC")
    connection.execute(
        "REVOKE ALL ON TABLE alembic_version, users, sessions, oauth_states, learner_states "
        "FROM PUBLIC"
    )
    connection.execute(
        sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(
            sql.Identifier(RUNTIME_DATABASE_ROLE)
        )
    )
    connection.execute(
        sql.SQL("GRANT SELECT ON TABLE alembic_version TO {}").format(
            sql.Identifier(RUNTIME_DATABASE_ROLE)
        )
    )
    connection.execute(
        sql.SQL(
            "GRANT SELECT, INSERT, UPDATE, DELETE "
            "ON TABLE users, sessions, oauth_states, learner_states TO {}"
        ).format(sql.Identifier(RUNTIME_DATABASE_ROLE))
    )


def _verify_runtime_connection(runtime_database_url: str) -> None:
    with psycopg.connect(
        runtime_database_url,
        row_factory=dict_row,
        connect_timeout=8,
    ) as connection:
        row = connection.execute(
            """
            SELECT
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
                (SELECT version_num FROM alembic_version LIMIT 1)
                    AS migration_revision,
                has_schema_privilege(CURRENT_USER, 'public', 'CREATE')
                    AS can_create_in_public
            FROM pg_roles r
            WHERE r.rolname = SESSION_USER
            """
        ).fetchone()
    expected = bool(
        row
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
        and row["migration_revision"] == MIGRATION_HEAD
        and not row["can_create_in_public"]
    )
    if not expected:
        raise RuntimeError("Restricted PostgreSQL runtime identity verification failed")


def provision_postgres(
    migration_database_url: str,
    runtime_database_url: str,
    backend_dir: Path,
) -> None:
    """Migrate one database and provision its direct restricted login idempotently."""
    migration, runtime = validate_database_boundary(
        migration_database_url, runtime_database_url
    )
    normalized_migration_url = migration_database_url.replace(
        "postgres://", "postgresql://", 1
    )
    normalized_runtime_url = runtime_database_url.replace(
        "postgres://", "postgresql://", 1
    )
    with psycopg.connect(
        normalized_migration_url,
        row_factory=dict_row,
        connect_timeout=8,
    ) as connection:
        identity = _migration_identity(connection)
        connection.execute("SET statement_timeout = '120s'")
        connection.execute(
            "SELECT pg_advisory_lock(hashtextextended(%s, 0))",
            (MIGRATION_LOCK_NAME,),
        )
        try:
            upgrade_postgres(normalized_migration_url, backend_dir)
            _harden_runtime_role(
                connection,
                migration_user=str(identity["rolname"]),
                password=runtime.password,
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        connection.execute(
            "SELECT pg_advisory_unlock(hashtextextended(%s, 0))",
            (MIGRATION_LOCK_NAME,),
        )
        connection.commit()
    _verify_runtime_connection(normalized_runtime_url)


def main(arguments: list[str] | None = None) -> int:
    """Run the explicit migration/provision command without exposing credentials."""
    selected = list(sys.argv[1:] if arguments is None else arguments)
    if selected != ["migrate"]:
        print("Usage: python -m ivrit_sheli.db_admin migrate", file=sys.stderr)
        return 2
    try:
        migration_database_url = os.environ["MIGRATION_DATABASE_URL"]
        runtime_database_url = os.environ["DATABASE_URL"]
        provision_postgres(
            migration_database_url,
            runtime_database_url,
            Path(__file__).resolve().parents[2],
        )
    except KeyError as error:
        missing = str(error).strip("'")
        message = f"{missing} is required for PostgreSQL provisioning"
        print(json.dumps({"event": "database.provision.failed", "error": message}), file=sys.stderr)
        return 1
    except Exception as error:
        print(
            json.dumps(
                {
                    "event": "database.provision.failed",
                    "error": scrub_string(str(error)),
                }
            ),
            file=sys.stderr,
        )
        return 1
    print(json.dumps({"event": "database.provision.ready", "role": RUNTIME_DATABASE_ROLE}))
    return 0


if __name__ == "__main__":  # pragma: no cover - exercised by container smoke tests
    raise SystemExit(main())
