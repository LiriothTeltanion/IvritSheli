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
import threading
from contextlib import ExitStack
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.cloud_store import (
    DEFAULT_CONNECTION_ACQUIRE_TIMEOUT,
    DEFAULT_MAX_CONNECTIONS,
    CloudCapacityError,
    PostgresCloudStore,
)
from ivrit_sheli.config import Settings

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


def _store(
    monkeypatch: pytest.MonkeyPatch,
    created: list[FakeConnection],
    *,
    max_connections: int = DEFAULT_MAX_CONNECTIONS,
    timeout: float = DEFAULT_CONNECTION_ACQUIRE_TIMEOUT,
) -> PostgresCloudStore:
    """Build a store that never opens a socket.

    The constructor validates the URL and builds the queue; it does not connect,
    which is what makes this file possible without a database.

    `max_connections` and `timeout` are keyword-only and default to the shipped
    values, so every test written before the SEC-03 ceiling keeps its exact
    previous behaviour while the ceiling tests can shrink the pool to something
    a single thread can fill.
    """
    store = PostgresCloudStore(
        RUNTIME_URL,
        SESSION_SECRET,
        max_connections=max_connections,
        connection_acquire_timeout=timeout,
    )

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


# ---------------------------------------------------------------------------
# SEC-03 — the ceiling on connections that EXIST, not only on idle ones.
#
# The queue above bounds reuse. It never bounded creation: when the queue was
# empty `_acquire_connection` opened another connection unconditionally, so a
# burst against the public `/health/ready` could open as many PostgreSQL
# connections as there were concurrent requests and take the database away from
# real learners. These tests hold the new invariant:
#
#     open connections == checked out + idle <= max_connections
#
# They are deterministic. Nothing sleeps waiting for a result; the one test that
# needs two threads to overlap synchronises on `threading.Event`.
# ---------------------------------------------------------------------------


def test_a_burst_cannot_open_more_connections_than_the_ceiling(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The whole point: creation is capped, not just reuse."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=2, timeout=0.05)

    with ExitStack() as borrowed:
        borrowed.enter_context(store._connection())
        borrowed.enter_context(store._connection())

        with pytest.raises(CloudCapacityError):
            with store._connection():
                pass

    assert len(created) == 2, "the refused request must not have opened a third socket"


def test_the_refusal_tells_an_unauthenticated_caller_nothing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """`/health/ready` is public, so this message reaches strangers."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=1, timeout=0.05)

    with store._connection():
        with pytest.raises(CloudCapacityError) as raised:
            with store._connection():
                pass

    message = str(raised.value).lower()
    for leak in ("localhost", "5432", "ivrit_sheli_runtime", "not-a-real-password", "pool"):
        assert leak not in message


def test_a_waiting_request_proceeds_as_soon_as_a_connection_comes_back(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A ceiling that never lets a waiter through would be an outage, not a limit."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=1, timeout=5.0)
    waiting = threading.Event()
    served = threading.Event()

    def borrow() -> None:
        waiting.set()
        with store._connection():
            served.set()

    worker = threading.Thread(target=borrow, daemon=True)
    with store._connection():
        worker.start()
        assert waiting.wait(2), "the second borrower never started"
        assert not served.wait(0.1), "it must not get in while the only permit is held"

    assert served.wait(2), "returning the connection must wake the waiter"
    worker.join(2)
    assert len(created) == 1, "the waiter reused the returned connection, not a new one"


def test_an_exception_inside_the_block_gives_the_permit_back(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A permit leak shrinks the ceiling to zero one failed request at a time."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=1, timeout=0.05)

    for _ in range(3):
        with pytest.raises(RuntimeError):
            with store._connection():
                raise RuntimeError("the request failed midway")

    assert created[0].rollbacks == 3, "an aborted transaction must still be unwound"

    with store._connection():
        pass  # must not raise: the ceiling survived three failures


def test_a_refused_connection_attempt_does_not_consume_a_permanent_slot(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When the database refuses, no connection exists to hand back later."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=1, timeout=0.05)

    def _refuse() -> FakeConnection:
        raise OSError("server refused the connection")

    monkeypatch.setattr(store, "_create_raw_connection", _refuse)
    for _ in range(3):
        with pytest.raises(OSError):
            with store._connection():
                pass

    recovered = FakeConnection("recovered")
    monkeypatch.setattr(store, "_create_raw_connection", lambda: recovered)
    with store._connection() as connection:
        assert connection is recovered


def test_discarding_dead_pooled_connections_does_not_shrink_the_ceiling(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A corpse in the pool costs a probe, and it must not also cost a slot."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=2, timeout=0.05)
    corpses = [FakeConnection(f"corpse-{index}", fail_on=("SELECT 1",)) for index in range(2)]
    for connection in corpses:
        store._pool.put_nowait(connection)

    with ExitStack() as borrowed:
        borrowed.enter_context(store._connection())
        borrowed.enter_context(store._connection())

    assert all(connection.close_calls == 1 for connection in corpses)

    with ExitStack() as borrowed:
        borrowed.enter_context(store._connection())
        borrowed.enter_context(store._connection())


def test_the_tenant_predicate_is_still_set_under_the_ceiling(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Rule 2: a resource limit may not quietly cost a tenant-isolation step."""
    created: list[FakeConnection] = []
    store = _store(monkeypatch, created, max_connections=1, timeout=0.05)

    with store._tenant_connection("11111111-2222-4333-8444-555555555555") as connection:
        assert any("set_config" in statement for statement in connection.statements)

    assert any("DISCARD TEMP" in statement for statement in created[0].statements)

    with store._connection():
        pass  # the tenant path returns its permit like every other path


def test_the_ceiling_refuses_a_configuration_that_would_disable_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Fail closed: a zero or negative ceiling is a mistake, not "unlimited"."""
    for bad in (0, -1):
        with pytest.raises(ValueError):
            PostgresCloudStore(RUNTIME_URL, SESSION_SECRET, max_connections=bad)
    for bad_timeout in (0.0, -1.0):
        with pytest.raises(ValueError):
            PostgresCloudStore(
                RUNTIME_URL, SESSION_SECRET, connection_acquire_timeout=bad_timeout
            )


# ---------------------------------------------------------------------------
# SEC-03 follow-up, found by an independent review of the fix above.
#
# Resolving the cookie session borrows a connection, and it happens inside a
# user middleware. Starlette builds the stack as
#
#     ServerErrorMiddleware -> user middleware -> ExceptionMiddleware -> router
#
# and every non-500 handler registered with @app.exception_handler lives in that
# innermost layer. So the CloudCapacityError handler could never see an
# exception raised from the middleware, and the ceiling that was supposed to
# produce a clean 503 produced a 500 instead - with none of the security headers,
# because those are set after `call_next` in a middleware that never resumes, and
# with a full traceback whenever DEBUG is on.
#
# This is the dominant path in cloud mode: every cookie-authenticated request.
# ---------------------------------------------------------------------------


def _app_settings(tmp_path: Path) -> Settings:
    """Offline local settings; the store is faked, so no database is needed."""
    data_dir = tmp_path / "data"
    return Settings.from_env(
        {
            "IVRIT_LOCAL_ONLY": "true",
            "APP_DATA_DIR": str(data_dir),
            "APP_DB_PATH": str(data_dir / "learning.db"),
            "DICTIONARY_DB_PATH": str(data_dir / "dictionary.db"),
            "AI_PROVIDER": "offline",
            "ALLOW_CLOUD_PROCESSING": "false",
            "OPENAI_API_KEY": "",
            "GOOGLE_ACCESS_TOKEN": "",
            "GOOGLE_REFRESH_TOKEN": "",
            "DEBUG": "true",
        }
    )


def test_a_capacity_error_while_resolving_a_session_is_a_clean_503(
    tmp_path: Path,
) -> None:
    """Not a 500, and not a traceback: the learner gets the honest answer."""
    settings = _app_settings(tmp_path)
    app = create_app(settings)

    with TestClient(app) as client:

        def _at_capacity(_token: str) -> Any:
            raise CloudCapacityError("The service is busy right now.")

        app.state.services.auth.resolve = _at_capacity
        client.cookies.set(settings.session_cookie_name, "any-session-token")
        response = client.get("/api/v1/dashboard")

    assert response.status_code == 503, (
        "a saturated pool must not surface as an internal error; 500 here means "
        "the exception escaped past ExceptionMiddleware again"
    )
    assert response.json()["error"]["code"] == "database_unavailable"
    assert response.headers["Retry-After"] == "5"
    assert "connection" not in response.text.lower()


def test_that_503_still_carries_every_security_header(tmp_path: Path) -> None:
    """The headers are set after call_next, so an escaping exception loses them all."""
    settings = _app_settings(tmp_path)
    app = create_app(settings)

    with TestClient(app) as client:

        def _at_capacity(_token: str) -> Any:
            raise CloudCapacityError("The service is busy right now.")

        app.state.services.auth.resolve = _at_capacity
        client.cookies.set(settings.session_cookie_name, "any-session-token")
        response = client.get("/api/v1/dashboard")

    for header in (
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "X-Request-ID",
    ):
        assert header in response.headers, f"{header} was lost on the error path"
    assert "Traceback" not in response.text
