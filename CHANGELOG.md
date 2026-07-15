# Changelog

## Unreleased

### Added

- One-click Windows launcher with automatic setup, browser opening, safe repeat launches, and clean shutdown.
- Dependency fingerprinting so repeat launches stay fast while setup refreshes when requirements change.

### Changed

- One-click launches keep live SQLite data under `%LOCALAPPDATA%` instead of the OneDrive-synced source tree.
- Docker Compose binds to localhost by default.
- Windows setup now validates native command failures, Node/npm versions, and UTF-8 console output.

## 1.0.0 — 2026-07-15

### Added

- Local-first FastAPI and SQLite backend.
- React/TypeScript trilingual interface.
- Clickable Hebrew dictionary drawer.
- Streaming Kaikki/Wiktionary dictionary importer.
- Adaptive review, personalization, recommendations, XP, levels, streaks, and achievements.
- Offline AI coach and optional OpenAI structured-output adapter.
- Browser and OpenAI audio paths with pronunciation scoring.
- Google Workspace read-only connector layer and local ICS import.
- Custom SVG brand assets, badges, UI preview, and accessible animations.
- Backend, API, connector, AI, audio, dictionary, and frontend tests.
