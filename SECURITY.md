# Security policy

## Supported versions

| Version | Supported |
|---|---:|
| 2.8.x | Yes — unreleased private candidate |
| 2.6.x | No — superseded candidate |
| 2.5.x | No — superseded candidate |
| 2.4.x | Yes |
| 2.3.x | No — superseded candidate |
| 2.2.x | Yes |
| 2.1.x | Critical fixes only; upgrade recommended |
| 2.0.x | Critical fixes only; upgrade strongly recommended |
| 1.0.x | Critical fixes only; upgrade recommended |
| Older | No |

Security fixes target the latest `main` branch and the most recent tagged release.

## Report a vulnerability

Use GitHub's private vulnerability-reporting flow when it is enabled for the repository, or email `kevincusnir@gmail.com` with a minimal, anonymized reproduction. Do not open a public issue containing credentials, real learner phrases, email/calendar content, recordings, database exports, cookies, OAuth codes, request logs or personal identifiers.

Include:

- Affected release or commit.
- Local-first or cloud mode.
- Reproduction steps using synthetic data.
- Expected and observed behavior.
- Security impact and any temporary mitigation.

Do not access another person's data, persist access, degrade the public demo or run destructive tests.

## 2.x security model

### Identity and sessions

- Google and GitHub OAuth use random state, S256 PKCE, provider binding and single-use state consumption.
- Google sign-in requests only `openid profile` and stores the provider subject, display name and optional picture. GitHub stores the provider ID, login, display name and optional avatar. OAuth access tokens, ID tokens, provider passwords and provider email addresses are not persisted.
- Session and CSRF bearer values are generated randomly; only domain-separated, `SESSION_SECRET`-keyed BLAKE2b-256 digests reach PostgreSQL.
- The production session cookie is `HttpOnly`, `Secure`, and `SameSite=Lax`; the double-submit CSRF cookie is intentionally browser-readable, `Secure`, and `SameSite=Strict`.
- OAuth-state bearers use the same keyed storage boundary, so secret rotation invalidates all previously stored bearer hashes.
- Logout revokes the server-side session.
- Authenticated learners can permanently delete their cloud identity and learner state; foreign-key cascades remove sessions and the tenant snapshot in the same database transaction.
- Sessions have a bounded configurable lifetime and retention window; expired OAuth state and session rows are cleaned opportunistically.
- Auth POSTs require same-origin JSON semantics; logout accepts an exact allow-listed Origin or, when Origin is absent, the active session's double-submit CSRF proof.
- Active OAuth states have a transaction-serialized global PostgreSQL cap. OAuth/demo endpoints combine a process-local client bucket with a higher circuit breaker; Railway mode deliberately trusts exactly one ingress-overwritten `X-Real-IP`, while `X-Forwarded-For` is never used.
- The deterministic demo identity is non-admin, tenant-isolated and read-only.
- Live demo sessions are capped independently, so abuse cannot evict authenticated learners.
- Auth endpoints combine per-client limits with a higher process-level circuit breaker; authenticated writes and live sessions are capped per user.
- Cloud learner snapshots are rejected before persistence when their serialized UTF-8 size exceeds the configured ceiling.
- The service worker never handles API or operational-probe requests and refuses to cache responses marked `no-store`.

### Authorization and tenant isolation

- Authenticated requests resolve one user before the learner repository is created.
- Every learner-state query includes an explicit user ID.
- PostgreSQL row-level security checks `app.user_id` as defense in depth against missing or incorrect tenant predicates. Because the restricted runtime role sets that transaction context, RLS is not claimed as containment for SQL injection or compromise of the runtime credential.
- Mutations lock and update one tenant row atomically.
- Integration tests use real PostgreSQL and prove cross-user isolation.

### Input, output and browser boundaries

- Pydantic request models reject unknown top-level fields and bound high-risk scalar and list inputs. Middleware enforces configurable default, ICS-envelope and audio-envelope body ceilings for both declared and chunked requests.
- SQL statements use parameters.
- HTML is never built from untrusted dictionary, connector or AI output.
- CORS is restricted to allow-listed origins.
- Authenticated mutations require CSRF verification.
- Browser responses set a restrictive Content Security Policy, same-origin opener/resource isolation, anti-framing, no-sniff, referrer and permissions policies. The API-docs route narrowly permits its documentation CDN and inline Swagger bootstrap while the application shell remains same-origin for executable code.
- Production responses advertise HTTPS-only transport with HSTS. API, authentication and operational JSON responses use `Cache-Control: no-store`; fingerprinted frontend assets and the PWA service worker keep their independent cache behavior.
- Uploaded audio is limited to 25 MB and an allow-list of filename extensions. The current release does not claim MIME or magic-byte content inspection.
- The frontend receives no database, OAuth client, AI provider or connector secrets.

### Observability and privacy

- Production logs are structured JSON; completed HTTP-request events include request IDs, while startup and other process-level records may not.
- Authorization headers, cookies, OAuth codes, session material, tokens, secrets and password-like fields are redacted.
- Request and response bodies are not logged.
- Error responses expose a correlation ID, not stack traces.
- Liveness does not disclose database details; readiness is intentionally dependency-aware.

### Optional external processing

- External AI is disabled by default.
- Production cloud AI requires server configuration, explicit user action and a matching GitHub login or provider-ID allowlist entry. Google-authenticated learners retain the complete offline/core product but do not implicitly inherit Kevin's paid-provider allowlist.
- Google connector scopes are read-only.
- Production Google previews require a separate matching GitHub identity allowlist; credentials without that allowlist fail startup.
- The application never automatically ingests a mailbox, calendar or drive.

## Secret management

Never commit live or non-placeholder values for:

- `.env` files with values.
- `SESSION_SECRET`.
- GitHub OAuth client secrets.
- Google sign-in OAuth client secrets.
- `DATABASE_URL` restricted runtime credentials.
- `MIGRATION_DATABASE_URL` administrator credentials.
- AI or Google API credentials.
- Database dumps or learner exports.

The known literals in `docker-compose.yml` are intentionally non-secret loopback-development placeholders. They must never be reused for a public deployment.

Production values belong in the host's sealed secret store. Rotate a secret immediately if it is printed, pasted into an issue, committed, included in an image layer or exposed to browser JavaScript. Revoke affected sessions after rotating `SESSION_SECRET`.

## Deployment checklist

1. Set `APP_ENV=production`, `AUTH_REQUIRED=true` and `DEBUG=false`.
2. Use HTTPS and `SESSION_COOKIE_SECURE=true`.
3. Generate a unique `SESSION_SECRET` of at least 32 characters.
4. Restrict `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS`, and every configured Google/GitHub callback to the exact public domain.
5. Store both database URLs and provider credentials as sealed variables; never give the web process the migration URL.
6. Run `python -m ivrit_sheli.db_admin migrate` as the separate pre-deploy step.
7. Require `/health/ready` before routing traffic.
8. Run the real PostgreSQL integration suite and production image build in CI.
9. Verify the demo is read-only and two identities are isolated.
10. Review structured logs for accidental sensitive data before launch.
11. Keep provider allowlists empty unless each GitHub login or provider ID was verified.
12. Configure cost limits, backups and a tested restore procedure.
13. Record the deployed commit in `BUILD_COMMIT` (or Railway's automatic commit SHA fallback).

## Dependency and incident response

- Pin runtime dependencies and review automated update pull requests.
- Rebuild the container after a base-image or runtime security fix.
- Preserve request IDs, deployment commit and migration revision during an incident.
- Revoke sessions and OAuth credentials when compromise is suspected.
- Roll back application code independently from schema/data recovery.
- Publish a corrected patch release; never silently move an existing release tag.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for implementation and operations details.
