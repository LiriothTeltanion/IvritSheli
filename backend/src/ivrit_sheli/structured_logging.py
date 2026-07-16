"""Structured JSON logging with request correlation and defensive redaction."""

from __future__ import annotations

import hashlib
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

SENSITIVE_FRAGMENTS = (
    "authorization",
    "cookie",
    "password",
    "secret",
    "token",
    "email",
    "refresh",
    "recording",
    "transcript",
    "answer_text",
    "personal_note",
)
EXTRA_FIELDS = (
    "event",
    "request_id",
    "method",
    "route",
    "status",
    "duration_ms",
    "version",
    "commit",
    "environment",
    "user_hash",
)
KEYED_SECRET_PATTERN = re.compile(
    r"(?i)\b(authorization|cookie|password|secret|session(?:_token)?|token|"
    r"(?:oauth_)?(?:code|state)|email)"
    r"\s*[:=]\s*([^\s,;&]+)"
)
BEARER_PATTERN = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/-]{8,}")
GITHUB_TOKEN_PATTERN = re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{16,}\b")
JWT_PATTERN = re.compile(
    r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"
)
DSN_USERINFO_PATTERN = re.compile(
    r"(?i)\b(postgresql(?:\+psycopg)?|postgres|mysql|redis|https?)://"
    r"[^/@\s]+@"
)


def scrub_string(value: str) -> str:
    """Remove common bearer, OAuth, cookie, JWT, and keyed-secret representations."""
    scrubbed = DSN_USERINFO_PATTERN.sub(
        lambda match: f"{match.group(1)}://[REDACTED]@", value
    )
    scrubbed = BEARER_PATTERN.sub("Bearer_[REDACTED]", scrubbed)
    scrubbed = KEYED_SECRET_PATTERN.sub(
        lambda match: f"{match.group(1)}=[REDACTED]", scrubbed
    )
    scrubbed = GITHUB_TOKEN_PATTERN.sub("[REDACTED_GITHUB_TOKEN]", scrubbed)
    return JWT_PATTERN.sub("[REDACTED_JWT]", scrubbed)


def redact(value: Any) -> Any:
    """Recursively redact secret and high-risk PII field names."""
    if isinstance(value, dict):
        return {
            str(key): (
                "[REDACTED]"
                if any(fragment in str(key).lower() for fragment in SENSITIVE_FRAGMENTS)
                else redact(item)
            )
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [redact(item) for item in value]
    if isinstance(value, str):
        return scrub_string(value)
    return value


def privacy_user_hash(user_id: str | None, secret: str) -> str | None:
    """Create a non-reversible deployment-local user correlation value."""
    if not user_id:
        return None
    return hashlib.sha256(f"{secret}:{user_id}".encode()).hexdigest()[:16]


class JsonFormatter(logging.Formatter):
    """Render one compact JSON object per log record."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": scrub_string(record.getMessage()),
        }
        for field in EXTRA_FIELDS:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        if record.exc_info:
            payload["exception"] = scrub_string(self.formatException(record.exc_info))
        return json.dumps(redact(payload), ensure_ascii=False, separators=(",", ":"))


def configure_json_logging(level: str) -> None:
    """Install one deterministic root handler without duplicating test handlers."""
    root = logging.getLogger()
    root.setLevel(level.upper())
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root.handlers.clear()
    root.addHandler(handler)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.propagate = True
