# Ivrit Sheli 2.10.0 — Nova Phase 4 First Architecture Slice

Prepared: 2026-08-11; adoption gate completed: 2026-08-13
Baseline supplied by Kevin: `d475304015e8c76c5468f08f46627c6e3853e9d5`
Baseline branch: `consolidation/ivrit-sheli-2.10-baseline`
Status: private / unpublished / **Windows full gate passed locally**

## Why this slice is deliberately small

The reference Windows machine already completed the 2.10 security, PostgreSQL/Docker and visual/performance gates through `d475304`. That opens the backend-decomposition gate, but `api.py` and especially `repository.py` contain mature security and transaction behavior. This artifact therefore moves exactly one API domain and closes two low-risk ownership debts; it does not begin a broad backend rewrite.

## Changes

### 1. Dynamic locale labels leave the React provider

- New `frontend/src/locales/codeLabels.ts` owns the 93 dynamic labels used for skills, categories, status values and structured metadata in EN/ES/HE.
- `i18n.tsx` becomes provider logic again instead of provider + a second translation catalog.
- `localeParity.test.ts` now guards dynamic label key parity and non-empty translations in addition to the 606 interface-message catalogs.

### 2. Current package/product identity no longer uses `Ultimate`

- Frontend npm package: `ivrit-sheli-web`.
- Python distribution: `ivrit-sheli`.
- CLI/API/setup/user-guide/demo/build-spec titles use `Ivrit Sheli`.
- Historical notes/filenames may retain “Ultimate” only when needed for provenance.
- `verify_package.py` now guards this current brand/package contract.

### 3. First backend domain extraction: dictionary HTTP routes

New module: `backend/src/ivrit_sheli/api_dictionary.py`.

Moved, without changing endpoint paths or payload behavior:

- `GET /api/v1/dictionary/search`
- `GET /api/v1/dictionary/browse`
- `GET /api/v1/dictionary/lookup`
- `GET /api/v1/dictionary/entries/{entry_id}`
- `GET /api/v1/dictionary/stats`
- `POST /api/v1/dictionary/{entry_id}/learn`

The module receives the established repository/dictionary accessors from `api.py`. It does **not** own or duplicate authentication, CSRF, request limits, middleware, cloud/local tenant selection, RLS, service construction or repository transactions.

`backend/tests/test_api.py` adds a route-contract test asserting the six path/method pairs are registered exactly once. Existing dictionary behavior tests remain in place.

### 4. Checksum integrity

The uploaded source exposed a tooling edge case between Windows working-tree
line endings and Git's canonical index blobs. The official release builder
writes index blobs directly, after Git has already applied `.gitattributes`.

`generate_checksums.py` and `verify_package.py` therefore hash Git-index blobs
inside the repository and hash extracted canonical-archive bytes exactly when
`.git` is absent. They do not guess Git's text/binary rules after packaging or
silently normalize any shipped byte. Regression coverage includes attributed
CRLF text plus ordinary CRLF, lone CR, control bytes and early/late NUL cases.

### 5. Release truth refreshed

- README now records the completed local 2.10 baseline through `d475304`: 697 Vitest + 313 backend pytest + 32 Playwright/axe = 1,042 directly executed automated passes, plus local PostgreSQL 17.10 / RLS / Docker evidence.
- Public production remains 2.4.0 and staging/public verification remains unclaimed.
- `TEST_REPORT.md`, `NOVA_HANDOFF.md`, `CHANGELOG.md` and architecture notes distinguish the verified baseline from this new artifact-stage Phase 4 delta.

## Checks executed in the Nova artifact environment

Executed successfully:

- Python `compileall` for backend source/tests and scripts.
- TypeScript/TSX syntax transpilation: 127 source files, 0 syntax errors.
- Dynamic-label source parity: 93 EN / 93 ES / 93 HE keys.
- Dictionary ownership source check: 0 dictionary decorators remain in `api.py`; 6 live in `api_dictionary.py`.
- `python scripts/verify_package.py`: passed with 200 required files.
- Checksum generation/verification: 371 clean-package entries after this report was added.
- Checksum regressions: Git-attribute index normalization and exact extracted-package bytes passed.

Not executable here because this sandbox cannot reach npm/PyPI registries:

- full TypeScript typecheck
- Vitest / Vite build / Playwright
- Ruff / MyPy
- full pytest requiring pinned `psycopg`
- PostgreSQL/Docker rerun for this Phase 4 delta

Those limitations describe the original Nova artifact environment. They were
not converted into inherited passes; the complete Windows gate was rerun on
2026-08-13 as recorded below.

## Windows adoption outcome — 2026-08-13

- 699 Vitest tests passed across 40 files; TypeScript and the Vite production build passed.
- Ruff passed; strict MyPy passed across 39 backend source files.
- The host backend suite passed 315 tests with one PostgreSQL skip; the disposable PostgreSQL 17 run passed all three integration cases, yielding 316 unique current backend passes.
- The optimized-build Playwright/axe matrix passed 32 tests with 40 intentional project-scoped skips across 390/768/1440 px and the documented display/accessibility states.
- npm production/full-tree audits reported 0 vulnerabilities; `pip-audit` reported no known vulnerabilities.
- `python scripts/verify_package.py`, compileall and the seven-check offline doctor passed.
- A current-source `docker build --no-cache` passed. Its isolated smoke was ready as 2.10.0 under UID/GID 10001, removed injected privileged credentials before PID 1, and passed structured-log redaction.

The complete current total is **1,047 unique automated passes**: 699 frontend,
316 backend and 32 browser. This is local candidate evidence, not staging or
public-release evidence.

## Adoption on Kevin's repository

The supplied delta was preserved on top of `d475304`, reviewed and fully
validated on the Windows reference machine. No second API domain was mixed into
this cycle. The local commit is the rollback boundary for Phase 4A.1; publication
remains frozen.

## Next safe architecture slice after Windows green

Prefer `operations` or `alphabet` as the next low-risk API-domain extraction. Keep `repository.py` intact until multiple route slices have stayed green under the complete PostgreSQL/Docker regression gate.
