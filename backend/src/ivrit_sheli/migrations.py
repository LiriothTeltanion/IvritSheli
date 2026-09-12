"""Programmatic Alembic migration entry point for controlled deployment startup."""

from __future__ import annotations

import os
from pathlib import Path

MIGRATION_HEAD = "20260826_0007"


def upgrade_postgres(migration_database_url: str, backend_dir: Path) -> None:
    """Upgrade PostgreSQL to the latest versioned schema.

    The caller must supply an administrator URL explicitly. Runtime application code never
    calls this function and Alembic deliberately ignores ``DATABASE_URL``.
    """
    try:
        from alembic import command
        from alembic.config import Config
    except ImportError as error:  # pragma: no cover - dependency failure is actionable
        raise RuntimeError("PostgreSQL migrations require Alembic") from error

    config = Config(str(backend_dir / "alembic.ini"))
    previous = os.environ.get("MIGRATION_DATABASE_URL")
    os.environ["MIGRATION_DATABASE_URL"] = migration_database_url
    try:
        command.upgrade(config, "head")
    finally:
        if previous is None:
            os.environ.pop("MIGRATION_DATABASE_URL", None)
        else:
            os.environ["MIGRATION_DATABASE_URL"] = previous
