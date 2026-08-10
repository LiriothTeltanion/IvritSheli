# Ivrit Sheli 2.10.0 — Visual Language Consolidation Verification Ledger

- **Current private source candidate:** `2.10.0` / local artifact / unpublished
- **Consolidation date:** 2026-08-10
- **Current verified public production:** `2.4.0` / Railway / PostgreSQL / verified 2026-07-21
- **Historical candidate baseline:** `2.9.2` completed 699 automated passes on 2026-07-28; that number is preserved as historical evidence and is not relabelled as 2.10.0 proof.

## Current 2.10.0 evidence boundary

This consolidation completes **240/240 exact semantic scenes**, centralizes candidate version identity, refreshes source-package checksum generation, adds the Visual Bible and a reversible premium-polish layer, and simplifies learner-facing storage/auth copy. The package verifier, Python compile checks and focused visual-catalog checks are rerun for this artifact. The complete frontend dependency install, full browser matrix, PostgreSQL/Docker gates, speech pilot and staging checks remain required before publication.

The verified public `2.4.0` production record remains unchanged. Nothing in this private artifact claims that 2.10.0 is deployed, tagged, released or submitted to Devpost.

## First complete gate execution — reference Windows machine — 2026-08-10

The consolidation artifact could not install packages, so the sections below it
record what a sandbox without a registry could prove. This section records the
gate actually executed afterwards on the reference Windows machine (Windows 11,
Python 3.14.6, Node 22), which is the first time 2.10 met Vitest, the Vite
build, Playwright and the complete backend suite.

That run found four defects the artifact checks could not see; they are listed
in the CHANGELOG validation addendum and fixed. The results below are **after**
those fixes.

| Gate | Command | Result |
|---|---|---|
| Frontend dependency audit — production | `npm audit --omit=dev` | **0 vulnerabilities** |
| Frontend dependency audit — full tree | `npm audit` | **0 vulnerabilities** after in-range patches of `postcss`, `nanoid`, `undici`; no major moved |
| TypeScript | `tsc -b --pretty false` | **Passed**, 0 errors |
| Frontend tests | `vitest run --maxWorkers=2` | **697 passed / 40 files / 0 failed** |
| Vite production build | `npm run build` | **Passed** |
| Backend lint | `ruff check backend/src backend/tests scripts` | **Passed** |
| Backend types | `mypy --config-file backend/pyproject.toml backend/src` | **Passed across 38 source files** |
| Backend tests | `pytest backend/tests -q` | **312 passed / 1 credential-gated PostgreSQL skip / 0 failed** |
| Python compile | `compileall backend/src scripts` | **Passed** |
| Offline doctor | `python -m ivrit_sheli --doctor` | **Passed as 2.10.0**, 7 checks, 0 failures |
| Browser + accessibility | `playwright test` | **32 passed / 40 project-scoped skips / 0 failed** |
| Package verifier | `python scripts/verify_package.py` | **Passed**, 197 required files |
| Python dependency audit | `pip-audit -r backend/requirements.txt` | **1 known vulnerability — not remediated**, see below |

**Unique directly executed automated passes: 1,041** — 697 frontend, 312
backend, 32 browser. The credential-gated PostgreSQL skip is not counted, and
the 40 Playwright skips are intentional project-scoped matrix exclusions rather
than passes or failures.

### Open dependency finding

`cryptography==49.0.0` carries **PYSEC-2026-3552**, fixed in 50.0.0. It is a
runtime pin, reached only through `push_notifications.py` for Web Push payload
encryption. It was **not** upgraded here: a major bump of a cryptography library
during a stabilisation pass needs its own change and its own verification, not a
line edited to silence a warning. It is the first thing to resolve in the next
pass.

### Still not claimed

PostgreSQL 17 integration, production-shaped Docker/Compose readiness, HTTPS
staging, two-real-account isolation and the Hebrew accuracy pilot were not run
here and remain required before publication. The public 2.4.0 production record
is unchanged; nothing in this candidate is deployed, tagged or submitted.

## Artifact checks executed in this environment

| Check | 2.10.0 artifact result |
|---|---|
| `python scripts/verify_package.py` | **Passed** — release truth, secret-pattern scan, JSON/SVG/assets, 240-scene catalog contract, checksums and README links |
| Required package files | **197 required files present** in the final verification run |
| Checksum generator | **Passed** in clean-package mode — **364 packaged-file SHA-256 entries** regenerated after all edits |
| Exact visual catalog | **240 catalog keys = 240 exact recipes; 0 reviewed fallbacks** |
| Visual spotlight smoke | **Passed** — 240 exact words available and a six-card seeded spotlight returned six unique trilingual visuals |
| Trilingual catalog split | **606 EN / 606 ES / 606 HE keys; sets identical** |
| TypeScript/TSX syntax transpilation | **125 source files parsed with 0 syntax errors** using the available TypeScript compiler |
| Python `compileall` | **Passed** for `backend/src` and `scripts` |
| `python -m ivrit_sheli --doctor` | **Passed** — version 2.10.0, 240-entry dictionary, local learning DB, offline AI, audio recognition match, connector registry and dashboard |
| Full backend pytest | **Not executed here** — the intentionally clean source export contains no virtualenv and this sandbox lacks the pinned `psycopg` package; installing it is unavailable in this environment |
| Full npm/Vitest/Playwright/Vite | **Not executed here** — `node_modules` is intentionally excluded and the sandbox has no package-registry access. CI remains configured to run the complete gate after `npm ci`. |
| PostgreSQL/Docker/staging/speech pilot | **Not claimed** — must run in the normal project/CI environment before publication |

These limitations are environmental, not silently converted into passes. The new CI configuration runs the primary local-first gate on Python 3.13 (matching the production image) and keeps a separate Python 3.10 compatibility backend gate.

---

## Historical ledger retained below

# Ivrit Sheli 2.9.1 — Private Candidate Verification Ledger

- **Ledger update date:** 2026-07-27
- **Time zone:** Asia/Jerusalem
- **Current private source candidate:** `2.9.1` / local / unpublished
- **Candidate branch:** `codex/ivrit-sheli-v2.9.1-alphabet-studio`
- **Current verified production:** `2.4.0` on Railway with PostgreSQL
- **Published release implementation commit:** `03bf84b9268ff8be528c0fab3c670f9652ee23b0`
- **Publication decision:** Blocked pending the operator and pilot gates listed below

## Current status

Ivrit Sheli 2.9.1 is a locally verified private candidate for **Hebrew Alphabet
Studio**. It adds a reviewed 22-letter and 5-final-form learning path to the
Today, curriculum, dictionary, audio and progress journeys while preserving the
2.9.0 Listening & Personal Coach foundation.

This ledger does **not** promote v2.9.1 to production. The fresh v2.9.1 results
below were executed against the current reviewed worktree. Historical 2.9.0,
2.8.3 and earlier results remain regression context and are not added to the
current total. The canonical source/package gates passed; staging, provider and
pilot gates stay explicit. The live Railway application, Git tag, GitHub
Release and Devpost entry therefore remain at verified version 2.4.0 dated
2026-07-21.

## Current v2.9.1 verification status

| Verification area | v2.9.1 result |
|---|---:|
| Focused implementation tests | Covered by the complete backend and frontend suites |
| Complete backend suite | **310 passed / 1 credential-gated PostgreSQL skip** |
| Complete frontend suite | **353 passed** |
| Playwright + axe matrix | **32 passed / 40 project-scoped skips / 0 failed** |
| Additional unique live PostgreSQL 17 case | **1 passed** |
| Unique directly executed automated passes | **696 passed**: 310 backend + 353 frontend + 32 browser + 1 additional PostgreSQL case |
| Ruff / strict MyPy / TypeScript | Passed / passed across 38 source files / passed |
| Compileall / offline doctor | Passed / passed as source version `2.9.1` |
| Vite production build | Passed |
| Dependency audits | pip-audit: 0 known vulnerabilities / npm production audit: 0 vulnerabilities |
| PostgreSQL 17 role/isolation test | **One credential-gated case passed in live PostgreSQL 17 and adds unique coverage beyond the ordinary suite** |
| Docker Compose configuration | Passed |
| Production-shaped Docker/readiness | **Passed; PostgreSQL 17 and app healthy, `/version` reports `2.9.1`, and the web process runs as non-root UID/GID 10001** |
| HTTPS staging | Not deployed |
| Two-real-account Google isolation | Not run |
| 20-word/10-phrase Kevin-and-mother Hebrew accuracy pilot | Not run |
| Canonical source verification / extracted archive | **Passed: source verifier, 327 canonical Git-index checksums, reproducible 328-blob ZIP construction, extracted-package verifier and extracted Compose parsing** |
| Public release/deployment | Not authorized; remains v2.4.0 |

The 696 total counts each directly executed check once. The ordinary backend
skip is not counted; the separate PostgreSQL 17 pass replaces that missing
environment-dependent coverage. The 40 Playwright skips are intentional
project-scoped matrix exclusions, not failures or additional passes.

## Preserved v2.9.0 baseline evidence — not v2.9.1 verification

| Verification area | Historical 2.9.0 result |
|---|---:|
| Complete backend suite | **291 passed / 1 credential-gated PostgreSQL skip** |
| Complete frontend suite | **337 passed / 37 files** |
| Playwright + axe | **26 passed / 28 scoped skips / 0 failed** |
| Unique directly executed automated passes | **655 passed** |
| Ruff / strict MyPy / TypeScript | Passed / passed across 37 source files / passed |
| Compileall / offline doctor / Vite build | Passed / passed as `2.9.0` / passed |
| Dependency audits / Compose | Passed / passed |
| PostgreSQL 17 gate | 3 passed; one case added unique coverage beyond the ordinary suite |
| Docker/readiness | Passed; non-root UID/GID 10001 and healthy live/ready/version endpoints |
| Faster Whisper preload/inference | Passed; the `small` model loaded and the silence case confirmed temporary deletion |
| Reminder worker / structured-log privacy | Passed |
| Canonical source verification | 321 canonical Git-index checksums generated; package verifier passed |

The historical 655 total is 291 backend + 337 frontend + 26 browser + one
additional PostgreSQL case. It is retained to show the verified base inherited
by Alphabet Studio, not relabelled as current 2.9.1 evidence.

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

The ordinary backend suite reports `310 passed, 1 skipped`. The skip requires
PostgreSQL credentials and is represented by one separately executed live
PostgreSQL 17 pass in the 696 total. Coverage includes:

- the reviewed catalog invariant of 22 base letters plus 5 positional final
  forms, with stable keys and trilingual guidance;
- alphabet catalog, detail, progress and idempotent-attempt API contracts;
- local persistence, migration, export/import, cloud snapshot hydration and
  backward compatibility for records without alphabet data;
- tenant isolation and account-deletion behavior;
- Today and curriculum alphabet summaries across Guided, Explorer and
  Experienced modes;
- the inherited deterministic practice, speech, coach, reminder, dictionary,
  visual and personalization contracts.

Ruff passed the backend, tests and scripts. Strict MyPy passed across 38 backend
source files. Python compileall passed. The offline doctor passed and reported
source version 2.9.1.

### Frontend and build evidence

TypeScript passed. Vitest passed all 353 tests. Coverage includes:

- Guided next-letter focus, Explorer discovery and Experienced compact
  reference over one shared progress history;
- 22 base-letter cards, 5 final forms, confusion groups, pronunciation versus
  transliteration and contextual sound notes;
- accessible browser-TTS controls and unavailable/degraded fallbacks;
- Today continuation, curriculum integration, progress updates and persisted
  attempts;
- the inherited beginner entry, daily practice, dictionary, audio, visuals,
  personalization and reduced-motion behavior.

The Vite production build completed without a chunk-size warning:

| Output | Raw | Gzip |
|---|---:|---:|
| Main JavaScript | 467.66 kB | 127.97 kB |
| Main CSS | 215.90 kB | 39.49 kB |
| Visual QA JavaScript | 6.24 kB | 2.26 kB |
| Visual QA CSS | 4.73 kB | 1.32 kB |
| LearnPanel JavaScript | 92.40 kB | 25.97 kB |
| LearnPanel CSS | 19.30 kB | 3.71 kB |
| Progress JavaScript | 15.55 kB | 4.52 kB |
| Settings JavaScript | 25.72 kB | 7.29 kB |
| AICoach JavaScript | 5.42 kB | 1.98 kB |
| Connector JavaScript | 4.39 kB | 1.52 kB |
| i18n JavaScript | 119.33 kB | 40.20 kB |

The 571,974-byte offline starter dictionary contains exactly 240 unique reviewed entries and no user, session, profile or token fields.

### Browser and accessibility evidence

Playwright and axe completed with 32 passes, 40 project-scoped skips and zero
failures. The matrix covers:

- 390 px, 768 px and 1440 px viewports.
- English, Spanish and Hebrew.
- LTR and RTL.
- Guided, Explorer and Experienced experiences.
- Light, dark and high-contrast behavior where scoped.
- Keyboard-visible focus.
- Reduced motion.
- 200% zoom/reflow.
- Serious and critical axe violations.
- Alphabet Studio navigation, cards, detail content, practice, continuation and
  degraded speech paths.

No serious or critical axe violation remained in the executed matrix. This evidence does not replace the required real-user mother-pilot acceptance retest.

### Dependency and configuration evidence

`pip-audit` reported no known vulnerabilities in the pinned backend requirements. `npm audit --omit=dev` reported zero production vulnerabilities. `docker compose config --quiet` passed.

The current Docker gate verified PostgreSQL 17 and the application as healthy,
`/version` as 2.9.1, and the application process as non-root UID/GID 10001. The
Compose configuration parsed successfully. The frozen Railway production
database was not modified.

The source verifier, 327 canonical Git-index checksums, reproducible 328-blob
ZIP construction, extracted-package verifier and extracted Compose parsing
passed. The final private artifact is regenerated from the committed tree so
its external SHA-256 can be reported without changing this source record.

## Unverified publication gates

Publication remains blocked until all of the following are complete:

1. Use two real Google accounts to verify `openid profile` sign-in, account isolation and progress continuity between phone and computer.
2. Complete the mother-pilot acceptance retest after the first Samsung session exposed onboarding, profile-isolation and Settings-navigation defects: find the primary action within 30 seconds, learn three words, finish a session without assistance and confirm progress after reload. Cross-device continuity belongs to the two-account hosted gate, not the LAN-only pilot.
3. Back up production immediately before deployment and verify login, persistence, export and deletion after deployment.
4. Wait until the OpenAI Build Week judging freeze ends, then obtain explicit
   final approval before merge, push, any `v2.9.1` tag, GitHub Release or
   Railway deployment.

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

Passing tests and local checks materially reduce risk but do not prove
defect-free software. This report deliberately separates current v2.9.1 source
evidence, historical private checkpoints, live-production evidence and
credential-, device-, packaging- or operator-dependent gates.
