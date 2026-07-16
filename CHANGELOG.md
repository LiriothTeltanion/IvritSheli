# Changelog

All notable changes are documented here. Versions follow Semantic Versioning.

## Unreleased

No unreleased changes.

## 2.1.1 — 2026-07-16

### Fixed

- Cloud AI, speech-to-text, and text-to-speech requests now require stored learner consent before any provider call or uploaded-audio processing begins; rejected requests use the stable `cloud_consent_required` code.
- Review queues now return only active items whose due timestamp has arrived, so future work no longer appears as immediately due in either SQLite or PostgreSQL-backed mode.
- Readiness now fails closed when the dictionary schema is stale, empty, or lacks usable senses, while preserving mode-aware local/cloud diagnostics.
- Review-card controls hidden behind the answer face are no longer keyboard-focusable or exposed to assistive technology before reveal.
- Reduced-motion mode now swaps the review faces directly without leaking the answer or running a flip animation; inactive audio waveforms remain still.
- Dictionary and quick-capture dialogs now trap focus, close with Escape, restore the opener, lock background scrolling, and expose complete modal semantics.
- Recorded-audio uploads now use a filename extension derived from their real MIME type, and pronunciation requests retain the selected item and transcription-provider identity.
- Audio, speech-recognition, media-stream, and speech-synthesis resources are now cleaned up when pronunciation practice closes or unmounts.

### Changed

- Pronunciation scoring now stores history and a privacy-safe event atomically, clearly labels client transcripts as unverified, and prevents typed or spoofed provider claims from changing mastery, XP, or achievements. The repository retains a separately tested atomic path for future server-attested speech evidence.
- SQLite startup now uses ordered, atomic, idempotent schema migrations, safely adopts unversioned legacy databases, rolls back failed upgrades, and rejects databases newer than the application.
- Version metadata advanced from `2.1.0` to `2.1.1` across Python, npm, the visible interface, diagnostics, OAuth identification, citation metadata, issue templates, and the PWA shell cache.
- The automated baseline is now 128 unique backend tests plus 21 frontend tests, for 149 unique passing tests when the credential-gated PostgreSQL test runs in its dedicated database job.

### Verification

- Local backend quality gates, frontend type-check/tests/build, offline diagnostics, dependency audits, package checks, visible dialog/review/RTL/reduced-motion QA, real PostgreSQL integration, and the production-image Compose smoke pass for the 2.1.1 candidate.
- The public Railway service remains the previously verified `2.1.0` deployment until this branch is reviewed, merged, and deployed; no 2.1.1 tag or live release is claimed here.

## 2.1.0 — 2026-07-16

### Fixed

- Railway deploy overlap and draining values now use the numeric TOML types required by Railway instead of rejected string values.
- Provider-bound Docker cache mounts were removed after live Railway Metal validation showed that cache IDs must embed a specific service identifier; normal Docker layers now preserve portable build caching.
- GitHub OAuth cancellation now validates and consumes the browser-bound state, clears its cookie, and returns to the application instead of exposing a raw missing-code validation response.

### Changed

- Runtime, Python package, frontend package, visible interface, bug diagnostics, OAuth user agent, citation, documentation, and verification metadata now identify release `2.1.0` consistently.
- The service-worker shell cache advanced to `ivrit-sheli-shell-v2.1.0`, ensuring installed clients retire the 2.0 shell after the release update.
- The personal `KC ✦ LT` signature now uses a larger, lower punctuation-like star with a stronger blue glow; its canonical PNG and the social card were regenerated at their original dimensions.
- Public architecture and social-preview artwork now present the current 2.1 release identity.
- Package verification now guards both Railway TOML types and the portable no-service-bound-cache policy.
- The automated baseline is now 110 unique backend tests plus 17 frontend tests, including the production-discovered OAuth cancellation regression.

### Operations

- Release `2.1.0` is deployed publicly at https://ivritsheli-production.up.railway.app with managed PostgreSQL.
- HTTPS liveness, PostgreSQL-backed readiness, release identity, seeded demo safety, OAuth consent handoff/cancellation, and structured startup/health logs were verified against Railway production.
- The final GitHub authorization-code exchange and authenticated session/logout flow remain pending in a normal browser; live OpenAI/Google calls and managed backup restoration are not claimed.
- Package verification now parses `railway.toml`, rejects non-integer or unexpected deploy timing values, and prevents provider-bound cache mounts from re-entering the production Dockerfile.

## 2.0.0 — 2026-07-16

### Added

- Authenticated cloud mode backed by PostgreSQL while preserving writable local-first SQLite mode.
- GitHub OAuth web flow with state, S256 PKCE, safe relative redirects and allow-listed identity fields.
- Hashed server-side sessions, CSRF verification, secure cookie policy and logout revocation.
- Deterministic, tenant-isolated, non-admin read-only demo identity with synthetic seed content.
- Alembic migration for users, sessions, OAuth states and revisioned JSONB learner states.
- Restricted `ivrit_sheli_runtime` database role plus forced row-level security and explicit tenant predicates.
- Cloud repository adapter that reuses the mature learning engine inside atomic PostgreSQL tenant updates.
- Redacted structured JSON logging with request IDs, duration, status, version, build commit and privacy-safe user correlation.
- Independent `/health/live`, `/health/ready` and `/version` operations endpoints.
- Trilingual authentication gate, signed-in identity controls, demo banner, logout and read-only affordances.
- Real PostgreSQL 17 migration, persistence, session and cross-user isolation integration tests.
- Multi-stage non-root Docker image, health check, PostgreSQL Compose stack and one-shot migration service.
- Digest-pinned Node, Python and PostgreSQL container bases with Dependabot update coverage.
- Railway config-as-code with pre-deploy migrations, readiness gating, draining and restart policy.
- Bounded request bodies, layered per-client/global authentication throttling, per-user write/session caps, a 4 MiB cloud-snapshot ceiling, and a PostgreSQL-global OAuth-state cap for public-load defense.
- Production-image CI now probes the running Uvicorn container with varied spoofed `X-Forwarded-For` values and proves the raw-peer client limit still returns `429`.
- The service worker keeps APIs and operational probes network-only and refuses to store any response marked `Cache-Control: no-store`.
- Weekly Dependabot coverage for Python, npm, Docker and GitHub Actions.
- Production architecture visual and expanded deployment, API, architecture and security documentation.

### Changed

- Version surfaces advanced from `1.0.0` to `2.0.0` for this major production transformation.
- All frontend API requests use same-origin credentials; writes send the CSRF double-submit header when present.
- Demo-visible write controls are labeled and disabled before a blocked request is attempted.
- CI now separates local-first quality gates, real PostgreSQL integration and production-image verification.
- Docker Compose now validates the complete app + migration + PostgreSQL lifecycle rather than only mounting SQLite.
- One-click local launches keep live SQLite data under `%LOCALAPPDATA%`, outside the OneDrive-synced source tree.
- Windows setup validates native command failures, Node/npm versions and UTF-8 console output.
- PWA cache identity and package metadata advanced to 2.0.
- All dashboard, authentication, learning, AI, audio, connector, progress and settings surfaces now use complete EN/ES/HE translations, including accessibility labels and localized dynamic states.
- Connector phrase imports now batch up to 50 phrases in one tenant hydrate/mutate/snapshot transaction, while blocking database and provider work is dispatched off the ASGI event loop.
- Git attributes now force LF for Linux shell entrypoints and platform-standard CRLF for Windows launchers.

### Security

- GitHub OAuth access tokens and GitHub email are never persisted in application or learner data.
- Session, CSRF and OAuth-state bearer values are hashed before durable storage.
- Production configuration fails closed when PostgreSQL, HTTPS, secure cookies or a sufficiently long session secret are missing.
- Structured logs scrub credential-like keys and literal bearer/JWT/GitHub token patterns.
- Demo mutations are rejected server-side even if a client bypasses disabled UI controls.
- Responses now apply a restrictive application CSP, browser isolation headers, production-only HSTS and no-store caching for API, authentication and operational JSON routes without disabling PWA asset caching.

## 1.0.0 — 2026-07-15

### Added

- Local-first FastAPI and SQLite backend.
- React/TypeScript trilingual interface.
- Clickable Hebrew dictionary drawer.
- Streaming Kaikki/Wiktionary dictionary importer.
- Adaptive review, personalization, recommendations, XP, levels, streaks and achievements.
- Offline AI coach and optional OpenAI structured-output adapter.
- Browser and OpenAI audio paths with pronunciation scoring.
- Google Workspace read-only connector layer and local ICS import.
- Custom SVG brand assets, badges, UI preview and accessible animations.
- Backend, API, connector, AI, audio, dictionary and frontend tests.
