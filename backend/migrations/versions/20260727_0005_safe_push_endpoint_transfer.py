"""Transfer one browser Push endpoint without exposing another learner's row.

Revision ID: 20260727_0005
Revises: 20260727_0004
"""

from __future__ import annotations

from alembic import op

revision = "20260727_0005"
down_revision = "20260727_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Install a narrowly privileged, tenant-checked endpoint transfer function."""
    op.execute(
        """
        DO $role$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_roles
                WHERE rolname = 'ivrit_sheli_push_transfer'
            ) THEN
                CREATE ROLE ivrit_sheli_push_transfer NOLOGIN NOSUPERUSER NOCREATEDB
                    NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
            END IF;
        END
        $role$;
        ALTER ROLE ivrit_sheli_push_transfer NOLOGIN NOSUPERUSER NOCREATEDB
            NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;

        CREATE POLICY push_subscription_transfer_function_policy
            ON push_subscriptions
            FOR ALL
            TO ivrit_sheli_push_transfer
            USING (TRUE)
            WITH CHECK (TRUE);

        GRANT USAGE, CREATE ON SCHEMA public TO ivrit_sheli_push_transfer;
        GRANT SELECT, INSERT, UPDATE
            ON TABLE push_subscriptions TO ivrit_sheli_push_transfer;

        CREATE FUNCTION public.upsert_push_subscription_for_current_user(
            p_id UUID,
            p_user_id UUID,
            p_endpoint_hash CHAR(64),
            p_subscription_ciphertext TEXT,
            p_enabled BOOLEAN,
            p_locale TEXT,
            p_timezone TEXT,
            p_preferred_time TIME,
            p_weekly_rest_day SMALLINT,
            p_quiet_hours_start TIME,
            p_quiet_hours_end TIME,
            p_expires_at TIMESTAMPTZ
        )
        RETURNS TABLE(
            active BOOLEAN,
            created_at_value TIMESTAMPTZ,
            updated_at_value TIMESTAMPTZ
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = pg_catalog, public
        AS $function$
        DECLARE
            configured_user UUID := NULLIF(
                current_setting('app.user_id', true), ''
            )::UUID;
            configured_endpoint CHAR(64) := NULLIF(
                current_setting('app.push_endpoint_hash', true), ''
            )::CHAR(64);
        BEGIN
            IF p_user_id IS DISTINCT FROM configured_user THEN
                RAISE EXCEPTION 'Push subscription tenant mismatch'
                    USING ERRCODE = '42501';
            END IF;
            IF p_endpoint_hash IS DISTINCT FROM configured_endpoint THEN
                RAISE EXCEPTION 'Push subscription endpoint mismatch'
                    USING ERRCODE = '42501';
            END IF;

            RETURN QUERY
            INSERT INTO public.push_subscriptions AS subscription(
                id, user_id, endpoint_hash, subscription_ciphertext, enabled,
                locale, timezone, preferred_time, weekly_rest_day,
                quiet_hours_start, quiet_hours_end, expires_at
            ) VALUES(
                p_id, p_user_id, p_endpoint_hash, p_subscription_ciphertext,
                p_enabled, p_locale, p_timezone, p_preferred_time,
                p_weekly_rest_day, p_quiet_hours_start, p_quiet_hours_end,
                p_expires_at
            )
            ON CONFLICT(endpoint_hash) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                subscription_ciphertext = EXCLUDED.subscription_ciphertext,
                enabled = EXCLUDED.enabled,
                locale = EXCLUDED.locale,
                timezone = EXCLUDED.timezone,
                preferred_time = EXCLUDED.preferred_time,
                weekly_rest_day = EXCLUDED.weekly_rest_day,
                quiet_hours_start = EXCLUDED.quiet_hours_start,
                quiet_hours_end = EXCLUDED.quiet_hours_end,
                expires_at = EXCLUDED.expires_at,
                failure_count = 0,
                updated_at = NOW()
            RETURNING
                subscription.enabled,
                subscription.created_at,
                subscription.updated_at;
        END
        $function$;

        GRANT ivrit_sheli_push_transfer TO CURRENT_USER;
        ALTER FUNCTION public.upsert_push_subscription_for_current_user(
            UUID, UUID, CHAR(64), TEXT, BOOLEAN, TEXT, TEXT, TIME, SMALLINT,
            TIME, TIME, TIMESTAMPTZ
        ) OWNER TO ivrit_sheli_push_transfer;
        REVOKE ivrit_sheli_push_transfer FROM CURRENT_USER;
        REVOKE CREATE ON SCHEMA public FROM ivrit_sheli_push_transfer;
        REVOKE ALL ON FUNCTION public.upsert_push_subscription_for_current_user(
            UUID, UUID, CHAR(64), TEXT, BOOLEAN, TEXT, TEXT, TIME, SMALLINT,
            TIME, TIME, TIMESTAMPTZ
        ) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.upsert_push_subscription_for_current_user(
            UUID, UUID, CHAR(64), TEXT, BOOLEAN, TEXT, TEXT, TIME, SMALLINT,
            TIME, TIME, TIMESTAMPTZ
        ) TO ivrit_sheli_runtime;
        """
    )


def downgrade() -> None:
    """Remove the transfer function while leaving existing subscriptions intact."""
    op.execute(
        """
        REVOKE EXECUTE ON FUNCTION public.upsert_push_subscription_for_current_user(
            UUID, UUID, CHAR(64), TEXT, BOOLEAN, TEXT, TEXT, TIME, SMALLINT,
            TIME, TIME, TIMESTAMPTZ
        ) FROM ivrit_sheli_runtime;
        DROP FUNCTION IF EXISTS public.upsert_push_subscription_for_current_user(
            UUID, UUID, CHAR(64), TEXT, BOOLEAN, TEXT, TEXT, TIME, SMALLINT,
            TIME, TIME, TIMESTAMPTZ
        );
        DROP POLICY IF EXISTS push_subscription_transfer_function_policy
            ON push_subscriptions;
        REVOKE SELECT, INSERT, UPDATE
            ON TABLE push_subscriptions FROM ivrit_sheli_push_transfer;
        REVOKE USAGE ON SCHEMA public FROM ivrit_sheli_push_transfer;
        DROP ROLE IF EXISTS ivrit_sheli_push_transfer;
        """
    )
