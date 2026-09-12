# Playwright Runbook

**Project:** Ivrit Sheli 2.12.3 PRIVATE CANDIDATE (unpublished)

**Last updated:** 2026-08-27 (`Asia/Jerusalem`)

**Purpose:** make browser verification fail early, preserve useful evidence, and prevent identical blind reruns.

The latest published source release remains **v2.12.2**. This runbook and its
cache/preflight corrections belong to the local 2.12.3 candidate until Kevin
separately authorizes and completes a publication. No durable live URL is
currently verified.

## The 2026-08-27 incident

Two post-gate reruns appeared to hang on the exact FastAPI-served path:

| Attempt | Outer limit | What the terminal showed | What the artifacts proved |
|---|---:|---|---|
| Full matrix | 604.1 s | No completed Playwright result | The outer command ended before a complete report; do not count it as a pass or failure. |
| Targeted mobile/desktop smoke | 184.1 s | No live result lines | Six tests ran sequentially and each exhausted the 30 s test timeout while waiting for `.app-shell`. |

The targeted run was not a runner-startup hang. Result artifacts advanced from
05:29:38 through 05:32:24 at roughly one test-timeout interval per case. A
worker observed late in the run was a later replacement worker, not proof that
Playwright took 165 seconds to begin.

### Verified root cause

The first retained trace records this sequence:

1. `GET http://127.0.0.1:8200/?lang=en` returned `200` with the production CSP.
2. The returned HTML referenced `/assets/index-QR-zN1Oi.js`.
3. That entry module returned `404 Not Found`.
4. The current `frontend/dist` instead contained `index-DIxUZMmw.js`.
5. React never mounted, the root stayed blank, and every selected case waited
   30 seconds for `.app-shell`.

FastAPI's `_index_document` cache was keyed only by public base URL. A Vite build
replaced the hashed entry bundle while the backend stayed alive, but the backend
continued serving the earlier cached HTML. Terminal buffering hid the repeated
test-timeout output until the orchestration limit stopped the command.

This was not caused by axe, the 240-scene gallery, FFmpeg, OneDrive, insufficient
Playwright timeout, or a product assertion. Those were hypotheses before the
network trace was read and must not be promoted into causes.

## Durable corrections

1. `backend/src/ivrit_sheli/api.py` now keys the index cache by public base URL
   plus `index.html` mtime and size. A new build invalidates the cached document.
2. `backend/tests/test_api.py` replaces `index.html` while the same TestClient is
   alive and asserts that the next request receives the new document.
3. `frontend/e2e/runtime.setup.ts` requests the served HTML and all local entry
   scripts/styles before any product test.
4. `frontend/playwright.config.ts` makes all three viewport projects depend on
   that preflight. A missing bundle now fails once with its path and HTTP status
   instead of consuming 30 seconds in every product case.
5. The reusable Codex Playwright skill now distinguishes silent output, test
   timeouts, runner stalls and outer-process termination, and requires artifact
   inspection before a rerun.

## Verification after the correction

Executed locally on 2026-08-27. These historical correction results established
the Playwright-hardening baseline now carried by the unpublished 2.12.3
candidate; they are not part of the already published `v2.12.2` tag.

| Gate | Result |
|---|---|
| Focused frontend-serving API tests | 19 passed; the existing Starlette `httpx` deprecation warning remained |
| Complete backend suite | 363 passed / 1 credential-gated PostgreSQL skip / 0 failed in 60.22 s |
| Ruff + strict MyPy | Passed; MyPy checked 39 backend source files |
| TypeScript + production build | Passed; Vite 8.1.4 built 134 modules, with the existing `advancedChunks` deprecation warning |
| Repaired mobile/desktop smoke | 4 passed / 1 intentional project skip in 11.5 s, including the preflight |
| First green FastAPI/CSP matrix | 36 passed / 40 intentional project skips / 0 failed across 76 listed cases in 4.5 minutes, but the port was later proved to belong to an inherited 2026-08-26 backend process. Preserve it as current-frontend browser evidence only, not exact-backend or cache-fix proof. |
| Fresh-process provenance check | Port 8000 was proved free before launch; listener PID 16316 was created in the run under the project virtualenv parent; `/version` reported `feb056cbbc9539a40f55a0b53624197051acb66b+playwright-hardening-dirty`; discovery passed |
| Exact fresh-process smoke | **4 passed / 1 intentional project skip / 0 failed** in 9.2 s, including the preflight |
| Exact fresh-process FastAPI/CSP matrix | **36 passed / 40 intentional project skips / 0 failed** across 76 listed cases in 3.9 minutes; one pass is preflight and 35 are product cases |
| Exact cleanup | Listener PID 16316 was stopped and port 8000 was confirmed clean after the run |
| Reusable Playwright skill | `quick_validate.py` reported `Skill is valid!` |
| 2.12.3 capture smoke | Fresh FastAPI/CSP runtime: **2 passed / 0 failed in 3.8 s** before the reviewed captures |
| 2.12.3 exact candidate matrix | Fresh port 8200, identity 2.12.3/development/SQLite: **36 passed / 40 intentional project-scoped skips / 0 failed** across 76 listed cases in 4.5 minutes after the final trilingual evidence-copy update |
| 2.12.3 exact cleanup | The accepted listener PID was a proved direct child of the captured launcher; both were stopped and port 8200 was confirmed clean |

## Required sequence

Use the production-shaped path, not Vite alone:

```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
# Continue only after the port is free or the exact intended process is proven.

Set-Location frontend
npm run build

# Start backend-local only after the build, on port 8000.
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:8000'
Invoke-RestMethod "$env:PLAYWRIGHT_BASE_URL/version"
npx playwright test --list
npx playwright test e2e/experience.spec.ts --project=mobile-390 --workers=1 --reporter=list --grep 'fits the configured viewport'
npx playwright test --workers=1 --reporter=line
```

The AI owns these commands. Kevin does not need to run them manually. If the
backend must be started from automation, keep server start, readiness polling,
PID/start-time/build-label verification, test execution and exact cleanup in
one bounded job with a `finally` block. `Stop-Job` alone is not proof that a
spawned Python child stopped; verify that the listener is gone afterwards.
On Windows, `.venv\Scripts\python.exe` may be a launcher whose direct child owns
the listening socket. Do not require PID equality alone. Accept only the
captured launcher itself or a listener whose `Win32_Process.ParentProcessId`
equals that launcher PID, whose command line matches the intended module and
port, and whose `/version` response identifies the expected candidate. Stop
both exact processes in `finally` and prove the port is clean.

## Stop-and-inspect protocol

After one unexpected timeout:

1. Do not repeat the same full command.
2. Record the outer command duration and the configured Playwright test timeout.
3. Inspect `tmp/playwright-results` for `error-context.md`, screenshots, videos,
   traces and their timestamps.
4. Read `0-trace.network` in the first trace and check document, entry scripts,
   stylesheets, service worker and API requests.
5. Inspect only processes whose command lines belong to this checkout/run. Do
   not terminate all Node, Chrome or FFmpeg processes; Kevin has other projects.
6. Reject a readiness response from an inherited listener. Verify listener PID,
   creation time, virtualenv parent and an explicit build/commit label.
7. Run `npx playwright test --list`, then one known smoke. Expand only after the
   smoke passes.
8. Preserve the ordinary screenshot/trace/video release configuration for the
   final evidence run. Disable or relocate them only in one explicitly labelled
   diagnostic comparison.

Use `PLAYWRIGHT_LIST_PRINT_FAILURES_INLINE=1` with the list reporter when live
failure output matters. Add a JSON/JUnit/HTML reporter with an explicit file for
machine-readable results when the calling shell may buffer stdout.

## Error and resolution ledger

| Error or misleading signal | Resolution and future rule |
|---|---|
| `locator.waitFor: Test timeout of 30000ms exceeded`, waiting for `.app-shell` | Inspect the first trace before increasing timeouts. Here the entry JS was 404, so waiting longer could never help. |
| Blank cream page | Inspect console/network and the root DOM. It was unmounted React, not a visual CSS failure. |
| Six failures with no terminal lines | Compare artifact timestamps; stdout buffering is not runner inactivity. Use explicit reporters/files. |
| Late worker PID interpreted as slow startup | Correlate PID creation with the first/last trace and result directories. Workers can be replaced after a test timeout. |
| Full command stopped at 604.1 s | Label it an outer-process timeout; it is neither a pass nor a complete product failure. Inspect retained evidence before one smaller rerun. |
| Persistent `Start-Process` launch rejected by the automation host | Use one bounded PowerShell job and always stop/remove that exact job in `finally`. |
| `GET /health/ready` returned 200 while the new server had failed to bind | The response came from an inherited listener started the previous day. Check port ownership before launch and verify the listener PID/start time/virtualenv/build label after readiness. A 200 alone is not provenance. |
| Launcher PID differed from listener PID and the gate stopped before Playwright | The Windows virtualenv executable created the real Python listener as a direct child. This is a process-provenance refusal, not a Playwright failure. Validate the direct parent, exact command/port and `/version`; never accept an unrelated listener merely because readiness is 200. |
| Preflight expected the environment literal `local`, while `backend-local` returned `development` with `sqlite` storage | Environment name and storage backend are separate `/version` fields. The refusal happened before Playwright. Inspect the exact response, require `2.12.3/development/sqlite` for this profile, and make only one corrected launch. |
| `Stop-Job` completed but port 8000 still listened | A spawned Python child can outlive the PowerShell job. Capture the exact listener and parent PIDs, stop only verified IvritSheli processes, and assert the port is clean after teardown. |
| PowerShell exclusion regex used unescaped backslashes and raised `Malformed \p{X} character escape` | Use `-notlike '*\\node_modules\\*'` or a correctly escaped regex. Do not reuse the malformed pattern. |
| Skill metadata generator raised `ModuleNotFoundError: No module named 'yaml'` under global Python | Run the official generator/validator with an existing environment that has PyYAML; this project `.venv` has PyYAML 6.0.3. No global install was needed. |
| A combined skill read exceeded the tool output limit | Read each required skill separately and paginate the longer file to EOF. Do not act on a truncated instruction file. |
| Existing Starlette `httpx` deprecation and Vite `advancedChunks` deprecation warnings | Record them as non-fatal known warnings. Do not mislabel them as this incident's cause. |

## Evidence boundary and live URL

The working tree is an unpublished 2.12.3 private candidate. The GitHub
repository and latest published `v2.12.2` Release distribute source and release
artifacts; GitHub is not currently running the FastAPI/PostgreSQL application.
There is therefore **no durable live-user URL to share yet**. A live link
requires a separate, explicitly authorized deployment, isolated HTTPS staging,
secret configuration and verification. See `docs/DEPLOYMENT.md` and the open
hosting work in `TASKS.md`.
