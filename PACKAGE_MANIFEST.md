# Ivrit Sheli 2.8.0 — Private Candidate Package Manifest

## Release identity

- Product: Ivrit Sheli — העברית שלי
- Candidate name: Warm Illustrated Learning Journey
- Source version: `2.8.0`
- Candidate branch: `codex/ivrit-sheli-v2.8.0`
- Manifest update date: 2026-07-26
- Time zone: Asia/Jerusalem
- Author: Kevin Cusnir
- Creative signature: Lirioth Teltanion
- Default branch: `main`
- Application license: MIT
- Production URL: https://ivritsheli-production.up.railway.app
- Current verified public version: `2.4.0`
- Current public storage: managed PostgreSQL
- Published implementation commit: `03bf84b9268ff8be528c0fab3c670f9652ee23b0`
- Latest published Git tag and GitHub Release: `v2.4.0`
- Candidate publication state: `2.8.0` is local, untagged, unpushed and unpublished
- Publication gate: blocked pending two-account Google and mother-pilot verification, plus the active Devpost judging freeze
- Personal signature: `KC ✦ LT` is reserved and excluded from the MIT asset grant
- Dictionary-derived data: separate Wiktionary/Kaikki attribution and share-alike terms
- Privacy notice: `PRIVACY.md`
- Terms of use: `TERMS.md`
- Machine-readable public source: `portfolio/project.json`

## Candidate purpose

This manifest describes the private 2.8 candidate without promoting it to a public release. The release is designed so a total beginner can open a shared link, learn three words and complete a first guided session without technical assistance, while Explorer and Experienced modes expose progressively richer navigation and learning controls.

The candidate provides structured A0–A2 coverage and labels B1/B2 content honestly as an experimental Lab rather than a complete B2 course. The public learning path is deterministic and local; no per-user LLM or cloud-audio call is required. Google sign-in requests identity only through `openid profile` and grants no Gmail, Drive or Calendar access.

The live Railway application, public tag and GitHub Release remain version 2.4.0 until every publication gate is complete and Kevin gives explicit approval.

## 2.8 functional scope

### Beginner-first learning journey

- Three-word learning entry before profile, configuration or account prompts.
- Guided/A0 default experience.
- Guided navigation limited to Today, Words and Help.
- One primary action above the first fold with a permanent Help route.
- Clear loading, empty, error, offline and network-required states.
- Accessible profile menu with learner identity, level, mode, real connectivity, focus status, settings and logout.
- Functional text and Hebrew presentation sized for legibility, 48 px touch targets, keyboard focus and 200% zoom/reflow.
- Light, dark and high-contrast foundations with no state communicated by color alone.

### Deterministic learning engine and curriculum

- A shared `LocalLearningEngine` used by Today, practice planning, curriculum and progress.
- Inputs include level, mode, goal, reviewed material, SRS urgency, mistakes, confidence, response time, exposure and difficulty.
- Outputs include a planned session, next exercise, concise learner-facing reason and reviewed-data-only feedback.
- A0 alphabet, sounds, essential niqqud and survival language.
- A1 daily situations, questions and agreement.
- A2 frequent verbs, tenses and independent daily use.
- B1/B2 Lab for advanced work, bureaucracy, register and personal material.
- Exactly 240 reviewed starter concepts: 144 inherited concepts plus 96 reviewed A2 additions.
- Independent 22-letter, sound-first reading track including final forms.
- Linguistically defined reading hints; no parity-based niqqud removal.

### Persistent daily practice

- Daily flow: encounter, 3–5 retrievals, listening, speaking/manual fallback, reflection and summary.
- Server-owned `practice_sessions`, `practice_step_events` and `curriculum_progress`.
- Idempotency keys prevent replayed events from awarding duplicate XP.
- Explicit completed, failed and unsupported step states.
- Resumption after reload.
- Honest microphone-denied, unsupported-browser, lost-network and demo-session states.
- New data included in export, import, migrations and cloud snapshots.

### Exercises and healthy motivation

- Image to meaning.
- Audio to choice.
- Hebrew to meaning.
- Meaning to Hebrew with a word bank.
- Cloze or ordering.
- Spoken production with a manual alternative.
- Unlimited retries and no hearts, energy, leagues or artificial scarcity.
- Daily goals based on meaningful learning actions.
- XP, attendance and mastery stored and presented as separate concepts.
- Rest-day-aware streak behavior.
- Optional, accessible celebrations compatible with reduced motion.

### Warm Illustrated Israel Journey

- Six original regional scenes: Galilee, Haifa/Carmel, Tel Aviv/Jaffa, Jerusalem, the Dead Sea and the Negev.
- Twelve category illustration kits.
- Stable `visual_id` values and trilingual alternative text.
- Parameterized educational SVG compositions and optimized local WebP region art.
- Emoji retained only as a fallback.
- Progressive visual-hint reveal to avoid showing the answer permanently.
- Lazy-loaded major routes to keep the initial application bundle below the previous warning threshold.

### Voice, audio and privacy boundary

- Persisted masculine-style or feminine-style synthetic voice preference.
- Slow and normal playback speeds.
- Local browser recording and playback.
- Transcript comparison only when browser speech recognition is supported.
- No claim of accent or phoneme evaluation.
- Cloud AI and cloud audio are disabled in the public 2.8 interface.
- Existing adapters remain future experiments and require separate credentials, consent, allowlists and cost controls.

### Phone and PWA behavior

- Direct web access from a WhatsApp link while connected.
- Optional Add to Home Screen installation.
- Cached public shell, initial lessons, six region images and reviewed starter dictionary.
- Read-only cached content remains available offline.
- Cloud writes explicitly request reconnection rather than pretending to synchronize.
- Service-worker rules exclude private API, session, profile and token data.
- The offline dictionary artifact contains exactly 240 unique reviewed entries and no private user fields.

### Accounts and persistence

- Local SQLite development/private mode remains available without an account.
- PostgreSQL remains the intended production multi-user store.
- Google sign-in uses `openid profile` only.
- No Google email, access token, refresh token, Gmail, Drive or Calendar scope is required for the beginner sign-in path.
- User data remains isolated, exportable and deletable.
- PostgreSQL row-level security, restricted runtime credentials, CSRF controls, hashed sessions and migration discipline are retained.

## Candidate artifacts

The source tree includes:

- Backend application, migrations, local learning engine, curriculum and practice APIs.
- Frontend React/TypeScript application with Guided, Explorer and Experienced modes.
- Six optimized regional WebP illustrations under `frontend/public/illustrations/regions/`.
- Twelve reusable category illustration kits.
- `frontend/public/content/starter-dictionary-v2.8.json`, a 558,348-byte public offline dictionary with 240 reviewed entries.
- PWA manifest and allowlisted service worker.
- English, Spanish and Hebrew interface strings.
- API, architecture, deployment, privacy, terms, changelog and competitive-benchmark documentation.
- Windows and shell setup, run, doctor, backup and verification launchers.
- Dockerfile, Compose configuration and Railway configuration.
- Backend, frontend and Playwright/axe tests.
- Canonical Git-blob checksum and reproducible ZIP generators.

`IvritSheli-v2.6-local.zip` is retained only as an obsolete historical artifact. It is not the 2.8 candidate and must not be distributed as the current application.

A reproducible, commit-suffixed local candidate ZIP and external SHA-256 have been generated, extracted into a clean directory and verified. They remain private candidate artifacts—not a GitHub Release—until the external gates pass.

## Verified private 2.8 candidate

| Verification area | Current result |
|---|---:|
| Ordinary backend suite | 194 passed / 1 credential-gated PostgreSQL skip |
| Frontend Vitest suite | 133 passed / 29 files |
| Playwright + axe | 20 passed / 22 intentional skips / 0 failed |
| Directly executed automated passes | 347 passed |
| Ruff | Passed |
| Strict MyPy | Passed across 30 backend source files |
| TypeScript / Vite build | Passed / passed |
| Python compileall / offline doctor | Passed / passed |
| pip-audit / npm production audit | No known vulnerabilities / 0 vulnerabilities |
| Docker Compose configuration | Passed |
| Source package verifier / canonical checksums | 124 required files / 270 Git blobs passed |
| PostgreSQL 17 / production image / restore drill | Passed / passed / passed in a disposable database |
| Two live Google accounts / mother pilot | Not verified |

The 347 total is 194 backend tests + 133 frontend tests + 20 Playwright cases. The credential-gated backend skip and 22 intentional Playwright matrix skips are not counted as passes. The dedicated three-case PostgreSQL gate passed and is not added again because it exercises the database-boundary cases represented by the ordinary suite and its environment-gated skip.

### Production build output

| Output | Raw | Gzip |
|---|---:|---:|
| Main JavaScript | 443.13 kB | 133.59 kB |
| Main CSS | 190.66 kB | 35.25 kB |
| LearnPanel JavaScript | 64.01 kB | 17.38 kB |
| LearnPanel CSS | 4.63 kB | 1.38 kB |
| Progress JavaScript | 13.19 kB | 3.80 kB |
| Settings JavaScript | 12.94 kB | 3.39 kB |
| AICoach JavaScript | 5.39 kB | 1.97 kB |
| Connector JavaScript | 4.36 kB | 1.50 kB |

The current workstation dictionary may contain additional private/imported records; the reviewed starter layer and packaged offline dictionary remain exactly 240 concepts.

See `TEST_REPORT.md` for commands, coverage and evidence boundaries.

## Package and deployment state

The source-quality, test, accessibility, dependency, doctor, build and Compose gates have passed. The source package verifier passed 124 required-file and packaged-asset checks, and `SHA256SUMS.txt` records 270 canonical Git-index blobs. A commit-suffixed archive was rebuilt from canonical Git blobs, extracted cleanly, reverified and matched its external SHA-256.

Docker Desktop 4.83 / Engine 29.6.2 verified the PostgreSQL 17 migration and restricted role, three database-boundary integration cases, forced RLS, the non-root production-shaped image, healthy `/health/ready` and `/version`, and a disposable backup/restore drill. The restored database retained 2 users, 3 sessions, 0 OAuth states, 2 learner states and its forced-RLS policy. The backup SHA-256 was `A483C8DACC2E0F649139D4139635B28FA88E084A3D3D47F8F9D7148F182E6F62`.

## Required publication gates

Do not merge, push, tag, publish a GitHub Release or deploy to Railway until:

1. Two real Google accounts prove identity-only sign-in, tenant isolation and phone/computer progress continuity.
2. Kevin's mother completes the WhatsApp-link beginner pilot without assistance.
3. A production backup is created immediately before deployment.
4. The OpenAI Build Week judging freeze ends.
5. Kevin gives explicit final publication approval.

After 2.8 accepts writes using the new schema, do not roll the application code back to 2.4 unless the matching pre-deployment database backup is restored.

## Historical private 2.6 evidence

This historical checkpoint is retained for traceability and was not rerun as 2.8:

- Ordinary backend: 180 passed, 1 PostgreSQL-gated skip.
- Dedicated PostgreSQL 17 gate: 3 passed; 181 unique backend passes.
- Frontend: 107 passed across 24 files.
- Total unique automated tests: 288 passed.
- Ruff, strict MyPy across 28 source files, TypeScript and Vite build: passed.
- Package verifier: 85 required files passed.
- Private Docker image and disposable readiness/version: passed as 2.6.0.
- Build output: JavaScript 482.90 kB / 141.70 kB gzip; CSS 169.69 kB / 31.60 kB gzip.

The 2.6 checkpoint was local, untagged and unpublished.

## Verified public 2.4 baseline

This remains the public evidence and is not relabeled as 2.8:

- Ordinary backend: 150 passed, 1 PostgreSQL-gated skip.
- Dedicated PostgreSQL 17 gate: 3 passed; 151 unique backend passes.
- Frontend: 62 passed across 16 files.
- Total unique automated tests: 213 passed.
- Ruff, strict MyPy across 24 source files, TypeScript, Vite, compileall and doctor: passed.
- pip-audit reported no known vulnerabilities; npm production audit reported 0 vulnerabilities.
- Package verifier: 66 files passed.
- Production-image Compose smoke: passed.
- Railway `/version`: `2.4.0`, environment `production`, storage `postgresql`.
- Railway `/health/ready`: HTTPS 200 with PostgreSQL and the reviewed 48-entry public dictionary ready.
- Identity-only Google sign-in, onboarding/session persistence across reload and logout were verified.
- Git tag and GitHub Release `v2.4.0` are published.

Two-real-user production isolation, live OpenAI/Google Workspace calls and a managed production backup restore were not verified in that historical public run.

## Evidence statement

This manifest separates packaged source, locally executed 2.8 checks, historical private checkpoints, live public evidence and operator-dependent release gates. No passing test or build is presented as proof of an unexecuted deployment, provider integration, real-user pilot or backup restoration.
