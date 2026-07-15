# Architecture

## System shape

```text
React + TypeScript + PWA
          │
          │ JSON / multipart / streamed audio
          ▼
FastAPI application
  ├── learning service
  ├── personalization engine
  ├── recommendation engine
  ├── gamification engine
  ├── dictionary repository
  ├── AI provider router
  ├── audio provider router
  └── connector service
          │
          ├── ivrit_sheli.db
          ├── hebrew_dictionary.db
          ├── local audio files
          └── optional external services
```

## Boundary rules

- API routes validate transport data and call services.
- Services own use-case transactions.
- Repositories own SQL.
- Pure engines contain algorithms and have no database dependency.
- Providers wrap external APIs and never leak provider-specific response shapes upward.
- The frontend does not receive or store provider keys.

## Core transaction

Submitting one review performs one atomic application transaction:

1. Store the attempt.
2. Compute the next review state.
3. Update concept mastery.
4. Add XP.
5. Evaluate achievements.
6. Record an event.
7. Return the updated dashboard delta.

## Failure behavior

| Failure | Behavior |
|---|---|
| AI provider unavailable | Offline provider result with degraded-mode label |
| Dictionary unavailable | Capture prompt and basic token normalization |
| Audio provider unavailable | Browser TTS or text-only practice |
| Connector token expired | Connector disabled with actionable reauthorization status |
| Malformed dictionary line | Warning and continued streaming import |
| Frontend exception | Error boundary and local bug-report action |
| Database write failure | Transaction rollback and request ID |

## Data ownership

Learner data belongs to the local user. External providers receive only the explicitly approved payload. Imported dictionary data retains source licensing and provenance.
