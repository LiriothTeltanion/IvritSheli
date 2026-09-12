"""Take the push RPC out of reach of the auto-generated REST API.

Supabase exposes the `public` schema over PostgREST, and its default privileges
grant EXECUTE on new functions to `anon`, `authenticated` and `service_role`.
Revision 0005 revoked EXECUTE FROM PUBLIC, but those three are named roles
rather than PUBLIC, so they kept it. The live ACL read:

    {=X/postgres, postgres=X/postgres, anon=X/postgres,
     authenticated=X/postgres, service_role=X/postgres}

`upsert_push_subscription_for_current_user` is SECURITY DEFINER, so that made a
privilege-elevating function callable at /rest/v1/rpc/... by anyone holding the
project's publishable key — which ships to every browser.

It was not exploitable. The function reads `app.user_id` from the session and
raises 'Push subscription tenant mismatch' when it does not match `p_user_id`,
and a PostgREST caller has no such setting, so every anonymous call failed
closed. This removes the reachability anyway: the application connects directly
as `ivrit_sheli_runtime` and never uses PostgREST, so no legitimate caller loses
anything.

The REST roles do not exist outside Supabase, so each revoke is guarded.

Revision ID: 20260824_0006
Revises: 20260727_0005
"""

from __future__ import annotations

from alembic import op

revision = "20260824_0006"
down_revision = "20260727_0005"
branch_labels = None
depends_on = None

FUNCTION_SIGNATURE = """public.upsert_push_subscription_for_current_user(
    UUID, UUID, CHAR(64), TEXT, BOOLEAN, TEXT, TEXT, TIME, SMALLINT,
    TIME, TIME, TIMESTAMPTZ
)"""

REST_ROLES = ("anon", "authenticated", "service_role")


def upgrade() -> None:
    for role in REST_ROLES:
        op.execute(
            f"""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
                    EXECUTE 'REVOKE ALL ON FUNCTION {FUNCTION_SIGNATURE} FROM {role}';
                END IF;
            END
            $$;
            """
        )
    # Re-assert the two boundaries 0005 established, so a database that drifted
    # since then converges rather than half-applying this revision.
    op.execute(f"REVOKE ALL ON FUNCTION {FUNCTION_SIGNATURE} FROM PUBLIC;")
    op.execute(f"GRANT EXECUTE ON FUNCTION {FUNCTION_SIGNATURE} TO ivrit_sheli_runtime;")


def downgrade() -> None:
    # Restoring EXECUTE to the REST roles would put a SECURITY DEFINER function
    # back on the public API surface. The downgrade deliberately does not do
    # that; it leaves the tighter grant in place.
    pass
