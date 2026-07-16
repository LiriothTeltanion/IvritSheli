"""Tests for the production container's structured-log verification gate."""

from __future__ import annotations

import importlib.util
from io import StringIO
from pathlib import Path
from types import ModuleType

import pytest


def load_verifier() -> ModuleType:
    """Load the standalone release script without making scripts a package."""
    path = Path(__file__).resolve().parents[2] / "scripts" / "verify_container_logs.py"
    spec = importlib.util.spec_from_file_location("verify_container_logs", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_accepts_complete_json_records_and_counts_them() -> None:
    verifier = load_verifier()
    stream = StringIO(
        '{"timestamp":"2026-07-16T00:00:00Z","level":"INFO",'
        '"logger":"ivrit_sheli","message":"ready"}\n'
    )
    assert verifier.validate_stream(stream, ("secret-value",)) == 1


@pytest.mark.parametrize(
    ("content", "message"),
    [
        ("plain text\n", "not valid JSON"),
        ('{"message":"missing schema"}\n', "missing required fields"),
        (
            '{"timestamp":"t","level":"INFO","logger":"app",'
            '"message":"ci-oauth-code-secret"}\n',
            "forbidden literal",
        ),
        ("\n", "no structured log records"),
    ],
)
def test_rejects_unstructured_incomplete_or_secret_bearing_output(
    content: str, message: str
) -> None:
    verifier = load_verifier()
    with pytest.raises(ValueError, match=message):
        verifier.validate_stream(StringIO(content), ("ci-oauth-code-secret",))
