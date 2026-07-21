# Ivrit Sheli 2.4.0 Contest Edition — Package Manifest

## Release identity

- Product: Ivrit Sheli — העברית שלי
- Source version: `2.4.0`
- Current live source version: `2.4.0`
- Verification date: 2026-07-21
- Time zone: Asia/Jerusalem
- Author: Kevin “Lirioth” Cusnir
- Release-evidence branch: `codex/ivrit-sheli-v2.4-release-evidence`
- Default branch: `main`
- Application license: MIT
- Production URL: https://ivritsheli-production.up.railway.app
- Current verified production release: `2.4.0` on Railway with managed PostgreSQL and 48 reviewed dictionary entries
- Verified production commit: `03bf84b9268ff8be528c0fab3c670f9652ee23b0`
- Latest published Git tag and GitHub Release: `v2.2.0`
- Publication state: `2.4.0` is deployed; its Git tag and GitHub Release are not yet published
- Personal signature: `KC ✦ LT` is reserved and excluded from the MIT asset grant
- Dictionary-derived data: separate Wiktionary/Kaikki attribution and share-alike terms
- Privacy notice: `PRIVACY.md`
- Terms of use: `TERMS.md`
- Machine-readable public source: `portfolio/project.json`

## 2.4 capabilities

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

Identity-only Google sign-in is configured and verified in production with `openid profile` only. Onboarding state and the authenticated session persisted across reload; logout returned to the English auth landing page and remained signed out after another reload. Re-login after logout remains unverified. OpenAI AI/embedding/TTS/STT and Google Workspace connector adapters require separate operator credentials, consent, identity allowlists and cost controls; Google sign-in grants no Gmail, Drive or Calendar scope. No real credentials are included in this package.

## Verification summary

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

Railway deployment succeeded on 2026-07-21 at immutable commit `03bf84b9268ff8be528c0fab3c670f9652ee23b0`. Production reports version 2.4.0, PostgreSQL ready and all 48 reviewed dictionary entries ready. The live English entry, four-stop read-only tour, identity-only Google sign-in, onboarding/session persistence across reload, logout and signed-out persistence after reload passed browser checks. Git tag and GitHub Release `v2.2.0` remain the latest published release artifacts. Re-login after logout, refreshed 2.4 desktop/mobile/RTL/reduced-motion screenshots, two-real-user production isolation, live OpenAI or Google Workspace connector calls and a managed backup restore drill remain explicit operator checks.

See `TEST_REPORT.md` for commands, evidence boundaries and the historical production record.
