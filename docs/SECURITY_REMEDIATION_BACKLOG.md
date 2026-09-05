# Security remediation backlog

**Current review date:** 2026-09-05 (`Asia/Jerusalem`)
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

The old scan covered an earlier snapshot, not today's checkout. Its secret-file
repository finding is no longer actionable: `.env.bak` never entered the
committed or remote history, current Git tracks only `.env.example`, and backup
patterns are ignored. The separate Supabase administrator-password rotation is
still an operator action and remains unverified.

Six findings remain confirmed in current source. One additional JWKS finding is
confirmed for deployments that set `SUPABASE_URL`, but that optional bearer path
is not enabled by the checked-in Render Blueprint. Account deletion received a
real partial repair for device audio, yet still leaves identity and saved-account
metadata in browser storage.

## Triage and implementation queue

| Rank | ID | Severity | Current verdict | Evidence and bounded next fix |
|---:|---|---|---|---|
| 1 | SEC-03 | Medium | **Confirmed** | `/health/ready` is public and borrows PostgreSQL connections. The idle queue is capped at eight, but an empty queue opens another connection without a total-active cap. Add a store-wide bounded permit, acquisition timeout and fail-closed `503`; preserve tenant reset, RLS and dead-connection handling. Add concurrency tests against fakes before any live or load check. |
| 2 | SEC-04 | Medium | **Confirmed** | The import boundary accepts roughly 32 MB, the request-body middleware can buffer a chunked body before authentication, `read_text` plus `json.loads` materializes it, row preparation duplicates up to 250,000 rows, and the cloud 4 MB ceiling is enforced only after hydrate/import/snapshot. Put authentication and an import-specific admission slot before expensive buffering, align the hosted limit with the durable snapshot ceiling, and parse or validate with bounded memory. |
| 3 | SEC-02 | Medium | **Confirmed when `SUPABASE_URL` is enabled; inactive in declared Render config** | Any Bearer token reaches `PyJWKClient.get_signing_key_from_jwt`; an unknown `kid` can trigger an eight-second blocking JWKS refresh in the thread pool. Add a strict token/header-size gate, bounded negative-`kid` cache, single-flight refresh and pre-fetch rate/concurrency admission. Keep issuer, audience, algorithm and signature verification unchanged. |
| 4 | SEC-06 | Low | **Confirmed** | No `TrustedHostMiddleware` or equivalent Host allowlist protects the local/LAN service. Add exact loopback and explicitly selected LAN hosts, reject unknown Host values, and cover IPv4, IPv6 and development-host cases. Apply same-origin protection to state-changing local/LAN requests as appropriate. |
| 5 | SEC-05 | Low | **Confirmed, opt-in only** | `scripts/start.ps1 -BindAddress 0.0.0.0` exposes the writable local SQLite workspace on the LAN while local authentication defaults off. The loopback default is safe. Add an explicit pilot mode with a generated short-lived pairing secret or a deliberately read-only LAN session, plus a prominent expiry/firewall warning. Do not silently reuse cloud credentials. |
| 6 | SEC-07 | Low | **Confirmed** | Production Swagger remains public and executes jsDelivr JavaScript under the application origin with `script-src ... 'unsafe-inline'`. Prefer disabling interactive docs in production or self-hosting pinned Swagger assets and a nonce/hash bootstrap so application-origin scripts remain `self` only. |
| 7 | SEC-08 | Low | **Confirmed after partial repair** | Permanent deletion now removes the server account and owner-scoped IndexedDB recordings, and reports recording-cleanup failure. It still does not remove the learner identity key, local-welcome key or that learner's entry in `ivrit-sheli-saved-accounts`. Capture the old learner ID before auth state changes, remove every owner-scoped browser key, call `forgetSavedAccount(oldId)`, and add an App-level regression that proves other learners remain untouched. |
| closed | SEC-01 | Medium | **Not actionable in current repository** | The old scan saw a staged `.env.bak`; the path is absent from current index, local/remote commit history and Git object paths. Ignore rules now cover common backup forms. Keep ignored local backups private and rotate the exposed Supabase administrator password through the provider dashboard; never print or commit the values. |

## Recommended slices

Do not combine all findings into one large patch. The safest order is:

1. Fix SEC-03 as a focused PostgreSQL-pool availability change, with fake
   concurrency tests and no weakening of connection cleanup or tenant scope.
2. Fix SEC-04 as a separate HTTP/import resource-boundary change.
3. Harden SEC-02 only if the Supabase bearer integration will remain supported;
   otherwise remove the unused configuration and code path deliberately.
4. Group SEC-05 and SEC-06 into one local/LAN trust-boundary slice.
5. Close SEC-07 and SEC-08 as independent, low-risk slices.
6. Rerun a fresh static security scan on the final commit, then run the normal
   unit/type/build gates and only the smallest authorized dynamic checks.

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
