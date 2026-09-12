# Deploying to a Hugging Face Docker Space

Date: 2026-08-26 | TZ: Asia/Jerusalem

Everything below was measured against the real image before being written down.

## Why this host

The application is one long-lived FastAPI process that serves its own frontend
(`app.mount("/assets", StaticFiles(...))`) and holds a `queue.Queue(maxsize=8)`
connection pool in process memory. That rules out serverless platforms: Vercel
runs functions that start and end per request, so the pool has nowhere to live,
and its Hobby function size ceiling is below this image anyway. `frontend/vercel.json`
remains correct and useful for the day the frontend is split out — not before.

## What Hugging Face requires, and how this image already satisfies it

| Requirement | Status |
|---|---|
| `README.md` with `sdk: docker` front matter | `deploy/huggingface/README.md` |
| App listens on the port named by `app_port` | `app_port: 8000`, matching `APP_PORT` |
| **Container runs as UID 1000** | Already handled: `drop_privileges.py` only calls `setuid` when `geteuid() == 0`, and `docker-entrypoint.sh` skips its `chown` when not root |
| Writable data directory | **The one real adjustment.** `/app/data` is owned by UID 10001 at build time, so under UID 1000 SQLite fails with `unable to open database file`. Point `APP_DATA_DIR` at `/tmp` instead — the app calls `mkdir(parents=True, exist_ok=True)`, so no image change is needed |
| Secrets | Space Settings → Variables and secrets, injected as environment variables at runtime |

Verified on 2026-08-26 by running `ivritsheli:slim` with `--user 1000:1000`:
`Up (healthy)`, `/health/ready` returning `postgresql: true`, the front page
answering 200, and no errors in the log — the four lines matching "error" are
uvicorn's logger *name*, all at INFO.

## Variables the Space needs

Public variables:

    APP_ENV=production
    APP_HOST=0.0.0.0
    APP_PORT=8000
    APP_DATA_DIR=/tmp/ivrit-data
    DICTIONARY_DB_PATH=/tmp/ivrit-data/hebrew_dictionary.db
    SESSION_COOKIE_SECURE=true
    AUTH_REQUIRED=true
    PUBLIC_BASE_URL=https://<user>-<space>.hf.space
    ALLOWED_ORIGINS=https://<user>-<space>.hf.space
    GOOGLE_AUTH_REDIRECT_URI=https://<user>-<space>.hf.space/api/v1/auth/google/callback

Secrets — never in the repository, only in Space Settings:

    DATABASE_URL           the Supabase **session pooler** DSN, not the direct host
    SESSION_SECRET
    GOOGLE_AUTH_CLIENT_ID
    GOOGLE_AUTH_CLIENT_SECRET

`DATABASE_URL` must use the session pooler
(`aws-0-ap-southeast-2.pooler.supabase.com:5432`, user
`ivrit_sheli_runtime.<project-ref>`). The direct host publishes only an AAAA
record, so no container can reach it — see `TASKS.md`.

**Strip the quotes.** `.env` writes values quoted; pasting them with the quotes
into any bulk importer makes the quotes part of the value, and the DSN then
fails a guard with a message that never mentions quoting.

## After the first deploy

1. Add `https://<user>-<space>.hf.space/api/v1/auth/google/callback` to the
   authorised redirect URIs of the Google OAuth client, or sign-in fails while
   the read-only demo keeps working.
2. Rewrite `og:image` and `twitter:image` in `frontend/index.html` to absolute
   URLs against `PUBLIC_BASE_URL` — crawlers do not resolve relative ones.
