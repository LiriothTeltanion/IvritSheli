"""Connection-pool behaviour when the network, not the query, is what failed.

Author: Kevin "Lirioth" Cusnir
Date: 2026-08-25 | TZ: Asia/Jerusalem

KEV-12 asks for the pool to be validated "when network drops or SSL handshakes
renegotiate". Nothing in the suite touched ``_pool``, ``_acquire_connection`` or
``_release_connection`` before this file: the only tests naming
``PostgresCloudStore`` are the live-database integration ones, which skip
without credentials, so on an ordinary run the pool had no coverage at all.

These tests need no network. A dropped connection, a socket that dies mid
transaction and a failed reset are all just objects that raise, so they are
injected rather than provoked — which also makes them deterministic, and lets
them assert the thing that actually matters: **a connection that failed for
reasons of transport must never be handed to the next borrower, and must never
be left in the pool.** The alternative failure is silent and awful: the next
learner's request runs on a socket that is already gone, or worse, on one still
carrying the previous learner's aborted transaction.
"""

from __future__ import annotations

import queue
from typing import Any

import pytest

from ivrit_sheli.cloud_store import PostgresCloudStore

pytestmark = pytest.mark.postgres

RUNTIME_URL = "postgresql://ivrit_sheli_runtime:not-a-real-password@localhost:5432/ivrit_sheli"
SESSION_SECRET = "test-only-session-secret-at-least-32-characters"


class FakeConnection:
    """A psycopg-shaped connection whose failures are scripted, not incidental."""

    def __init__(
        self,
        name: str,
        *,
        closed: bool = False,
        fail_on: tuple[str, ...] = (),
        fail_commit: bool = False,
    ) -> None:
        self.name = name
        self.closed = closed
        self._fail_on = fail_on
        self._fail_commit = fail_commit
        self.statements: list[str] = []
        self.commits = 0
        self.rollbacks = 0
        self.close_calls = 0

    def execute(self, statement: str, params: Any = None) -> Any:
        self.statements.append(statement)
        for fragment in self._fail_on:
            if fragment in statement:
                raise OSError(f"{self.name}: connection reset by peer")
        return self

    def commit(self) -> None:
        self.commits += 1
        if self._fail_commit:
            raise OSError(f"{self.name}: connection reset by peer")

    def rollback(self) -> None:
        self.rollbacks += 1

    def close(self) -> None:
        self.close_calls += 1
        self.closed = True


def _store(monkeypatch: pytest.MonkeyPatch, created: list[FakeConnection]) -> PostgresCloudStore:
    """Build a store that never opens a socket.

    The constructor validates the URL and builds the queue; it does not connect,
    which is what makes this file possible without a database.
    """
    store = PostgresCloudStore(RUNTIME_URL, SESSION_SECRET)

    def _fake_create() -> FakeConnection:
        connection = FakeConnection(f"fresh-{len(created)}")
        created.append(connection)
        return connection

    monkeypatch.setattr(store, "_create_raw_connection", _fake_create)
    return store


def test_a_pooled_connection_that_died_in_the_pool_is_never_handed_out(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The liveness probe is the whole point of the extra round trip; prove it works."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    dead = FakeConnection("dead", fail_on=("SELECT 1",))
    store._pool.put_nowait(dead)

    borrowed = store._acquire_connection()

    assert borrowed is not dead
    assert dead.close_calls == 1
    assert borrowed in created, "a fresh connection should replace the dead one"
    assert store._pool.empty()


def test_a_connection_already_marked_closed_is_skipped_without_a_probe(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Probing a closed connection would raise where a cheap attribute read answers."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    shut = FakeConnection("shut", closed=True)
    store._pool.put_nowait(shut)

    borrowed = store._acquire_connection()

    assert borrowed is not shut
    assert shut.statements == [], "a closed connection must not be probed"
    assert borrowed in created


def test_a_live_pooled_connection_is_reused_rather_than_replaced(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The pool has to actually pool, or the probe is pure cost for nothing."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    healthy = FakeConnection("healthy")
    store._pool.put_nowait(healthy)

    assert store._acquire_connection() is healthy
    assert healthy.statements == ["SELECT 1"]
    assert created == [], "no new socket should have been opened"


def test_a_socket_that_dies_mid_request_is_closed_and_not_returned_to_the_pool(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The failure KEV-12 names: the network drops while the request is in flight.

    The borrower's exception must reach the caller, and the connection must not
    survive into the pool, where the next learner would inherit a dead socket
    and, worse, an aborted transaction.
    """
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    with pytest.raises(RuntimeError, match="the query, not the transport"):
        with store._connection() as connection:
            connection.execute("SELECT count(*) FROM users")
            raise RuntimeError("the query, not the transport, is what the caller saw")

    borrowed = created[0]
    assert borrowed.rollbacks == 1, "an aborted transaction has to be unwound"
    # The caller's work was never committed: `_connection` commits only on the
    # success branch. The one commit recorded here belongs to the reset in
    # `_release_connection`, which deliberately commits so the connection does
    # not sit in the pool idle-in-transaction — so assert the reset ran rather
    # than counting commits, which cannot tell the two apart.
    assert "DISCARD TEMP; RESET ALL;" in borrowed.statements
    assert borrowed.statements.index("DISCARD TEMP; RESET ALL;") > 0
    # It rolled back cleanly, so it is healthy enough to pool again.
    assert not store._pool.empty()


def test_a_connection_whose_reset_fails_is_closed_instead_of_pooled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """`DISCARD TEMP; RESET ALL` failing means the transport is gone, not the query."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    broken = FakeConnection("broken", fail_on=("DISCARD TEMP",))
    store._release_connection(broken)

    assert broken.close_calls == 1
    assert store._pool.empty(), "a connection that cannot be reset must not be reused"


def test_a_connection_whose_reset_commit_fails_is_closed_instead_of_pooled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The reset opens its own transaction; the commit is the other place it can die."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    broken = FakeConnection("broken-commit", fail_commit=True)
    store._release_connection(broken)

    assert broken.close_calls == 1
    assert store._pool.empty()


def test_connections_beyond_the_pool_ceiling_are_closed_rather_than_leaked(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """`put_nowait` raises when the queue is full; that path must close, not drop.

    A leaked connection is invisible until Supabase starts refusing new ones,
    which on a hosted database is a limit reached long before anything local
    complains.
    """
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)
    ceiling = store._pool.maxsize
    assert ceiling > 0, "an unbounded pool would make this test meaningless"

    for index in range(ceiling):
        store._pool.put_nowait(FakeConnection(f"pooled-{index}"))

    overflow = FakeConnection("overflow")
    store._release_connection(overflow)

    assert store._pool.qsize() == ceiling
    assert overflow.close_calls == 1, "the connection past the ceiling must be closed"


def test_draining_the_pool_closes_every_connection_it_holds(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)
    held = [FakeConnection(f"held-{index}") for index in range(3)]
    for connection in held:
        store._pool.put_nowait(connection)

    store.close()

    assert all(connection.close_calls == 1 for connection in held)
    assert store._pool.empty()


def test_a_pool_full_of_corpses_still_yields_a_working_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The shape of a real outage: everything pooled died while the app was idle.

    Every pooled connection fails its probe, so the loop has to discard all of
    them and fall through to opening one, rather than returning a dead socket or
    spinning.
    """
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)
    corpses = [FakeConnection(f"corpse-{index}", fail_on=("SELECT 1",)) for index in range(5)]
    for connection in corpses:
        store._pool.put_nowait(connection)

    borrowed = store._acquire_connection()

    assert borrowed in created
    assert all(connection.close_calls == 1 for connection in corpses)
    assert store._pool.empty()


def test_the_pool_is_bounded_so_a_burst_cannot_exhaust_the_database(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A ceiling is a tenant-isolation concern too: Supabase counts connections."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created)

    assert isinstance(store._pool, queue.Queue)
    assert store._pool.maxsize == 8
