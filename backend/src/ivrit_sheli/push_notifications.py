"""Private Web Push storage helpers and the bounded reminder cron worker."""

from __future__ import annotations

import argparse
import base64
import hashlib
import importlib
import ipaddress
import json
import logging
import os
import socket
from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from time import monotonic
from typing import Any, cast
from urllib.parse import unquote, urlparse
from uuid import uuid4
from zoneinfo import ZoneInfo

from ivrit_sheli.cloud_store import PUSH_WORKER_DATABASE_ROLE, bearer_hash

LOGGER = logging.getLogger(__name__)
GENERIC_REMINDER = {
    "title": "Ivrit Sheli",
    "body": "Your short Hebrew practice is ready.",
    "body_es": "Tu práctica breve de hebreo está lista.",
    "body_he": "התרגול הקצר שלך בעברית מוכן.",
    "url": "/?practice=ready",
}
ALLOWED_PUSH_HOST_SUFFIXES = (
    "fcm.googleapis.com",
    "push.services.mozilla.com",
    "updates.push.services.mozilla.com",
    "web.push.apple.com",
    "notify.windows.com",
)
ALLOWED_PUSH_PORTS = frozenset({None, 443})
PUSH_CLAIM_SECONDS = 300
MAX_PUSH_USERS_PER_RUN = 500
MAX_PUSH_RUN_SECONDS = 240.0


class PushConfigurationError(RuntimeError):
    """Raised when a server enables Web Push without secure key material."""


@dataclass(frozen=True, slots=True)
class PushSubscription:
    """Validated browser subscription without any learner or lesson content."""

    endpoint: str
    p256dh: str
    auth: str
    expiration_time: datetime | None

    def provider_payload(self) -> dict[str, Any]:
        """Return the standard document accepted by Web Push providers."""
        return {
            "endpoint": self.endpoint,
            "expirationTime": (
                round(self.expiration_time.timestamp() * 1000)
                if self.expiration_time is not None
                else None
            ),
            "keys": {"p256dh": self.p256dh, "auth": self.auth},
        }


def validate_subscription(payload: dict[str, Any]) -> PushSubscription:
    """Validate a browser subscription before encrypting or hashing it."""
    endpoint = str(payload.get("endpoint", "")).strip()
    parsed = urlparse(endpoint)
    try:
        port = parsed.port
    except ValueError as error:
        raise ValueError("Push endpoint must use the standard HTTPS port") from error
    if (
        parsed.scheme != "https"
        or not parsed.netloc
        or parsed.username is not None
        or parsed.password is not None
        or port not in ALLOWED_PUSH_PORTS
        or len(endpoint) > 2_048
    ):
        raise ValueError("Push endpoint must be a valid HTTPS URL")
    hostname = (parsed.hostname or "").casefold().rstrip(".")
    if not _allowed_push_hostname(hostname):
        raise ValueError("Push endpoint host is not an approved browser Push service")
    keys = payload.get("keys")
    if not isinstance(keys, dict):
        raise ValueError("Push subscription keys are required")
    p256dh = str(keys.get("p256dh", "")).strip()
    auth = str(keys.get("auth", "")).strip()
    if not p256dh or len(p256dh) > 512 or not auth or len(auth) > 256:
        raise ValueError("Push subscription keys are invalid")

    raw_expiration = payload.get("expirationTime")
    expiration_time: datetime | None = None
    if raw_expiration is not None:
        try:
            expiration_time = datetime.fromtimestamp(
                float(raw_expiration) / 1000,
                tz=timezone.utc,
            )
        except (OverflowError, TypeError, ValueError) as error:
            raise ValueError("Push expirationTime must be epoch milliseconds") from error
    return PushSubscription(endpoint, p256dh, auth, expiration_time)


def _allowed_push_hostname(hostname: str) -> bool:
    """Allow only maintained browser Push provider domains."""
    return any(
        hostname == suffix or hostname.endswith(f".{suffix}")
        for suffix in ALLOWED_PUSH_HOST_SUFFIXES
    )


def assert_public_push_endpoint(endpoint: str) -> None:
    """Resolve an allow-listed provider and reject non-public destinations."""
    parsed = urlparse(endpoint)
    hostname = (parsed.hostname or "").casefold().rstrip(".")
    if not _allowed_push_hostname(hostname):
        raise ValueError("Push endpoint host is not approved")
    try:
        addresses = socket.getaddrinfo(
            hostname,
            parsed.port or 443,
            type=socket.SOCK_STREAM,
        )
    except OSError as error:
        raise ValueError("Push endpoint host could not be resolved") from error
    if not addresses:
        raise ValueError("Push endpoint host did not resolve")
    for address in addresses:
        raw_ip = str(address[4][0]).split("%", 1)[0]
        try:
            parsed_ip = ipaddress.ip_address(raw_ip)
        except ValueError as error:
            raise ValueError("Push endpoint resolved to an invalid address") from error
        if not parsed_ip.is_global:
            raise ValueError("Push endpoint resolved to a non-public address")


def endpoint_hash(endpoint: str, encryption_secret: str) -> str:
    """Return a keyed identifier so raw provider endpoints never become lookup keys."""
    return bearer_hash(endpoint, encryption_secret)


def encrypt_subscription(subscription: PushSubscription, encryption_secret: str) -> str:
    """Encrypt a subscription document using a key derived from the deployment secret."""
    encrypted = cast(
        bytes,
        _fernet(encryption_secret).encrypt(
            json.dumps(
                subscription.provider_payload(),
                separators=(",", ":"),
            ).encode("utf-8")
        ),
    )
    return encrypted.decode("ascii")


def decrypt_subscription(ciphertext: str, encryption_secret: str) -> dict[str, Any]:
    """Decrypt one subscription only inside the sending worker."""
    try:
        decoded = cast(
            bytes,
            _fernet(encryption_secret).decrypt(ciphertext.encode("ascii")),
        )
        payload = json.loads(decoded.decode("utf-8"))
    except Exception as error:
        raise PushConfigurationError("Stored push subscription cannot be decrypted") from error
    if not isinstance(payload, dict):
        raise PushConfigurationError("Stored push subscription has an invalid shape")
    return payload


def _fernet(encryption_secret: str) -> Any:
    if len(encryption_secret) < 32:
        raise PushConfigurationError(
            "Push subscription encryption requires at least 32 characters"
        )
    try:
        fernet_module = importlib.import_module("cryptography.fernet")
    except ImportError as error:  # pragma: no cover - installation defect
        raise PushConfigurationError("cryptography is required for Web Push") from error
    digest = hashlib.blake2b(
        encryption_secret.encode("utf-8"),
        digest_size=32,
        person=b"ivrit-push-v1",
    ).digest()
    return fernet_module.Fernet(base64.urlsafe_b64encode(digest))


def is_quiet_time(now: time, quiet_start: time, quiet_end: time) -> bool:
    """Return whether a local clock time falls inside a possibly overnight window."""
    if quiet_start == quiet_end:
        return False
    if quiet_start < quiet_end:
        return quiet_start <= now < quiet_end
    return now >= quiet_start or now < quiet_end


def reminder_is_due(
    *,
    now: datetime,
    preferred_time: time,
    quiet_start: time,
    quiet_end: time,
    rest_day: int,
    last_sent_local_date: date | None,
) -> bool:
    """Apply consent, time, rest-day, quiet-hour, and once-daily gates."""
    if now.weekday() == rest_day or last_sent_local_date == now.date():
        return False
    if is_quiet_time(now.time().replace(tzinfo=None), quiet_start, quiet_end):
        return False
    return now.time().replace(tzinfo=None) >= preferred_time


def _valid_vapid_subject(subject: str) -> bool:
    """Return whether a cron-only VAPID contact uses an accepted URI scheme."""
    parsed = urlparse(subject)
    if parsed.scheme == "mailto":
        return bool(parsed.path and not parsed.netloc)
    if parsed.scheme == "https":
        return bool(
            parsed.netloc
            and parsed.username is None
            and parsed.password is None
        )
    return False


def send_due_notifications(
    *,
    database_url: str,
    encryption_secret: str,
    vapid_private_key: str,
    vapid_subject: str,
    now_utc: datetime | None = None,
) -> dict[str, int]:
    """Send at most one generic daily reminder per learner, then exit.

    A short database claim prevents overlapping cron runs from choosing the
    same learner. The local delivery date is reserved before the external
    request, favoring a missed reminder over duplicate Push messages if a
    worker crashes at the network boundary.
    """
    if (
        not database_url
        or len(encryption_secret) < 32
        or not vapid_private_key
        or not vapid_subject
    ):
        raise PushConfigurationError(
            "PUSH_DATABASE_URL, a 32-character PUSH_ENCRYPTION_KEY, "
            "VAPID_PRIVATE_KEY, and VAPID_SUBJECT are required"
        )
    if not _valid_vapid_subject(vapid_subject):
        raise PushConfigurationError(
            "VAPID_SUBJECT must be a mailto: or HTTPS contact URI"
        )
    parsed_database = urlparse(database_url)
    if unquote(parsed_database.username or "") != PUSH_WORKER_DATABASE_ROLE:
        raise PushConfigurationError(
            f"PUSH_DATABASE_URL must use the {PUSH_WORKER_DATABASE_ROLE} role"
        )
    current_utc = now_utc or datetime.now(timezone.utc)
    if current_utc.tzinfo is None or current_utc.utcoffset() is None:
        raise ValueError("now_utc must be timezone-aware")
    current_utc = current_utc.astimezone(timezone.utc)
    try:
        import psycopg
        from psycopg.rows import dict_row

        webpush_module = importlib.import_module("pywebpush")
    except ImportError as error:  # pragma: no cover - installation defect
        raise PushConfigurationError("psycopg and pywebpush are required") from error
    webpush = webpush_module.webpush
    web_push_exception = webpush_module.WebPushException

    counts = {
        "considered": 0,
        "sent": 0,
        "expired": 0,
        "failed": 0,
        "claimed_elsewhere": 0,
        "budget_deferred": 0,
    }
    deadline = monotonic() + MAX_PUSH_RUN_SECONDS
    worker_url = database_url.replace("postgres://", "postgresql://", 1)
    with psycopg.connect(worker_url, row_factory=dict_row, connect_timeout=8) as connection:
        connection.execute("SET statement_timeout = '10s'")
        connection.commit()
        expired_rows = connection.execute(
            """
            UPDATE push_subscriptions
            SET enabled = FALSE,
                updated_at = NOW()
            WHERE enabled = TRUE
              AND expires_at IS NOT NULL
              AND expires_at <= NOW()
            RETURNING id
            """
        ).fetchall()
        counts["expired"] += len(expired_rows)
        connection.commit()
        user_rows = connection.execute(
            """
            SELECT candidate.user_id
            FROM (
                SELECT DISTINCT user_id
                FROM push_subscriptions
                WHERE enabled = TRUE
                  AND (expires_at IS NULL OR expires_at > NOW())
            ) AS candidate
            LEFT JOIN push_delivery_state AS delivery
              ON delivery.user_id = candidate.user_id
            ORDER BY delivery.updated_at ASC NULLS FIRST, candidate.user_id
            LIMIT %s
            """,
            (MAX_PUSH_USERS_PER_RUN,),
        ).fetchall()
        connection.commit()
        for index, user_row in enumerate(user_rows):
            if monotonic() >= deadline:
                counts["budget_deferred"] = len(user_rows) - index
                break
            counts["considered"] += 1
            user_id = str(user_row["user_id"])
            claim_token = str(uuid4())
            connection.execute(
                """
                INSERT INTO push_delivery_state(user_id)
                VALUES(%s)
                ON CONFLICT(user_id) DO NOTHING
                """,
                (user_id,),
            )
            claim = connection.execute(
                """
                UPDATE push_delivery_state
                SET claim_token = %s::uuid,
                    claim_expires_at = NOW() + (%s * INTERVAL '1 second'),
                    updated_at = NOW()
                WHERE user_id = %s
                  AND (
                      claim_expires_at IS NULL
                      OR claim_expires_at <= NOW()
                  )
                RETURNING last_sent_local_date
                """,
                (claim_token, PUSH_CLAIM_SECONDS, user_id),
            ).fetchone()
            connection.commit()
            if claim is None:
                counts["claimed_elsewhere"] += 1
                continue
            last_sent_local_date = claim["last_sent_local_date"]
            row = connection.execute(
                """
                SELECT id, subscription_ciphertext, locale, timezone, preferred_time,
                       weekly_rest_day, quiet_hours_start, quiet_hours_end
                FROM push_subscriptions
                WHERE user_id = %s
                  AND enabled = TRUE
                  AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY updated_at DESC, id
                LIMIT 1
                """,
                (user_id,),
            ).fetchone()
            connection.commit()
            if row is None:
                _release_claim(connection, user_id, claim_token)
                continue
            try:
                local_now = current_utc.astimezone(ZoneInfo(str(row["timezone"])))
            except (KeyError, ValueError):
                counts["failed"] += 1
                _disable_subscription(connection, str(row["id"]))
                _release_claim(connection, user_id, claim_token)
                continue
            if not reminder_is_due(
                now=local_now,
                preferred_time=row["preferred_time"],
                rest_day=int(row["weekly_rest_day"]),
                quiet_start=row["quiet_hours_start"],
                quiet_end=row["quiet_hours_end"],
                last_sent_local_date=last_sent_local_date,
            ):
                _release_claim(connection, user_id, claim_token)
                continue
            try:
                provider_payload = decrypt_subscription(
                    str(row["subscription_ciphertext"]),
                    encryption_secret,
                )
                subscription = validate_subscription(provider_payload)
                assert_public_push_endpoint(subscription.endpoint)
            except (PushConfigurationError, ValueError):
                counts["failed"] += 1
                _disable_subscription(connection, str(row["id"]))
                _release_claim(connection, user_id, claim_token)
                continue

            reserved = connection.execute(
                """
                UPDATE push_delivery_state
                SET last_sent_local_date = %s,
                    updated_at = NOW()
                WHERE user_id = %s
                  AND claim_token = %s::uuid
                RETURNING user_id
                """,
                (local_now.date(), user_id, claim_token),
            ).fetchone()
            connection.commit()
            if reserved is None:
                counts["claimed_elsewhere"] += 1
                continue
            try:
                webpush(
                    subscription_info=subscription.provider_payload(),
                    data=json.dumps(
                        {
                            **GENERIC_REMINDER,
                            "locale": str(row["locale"]),
                            "path": "/?view=today",
                        },
                        ensure_ascii=False,
                    ),
                    vapid_private_key=vapid_private_key,
                    vapid_claims={"sub": vapid_subject},
                    timeout=15,
                )
            except web_push_exception as error:
                status = getattr(getattr(error, "response", None), "status_code", None)
                expired = status in {404, 410}
                counts["expired" if expired else "failed"] += 1
                connection.execute(
                    """
                    UPDATE push_subscriptions
                    SET enabled = CASE
                            WHEN %s OR failure_count + 1 >= 3 THEN FALSE
                            ELSE enabled
                        END,
                        failure_count = failure_count + 1,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (expired, row["id"]),
                )
                _release_claim(connection, user_id, claim_token)
                continue
            except Exception:
                counts["failed"] += 1
                connection.execute(
                    """
                    UPDATE push_subscriptions
                    SET enabled = CASE
                            WHEN failure_count + 1 >= 3 THEN FALSE
                            ELSE enabled
                        END,
                        failure_count = failure_count + 1,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (row["id"],),
                )
                _release_claim(connection, user_id, claim_token)
                continue
            connection.execute(
                """
                UPDATE push_subscriptions
                SET failure_count = 0,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (row["id"],),
            )
            _release_claim(connection, user_id, claim_token)
            counts["sent"] += 1
    LOGGER.info(
        (
            "Push reminder run complete: considered=%d sent=%d expired=%d "
            "failed=%d claimed_elsewhere=%d budget_deferred=%d"
        ),
        counts["considered"],
        counts["sent"],
        counts["expired"],
        counts["failed"],
        counts["claimed_elsewhere"],
        counts["budget_deferred"],
    )
    return counts


def _disable_subscription(connection: Any, subscription_id: str) -> None:
    """Disable only one unusable device subscription without exposing its endpoint."""
    connection.execute(
        """
        UPDATE push_subscriptions
        SET enabled = FALSE,
            failure_count = failure_count + 1,
            updated_at = NOW()
        WHERE id = %s
        """,
        (subscription_id,),
    )


def _release_claim(connection: Any, user_id: str, claim_token: str) -> None:
    """Release only the current worker's claim and commit the short update."""
    connection.execute(
        """
        UPDATE push_delivery_state
        SET claim_token = NULL,
            claim_expires_at = NULL,
            updated_at = NOW()
        WHERE user_id = %s
          AND claim_token = %s::uuid
        """,
        (user_id, claim_token),
    )
    connection.commit()


def main(argv: list[str] | None = None) -> int:
    """Run one Railway-compatible reminder pass and terminate."""
    parser = argparse.ArgumentParser(description="Send due Ivrit Sheli Web Push reminders")
    parser.parse_args(argv)
    result = send_due_notifications(
        database_url=os.environ.get("PUSH_DATABASE_URL", ""),
        encryption_secret=os.environ.get("PUSH_ENCRYPTION_KEY", ""),
        vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY", ""),
        vapid_subject=os.environ.get("VAPID_SUBJECT", ""),
    )
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":  # pragma: no cover - executable entry point
    raise SystemExit(main())
