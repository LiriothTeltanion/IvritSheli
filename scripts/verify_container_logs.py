"""Validate that container output is structured JSON and contains no supplied secrets."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, TextIO


REQUIRED_FIELDS = {"timestamp", "level", "logger", "message"}


def validate_stream(stream: TextIO, forbidden: tuple[str, ...]) -> int:
    """Return the number of validated records or raise a precise validation error."""
    records = 0
    for line_number, raw_line in enumerate(stream, start=1):
        line = raw_line.strip()
        if not line:
            continue
        try:
            payload: Any = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"line {line_number} is not valid JSON: {error.msg}") from error
        if not isinstance(payload, dict):
            raise ValueError(f"line {line_number} must contain a JSON object")
        missing = REQUIRED_FIELDS.difference(payload)
        if missing:
            raise ValueError(
                f"line {line_number} is missing required fields: {', '.join(sorted(missing))}"
            )
        serialized = json.dumps(payload, ensure_ascii=False)
        leaked = [secret for secret in forbidden if secret and secret in serialized]
        if leaked:
            raise ValueError(f"line {line_number} contains a forbidden literal")
        records += 1
    if records == 0:
        raise ValueError("no structured log records were found")
    return records


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, help="Log file to inspect; stdin is used by default")
    parser.add_argument(
        "--forbid",
        action="append",
        default=[],
        help="Literal that must not appear; may be supplied more than once",
    )
    return parser.parse_args()


def main() -> int:
    """Run the validator and print a machine-readable success summary."""
    args = parse_args()
    try:
        if args.file:
            with args.file.open(encoding="utf-8") as stream:
                records = validate_stream(stream, tuple(args.forbid))
        else:
            records = validate_stream(sys.stdin, tuple(args.forbid))
    except (OSError, ValueError) as error:
        print(f"container_log_validation=FAIL error={error}", file=sys.stderr)
        return 1
    print(f"container_log_validation=PASS records={records}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
