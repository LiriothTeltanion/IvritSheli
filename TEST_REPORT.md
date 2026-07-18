# Ivrit Sheli Ultimate 2.2.0 — Verification Report

**Verification date:** 2026-07-16
**Production truth refreshed:** 2026-07-18
**Time zone:** Asia/Jerusalem
**Released source:** 2.2.0 merged to `main` at `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3`

## Result

The 2.2.0 local-first application, real PostgreSQL boundary and production-shaped image pass the reproducible gates below. The public Railway service independently reports the same `2.2.0` source version and merged commit with PostgreSQL readiness, and Git tag/GitHub Release `v2.2.0` now match the deployed source version.

The 2026-07-18 release-truth pass reran Ruff, strict MyPy, the ordinary backend suite (`138 passed, 1 skipped`), the disposable PostgreSQL 17 gate (`3 passed`), frontend type-check/tests/build (`48 passed`), diagnostics, Python compilation, dependency audits, Compose parsing and package verification. The unique count remains 139 backend + 48 frontend = 187; the shared PostgreSQL tests are not counted twice.

| Verification area | Result |
|---|---:|
| Unique backend automated tests | **139 passed** |
| Frontend automated tests | **48 passed / 12 files** |
| Total unique automated tests | **187 passed** |
| Ruff | Passed |
| MyPy strict | Passed across 24 source files |
| Python compilation | Passed |
| TypeScript project check | Passed |
| Vite production build | Passed |
| Offline doctor | Passed, release `2.2.0` |
| PostgreSQL 17 migration/isolation gate | 3 passed |
| Production-image Compose smoke | Passed |
| Python dependency audit | 0 known vulnerabilities |
| npm production dependency audit | 0 known vulnerabilities |
| Package verifier | 58 required files plus strict portfolio/release drift checks passed |
| Current live release | `2.2.0` / production / PostgreSQL |
| Production commit | `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3` |
| Latest Git tag / GitHub Release | `v2.2.0` / `v2.2.0` |

### Counting the backend total

The ordinary suite reports `138 passed, 1 skipped`. The skip is the credential-gated real PostgreSQL case. The dedicated PostgreSQL command runs three tests: two are already counted in the ordinary suite and the real boundary case replaces the skip. The unique backend total is therefore 139, without double-counting the two shared tests.

## Verified environment

- Local Python: 3.10.11; production image: Python 3.13 slim-bookworm.
- Local Node.js/npm: 26.3.1 / 11.16.0; image builder: Node.js 22.
- Docker / Compose: 29.6.1 / 5.1.4.
- PostgreSQL: 17 Alpine.
- React: 19.2.7.
- TypeScript: 7.0.2.
- Vite: 8.1.4.
- Vitest: 4.1.10.
- FastAPI: 0.139.0.
- Pydantic: 2.13.4.

## Commands and evidence

### Backend quality and local-first suite

```powershell
.\.venv\Scripts\ruff.exe check backend\src backend\tests scripts\verify_package.py scripts\verify_container_logs.py
.\.venv\Scripts\mypy.exe --config-file backend\pyproject.toml backend\src
$env:PYTHONPATH='backend/src'
.\.venv\Scripts\pytest.exe backend\tests -q
.\.venv\Scripts\python.exe -m compileall -q backend\src scripts\verify_package.py scripts\verify_container_logs.py
```

Result: Ruff passed; strict MyPy passed; compilation passed; `138 passed, 1 skipped`. The suite emitted one non-failing upstream Starlette TestClient/httpx deprecation warning.

Coverage added for 2.2 includes:

- Configurable server-mapped voice profiles and deterministic device preference.
- Microphone permission, double-start, late-permission, error and timeout lifecycle cleanup.
- One-Hebrew-word validation, transcript provenance and demo-safe local analysis.
- Full and fallback word-insight rendering contracts.
- Atomic dictionary links, prevention of new duplicates, homograph separation, reserved provenance labels and read-only GET behavior.
- Context-aware registry status, mastery, activity and pagination through 501 items.
- Cloud tenant isolation and pagination forwarding.

### Real PostgreSQL 17 gate

A disposable PostgreSQL 17 container exposed separate administrator and restricted runtime DSNs, then ran:

```powershell
.\.venv\Scripts\pytest.exe backend\tests\test_postgres_integration.py -q
```

Result: `3 passed`. This proves idempotent Alembic provisioning, direct restricted-role login, removal of inherited/escalation roles, session/OAuth cleanup, snapshot limits, tenant isolation, forced RLS denial, transaction recovery and exact migration-head readiness.

### Frontend

```powershell
cd frontend
npm run typecheck
npm run test:run
npm run build
```

Result:

```text
12 test files passed
48 tests passed
JavaScript: 354.03 kB / 104.23 kB gzip
CSS: 97.61 kB / 18.95 kB gzip
```

The frontend suite covers voice selection, audio lifecycle cleanup, cloud capability disabling, complete bilingual word facts, fallback labeling, screen-reader completion, dictionary playback cleanup, exact homograph navigation, stale-response protection, saved-vocabulary pagination, authentication/demo boundaries, review safety, RTL and API contracts.

### Doctor, audits and package checks

```powershell
$env:PYTHONPATH='backend/src'
.\.venv\Scripts\python.exe -m ivrit_sheli --doctor
.\.venv\Scripts\python.exe scripts\verify_package.py
.\.venv\Scripts\python.exe -m pip_audit -r backend\requirements.txt
cd frontend; npm audit --omit=dev
docker compose config --quiet
```

The doctor reported release 2.2.0 and passed learning database, 12-entry/12-sense demo dictionary, offline AI, pronunciation scoring, connector registry and dashboard checks. The package verifier passed 58 required files plus JSON/SVG parsing, the strict public portfolio manifest, cross-document release-truth drift, Railway types, portable Docker-cache policy, secret hygiene and README links. Both dependency audits reported zero known vulnerabilities on 2026-07-16; this is time-sensitive evidence, not a permanent guarantee.

`SHA256SUMS.txt` covers every packaged source file except itself using canonical Git-clean blob bytes after `.gitattributes` normalization. This avoids false cross-platform failures from a Windows CRLF working tree; verification must hash the temporary Git index blobs rather than platform-specific checkout bytes.

### Production-shaped image

```powershell
docker compose up --build --wait
```

The rebuilt stack passed PostgreSQL and application health checks. Verification covers `/health/live`, `/health/ready`, `/version`, UID 10001, absence of `MIGRATION_DATABASE_URL` from the runtime process, idempotent provisioning and structured-log secret scanning.

## Current public Railway verification — 2.2.0

- URL: https://ivritsheli-production.up.railway.app
- Pull request #12 merged successfully at production commit `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3`.
- `/version`: release `2.2.0`, commit `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3`, environment `production`, storage `postgresql`.
- `/health/live`: HTTPS 200 with release `2.2.0` and the same immutable commit.
- `/health/ready`: HTTPS 200; PostgreSQL and the shared-cloud dictionary are ready with 12 entries and 12 senses.
- Git publication matches deployment: remote tag and GitHub Release `v2.2.0` are published.
- GitHub OAuth consent handoff and cancellation have verified evidence; final live authorization-code exchange, authenticated refresh persistence and logout remain unclaimed.

The operational endpoints were refreshed directly on 2026-07-18. This proves deployed identity and readiness, not 2.2 desktop/mobile/RTL/reduced-motion interactive browser behavior; the current README screenshots remain explicitly labeled 2.1.x evidence.

### Historical Railway verification — 2.1.1

- Pull request #11 merged and deployed at commit `95d02554d754928483ffc42d42a372b86c6fcb1b` on 2026-07-16.
- Release identity, PostgreSQL readiness, seeded demo behavior and desktop/mobile/RTL browser smoke passed before the 2.2 deployment.

## Remaining credential- and environment-dependent checks

- Final GitHub authorization-code exchange, authenticated refresh persistence and logout.
- Cross-user production isolation with two real GitHub identities.
- Live OpenAI coaching, embeddings, speech-to-text and text-to-speech.
- Live Google connector previews.
- 2.2 desktop/mobile/RTL/reduced-motion interactive browser and 200% zoom QA.
- Refreshed 2.2 README screenshots.
- Provider cost ceilings, managed backup retention and a full restore drill.

## Known 2.2 follow-up work

- Produce a dry-run report and conservatively reconcile any pre-2.2 duplicate dictionary rows before adding a database uniqueness invariant.
- Let the learner select a homograph entry or sense before optional AI enrichment; 2.2 enriches the first local match while displaying every local match.
- Batch-hydrate and bound dictionary senses/forms for large Kaikki result sets instead of issuing per-entry detail queries.
- Consolidate the older pronunciation-practice voice helpers onto the shared 2.2 voice-preference module.

## Reliability statement

Passing tests and healthy images materially reduce risk but do not prove that software is defect-free. This report separates reproducible source evidence, current live-production evidence, publication state and operator-only checks.
