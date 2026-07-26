# Ivrit Sheli 2.8.0 — Private Candidate Verification Ledger

- **Ledger update date:** 2026-07-26
- **Time zone:** Asia/Jerusalem
- **Current private source candidate:** `2.8.0` / local / unpublished
- **Candidate branch:** `codex/ivrit-sheli-v2.8.0`
- **Current verified production:** `2.4.0` on Railway with PostgreSQL
- **Published release implementation commit:** `03bf84b9268ff8be528c0fab3c670f9652ee23b0`
- **Publication decision:** Blocked pending the operator and pilot gates listed below

## Current status

Ivrit Sheli 2.8.0 is a locally verified private candidate for the **Warm Illustrated Learning Journey**. The source, deterministic learning engine, curriculum, daily-session flow, frontend, accessibility matrix and production build pass the checks that can run in the current workstation environment.

This ledger does **not** promote 2.8.0 to production. Docker Desktop, PostgreSQL 17, the production-shaped image, tenant isolation, a disposable backup/restore drill and a clean extracted-package check are verified locally. Two-account Google persistence/isolation, the required beginner pilot with Kevin's mother and the end of the active Devpost judging freeze remain external gates. The live Railway application, Git tag and GitHub Release therefore remain at verified version 2.4.0.

## Verified private 2.8 candidate

| Verification area | Current 2.8 result |
|---|---:|
| Ordinary backend suite | **194 passed / 1 credential-gated PostgreSQL skip** |
| Frontend Vitest suite | **133 passed / 29 files** |
| Playwright + axe browser matrix | **20 passed / 22 intentional skips / 0 failed** |
| Directly executed automated passes | **347 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 30 backend source files |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Python compileall | Passed |
| Offline doctor | Passed; source version `2.8.0` |
| pip-audit | No known vulnerabilities |
| npm production audit | 0 vulnerabilities |
| Docker Compose configuration | Passed |
| Source package verifier | Passed / 124 required files |
| Canonical Git-blob checksum manifest | Passed / 270 files |
| Clean extracted candidate archive | **Passed; package, checksum, Compose and PowerShell launcher checks** |
| PostgreSQL 17 integration gate | **3 passed with administrator and restricted-runtime roles** |
| Production Docker image/readiness | **Passed; non-root app and PostgreSQL 17 healthy** |
| PostgreSQL backup/restore drill | **Passed in a disposable database** |
| Two live Google accounts | **Not verified for 2.8** |
| Required mother pilot | **Not performed** |

The 347 figure is the transparent sum of 194 backend tests, 133 frontend unit/component tests and 20 Playwright browser cases executed for this candidate. The 22 Playwright skips are intentional viewport-independent duplicates in the configured matrix, not failures. The single ordinary-backend skip requires PostgreSQL administrator and restricted-runtime connection URLs; the dedicated Docker/PostgreSQL gate passes all three database-boundary cases and is not added again to the 347 total.

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

The ordinary backend suite reports `194 passed, 1 skipped`. It covers:

- The deterministic `LocalLearningEngine` and mode-specific 3–5 retrieval plans.
- A resumable `encounter → retrieval → listening → speaking/manual fallback → reflection → summary` practice flow.
- Idempotent practice-step events and protection against duplicate XP.
- Curriculum path and A0–A2 versus B1/B2 Lab boundaries.
- Practice-session, event and curriculum-progress persistence.
- Export, import and cloud-snapshot inclusion for the new records.
- Tenant isolation and account-deletion behavior.
- Stable visual IDs, reading hints and the reviewed starter-lexicon contract.
- Exactly 96 reviewed A2 additions and exactly 240 reviewed starter concepts.
- Public cloud AI/audio feature gating for the 2.8 release boundary.

Ruff passed the backend, tests and scripts. Strict MyPy passed across 30 backend source files. Python compileall passed. The ordinary suite emits one non-failing upstream Starlette TestClient/httpx deprecation warning.

The offline doctor passed and reported version 2.8.0. The workstation dictionary database contains 244 total entries because it also preserves four local non-starter records; its metadata correctly reports the reviewed starter layer as 240 entries. This is not presented as a 244-concept starter curriculum.

### Frontend and build evidence

TypeScript passed. Vitest passed all 133 tests across 29 files. Coverage includes:

- Guided, Explorer and Experienced modes.
- Three-word beginner entry before account/profile configuration.
- Daily-practice loading, resumption, retry, unsupported-microphone and manual-fallback states.
- Honest saved/unsaved and online/offline behavior.
- Curriculum path, 22-letter sound-first track and B1/B2 Lab labeling.
- Six exercise families and 12 category illustration kits.
- Accessible profile menu and persisted focus, text, voice and speed preferences.
- Dictionary reading hints and offline starter-dictionary behavior.
- Healthy goals, XP/mastery separation and reduced-motion celebrations.
- Public disabling of experimental cloud AI/audio controls.

The Vite production build completed without a chunk-size warning:

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

The 558,348-byte offline starter dictionary contains exactly 240 unique reviewed entries and no user, session, profile or token fields.

### Browser and accessibility evidence

Playwright and axe completed with 20 passes, 22 intentional skips and zero failures. The matrix covers:

- 390 px, 768 px and 1440 px viewports.
- English, Spanish and Hebrew.
- LTR and RTL.
- Guided, Explorer and Experienced experiences.
- Light and dark themes.
- Keyboard-visible focus.
- Reduced motion.
- A CSS-equivalent 200% zoom/reflow check.
- Serious and critical axe violations.

No serious or critical axe violation remained in the executed matrix. This evidence does not replace the required real-user beginner pilot.

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
2. Complete the mother pilot from a WhatsApp link: find the primary action within 30 seconds, learn three words, finish a session without assistance and confirm progress after reload. Cross-device continuity belongs to the two-account hosted gate, not the LAN-only pilot.
3. Back up production immediately before deployment and verify login, persistence, export and deletion after deployment.
4. Wait until the OpenAI Build Week judging freeze ends, then obtain explicit final approval before merge, push, tag `v2.8.0`, GitHub Release or Railway deployment.

No rollback to the 2.4 application is safe after 2.8 accepts writes using the new schema unless the matching pre-deployment database backup is restored.

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

The following remains the current public evidence; none of it is presented as 2.8 production verification:

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

Passing tests and local checks materially reduce risk but do not prove defect-free software. This report deliberately separates current 2.8 source evidence, historical private checkpoints, live-production evidence and credential-, device- or operator-dependent gates.
