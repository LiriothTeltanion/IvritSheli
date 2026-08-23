# Ivrit Sheli — Verification Ledger

- **Current private source candidate:** `2.12.2` / local artifact / unpublished
- **Latest gate date:** 2026-08-23 (2.12.2). The 2.12.0 Nocturne gate of
  2026-08-14 is preserved below as history and is not relabelled.
- **Current verified public production:** `2.4.0` / Railway / PostgreSQL / verified 2026-07-21
- **Historical candidate baselines:** `2.11.0` passed 705 frontend and 315
  backend tests plus its 240 × 3 visual matrix on 2026-08-14; `2.10.0` Phase
  4A.1 completed 1,047 automated passes on 2026-08-13. Neither number is
  relabelled as 2.12.0 proof.

## Current 2.12.0 evidence boundary

This visual checkpoint preserves **240/240 exact semantic scenes** while adding
dark-first theme resolution, responsive regional art, adult shared geometry,
setting-aware spatial context and short semantic motion. Fresh 2.12 results are
recorded below after execution. The PostgreSQL/RLS and no-cache Docker results
remain inherited 2.10 evidence because this slice does not change runtime data
boundaries. Human recognition, speech pilot and isolated staging remain
required before publication.

The verified public `2.4.0` production record remains unchanged. Nothing in
this private artifact claims that 2.12.0 is deployed, tagged, released or
submitted to Devpost.

## Visual Harmony & Resilience gate — reference Windows machine — 2026-08-23

Recorded from commands actually executed on this date. Anything not listed here
was **not** run for 2.12.2, whatever an earlier summary may have claimed.

| Gate | Command | Result |
|---|---|---|
| Complete frontend suite | `npx vitest run` | **747 passed across 45 files** |
| TypeScript project build | `npx tsc -b --pretty false` | **Passed** |
| Production bundle | `npm run build` | **Passed** in 0.78 s; the known non-blocking main-chunk warning remains (index 552.95 kB / 171.38 kB gzip) |
| Complete backend suite | `.venv\Scripts\python.exe -m pytest backend/tests -q` | **315 passed / 1 PostgreSQL-gated skip** |
| Backend style | `.venv\Scripts\python.exe -m ruff check backend/src` | **Passed** |
| Backend types | `.venv\Scripts\python.exe -m mypy backend/src` | **Passed** across 39 source files |
| Running stack | `backend-local` + `frontend` launch profiles | **Passed**: SQLite offline mode on 8000, Vite on 5173, learner shell renders, no console errors from the app |
| Visual QA catalogue | `127.0.0.1:5173/?visualQa=1&group=all&size=card` | **240 scene SVGs present in the DOM** |

### What this gate corrected

The backend entered this session at **4 failed / 311 passed**. The four failures
were guard tests correctly catching regressions that had accumulated in an
uncommitted working tree: least-privilege roles and RLS `TO <role>` clauses
stripped from four already-applied migrations, the administrator-`DATABASE_URL`
guard deleted, a repository cache not invalidated on write, and a Supabase
bearer path that raised `TypeError` on every request into a bare `except`. All
five are repaired in `9d8d463`.

### Not run for 2.12.2

- Playwright browser matrix and the 240 × 3 contact matrices.
- Offline doctor.
- `scripts/verify_package.py` integrity gate.
- PostgreSQL 17 / RLS isolation and the no-cache container smoke. Those remain
  **inherited 2.10.0 Phase 4A.1 evidence** and are not relabelled. The local
  PostgreSQL path additionally cannot be exercised until `DATABASE_URL`
  authenticates as `ivrit_sheli_runtime` rather than a superuser.
- Human five-second recognition, Hebrew-content acceptance and the mother pilot.

## Living Hebrew Nocturne gate — reference Windows machine — 2026-08-14

| Gate | Command | Result |
|---|---|---|
| Complete frontend suite | `npm run test:run` | **717 passed across 41 files** |
| TypeScript + production build | `npm run build` | **Passed**; Visual QA 19.00 kB JS / 6.24 kB gzip and 16.37 kB CSS / 3.58 kB gzip; the known non-blocking main-chunk warning remains |
| Complete backend suite | `.venv\\Scripts\\python.exe -m pytest backend/tests -q -p no:cacheprovider` | **315 passed / 1 PostgreSQL-gated skip** |
| Backend style/types/compile | Ruff + strict MyPy + compileall | **Passed**; MyPy covered 39 source files |
| Offline doctor | `.venv\\Scripts\\python.exe -m ivrit_sheli --doctor` with isolated in-memory DBs | **7/7 passed as 2.12.0**, 240 dictionary entries, senses, forms and examples |
| Full semantic catalog + journey art + recognition lab | `npx playwright test -g "visual recognition expansion" --workers=1` | **7 passed / 2 expected project skips**: all 240 scenes and seven paintings passed at 390, 768 and 1440 px; the desktop-only full recognition flow passed |
| Responsive journey paintings | same Playwright matrix above | **3/3 passed** at 390, 768 and 1440 px, including portrait source selection, action-preserving hero crop, reduced motion, overflow and desktop axe |
| Contact matrices | local Playwright capture tooling | **240/240 light + 240/240 dark card scenes rendered** without blank scenes |
| In-app browser review | VisualQAGallery at `127.0.0.1:5173` | **Passed**: dark default, seven complete raster images, responsive regional grid and `scrollWidth == clientWidth` at the inspected 1270 px viewport |
| Package integrity | `.venv\\Scripts\\python.exe scripts\\verify_package.py` | **Passed**: 217 required files and 387 canonical Git-index SHA-256 entries |

The complete frontend run caught two integration defects before this ledger was
closed: an undefined communication-scene CSS class and an under-budgeted lazy
gallery test wait. Both were corrected and the full 715-test suite was rerun.
The one backend skip requires explicit migration/runtime PostgreSQL DSNs; no
credentials were supplied for this visual slice. The prior 2.10.0 Phase 4A.1
PostgreSQL/RLS, dependency-audit and no-cache Docker evidence therefore remains
historical and is not relabelled as a 2.12.0 execution.

Automated recognition proves render coverage and interaction contracts, not
human comprehension. A short human five-second review of the remaining
confusable clusters and family diagrams is still required.

## Historical 2.11.0 evidence boundary

This editorial checkpoint preserves **240/240 exact semantic scenes** while
adding global art metadata, five frame families, adult character variants,
thumbnail-safe semantic detail and a trilingual domain-based QA workbench. Its
tests are recorded as new 2.11 evidence below; the PostgreSQL/RLS and no-cache
Docker results remain inherited 2.10 evidence because this slice does not
change those runtime boundaries. The **human recognition, speech pilot and
staging checks remain required before publication**.

The verified public `2.4.0` production record remains unchanged. Nothing in this private artifact claims that 2.11.0 is deployed, tagged, released or submitted to Devpost.

## Living Hebrew Field Notes gate — reference Windows machine — 2026-08-14

| Gate | Command | Result |
|---|---|---|
| Focused semantic art/workbench | `npm run test -- --run src/components/SemanticWordIllustration.test.tsx src/components/VisualQAGallery.test.tsx` | **488 passed** |
| Complete frontend suite | `npm run test:run` | **705 passed across 40 files** |
| TypeScript + production build | `npm run build` | **Passed**; Visual QA 15.58 kB JS / 5.16 kB gzip and 12.83 kB CSS / 2.88 kB gzip |
| Complete backend suite | `.venv\\Scripts\\python.exe -m pytest backend/tests -q -p no:cacheprovider` | **315 passed / 1 PostgreSQL-gated skip** |
| Backend style/types/compile | Ruff + strict MyPy + compileall | **Passed**; MyPy covered 39 source files |
| Offline doctor | `.venv\\Scripts\\python.exe -m ivrit_sheli --doctor` with in-memory DBs | **7/7 passed as 2.11.0**, 240 dictionary entries |
| Full visual catalog — desktop | Playwright `renders all 240 exact scenes…`, `desktop-1440` | **Passed**, including 720 SVG, dark, HE/RTL, reduced motion, 200% reflow and axe |
| Full visual catalog — mobile | Same case, `mobile-390` | **Passed**, including 720 SVG, HE/RTL and 200% reflow |
| Recognition lab — desktop | Playwright five-second recognition case | **Passed** |

The one backend skip requires explicit migration/runtime PostgreSQL DSNs; no
such credentials were supplied for this visual slice. The prior 2.10.0 Phase
4A.1 PostgreSQL/RLS, dependency-audit and no-cache Docker evidence remains
historical and is not relabelled as a 2.11.0 execution. Human recognition of
the confusable semantic clusters remains a separate acceptance gate.

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
| Python dependency audit | `pip-audit -r backend/requirements.txt` | **No known vulnerabilities** after the isolated `cryptography` 49.0.0 → 50.0.0 upgrade |

**Unique directly executed automated passes: 1,041** — 697 frontend, 312
backend, 32 browser. The credential-gated PostgreSQL skip is not counted, and
the 40 Playwright skips are intentional project-scoped matrix exclusions rather
than passes or failures.

### Dependency finding — resolved 2026-08-11

`cryptography==49.0.0` carried **PYSEC-2026-3552**. It was deliberately left
alone during the stabilisation pass — a major bump of a cryptography library
deserves its own change and its own verification, not a line edited to silence a
warning — and was then upgraded on its own to **50.0.0**, the lowest published
release that resolves the advisory and, as of this date, the only 50.x release.

The pin is reached two ways, and both were checked:

- **Directly**, through `push_notifications.py`, which uses exactly one API:
  `cryptography.fernet.Fernet` for encrypting subscription documents at rest.
  A ciphertext produced under 49.0.0 was decrypted byte-identically under
  50.0.0, so stored subscriptions survive the upgrade.
- **Transitively**, through `pywebpush`, `py-vapid` and `http-ece`, which reach
  much deeper into the library than Ivrit Sheli does and which the test suite
  stubs out. They were exercised directly against 50.0.0 with deprecation
  warnings promoted to errors: VAPID key generation and claim signing, an
  `aes128gcm` encrypt/decrypt round trip, and a real `WebPusher` payload
  encoding. All three passed with no warning. None of the three caps the
  version — they declare `>=2.5`, `>=46` and `>=2.6.1`.

`pip-audit -r backend/requirements.txt` now reports **no known vulnerabilities**.
No application code changed; the upgrade required no compatibility edits.

### Still not claimed at that point

HTTPS staging, two-real-account isolation and the Hebrew accuracy pilot were not
run. PostgreSQL and Docker were also outstanding then; they were closed in the
run recorded below.

## PostgreSQL 17 and production-shaped container validation — 2026-08-11

Executed locally on the reference Windows machine against disposable
infrastructure with throwaway credentials. **This is local production-shaped
verification of the 2.10 candidate. It is not a deployment, and it is not a
public or staging verification.** The verified public production record remains
`2.4.0` on Railway, dated 2026-07-21, and nothing in this candidate is deployed,
tagged, released or submitted.

| Area | Result |
|---|---|
| PostgreSQL tested | **17.10** (`postgres:17-alpine`, digest-pinned) |
| Docker / Compose | Docker **29.6.2**, Compose **v5.3.1** |
| Alembic from empty database | **5 revisions applied to head**, `20260716_0001` → `20260727_0005` |
| Runtime-role provisioning | **Passed**, `database.provision.ready` |
| PostgreSQL-gated suite | **3 passed** — the case that had been skipped since 2.9 now executes |
| Complete backend suite | **310 ordinary + 3 PostgreSQL = 313 passed, 0 skipped** |
| Image build | **Passed** from current source with `--no-cache` |
| `cryptography` inside the image | **50.0.0** verified in the built image, not inherited from a cached layer |
| Container process | uvicorn as PID 1, **UID/GID 10001:10001** on all four of real, effective, saved and fs |
| `/health/live` | `alive`, 2.10.0 |
| `/health/ready` | `ready`, `postgresql: true`, dictionary **240 entries / 240 senses**, schema v3 |
| `/version` | 2.10.0 · environment `development` (the compose loopback policy) · storage **postgresql** |
| Migration credentials in the app process | **Absent.** Compose never passes them, and when deliberately injected the entrypoint removes them before the final UID 10001 process |
| Log redaction | **No leak** across 93 log lines against ten patterns: role passwords, session secret, push key, credential-bearing DSNs, `Authorization`, session cookie, OAuth code and state |
| Graceful shutdown / restart | Clean uvicorn sequence, **exit code 0** in 1.8s; healthy again 6s after restart |
| `docker compose down -v` | Clean. Host learner databases byte-identical before and after — the stack uses named volumes, no bind mount to the repository `data/` |

### Current local automated baseline after Phases 1–3

Combining the latest directly executed reference-machine results gives **1,042 automated passes** for the 2.10 candidate: 697 Vitest + 313 backend pytest + 32 Playwright/axe. This is a convenience total across distinct suites, not a substitute for their individual assertions, and it remains local candidate evidence rather than public/staging verification.

### Database security posture, as measured

- `SESSION_USER` = `CURRENT_USER` = `ivrit_sheli_runtime`. PostgreSQL's own
  connection log confirms the container authenticates **directly** as that role
  over `scram-sha-256`; there is no `SET ROLE` step to audit.
- Role attributes: `SUPERUSER no · CREATEDB no · CREATEROLE no · REPLICATION no ·
  BYPASSRLS no · INHERIT no · LOGIN yes`. Same for the push worker.
- **Zero** memberships in any other role.
- Row Level Security **ENABLED and FORCED** on `learner_states`,
  `push_subscriptions` and `push_delivery_state`.
- Grants are least-privilege; `alembic_version` is **SELECT only**, which is what
  readiness needs and nothing more.
- No `CREATE` on the database and no `CREATE` on schema `public`.
- Attempted from the runtime role and denied with `InsufficientPrivilege`:
  `CREATE DATABASE`, `CREATE ROLE`, `SET ROLE` to the administrator,
  `ALTER ROLE … BYPASSRLS`, `CREATE TABLE` in `public`.

### Tenant isolation, two synthetic learners

Read, write and delete were each attempted across the tenant boundary:

- Learner A sees exactly one row, their own. An explicit query for B's row
  returns **0 rows**.
- `UPDATE` and `DELETE` against B's row affect **0 rows**.
- `INSERT` carrying B's `user_id` is rejected by the policy itself —
  *new row violates row-level security policy* — not merely by a check
  constraint.
- With no `app.user_id` set, the table returns **0 rows**: the default is
  closed, not open.
- State survives across independent connections unchanged.
- Deleting A cascades to A's learner state and leaves B's untouched.

All identities and data were synthetic and disposable, and the environment was
destroyed afterwards.

## Phase 4A.1 Windows adoption gate — 2026-08-13

Executed on the reference Windows machine against the Phase 4 delta layered on
`d475304`. This closes the artifact-stage limitation recorded below. It remains
local candidate evidence: no staging, production, tag, push or release action
was performed.

| Gate | Result |
|---|---|
| TypeScript | **Passed**, 0 errors |
| Frontend tests | **699 passed / 40 files / 0 failed** |
| Vite production build | **Passed**; the existing >500 kB chunk advisory remains a warning |
| Ruff / strict MyPy | **Passed** / **passed across 39 source files** |
| Host backend suite | **315 passed / 1 PostgreSQL credential-gated skip / 0 failed** |
| Disposable PostgreSQL 17 suite | **3 passed / 0 failed**; the one host skip executed, so current unique backend coverage is **316 passed** |
| Browser + accessibility | **32 passed / 40 intentional project-scoped skips / 0 failed** across 390, 768 and 1440 px, light/dark, HE RTL, reduced motion, 200% reflow and axe |
| Python compile / offline doctor | **Passed** / **7 checks passed as 2.10.0** |
| Package verifier / checksums | **Passed — 202 required files** after the final documentation refresh; **372 canonical Git-index checksums** regenerated and verified |
| Dependency audits | `pip-audit`: **no known vulnerabilities**; npm production and full tree: **0 vulnerabilities** |
| Docker image | **Passed** from current source with `--no-cache`; validation tag `ivrit-sheli:phase4a1-verified` |
| Isolated image smoke | **ready**, `/health/live` 200, 2.10.0, SQLite; uvicorn PID 1 ran as UID/GID **10001:10001** for real/effective/saved/fs identities |
| Runtime credential boundary | Deliberately injected migration/push credentials were **absent from PID 1**; OAuth/log redaction passed for all supplied forbidden values |

The browser gate initially reproduced resource contention when the HMR server
mounted the 240-scene gallery at three sizes across concurrent projects. Traces
showed that product assertions had passed and axe was still traversing 720 SVGs
when the case budget expired. The harness now builds once, serves the optimized
artifact with `vite preview`, keeps CI at two workers, serializes locally, and
gives only the full-catalog case a 180-second total budget while retaining its
60-second mount assertions. It also refuses to reuse an unknown process on the
gate port. The final clean build/preview rerun passed the complete unchanged
matrix in 3.3 minutes. This is a determinism fix to the verification boundary,
not a product behavior change.

**Current unique automated evidence: 1,047 passes** — 699 Vitest + 316 backend
pytest + 32 Playwright/axe. Counts are not inflated by the two PostgreSQL tests
that run in both the host and disposable-database invocations.

## Phase 4 artifact-stage consolidation — Nova sandbox — 2026-08-11

This source artifact starts the first deliberately small post-validation architecture slice on top of `d475304`. The sandbox has no package-registry access, so this section records only checks actually executable here; **the normal Windows full gate is still required before these Phase 4 edits are adopted/committed in the real repository**.

| Check | Result |
|---|---|
| Python compileall | **Passed** for backend source/tests and scripts |
| TypeScript/TSX syntax transpilation | **127 files / 0 syntax errors** using the available TypeScript compiler |
| Dynamic code-label parity (source guard) | **93 EN / 93 ES / 93 HE labels; unique key counts aligned** |
| Dictionary route ownership | **6 dictionary route decorators moved out of `api.py`; 6 registered in `api_dictionary.py`** |
| Package identity | `ivrit-sheli-web` frontend / `ivrit-sheli` Python distribution |
| Package verifier | **Passed — 200 required files** after the Phase 4 ownership additions |
| Clean-package checksum manifest | **370 entries regenerated and verified** |
| Full TypeScript/Vitest/Vite | **Not executed in this sandbox** — npm registry unavailable; baseline `d475304` had already passed 697/697 + build on Windows, but Phase 4 must rerun there |
| Full Ruff/MyPy/pytest/PostgreSQL/Docker | **Not executed for the Phase 4 delta in this sandbox**; do not infer a pass from the Phase 1–3 baseline |

Phase 4 changes are intentionally narrow: dynamic code-label ownership, current package/brand identity cleanup, and one dictionary HTTP-route extraction with a route-contract test. No repository transaction, auth, RLS, migration or runtime configuration logic moved.

## Artifact checks executed in the consolidation sandbox — 2026-08-10

This table records what the consolidation sandbox itself could prove, before the
artifact ever reached a machine with a package registry, PostgreSQL or Docker.
It is kept as a true record of that environment. Its last three rows have since
been **superseded** by the two sections above, which ran the gates it could not;
each says so inline. Its checksum row counts that export's clean-package walk —
the manifest in this repository is a different set, **362 canonical Git-index
entries**.

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
| Full backend pytest | Not executed in this sandbox — the intentionally clean source export contains no virtualenv and it lacks the pinned `psycopg` package. **Superseded 2026-08-11: 313 passed, 0 skipped** on the reference machine. |
| Full npm/Vitest/Playwright/Vite | Not executed in this sandbox — `node_modules` is intentionally excluded and it has no package-registry access. **Superseded 2026-08-10/11: Vitest 697/697, Playwright 32/32, `tsc` and the Vite build clean** on the reference machine. CI remains configured to run the complete gate after `npm ci`. |
| PostgreSQL/Docker/staging/speech pilot | PostgreSQL and Docker: **superseded 2026-08-11** by the local production-shaped run above — PostgreSQL 17.10 and a `--no-cache` image build, both against disposable infrastructure. Staging and the speech pilot remain **unrun and unclaimed**. |

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
defect-free software. This report deliberately separates current v2.12.0
source evidence, historical private checkpoints, live-production evidence and
credential-, device-, packaging- or operator-dependent gates.
