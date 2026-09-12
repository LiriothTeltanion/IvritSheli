-- Ivrit Sheli — give the application a restricted database login.
--
-- Run this in the Supabase SQL Editor. That session is already authenticated,
-- so no database password is involved and none of the connection problems that
-- affect scripts/setup-runtime-role.ps1 apply here.
--
-- Safe to run more than once. Every statement is idempotent.
--
-- BEFORE RUNNING: replace CAMBIA_ESTA_PASSWORD on line 27 with a password you
-- choose. Use letters and digits only — a password with @ : / ? # or % has to
-- be percent-encoded when it goes into a URL, and that is an easy mistake to
-- make by hand.
--
-- AFTER RUNNING: clear the SQL Editor. The password is plaintext in it.


-- 1. The role. Alembic normally creates it; this only covers the case where the
--    migrations have not run yet. NOLOGIN until step 2, deliberately.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ivrit_sheli_runtime') THEN
    CREATE ROLE ivrit_sheli_runtime NOLOGIN NOINHERIT;
  END IF;
END $$;


-- 2. Give it a login and a password.
--
--    NOINHERIT is not decoration and is not optional: PostgreSQL defaults a new
--    role to INHERIT, and the application's readiness check refuses to report
--    ready without it. Together with step 3 it means this login cannot reach a
--    privilege it was not granted directly — neither by inheriting one nor by
--    switching roles.
--
--    NOSUPERUSER, NOREPLICATION and NOBYPASSRLS are deliberately absent. Setting
--    them requires the SUPERUSER attribute, which a managed provider's
--    administrator does not have, and they are already the default. Step 5
--    verifies them rather than asserting them.
ALTER ROLE ivrit_sheli_runtime WITH LOGIN NOINHERIT NOCREATEDB NOCREATEROLE PASSWORD 'CAMBIA_ESTA_PASSWORD';


-- 3. Strip every membership. NOINHERIT stops privileges being inherited, but it
--    does NOT stop SET ROLE, so a membership left behind would let this login
--    switch into a more privileged role at will.
DO $$
DECLARE granted record;
BEGIN
  FOR granted IN
    SELECT parent.rolname
    FROM pg_auth_members m
    JOIN pg_roles parent ON parent.oid = m.roleid
    JOIN pg_roles child ON child.oid = m.member
    WHERE child.rolname = 'ivrit_sheli_runtime'
  LOOP
    EXECUTE format('REVOKE %I FROM ivrit_sheli_runtime', granted.rolname);
  END LOOP;
END $$;


-- 4. Exactly the table privileges the application needs, and nothing else.
--    Repeated from the migrations on purpose: it repairs a database where an
--    earlier revision was recorded without its grants.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

REVOKE ALL ON TABLE alembic_version, users, sessions, oauth_states,
  learner_states, push_subscriptions, push_delivery_state FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO ivrit_sheli_runtime;
GRANT SELECT ON TABLE alembic_version TO ivrit_sheli_runtime;

REVOKE ALL ON TABLE users, sessions, oauth_states, learner_states,
  push_subscriptions, push_delivery_state FROM ivrit_sheli_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users, sessions, oauth_states,
  learner_states, push_subscriptions TO ivrit_sheli_runtime;

GRANT SELECT, INSERT ON TABLE push_delivery_state TO ivrit_sheli_runtime;


-- 5. Verify. rolcanlogin must be true and EVERY other column must be false.
--    rolbypassrls is the one that matters most: a role holding it silently
--    disables every row-level-security policy in the schema, which is the whole
--    reason this role exists. If it comes back true, stop and say so.
SELECT rolname,
       rolcanlogin   AS "puede entrar (debe ser true)",
       rolinherit    AS "inherit (debe ser false)",
       rolsuper      AS "superuser (debe ser false)",
       rolbypassrls  AS "bypassrls (debe ser false)",
       rolcreatedb   AS "createdb (debe ser false)",
       rolcreaterole AS "createrole (debe ser false)",
       rolreplication AS "replication (debe ser false)"
FROM pg_roles
WHERE rolname = 'ivrit_sheli_runtime';
