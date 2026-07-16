# Ivrit Sheli Ultimate 2.2.0 — Package Manifest

## Release identity

- Product: Ivrit Sheli Ultimate — העברית שלי
- Candidate: `2.2.0`
- Date: 2026-07-16
- Time zone: Asia/Jerusalem
- Author: Kevin “Lirioth” Cusnir
- Working branch: `codex/ivrit-sheli-v2.2.0`
- Application license: MIT
- Production URL: https://ivritsheli-production.up.railway.app
- Current verified production release: `2.1.1` on Railway with managed PostgreSQL
- Candidate deployment status: 2.2.0 is not tagged or deployed by this package
- Personal signature: `KC ✦ LT` is reserved and excluded from the MIT asset grant
- Dictionary-derived data: separate Wiktionary/Kaikki attribution and share-alike terms

## 2.2 capabilities

### Pronunciation and microphone intelligence

- Device-persisted masculine-style and feminine-style synthetic voice profiles.
- Deterministic installed Hebrew voice selection with a documented pitch fallback.
- Server-controlled OpenAI voice identifiers; clients cannot inject arbitrary provider voice IDs.
- User-triggered browser recognition or bounded app-managed recording.
- Six-second one-word and 15-second pronunciation recording ceilings.
- One-Hebrew-word validation, local dictionary resolution and optional consent-gated enrichment.
- Niqqud, transliteration, bilingual meanings, grammar, root, binyan, forms, usage and examples when supplied by the selected source.
- Explicit transcript, dictionary and enrichment provenance; client-reported transcript origin is not presented as server verification.
- Browser/OS speech-provider policy disclosure and temporary app-upload cleanup.
- Transcript analysis never awards XP or changes mastery.

### Saved vocabulary and dictionary

- Tenant-scoped saved-vocabulary registry with search, status/due filters and six deterministic sort modes.
- Bounded offset pagination that reaches collections larger than 500 items.
- Database-side filtering, sorting, totals and context-aware status summaries.
- Review count, saved/activity dates and recognition/production/listening/speaking mastery.
- Honest mastered threshold: not due, at least five reviews, a 14-day interval and strength in at least two modalities.
- Exact dictionary-entry identity for homographs.
- Atomic dictionary-to-learning links prevent new duplicate adds in local and cloud modes; legacy duplicates are not automatically merged.
- Read-only dictionary GETs, saved-word-based exploration milestones and server-reserved provenance namespaces.
- Source-backed senses, grammar, forms, examples, pronunciation and license provenance.
- A representative 12-entry demo seed plus the streaming Kaikki/Wiktionary importer; the external full dataset is not embedded.

### Visual and interaction system

- Vector Hebrew-letter constellation, deeper light/dark surfaces and refined navigation.
- Integrated voice, microphone, registry and dictionary feature states.
- EN/ES/HE localization with native RTL.
- Responsive desktop/mobile layouts, visible focus, high-contrast fallbacks and stationary reduced-motion behavior.
- 2.2 feature metadata is at least 12 px and controls/body copy are at least 13–14 px.
- Updated 2.2 social preview SVG and matching 1280×640 PNG.

### Platform and safety retained

- Writable private local-first SQLite mode.
- Authenticated PostgreSQL cloud mode with GitHub OAuth, PKCE, hashed sessions, CSRF and forced tenant RLS.
- Deterministic, tenant-isolated, server-enforced read-only demo.
- Alembic migrations with separate migration and restricted runtime database identities.
- Redacted structured JSON logs, request IDs and no-store API/operations responses.
- Bounded bodies/uploads, authentication throttles, per-user caps and cloud snapshot ceilings.
- Multi-stage non-root Docker image, PostgreSQL 17 Compose stack, Railway configuration, CI and CodeQL.
- Trilingual React 19 + TypeScript PWA and FastAPI backend.

## Credential-dependent capabilities

The OpenAI AI/embedding/TTS/STT and Google connector adapters are deterministic-contract tested. Live calls require the operator's own credentials, identity allowlist, stored consent and cost controls. No real credentials are included.

## Verification summary

- Backend local suite: 138 passed, 1 real-PostgreSQL skip.
- Dedicated PostgreSQL 17 gate: 3 passed; one replaces the local skip, producing 139 unique backend passes.
- Frontend: 48 passed across 12 files.
- Total unique automated tests: 187 passed.
- Ruff: passed.
- MyPy strict: passed across 24 backend source files.
- Python compilation: passed.
- TypeScript project check: passed.
- Vite production build: passed.
- Offline doctor: passed for release 2.2.0.
- Real PostgreSQL migration, restricted role, RLS and tenant isolation: passed.
- Production-image Compose build/health smoke: passed.
- Python and npm production dependency audits: zero known vulnerabilities on 2026-07-16.
- Package verifier: 57 required files plus JSON, SVG, Railway, secret-hygiene and README-link checks passed.
- `SHA256SUMS.txt`: canonical Git-clean blob hashes for every candidate file except the manifest itself; checkout-specific CRLF bytes are intentionally not the checksum basis.

Interactive browser QA in this work session verified the currently deployed 2.1.1 release, not the local 2.2.0 candidate. The README screenshots therefore remain explicitly labeled 2.1. Final GitHub OAuth code exchange, two-real-user production isolation, live OpenAI/Google calls, refreshed 2.2 screenshots, 2.2 interactive visual QA and a managed backup restore drill remain explicit operator checks.

See `TEST_REPORT.md` for commands, build sizes and evidence boundaries.
