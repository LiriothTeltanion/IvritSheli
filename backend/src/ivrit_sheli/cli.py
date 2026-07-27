"""
Module: command-line interface
Purpose: Initialize, seed, inspect, import, export, test, and run Ivrit Sheli from a friendly CLI.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import argparse
import json
import logging
import sqlite3
import sys
from pathlib import Path
from typing import Any

from ivrit_sheli import __version__
from ivrit_sheli.ai_engine import AIEngine
from ivrit_sheli.audio import AudioService
from ivrit_sheli.config import Settings
from ivrit_sheli.connectors import ConnectorService
from ivrit_sheli.database import Database
from ivrit_sheli.dictionary import (
    DEFAULT_DICTIONARY_URL,
    DictionaryStore,
    download_dictionary,
)
from ivrit_sheli.learning_core import CEFR_BANDS, CURRICULUM_TRACKS, LEARNER_MODES
from ivrit_sheli.repository import LearningRepository
from ivrit_sheli.seed import seed_all

LOGGER = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    """Build the documented command-line contract.

    Returns:
        Configured argument parser.

    Example:
        >>> parser = build_parser()
        >>> parser.parse_args(["--init"]).init
        True
    """
    parser = argparse.ArgumentParser(
        prog="ivrit-sheli",
        description=(
            "Private, adaptive, trilingual Hebrew learning with local-first data."
        ),
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"Ivrit Sheli Ultimate {__version__}",
    )
    parser.add_argument(
        "--init",
        action="store_true",
        help="Create local databases and the default private profile.",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Add the offline demo dictionary and starter Hebrew phrases.",
    )
    parser.add_argument(
        "--display-name",
        default="Learner",
        help="Local display name used when creating the profile.",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Run the FastAPI server with Uvicorn.",
    )
    parser.add_argument("--host", default=None, help="Override API bind host.")
    parser.add_argument("--port", type=int, default=None, help="Override API port.")
    parser.add_argument(
        "--download-dictionary",
        action="store_true",
        help="Download the allow-listed Kaikki Hebrew JSONL and import it.",
    )
    parser.add_argument(
        "--dictionary-url",
        default=DEFAULT_DICTIONARY_URL,
        help="HTTPS Kaikki dictionary URL.",
    )
    parser.add_argument(
        "--dictionary-jsonl",
        type=Path,
        help="Import an existing Kaikki/Wiktionary-style Hebrew JSONL file.",
    )
    parser.add_argument(
        "--dictionary-limit",
        type=int,
        default=None,
        help="Optional maximum records for an import preview.",
    )
    parser.add_argument(
        "--export-json",
        type=Path,
        help="Export portable learner data without provider secrets.",
    )
    parser.add_argument(
        "--import-json",
        type=Path,
        help=(
            "Atomically replace learner data from an Ivrit Sheli portable export; "
            "OAuth, sessions, provider secrets, and push endpoints are never imported."
        ),
    )
    parser.add_argument(
        "--learning-core-status",
        action="store_true",
        help="Print the local learning profile, state, skills, and retention evidence.",
    )
    parser.add_argument(
        "--set-curriculum-track",
        choices=CURRICULUM_TRACKS,
        help="Select the local curriculum track without changing Hebrew level or interface mode.",
    )
    parser.add_argument(
        "--set-cefr-band",
        type=str.upper,
        choices=CEFR_BANDS,
        help="Set the pragmatic A0-C2 learning band; this is not CEFR certification.",
    )
    parser.add_argument(
        "--set-learner-mode",
        choices=LEARNER_MODES,
        help="Set Guided, Explorer, or Experienced interface behavior independently of level.",
    )
    parser.add_argument(
        "--doctor",
        action="store_true",
        help="Check databases, dictionary, AI fallback, audio scoring, and config.",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="With --doctor, opt in to a minimal configured cloud-provider smoke test.",
    )
    parser.add_argument(
        "--log-level",
        choices=("DEBUG", "INFO", "WARNING", "ERROR"),
        default=None,
        help="Override logging level.",
    )
    return parser


def initialize_services(
    settings: Settings,
    display_name: str = "Learner",
) -> tuple[
    Database,
    DictionaryStore,
    LearningRepository,
]:
    """Initialize local stores for CLI commands.

    Args:
        settings: Runtime settings.
        display_name: Name used only when the local profile is first created.

    Returns:
        Database, dictionary, and repository.

    Raises:
        sqlite3.Error: If local persistence fails.

    Example:
        Used by `main` and `doctor_report`.
    """
    database = Database(settings.db_path)
    database.initialize()
    dictionary = DictionaryStore(settings.dictionary_db_path)
    dictionary.initialize()
    repository = LearningRepository(database)
    repository.ensure_default_profile(display_name)
    return database, dictionary, repository


def doctor_report(settings: Settings, live: bool = False) -> dict[str, Any]:
    """Run deterministic diagnostics and optional explicit live smoke tests.

    Args:
        settings: Runtime settings.
        live: Whether to call configured external services.

    Returns:
        Structured pass/warn/fail report.

    Example:
        >>> report = doctor_report(Settings.from_env({"APP_DB_PATH": ":memory:", "DICTIONARY_DB_PATH": ":memory:"}))
        >>> report["status"] in {"pass", "warn"}
        True
    """
    checks: list[dict[str, Any]] = []
    database: Database | None = None
    dictionary: DictionaryStore | None = None
    try:
        database, dictionary, repository = initialize_services(settings)
        checks.append({"name": "learning_database", "status": "pass"})
        dictionary.seed_demo()
        stats = dictionary.stats()
        checks.append(
            {
                "name": "dictionary_database",
                "status": "pass" if stats["entries"] else "fail",
                "details": stats,
            }
        )
        fts5 = sqlite_has_fts5(database.connect())
        checks.append(
            {
                "name": "sqlite_fts5",
                "status": "pass" if fts5 else "warn",
                "details": "Optional; the shipped lookup uses indexed tables and still works.",
            }
        )
        ai = AIEngine(settings, database)
        ai_result = ai.run("correct", {"text": "שלום"})
        checks.append(
            {
                "name": "offline_ai",
                "status": "pass" if ai_result["provider"] == "offline" else "pass",
                "details": {"provider": ai_result["provider"], "model": ai_result["model"]},
            }
        )
        audio = AudioService(settings, database)
        score = audio.score("שלום", "שלום")
        checks.append(
            {
                "name": "audio_recognition_match",
                "status": "pass" if score["score"] == 100 else "fail",
                "details": {
                    "score": score["score"],
                    "method": score["method"],
                    "assessment_type": score["assessment_type"],
                },
            }
        )
        connectors = ConnectorService(settings, database)
        checks.append(
            {
                "name": "connector_registry",
                "status": "pass",
                "details": {"count": len(connectors.states())},
            }
        )
        dashboard = repository.dashboard()
        checks.append(
            {
                "name": "dashboard",
                "status": "pass" if dashboard.get("profile") else "fail",
            }
        )

        if live:
            if not settings.allow_cloud_processing:
                checks.append(
                    {
                        "name": "live_openai",
                        "status": "warn",
                        "details": "ALLOW_CLOUD_PROCESSING is false; no external call was made.",
                    }
                )
            elif settings.ai_provider != "openai" or not settings.openai_api_key:
                checks.append(
                    {
                        "name": "live_openai",
                        "status": "warn",
                        "details": "OpenAI provider/key is not configured; no external call was made.",
                    }
                )
            else:
                result = ai.run(
                    "transliteration",
                    {"text": "שלום"},
                    {"hebrew_level": "A2"},
                    cloud_requested=True,
                )
                checks.append(
                    {
                        "name": "live_openai",
                        "status": "pass" if result["provider"] == "openai" else "warn",
                        "details": {
                            "provider": result["provider"],
                            "degraded_mode": result["degraded_mode"],
                        },
                    }
                )
        elif settings.openai_api_key or settings.google_access_token:
            checks.append(
                {
                    "name": "live_services",
                    "status": "warn",
                    "details": "Credentials were detected but intentionally not exercised without --live.",
                }
            )
    except Exception as error:
        LOGGER.exception("Doctor check failed")
        checks.append(
            {"name": "unexpected", "status": "fail", "details": str(error)}
        )
    finally:
        if database:
            database.close()
        if dictionary:
            dictionary.close()

    if any(check["status"] == "fail" for check in checks):
        status = "fail"
    elif any(check["status"] == "warn" for check in checks):
        status = "warn"
    else:
        status = "pass"
    return {"status": status, "version": __version__, "checks": checks}


def sqlite_has_fts5(connection: sqlite3.Connection) -> bool:
    """Check whether SQLite can create an FTS5 virtual table.

    Args:
        connection: Active SQLite connection.

    Returns:
        Whether FTS5 is available.

    Example:
        Result depends on the local Python SQLite build.
    """
    try:
        connection.execute("CREATE VIRTUAL TABLE IF NOT EXISTS temp.fts_probe USING fts5(text)")
        connection.execute("DROP TABLE IF EXISTS temp.fts_probe")
        return True
    except sqlite3.OperationalError:
        return False


def run_server(settings: Settings, host: str | None, port: int | None) -> None:
    """Run the API server.

    Args:
        settings: Runtime settings.
        host: Optional host override.
        port: Optional port override.

    Returns:
        None until the server exits.

    Raises:
        RuntimeError: If Uvicorn is unavailable.

    Example:
        Invoked with `python -m ivrit_sheli --serve`.
    """
    try:
        import uvicorn
    except ImportError as error:
        raise RuntimeError("Install backend requirements before using --serve") from error
    uvicorn.run(
        "ivrit_sheli.api:app",
        host=host or settings.host,
        port=port or settings.port,
        reload=settings.app_env == "development",
    )


def main(argv: list[str] | None = None) -> int:
    """Execute CLI commands and return a shell status code.

    Args:
        argv: Optional argument list; defaults to `sys.argv`.

    Returns:
        Zero on success and non-zero on failure.

    Example:
        >>> main(["--version"])  # doctest: +SKIP
        0
    """
    parser = build_parser()
    args = parser.parse_args(argv)
    if not any(
        (
            args.init,
            args.seed,
            args.serve,
            args.download_dictionary,
            args.dictionary_jsonl,
            args.export_json,
            args.import_json,
            args.learning_core_status,
            args.set_curriculum_track,
            args.set_cefr_band,
            args.set_learner_mode,
            args.doctor,
        )
    ):
        parser.print_help()
        return 0

    overrides: dict[str, str] = {}
    if args.log_level:
        overrides["LOG_LEVEL"] = args.log_level
    settings = Settings.from_env(overrides)
    logging.basicConfig(
        level=getattr(logging, settings.log_level, logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    if args.doctor:
        report = doctor_report(settings, live=args.live)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 1 if report["status"] == "fail" else 0

    database: Database | None = None
    dictionary: DictionaryStore | None = None
    try:
        database, dictionary, repository = initialize_services(
            settings,
            display_name=args.display_name,
        )
        if args.init:
            print(f"Initialized local data in {settings.data_dir} ✅")
        if args.seed:
            result = seed_all(
                repository,
                dictionary,
                display_name=args.display_name,
            )
            print(
                "Seeded "
                f"{result['learning_items']} learning items and "
                f"{result['dictionary_entries']} dictionary entries ✅"
            )

        import_path = args.dictionary_jsonl
        dictionary_source_url: str | None = None
        if args.download_dictionary:
            import_path = settings.data_dir / "imports" / "kaikki.org-dictionary-Hebrew.jsonl"
            dictionary_source_url = args.dictionary_url
            downloaded = download_dictionary(
                args.dictionary_url,
                import_path,
            )
            print(f"Downloaded dictionary to {downloaded} ✅")
        if import_path:
            stats = dictionary.import_jsonl(
                import_path,
                max_records=args.dictionary_limit,
                source_url=dictionary_source_url,
            )
            print(
                f"Imported {stats.entries_imported} entries, "
                f"{stats.forms_imported} forms, and {stats.senses_imported} senses ✅"
            )

        if args.export_json:
            destination = repository.export_json(args.export_json)
            print(f"Exported learner data to {destination} ✅")
        if args.import_json:
            result = repository.import_json(args.import_json)
            print(
                "Restored "
                f"{result['rows_restored']} learner rows from {result['source']} ✅"
            )

        profile_updates = {
            key: value
            for key, value in {
                "curriculum_track": args.set_curriculum_track,
                "cefr_band": args.set_cefr_band,
                "learner_mode": args.set_learner_mode,
            }.items()
            if value is not None
        }
        if profile_updates:
            profile = repository.update_profile(profile_updates)
            print(
                "Updated Learning Core profile: "
                f"track={profile['curriculum_track']}, "
                f"band={profile['cefr_band']}, mode={profile['learner_mode']} ✅"
            )
        if args.learning_core_status:
            print(json.dumps(repository.learning_core_state(), ensure_ascii=False, indent=2))
    except (OSError, ValueError, sqlite3.Error, RuntimeError) as error:
        LOGGER.error("%s", error)
        print(f"Operation failed: {error} ❌", file=sys.stderr)
        return 1
    finally:
        if database:
            database.close()
        if dictionary:
            dictionary.close()

    if args.serve:
        run_server(settings, args.host, args.port)
    return 0
