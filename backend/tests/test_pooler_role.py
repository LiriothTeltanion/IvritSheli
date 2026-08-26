"""The session pooler is allowed in; nothing else is.

Author: Kevin "Lirioth" Cusnir
Date: 2026-08-26 | TZ: Asia/Jerusalem

The direct Supabase host is IPv6-only -- one AAAA record, no A record -- so no
container can reach it, and the production image dies on
`Network is unreachable` after passing every configuration guard. Supabase's
session pooler is the documented answer and is IPv4-proxied for free, but it
authenticates as `<role>.<project-ref>` instead of `<role>`.

Widening a security guard is exactly the move that went wrong here once before:
an assistant deleted the guard refusing an administrator `DATABASE_URL` to make
the backend boot, and took both layers of tenant isolation with it. So this file
exists to pin what the widening does and does not permit. The role before the
dot must still match exactly; `postgres.<ref>` is still refused.

What actually proves the identity is `ready()`, which asks the database for
`session_user` and `current_user` rather than trusting the URL. That check is
untouched, and it was verified against the live project through the pooler on
2026-08-26: both reported `ivrit_sheli_runtime`, `rolsuper` and `rolbypassrls`
were false, and `learner_states` returned zero rows without a tenant context.
"""

from __future__ import annotations

import pytest

from ivrit_sheli.cloud_store import (
    RUNTIME_DATABASE_ROLE,
    PostgresCloudStore,
    database_url_role,
)

POOLER = "aws-0-ap-southeast-2.pooler.supabase.com"
SECRET = "test-only-session-secret-at-least-32-characters"


def _url(user: str, host: str = POOLER) -> str:
    return f"postgresql://{user}:pw@{host}:5432/postgres"


def test_the_plain_role_is_still_the_normal_case() -> None:
    assert database_url_role(_url(RUNTIME_DATABASE_ROLE)) == RUNTIME_DATABASE_ROLE


def test_the_pooler_tenant_suffix_resolves_to_the_same_role() -> None:
    assert database_url_role(_url(f"{RUNTIME_DATABASE_ROLE}.hythwegtkwuzrzwglivz")) == (
        RUNTIME_DATABASE_ROLE
    )


@pytest.mark.parametrize(
    "user",
    [
        "postgres",
        "postgres.hythwegtkwuzrzwglivz",
        "ivrit_sheli_runtime_admin",
        "ivrit_sheli",
        "supabase_admin",
        "",
    ],
)
def test_no_other_role_is_admitted_by_the_widening(user: str) -> None:
    """`postgres.<ref>` is the one that matters: it is a real, reachable
    superuser DSN in the exact shape the pooler uses."""
    assert database_url_role(_url(user)) != RUNTIME_DATABASE_ROLE


def test_the_store_accepts_a_pooler_dsn_and_still_refuses_a_superuser_one() -> None:
    # Constructing the store opens no socket; it validates and builds the queue.
    store = PostgresCloudStore(
        _url(f"{RUNTIME_DATABASE_ROLE}.hythwegtkwuzrzwglivz"),
        SECRET,
    )
    assert store.database_url.startswith("postgresql://")

    with pytest.raises(ValueError, match="authenticate directly as"):
        PostgresCloudStore(_url("postgres.hythwegtkwuzrzwglivz"), SECRET)


def test_percent_encoded_usernames_are_decoded_before_the_role_is_read() -> None:
    """`unquote` runs first, so an encoded dot cannot smuggle a different role."""
    assert database_url_role(_url("postgres%2Ehythwegtkwuzrzwglivz")) == "postgres"
