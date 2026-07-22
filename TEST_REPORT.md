# Ivrit Sheli 2.6.0 Learning Core — Verification Ledger

- **Ledger update date:** 2026-07-22
- **Time zone:** Asia/Jerusalem
- **Current private source candidate:** `2.6.0` / local / unpublished
- **Private-pilot consolidated verification:** Passed locally
- **Current verified production:** `2.4.0` on Railway with PostgreSQL
- **Release implementation commit:** `03bf84b9268ff8be528c0fab3c670f9652ee23b0`

## Current status

The 2.6 Learning Core is a locally verified private source candidate. It is not deployed, tagged, pushed or published. Its local test, PostgreSQL, dependency, package, image and browser evidence is recorded below; the verified 2.5 foundation and public 2.4 Contest Edition remain separate records.

## Verified private 2.6 candidate

| Verification area | Private 2.6 result |
|---|---:|
| Ordinary backend suite | **179 passed / 1 PostgreSQL-gated skip** |
| Dedicated PostgreSQL 17 gate | **3 passed** |
| Unique backend automated tests | **180 passed** |
| Frontend suite | **97 passed / 22 files** |
| Total unique automated tests | **277 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 27 source files |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Python compileall / offline doctor | Passed / passed |
| pip-audit / npm production audit | No known vulnerabilities / 0 vulnerabilities |
| Package verifier | 81 required files and packaged assets passed |
| Docker Compose configuration | Passed |
| Private Docker image build | Passed as `ivrit-sheli:v2.6-private` |
| Disposable SQLite image readiness/version | Passed / `2.6.0` |
| Independent correctness/privacy review | Clean |

The ordinary backend run includes two environment-independent tests from `test_postgres_integration.py`; its third case is skipped without administrator and restricted-runtime URLs. Running that file against a disposable PostgreSQL 17 instance passed all three, replacing the one skip and producing 180 unique backend passes rather than 182. Together with 97 frontend tests, the private candidate has 277 unique passing automated tests.

### Consolidated commands and evidence

```powershell
.\.venv\Scripts\ruff.exe check backend\src backend\tests scripts\verify_package.py scripts\verify_container_logs.py
.\.venv\Scripts\mypy.exe --config-file backend\pyproject.toml backend\src
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m compileall -q backend\src scripts\verify_package.py scripts\verify_container_logs.py
.\.venv\Scripts\python.exe -m ivrit_sheli --doctor
.\.venv\Scripts\python.exe scripts\verify_package.py
.\.venv\Scripts\python.exe -m pip_audit -r backend\requirements.txt
npm --prefix frontend run typecheck
npm --prefix frontend run test:run
npm --prefix frontend run build
npm --prefix frontend audit --omit=dev
docker compose config --quiet
docker build --tag ivrit-sheli:v2.6-private .
```

The dedicated PostgreSQL command ran `backend/tests/test_postgres_integration.py` against disposable PostgreSQL 17 administrator and direct restricted-runtime DSNs; the container was removed immediately afterward. A second disposable container ran the production image with private SQLite state on loopback. Its readiness and `/version` endpoints passed, reporting version `2.6.0`, storage `sqlite` and environment `development`; it was also removed after the check.

Browser QA covered the English desktop Today experience, a 390×844 mobile viewport, Hebrew `lang=he` / `dir=rtl`, the Encounter → Retrieve → Reference feedback → Corrected retry path, an RTL Hebrew production field and an empty error/warning console. The reduced-motion media preference was recognized; the current README screenshots were intentionally not replaced and remain labelled as older public visual evidence.

The final independent review found no remaining actionable correctness, transparency or privacy issue. It specifically rechecked idempotent replay, stale-state conflicts, delayed timing, learner-self-report provenance, retention windows, niqqud restoration and missing-pointed-form behavior, coherent degraded content, incomplete-meaning gating and optional-TTS labelling. One non-failing upstream Starlette TestClient/httpx deprecation warning remains.

This evidence does not claim a public v2.6 deployment, live Google re-authorization, live OpenAI/Workspace provider calls, a real-phone pilot, 24-hour/7-day/30-day longitudinal learner outcomes or a production backup/restore drill.

## Verified private 2.5 foundation

Before the v2.6 branch was created, the complete v2.5 worktree was verified and preserved locally at commit `36c9791`:

| Verification area | Private 2.5 result |
|---|---:|
| Ordinary backend suite | **157 passed / 1 PostgreSQL-gated skip** |
| Frontend suite | **74 passed / 19 files** |
| Combined ordinary automated checks | **231 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 26 source files |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Package verifier | 75 files passed |

The v2.5 foundation was not deployed, tagged or pushed. These numbers are not relabeled as v2.6 results.

The verified public 2.4 Contest Edition passes the local backend, dedicated PostgreSQL, frontend, dependency, package and production-shaped Docker/Compose gates documented below. Railway production separately reports version 2.4.0 with PostgreSQL and all 48 reviewed dictionary entries ready. The English entry, read-only guided tour, identity-only Google sign-in, onboarding/session persistence across reload and logout were verified in a normal browser. Git tag and GitHub Release `v2.4.0` are published.

| Verification area | Verified public 2.4 result |
|---|---:|
| Unique backend automated tests | **151 passed** |
| Ordinary backend run | **150 passed / 1 PostgreSQL-gated skip** |
| Frontend automated tests | **62 passed / 16 files** |
| Total unique automated tests | **213 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 24 source files |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Dedicated PostgreSQL 17 migration/isolation gate | 3 passed |
| Compileall / offline doctor | Passed / passed |
| pip-audit | No known vulnerabilities |
| npm production audit | 0 vulnerabilities |
| Package verifier | 66 files passed |
| Production-image Compose smoke | Passed |
| CI / CodeQL | Passed on `main` for the tagged release source |
| Live 2.4 deployment | Passed on 2026-07-21 |
| Current live release | `2.4.0` / production / PostgreSQL |
| Release implementation commit | `03bf84b9268ff8be528c0fab3c670f9652ee23b0` |
| Latest Git tag / GitHub Release | `v2.4.0` / `v2.4.0` |

### Counting the backend total

The ordinary 2.4 suite reports `150 passed, 1 skipped`; the skipped case requires administrator and restricted-runtime PostgreSQL URLs. The dedicated command reports `3 passed`. Two of those tests also run in the ordinary suite, while the credential-gated test replaces its skip, producing 151 unique backend passes rather than 153. Together with 62 frontend tests, the verified local baseline is 213 unique passing automated tests.

## Verified 2.4 commands and evidence

### Backend quality and local-first suite

```powershell
.\.venv\Scripts\ruff.exe check backend\src backend\tests scripts\verify_package.py scripts\verify_container_logs.py
.\.venv\Scripts\mypy.exe --config-file backend\pyproject.toml backend\src
.\.venv\Scripts\pytest.exe backend\tests -q
```

Result: Ruff passed; strict MyPy passed across 24 source files; compileall and offline doctor passed; pip-audit reported no known vulnerabilities; `150 passed, 1 skipped`. The ordinary suite emitted one non-failing upstream Starlette TestClient/httpx deprecation warning.

Coverage includes:

- Provider-bound Google and GitHub OAuth state, S256 PKCE and provider-specific callbacks.
- Minimal identity persistence with no Google email or provider bearer tokens.
- Account deletion cascade, CSRF enforcement and a downgrade guard when Google identities exist.
- Atomic local onboarding fields and cloud-profile persistence.
- Exactly 48 curated A0/A1 visual concepts with stable multilingual metadata and upgrade compatibility.
- Search convergence across Hebrew, romanization, English and Spanish.
- Visit-only EN/ES/HE overrides, the four-stop read-only judge tour and ephemeral First Steps state.
- Keyed BLAKE2b-256 bearer digests and existing 2.2 voice, microphone, registry, homograph and tenant-isolation regressions.

### Dedicated PostgreSQL 17 gate

The source was run against disposable PostgreSQL 17 administrator and restricted-runtime DSNs with:

```powershell
.\.venv\Scripts\pytest.exe backend\tests\test_postgres_integration.py -q
```

Result: `3 passed` in an isolated PostgreSQL 17 container with separate administrator and restricted-runtime DSNs. The gate covers Alembic upgrade/provisioning, direct restricted-role login, forced RLS and tenant isolation, account-deletion cascades, provider-bound state and the refusal to downgrade away Google identity data.

### Frontend

```powershell
cd frontend
npm run typecheck
npm run test:run
npm run build
```

Result: TypeScript passed; 16 test files and 62 tests passed; npm production audit reported zero vulnerabilities; the Vite production build completed at 404.21 kB JavaScript / 117.97 kB gzip and 122.19 kB CSS / 23.46 kB gzip.

The frontend suite covers beginner onboarding, deterministic visit-only language selection, the four-stop read-only demo tour, ephemeral five-word First Steps, guided progress, 48-concept visual dictionary rendering, Google/GitHub availability, microphone/voice behavior, export/account deletion, registry behavior, authentication/demo boundaries, RTL and API contracts.

### Package checks

```powershell
.\.venv\Scripts\python.exe scripts\verify_package.py
git diff --check
```

Result: the 66-file package verifier passes required-file, JSON, SVG, strict public portfolio manifest, source/live release-truth drift, Railway type, portable Docker-cache, secret-hygiene and README-link checks. `git diff --check` passes.

### Production Compose/image smoke

```powershell
docker compose up --build --wait
```

Result: passed against the 2.4.0 production image. Readiness reported PostgreSQL true; the application ran as UID 10001, the migration DSN was absent from the application runtime, and OAuth rate limiting plus structured-log redaction checks passed.

## Current public Railway verification — 2.4.0

- URL: https://ivritsheli-production.up.railway.app
- Release implementation commit: `03bf84b9268ff8be528c0fab3c670f9652ee23b0`; later evidence and documentation deployments preserve version `2.4.0`.
- `/version`: release `2.4.0`, environment `production`, storage `postgresql`, verified on 2026-07-21.
- `/health/ready`: HTTPS 200 with PostgreSQL and all 48 reviewed dictionary entries ready on 2026-07-21.
- Latest published tag and GitHub Release: `v2.4.0`.
- Browser evidence: the English entry and four-stop read-only guided tour passed; identity-only Google sign-in succeeded; onboarding state and the authenticated session persisted across reload; logout returned to the English auth landing page and another reload remained signed out.
- Boundary: re-login after logout, a live GitHub account session, live OpenAI or Google Workspace connector calls, two-real-user production isolation and backup restoration were not verified.

## Remaining publication and operator checks

- Preserve existing learners' exact level and bypass first-run onboarding during migration; cover both local and legacy-cloud profiles.
- Expand browser verification beyond the corrected English First Steps contrast into the full dark/light onboarding, guided dashboard and dictionary matrix.
- Confirm the account-backed First Steps checkpoint and completion survive logout and a second sign-in. Onboarding and the active session already persisted across a normal reload. The current UI prevents Back from resubmitting completed words, but word/review/profile writes remain separate requests rather than one server-side idempotent transaction.
- Give the persisted guided-mode switch real simplified/full-shell behavior or remove it until that behavior exists.
- Verify re-login after logout and a complete second sign-in without weakening the already verified signed-out state.
- Confirm GitHub remains a working secondary sign-in path.
- Check desktop, 390 px mobile, Hebrew RTL, reduced motion, keyboard navigation and 200% zoom; refresh README screenshots only after those checks pass.
- Exercise account export in production. Do not delete the owner's real account merely to prove deletion; use the real PostgreSQL automated boundary or a disposable test identity.
- Review provider cost ceilings, managed backup retention and a full restore drill before describing the hosted pilot as durable.
- Treat OpenAI AI/audio calls and Gmail, Drive or Calendar connector access as separate consent-, credential- and allowlist-gated capabilities; none is verified by identity-only Google sign-in.

## Reliability statement

Passing tests and live checks materially reduce risk but do not prove defect-free software. This report deliberately separates local source evidence, the current live-production record, published GitHub release artifacts and credential- or environment-dependent operator checks.
