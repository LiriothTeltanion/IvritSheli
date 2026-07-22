# API catalog — Ivrit Sheli 2.4 Contest Edition

Application base path: `/api/v1`

The production frontend and API share one HTTPS origin. JSON responses include an `X-Request-ID` header; validation and application errors return the same correlation ID in their error envelope.

## Authentication contract

| Method | Route | Purpose | Access |
|---|---|---|---|
| `GET` | `/api/v1/auth/me` | Return the current session, demo/read-only flag and public user fields | Public |
| `GET` | `/api/v1/auth/google/start?next=/` | Create provider-bound OAuth state + S256 PKCE and redirect to Google | Public when configured |
| `GET` | `/api/v1/auth/google/callback` | Validate and consume Google state, create a session, redirect safely | Public callback |
| `GET` | `/api/v1/auth/github/start?next=/` | Create provider-bound OAuth state + S256 PKCE and redirect to GitHub | Public when configured |
| `GET` | `/api/v1/auth/github/callback` | Validate and consume OAuth state, create a session, redirect safely | Public callback |
| `POST` | `/api/v1/auth/demo` | Start the deterministic read-only demo session | Public |
| `POST` | `/api/v1/auth/logout` | Revoke the server-side session and clear cookies | Session-aware |
| `DELETE` | `/api/v1/account` | Permanently delete the authenticated cloud identity, sessions and learner state | Authenticated + CSRF |

`GET /auth/me` returns:

```json
{
  "authenticated": true,
  "demo": false,
  "read_only": false,
  "user": {
    "id": "uuid",
    "display_name": "Learner",
    "provider": "google",
    "login": null,
    "avatar_url": "https://lh3.googleusercontent.com/..."
  },
  "auth_providers": ["google", "github"]
}
```

`auth_providers` lists only the sign-in methods configured by the server, so the frontend does not present a provider that cannot complete. Google users have `login: null`; GitHub users may have a login. The providers are separate identities and are not auto-linked by email. Google sign-in requests only `openid profile`; GitHub requests identity-only `read:user`. Neither callback persists provider bearer tokens or email addresses.

The session bearer is an `HttpOnly` cookie. A separate readable CSRF cookie is echoed as `X-CSRF-Token` by the same-origin frontend for authenticated mutations. Demo sessions can read seeded learner data but receive `403 demo_read_only` on private mutations. Demo and logout POSTs require `application/json` and reject cross-site Origin/Fetch Metadata. Logout accepts an exact allow-listed Origin or, when Origin is absent, the active session's double-submit CSRF proof.

OAuth start/callback and demo entry use a process-local per-client window plus a higher per-endpoint circuit breaker. Direct mode uses the raw ASGI peer; explicit Railway mode uses one valid Railway-overwritten `X-Real-IP`. `X-Forwarded-For` is never read. A limited response is `429` with `Retry-After`. Live OAuth states are also capped transactionally in PostgreSQL across all replicas.

Account deletion accepts exactly `{"confirm": true}` and follows the normal authenticated mutation CSRF boundary. It is unavailable to the shared demo and local-device mode. A successful deletion clears the browser cookies and returns an unauthenticated session payload; the action cannot be undone.

## Operations

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health/live` | Process liveness; independent of PostgreSQL |
| `GET` | `/health/ready` | Dictionary plus PostgreSQL/migration readiness |
| `GET` | `/version` | Version, environment, storage mode and build commit |
| `GET` | `/api/v1/health/live` | API-prefixed liveness alias |
| `GET` | `/api/v1/health/ready` | API-prefixed readiness alias |
| `GET` | `/api/v1/version` | API-prefixed version alias |
| `GET` | `/api/v1/health` | Backward-compatible detailed application health |

The hosting platform should route traffic only when `/health/ready` returns `200`. Monitoring should use `/health/live` to distinguish an unavailable dependency from a dead process.

## Dashboard, profile and learning

| Method | Route |
|---|---|
| `GET` | `/api/v1/dashboard` |
| `GET` | `/api/v1/profile` |
| `PUT` | `/api/v1/profile` |
| `GET` | `/api/v1/items` |
| `GET` | `/api/v1/items/{item_id}` |
| `POST` | `/api/v1/items` |
| `GET` | `/api/v1/registry?q=...&status=...&due=...&sort=...` |
| `GET` | `/api/v1/reviews/next` |
| `POST` | `/api/v1/reviews/{item_id}` |
| `GET` | `/api/v1/recommendations` |
| `GET` | `/api/v1/progress` |
| `GET` | `/api/v1/export` |
| `POST` | `/api/v1/bug-reports` |

In cloud mode every operation resolves the authenticated tenant before accessing learner data. No client-provided user ID selects ownership. Authenticated mutations use a process-local per-user rate limit, and a serialized UTF-8 learner snapshot that would exceed the configured durable ceiling is rejected before persistence.

Generic `POST /items` accepts learner-facing provenance labels such as `manual` and `quick_capture`, but rejects the server-owned `dictionary:`, `connector:`, `system:`, `seed:` and `starter_pack` namespaces. Trusted source identity is assigned only by the dedicated server workflow.

The profile contract also persists onboarding state, learner experience, curriculum-track preference and a self-selected pragmatic CEFR-aligned planning band. Experience mode (`guided`, `explorer`, or `experienced`) changes interface guidance without silently changing that band. The v2.6 curriculum contract explicitly identifies its selection policy as a shared due queue; track and band do not filter activities until reviewed item metadata is available. The registry returns persisted learner items with transparent `active`, `mastered`, or `needs_review` status; due/upcoming state; review count; learned and latest-activity dates; and modality-specific mastery. Search, filters, and sorting run inside the resolved tenant only.

## Learning Core 2.6

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/learning-core` | Versioned curriculum, learner state, skill map and delayed-retention checkpoints. |
| `GET` | `/api/v1/learning-core/next` | Next server-derived phase and explainable activity. |
| `POST` | `/api/v1/learning-core/attempt` | Submit bounded learner evidence; the server derives phase, skill, schedule and support transition. |

The attempt payload accepts `item_id`, the current server-issued `activity_token`, a client-generated `idempotency_key`, learner-reported correctness and confidence, response time, hint count and optional answer text. It does not accept a client-selected phase, skill, mastery value, interval or XP award. The activity token is a concurrency checksum, not an authentication credential; normal session and CSRF controls still authorize the write. An exact retry with the same idempotency key returns the stored response with `duplicate: true` and does not advance again. Reusing a key with different content, or submitting a stale activity token under a new key, returns `409 learning_core_conflict` before any evidence is written.

Core correctness, mastery signals and retention checkpoints identify their source as `learner_self_report`; v2.6 does not present them as objective scoring. Exposure, reference-feedback acknowledgement, answer reveals and reflection cannot increase mastery. Retention is reported only inside explicit target windows: 18–54 hours for the `24h` checkpoint, 120–240 hours for `7d`, and 504–1080 hours for `30d`; out-of-window attempts are not relabeled. The shared read-only demonstration may inspect the two GET routes but cannot submit an attempt.

## Dictionary

| Method | Route |
|---|---|
| `GET` | `/api/v1/dictionary/search?q=...` |
| `GET` | `/api/v1/dictionary/lookup?word=...` |
| `GET` | `/api/v1/dictionary/entries/{entry_id}` |
| `GET` | `/api/v1/dictionary/stats` |
| `POST` | `/api/v1/dictionary/{entry_id}/learn` |

Dictionary reference data remains local/rebuildable SQLite data in both runtime modes. Adding an entry to a learner plan is tenant-owned and therefore authenticated.

Dictionary results are decorated with the current learner's saved-item ID, learning status, and due state. Search, lookup and entry GETs are read-only: exploration does not append events, award XP or change mastery. Repeated **Add to learning** requests return the existing active item instead of creating new duplicate vocabulary records.

The 2.3 dictionary schema adds nullable `level`, `category`, and `visual` fields to an entry. A visual value contains a stable `key`, an `emoji`, and localized `alt` text for `en`, `es`, and `he`. Curated senses expose the same metadata and provenance; examples may include `translation_es`. Imported or unsupported entries may correctly return `visual: null` rather than receiving a fabricated cue.

## AI

| Method | Route |
|---|---|
| `POST` | `/api/v1/ai/analyze` |
| `POST` | `/api/v1/ai/word_insight` |
| `POST` | `/api/v1/ai/correct` |
| `POST` | `/api/v1/ai/exercises` |
| `POST` | `/api/v1/ai/dialogue` |
| `POST` | `/api/v1/ai/roleplay` |
| `POST` | `/api/v1/ai/mission` |
| `POST` | `/api/v1/ai/niqqud` |
| `POST` | `/api/v1/ai/transliteration` |
| `POST` | `/api/v1/ai/weekly-plan` |
| `POST` | `/api/v1/ai/enrich-item` |

Offline deterministic results require no external service. Online processing requires server configuration, `ALLOW_CLOUD_PROCESSING=true`, an explicit request with cloud consent and—in production cloud mode—a matching GitHub login or provider-ID allowlist entry. Cloud TTS/STT uses the same paid-provider gate.

## Audio

| Method | Route |
|---|---|
| `POST` | `/api/v1/audio/tts` |
| `POST` | `/api/v1/audio/stt` |
| `POST` | `/api/v1/audio/word-analysis` |
| `POST` | `/api/v1/audio/pronunciation-score` |

Uploads are bounded by the request envelope, decoded file size and filename-extension allowlist. MIME and magic-byte validation remain an explicit limitation in 2.4. App-managed audio and transcripts are excluded from structured request logs.

`POST /audio/tts` accepts `voice_style: "masculine" | "feminine"`; clients cannot inject arbitrary provider voice IDs. `POST /audio/word-analysis` accepts exactly one Hebrew transcript plus client-reported `browser`, `openai`, or `manual` provenance. The server does not present the client report as independently verified. Its local path is a non-mutating dictionary analysis and is available to the read-only demo. Cloud enrichment still requires an authenticated non-demo identity, production allowlisting, stored learner consent, and an explicit `cloud_requested: true` action. Word analysis never updates XP or mastery.

The historical `pronunciation-score` route name remains for v2.6 compatibility. Its response declares `assessment_type: "transcript_recognition_match"`; the value compares the expected text with a recognized transcript and is not a phoneme, accent, intelligibility, native-likeness or clinical assessment.

## Gamification and missions

| Method | Route |
|---|---|
| `GET` | `/api/v1/gamification/status` |
| `GET` | `/api/v1/achievements` |
| `POST` | `/api/v1/missions` |
| `POST` | `/api/v1/missions/{mission_id}/complete` |

## Connectors

| Method | Route |
|---|---|
| `GET` | `/api/v1/connectors` |
| `POST` | `/api/v1/connectors/ics/preview` |
| `POST` | `/api/v1/connectors/google/preview` |
| `POST` | `/api/v1/connectors/import` |

Connector previews are read-only. Production Google previews require their own GitHub identity allowlist; local ICS preview does not. Import occurs only for explicitly selected phrases and remains blocked for the public demo.

One import accepts at most 50 phrases and, in cloud mode, applies the selected batch in one locked tenant hydrate/mutate/snapshot transaction.

## Error envelope

```json
{
  "error": {
    "code": "authentication_required",
    "message": "Sign in or enter the seeded demonstration.",
    "request_id": "a-safe-correlation-id"
  }
}
```

Common status codes:

| Status | Meaning |
|---:|---|
| `400` | Invalid operation or provider response |
| `401` | Missing, expired or revoked session |
| `403` | Demo mutation, CSRF/origin validation or production provider allowlist failed |
| `404` | Tenant-owned entity does not exist for this user |
| `413` | Declared or streamed request body exceeded the route ceiling |
| `429` | Authentication window or global OAuth-state capacity was reached; honor `Retry-After` |
| `422` | Strict request validation failed |
| `503` | Required dependency is not ready |

OpenAPI is generated from the running FastAPI application. It must not be treated as an authorization boundary; middleware applies the session, demo and CSRF rules before private route handlers run.
