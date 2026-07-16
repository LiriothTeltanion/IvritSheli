# Ivrit Sheli Ultimate 2.2.0 — Verification Report

**Verification date:** 2026-07-16
**Time zone:** Asia/Jerusalem
**Candidate:** 2.2.0 on `codex/ivrit-sheli-v2.2.0`

## Result

The 2.2.0 local-first application, real PostgreSQL boundary and production-shaped image pass the reproducible gates below. The public Railway service is separately verified on merged release 2.1.1; this report does not claim that 2.2.0 is tagged or deployed.

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
| Package verifier | 57 required files passed |
| Current live release | `2.1.1` / production / PostgreSQL |

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

The doctor reported release 2.2.0 and passed learning database, 12-entry/12-sense demo dictionary, offline AI, pronunciation scoring, connector registry and dashboard checks. The package verifier passed 57 required files plus JSON/SVG parsing, Railway types, portable Docker-cache policy, secret hygiene and README links. Both dependency audits reported zero known vulnerabilities on 2026-07-16; this is time-sensitive evidence, not a permanent guarantee.

`SHA256SUMS.txt` covers every candidate file except itself using canonical Git-clean blob bytes after `.gitattributes` normalization. This avoids false cross-platform failures from a Windows CRLF working tree; verification must hash the temporary Git index blobs rather than platform-specific checkout bytes.

### Production-shaped image

```powershell
docker compose up --build --wait
```

The rebuilt stack passed PostgreSQL and application health checks. Verification covers `/health/live`, `/health/ready`, `/version`, UID 10001, absence of `MIGRATION_DATABASE_URL` from the runtime process, idempotent provisioning and structured-log secret scanning.

## Current public Railway verification — 2.1.1

- URL: https://ivritsheli-production.up.railway.app
- Pull request #11 merged successfully at commit `95d02554d754928483ffc42d42a372b86c6fcb1b`.
- `/version`: release `2.1.1`, environment `production`, storage `postgresql`.
- `/health/live` and `/health/ready`: HTTPS 200; dictionary and PostgreSQL ready.
- Seed dictionary: 12 entries and 12 senses.
- Seeded demo dictionary lookup/search passed.
- Desktop, Hebrew RTL and 390 px mobile layouts loaded without console errors.
- GitHub OAuth consent handoff exists; final authorization-code exchange/session/logout remains unclaimed.

This live evidence is for 2.1.1. No 2.2.0 interactive browser or deployment result is inferred from it.

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

Passing tests and healthy images materially reduce risk but do not prove that software is defect-free. This report separates reproducible candidate evidence, current live-production evidence and operator-only checks.
