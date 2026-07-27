# Architecture — Ivrit Sheli 2.9 Listening & Personal Coach

Ivrit Sheli 2.9 keeps two deliberate runtime modes. The local SQLite application remains the simplest private installation and requires no account; cloud mode adds authenticated multi-user continuity without duplicating or weakening the learning engine. The verified public deployment remains 2.4.0 while this 2.9 source is an unpublished candidate.

## System shape

```text
Browser: React 19 + TypeScript + PWA + EN/ES/HE + RTL
                         │
                         │ same-origin HTTPS + secure session cookie
                         ▼
Ivrit Sheli 2.9 FastAPI application
  ├── Google OIDC / GitHub OAuth + provider-bound PKCE state
  ├── signed-in / deterministic demo session boundary
  ├── CSRF verification for authenticated mutations
  ├── request-ID and structured JSON logging middleware
  ├── deterministic LocalLearningEngine + persistent daily practice
  ├── reviewed LocalPersonalCoach + bounded learner model
  ├── Faster Whisper short-audio worker (optional, one CPU slot)
  ├── learning, recommendation and healthy-motivation engines
  ├── AI, audio and connector provider routers
  └── liveness, readiness and immutable version probes
             │                              │
             │ cloud learner data           │ reference lexicon
             ▼                              ▼
     PostgreSQL 17                    read-only/local SQLite
  users · sessions · OAuth state      Hebrew dictionary + FTS
  one JSONB learner state per user
  Alembic migrations + tenant RLS

Private terminating reminder cron
  └── dedicated push-worker role → encrypted Push subscriptions only
```

One browser Push endpoint has one current learner owner. Migration
`20260727_0005` transfers that association through a tenant-checked
`SECURITY DEFINER` function owned by a dedicated no-login, no-bypass-RLS role.
The web runtime receives execute permission on that one function, not
cross-tenant table visibility.

The PWA caches only the application shell, reviewed starter dictionary and six region scenes. Service-worker routing deliberately bypasses `/api/`, OAuth and private learner data. A disconnected cloud learner can browse previously cached reference content, but writes stop and request reconnection; local SQLite remains the full no-account development/private mode.

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

AI interactions, pronunciation attempts, coach feedback, adaptive learner state
and connector state use the same locked tenant execution boundary; they do not
fall back to the process-wide local database in cloud mode. Retained cloud TTS
files are rejected. Speech uploads use random request and worker names. The
request file is deleted after the response path; a timed-out worker deletes its
private copy when decoding actually ends before releasing the single slot.
Cloud exports are removed after a completed response.

Push subscriptions are deliberately outside the learner snapshot. PostgreSQL
stores their encrypted document, keyed endpoint digest and preferences under
the authenticated user, while account deletion cascades them. The web runtime
can manage only the current user's subscription. A separate
`ivrit_sheli_push_worker` role can claim due deliveries across users but has no
learner-state, session or OAuth privileges.

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

## Core learning transactions

Learning Core 2.6 adds a second server-owned transaction boundary for lesson evidence. GET requests expose curriculum/state and derive the next activity without writing. A submitted attempt accepts only bounded learner self-report; the server derives the active phase, skill dimension, reading support, transition and schedule. An activity concurrency token rejects stale state, and an idempotency key returns the stored response for an exact retry without advancing twice. Exposure, reveal, reference-feedback acknowledgement and reflection do not update mastery. Corrected retry, delayed recall and transfer remain distinct evidence types. XP is not accepted by this endpoint and cannot reduce reading support.

The seven phases are encounter, retrieval, reference feedback (internally `focused_feedback`), corrected retry, delayed review, transfer and reflection. Version 2.8 replaces the earlier mechanical niqqud reduction with authored per-concept `reading_hints`: a concept shows complete reviewed niqqud, an authored hint or no niqqud. It never deletes marks by character parity. Older local databases and cloud snapshots receive conservative defaults while preserving prior level, learner mode, review and four-skill history.

Version 2.8 adds a simpler daily-session transaction on top of that evidence foundation. `LocalLearningEngine` deterministically ranks reviewed concepts from profile level/mode/goal, SRS urgency, mistakes, confidence, latency, exposure and difficulty. It emits a stable plan:

```text
encounter → 3–5 retrievals by mode/content → listening → speaking/manual fallback → reflection → summary
```

`practice_sessions` owns the plan, current step, status and timestamps. `practice_step_events` stores an outcome (`completed`, `failed` or `unsupported`) under a unique idempotency key. `curriculum_progress` stores conservative lesson state and meaningful-attempt dates. Exact retries replay the stored result; conflicting or out-of-order writes fail without duplicating evidence or XP. Unsupported microphone/browser states remain explicit, and the manual fallback never becomes a claimed pronunciation assessment.

The curriculum contract returns structured A0–A2 coverage, an explicitly experimental B1/B2 Lab and a sound-first track for 22 base Hebrew letters plus final forms. It reports `complete_course_claim: false`. The reviewed dictionary provides 240 A0–A2 concepts with stable visual identifiers, trilingual alternative text and authored reading hints. Missing reviewed hints cause full niqqud or no niqqud—not mechanical mark deletion.

Submitting one review remains atomic:

1. Store the attempt.
2. Compute the next review state.
3. Update concept mastery.
4. Add XP.
5. Evaluate achievements.
6. Record the event.
7. Return the updated dashboard delta.

In cloud mode the entire resulting learner snapshot is written beneath the same tenant row lock, preventing lost updates from concurrent requests.

### Listening and coach transactions

Self-hosted transcription is not learning evidence. The API validates the
media, stages a worker copy and invokes one shared Faster Whisper `small` model
with Hebrew forced, VAD and CPU INT8. Typed results distinguish busy,
unavailable, timeout and no-speech. Transcript analysis performs bounded exact
dictionary lookups only. It cannot award XP or speaking mastery.

`LocalPersonalCoach` reads the reviewed dictionary, reviewed pattern library
and bounded learner context. It emits three traceable example bands and a
plain-language reason. `learning_feedback` stores one idempotent response per
card/dimension. `learner_model_state` applies small clamped updates and can be
reset independently from vocabulary, sessions and curriculum evidence.

Device-retained audio does not enter this server architecture. IndexedDB stores
it under `local:device` or `cloud:<user-id>`; legacy unscoped files remain
hidden until explicitly cleared.

Connector import builds its validated list first and creates up to 50 selected phrases inside one hydrate, tenant mutation and snapshot cycle. Synchronous PostgreSQL, SQLite and provider work runs through Starlette's bounded worker threadpool; session resolution is explicitly offloaded from the request middleware, so dependency work cannot block the ASGI event loop or liveness handling.

## Observability contract

Production logs are one JSON object per line. Every record has `timestamp`, `level`, `logger`, and `message`. Completed HTTP-request events additionally carry `event`, `request_id`, `method`, route template, status, duration, version, commit, environment, and a privacy-safe user correlation value when available; process-level records contain only the relevant subset.

The formatter recursively redacts credentials, cookies, authorization headers, OAuth codes, tokens, secrets and password-like fields. Request and response bodies, transcripts, raw audio and Push endpoints are not logged. `X-Request-ID` is accepted when safe or generated by the server, returned in the response header and included in errors.

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
- v2.9 learning, transcript understanding and recommendations are deterministic and require no external AI provider. Self-hosted speech is optional infrastructure; browser/manual fallbacks preserve the learning path. Existing cloud AI/audio adapters remain disabled/experimental unless a later explicit privacy and cost review enables them.
- Google login requests only `openid profile`; it never grants Gmail, Drive or Calendar access. Separate connector credentials cannot widen the sign-in session.
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
| Self-hosted speech unavailable/busy | Browser recognition when available or manual text; no speech evidence is fabricated |
| Self-hosted speech timeout | `504` typed response; worker copy is deleted when decoding ends and the slot remains unavailable until then |
| Push endpoint expires | The affected subscription is disabled; the learner session continues |
| Reminder cron overlaps | Learner-level claim prevents a duplicate; Railway skips a still-running prior cron execution |
| Microphone denied or unsupported | Explicit unsupported step plus manual production fallback; no speech evidence is fabricated |
| Network lost in cloud mode | Cached reference content remains readable; writes pause and request reconnection |
| Duplicate practice submission | Stored response is replayed; evidence and XP are not duplicated |
| Stale or out-of-order practice submission | `409` conflict; the client reloads the authoritative session |
| Connector token expired | The preview returns a bounded provider error; automatic disabled-state persistence and reauthorization UI are not implemented in 2.0 |
| Database write failure | Transaction rollback and correlated request ID |
| Unexpected application error | Redacted JSON error and structured server log |

## Deployment boundaries

- Docker runs as the unprivileged `ivrit` user.
- Docker Compose gives the administrator URL only to a one-shot provisioner; the app receives only the restricted URL.
- The reminder cron receives only `PUSH_DATABASE_URL` for the dedicated Push role; it never receives `MIGRATION_DATABASE_URL` or the web runtime URL.
- Railway runs the idempotent Alembic/role provisioner as a pre-deploy command, then its pinned serve wrapper removes `MIGRATION_DATABASE_URL` before Uvicorn and waits for `/health/ready`.
- Every application connection authenticates directly as `ivrit_sheli_runtime`, which cannot create databases or roles, create objects in `public`, inherit privileges, replicate, bypass RLS or `SET ROLE` through a retained membership.
- Readiness requires the exact packaged Alembic head and verifies both `SESSION_USER` and `CURRENT_USER` are the restricted login.
- Production uses one same-origin HTTPS hostname; CORS is allow-listed to that origin.
- Horizontal replicas are safe for session/state access, but migrations must remain a separate pre-deploy step.
- The private 2.9 learner snapshot and Push schema add fields and tables that an unmodified 2.4 writer does not preserve. Do not mix those writers against one production state store or roll back after 2.9 writes without restoring a verified compatible backup; see `DEPLOYMENT.md`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact operational procedure and [API.md](API.md) for the public contract.
