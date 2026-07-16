# Ivrit Sheli Ultimate 2.1.1 — Verification Report

**Verification date:** 2026-07-16

**Time zone:** Asia/Jerusalem

**Release:** 2.1.1 release candidate

## Result

The 2.1.1 local-first application, real PostgreSQL integration path, and production-shaped Compose image are green within the evidence boundaries below. Visible browser QA also passes for the corrected review, modal, reduced-motion, and Hebrew RTL behavior. The public Railway service remains the separately verified 2.1.0 deployment; no 2.1.1 tag or live deployment is claimed by this report.

| Verification area | Result |
|---|---:|
| Unique backend automated tests | **127 passed** |
| Frontend automated tests | **21 passed** |
| Total unique automated tests | **149 passed** |
| Ruff Python lint | Passed |
| MyPy strict type check | Passed across 24 source files |
| Python bytecode compilation | Passed |
| TypeScript project type check | Passed |
| Vite production build | Passed |
| Offline doctor diagnostics | Passed |
| PostgreSQL 17 migration/isolation gate | 3 passed |
| Production-image Compose smoke | Passed |
| Python runtime dependency audit | 0 known vulnerabilities |
| npm production dependency audit | 0 known vulnerabilities |
| Package structure/asset verifier | 52 required files passed |
| Local candidate identity | `2.1.1` / `development` |
| Railway HTTPS application | Passed |
| Current live release identity | `2.1.0` / `production` |
| Live PostgreSQL readiness | Passed |
| Live seeded demo workspace | Passed |
| Production GitHub OAuth | Partial — consent and cancellation verified; code exchange pending |

### How the backend total is counted

The ordinary backend command reports `127 passed, 1 skipped`. The skipped case is the credential-gated real PostgreSQL test. The dedicated PostgreSQL job runs the three tests in `test_postgres_integration.py`: two are already included in the ordinary 127, and the real database case replaces the one skip. Therefore the unique backend baseline is **128**, without double-counting the two shared tests.

## Verified environment

- Local Python runtime: 3.10.11; package and CI compatibility target: Python 3.10.
- Production image runtime: Python 3.13 slim-bookworm.
- Local Node.js/npm: 26.3.1 / 11.16.0; CI and frontend Docker builder: Node.js 22.
- PostgreSQL: 17 Alpine in Docker.
- Docker / Compose used for the final smoke: 29.6.1 / 5.1.4.
- React: 19.2.7.
- TypeScript: 7.0.2.
- Vite: 8.1.4.
- Vitest: 4.1.10.
- FastAPI: 0.139.0.
- Pydantic: 2.13.4.

## Commands executed

### Backend quality and local-first suite

```bash
ruff check backend/src backend/tests scripts/verify_package.py scripts/verify_container_logs.py
mypy --config-file backend/pyproject.toml backend/src
pytest backend/tests -q
python -m compileall -q backend/src scripts/verify_package.py scripts/verify_container_logs.py
```

Result:

```text
All checks passed!
Success: no issues found in 24 source files
127 passed, 1 PostgreSQL-environment skip
```

The run emitted one non-failing upstream Starlette deprecation warning about its current TestClient/httpx integration. It did not affect behavior or results.

### Real PostgreSQL 17 integration

The dedicated gate provisions separate administrator and restricted runtime DSNs, runs Alembic, and executes:

```bash
pytest backend/tests/test_postgres_integration.py -q
```

Result: `3 passed`.

The database test proves:

- Idempotent migration and runtime-role provisioning.
- Direct login as `ivrit_sheli_runtime` with no superuser, database creation, role creation, inheritance, replication, RLS bypass, public-schema creation, or retained `SET ROLE` membership.
- Exact Alembic-head readiness.
- Session persistence and cleanup.
- Cross-user repository isolation.
- Forced PostgreSQL row-level-security denial.
- Transaction recovery after expected privilege failures.

### Offline diagnostics

```bash
PYTHONPATH=backend/src python -m ivrit_sheli --doctor
```

Passed checks:

- Learning database initialization.
- Demo dictionary initialization.
- SQLite lookup support.
- Offline structured AI.
- Pronunciation scoring.
- Connector registry.
- Dashboard generation.

### Frontend quality

```bash
cd frontend
npm run typecheck
npm run test:run
npm run build
```

Result:

```text
9 test files passed
21 tests passed
Production build succeeded
JavaScript: 313.32 kB before gzip / 93.68 kB gzip
CSS: 66.27 kB before gzip / 13.57 kB gzip
```

Covered UI behavior includes authentication and read-only-demo gates, CSRF-aware API requests, clickable Hebrew, direction switching, offline AI rendering, dictionary navigation, audio MIME/provider/item propagation, accessible modal lifecycle, review-face isolation, responsive application flows, and error/session handling.

Rendered 2.1.1 browser QA confirmed that quick capture initially focuses its Hebrew field, Escape closes it, body scrolling is restored, and focus returns to the opener. The dictionary dialog exposes its labelled modal content and the same close/restore behavior. Review grading buttons have a count of zero before answer reveal and appear only afterward. Emulated `prefers-reduced-motion: reduce` displays only the active face with no transform, and Hebrew mode sets `lang="he"`, `dir="rtl"`, and produces zero horizontal overflow. The browser console contained no errors.

### Dependency audits

```bash
python -m pip_audit -r backend/requirements.txt
cd frontend && npm audit --omit=dev
```

Both audits returned `0 known vulnerabilities` on the verification date. This is time-sensitive evidence, not a permanent guarantee; Dependabot and CI remain responsible for continued review.

### Package and production-image smoke

```bash
python scripts/verify_package.py
docker compose config --quiet
docker compose up --build --wait
```

The package verifier confirmed 52 required files and packaged assets. The rebuilt Compose stack then verified:

- `/health/live` reports `alive`.
- `/health/ready` reports `ready` with PostgreSQL `true`.
- `/version` reports `2.1.1` and PostgreSQL storage.
- The application runs as UID `10001`.
- `MIGRATION_DATABASE_URL` is absent from the Uvicorn process.
- Re-running the provisioner succeeds idempotently.
- Container logs are structured JSON and the secret-sentinel verifier passes.

These checks exercise the 2.1.1 local production-shaped image and PostgreSQL stack at `127.0.0.1`; the separate live-production record below verifies only the explicitly listed 2.1.0 Railway behaviors.

## Current public Railway verification — 2.1.0

- Public URL: https://ivritsheli-production.up.railway.app
- `/health/live`: HTTPS `200`, status `alive`, release `2.1.0`.
- `/health/ready`: HTTPS `200`, dictionary ready and PostgreSQL `true`.
- `/version`: release `2.1.0`, environment `production`, storage `postgresql`.
- Railway pre-deploy logs: Alembic migration completed and `database.provision.ready` reported the restricted `ivrit_sheli_runtime` role.
- Runtime logs: structured startup and health-request fields include environment, request ID, route, status, duration, version and commit without exposed credentials.
- Browser smoke: the trilingual authentication gateway and complete seeded read-only demo loaded successfully; mutation controls are disabled in demo mode.
- GitHub OAuth: the production application reached GitHub's identity-only consent screen. Cancellation validates and consumes OAuth state, clears its browser cookie, and returns to the app. GitHub disabled approval in the embedded test browser, so final authorization-code exchange and an authenticated user session are not claimed.

## AI and dictionary contract coverage

All exposed offline AI tasks are parameterized and schema-contract tested. The OpenAI adapter uses deterministic HTTP fakes to verify the Responses API payload, configured model, strict JSON Schema output, redaction, fallback behavior, provider metadata, and stored-consent enforcement before provider work. Audio tests cover MIME-derived upload names, provider/item propagation, history-only client transcript scoring, the separately trusted atomic speaking-progress path, and rollback when explicit linking is invalid.

Dictionary tests cover demo seeding, niqqud-insensitive and inflected-form lookup, English/Spanish search, root families, streaming JSONL import, malformed-record tolerance, and source/license attribution. The package includes the attributed demo lexicon plus the importer; it does not falsely embed or label a complete external Kaikki/Wiktionary dataset.

## Remaining credential- and environment-dependent checks

No personal credentials were used. The following remain contract-tested with fakes or documented as operator checks rather than claimed live evidence:

- Final GitHub authorization-code exchange, authenticated session, persistence across refresh, and logout.
- Live cross-user PostgreSQL isolation with two real GitHub identities.
- OpenAI coaching, embeddings, speech-to-text, and text-to-speech.
- Google Calendar, Gmail, and Drive previews.
- Provider cost ceilings and allowlist operations.
- Managed backup retention and a full restore drill.

This is intentional: CI and packaging must not transmit personal content or expose secrets. Use the explicit `--doctor --live` path only after credentials, consent, identity allowlists, and cost controls are configured.

## Reliability statement

Passing tests materially reduces risk but does not prove that software is defect-free. The package distinguishes reproducible local evidence from unverified external deployment and credential-dependent behavior.
