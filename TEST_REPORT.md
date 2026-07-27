# Ivrit Sheli 2.9.0 — Private Candidate Verification Ledger

- **Ledger update date:** 2026-07-27
- **Time zone:** Asia/Jerusalem
- **Current private source candidate:** `2.9.0` / local / unpublished
- **Candidate branch:** `codex/ivrit-sheli-v2.9.0-listening-coach`
- **Current verified production:** `2.4.0` on Railway with PostgreSQL
- **Published release implementation commit:** `03bf84b9268ff8be528c0fab3c670f9652ee23b0`
- **Publication decision:** Blocked pending the operator and pilot gates listed below

## Current status

Ivrit Sheli 2.9.0 is an implementation-in-progress private candidate for
**Listening & Personal Coach**. It preserves the verified v2.8.3 visual
foundation and adds self-hosted Hebrew transcription, deterministic transcript
understanding, bounded personal coaching, learner feedback, learner-scoped
device recordings and optional Web Push.

This ledger does **not** promote v2.9 to production. Historical v2.8.3 results
below remain useful regression evidence, but they are not counted as proof for
the new speech, coach, Push or privacy paths. The fresh v2.9 results below were
executed against the current reviewed worktree; the remaining external,
database, packaging and pilot gates stay explicit. The live Railway application,
Git tag, GitHub Release and Devpost entry therefore remain at verified version
2.4.0.

## Current v2.9 verification status

| Verification area | v2.9 result |
|---|---:|
| Focused implementation tests | Covered by the complete backend and frontend suites |
| Complete backend suite | **291 passed / 1 credential-gated PostgreSQL skip** |
| Complete frontend suite | **337 passed / 37 files** |
| Playwright + axe matrix | **26 passed / 28 scoped skips / 0 failed** |
| Unique directly executed automated passes | **655 passed**: 291 backend + 337 frontend + 26 browser + 1 additional credential-gated PostgreSQL case |
| Ruff / strict MyPy / TypeScript | Passed / passed across 37 source files / passed |
| Compileall / offline doctor | Passed / passed as source version `2.9.0` |
| Vite production build | Passed |
| Dependency audits | pip-audit: 0 known vulnerabilities / npm production audit: 0 vulnerabilities |
| PostgreSQL 17 role/isolation tests | **3 passed in a disposable PostgreSQL 17 instance; one case is additional to the ordinary suite** |
| Docker Compose configuration | Passed |
| Production-shaped Docker/readiness | **Passed; existing volume migrated `0004 → 0005`, web runs as UID/GID 10001, `/health/live`, `/health/ready` and `/version` pass** |
| Reminder worker / structured-log privacy | **Passed with zero due subscriptions / 13 JSON records validated with deployment secrets forbidden** |
| Faster Whisper model preload/inference | **Passed: `small` preloaded in 50.508 s; 1-second silence reached expected no-speech path and confirmed temporary deletion** |
| HTTPS staging | Not deployed |
| Two-real-account Google isolation | Not run |
| 20-word/10-phrase Kevin-and-mother Hebrew accuracy pilot | Not run |
| Canonical source verification | **321 canonical Git-index checksums generated; package verifier passed** |
| Public release/deployment | Not authorized; remains v2.4.0 |

The downloaded Faster Whisper cache contains 7 files totaling 486,213,474
bytes (463.7 MiB). The silence inference verifies model loading, CTranslate2
execution, expected no-speech handling and temporary-file cleanup. It does not
measure Hebrew word or phrase accuracy.

The real PostgreSQL gate caught and then verified the fix for an RLS edge case
when the same browser Push endpoint moves from one signed-in learner to
another. Migration `20260727_0005` now performs that transfer through a
tenant-checked `SECURITY DEFINER` function owned by a dedicated no-login,
no-bypass-RLS role. The old owner cannot read or delete the transferred row,
the endpoint remains globally unique, and the runtime role gains no table-wide
visibility.

## Preserved v2.8.3 baseline evidence — not v2.9 verification

| Verification area | Historical 2.8.3 result |
|---|---:|
| Ordinary backend suite | **201 passed / 1 credential-gated PostgreSQL skip** |
| Frontend Vitest suite | **310 passed / 34 files** |
| Playwright + axe browser matrix | **25 passed / 26 intentional skips / 0 failed** |
| Directly executed automated passes | **536 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 31 backend source files |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Python compileall | Passed |
| Offline doctor | Passed; source version `2.8.3` |
| pip-audit | No known vulnerabilities |
| npm production audit | 0 vulnerabilities |
| Docker Compose configuration | Passed |
| Source package verifier | Passed / 153 required files |
| Canonical Git-blob checksum manifest | Passed / 294 files |
| Clean extracted candidate archive | **Historical 2.8.1 checkpoint `c9e2762` passed; SHA-256 `535e93aaf3912704aaae56076a2b4e9ef8e47fe9df03bbb0fa996d0707c33ccb`; a current 2.8.3 archive is deferred until publication approval** |
| PostgreSQL 17 integration gate | **Foundation gate passed previously with administrator and restricted-runtime roles; not repeated for the visual-only delta** |
| Production Docker image/readiness | **Rebuilt and passed for 2.8.3; non-root app and PostgreSQL 17 healthy** |
| PostgreSQL backup/restore drill | **Foundation gate passed previously in a disposable database; not repeated for this visual-only delta** |
| Two live Google accounts | **Not verified for 2.8** |
| Required mother pilot | **Started on a real Samsung phone; formal acceptance retest remains** |

The 536 figure is the transparent sum of 201 backend tests, 310 frontend unit/component tests and 25 Playwright browser cases executed for this candidate. The 26 Playwright skips are intentional viewport-independent duplicates in the configured matrix, not failures. The single ordinary-backend skip requires PostgreSQL administrator and restricted-runtime connection URLs. The earlier dedicated Docker/PostgreSQL foundation gate is not added to the 536 total.

### Commands executed

```powershell
.\.venv\Scripts\ruff.exe check backend\src backend\tests scripts\
.\.venv\Scripts\mypy.exe --config-file backend\pyproject.toml backend\src
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m compileall -q backend\src scripts\
.\.venv\Scripts\python.exe -m pip_audit -r backend\requirements.txt
.\.venv\Scripts\python.exe -m ivrit_sheli --doctor
npm --prefix frontend run typecheck
npm --prefix frontend run test:run
npm --prefix frontend run test:e2e
npm --prefix frontend run build
npm --prefix frontend audit --omit=dev
docker compose config --quiet
```

### Backend evidence

The ordinary backend suite reports `201 passed, 1 skipped`. It covers:

- The deterministic `LocalLearningEngine` and mode-specific 3–5 retrieval plans.
- A resumable `encounter → retrieval → listening → speaking/manual fallback → reflection → summary` practice flow.
- Idempotent practice-step events and protection against duplicate XP.
- Curriculum path and A0–A2 versus B1/B2 Lab boundaries.
- Practice-session, event and curriculum-progress persistence.
- Export, import and cloud-snapshot inclusion for the new records.
- Tenant isolation and account-deletion behavior.
- Stable visual IDs, reading hints and the reviewed starter-lexicon contract.
- Exactly 72 exact semantic visual recipes, 168 explicit fallbacks and complete EN/ES/HE alternative text.
- Six-item, recommendation-first `visual_spotlight` selection with deterministic exact-scene backfill, without repeated concepts or fallback promotion.
- Exactly 96 reviewed A2 additions and exactly 240 reviewed starter concepts.
- Public cloud AI/audio feature gating for the 2.8 release boundary.

Ruff passed the backend, tests and scripts. Strict MyPy passed across 31 backend source files. Python compileall passed. The ordinary suite emits one non-failing upstream Starlette TestClient/httpx deprecation warning.

The offline doctor passed and reported version 2.8.3. The workstation dictionary database contains 244 total entries because it also preserves four local non-starter records; its metadata correctly reports the reviewed starter layer as 240 entries. This is not presented as a 244-concept starter curriculum.

### Frontend and build evidence

TypeScript passed. Vitest passed all 310 tests across 34 files. Coverage includes:

- Guided, Explorer and Experienced modes.
- Three-word beginner entry before account/profile configuration.
- Daily-practice loading, resumption, retry, unsupported-microphone and manual-fallback states.
- Honest saved/unsaved and online/offline behavior.
- Curriculum path, 22-letter sound-first track and B1/B2 Lab labeling.
- Six exercise families and 12 category illustration kits.
- Accessible profile menu and persisted focus, text, voice and speed preferences.
- Honest Finish for today confirmation and browser/PWA completion guidance without pretending that a website can close the browser.
- Canonical, continuous Hebrew speech input with an explicit regression for `בבקשה`.
- Seventy-two responsive exact-sense scenes, including redesigned First Steps visuals, 168 explicit fallbacks and aligned trilingual alternative text.
- Progressive `context`, `meaning` and `anchor` layers for every exact scene.
- Six exact-scene Today recommendations plus a local 72-scene QA gallery with small, card and hero comparisons.
- A seeded five-second, four-choice visual-recognition flow with changing answer positions that records only an in-memory QA score.
- Dictionary reading hints and offline starter-dictionary behavior.
- Healthy goals, XP/mastery separation and reduced-motion celebrations.
- Public disabling of experimental cloud AI/audio controls.

The Vite production build completed without a chunk-size warning:

| Output | Raw | Gzip |
|---|---:|---:|
| Main JavaScript | 451.88 kB | 123.38 kB |
| Main CSS | 207.40 kB | 38.14 kB |
| Visual QA JavaScript | 6.22 kB | 2.23 kB |
| Visual QA CSS | 4.73 kB | 1.32 kB |
| LearnPanel JavaScript | 63.91 kB | 17.35 kB |
| LearnPanel CSS | 4.63 kB | 1.38 kB |
| Progress JavaScript | 13.21 kB | 3.82 kB |
| Settings JavaScript | 12.98 kB | 3.40 kB |
| AICoach JavaScript | 5.42 kB | 1.98 kB |
| Connector JavaScript | 4.39 kB | 1.51 kB |
| i18n JavaScript | 103.53 kB | 33.47 kB |

The 571,974-byte offline starter dictionary contains exactly 240 unique reviewed entries and no user, session, profile or token fields.

### Browser and accessibility evidence

Playwright and axe completed with 25 passes, 26 intentional skips and zero failures. The matrix covers:

- 390 px, 768 px and 1440 px viewports.
- English, Spanish and Hebrew.
- LTR and RTL.
- Guided, Explorer and Experienced experiences.
- Light and dark themes.
- Keyboard-visible focus.
- Reduced motion.
- A CSS-equivalent 200% zoom/reflow check.
- Serious and critical axe violations.
- The local visual QA gallery at 390 px, 768 px and 1440 px.
- Exact-scene light/dark presentation, RTL, reduced motion and the five-second recognition interaction.

No serious or critical axe violation remained in the executed matrix. This evidence does not replace the required real-user mother-pilot acceptance retest.

### Dependency and configuration evidence

`pip-audit` reported no known vulnerabilities in the pinned backend requirements. `npm audit --omit=dev` reported zero production vulnerabilities. `docker compose config --quiet` passed.

Docker Desktop 4.83 with Engine 29.6.2 recovered without a factory reset. The final local gate verified:

- PostgreSQL 17, Alembic migrations and restricted runtime provisioning.
- Three real PostgreSQL integration cases covering persistence, tenant isolation and forced RLS denial.
- A non-root application runtime (`UID/GID 10001`).
- HTTP 200 from `/health/live`, `/health/ready` and `/version`; readiness reported PostgreSQL and dictionary schema 3 with 244 workstation entries.
- A backup restored into a disposable database with 2 users, 3 sessions, 0 OAuth states and 2 learner states; forced RLS and its policy survived the restore.
- Backup SHA-256 `A483C8DACC2E0F649139D4139635B28FA88E084A3D3D47F8F9D7148F182E6F62`.

The disposable databases were removed after verification. The original local database and the frozen Railway production database were not modified.

## Unverified publication gates

Publication remains blocked until all of the following are complete:

1. Use two real Google accounts to verify `openid profile` sign-in, account isolation and progress continuity between phone and computer.
2. Complete the mother-pilot acceptance retest after the first Samsung session exposed onboarding, profile-isolation and Settings-navigation defects: find the primary action within 30 seconds, learn three words, finish a session without assistance and confirm progress after reload. Cross-device continuity belongs to the two-account hosted gate, not the LAN-only pilot.
3. Back up production immediately before deployment and verify login, persistence, export and deletion after deployment.
4. Wait until the OpenAI Build Week judging freeze ends, then obtain explicit final approval before merge, push, tag `v2.9.0`, GitHub Release or Railway deployment.

No rollback to the 2.4 application is safe after v2.9 accepts writes using the new schema unless the matching pre-deployment database backup is restored.

## Historical private 2.6 checkpoint

The following is retained as historical evidence and was **not** rerun or relabeled as 2.8:

| Verification area | Historical private 2.6 result |
|---|---:|
| Ordinary backend suite | 180 passed / 1 PostgreSQL-gated skip |
| Dedicated PostgreSQL 17 gate | 3 passed |
| Unique backend tests | 181 passed |
| Frontend suite | 107 passed / 24 files |
| Total unique automated tests | 288 passed |
| Ruff / strict MyPy | Passed / passed across 28 source files |
| TypeScript / Vite build | Passed / passed |
| Package verifier | 85 required files passed |
| Private Docker image/readiness | Passed / passed as version 2.6.0 |
| Build size | JS 482.90 kB / 141.70 kB gzip; CSS 169.69 kB / 31.60 kB gzip |

The 2.6 candidate was local, untagged and unpublished. `IvritSheli-v2.6-local.zip` is an obsolete historical artifact and must not be distributed as the current application.

## Verified public 2.4 baseline

The following remains the current public evidence; none of it is presented as v2.9 production verification:

| Verification area | Verified public 2.4 result |
|---|---:|
| Ordinary backend run | 150 passed / 1 PostgreSQL-gated skip |
| Dedicated PostgreSQL 17 gate | 3 passed |
| Unique backend tests | 151 passed |
| Frontend suite | 62 passed / 16 files |
| Total unique automated tests | 213 passed |
| Ruff / strict MyPy | Passed / passed across 24 source files |
| TypeScript / Vite build | Passed / passed |
| pip-audit / npm production audit | No known vulnerabilities / 0 vulnerabilities |
| Package verifier | 66 files passed |
| Production-image Compose smoke | Passed |
| Live Railway deployment | Passed on 2026-07-21 |
| Current public release | `2.4.0` / PostgreSQL / Git tag and GitHub Release `v2.4.0` |

Public Railway URL: https://ivritsheli-production.up.railway.app

Production `/version` reported release 2.4.0, environment `production` and storage `postgresql`; `/health/ready` returned HTTPS 200 with PostgreSQL and the 48-entry reviewed dictionary ready. The English entry, read-only tour, identity-only Google sign-in, onboarding/session persistence across reload and logout were verified in a normal browser.

Re-login after logout, two-real-user production isolation, live OpenAI/Google Workspace calls and a managed backup restoration were not part of that historical public verification.

## Reliability statement

Passing tests and local checks materially reduce risk but do not prove defect-free software. This report deliberately separates current v2.9 source evidence, historical private checkpoints, live-production evidence and credential-, device- or operator-dependent gates.
