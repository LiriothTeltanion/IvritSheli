# Ivrit Sheli Ultimate 2.1.1 — Package Manifest

## Release identity

- Product: Ivrit Sheli Ultimate — העברית שלי
- Release: 2.1.1 release candidate
- Date: 2026-07-16
- Time zone: Asia/Jerusalem
- Author: Kevin “Lirioth” Cusnir
- Application license: MIT
- Production URL: https://ivritsheli-production.up.railway.app
- Production runtime: Railway + managed PostgreSQL
- Personal signature: `KC ✦ LT` identity mark reserved; excluded from the MIT asset grant
- Dictionary data: separate Wiktionary/Kaikki attribution and share-alike terms

## Included runtime

### Backend

- FastAPI application and OpenAPI documentation.
- Private local SQLite mode and authenticated PostgreSQL cloud mode.
- GitHub OAuth with state, PKCE, hashed server-side sessions, CSRF protection, and a read-only demo.
- Alembic migrations, forced tenant RLS, and separate administrator/runtime database identities.
- Learning repository and JSON export.
- Ordered, atomic, idempotent SQLite migrations with legacy adoption, rollback, and newer-schema rejection.
- Adaptive scheduler.
- Mastery and personalization engine.
- Explainable recommendation engine.
- XP, level, streak, and achievement engine.
- Full dictionary JSONL downloader/importer and demo lexicon.
- Offline structured AI coach.
- OpenAI Responses/Embeddings adapter.
- Browser/OpenAI audio service contracts.
- Stored-consent enforcement before cloud AI/TTS/STT processing, unverified transcript isolation, and an atomic server-verified pronunciation-progress path.
- ICS and read-only Google connector adapters.
- Redacted structured JSON logs, request IDs, structured errors, local bug reports, and doctor command.
- Bounded request bodies, layered per-client/global authentication throttling, per-user write/session caps, a 4 MiB cloud-snapshot ceiling, a durable OAuth-state cap, and batched connector imports.
- Production-image CI includes a live varied-`X-Forwarded-For` regression that protects the raw-peer limiter from proxy middleware rewrites.
- The PWA service worker excludes API/health/version traffic and respects explicit `no-store` response policy.
- Restrictive CSP and browser-isolation headers, production-only HSTS, plus no-store API/auth/operations caching that leaves versioned frontend assets and the PWA service worker independent.

### Frontend

- React 19 + TypeScript 7 + Vite 8.
- Trilingual English/Spanish/Hebrew interface.
- Automatic RTL/LTR document direction.
- Responsive desktop and mobile navigation.
- Dark/light themes.
- Custom SVG icon system and achievement badges.
- Animated dashboard, review, AI, dictionary, audio, progress, connector, and settings experiences.
- Reduced-motion support.
- Keyboard- and screen-reader-safe review faces plus focus-trapped, Escape-closeable, opener-restoring dialogs.
- Installable PWA manifest, 192/512 icons, and privacy-safe shell service worker.

### Operations

- macOS/Linux setup, development, and test scripts.
- Windows one-click daily launcher plus PowerShell setup and development scripts.
- Multi-stage non-root Dockerfile and a PostgreSQL Docker Compose integration stack with digest-pinned base images.
- GitHub Actions CI with local-first, real-PostgreSQL, production-image, CodeQL, and dependency-update gates.
- Railway deployment configuration retained from the verified live 2.1.0 production service, with a separate pre-deploy provisioner, readiness probe, schema-compatible numeric deploy timing controls, and a portable Docker layer-cache policy.
- Environment template.
- Security, contribution, deployment, third-party, and test documentation.

## Dictionary packaging status

The package includes a 12-entry attributed demo lexicon and a tested streaming importer for the current Kaikki/Wiktionary Hebrew JSONL dataset. The complete external JSONL file is not embedded in this archive because the packaging runtime could not resolve the external host. Running `--download-dictionary` on a connected machine installs the complete dataset locally without changing application code.

## Credential-dependent capabilities

The following adapters are implemented and contract-tested with deterministic fakes, but live calls require the user's own credentials and consent:

- OpenAI structured coaching.
- OpenAI embeddings.
- OpenAI speech-to-text.
- OpenAI text-to-speech.
- Google Calendar.
- Gmail.
- Google Drive.

No live, personal, or provider credentials are included. The repository contains only clearly labeled, non-secret local-development placeholders used by the loopback Compose stack and deterministic tests.

## Verification summary

- Unique backend tests: 128 passed. The local suite reports 127 passed plus one credential-gated skip; the dedicated PostgreSQL job runs three tests, two already counted locally, and supplies the one additional unique pass.
- Frontend tests: 21 passed across 9 files.
- Total unique automated tests: 149 passed.
- Python Ruff: passed.
- Python MyPy strict: passed across 24 source files.
- TypeScript type check: passed.
- Production frontend build: passed.
- Visible review, dialog, reduced-motion, Hebrew RTL, focus-restoration, and console-error QA: passed.
- Offline doctor: passed.
- Real PostgreSQL 17 migration, restricted-role, session, RLS, and tenant-isolation gate: passed.
- Local production-image Compose health and structured-log smoke: passed.
- pip-audit and npm production audit: 0 known vulnerabilities on 2026-07-16.
- Package asset/link verifier: 52 required files passed.

The local 2.1.1 candidate passes the reproducible verification listed above. The public Railway URL, HTTPS application, production identity, PostgreSQL readiness, seeded demo workspace, OAuth consent handoff/cancellation, and structured startup/health logs remain verified for the currently deployed release `2.1.0`; 2.1.1 is not claimed as deployed or tagged. The final GitHub authorization-code exchange and authenticated session were not completed because GitHub's anti-fraud protection disabled approval in the embedded test browser. No live OpenAI/Google provider calls or managed backup/restore drill is claimed.

See `TEST_REPORT.md` for exact commands and limitations.
