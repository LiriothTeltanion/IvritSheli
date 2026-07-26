# API catalog — Ivrit Sheli 2.8 private candidate

This document describes the unpublished 2.8 source contract. The verified public Railway service remains on 2.4.0 until the 2.8 release gate is approved.

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
| `GET` | `/api/v1/curriculum/path` |
| `GET` | `/api/v1/practice/today` |
| `POST` | `/api/v1/practice/{session_id}/steps/{step_key}` |
| `GET` | `/api/v1/export` |
| `POST` | `/api/v1/bug-reports` |

In cloud mode every operation resolves the authenticated tenant before accessing learner data. No client-provided user ID selects ownership. Authenticated mutations use a process-local per-user rate limit, and a serialized UTF-8 learner snapshot that would exceed the configured durable ceiling is rejected before persistence.

Generic `POST /items` accepts learner-facing provenance labels such as `manual` and `quick_capture`, but rejects the server-owned `dictionary:`, `connector:`, `system:`, `seed:` and `starter_pack` namespaces. Trusted source identity is assigned only by the dedicated server workflow.

The profile contract persists onboarding state, learner experience, curriculum-track preference, a self-selected pragmatic CEFR-aligned planning band, `text_scale` and `focus_status`. Experience mode (`guided`, `explorer`, or `experienced`) changes interface guidance without silently changing that band; Guided/A0 is the beginner-safe default. `focus_status` is a learner/device preference, not a social-presence feature. The registry returns persisted learner items with transparent `active`, `mastered`, or `needs_review` status; due/upcoming state; review count; learned and latest-activity dates; and modality-specific mastery. Search, filters, and sorting run inside the resolved tenant only.

## Learning Core 2.6

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/learning-core` | Versioned curriculum, learner state, skill map and delayed-retention checkpoints. |
| `GET` | `/api/v1/learning-core/next` | Next server-derived phase and explainable activity. |
| `POST` | `/api/v1/learning-core/attempt` | Submit bounded learner evidence; the server derives phase, skill, schedule and support transition. |

The attempt payload accepts `item_id`, the current server-issued `activity_token`, a client-generated `idempotency_key`, learner-reported correctness and confidence, response time, hint count and optional answer text. It does not accept a client-selected phase, skill, mastery value, interval or XP award. The activity token is a concurrency checksum, not an authentication credential; normal session and CSRF controls still authorize the write. An exact retry with the same idempotency key returns the stored response with `duplicate: true` and does not advance again. Reusing a key with different content, or submitting a stale activity token under a new key, returns `409 learning_core_conflict` before any evidence is written.

Core correctness, mastery signals and retention checkpoints identify their source as `learner_self_report`; v2.6 does not present them as objective scoring. Exposure, reference-feedback acknowledgement, answer reveals and reflection cannot increase mastery. Retention is reported only inside explicit target windows: 18–54 hours for the `24h` checkpoint, 120–240 hours for `7d`, and 504–1080 hours for `30d`; out-of-window attempts are not relabeled. The shared read-only demonstration may inspect the two GET routes but cannot submit an attempt.

## Curriculum path and persistent daily practice 2.8

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/curriculum/path` | Return the structured A0–A2 path, honestly labelled B1/B2 Lab and sound-first 22-letter reading track. |
| `GET` | `/api/v1/practice/today` | Return or create the tenant's resumable daily session and its current step. |
| `POST` | `/api/v1/practice/{session_id}/steps/{step_key}` | Record one ordered step outcome using an idempotency key. |

`GET /curriculum/path` reports `complete_course_claim: false`. A0–A2 are structured coverage; B1/B2 are laboratory material unlocked only for suitable Explorer/Experienced profiles. The concept target is 240, while the response separately reports how many personal learning items are currently available.

The daily plan is deterministic and uses only reviewed linguistic data plus stored learner signals: level, experience, goal, SRS urgency, mistakes, confidence, response time, exposure and difficulty. The ordered session is `encounter → retrievals → listening → speaking/manual fallback → reflection → summary`. Exercise types cover visual meaning, audio choice, Hebrew-to-meaning, meaning-to-Hebrew word bank, cloze/order and spoken production.

Each step payload supplies an `outcome` of `completed`, `failed` or `unsupported`, a client-generated idempotency key and bounded optional evidence. An exact replay returns the previously stored result without duplicating progress or XP. A conflicting retry or out-of-order step returns `409`, after which the client reloads the authoritative session. Unsupported microphone/browser states remain explicit and can use the manual fallback; they are never relabelled as successful speech evidence.

The shared demonstration can preview the practice plan but cannot write progress. Local SQLite persists sessions without an account. In cloud mode `practice_sessions`, `practice_step_events` and `curriculum_progress` travel inside the isolated PostgreSQL learner snapshot and are included in export/import.

## Dictionary

| Method | Route |
|---|---|
| `GET` | `/api/v1/dictionary/search?q=...` |
| `GET` | `/api/v1/dictionary/browse?category=...&limit=...` |
| `GET` | `/api/v1/dictionary/lookup?word=...` |
| `GET` | `/api/v1/dictionary/entries/{entry_id}` |
| `GET` | `/api/v1/dictionary/stats` |
| `POST` | `/api/v1/dictionary/{entry_id}/learn` |

Dictionary reference data remains local/rebuildable SQLite data in both runtime modes. Adding an entry to a learner plan is tenant-owned and therefore authenticated.

Dictionary results are decorated with the current learner's saved-item ID, learning status, and due state. Search, lookup and entry GETs are read-only: exploration does not append events, award XP or change mastery. Repeated **Add to learning** requests return the existing active item instead of creating new duplicate vocabulary records.

The 2.8 reviewed starter dictionary contains 240 trilingual A0–A2 concepts. Its schema exposes nullable `level`, `category`, `visual_id`, visual metadata and `reading_hints`. A visual contains a stable key/identifier, a fallback emoji and localized alternative text for `en`, `es`, and `he`; generated category compositions are distinguishable without relying on emoji alone. Curated senses expose the same metadata and provenance, and examples may include `translation_es`. Reading hints are authored linguistic data—when they are absent, the interface shows the complete reviewed niqqud or no niqqud instead of deleting marks mechanically. Imported or unsupported entries may correctly return no visual or reading hints rather than receiving fabricated content.

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

Offline deterministic results require no external service. The 2.8 public learning, daily-practice, dictionary and recommendation paths use the deterministic local engine and do not require these AI routes. Online processing remains an experimental adapter: it requires server configuration, `ALLOW_CLOUD_PROCESSING=true`, an explicit request with cloud consent and—in production cloud mode—a matching identity allowlist. It must remain disabled for the 2.8 public release unless a later privacy/cost review explicitly changes that boundary. Cloud TTS/STT uses the same paid-provider gate.

## Audio

| Method | Route |
|---|---|
| `POST` | `/api/v1/audio/tts` |
| `POST` | `/api/v1/audio/stt` |
| `POST` | `/api/v1/audio/word-analysis` |
| `POST` | `/api/v1/audio/pronunciation-score` |

Uploads are bounded by the request envelope, decoded file size and filename-extension allowlist. MIME and magic-byte validation remain an explicit limitation in 2.4. App-managed audio and transcripts are excluded from structured request logs.

`POST /audio/tts` accepts `voice_style: "masculine" | "feminine"`; clients cannot inject arbitrary provider voice IDs. The 2.8 interface persists masculine/feminine-style browser voice plus slow/normal playback speed on the device and prefers local browser speech. `POST /audio/word-analysis` accepts exactly one Hebrew transcript plus client-reported `browser`, `openai`, or `manual` provenance. The server does not present the client report as independently verified. Its local path is a non-mutating dictionary analysis and is available to the read-only demo. Cloud enrichment remains outside the public 2.8 path. Word analysis never updates XP or mastery.

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
