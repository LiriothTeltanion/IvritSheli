# API catalog

Base path: `/api/v1`

## System

- `GET /health`
- `GET /dashboard`
- `POST /bug-reports`

## Profile and learning

- `GET /profile`
- `PUT /profile`
- `GET /items`
- `POST /items`
- `GET /reviews/next`
- `POST /reviews/{item_id}`
- `GET /recommendations`
- `GET /progress`

## Dictionary

- `GET /dictionary/search?q=...`
- `GET /dictionary/lookup?word=...`
- `POST /dictionary/{entry_id}/learn`

## AI

- `POST /ai/analyze`
- `POST /ai/correct`
- `POST /ai/exercises`
- `POST /ai/dialogue`
- `POST /ai/roleplay`
- `POST /ai/weekly-plan`
- `POST /ai/enrich-item`

## Audio

- `POST /audio/tts`
- `POST /audio/stt`
- `POST /audio/pronunciation-score`

## Gamification

- `GET /gamification/status`
- `GET /achievements`

## Connectors

- `GET /connectors`
- `POST /connectors/ics/preview`
- `POST /connectors/google/preview`
- `POST /connectors/import`
