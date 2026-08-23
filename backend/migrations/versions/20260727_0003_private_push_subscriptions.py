"""Add encrypted, tenant-isolated Web Push subscriptions.

Revision ID: 20260727_0003
Revises: 20260718_0002
"""

from __future__ import annotations

from alembic import op

revision = "20260727_0003"
down_revision = "20260718_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Store only encrypted subscription documents behind the existing tenant boundary."""
    op.execute(
        """
        CREATE TABLE push_subscriptions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint_hash CHAR(64) NOT NULL,
            subscription_ciphertext TEXT NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT FALSE,
            locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'es', 'he')),
            timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
            preferred_time TIME NOT NULL DEFAULT '19:00',
            weekly_rest_day SMALLINT NOT NULL DEFAULT 5
                CHECK (weekly_rest_day BETWEEN 0 AND 6),
            quiet_hours_start TIME NOT NULL DEFAULT '22:00',
            quiet_hours_end TIME NOT NULL DEFAULT '08:00',
            failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, endpoint_hash)
        );

        ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
        CREATE POLICY push_subscription_owner_policy ON push_subscriptions
            USING (
                user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            )
            WITH CHECK (
                user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            );
        CREATE POLICY push_subscription_worker_policy ON push_subscriptions
            USING (TRUE)
            WITH CHECK (TRUE);

        CREATE TABLE push_delivery_state (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            last_sent_local_date DATE,
            claim_token UUID,
            claim_expires_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CHECK (
                (claim_token IS NULL AND claim_expires_at IS NULL)
                OR (claim_token IS NOT NULL AND claim_expires_at IS NOT NULL)
            )
        );
        ALTER TABLE push_delivery_state ENABLE ROW LEVEL SECURITY;
        ALTER TABLE push_delivery_state FORCE ROW LEVEL SECURITY;
        CREATE POLICY push_delivery_owner_policy ON push_delivery_state
            USING (
                user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            )
            WITH CHECK (
                user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            );
        CREATE POLICY push_delivery_worker_policy ON push_delivery_state
            USING (TRUE)
            WITH CHECK (TRUE);
        """
    )


def downgrade() -> None:
    """Remove push subscriptions without touching learner state or identities."""
    op.execute(
        """
        DROP TABLE IF EXISTS push_delivery_state;
        DROP TABLE IF EXISTS push_subscriptions;
        """
    )
