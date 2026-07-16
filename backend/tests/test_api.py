"""
Module: FastAPI system tests
Purpose: Verify the runnable HTTP contract, validation envelope, dictionary linking, AI fallback, connectors, missions, and export.
Author: Kevin "Lirioth" Cusnir
Date: 2026-07-15 | TZ: Asia/Jerusalem
Notes: Minimal deps; comments in ENGLISH; emojis sparingly.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from fastapi.testclient import TestClient

from ivrit_sheli.api import create_app
from ivrit_sheli.cloud_store import MemoryCloudStore
from ivrit_sheli.config import Settings


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

    content_security_policy = response.headers["Content-Security-Policy"]
    assert "script-src 'self'" in content_security_policy
    assert "https://avatars.githubusercontent.com" in content_security_policy
    assert "media-src 'self' data: blob: https:" in content_security_policy
    assert "worker-src 'self' blob:" in content_security_policy

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
    assert "https://cdn.jsdelivr.net" in docs.headers["Content-Security-Policy"]
    assert "script-src 'self' 'unsafe-inline'" in docs.headers["Content-Security-Policy"]

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
    assert dashboard.json()["dictionary"]["entries"] == 12
    assert profile.json()["weekly_rest_day"] == 5


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
    assert client.get("/api/v1/progress").json()["modalities"][0]["attempts"] == 1


def test_dictionary_is_linked_to_learning_collection(client: TestClient) -> None:
    lookup = client.get("/api/v1/dictionary/lookup", params={"word": "שָׁלוֹם"})
    assert lookup.status_code == 200
    entry = lookup.json()["results"][0]
    learned = client.post(f"/api/v1/dictionary/{entry['id']}/learn")
    assert learned.status_code == 201
    assert learned.json()["hebrew_text"] == "שלום"
    assert learned.json()["source_label"].startswith("dictionary:")


def test_ai_audio_and_connector_fallbacks_work_without_credentials(client: TestClient) -> None:
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
