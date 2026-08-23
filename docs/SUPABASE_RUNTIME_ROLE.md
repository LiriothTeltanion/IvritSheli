# Runbook — moving Supabase off the superuser

Status on 2026-08-23: `DATABASE_URL` authenticates as `postgres`. That role
carries `BYPASSRLS`, so every Row Level Security policy in the schema is
inert and one learner's connection can read another learner's rows. The
application refuses to start against it, by design
(`PostgresCloudStore.__init__`, `cloud_store.py`).

Do not remove that guard to make the app start. That is what happened before,
and it took the least-privilege roles and the RLS `TO <role>` clauses out of
four migrations with it.

## What already exists

Nothing needs to be written. The migrations create `ivrit_sheli_runtime`
`NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION
NOBYPASSRLS` and grant it exactly the table privileges it needs, and
`ivrit_sheli.db_admin` turns it into a login role. The provisioner encrypts the
password client-side with `PGconn.encrypt_password`, so the plaintext never
reaches the server's DDL log.

## The short way

One command does everything below except the dashboard click. It reads both
passwords as secure strings, never echoes or logs them, never writes the
administrator URL to disk, and keeps a `.env.bak`:

```
pwsh -File scripts/setup-runtime-role.ps1
```

Rotate the `postgres` password in the Supabase dashboard first — the script
tells you where and waits for you.

## The long way, step by step

1. **Rotate the `postgres` password first.** The current one was exposed in a
   session transcript on 2026-08-23.

2. **Choose a separate password for `ivrit_sheli_runtime`.** It must not be the
   `postgres` password. Both URLs must point at the same host, port and
   database, or the provisioner refuses to run.

3. **Provision.** Set both variables for this one command only:

   ```
   MIGRATION_DATABASE_URL = postgresql://postgres:<rotated>@db.<project>.supabase.co:5432/postgres
   DATABASE_URL           = postgresql://ivrit_sheli_runtime:<new>@db.<project>.supabase.co:5432/postgres
   ```

   ```bash
   .venv/Scripts/python.exe -m ivrit_sheli.db_admin migrate
   ```

   It runs Alembic to head, creates and hardens the role, applies the grants and
   then verifies it can connect as the restricted role.

4. **Remove `MIGRATION_DATABASE_URL` from `.env`.** The application must never
   receive it. Keep only the `ivrit_sheli_runtime` `DATABASE_URL`.

5. **Confirm.** Start the `backend` launch profile — not `backend-local` — and
   check `/api/v1/version` reports `"storage": "postgresql"`. Then run the
   PostgreSQL-gated test, which is skipped today for exactly this reason:

   ```bash
   .venv/Scripts/python.exe -m pytest backend/tests/test_postgres_integration.py -q
   ```

## Why the app cannot do this itself

Creating a role is an administrator operation against a live project holding
real data. It is deliberately a human step with a human's credentials, run once,
outside the application.

## Related

- `docs/ARCHITECTURE.md` — the runtime/migration/push credential boundary.
- `docs/DEPLOYMENT.md` — the same separation as Railway pre-deploy.
- `SECURITY.md` — the credential inventory.
