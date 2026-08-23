# 2.12.2 source-contract note — 2026-08-23

This unpublished 2.12.2 candidate inherits the 2.11.0 API surface without
broadening public permissions. Google public sign-in remains **identity-only**
(`openid profile`). The current change is a client-side visual and responsive-
asset checkpoint; the verified public deployment remains 2.4.0.

# API catalog — Ivrit Sheli 2.9.2 private candidate — 2026-07-28

This document describes the unpublished 2.9.2 source contract dated
2026-07-28. It inherits the 2.9.1 Hebrew Alphabet Studio contract dated
2026-07-27. The verified public Railway service remains on 2.4.0 dated
2026-07-21 until every 2.9.2 release gate is approved.

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
  "auth_providers": ["google", "github"],
  "local_companion_url": null
}
```

`auth_providers` lists only the sign-in methods configured by the server, so the frontend does not present a provider that cannot complete. Google users have `login: null`; GitHub users may have a login. The providers are separate identities and are not auto-linked by email. Google sign-in requests only `openid profile`; GitHub requests identity-only `read:user`. Neither callback persists provider bearer tokens or email addresses.

`local_companion_url` is normally `null`. A development server may expose an
exact loopback HTTP origin such as `http://127.0.0.1:8001` so a read-only
Docker demo can link to the writable local SQLite workspace on the same
computer. Configuration rejects paths, credentials, query strings,
non-loopback hosts and every non-empty production value. This field is a local
navigation hint, not an identity provider, cloud session or authorization
bypass.

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
| `GET` | `/api/v1/alphabet?letter_key=...` |
| `POST` | `/api/v1/alphabet/{letter_key}/attempt` |
| `GET` | `/api/v1/practice/today` |
| `POST` | `/api/v1/practice/{session_id}/steps/{step_key}` |
| `GET` | `/api/v1/export` |
| `POST` | `/api/v1/bug-reports` |

In cloud mode every operation resolves the authenticated tenant before accessing learner data. No client-provided user ID selects ownership. Authenticated mutations use a process-local per-user rate limit, and a serialized UTF-8 learner snapshot that would exceed the configured durable ceiling is rejected before persistence.

Generic `POST /items` accepts learner-facing provenance labels such as `manual` and `quick_capture`, but rejects the server-owned `dictionary:`, `connector:`, `system:`, `seed:` and `starter_pack` namespaces. Trusted source identity is assigned only by the dedicated server workflow.

The profile contract persists onboarding state, learner experience, curriculum-track preference, a self-selected pragmatic CEFR-aligned planning band, `text_scale` and `focus_status`. Experience mode (`guided`, `explorer`, or `experienced`) changes interface guidance without silently changing that band; Guided/A0 is the beginner-safe default. `focus_status` is a learner/device preference, not a social-presence feature. The registry returns persisted learner items with transparent `active`, `mastered`, or `needs_review` status; due/upcoming state; review count; learned and latest-activity dates; and modality-specific mastery. Search, filters, and sorting run inside the resolved tenant only.

## Learning Core 2.6 — historical date not re-verified

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/learning-core` | Versioned curriculum, learner state, skill map and delayed-retention checkpoints. |
| `GET` | `/api/v1/learning-core/next` | Next server-derived phase and explainable activity. |
| `POST` | `/api/v1/learning-core/attempt` | Submit bounded learner evidence; the server derives phase, skill, schedule and support transition. |

The attempt payload accepts `item_id`, the current server-issued `activity_token`, a client-generated `idempotency_key`, learner-reported correctness and confidence, response time, hint count and optional answer text. It does not accept a client-selected phase, skill, mastery value, interval or XP award. The activity token is a concurrency checksum, not an authentication credential; normal session and CSRF controls still authorize the write. An exact retry with the same idempotency key returns the stored response with `duplicate: true` and does not advance again. Reusing a key with different content, or submitting a stale activity token under a new key, returns `409 learning_core_conflict` before any evidence is written.

Core correctness, mastery signals and retention checkpoints identify their source as `learner_self_report`; v2.6 does not present them as objective scoring. Exposure, reference-feedback acknowledgement, answer reveals and reflection cannot increase mastery. Retention is reported only inside explicit target windows: 18–54 hours for the `24h` checkpoint, 120–240 hours for `7d`, and 504–1080 hours for `30d`; out-of-window attempts are not relabeled. The shared read-only demonstration may inspect the two GET routes but cannot submit an attempt.

## Curriculum path and persistent daily practice 2.8 — historical date not re-verified

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/curriculum/path` | Return the structured A0–A2 path, honestly labelled B1/B2 Lab and sound-first 22-letter reading track. |
| `GET` | `/api/v1/practice/today` | Return or create the tenant's resumable daily session and its current step. |
| `POST` | `/api/v1/practice/{session_id}/steps/{step_key}` | Record one ordered step outcome using an idempotency key. |

`GET /curriculum/path` reports `complete_course_claim: false`. A0–A2 are structured coverage; B1/B2 are laboratory material unlocked only for suitable Explorer/Experienced profiles. The concept target is 240, while the response separately reports how many personal learning items are currently available.

The daily plan is deterministic and uses only reviewed linguistic data plus stored learner signals: level, experience, goal, SRS urgency, mistakes, confidence, response time, exposure and difficulty. The ordered session is `encounter → 3–5 retrievals → listening → speaking/manual fallback → reflection → summary`: Guided plans three retrievals, Explorer four and Experienced five when enough reviewed/personal concepts exist; an empty Guided account still receives three reviewed starter words. Exercise types cover visual meaning, audio choice, Hebrew-to-meaning, meaning-to-Hebrew word bank, cloze/order and spoken production.

Each step payload supplies an `outcome` of `completed`, `failed` or `unsupported`, a client-generated idempotency key and bounded optional evidence. An exact replay returns the previously stored result without duplicating progress or XP. A conflicting retry or out-of-order step returns `409`, after which the client reloads the authoritative session. Unsupported microphone/browser states remain explicit and can use the manual fallback; they are never relabelled as successful speech evidence.

The shared demonstration can preview the practice plan but cannot write progress. Local SQLite persists sessions without an account. In cloud mode `practice_sessions`, `practice_step_events` and `curriculum_progress` travel inside the isolated PostgreSQL learner snapshot and are included in export/import.

## Hebrew Alphabet Studio 2.9.1 — 2026-07-27

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/alphabet?letter_key={stable_key}` | Return the reviewed trilingual catalog, learner progress, recommendation and current recognition activity. `letter_key` optionally selects one stable catalog unit. |
| `POST` | `/api/v1/alphabet/{letter_key}/attempt` | Submit one bounded recognition answer for the current server-derived activity. |

The GET response's `facts` object states `base_letters: 22`, `final_forms: 5`
and `total_forms: 27`. `total_forms` counts written-form units; it does not
claim that Hebrew has 27 letters. The 27 catalog units include 22 base letters
and the word-final forms ך, ם, ן, ף and ץ. Each reviewed unit exposes localized
names/explanations, pointed playback text, contextual sound values, one
reviewed example, base/final relationship, visual/sound confusions and source
metadata. Profile/mode context, aggregate progress, recommended letter and
next activity are learner-scoped.

The optional `letter_key` must be a catalog key. An unknown key returns a
bounded validation/not-found error rather than fabricating a letter. The
existing `GET /curriculum/path` compatibility view keeps
`reading_track.entries` at exactly 22 base entries; new counts, units and
progress are additive.

The attempt payload is:

```json
{
  "activity_token": "64-character concurrency checksum",
  "idempotency_key": "client-generated stable retry key",
  "answer_key": "selected option key",
  "confidence": 4,
  "response_ms": 2100,
  "hints_used": 0
}
```

`confidence`, `response_ms` and `hints_used` are optional bounded evidence.
The client does not submit `is_correct`, mastery, stage, interval or XP.
The server reconstructs the current activity from the reviewed catalog,
validates the SHA-256 activity token and derives correctness from
`answer_key`. The token is a concurrency checksum, not a credential; normal
session, tenant and CSRF controls still authorize the request.

An exact retry with the same idempotency key returns the stored outcome without
duplicating an attempt or progress. Reusing the key with different content or
submitting a stale token returns a conflict and the client reloads the
authoritative activity. Local mode persists `alphabet_progress` and
`alphabet_attempts` in SQLite. Cloud mode includes both tables in the locked,
isolated PostgreSQL learner snapshot. Portable export/import includes both
tables.

The shared demo GET sets `progress.persistence: "read_only_preview"` and
`progress.can_save: false`. Existing read-only middleware rejects the POST with
`403`; clients must not claim that a demo answer was saved.

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

The backward-compatible 2.8 starter-dictionary payload contains 240 trilingual A0–A2 concepts. Its schema exposes nullable `level`, `category`, `visual_id`, visual metadata and `reading_hints`. A visual contains a stable key/identifier, a fallback emoji and localized alternative text for `en`, `es`, and `he`. The 2.8 source originally shipped 72 exact scenes and 168 fallbacks; the current 2.12 frontend now resolves all 240 reviewed keys to exact semantic SVG scenes with progressive `context`, `meaning` and `anchor` layers without changing that payload contract. `GET /dashboard` includes an optional backward-compatible `visual_spotlight` of up to six exact scenes; ranked learner recommendations are used first and deterministic exact-scene rotations only fill remaining positions. Curated senses expose the same metadata and provenance, and examples may include `translation_es`. Reading hints are authored linguistic data—when they are absent, the interface shows the complete reviewed niqqud or no niqqud instead of deleting marks mechanically. Imported or unsupported entries may correctly return no visual or reading hints rather than receiving fabricated content.

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

Offline deterministic learning, daily-practice, dictionary, transcript-analysis
and recommendation paths require no external AI service. Self-hosted Faster
Whisper is a separate 2.9.0 speech path dated 2026-07-27 and does not require
an OpenAI key.
Online OpenAI processing remains an experimental adapter: it requires server
configuration, `ALLOW_CLOUD_PROCESSING=true`, an explicit request with cloud
consent and—in production cloud mode—a matching identity allowlist. It remains
disabled for the private 2.9.1 candidate dated 2026-07-27 unless a later
privacy/cost review explicitly changes that boundary. OpenAI TTS/STT uses the
same paid-provider gate; self-hosted STT does not.

## Audio

| Method | Route |
|---|---|
| `GET` | `/api/v1/audio/capabilities` |
| `POST` | `/api/v1/audio/tts` |
| `POST` | `/api/v1/audio/stt` |
| `POST` | `/api/v1/audio/transcript-analysis` |
| `POST` | `/api/v1/audio/word-analysis` |
| `POST` | `/api/v1/audio/pronunciation-score` |

`GET /audio/capabilities` reports secure-context requirements, the configured
HTTPS public origin, self-hosted model state, 20-second/8-MB/45-second limits,
available fallbacks and device-only retention. The browser's
`window.isSecureContext` remains authoritative for actual capture.

`POST /audio/stt` accepts `mode=self_hosted|openai`; the legacy
`cloud_requested` field remains accepted for older clients. The self-hosted
path validates the real media container, forces Hebrew, enables VAD and
serializes one Faster Whisper CPU INT8 inference. Responses include transcript,
normalized text, provider, model, duration, latency, warnings and server-file
deletion confirmation. Errors distinguish busy, unavailable, timeout,
no-speech and invalid input. Uploads use a 9-MB envelope, 8-MB file and
20-second duration ceiling.

`POST /audio/transcript-analysis` accepts up to 4,000 characters, extracts at
most twelve unique Hebrew tokens and returns exact local dictionary matches
plus explicit unknown tokens. It performs no AI inference. A one-token result
is compatible with the detailed word analysis. `POST /audio/word-analysis`
accepts client-reported `browser`, `self_hosted`, `openai`, or `manual`
provenance; that report is never presented as independently verified.

`POST /audio/tts` accepts `voice_style: "masculine" | "feminine"`; clients cannot inject arbitrary provider voice IDs. The interface persists masculine/feminine-style browser voice plus slow/normal playback speed on the device and prefers local browser speech. Word/transcript analysis never updates XP or mastery.

The historical `pronunciation-score` route name remains for v2.6 compatibility. Its response declares `assessment_type: "transcript_recognition_match"`; the value compares the expected text with a recognized transcript and is not a phoneme, accent, intelligibility, native-likeness or clinical assessment.

## Coach, feedback and optional reminders

| Method | Route |
|---|---|
| `POST` | `/api/v1/coach/examples` |
| `POST` | `/api/v1/learning/feedback` |
| `GET` | `/api/v1/personalization/profile` |
| `POST` | `/api/v1/personalization/reset` |
| `GET` | `/api/v1/notifications/push/capabilities` |
| `GET` | `/api/v1/notifications/preferences` |
| `PUT` | `/api/v1/notifications/preferences` |
| `POST` | `/api/v1/notifications/push/subscription` |
| `DELETE` | `/api/v1/notifications/push/subscription` |

Coach examples come only from a reviewed dictionary source or reviewed local
pattern and include level, register, context, translations and provenance.
Feedback is idempotent, bounded and included with adaptive state in learner
exports. Personalization reset preserves vocabulary, sessions and progress.

Push is authenticated, CSRF-protected and opt-in. Subscription documents are
encrypted separately and excluded from learner exports/snapshots. The worker
enforces local timezone, rest day, quiet hours and one delivery per learner per
local date even when several devices are subscribed.

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
