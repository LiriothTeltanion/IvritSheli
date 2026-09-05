# Security remediation backlog

**Current review date:** 2026-09-05 (`Asia/Jerusalem`), remediation same day
**Reviewed source:** `main` at
`6bbcb3183d02426571b46d61918121de0ac5a514`
**Original static scan:** `cce8b3a1-9a87-4e7f-b43d-985e0eb24c95`, sealed
2026-08-24 against
`e640259729d05edc46a42538a68255a2d67320e5`
**Policy:** root [`SECURITY.md`](../SECURITY.md), which applies to every path
listed below

This file is a static re-triage and implementation handoff. No exploit, load
test, application run or security fix was performed as part of the review. Do
not copy credentials, environment-file contents, OAuth values or database URLs
into issues, commits, logs or future handoffs.

## Executive result

Six of the seven confirmed findings are fixed in source as of 2026-09-05, each
as its own reviewed local commit with its own tests. The suite went from 387 to
437 backend tests and from 859 to 862 frontend tests across this work; the
three claims that could be measured rather than argued (the connection ceiling,
the JWKS negative cache and the deletion cleanup) were each mutation-checked by
removing the fix and confirming the new tests fail.

Two things remain open and neither is a code change.

**SEC-05 needs a product decision from Kevin.** Binding to `0.0.0.0` still
exposes a writable local workspace to any device already on the network. The
Host allowlist removed the browser-mediated path to it, but not a phone on the
same wifi. The recommendation is to stop using LAN mode for pilots and use the
hosted staging link, which already has HTTPS, authentication and the real
database — and which is what the first pilot link actually used.

**SEC-02 is hardened but arguably should not exist.** No supported client uses
the Supabase bearer path: the frontend never sends an `Authorization` header,
and `SUPABASE_URL` appears in neither `render.yaml` nor `.env.example`. It is
now bounded, but deliberate removal may be the better answer than maintaining a
public authentication surface nothing calls. Removing it is Kevin's call.

The old scan's secret-file finding stays closed: `.env.bak` never entered
committed or remote history and backup patterns are ignored. The separate
Supabase administrator-password rotation is still an operator action and
remains unverified.

None of this is deployed. Render still runs `ed59eb84`, so every fix here takes
effect on the next deployment, which is a separate decision.

## Triage and implementation queue

| Rank | ID | Severity | Current verdict | Evidence and disposition |
|---:|---|---|---|---|
| 1 | SEC-03 | Medium | **Fixed 2026-09-05** (`ecc12ad`) | `queue.Queue(maxsize=8)` bounded only idle connections; an empty queue opened another unconditionally, and `/health/ready` is public. A `BoundedSemaphore` now caps connections checked out, and creation happens only while holding a permit and only when the idle queue was empty, so `open == checked_out + idle` cannot exceed `MAX_CLOUD_CONNECTIONS`. Exhaustion returns 503 with `Retry-After` and no connection detail. Eight new deterministic tests; mutation-checked. Live load against Supabase remains unverified. |
| 2 | SEC-04 | Medium | **Fixed 2026-09-05** (`c091ec8`) | Body limits run outside the authorization middleware, so a chunked upload was buffered before anyone authenticated, at 32 MB. In cloud mode the accepted size is now capped at twice `MAX_CLOUD_SNAPSHOT_BYTES`, since a larger restore could never be stored; local SQLite keeps its configured limit. `MAX_CONCURRENT_IMPORTS` admits two restores at a time, taken after the cheap rejections and released in the same `finally` that removes the temporary upload. Seven new tests. A streaming JSON parser was deliberately not added: with the ceiling at 8 MB the whole-document parse is bounded. |
| 3 | SEC-02 | Medium | **Hardened 2026-09-05** (`fe1a423`); removal still an open product decision | Verification moved to `ivrit_sheli/supabase_bearer.py` and now runs cheapest first: size gate, header parse, algorithm gate, key-id gate, bounded negative cache, single-flight admission, then the network. An unknown `kid` cost one outbound JWKS fetch per request in the bounded thread pool; twenty-five probes now cost one lookup, mutation-checked. Signature, issuer, audience, expiry and required claims are unchanged; HS256 stays refused. **No supported client uses this path** — the frontend never sends `Authorization`, and `SUPABASE_URL` is in neither `render.yaml` nor `.env.example`. Deliberate removal may be better than maintenance; that needs Kevin. |
| 4 | SEC-06 | Low | **Fixed 2026-09-05** (`301ef44`) | There was no Host allowlist at all, which is the precondition for DNS rebinding. `Settings.trusted_hosts` assembles loopback, the `PUBLIC_BASE_URL` host, a concrete bind address and anything in the new `ALLOWED_HOSTS`; never a wildcard, asserted by test. `TrustedHostMiddleware` is registered outermost, so a forged Host is refused before CORS and before the body-limit middleware buffers. Verified against the served app on port 8000: `attacker.example` returns 400. |
| 5 | SEC-05 | Low | **Partially mitigated; needs Kevin's decision** | The Host allowlist removes the browser-mediated path and forces a LAN pilot to name its machine in `ALLOWED_HOSTS` rather than being trusted by default. It does **not** close the finding: `scripts/start.ps1 -BindAddress 0.0.0.0` still exposes a writable local workspace to any device already on the network while local authentication defaults off. Closing it is a product choice between (A) an ephemeral per-launch pairing secret, (B) a deliberately read-only LAN mode, and (C) using the hosted staging link instead. **C is the recommendation**, since staging already carries HTTPS, authentication and the real database, and it is what the first pilot link actually used. |
| 6 | SEC-07 | Low | **Fixed 2026-09-05** (`8ae4c75`) | Production publishes no Swagger, no ReDoc and no `openapi.json`, so the relaxed CDN policy is unreachable there rather than merely unused. Found while fixing it: `redoc_url` was never stated, so FastAPI kept its default `/redoc` — a second documentation UI outside the API prefix that no line of the application had mentioned, and that the docs-policy branch did not cover. Development keeps its documentation. |
| 7 | SEC-08 | Low | **Fixed 2026-09-05** (`91f6fa7`) | Deletion left the learner identity key, the local-welcome key and her `ivrit-sheli-saved-accounts` entry behind, so a deleted account still put her name and face back on the sign-in screen. The id is now captured before the auth state is replaced, cleanup failure surfaces a translated warning instead of being swallowed, and the tests render **App** rather than `SettingsPanel` — every prior deletion test passed a spy prop, which is why this survived. Mutation-checked. |
| closed | SEC-01 | Medium | **Not actionable in repository; provider action open** | `.env.bak` never entered committed or remote history and backup patterns are ignored. The Supabase administrator password exposed on 2026-08-23 still needs rotating through the provider dashboard; nothing depends on it, so rotating breaks nothing. |

## What is left

1. **SEC-05** — Kevin chooses between an ephemeral pairing secret, a read-only
   LAN mode, and retiring LAN pilots in favour of hosted staging. Recommended: the
   third.
2. **SEC-02** — Kevin decides whether the bearer path is removed or kept.
3. Rerun a fresh static security scan against the final commit, then the full
   gates, then the browser matrix.
4. The operator and human gates below, which no code change can close.

## Human and operator gates still open

- Rotate the Supabase `postgres` administrator password exposed on 2026-08-23;
  current rotation status is unverified.
- Prove the restricted `ivrit_sheli_runtime` role and tenant isolation with two
  disposable real accounts.
- Complete a backup/restore rehearsal in a separate database.
- Confirm Render client-IP header behavior from two controlled networks.
- Complete Hebrew-content acceptance, five-second visual recognition and the
  first learner pilot with Kevin's mother or friends.

The Render link is staging for a private pilot, not production. A fix is not
complete merely because a unit test is green: preserve the `TEST_REPORT.md`
not-run list and record exact new evidence there.
