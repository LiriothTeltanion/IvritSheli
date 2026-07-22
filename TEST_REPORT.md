# Ivrit Sheli 2.5.0 Private Pilot — Verification Ledger

- **Ledger update date:** 2026-07-22
- **Time zone:** Asia/Jerusalem
- **Current private source candidate:** `2.5.0` / local / unpublished
- **Private-pilot consolidated verification:** Pending
- **Current verified production:** `2.4.0` on Railway with PostgreSQL
- **Release implementation commit:** `03bf84b9268ff8be528c0fab3c670f9652ee23b0`

## Current status

The 2.5 Private Pilot is a source candidate and is not yet claimed as fully verified, deployed, tagged or published. Its consolidated backend, frontend, accessibility-oriented build and browser results will be recorded only after those commands complete. The table and command evidence below preserve the last fully verified 2.4 Contest Edition baseline; they are not relabeled as 2.5 evidence.

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
