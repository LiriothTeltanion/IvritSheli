# Ivrit Sheli performance evidence — 2026-08-26

This note records one bounded investigation of the private `2.12.2` candidate.
It separates the exact local source runtime from an older Docker image exposed
through a temporary Cloudflare Quick Tunnel. It is evidence from one Windows
11 machine and one network path, not a production SLO, provider benchmark or
promise of future performance.

## Decision

- **VERIFIED:** the reported roughly 46-second external opening time is
  reproducible when “ready” means the read-only demo has no remaining
  `.skeleton-page` or `[aria-busy="true"]` state. Three cold runs reached that
  state in **44.59 s, 44.97 s and 50.81 s** (median **44.97 s**).
- **VERIFIED:** the landing page itself is not the bottleneck. It was visibly
  ready in **1.76 s, 1.21 s and 1.07 s** (median **1.21 s**) over the same
  ephemeral tunnel.
- **VERIFIED:** the exact-current local SQLite runtime was much faster: three
  cold browser runs reached a stable app shell in **2.65 s, 2.07 s and
  1.83 s** (median **2.07 s**).
- **INFERRED:** remote PostgreSQL round trips and serial request work dominate
  this laptop-to-database path. Static delivery, DNS and TLS do not explain the
  delay.
- **PROPOSED, not implemented:** if a future durable host is selected, place
  the application close to its database and then remeasure. Do not change
  regions, pooling, liveness probes, RLS or release infrastructure from this
  evidence alone.

## Evidence boundary

| Surface | Provenance | What it proves |
|---|---|---|
| Exact local served path | `http://127.0.0.1:8200`, local SQLite, CSP-enabled FastAPI, version `2.12.2`, baseline commit `7ac5f941db66435cbdd59a14e7178462eabc4785` plus recorded dirty worktree | Current source can build and reach a stable local workspace |
| Temporary external path | Cloudflare Quick Tunnel to Docker port 8500; Docker reports `2.12.2`, PostgreSQL and runtime commit `development` | Current observed external behavior of that image and database path |
| Published release | Not tested here | Nothing in this note proves the historical `v2.4.0` release is currently hosted |

The temporary hostname is intentionally omitted. The Docker image predates the
current `api.py` and frontend build, and it has no Git revision label. External
measurements therefore remain runtime evidence, not exact-current-source proof.

## Method

Browser measurements used headless Chromium with a new context and service
workers blocked for each cold run. “Workspace visible” required the demo app
shell and main heading. “Fully ready” additionally required no
`.skeleton-page` and no `[aria-busy="true"]`, followed by `document.fonts.ready`.

Warm runs reused the same browser context and authenticated demo cookie, then
reloaded until the same fully-ready contract passed. All captured API responses
returned below HTTP 400. No credentials, connection strings, cookies, user IDs
or temporary hostname were written to this note.

## Browser results

### Exact local SQLite runtime

| Run | Cold stable workspace | Warm stable reload |
|---:|---:|---:|
| 1 | 2,646.55 ms | 1,267.22 ms |
| 2 | 2,070.42 ms | 1,284.51 ms |
| 3 | 1,827.05 ms | 1,113.33 ms |
| **Median** | **2,070.42 ms** | **1,267.22 ms** |

The local readiness contract was: `.app-shell` visible, no skeleton or
`aria-busy` state, and fonts loaded. This runtime served the production build
through FastAPI on port 8200, so CSP and backend routing were active; it was not
the Vite-only path.

### Temporary external Docker/PostgreSQL path

| Run | Landing ready | Demo shell visible | Fully ready |
|---:|---:|---:|---:|
| 1 | 1,755.65 ms | 36,771.25 ms | 44,593.12 ms |
| 2 | 1,213.35 ms | 36,635.45 ms | 44,970.06 ms |
| 3 | 1,072.18 ms | 42,905.98 ms | 50,811.16 ms |
| **Median** | **1,213.35 ms** | **36,771.25 ms** | **44,970.06 ms** |

The cold navigation waterfall was also small compared with demo bootstrap:

| Browser navigation phase | Run 1 | Run 2 | Run 3 | Median |
|---|---:|---:|---:|---:|
| DNS | 35.30 ms | 9.70 ms | 7.60 ms | 9.70 ms |
| TLS | 20.20 ms | 19.80 ms | 62.10 ms | 20.20 ms |
| TTFB | 280.30 ms | 92.60 ms | 95.50 ms | 95.50 ms |
| First contentful paint | 892 ms | 532 ms | 520 ms | 532 ms |

Each landing run observed six static-asset responses totaling 309,524 bytes by
`Content-Length` before the demo workspace became ready. This is response-header
accounting, not a complete compressed-transfer audit.

### Warm external reload

| Run | Fully ready | Observed API responses | HTTP errors |
|---:|---:|---:|---:|
| 1 | 38,944.60 ms | 8 | 0 |
| 2 | 39,818.73 ms | 7 | 0 |
| 3 | 35,527.96 ms | 6 | 0 |
| **Median** | **38,944.60 ms** | **6–8, not a database-query count** | **0** |

Browser caching does not remove the dominant delay because the authenticated
workspace still fetches database-backed state on reload.

## API waterfall

The three cold fully-ready runs observed eight application API responses. The
median browser-observed duration for each endpoint was:

| Endpoint | Median duration |
|---|---:|
| `POST /api/v1/auth/demo` | 10,099.99 ms |
| `GET /api/v1/dashboard` | 13,431.38 ms |
| `GET /api/v1/profile` | 5,896.78 ms |
| `GET /api/v1/gamification/status` | 6,057.56 ms |
| `GET /api/v1/learning-core` | 6,694.15 ms |
| `GET /api/v1/learning-core/next` | 8,165.64 ms |
| `GET /api/v1/dictionary/browse` | 6,425.95 ms |
| `GET /api/v1/auth/me` | 170.02 ms |

These endpoint requests are not equivalent to SQL statements. No database
query profiler was enabled, so the earlier claim of roughly 36 sequential
queries remains **UNVERIFIED** and is not repeated as fact.

## Direct restricted-role database timing

Three read-only measurements opened a new connection using the application's
restricted runtime credential, then executed `SELECT 1` twice on that same
connection. The URL and identity were never printed.

| Run | New connection | First `SELECT 1` | Second `SELECT 1` |
|---:|---:|---:|---:|
| 1 | 3,573.80 ms | 366.54 ms | 365.10 ms |
| 2 | 2,741.95 ms | 436.76 ms | 414.57 ms |
| 3 | 2,927.57 ms | 354.09 ms | 353.73 ms |
| **Median** | **2,927.57 ms** | **366.54 ms** | **365.10 ms** |

This supports the latency diagnosis for this machine and network path. It does
not establish provider-wide latency or expected behavior from a co-located
server.

## What remains unverified

- The database region. A safe hostname-only check did not expose a recognized
  region, and no settings-screen evidence was available in the selected browser.
  The earlier “Sydney / `ap-southeast-2`” statement remains unverified.
- SQL query count per endpoint and whether requests can safely be combined.
- Performance of an application server co-located with the database.
- Performance of the latest dirty source tree in hosted PostgreSQL mode.
- A durable public host, uptime, provider free tier or future hosting cost.

Provider comparison was deliberately not performed because this task does not
authorize or require a hosting decision. Railway was not restarted, Render was
not provisioned, and no database, region, OAuth or DNS setting changed.

## Next measurement before optimization

Add opt-in, non-sensitive server timing around connection acquisition and each
repository operation in an isolated staging run. Count SQL statements there,
then compare one co-located application/database trial with this remote path.
Do not remove the liveness or tenant-isolation controls simply to improve this
single measurement.
