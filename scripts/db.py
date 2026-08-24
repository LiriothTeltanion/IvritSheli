"""Read the learner database as the restricted runtime role.

Why this exists: every database question during a session was being answered by
writing a fresh throwaway script. That is slow, and worse, each one re-derived
the connection details and the tenant handling, so they drifted.

This authenticates as `ivrit_sheli_runtime` exactly as the application does, so
what it shows is what the application can see — not what an administrator can.
Row-level security applies. That is the point: an inspection tool that bypassed
RLS would answer a different question than the one being asked.

Usage:
    python scripts/db.py "SELECT count(*) FROM users"
    python scripts/db.py --tenant <uuid> "SELECT * FROM learner_states"
    python scripts/db.py --check          # the readiness conditions, one per line

Author: Kevin "Lirioth" Cusnir
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent


def runtime_url() -> str:
    """Read DATABASE_URL from .env without importing the application settings."""
    env = ROOT / ".env"
    if not env.exists():
        raise SystemExit("No .env. Nothing to connect to.")
    for line in io.open(env, encoding="utf-8"):
        if line.strip().startswith("DATABASE_URL"):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("DATABASE_URL is not set in .env; the app is in local SQLite mode.")


def run(query: str, tenant: str | None) -> list[dict[str, Any]]:
    import psycopg
    from psycopg.rows import dict_row

    with psycopg.connect(runtime_url(), connect_timeout=15, row_factory=dict_row) as conn:
        with conn.transaction():
            if tenant:
                # Transaction-scoped, exactly as the application sets it, so the
                # setting cannot leak into a later query on a pooled connection.
                conn.execute("SELECT set_config('app.user_id', %s, true)", (tenant,))
            cursor = conn.execute(query)
            return cursor.fetchall() if cursor.description else []


READINESS = """
SELECT (SELECT version_num FROM alembic_version LIMIT 1) AS migration_revision,
       SESSION_USER AS session_user, CURRENT_USER AS current_user,
       r.rolcanlogin, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
       r.rolinherit, r.rolreplication, r.rolbypassrls,
       (SELECT COUNT(*) FROM pg_auth_members WHERE member = r.oid) AS memberships,
       has_schema_privilege(CURRENT_USER, 'public', 'CREATE') AS can_create_in_public
FROM pg_roles r WHERE r.rolname = SESSION_USER
"""


def check() -> int:
    """Print each condition PostgresCloudStore.ready() enforces, pass or fail."""
    sys.path.insert(0, str(ROOT / "backend" / "src"))
    from ivrit_sheli.cloud_store import RUNTIME_DATABASE_ROLE
    from ivrit_sheli.migrations import MIGRATION_HEAD

    row = run(READINESS, None)[0]
    conditions = [
        ("migration at head", row["migration_revision"] == MIGRATION_HEAD, row["migration_revision"]),
        ("session_user is the runtime role", row["session_user"] == RUNTIME_DATABASE_ROLE, row["session_user"]),
        ("current_user is the runtime role", row["current_user"] == RUNTIME_DATABASE_ROLE, row["current_user"]),
        ("can log in", bool(row["rolcanlogin"]), row["rolcanlogin"]),
        ("NOT superuser", not row["rolsuper"], row["rolsuper"]),
        ("NOT createdb", not row["rolcreatedb"], row["rolcreatedb"]),
        ("NOT createrole", not row["rolcreaterole"], row["rolcreaterole"]),
        ("NOT inherit", not row["rolinherit"], row["rolinherit"]),
        ("NOT replication", not row["rolreplication"], row["rolreplication"]),
        ("NOT bypassrls", not row["rolbypassrls"], row["rolbypassrls"]),
        ("zero role memberships", row["memberships"] == 0, row["memberships"]),
        ("cannot CREATE in public", not row["can_create_in_public"], row["can_create_in_public"]),
    ]
    failed = 0
    for name, ok, actual in conditions:
        if not ok:
            failed += 1
        print(f"  {'PASS' if ok else 'FAIL'}  {name:34} -> {actual}")
    print(f"\n{len(conditions) - failed}/{len(conditions)} conditions hold")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("query", nargs="?", help="SQL to run as the runtime role")
    parser.add_argument("--tenant", help="Set app.user_id for this query, so RLS scopes it")
    parser.add_argument("--check", action="store_true", help="Report the readiness conditions")
    parser.add_argument("--json", action="store_true", help="Emit rows as JSON")
    args = parser.parse_args()

    if args.check:
        return check()
    if not args.query:
        parser.print_help()
        return 2

    rows = run(args.query, args.tenant)
    if args.json:
        print(json.dumps(rows, indent=2, default=str))
    elif not rows:
        print("(no rows)")
    else:
        headers = list(rows[0].keys())
        widths = [max(len(h), *(len(str(r[h])) for r in rows)) for h in headers]
        print("  ".join(h.ljust(w) for h, w in zip(headers, widths)))
        print("  ".join("-" * w for w in widths))
        for r in rows:
            print("  ".join(str(r[h]).ljust(w) for h, w in zip(headers, widths)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
