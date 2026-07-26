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

This ledger does **not** promote 2.8.0 to production. The Docker daemon could not start, so the PostgreSQL 17 integration, production-image readiness and backup/restore drills were not rerun for this candidate. Two-account Google persistence/isolation and the required beginner pilot with Kevin's mother also remain unverified. The live Railway application, Git tag and GitHub Release therefore remain at verified version 2.4.0.

## Verified private 2.8 candidate

| Verification area | Current 2.8 result |
|---|---:|
| Ordinary backend suite | **194 passed / 1 credential-gated PostgreSQL skip** |
| Frontend Vitest suite | **124 passed / 28 files** |
| Playwright + axe browser matrix | **20 passed / 22 intentional skips / 0 failed** |
| Directly executed automated passes | **338 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 30 backend source files |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Python compileall | Passed |
| Offline doctor | Passed; source version `2.8.0` |
| pip-audit | No known vulnerabilities |
| npm production audit | 0 vulnerabilities |
| Docker Compose configuration | Passed |
| Source package verifier | Passed / 111 required files |
| Canonical Git-blob checksum manifest | Passed / 259 files |
| PostgreSQL 17 integration gate | **Not rerun — Docker daemon unavailable** |
| Production Docker image/readiness | **Not verified for 2.8** |
| PostgreSQL backup/restore drill | **Not verified for 2.8** |
| Two live Google accounts | **Not verified for 2.8** |
| Required mother pilot | **Not performed** |

The 338 figure is the transparent sum of 194 backend tests, 124 frontend unit/component tests and 20 Playwright browser cases executed for this candidate. The 22 Playwright skips are intentional viewport-independent duplicates in the configured matrix, not failures. The single backend skip requires PostgreSQL administrator and restricted-runtime connection URLs; it is not counted as a pass.

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

TypeScript passed. Vitest passed all 124 tests across 28 files. Coverage includes:

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
| Main JavaScript | 435.36 kB | 131.88 kB |
| Main CSS | 184.42 kB | 34.32 kB |
| LearnPanel JavaScript | 59.40 kB | 15.78 kB |
| LearnPanel CSS | 4.63 kB | 1.38 kB |
| Progress JavaScript | 13.02 kB | 3.77 kB |
| Settings JavaScript | 12.94 kB | 3.39 kB |
| AICoach JavaScript | 5.39 kB | 1.96 kB |
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

`pip-audit` reported no known vulnerabilities in the pinned backend requirements. `npm audit --omit=dev` reported zero production vulnerabilities. `docker compose config --quiet` passed, which verifies Compose syntax and interpolation only.

Docker Desktop failed while initializing its inference-manager listener:

```text
starting services: initializing Inference manager: listening on
unix://C:/Users/kevin/AppData/Local/Docker/run/dockerInference:
The filename, directory name, or volume label syntax is incorrect.
```

No factory reset or other destructive Docker operation was attempted. Because the daemon remained unavailable, this ledger makes no 2.8 claim for:

- A PostgreSQL 17 migration and restricted-role run.
- A production Docker image build.
- `/health/ready` from the candidate container.
- A pre-deployment PostgreSQL backup.
- A backup restoration drill.

## Unverified publication gates

Publication remains blocked until all of the following are complete:

1. Restore a working Docker daemon and rerun the PostgreSQL 17 migration, restricted-role, RLS and tenant-isolation gate.
2. Build the production image and verify `/health/ready` and `/version` from the container.
3. Create and restore a PostgreSQL backup in a disposable environment.
4. Use two real Google accounts to verify `openid profile` sign-in, account isolation and progress continuity between phone and computer.
5. Complete the mother pilot from a WhatsApp link: find the primary action within 30 seconds, learn three words, finish a session without assistance and confirm progress after reload/device change.
6. Build the final release ZIP from the confirmed commit, verify it after clean extraction and publish its external SHA-256.
7. Back up production immediately before deployment and verify login, persistence, export and deletion after deployment.
8. Obtain explicit final approval before merge, push, tag `v2.8.0`, GitHub Release or Railway deployment.

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
