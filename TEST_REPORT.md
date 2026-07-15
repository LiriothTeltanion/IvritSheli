# Ivrit Sheli Ultimate 1.0.0 — Verification Report

**Verification date:** 2026-07-15  
**Time zone:** Asia/Jerusalem  
**Release:** 1.0.0

## Result

The local-first release path is green.

| Verification area | Result |
|---|---:|
| Backend automated tests | 60 passed |
| Frontend automated tests | 6 passed |
| Total automated tests | **66 passed** |
| Ruff Python lint | Passed |
| MyPy strict type check | Passed |
| Python bytecode compilation | Passed |
| TypeScript project build/type check | Passed |
| Vite production build | Passed |
| Offline doctor diagnostics | Passed |
| Production API/static smoke | Passed |
| npm production audit | 0 vulnerabilities |
| npm full dependency audit | 0 vulnerabilities |
| Package structure/asset/secret verifier | Passed after final cleanup |

## Verified environment

- Python runtime used for execution: 3.13.5 in a clean temporary virtual environment.
- Python compatibility target: 3.10 (`requires-python`, Ruff `py310`, MyPy `python_version = 3.10`).
- Node.js: 22.16.0.
- npm: 10.9.2.
- React: 19.2.7.
- TypeScript: 7.0.2.
- Vite: 8.1.4.
- Vitest: 4.1.10.
- FastAPI: 0.139.0.
- Pydantic: 2.13.4.

A Python 3.10 interpreter was not installed in the packaging container, so direct runtime execution on 3.10 was not possible here. The repository CI workflow is configured to execute the same suite on Python 3.10.

## Commands executed

### Backend quality

```bash
ruff check backend/src backend/tests scripts/verify_package.py
mypy --config-file backend/pyproject.toml backend/src
pytest backend/tests -q
python -m compileall -q backend/src scripts/verify_package.py
```

Result:

```text
All checks passed!
Success: no issues found in 17 source files
60 passed
```

The test run emitted one non-failing upstream deprecation warning from FastAPI/Starlette's current TestClient compatibility layer. It did not affect behavior or results.

### Offline diagnostics

```bash
PYTHONPATH=backend/src python -m ivrit_sheli --doctor
```

Passed checks:

- Learning database initialization.
- Demo dictionary initialization.
- SQLite FTS5 availability.
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
5 test files passed
6 tests passed
Production build succeeded
JavaScript: approximately 264.6 kB before gzip
CSS: approximately 53.7 kB before gzip
```

Covered UI behaviors include:

- Clickable Hebrew tokens and punctuation preservation.
- English/Spanish/Hebrew direction switching.
- Structured offline AI correction rendering.
- Dictionary lookup, source attribution, root-family navigation, and add-to-learning.
- Audio fallback when browser speech recognition is unavailable.

### Dependency audit

```bash
npm audit --omit=dev --audit-level=low
npm audit --audit-level=low
```

Both audits returned `0 vulnerabilities`.

A clean Python virtual environment was created from `backend/requirements-dev.txt`; `pip check` returned `No broken requirements found`.

### Production smoke

The built React application was served through FastAPI and tested with a clean in-memory database. The following routes returned successful responses and valid content:

- `/`
- `/manifest.webmanifest`
- `/sw.js`
- `/icons/app-icon-192.png`
- `/api/v1/health`
- `/api/v1/dashboard`
- `/api/v1/dictionary/lookup?word=שלום`
- `/api/v1/dictionary/search?q=למד`
- `/api/v1/ai/correct`

The smoke test also verified a root-family result, the offline AI provider, image content type, and the compiled application shell.

## AI contract coverage

Every exposed offline AI function is parameterized and schema-contract tested:

- Analyze.
- Correct.
- Exercises.
- Dialogue.
- Role-play.
- Weekly plan.
- Enrich item.
- Mission.
- Niqqud.
- Transliteration.

The OpenAI adapter is tested with a deterministic HTTP fake to verify the Responses API payload, current configured model, strict JSON Schema format, redaction, fallback behavior, and provider metadata.

## Dictionary coverage

Tests verify:

- Demo seeding.
- Niqqud-insensitive lookup.
- Inflected-form lookup.
- English/Spanish search.
- Root-family search.
- Streaming JSONL import.
- Malformed-record tolerance.
- Source and license attribution.
- Custom source URL metadata.

The complete external Kaikki Hebrew JSONL could not be downloaded inside the packaging runtime because external DNS resolution was unavailable. The archive therefore includes the attributed demo lexicon plus the tested downloader/importer, not a falsely labeled full database. On a connected machine, the documented command installs the full dataset.

## Credential-dependent checks not executed live

No personal credentials were supplied, so these were contract-tested with fakes but not called against live accounts:

- OpenAI structured coaching.
- OpenAI embeddings.
- OpenAI speech-to-text.
- OpenAI text-to-speech.
- Google Calendar.
- Gmail.
- Google Drive.

This is intentional: CI and packaging must not transmit personal content or expose secrets. The explicit `--doctor --live` path is available after the user configures credentials and cloud consent.

## Reliability statement

Passing tests materially reduces risk but does not prove that software is free of every possible defect. The package is honest about provider, browser, dataset, and deployment boundaries; failures are designed to degrade into actionable local behavior instead of breaking the learning session.
