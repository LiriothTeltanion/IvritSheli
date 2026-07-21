# Architecture — Ivrit Sheli 2.4 Contest Edition

Ivrit Sheli 2.4 has two deliberate runtime modes. The private SQLite application remains the simplest offline installation; the cloud mode adds authenticated multi-user delivery without duplicating or weakening the learning engine.

## System shape

```text
Browser: React 19 + TypeScript + PWA + EN/ES/HE + RTL
                         │
                         │ same-origin HTTPS + secure session cookie
                         ▼
Ivrit Sheli 2.4 FastAPI application
  ├── Google OIDC / GitHub OAuth + provider-bound PKCE state
  ├── signed-in / deterministic demo session boundary
  ├── CSRF verification for authenticated mutations
  ├── request-ID and structured JSON logging middleware
  ├── learning, recommendation and gamification engines
  ├── AI, audio and connector provider routers
  └── liveness, readiness and immutable version probes
             │                              │
             │ cloud learner data           │ reference lexicon
             ▼                              ▼
     PostgreSQL 17                    read-only/local SQLite
  users · sessions · OAuth state      Hebrew dictionary + FTS
  one JSONB learner state per user
  Alembic migrations + tenant RLS
```

## Runtime modes

| Mode | Durable learner data | Identity | Intended use |
|---|---|---|---|
| Local-first | SQLite files under the configured data directory | One trusted local learner; no account required | Private personal use, offline development |
| Cloud | PostgreSQL plus Alembic migrations | Google OIDC, GitHub OAuth or deterministic demo session | Public HTTPS deployment, learner pilot, multi-user testing |

The restricted runtime `DATABASE_URL` selects cloud mode. `MIGRATION_DATABASE_URL` exists only for the one-shot schema/role provisioner and is removed before Uvicorn starts. Without a runtime URL, the established SQLite repository is used. The dictionary stays in SQLite in both modes because it is rebuildable reference data with FTS-oriented access patterns, not private tenant state.

## Cloud persistence adapter

The mature learning domain already has broad test coverage against SQLite. Cloud mode reuses that implementation through a tenant adapter:

1. Resolve the authenticated user from a hashed server-side session.
2. Set the PostgreSQL `app.user_id` transaction context.
3. Select and lock only that user's `learner_states` row.
4. Hydrate an in-memory SQLite database from the versioned JSONB snapshot.
5. Execute the existing repository operation and domain transaction.
6. Serialize the new snapshot, increment its revision and commit atomically.

This gives the release two mutually reinforcing application controls: every query carries an explicit `user_id`, and PostgreSQL row-level security checks the transaction's tenant context. The runtime role is responsible for setting that context, so RLS protects against missing or incorrect predicates but is not presented as an independent barrier to SQL injection or compromise of the runtime credential. PostgreSQL is the durable cloud system of record; in-memory SQLite is only a compatibility execution layer.

AI interactions, pronunciation attempts and connector state use the same locked tenant execution boundary; they do not fall back to the process-wide local database in cloud mode. Retained cloud TTS files are rejected. Upload temporaries use random names and normal completion removes them; abrupt process termination can leave remnants in the persistent private directory until an operator removes them. Cloud exports are removed after a completed response.

## Authentication and session flow

### Provider-bound OAuth/OIDC

1. `GET /api/v1/auth/{google|github}/start` creates a random state and S256 PKCE verifier.
2. Only a hash of the single-use state is stored with its exact provider; it expires after ten minutes. PostgreSQL serializes the count-and-insert decision and caps all active states across replicas.
3. The provider redirects to its own `/api/v1/auth/{provider}/callback` and provider-specific state cookie path.
4. The backend rejects missing, replayed or provider-swapped state, then exchanges the code over the server channel.
5. Google persists only `sub`, display name and optional picture. GitHub persists only provider ID, login, display name and optional avatar. Provider tokens and email addresses are not persisted, and identities are never auto-linked by email.
6. A random session and CSRF token are generated. Only domain-separated, `SESSION_SECRET`-keyed BLAKE2b-256 digests are stored in PostgreSQL, so rotating that secret invalidates the bearer material.
7. The browser receives an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.

Google sign-in requests `openid profile` only. The separate Google Workspace connector client, credentials and user consent do not widen the login scope. `auth_providers` reports only complete server configurations so the browser cannot offer a dead sign-in button.

### Demo session

`POST /api/v1/auth/demo` creates a session for a deterministic, non-admin demo identity. Its seed state is isolated from every Google/GitHub identity. Demo mutations are rejected so a visitor cannot permanently change the shared demonstration.

### Request authorization

- Public: application shell, static assets, login endpoints, `/health/live`, `/health/ready`, `/version`.
- Authenticated: learner data and domain endpoints when `AUTH_REQUIRED=true`.
- Mutations: valid session plus CSRF verification.
- Logout: revokes the server-side session before clearing the cookie.
- Account deletion: authenticated CSRF-verified `DELETE /api/v1/account` removes the identity, sessions and learner state in one database boundary; the shared demo cannot be deleted.
- Demo/logout POSTs: non-simple same-origin JSON requests; logout verifies an exact allow-listed Origin or the active session's double-submit CSRF fallback.
- Public OAuth start/callback and demo entry: per-client sliding windows plus a higher endpoint circuit breaker are enforced per process; direct mode uses the raw peer, Railway mode trusts exactly one ingress-overwritten `X-Real-IP`, and `X-Forwarded-For` is never used.
- Authenticated writes: a per-user sliding window is enforced per process; live sessions are capped per user and the oldest excess session is removed on sign-in.
- Cloud persistence: the complete serialized learner snapshot is size-checked before the transaction can save it.

## Core learning transaction

Submitting one review remains atomic:

1. Store the attempt.
2. Compute the next review state.
3. Update concept mastery.
4. Add XP.
5. Evaluate achievements.
6. Record the event.
7. Return the updated dashboard delta.

In cloud mode the entire resulting learner snapshot is written beneath the same tenant row lock, preventing lost updates from concurrent requests.

Connector import builds its validated list first and creates up to 50 selected phrases inside one hydrate, tenant mutation and snapshot cycle. Synchronous PostgreSQL, SQLite and provider work runs through Starlette's bounded worker threadpool; session resolution is explicitly offloaded from the request middleware, so dependency work cannot block the ASGI event loop or liveness handling.

## Observability contract

Production logs are one JSON object per line. Every record has `timestamp`, `level`, `logger`, and `message`. Completed HTTP-request events additionally carry `event`, `request_id`, `method`, route template, status, duration, version, commit, environment, and a privacy-safe user correlation value when available; process-level records contain only the relevant subset.

The formatter recursively redacts credentials, cookies, authorization headers, OAuth codes, tokens, secrets and password-like fields. Request and response bodies are not logged. `X-Request-ID` is accepted when safe or generated by the server, returned in the response header and included in errors.

| Probe | Purpose | Database dependency |
|---|---|---:|
| `GET /health/live` | Process is running | No |
| `GET /health/ready` | Dictionary, exact Alembic head, and restricted runtime identity are available | Yes in cloud mode |
| `GET /version` | Application version, environment and build commit | No |

## Boundary rules

- Transport models reject unknown top-level fields and bound the documented scalar/list inputs. ASGI middleware rejects an oversized declared body before parsing and also bounds/replays chunked bodies; JSON/default requests, ICS multipart envelopes and audio multipart envelopes have separate configurable ceilings.
- API routes validate transport data and call services.
- Services own use-case transactions.
- Repositories own SQL and tenant predicates.
- Pure engines contain algorithms and have no network dependency.
- Providers wrap external APIs and never leak provider-specific response shapes upward.
- The frontend never receives provider, database or OAuth client secrets.
- External AI and connector processing remains opt-in.
- Beginner onboarding choices, guided-mode preference, First Steps checkpoint and lesson completion are learner-profile state, so they follow the local database or locked tenant snapshot boundary. In authenticated PostgreSQL mode that continuity follows the learner account across sessions; each word save/review and checkpoint update remains a separate validated request rather than one server-side lesson transaction.

## Failure behavior

| Failure | Behavior |
|---|---|
| PostgreSQL unavailable during cold start | Lifespan initialization fails, so the process never becomes ready and may not expose liveness |
| PostgreSQL becomes unavailable after startup | Readiness returns `503`; liveness remains process-only |
| Migration missing | The pre-deploy provisioner fails; if required tables are absent, application startup also fails |
| Migration revision is stale but tables remain | Application can start, but readiness returns `503` until the packaged Alembic head is restored |
| Session invalid or expired | JSON `401`; no learner state is loaded |
| CSRF check fails | JSON `403`; no mutation executes |
| OAuth state missing/replayed | Login fails safely; no session is created |
| OAuth state reaches the other provider callback | Provider mismatch fails safely; no session is created |
| AI provider unavailable | Offline provider result with a degraded-mode label |
| Dictionary unavailable | Startup or the affected dictionary request fails; no dictionaryless runtime fallback is claimed |
| Audio provider unavailable | Browser TTS or text-only practice |
| Connector token expired | The preview returns a bounded provider error; automatic disabled-state persistence and reauthorization UI are not implemented in 2.0 |
| Database write failure | Transaction rollback and correlated request ID |
| Unexpected application error | Redacted JSON error and structured server log |

## Deployment boundaries

- Docker runs as the unprivileged `ivrit` user.
- Docker Compose gives the administrator URL only to a one-shot provisioner; the app receives only the restricted URL.
- Railway runs the idempotent Alembic/role provisioner as a pre-deploy command, then its pinned serve wrapper removes `MIGRATION_DATABASE_URL` before Uvicorn and waits for `/health/ready`.
- Every application connection authenticates directly as `ivrit_sheli_runtime`, which cannot create databases or roles, create objects in `public`, inherit privileges, replicate, bypass RLS or `SET ROLE` through a retained membership.
- Readiness requires the exact packaged Alembic head and verifies both `SESSION_USER` and `CURRENT_USER` are the restricted login.
- Production uses one same-origin HTTPS hostname; CORS is allow-listed to that origin.
- Horizontal replicas are safe for session/state access, but migrations must remain a separate pre-deploy step.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact operational procedure and [API.md](API.md) for the public contract.
