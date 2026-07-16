"""Create cloud users, secure sessions, OAuth state, and tenant learner state.

Revision ID: 20260716_0001
Revises: None
"""

from __future__ import annotations

from alembic import op

revision = "20260716_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Install the v2 cloud identity and tenant persistence schema."""
    op.execute(
        """
        DO $role$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ivrit_sheli_runtime') THEN
                CREATE ROLE ivrit_sheli_runtime NOLOGIN NOSUPERUSER NOCREATEDB
                    NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
            END IF;
        END
        $role$;
        ALTER ROLE ivrit_sheli_runtime NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS;

        CREATE TABLE users (
            id UUID PRIMARY KEY,
            provider TEXT NOT NULL CHECK (provider IN ('github', 'demo')),
            provider_user_id TEXT NOT NULL,
            login TEXT,
            display_name TEXT NOT NULL,
            avatar_url TEXT,
            is_demo BOOLEAN NOT NULL DEFAULT FALSE,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(provider, provider_user_id)
        );

        CREATE TABLE sessions (
            token_hash CHAR(64) PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            csrf_hash CHAR(64) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            revoked_at TIMESTAMPTZ
        );
        CREATE INDEX sessions_user_live_idx
            ON sessions(user_id, expires_at DESC) WHERE revoked_at IS NULL;

        CREATE TABLE oauth_states (
            state_hash CHAR(64) PRIMARY KEY,
            code_verifier TEXT NOT NULL,
            redirect_path TEXT NOT NULL DEFAULT '/',
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX oauth_states_expiry_idx ON oauth_states(expires_at);

        CREATE TABLE learner_states (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            state JSONB NOT NULL DEFAULT '{}'::jsonb,
            revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE learner_states ENABLE ROW LEVEL SECURITY;
        ALTER TABLE learner_states FORCE ROW LEVEL SECURITY;
        CREATE POLICY learner_state_owner_policy ON learner_states
            USING (
                user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            )
            WITH CHECK (
                user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            );

        REVOKE CREATE ON SCHEMA public FROM PUBLIC;
        REVOKE ALL ON TABLE alembic_version, users, sessions, oauth_states, learner_states
            FROM PUBLIC;
        GRANT USAGE ON SCHEMA public TO ivrit_sheli_runtime;
        GRANT SELECT ON TABLE alembic_version TO ivrit_sheli_runtime;
        GRANT SELECT, INSERT, UPDATE, DELETE
            ON TABLE users, sessions, oauth_states, learner_states
            TO ivrit_sheli_runtime;
        """
    )


def downgrade() -> None:
    """Remove v2 cloud state in dependency order."""
    op.execute(
        """
        REVOKE SELECT, INSERT, UPDATE, DELETE
            ON TABLE users, sessions, oauth_states, learner_states
            FROM ivrit_sheli_runtime;
        REVOKE SELECT ON TABLE alembic_version FROM ivrit_sheli_runtime;
        REVOKE USAGE ON SCHEMA public FROM ivrit_sheli_runtime;
        DROP TABLE IF EXISTS learner_states;
        DROP TABLE IF EXISTS oauth_states;
        DROP TABLE IF EXISTS sessions;
        DROP TABLE IF EXISTS users;
        DROP ROLE IF EXISTS ivrit_sheli_runtime;
        """
    )
