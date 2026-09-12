"""Web Push encryption, scheduling, concurrency, and isolation regressions."""

from __future__ import annotations

import importlib
import json
import logging
import socket
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, time, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import psycopg
import pytest

import ivrit_sheli.push_notifications as push_module
from ivrit_sheli.cloud_repository import CloudLearningRepository
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.db_admin import (
    parse_database_target,
    validate_database_boundary,
    validate_push_database_boundary,
)
from ivrit_sheli.push_notifications import (
    PushConfigurationError,
    assert_public_push_endpoint,
    decrypt_subscription,
    encrypt_subscription,
    endpoint_hash,
    is_quiet_time,
    main,
    reminder_is_due,
    send_due_notifications,
    validate_subscription,
)

PUSH_SECRET = "push-encryption-test-secret-at-least-32-characters"
PUSH_DATABASE_URL = (
    "postgresql://ivrit_sheli_push_worker:push-only@localhost/ivrit_sheli"
)
FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send"


def _subscription(device: str = "device") -> dict[str, Any]:
    return {
        "endpoint": f"{FCM_ENDPOINT}/{device}",
        "expirationTime": None,
        "keys": {
            "p256dh": f"test-public-device-key-{device}",
            "auth": f"test-auth-secret-{device}",
        },
    }


def _preferences(**overrides: Any) -> dict[str, Any]:
    return {
        "enabled": True,
        "locale": "es",
        "timezone": "Asia/Jerusalem",
        "preferred_time": "19:00",
        "weekly_rest_day": 5,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "08:00",
        **overrides,
    }


def test_subscription_is_validated_hashed_and_encrypted_without_plaintext() -> None:
    payload = _subscription()
    subscription = validate_subscription(payload)

    hashed_endpoint = endpoint_hash(subscription.endpoint, PUSH_SECRET)
    ciphertext = encrypt_subscription(subscription, PUSH_SECRET)

    assert len(hashed_endpoint) == 64
    assert subscription.endpoint not in ciphertext
    assert subscription.p256dh not in ciphertext
    assert subscription.auth not in ciphertext
    assert decrypt_subscription(ciphertext, PUSH_SECRET) == payload
    with pytest.raises(PushConfigurationError, match="cannot be decrypted"):
        decrypt_subscription(ciphertext, f"{PUSH_SECRET}-different")


@pytest.mark.parametrize(
    "payload",
    [
        {
            "endpoint": "http://fcm.googleapis.com/fcm/send/device",
            "keys": {"p256dh": "a", "auth": "b"},
        },
        {
            "endpoint": "https://localhost/push",
            "keys": {"p256dh": "a", "auth": "b"},
        },
        {
            "endpoint": "https://127.0.0.1/push",
            "keys": {"p256dh": "a", "auth": "b"},
        },
        {
            "endpoint": "https://push.example.test/device",
            "keys": {"p256dh": "a", "auth": "b"},
        },
        {
            "endpoint": "https://fcm.googleapis.com:8443/fcm/send/device",
            "keys": {"p256dh": "a", "auth": "b"},
        },
        {
            "endpoint": "https://user:password@fcm.googleapis.com/fcm/send/device",
            "keys": {"p256dh": "a", "auth": "b"},
        },
        {"endpoint": f"{FCM_ENDPOINT}/device", "keys": {}},
        {
            "endpoint": f"{FCM_ENDPOINT}/device",
            "expirationTime": "not-a-time",
            "keys": {"p256dh": "a", "auth": "b"},
        },
    ],
)
def test_invalid_subscription_documents_are_rejected(payload: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        validate_subscription(payload)


def test_push_endpoint_dns_must_resolve_only_to_global_addresses(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    endpoint = f"{FCM_ENDPOINT}/dns-check"

    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *_args, **_kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("142.250.185.202", 443)),
            (socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2607:f8b0:4001:c66::5f", 443)),
        ],
    )
    assert_public_push_endpoint(endpoint)

    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *_args, **_kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("142.250.185.202", 443)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.3", 443)),
        ],
    )
    with pytest.raises(ValueError, match="non-public"):
        assert_public_push_endpoint(endpoint)

    def unavailable(*_args: Any, **_kwargs: Any) -> list[Any]:
        raise OSError("resolver unavailable")

    monkeypatch.setattr(socket, "getaddrinfo", unavailable)
    with pytest.raises(ValueError, match="could not be resolved"):
        assert_public_push_endpoint(endpoint)


def test_quiet_hours_support_daytime_overnight_and_disabled_windows() -> None:
    assert is_quiet_time(time(13, 0), time(12, 0), time(14, 0))
    assert not is_quiet_time(time(15, 0), time(12, 0), time(14, 0))
    assert is_quiet_time(time(23, 0), time(22, 0), time(8, 0))
    assert is_quiet_time(time(7, 30), time(22, 0), time(8, 0))
    assert not is_quiet_time(time(12, 0), time(22, 0), time(8, 0))
    assert not is_quiet_time(time(12, 0), time(8, 0), time(8, 0))


@pytest.mark.parametrize(
    ("now", "rest_day", "last_sent", "expected"),
    [
        (datetime(2026, 7, 27, 18, 59), 5, None, False),
        (datetime(2026, 7, 27, 19, 0), 5, None, True),
        (datetime(2026, 7, 27, 23, 0), 5, None, False),
        (datetime(2026, 7, 25, 20, 0), 5, None, False),
        (datetime(2026, 7, 27, 20, 0), 5, date(2026, 7, 27), False),
    ],
)
def test_reminder_due_applies_time_rest_quiet_and_daily_cap(
    now: datetime,
    rest_day: int,
    last_sent: date | None,
    expected: bool,
) -> None:
    assert (
        reminder_is_due(
            now=now,
            preferred_time=time(19, 0),
            quiet_start=time(22, 0),
            quiet_end=time(8, 0),
            rest_day=rest_day,
            last_sent_local_date=last_sent,
        )
        is expected
    )


def test_memory_store_isolates_and_cascades_encrypted_push_records(tmp_path: Path) -> None:
    store = MemoryCloudStore(session_secret=PUSH_SECRET)
    alpha = store.upsert_google_user({"id": "push-alpha", "name": "Alpha"})
    beta = store.upsert_google_user({"id": "push-beta", "name": "Beta"})
    alpha_payload = _subscription("alpha")
    beta_payload = _subscription("beta")
    alpha_hash = endpoint_hash(alpha_payload["endpoint"], PUSH_SECRET)
    beta_hash = endpoint_hash(beta_payload["endpoint"], PUSH_SECRET)
    alpha_ciphertext = encrypt_subscription(
        validate_subscription(alpha_payload),
        PUSH_SECRET,
    )
    beta_ciphertext = encrypt_subscription(
        validate_subscription(beta_payload),
        PUSH_SECRET,
    )

    store.upsert_push_subscription(
        alpha.id,
        alpha_hash,
        alpha_ciphertext,
        _preferences(),
        None,
    )
    store.upsert_push_subscription(
        beta.id,
        beta_hash,
        beta_ciphertext,
        _preferences(locale="en", preferred_time="18:00"),
        None,
    )

    assert store.delete_push_subscription(alpha.id, beta_hash) is False
    store.update_push_subscription_preferences(
        alpha.id,
        _preferences(enabled=False, preferred_time="20:15"),
    )
    alpha_record = store._push_subscriptions[(alpha.id, alpha_hash)]
    beta_record = store._push_subscriptions[(beta.id, beta_hash)]
    assert alpha_record["subscription_ciphertext"] == alpha_ciphertext
    assert beta_record["subscription_ciphertext"] == beta_ciphertext
    assert alpha_record["enabled"] is False
    assert alpha_record["preferred_time"] == "20:15"
    assert beta_record["enabled"] is True
    assert beta_record["preferred_time"] == "18:00"
    assert alpha_payload["endpoint"] not in str(store._push_subscriptions)
    assert beta_payload["endpoint"] not in str(store._push_subscriptions)

    repository = CloudLearningRepository(store, alpha.id, alpha.display_name)
    snapshot = store.read_state(alpha.id)
    assert "push_subscriptions" not in snapshot["tables"]
    export_path = repository.export_json(tmp_path / "alpha-export.json")
    export_payload = json.loads(export_path.read_text(encoding="utf-8"))
    assert "push_subscriptions" not in export_payload["tables"]
    assert "notification_preferences" in export_payload["tables"]

    store.upsert_push_subscription(
        beta.id,
        alpha_hash,
        alpha_ciphertext,
        _preferences(locale="en"),
        None,
    )
    assert (alpha.id, alpha_hash) not in store._push_subscriptions
    assert (beta.id, alpha_hash) in store._push_subscriptions
    assert sum(
        key[1] == alpha_hash for key in store._push_subscriptions
    ) == 1
    assert store.delete_push_subscription(alpha.id, alpha_hash) is False

    store.delete_user(alpha.id)
    assert not any(key[0] == alpha.id for key in store._push_subscriptions)
    assert (beta.id, beta_hash) in store._push_subscriptions
    assert (beta.id, alpha_hash) in store._push_subscriptions


def test_push_database_boundary_requires_a_distinct_dedicated_role() -> None:
    migration, runtime = validate_database_boundary(
        "postgresql://owner:admin@postgres/ivrit_sheli",
        "postgresql://ivrit_sheli_runtime:runtime@postgres/ivrit_sheli",
    )
    accepted = validate_push_database_boundary(
        migration,
        runtime,
        "postgresql://ivrit_sheli_push_worker:push@postgres/ivrit_sheli",
    )
    assert accepted.user == "ivrit_sheli_push_worker"

    with pytest.raises(ValueError, match="authenticate directly"):
        validate_push_database_boundary(
            migration,
            runtime,
            "postgresql://owner:push@postgres/ivrit_sheli",
        )
    with pytest.raises(ValueError, match="same host, port, and database"):
        validate_push_database_boundary(
            migration,
            runtime,
            "postgresql://ivrit_sheli_push_worker:push@other/ivrit_sheli",
        )
    parsed = parse_database_target(
        "postgresql://ivrit_sheli_push_worker:push@postgres/ivrit_sheli",
        variable_name="PUSH_DATABASE_URL",
    )
    assert parsed.password == "push"


@dataclass
class _FakeSubscriptionRow:
    id: str
    user_id: str
    ciphertext: str
    locale: str = "es"
    timezone: str = "Asia/Jerusalem"
    preferred_time: time = time(19, 0)
    weekly_rest_day: int = 5
    quiet_hours_start: time = time(22, 0)
    quiet_hours_end: time = time(8, 0)
    enabled: bool = True
    expired: bool = False
    updated_order: int = 0
    failure_count: int = 0

    def result(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "subscription_ciphertext": self.ciphertext,
            "locale": self.locale,
            "timezone": self.timezone,
            "preferred_time": self.preferred_time,
            "weekly_rest_day": self.weekly_rest_day,
            "quiet_hours_start": self.quiet_hours_start,
            "quiet_hours_end": self.quiet_hours_end,
        }


class _FakeResult:
    def __init__(self, rows: list[dict[str, Any]] | None = None) -> None:
        self.rows = rows or []

    def fetchone(self) -> dict[str, Any] | None:
        return self.rows[0] if self.rows else None

    def fetchall(self) -> list[dict[str, Any]]:
        return self.rows


@dataclass
class _FakeConnection:
    subscriptions: list[_FakeSubscriptionRow]
    locked_users: set[str] = field(default_factory=set)
    delivery_dates: dict[str, date | None] = field(default_factory=dict)
    delivery_order: dict[str, int] = field(default_factory=dict)
    claim_tokens: dict[str, str] = field(default_factory=dict)
    selected_user_batches: list[list[str]] = field(default_factory=list)
    order_tick: int = 0
    commits: int = 0
    statements: list[str] = field(default_factory=list)

    def __enter__(self) -> _FakeConnection:
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def execute(
        self,
        statement: str,
        parameters: tuple[Any, ...] | None = None,
    ) -> _FakeResult:
        normalized = " ".join(statement.split())
        self.statements.append(normalized)
        parameters = parameters or ()
        if normalized == "SET statement_timeout = '10s'":
            return _FakeResult()
        if (
            normalized.startswith("UPDATE push_subscriptions")
            and "expires_at <= NOW()" in normalized
        ):
            expired_rows = []
            for selected in self.subscriptions:
                if selected.enabled and selected.expired:
                    selected.enabled = False
                    expired_rows.append({"id": selected.id})
            return _FakeResult(expired_rows)
        if normalized.startswith("SELECT candidate.user_id"):
            users = sorted(
                {row.user_id for row in self.subscriptions if row.enabled},
                key=lambda user_id: (
                    user_id in self.delivery_order,
                    self.delivery_order.get(user_id, 0),
                    user_id,
                ),
            )
            selected = users[: int(parameters[0])]
            self.selected_user_batches.append(selected)
            return _FakeResult([{"user_id": user_id} for user_id in selected])
        if normalized.startswith("INSERT INTO push_delivery_state"):
            user_id = str(parameters[0])
            self.delivery_dates.setdefault(user_id, None)
            self.delivery_order.setdefault(user_id, 0)
            return _FakeResult()
        if (
            normalized.startswith("UPDATE push_delivery_state")
            and "SET claim_token = %s::uuid" in normalized
        ):
            claim_token, _seconds, user_id = map(str, parameters)
            if user_id in self.locked_users or user_id in self.claim_tokens:
                return _FakeResult()
            self.claim_tokens[user_id] = claim_token
            self._touch_delivery(user_id)
            return _FakeResult(
                [{"last_sent_local_date": self.delivery_dates.get(user_id)}]
            )
        if normalized.startswith(
            "SELECT id, subscription_ciphertext, locale, timezone"
        ):
            user_id = str(parameters[0])
            candidates = sorted(
                (
                    row
                    for row in self.subscriptions
                    if row.user_id == user_id and row.enabled
                ),
                key=lambda row: (-row.updated_order, row.id),
            )
            return _FakeResult([candidates[0].result()] if candidates else [])
        if (
            normalized.startswith("UPDATE push_delivery_state")
            and "SET last_sent_local_date =" in normalized
        ):
            local_date, user_id, claim_token = parameters
            if self.claim_tokens.get(str(user_id)) != str(claim_token):
                return _FakeResult()
            self.delivery_dates[str(user_id)] = local_date
            return _FakeResult([{"user_id": str(user_id)}])
        if (
            normalized.startswith("UPDATE push_delivery_state")
            and "SET claim_token = NULL" in normalized
        ):
            user_id, claim_token = map(str, parameters)
            if self.claim_tokens.get(user_id) == claim_token:
                self.claim_tokens.pop(user_id)
                self._touch_delivery(user_id)
            return _FakeResult()
        if (
            normalized.startswith("UPDATE push_subscriptions")
            and "SET enabled = FALSE" in normalized
        ):
            selected = self._subscription(str(parameters[0]))
            selected.enabled = False
            selected.failure_count += 1
            return _FakeResult()
        if (
            normalized.startswith("UPDATE push_subscriptions")
            and "SET enabled = CASE" in normalized
        ):
            expired = len(parameters) == 2 and bool(parameters[0])
            subscription_id = str(parameters[-1])
            selected = self._subscription(subscription_id)
            selected.failure_count += 1
            if expired or selected.failure_count >= 3:
                selected.enabled = False
            return _FakeResult()
        if (
            normalized.startswith("UPDATE push_subscriptions")
            and "SET failure_count = 0" in normalized
        ):
            selected = self._subscription(str(parameters[0]))
            selected.failure_count = 0
            return _FakeResult()
        raise AssertionError(f"Unexpected worker SQL: {normalized}")

    def commit(self) -> None:
        self.commits += 1

    def _subscription(self, subscription_id: str) -> _FakeSubscriptionRow:
        return next(row for row in self.subscriptions if row.id == subscription_id)

    def _touch_delivery(self, user_id: str) -> None:
        self.order_tick += 1
        self.delivery_order[user_id] = self.order_tick


class _FakeWebPushException(Exception):
    def __init__(self, status_code: int) -> None:
        super().__init__("provider failure")
        self.response = SimpleNamespace(status_code=status_code)


def _ciphertext(device: str) -> str:
    return encrypt_subscription(validate_subscription(_subscription(device)), PUSH_SECRET)


def _install_worker_dependencies(
    monkeypatch: pytest.MonkeyPatch,
    connection: _FakeConnection,
    webpush: Callable[..., None],
) -> None:
    real_import_module = importlib.import_module

    def import_module(name: str) -> Any:
        if name == "pywebpush":
            return SimpleNamespace(
                webpush=webpush,
                WebPushException=_FakeWebPushException,
            )
        return real_import_module(name)

    monkeypatch.setattr(psycopg, "connect", lambda *_args, **_kwargs: connection)
    monkeypatch.setattr(importlib, "import_module", import_module)
    monkeypatch.setattr(
        push_module,
        "assert_public_push_endpoint",
        lambda _endpoint: None,
    )


def _run_worker() -> dict[str, int]:
    return send_due_notifications(
        database_url=PUSH_DATABASE_URL,
        encryption_secret=PUSH_SECRET,
        vapid_private_key="test-vapid-private-key",
        vapid_subject="mailto:test@example.test",
        now_utc=datetime(2026, 7, 27, 17, 30, tzinfo=timezone.utc),
    )


def test_worker_rejects_runtime_or_migration_database_credentials() -> None:
    with pytest.raises(PushConfigurationError, match="must use"):
        send_due_notifications(
            database_url="postgresql://ivrit_sheli_runtime:password@localhost/ivrit",
            encryption_secret=PUSH_SECRET,
            vapid_private_key="vapid",
            vapid_subject="mailto:test@example.test",
        )
    with pytest.raises(PushConfigurationError, match="must use"):
        send_due_notifications(
            database_url="postgresql://owner:password@localhost/ivrit",
            encryption_secret=PUSH_SECRET,
            vapid_private_key="vapid",
            vapid_subject="mailto:test@example.test",
        )


def test_worker_requires_independent_push_encryption_key() -> None:
    with pytest.raises(PushConfigurationError, match="PUSH_ENCRYPTION_KEY"):
        send_due_notifications(
            database_url=PUSH_DATABASE_URL,
            encryption_secret="short",
            vapid_private_key="vapid",
            vapid_subject="mailto:test@example.test",
        )


@pytest.mark.parametrize(
    "subject",
    (
        "test@example.test",
        "http://example.test/operator",
        "ftp://example.test/operator",
        "https://user:password@example.test/operator",
    ),
)
def test_worker_rejects_invalid_vapid_subject_before_database_access(
    subject: str,
) -> None:
    with pytest.raises(PushConfigurationError, match="VAPID_SUBJECT"):
        send_due_notifications(
            database_url=PUSH_DATABASE_URL,
            encryption_secret=PUSH_SECRET,
            vapid_private_key="vapid",
            vapid_subject=subject,
        )


def test_worker_rejects_naive_clock_before_opening_database() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        send_due_notifications(
            database_url=PUSH_DATABASE_URL,
            encryption_secret=PUSH_SECRET,
            vapid_private_key="vapid",
            vapid_subject="mailto:test@example.test",
            now_utc=datetime(2026, 7, 27, 17, 30),
        )


def test_two_devices_receive_at_most_one_notification_per_learner_and_day(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = _FakeConnection(
        [
            _FakeSubscriptionRow("older", "learner", _ciphertext("older"), updated_order=1),
            _FakeSubscriptionRow("newer", "learner", _ciphertext("newer"), updated_order=2),
        ]
    )
    delivered: list[str] = []

    def webpush(**kwargs: Any) -> None:
        delivered.append(str(kwargs["subscription_info"]["endpoint"]))

    _install_worker_dependencies(monkeypatch, connection, webpush)

    first = _run_worker()
    second = _run_worker()

    assert first == {
        "considered": 1,
        "sent": 1,
        "expired": 0,
        "failed": 0,
        "claimed_elsewhere": 0,
        "budget_deferred": 0,
    }
    assert second == {
        "considered": 1,
        "sent": 0,
        "expired": 0,
        "failed": 0,
        "claimed_elsewhere": 0,
        "budget_deferred": 0,
    }
    assert delivered == [f"{FCM_ENDPOINT}/newer"]
    assert connection.delivery_dates == {"learner": date(2026, 7, 27)}


def test_overlapping_worker_claim_prevents_a_second_delivery(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = _FakeConnection(
        [_FakeSubscriptionRow("device", "learner", _ciphertext("device"))],
        locked_users={"learner"},
    )
    delivered: list[str] = []
    _install_worker_dependencies(
        monkeypatch,
        connection,
        lambda **_kwargs: delivered.append("sent"),
    )

    result = _run_worker()

    assert result["claimed_elsewhere"] == 1
    assert result["sent"] == 0
    assert delivered == []


def test_expired_timestamp_is_disabled_without_blocking_other_learners(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    expired = _FakeSubscriptionRow(
        "expired-device",
        "alpha",
        _ciphertext("expired-device"),
        expired=True,
    )
    active = _FakeSubscriptionRow("active-device", "beta", _ciphertext("active-device"))
    connection = _FakeConnection([expired, active])
    delivered: list[str] = []
    _install_worker_dependencies(
        monkeypatch,
        connection,
        lambda **kwargs: delivered.append(str(kwargs["subscription_info"]["endpoint"])),
    )

    result = _run_worker()

    assert result["considered"] == 1
    assert result["expired"] == 1
    assert result["sent"] == 1
    assert expired.enabled is False
    assert active.enabled is True
    assert delivered == [f"{FCM_ENDPOINT}/active-device"]


def test_corrupt_ciphertext_disables_only_that_device_and_next_user_continues(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    corrupt = _FakeSubscriptionRow("bad-device", "alpha", "not-fernet", updated_order=2)
    healthy_same_user = _FakeSubscriptionRow(
        "alpha-backup",
        "alpha",
        _ciphertext("alpha-backup"),
        updated_order=1,
    )
    healthy_next_user = _FakeSubscriptionRow(
        "beta-device",
        "beta",
        _ciphertext("beta-device"),
    )
    connection = _FakeConnection([corrupt, healthy_same_user, healthy_next_user])
    delivered: list[str] = []
    _install_worker_dependencies(
        monkeypatch,
        connection,
        lambda **kwargs: delivered.append(str(kwargs["subscription_info"]["endpoint"])),
    )

    result = _run_worker()

    assert result == {
        "considered": 2,
        "sent": 1,
        "expired": 0,
        "failed": 1,
        "claimed_elsewhere": 0,
        "budget_deferred": 0,
    }
    assert corrupt.enabled is False
    assert healthy_same_user.enabled is True
    assert healthy_next_user.enabled is True
    assert delivered == [f"{FCM_ENDPOINT}/beta-device"]


@pytest.mark.parametrize("provider_error", [_FakeWebPushException(410), RuntimeError("down")])
def test_provider_failure_is_bounded_and_next_learner_continues(
    monkeypatch: pytest.MonkeyPatch,
    provider_error: Exception,
) -> None:
    alpha = _FakeSubscriptionRow("alpha-device", "alpha", _ciphertext("alpha-device"))
    beta = _FakeSubscriptionRow("beta-device", "beta", _ciphertext("beta-device"))
    connection = _FakeConnection([alpha, beta])
    calls = 0

    def webpush(**_kwargs: Any) -> None:
        nonlocal calls
        calls += 1
        if calls == 1:
            raise provider_error

    _install_worker_dependencies(monkeypatch, connection, webpush)

    result = _run_worker()

    assert calls == 2
    assert result["sent"] == 1
    assert result["expired"] == (
        1 if isinstance(provider_error, _FakeWebPushException) else 0
    )
    assert result["failed"] == (
        0 if isinstance(provider_error, _FakeWebPushException) else 1
    )
    assert connection.delivery_dates == {
        "alpha": date(2026, 7, 27),
        "beta": date(2026, 7, 27),
    }


def test_worker_rotates_a_limited_batch_without_starving_later_users(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = _FakeConnection(
        [
            _FakeSubscriptionRow(
                f"{user}-device",
                user,
                _ciphertext(f"{user}-device"),
            )
            for user in ("alpha", "beta", "gamma")
        ]
    )
    delivered: list[str] = []
    _install_worker_dependencies(
        monkeypatch,
        connection,
        lambda **kwargs: delivered.append(
            str(kwargs["subscription_info"]["endpoint"])
        ),
    )
    monkeypatch.setattr(push_module, "MAX_PUSH_USERS_PER_RUN", 2)

    first = _run_worker()
    second = _run_worker()

    assert first["sent"] == 2
    assert second["sent"] == 1
    assert connection.selected_user_batches == [
        ["alpha", "beta"],
        ["gamma", "alpha"],
    ]
    assert delivered == [
        f"{FCM_ENDPOINT}/alpha-device",
        f"{FCM_ENDPOINT}/beta-device",
        f"{FCM_ENDPOINT}/gamma-device",
    ]


def test_worker_stops_before_the_next_user_when_runtime_budget_is_exhausted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = _FakeConnection(
        [
            _FakeSubscriptionRow(
                f"{user}-device",
                user,
                _ciphertext(f"{user}-device"),
            )
            for user in ("alpha", "beta", "gamma")
        ]
    )
    delivered: list[str] = []
    _install_worker_dependencies(
        monkeypatch,
        connection,
        lambda **kwargs: delivered.append(
            str(kwargs["subscription_info"]["endpoint"])
        ),
    )
    clock = iter((0.0, 0.5, 1.0))
    monkeypatch.setattr(push_module, "monotonic", lambda: next(clock))
    monkeypatch.setattr(push_module, "MAX_PUSH_RUN_SECONDS", 1.0)

    result = _run_worker()

    assert result["considered"] == 1
    assert result["sent"] == 1
    assert result["budget_deferred"] == 2
    assert delivered == [f"{FCM_ENDPOINT}/alpha-device"]


def test_worker_logs_only_aggregate_counts(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    subscription = _subscription("private-device")
    ciphertext = encrypt_subscription(
        validate_subscription(subscription),
        PUSH_SECRET,
    )
    connection = _FakeConnection(
        [_FakeSubscriptionRow("private-id", "learner", ciphertext)]
    )
    _install_worker_dependencies(monkeypatch, connection, lambda **_kwargs: None)

    with caplog.at_level(logging.INFO, logger=push_module.__name__):
        _run_worker()

    rendered = caplog.text
    assert "considered=1 sent=1" in rendered
    assert subscription["endpoint"] not in rendered
    assert subscription["keys"]["p256dh"] not in rendered
    assert subscription["keys"]["auth"] not in rendered
    assert ciphertext not in rendered


def test_cron_entrypoint_uses_only_push_database_url_and_exits(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    captured: dict[str, Any] = {}

    def fake_send(**kwargs: Any) -> dict[str, int]:
        captured.update(kwargs)
        return {
            "considered": 0,
            "sent": 0,
            "expired": 0,
            "failed": 0,
            "claimed_elsewhere": 0,
            "budget_deferred": 0,
        }

    monkeypatch.setenv("PUSH_DATABASE_URL", PUSH_DATABASE_URL)
    monkeypatch.setenv(
        "MIGRATION_DATABASE_URL",
        "postgresql://database_owner:admin-secret@localhost/ivrit_sheli",
    )
    monkeypatch.setenv("PUSH_ENCRYPTION_KEY", PUSH_SECRET)
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "vapid-private")
    monkeypatch.setenv("VAPID_SUBJECT", "mailto:test@example.test")
    monkeypatch.setattr(push_module, "send_due_notifications", fake_send)

    assert main([]) == 0
    assert captured["database_url"] == PUSH_DATABASE_URL
    assert "database_owner" not in json.dumps(captured)
    assert json.loads(capsys.readouterr().out) == {
        "budget_deferred": 0,
        "claimed_elsewhere": 0,
        "considered": 0,
        "expired": 0,
        "failed": 0,
        "sent": 0,
    }
