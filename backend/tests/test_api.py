"""
Module: FastAPI system tests
Purpose: Verify the runnable HTTP contract, validation envelope, dictionary linking, AI fallback, connectors, missions, and export.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

import sqlite3
from dataclasses import replace
from pathlib import Path

from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.config import Settings


def _parse_csp(policy: str) -> dict[str, set[str]]:
    """Parse a CSP into exact directive tokens for allow-list assertions."""
    directives: dict[str, set[str]] = {}
    for raw_directive in policy.split(";"):
        tokens = raw_directive.strip().split()
        if tokens:
            directives[tokens[0]] = set(tokens[1:])
    return directives


def test_health_and_security_headers(
    client: TestClient, settings: Settings, tmp_path: Path
) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "test-request"})
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["X-Request-ID"] == "test-request"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Permissions-Policy"] == (
        "camera=(), geolocation=(), microphone=(self)"
    )
    assert response.headers["Cross-Origin-Opener-Policy"] == "same-origin"
    assert response.headers["Cross-Origin-Resource-Policy"] == "same-origin"
    assert response.headers["X-Permitted-Cross-Domain-Policies"] == "none"
    assert response.headers["Cache-Control"] == "no-store"
    assert "Strict-Transport-Security" not in response.headers

    content_security_policy = _parse_csp(
        response.headers["Content-Security-Policy"]
    )
    assert content_security_policy["script-src"] == {"'self'"}
    assert content_security_policy["img-src"] == {
        "'self'",
        "data:",
        "blob:",
        "https://avatars.githubusercontent.com",
        "https://*.googleusercontent.com",
    }
    assert content_security_policy["media-src"] == {
        "'self'",
        "data:",
        "blob:",
        "https:",
    }
    assert content_security_policy["worker-src"] == {"'self'", "blob:"}

    operational = client.get("/health/live")
    assert operational.headers["Cache-Control"] == "no-store"
    assert client.get("/").headers.get("Cache-Control") != "no-store"

    service_worker_source = (
        Path(__file__).resolve().parents[2] / "frontend" / "public" / "sw.js"
    ).read_text(encoding="utf-8")
    for network_only_path in ("/health/live", "/health/ready", "/version"):
        assert network_only_path in service_worker_source
    assert "url.pathname.startsWith('/api/')" in service_worker_source
    assert "cacheControl.toLowerCase().includes('no-store')" in service_worker_source

    frontend_dist = tmp_path / "frontend-dist"
    (frontend_dist / "assets").mkdir(parents=True)
    (frontend_dist / "index.html").write_text("<!doctype html>", encoding="utf-8")
    (frontend_dist / "sw.js").write_text("// service worker", encoding="utf-8")
    (frontend_dist / "assets" / "app-v2.abc123.js").write_text("export {};", encoding="utf-8")
    static_settings = replace(
        settings,
        data_dir=tmp_path / "static-data",
        db_path=tmp_path / "static-learning.db",
        dictionary_db_path=tmp_path / "static-dictionary.db",
        frontend_dist=frontend_dist,
    )
    with TestClient(create_app(static_settings)) as static_client:
        service_worker = static_client.get("/sw.js")
        versioned_asset = static_client.get("/assets/app-v2.abc123.js")

    assert service_worker.status_code == versioned_asset.status_code == 200
    assert service_worker.headers.get("Cache-Control") != "no-store"
    assert versioned_asset.headers.get("Cache-Control") != "no-store"

    docs = client.get("/api/v1/docs")
    docs_content_security_policy = _parse_csp(
        docs.headers["Content-Security-Policy"]
    )
    assert docs_content_security_policy["script-src"] == {
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
    }

    production_settings = Settings.from_env(
        {
            "APP_ENV": "production",
            "APP_DATA_DIR": str(tmp_path / "production-data"),
            "APP_DB_PATH": ":memory:",
            "DICTIONARY_DB_PATH": ":memory:",
            "DATABASE_URL": "postgresql://ivrit_sheli_runtime:password@db/ivrit",
            "AUTH_REQUIRED": "true",
            "SESSION_SECRET": "production-test-secret-with-more-than-32-chars",
            "SESSION_COOKIE_SECURE": "true",
            "PUBLIC_BASE_URL": "https://ivrit.example",
            "GITHUB_CLIENT_ID": "client-id",
            "GITHUB_CLIENT_SECRET": "client-secret",
            "GITHUB_REDIRECT_URI": "https://ivrit.example/api/v1/auth/github/callback",
            "ALLOWED_ORIGINS": "",
            "DEBUG": "false",
        }
    )
    with TestClient(
        create_app(production_settings, cloud_store=MemoryCloudStore()),
        base_url="https://ivrit.example",
    ) as production_client:
        production_response = production_client.get("/health/live")

    assert production_response.headers["Strict-Transport-Security"] == (
        "max-age=31536000; includeSubDomains"
    )


def test_dashboard_profile_and_gamification_boot_cleanly(client: TestClient) -> None:
    dashboard = client.get("/api/v1/dashboard")
    profile = client.get("/api/v1/profile")
    gamification = client.get("/api/v1/gamification/status")
    assert dashboard.status_code == profile.status_code == gamification.status_code == 200
    assert dashboard.json()["system"]["offline_ready"] is True
    assert dashboard.json()["dictionary"]["entries"] == 240
    spotlight = dashboard.json()["visual_spotlight"]
    assert len(spotlight) == 6
    assert len({entry["visual"]["key"] for entry in spotlight}) == 6
    assert profile.json()["weekly_rest_day"] == 5
    assert profile.json()["learner_mode"] == "guided"

    experienced = client.put("/api/v1/profile", json={"learner_mode": "experienced"})
    assert experienced.status_code == 200
    assert experienced.json()["learner_mode"] == "experienced"
    assert experienced.json()["guided_mode"] == 0

    invalid = client.put("/api/v1/profile", json={"learner_mode": "expert"})
    assert invalid.status_code == 422


def test_capture_review_and_progress_flow(client: TestClient) -> None:
    created = client.post(
        "/api/v1/items",
        json={
            "hebrew_text": "אני אטפל בזה",
            "translation_en": "I'll take care of it",
            "translation_es": "Me encargaré de eso",
            "context_label": "workplace",
        },
    )
    assert created.status_code == 201
    item_id = created.json()["id"]
    assert client.get("/api/v1/reviews/next").json()["items"][0]["id"] == item_id

    reviewed = client.post(
        f"/api/v1/reviews/{item_id}",
        json={
            "is_correct": True,
            "confidence": 4,
            "response_ms": 1000,
            "hints_used": 0,
            "modality": "speaking",
            "exercise_type": "speaking",
        },
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["xp_awarded"] >= 30
    progress = client.get("/api/v1/progress").json()
    assert progress["modalities"][0]["attempts"] == 1
    assert progress["activity_log"][0]["type"] == "review_submitted"
    assert progress["activity_log"][0]["source"] == "learning_item"


def test_dictionary_is_linked_to_learning_collection(
    client: TestClient, settings: Settings
) -> None:
    with sqlite3.connect(settings.db_path) as connection:
        events_before = connection.execute("SELECT COUNT(*) FROM user_events").fetchone()[0]
        xp_before = connection.execute("SELECT COUNT(*) FROM xp_ledger").fetchone()[0]

    lookup = client.get("/api/v1/dictionary/lookup", params={"word": "שָׁלוֹם"})
    assert lookup.status_code == 200
    search = client.get("/api/v1/dictionary/search", params={"q": "שלום"})
    assert search.status_code == 200

    with sqlite3.connect(settings.db_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM user_events").fetchone()[0] == events_before
        assert connection.execute("SELECT COUNT(*) FROM xp_ledger").fetchone()[0] == xp_before

    entry = lookup.json()["results"][0]
    learned = client.post(f"/api/v1/dictionary/{entry['id']}/learn")
    assert learned.status_code == 201
    assert learned.json()["hebrew_text"] == "שלום"
    assert learned.json()["source_label"].startswith("dictionary:")

    for source_label in (
        "dictionary:999",
        "Connector:calendar",
        "system:internal",
        "seed:fixture",
        " starter_pack ",
    ):
        rejected = client.post(
            "/api/v1/items",
            json={"hebrew_text": "בדיקה", "source_label": source_label},
        )
        assert rejected.status_code == 422
        assert rejected.json()["error"]["code"] == "validation_error"


def test_ai_audio_and_connector_fallbacks_work_without_credentials(client: TestClient) -> None:
    consent = client.put("/api/v1/profile", json={"cloud_consent": True})
    assert consent.status_code == 200

    ai = client.post(
        "/api/v1/ai/correct",
        json={"payload": {"text": "אני  לומד"}, "cloud_requested": True},
    )
    assert ai.status_code == 200
    assert ai.json()["provider"] == "offline"
    assert ai.json()["degraded_mode"] is True

    tts = client.post("/api/v1/audio/tts", json={"text": "שלום", "cloud_requested": True})
    assert tts.status_code == 200
    assert tts.json()["provider"] == "browser"

    connectors = client.get("/api/v1/connectors")
    assert len(connectors.json()["connectors"]) == 4


def test_client_pronunciation_claim_cannot_award_mastery_or_xp(client: TestClient) -> None:
    created = client.post("/api/v1/items", json={"hebrew_text": "שלום"})
    assert created.status_code == 201
    item_id = created.json()["id"]
    xp_before = client.get("/api/v1/gamification/status").json()["xp"]["total"]

    scored = client.post(
        "/api/v1/audio/pronunciation-score",
        json={
            "target_text": "שלום",
            "transcript": "שלום",
            "item_id": item_id,
            "provider": "openai",
        },
    )

    assert scored.status_code == 200
    assert scored.json()["score"] == 100
    assert scored.json()["linked_item_id"] == item_id
    assert scored.json()["evidence_verified"] is False
    assert scored.json()["learning_updated"] is False
    assert scored.json()["mastery"] is None
    assert scored.json()["xp_awarded"] == 0
    assert client.get("/api/v1/gamification/status").json()["xp"]["total"] == xp_before
    assert client.get("/api/v1/progress").json()["modalities"] == []


def test_word_analysis_returns_provenance_without_awarding_progress(
    client: TestClient,
) -> None:
    xp_before = client.get("/api/v1/gamification/status").json()["xp"]["total"]

    response = client.post(
        "/api/v1/audio/word-analysis",
        json={
            "transcript": "שָׁלוֹם!",
            "transcript_provider": "browser",
            "cloud_requested": False,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["word"] == "שלום"
    assert payload["dictionary_matches"][0]["word"] == "שלום"
    assert payload["enrichment"] is None
    assert payload["provenance"] == {
        "transcript": "client_reported_browser_recognition",
        "dictionary": "local_dictionary",
        "enrichment": None,
        "audio_retained": False,
        "learning_progress_updated": False,
    }
    assert client.get("/api/v1/gamification/status").json()["xp"]["total"] == xp_before
    assert client.get("/api/v1/progress").json()["modalities"] == []


def test_word_analysis_requires_exactly_one_hebrew_word(client: TestClient) -> None:
    phrase = client.post(
        "/api/v1/audio/word-analysis",
        json={"transcript": "שלום עולם", "transcript_provider": "manual"},
    )
    extra_text = client.post(
        "/api/v1/audio/word-analysis",
        json={"transcript": "say שלום", "transcript_provider": "manual"},
    )
    marks_only = client.post(
        "/api/v1/audio/word-analysis",
        json={"transcript": "ְ״", "transcript_provider": "manual"},
    )

    assert phrase.status_code == 400
    assert extra_text.status_code == 400
    assert marks_only.status_code == 400


def test_word_analysis_labels_offline_fallback_without_claiming_cloud_facts(
    client: TestClient,
) -> None:
    assert client.put("/api/v1/profile", json={"cloud_consent": True}).status_code == 200

    response = client.post(
        "/api/v1/audio/word-analysis",
        json={
            "transcript": "שלום",
            "transcript_provider": "manual",
            "cloud_requested": True,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["enrichment"]["provider"] == "offline"
    assert payload["enrichment"]["source"] == "offline_fallback"
    assert payload["provenance"]["enrichment"] == "offline_fallback"


def test_tts_accepts_only_server_mapped_voice_styles(client: TestClient) -> None:
    selected = client.post(
        "/api/v1/audio/tts",
        json={"text": "שלום", "voice_style": "masculine"},
    )
    arbitrary_provider_voice = client.post(
        "/api/v1/audio/tts",
        json={"text": "שלום", "voice": "client-controlled"},
    )

    assert selected.status_code == 200
    assert selected.json()["voice_style"] == "masculine"
    assert selected.json()["voice_profile"]["pitch"] < 1
    assert arbitrary_provider_voice.status_code == 422


def test_mission_bug_report_and_export(client: TestClient) -> None:
    mission = client.post(
        "/api/v1/missions",
        json={"mission_text": "Use תודה today", "context_label": "daily_life"},
    )
    completed = client.post(
        f"/api/v1/missions/{mission.json()['id']}/complete",
        json={"success": True, "confidence_after": 4, "reflection": "Worked well"},
    )
    assert completed.status_code == 200
    assert completed.json()["xp_awarded"] == 127

    bug = client.post(
        "/api/v1/bug-reports",
        json={
            "title": "Layout issue",
            "description": "Drawer was clipped",
            "route": "/learn",
            "diagnostics": {"viewport": "mobile", "secret": "must be removed"},
        },
    )
    assert bug.status_code == 201
    assert bug.json()["status"] == "open"

    exported = client.get("/api/v1/export")
    assert exported.status_code == 200
    assert exported.headers["content-type"].startswith("application/json")
    assert b"ivrit-sheli-export-v1" in exported.content


def test_validation_and_missing_resources_use_standard_error_envelope(client: TestClient) -> None:
    invalid = client.post("/api/v1/items", json={"hebrew_text": "", "unknown": True})
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "validation_error"
    assert invalid.json()["error"]["request_id"]

    missing = client.get("/api/v1/items/99999")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "not_found"
