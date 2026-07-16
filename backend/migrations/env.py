"""Alembic environment for Ivrit Sheli PostgreSQL cloud state."""

from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def database_url() -> str:
    """Resolve the explicit administrator URL and select psycopg's dialect."""
    value = os.environ.get("MIGRATION_DATABASE_URL")
    if not value:
        raise RuntimeError(
            "MIGRATION_DATABASE_URL is required; Alembic will not use the runtime DATABASE_URL"
        )
    value = value.replace("postgres://", "postgresql://", 1)
    if value.startswith("postgresql://"):
        value = value.replace("postgresql://", "postgresql+psycopg://", 1)
    return value


def run_migrations_offline() -> None:
    context.configure(
        url=database_url(),
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = database_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
