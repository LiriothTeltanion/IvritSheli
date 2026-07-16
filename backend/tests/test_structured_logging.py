"""Structured logging schema and literal secret-redaction tests."""

from __future__ import annotations

import json
import logging

from ivrit_sheli.structured_logging import JsonFormatter, configure_json_logging, redact


def test_json_formatter_has_operational_schema_and_scrubs_literal_secrets() -> None:
    session_value = "session-value-that-must-never-appear"
    oauth_value = "oauth-code-that-must-never-appear"
    bearer_value = "Bearer abcdefghijklmnopqrstuvwxyz012345"
    record = logging.LogRecord(
        name="ivrit_sheli.api",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg=(
            f"request session_token={session_value} oauth_code={oauth_value} "
            f"authorization={bearer_value} state=oauth-browser-state-private"
        ),
        args=(),
        exc_info=None,
    )
    record.event = "http.request.completed"
    record.request_id = "request-123"
    record.method = "POST"
    record.route = "/api/v1/items"
    record.status = 201
    record.duration_ms = 4.2
    record.version = "2.2.0"

    rendered = JsonFormatter().format(record)
    payload = json.loads(rendered)
    assert payload["event"] == "http.request.completed"
    assert payload["request_id"] == "request-123"
    assert payload["route"] == "/api/v1/items"
    assert session_value not in rendered
    assert oauth_value not in rendered
    assert "abcdefghijklmnopqrstuvwxyz012345" not in rendered
    assert "oauth-browser-state-private" not in rendered
    assert "[REDACTED]" in rendered


def test_recursive_redaction_covers_headers_pii_and_personal_learning_text() -> None:
    source = {
        "headers": {"Authorization": "Bearer private", "Cookie": "session=private"},
        "email": "private@example.test",
        "answer_text": "personal learner answer",
        "safe": {"status": "ok"},
    }
    sanitized = redact(source)
    assert sanitized["headers"]["Authorization"] == "[REDACTED]"
    assert sanitized["headers"]["Cookie"] == "[REDACTED]"
    assert sanitized["email"] == "[REDACTED]"
    assert sanitized["answer_text"] == "[REDACTED]"
    assert sanitized["safe"] == {"status": "ok"}


def test_formatter_scrubs_database_dsn_userinfo_and_owns_uvicorn_loggers() -> None:
    record = logging.LogRecord(
        name="ivrit_sheli.database",
        level=logging.ERROR,
        pathname=__file__,
        lineno=1,
        msg="connect failed postgresql://private-user:private-password@db.internal/ivrit",
        args=(),
        exc_info=None,
    )
    rendered = JsonFormatter().format(record)
    assert "private-user" not in rendered
    assert "private-password" not in rendered
    assert "postgresql://[REDACTED]@db.internal/ivrit" in rendered

    token_only_record = logging.LogRecord(
        name="ivrit_sheli.database",
        level=logging.ERROR,
        pathname=__file__,
        lineno=1,
        msg="connect failed redis://private-bearer-token@cache.internal/0",
        args=(),
        exc_info=None,
    )
    token_only_rendered = JsonFormatter().format(token_only_record)
    assert "private-bearer-token" not in token_only_rendered
    assert "redis://[REDACTED]@cache.internal/0" in token_only_rendered

    configure_json_logging("INFO")
    root = logging.getLogger()
    assert len(root.handlers) == 1
    assert isinstance(root.handlers[0].formatter, JsonFormatter)
    assert logging.getLogger("uvicorn.access").handlers == []
    assert logging.getLogger("uvicorn.access").propagate is True
