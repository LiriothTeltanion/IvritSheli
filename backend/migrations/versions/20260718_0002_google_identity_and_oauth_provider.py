"""Add Google identities and bind OAuth states to their provider.

Revision ID: 20260718_0002
Revises: 20260716_0001
"""

from __future__ import annotations

from alembic import op

revision = "20260718_0002"
down_revision = "20260716_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Permit Google identities and mark existing OAuth states as GitHub states."""
    op.execute(
        """
        ALTER TABLE users DROP CONSTRAINT users_provider_check;
        ALTER TABLE users ADD CONSTRAINT users_provider_check
            CHECK (provider IN ('github', 'google', 'demo'));

        ALTER TABLE oauth_states
            ADD COLUMN provider TEXT NOT NULL DEFAULT 'github';
        ALTER TABLE oauth_states ADD CONSTRAINT oauth_states_provider_check
            CHECK (provider IN ('github', 'google'));
        """
    )


def downgrade() -> None:
    """Restore the old constraint only when doing so cannot delete learner data."""
    op.execute(
        """
        DO $downgrade$
        BEGIN
            IF EXISTS (SELECT 1 FROM users WHERE provider = 'google') THEN
                RAISE EXCEPTION
                    'Cannot downgrade while Google learner accounts exist; preserve or migrate them first';
            END IF;
        END
        $downgrade$;

        ALTER TABLE users DROP CONSTRAINT users_provider_check;
        ALTER TABLE users ADD CONSTRAINT users_provider_check
            CHECK (provider IN ('github', 'demo'));

        ALTER TABLE oauth_states DROP CONSTRAINT oauth_states_provider_check;
        ALTER TABLE oauth_states DROP COLUMN provider;
        """
    )
