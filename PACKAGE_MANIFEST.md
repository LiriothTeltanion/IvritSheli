# Ivrit Sheli 2.4.0 Contest Edition — Candidate Package Manifest

## Release identity

- Product: Ivrit Sheli — העברית שלי
- Source candidate version: `2.4.0`
- Current live source version: `2.2.0`
- Candidate date: 2026-07-21
- Time zone: Asia/Jerusalem
- Author: Kevin “Lirioth” Cusnir
- Candidate branch: `codex/ivrit-sheli-v2.3.0`
- Default branch: `main`
- Application license: MIT
- Production URL: https://ivritsheli-production.up.railway.app
- Current verified production release: `2.2.0` on Railway with managed PostgreSQL
- Verified production commit: `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1`
- Latest published Git tag and GitHub Release: `v2.2.0`
- Candidate publication state: `2.4.0` is not yet tagged, released or deployed
- Personal signature: `KC ✦ LT` is reserved and excluded from the MIT asset grant
- Dictionary-derived data: separate Wiktionary/Kaikki attribution and share-alike terms
- Privacy notice: `PRIVACY.md`
- Terms of use: `TERMS.md`
- Machine-readable public source: `portfolio/project.json`

## 2.4 candidate capabilities

### Contest judge journey

- A four-stop guided tour inside the synthetic read-only demo with real navigation to ephemeral Illustrated First Steps, dictionary visuals, microphone word intelligence and adaptive-progress views.
- Deterministic per-visit `?lang=en`, `?lang=es` and `?lang=he` interface overrides that do not replace the learner's persisted language.
- Tour presentation built on the existing icon, motion, responsive, mobile, RTL and reduced-motion systems without a new visual dependency.
- Keyed BLAKE2b-256 storage digests for session, CSRF and OAuth-state bearer material, preserving the existing 64-character hexadecimal database contract while intentionally rotating active session hashes on deployment.
- No new Google Workspace scope, provider, schema or dependency; Google sign-in remains identity-only.

### Warm illustrated beginner journey inherited from 2.3

- Light-first, warm visual language with code-native illustrations and no downloaded stock imagery.
- Beginner onboarding for interface language, Hebrew level, primary goal and daily pace.
- A persisted guided-mode preference in Settings; distinct simplified/full-shell behavior remains a candidate follow-up and is not claimed as complete.
- A first visual lesson covering `שלום`, `תודה`, `בבקשה`, `כן` and `לא`.
- Persisted onboarding choices, First Steps checkpoint and completion inside the active local or authenticated learner boundary; existing profiles are migrated as completed without losing their exact Hebrew level.
- EN/ES/HE localization, native RTL, responsive layouts, keyboard-visible focus and stationary reduced-motion behavior.

### Reviewed visual dictionary

- Exactly 48 curated A0/A1 concepts: 8 greetings, 7 family, 7 home, 8 food, 6 transport, 6 shopping and 6 health.
- Stable visual keys and emoji cues with Hebrew, English and Spanish alternative text.
- Niqqud, romanization, EN/ES meanings and one practical Hebrew example with EN/ES translations and romanization for every curated concept.
- Broader Hebrew/transliteration/English/Spanish lookup so equivalent beginner searches converge on the same concept.
- Curated exact matches rank ahead of imported Kaikki/Wiktionary entries without hiding source provenance.
- Additive upgrade behavior preserves existing dictionary IDs and adds the reviewed starter layer to older demo or imported databases.

### Accounts, privacy and continuity

- Google identity-only sign-in as the beginner-facing option when configured: `openid profile` only, provider-bound single-use state and S256 PKCE.
- GitHub identity-only sign-in remains available with `read:user`, provider-bound single-use state and S256 PKCE.
- Provider access, ID and refresh tokens are not persisted; Google and GitHub email addresses are not stored.
- Google and GitHub identities remain separate rather than being linked by an unverified email match.
- Authenticated JSON export and explicit two-step account deletion, including learner state and live sessions.
- Writable private SQLite mode and deterministic read-only synthetic demo remain available without provider credentials.
- PostgreSQL tenant isolation, forced RLS, CSRF protection, hashed server-side sessions and migration discipline remain in place.

### Capabilities retained from 2.2

- Persistent masculine-style and feminine-style synthetic voice profiles.
- One-word microphone analysis with transparent transcript/dictionary/enrichment provenance and temporary app-managed uploads.
- Tenant-scoped saved-vocabulary registry with search, filters, review timing, dates and four-skill mastery.
- Clickable Hebrew, homograph identity, duplicate prevention and optional Kaikki/Wiktionary import.
- Offline deterministic coach plus consent-gated cloud AI/audio adapters.
- Multi-stage non-root Docker image, PostgreSQL 17 Compose stack, Railway configuration, CI and CodeQL.

## Credential-dependent capabilities

Google sign-in is implemented in the candidate source and its production OAuth client, exact HTTPS callback and Railway variable names have been configured; successful 2.4 authorization, session persistence and logout remain unverified until the candidate is deployed. OpenAI AI/embedding/TTS/STT and Google Workspace connector adapters require separate operator credentials, consent, identity allowlists and cost controls. No real credentials are included in this package.

## Candidate verification summary

- Backend ordinary suite: 150 passed, 1 credential-gated PostgreSQL skip.
- Dedicated PostgreSQL 17 gate: 3 passed; two overlap the ordinary suite and one replaces its skip, producing 151 unique backend passes.
- Frontend: 62 passed across 16 files.
- Total unique automated tests: 213 passed.
- Ruff: passed.
- Strict MyPy: passed across 24 backend source files.
- Python compileall and offline doctor: passed.
- Pip audit: no known vulnerabilities.
- TypeScript project check: passed.
- Vite production build: passed; JavaScript 404.21 kB / 117.97 kB gzip and CSS 122.19 kB / 23.46 kB gzip.
- npm production audit: 0 vulnerabilities.
- Package verifier: 66 files passed required-file, strict portfolio/release-drift, JSON, SVG, Railway, secret-hygiene and README-link checks.
- Production-shaped Docker/Compose smoke: passed with release 2.4.0, PostgreSQL readiness, UID 10001, no migration DSN in the app runtime, OAuth rate limiting and structured-log redaction.

Before release, updated tests/package checks, CI/CodeQL, Railway migration/deployment, live 2.4 operational endpoints and browser-based tour/language/Google sign-in/onboarding/First Steps persistence/logout checks remain release gates. The current public verification record therefore remains 2.2.0. Refreshed 2.4 desktop/mobile/RTL/reduced-motion screenshots, two-real-user production isolation, live OpenAI/Google connector calls and a managed backup restore drill remain explicit operator checks.

See `TEST_REPORT.md` for commands, evidence boundaries and the historical production record.
