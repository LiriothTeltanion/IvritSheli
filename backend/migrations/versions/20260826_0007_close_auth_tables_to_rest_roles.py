"""Take the authentication tables out of reach of the auto-generated REST API.

Supabase's own security advisor flags four rows CRITICAL — `public.users`,
`public.sessions`, `public.oauth_states` and `public.alembic_version`, all
"RLS Disabled in Public". Measured against the live project on 2026-08-26, the
picture is worse than the badge: `anon` and `authenticated` hold
SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on all four,
and row-level security is off.

`anon` is the role behind PostgREST. Anyone holding the project's publishable
key — a key Supabase designs to be public — could read every row of `sessions`,
including `token_hash` and `csrf_hash`, or TRUNCATE the table and end every
session at once. This application never uses PostgREST and never holds that key,
so nothing legitimate loses anything here; the grants are Supabase's defaults for
the `public` schema, not a decision anyone made.

WHY THE POLICY LOOKS DIFFERENT FROM THE ONES ON learner_states

These three are not tenant data. They are the machinery that decides *who the
tenant is*. `_resolve_session` looks a session up by `token_hash` precisely in
order to discover the user, so at that moment there is no `app.user_id` to filter
on and there cannot be. A tenant-scoped policy here would deny every login.

So the boundary is drawn by role rather than by row: the runtime role sees
everything in these four tables, and the REST roles reach nothing. Tenant
isolation continues to live where it belongs, on `learner_states` and the push
tables, unchanged by this revision.

`TO ivrit_sheli_runtime` is not decoration. A permissive policy with no role
applies to PUBLIC, PostgreSQL ORs permissive policies together, and this project
has already been broken exactly that way once — four applied migrations lost
their `TO <role>` clauses and every learner's state became readable by every
other. The clause is the point.

alembic_version gets the same treatment with one asymmetry: the runtime role
holds SELECT only, because `PostgresCloudStore.ready()` reads the migration head
to refuse a database that is not current. Enabling RLS there without a read
policy would make `ready()` return false and every health check fail.

The REST roles do not exist outside Supabase, so each revoke is guarded, and the
revision applies cleanly to a plain PostgreSQL used for tests.

Revision ID: 20260826_0007
Revises: 20260824_0006
"""

from __future__ import annotations

from alembic import op

revision = "20260826_0007"
down_revision = "20260824_0006"
branch_labels = None
depends_on = None

REST_ROLES = ("anon", "authenticated")

# Everything the application actually does with these three, read out of
# cloud_store.py rather than assumed: INSERT and DELETE on users, INSERT,
# UPDATE and DELETE on sessions, INSERT and DELETE on oauth_states, and SELECT
# on all three.
AUTH_TABLES = ("users", "sessions", "oauth_states")
RUNTIME_ROLE = "ivrit_sheli_runtime"


def upgrade() -> None:
    for table in (*AUTH_TABLES, "alembic_version"):
        for role in REST_ROLES:
            op.execute(
                f"""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
                        EXECUTE 'REVOKE ALL ON TABLE public.{table} FROM {role}';
                    END IF;
                END
                $$;
                """
            )
        # PUBLIC is a separate grantee from the named roles above; 0006 learned
        # that the hard way on a function.
        op.execute(f"REVOKE ALL ON TABLE public.{table} FROM PUBLIC;")

    for table in AUTH_TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE public.{table} FORCE ROW LEVEL SECURITY;")
        op.execute(f"DROP POLICY IF EXISTS {table}_runtime_policy ON public.{table};")
        op.execute(
            f"""
            CREATE POLICY {table}_runtime_policy ON public.{table}
                FOR ALL
                TO {RUNTIME_ROLE}
                USING (TRUE)
                WITH CHECK (TRUE);
            """
        )

    # The migration ledger: readable by the runtime role, written only by the
    # migration credential. RLS is enabled but deliberately **not** forced,
    # because without FORCE the table owner bypasses row security — and the
    # owner is the migration role, which has to keep writing this row on every
    # `alembic upgrade`. Forcing it here would lock migrations out of the table
    # that records migrations.
    op.execute("ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;")
    op.execute(
        "DROP POLICY IF EXISTS alembic_version_runtime_read ON public.alembic_version;"
    )
    op.execute(
        f"""
        CREATE POLICY alembic_version_runtime_read ON public.alembic_version
            FOR SELECT
            TO {RUNTIME_ROLE}
            USING (TRUE);
        """
    )


def downgrade() -> None:
    # The policies and RLS come off, because a downgrade must return the schema
    # to the shape revision 0006 left. The grants to `anon` and `authenticated`
    # deliberately do **not** come back: restoring TRUNCATE and SELECT on the
    # session table to the public REST surface would be reintroducing the
    # finding, and no downgrade should have to do that to be correct.
    op.execute(
        "DROP POLICY IF EXISTS alembic_version_runtime_read ON public.alembic_version;"
    )
    op.execute("ALTER TABLE public.alembic_version DISABLE ROW LEVEL SECURITY;")
    for table in AUTH_TABLES:
        op.execute(f"DROP POLICY IF EXISTS {table}_runtime_policy ON public.{table};")
        op.execute(f"ALTER TABLE public.{table} NO FORCE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;")
