"""Make one browser Push endpoint belong to exactly one learner.

Revision ID: 20260727_0004
Revises: 20260727_0003
"""

from __future__ import annotations

from alembic import op

revision = "20260727_0004"
down_revision = "20260727_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Keep the newest legacy association, then enforce atomic endpoint transfer."""
    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY endpoint_hash
                       ORDER BY updated_at DESC, created_at DESC, id DESC
                   ) AS ownership_rank
            FROM push_subscriptions
        )
        DELETE FROM push_subscriptions
        WHERE id IN (
            SELECT id FROM ranked WHERE ownership_rank > 1
        );

        ALTER TABLE push_subscriptions
            DROP CONSTRAINT IF EXISTS
                push_subscriptions_user_id_endpoint_hash_key;
        ALTER TABLE push_subscriptions
            ADD CONSTRAINT uq_push_subscriptions_endpoint_hash
            UNIQUE(endpoint_hash);

        CREATE POLICY push_subscription_endpoint_transfer_policy
            ON push_subscriptions
            FOR UPDATE
            USING (
                endpoint_hash = NULLIF(
                    current_setting('app.push_endpoint_hash', true), ''
                )::CHAR(64)
            )
            WITH CHECK (
                user_id = NULLIF(
                    current_setting('app.user_id', true), ''
                )::UUID
                AND endpoint_hash = NULLIF(
                    current_setting('app.push_endpoint_hash', true), ''
                )::CHAR(64)
            );
        """
    )


def downgrade() -> None:
    """Restore tenant-scoped uniqueness while retaining the current endpoint owner."""
    op.execute(
        """
        DROP POLICY IF EXISTS push_subscription_endpoint_transfer_policy
            ON push_subscriptions;
        ALTER TABLE push_subscriptions
            DROP CONSTRAINT IF EXISTS uq_push_subscriptions_endpoint_hash;
        ALTER TABLE push_subscriptions
            ADD CONSTRAINT push_subscriptions_user_id_endpoint_hash_key
            UNIQUE(user_id, endpoint_hash);
        """
    )
