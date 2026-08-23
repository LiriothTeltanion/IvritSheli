"""Unit tests for fail-closed PostgreSQL migration/runtime credential separation."""

from __future__ import annotations

import json

import pytest

from ivrit_sheli.db_admin import (
    _assert_role_is_unprivileged,
    main,
    parse_database_target,
    validate_database_boundary,
)

ADMIN_URL = "postgresql://ivrit_admin:admin-only@postgres:5432/ivrit_sheli"
RUNTIME_URL = (
    "postgresql://ivrit_sheli_runtime:runtime-only@postgres:5432/ivrit_sheli"
)


def test_database_boundary_accepts_distinct_users_on_one_database() -> None:
    migration, runtime = validate_database_boundary(ADMIN_URL, RUNTIME_URL)
    assert migration.user == "ivrit_admin"
    assert runtime.user == "ivrit_sheli_runtime"
    assert migration.password == "admin-only"
    assert runtime.password == "runtime-only"


@pytest.mark.parametrize(
    ("migration_url", "runtime_url", "message"),
    (
        (
            ADMIN_URL,
            "postgresql://owner:runtime-only@postgres:5432/ivrit_sheli",
            "authenticate directly as ivrit_sheli_runtime",
        ),
        (
            "postgresql://ivrit_sheli_runtime:admin@postgres:5432/ivrit_sheli",
            RUNTIME_URL,
            "must be different",
        ),
        (
            ADMIN_URL,
            "postgresql://ivrit_sheli_runtime:runtime-only@other:5432/ivrit_sheli",
            "same host, port, and database",
        ),
        (
            ADMIN_URL,
            "postgresql://ivrit_sheli_runtime:runtime-only@postgres:5432/other",
            "same host, port, and database",
        ),
        (
            ADMIN_URL,
            "postgresql://ivrit_sheli_runtime@postgres:5432/ivrit_sheli",
            "must include host, database, user, and password",
        ),
    ),
)
def test_database_boundary_rejects_admin_runtime_or_cross_wired_urls(
    migration_url: str,
    runtime_url: str,
    message: str,
) -> None:
    with pytest.raises(ValueError, match=message) as captured:
        validate_database_boundary(migration_url, runtime_url)
    rendered = str(captured.value)
    assert "admin-only" not in rendered
    assert "runtime-only" not in rendered


def test_database_target_rejects_non_postgresql_urls_without_echoing_secret() -> None:
    with pytest.raises(ValueError, match="must be a PostgreSQL") as captured:
        parse_database_target(
            "https://admin:must-not-leak@example.test/database",
            variable_name="MIGRATION_DATABASE_URL",
        )
    assert "must-not-leak" not in str(captured.value)


def test_admin_cli_fails_cleanly_when_credentials_are_missing(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.delenv("MIGRATION_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert main(["migrate"]) == 1
    payload = json.loads(capsys.readouterr().err)
    assert payload == {
        "event": "database.provision.failed",
        "error": "MIGRATION_DATABASE_URL is required for PostgreSQL provisioning",
    }


def test_admin_cli_rejects_unexpected_commands(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["serve"]) == 2
    assert "Usage:" in capsys.readouterr().err


class _FakeResult:
    def __init__(self, row: dict[str, object] | None) -> None:
        self._row = row

    def fetchone(self) -> dict[str, object] | None:
        return self._row


class _FakeConnection:
    """Records statements and answers the pg_roles probe with a fixed row."""

    def __init__(self, row: dict[str, object] | None) -> None:
        self._row = row
        self.statements: list[str] = []

    def execute(self, statement: object, params: object = None) -> _FakeResult:
        self.statements.append(str(statement))
        return _FakeResult(self._row)


def _role_row(**overrides: bool) -> dict[str, object]:
    row: dict[str, object] = {
        "rolsuper": False,
        "rolreplication": False,
        "rolbypassrls": False,
        "rolcreatedb": False,
        "rolcreaterole": False,
        "rolcanlogin": True,
    }
    row.update(overrides)
    return row


def test_unprivileged_assertion_accepts_a_correctly_restricted_role() -> None:
    connection = _FakeConnection(_role_row())
    _assert_role_is_unprivileged(connection, "ivrit_sheli_runtime")


@pytest.mark.parametrize(
    ("attribute", "name"),
    (
        ("rolbypassrls", "BYPASSRLS"),
        ("rolsuper", "SUPERUSER"),
        ("rolreplication", "REPLICATION"),
        ("rolcreatedb", "CREATEDB"),
        ("rolcreaterole", "CREATEROLE"),
    ),
)
def test_unprivileged_assertion_refuses_a_role_that_kept_a_dangerous_attribute(
    attribute: str, name: str
) -> None:
    """A role holding BYPASSRLS silently disables every RLS policy in the schema.

    The provisioner degrades to whatever the administrator is permitted to set,
    so this check — not the ALTER statement — is what guarantees the outcome.
    """
    connection = _FakeConnection(_role_row(**{attribute: True}))
    with pytest.raises(RuntimeError, match=name):
        _assert_role_is_unprivileged(connection, "ivrit_sheli_runtime")


def test_unprivileged_assertion_refuses_a_role_that_cannot_log_in() -> None:
    connection = _FakeConnection(_role_row(rolcanlogin=False))
    with pytest.raises(RuntimeError, match="cannot log in"):
        _assert_role_is_unprivileged(connection, "ivrit_sheli_runtime")


def test_unprivileged_assertion_refuses_a_missing_role() -> None:
    connection = _FakeConnection(None)
    with pytest.raises(RuntimeError, match="does not exist"):
        _assert_role_is_unprivileged(connection, "ivrit_sheli_runtime")
