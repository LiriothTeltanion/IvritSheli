# Ivrit Sheli Ultimate 1.0.0 — Package Manifest

## Release identity

- Product: Ivrit Sheli Ultimate — העברית שלי
- Release: 1.0.0
- Date: 2026-07-15
- Time zone: Asia/Jerusalem
- Author: Kevin “Lirioth” Cusnir
- Application license: MIT
- Dictionary data: separate Wiktionary/Kaikki attribution and share-alike terms

## Included runtime

### Backend

- FastAPI application and OpenAPI documentation.
- SQLite schema initialization.
- Learning repository and JSON export.
- Adaptive scheduler.
- Mastery and personalization engine.
- Explainable recommendation engine.
- XP, level, streak, and achievement engine.
- Full dictionary JSONL downloader/importer and demo lexicon.
- Offline structured AI coach.
- OpenAI Responses/Embeddings adapter.
- Browser/OpenAI audio service contracts.
- ICS and read-only Google connector adapters.
- Request IDs, structured errors, local bug reports, and doctor command.

### Frontend

- React 19 + TypeScript 7 + Vite 8.
- Trilingual English/Spanish/Hebrew interface.
- Automatic RTL/LTR document direction.
- Responsive desktop and mobile navigation.
- Dark/light themes.
- Custom SVG icon system and achievement badges.
- Animated dashboard, review, AI, dictionary, audio, progress, connector, and settings experiences.
- Reduced-motion support.
- Installable PWA manifest, 192/512 icons, and privacy-safe shell service worker.

### Operations

- macOS/Linux setup, development, and test scripts.
- Windows one-click daily launcher plus PowerShell setup and development scripts.
- Dockerfile and Docker Compose.
- GitHub Actions CI.
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

No credentials are included.

## Verification summary

- Backend tests: 60 passed.
- Frontend tests: 6 passed.
- Python Ruff: passed.
- Python MyPy strict: passed.
- TypeScript type check: passed.
- Production frontend build: passed.
- Offline doctor: passed.
- Production static/API smoke: passed.
- npm audit: 0 known vulnerabilities.
- Package secret/asset/link verifier: passed after final packaging.

See `TEST_REPORT.md` for exact commands and limitations.
