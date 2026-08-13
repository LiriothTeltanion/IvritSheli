# Deployment — Ivrit Sheli 2.9.1 private candidate / 2.4.0 production

This guide covers the private SQLite installation, the reproducible PostgreSQL
Docker stack, a separate 2.9.1 HTTPS staging design and the frozen public
Railway deployment. Production values belong in a secrets manager or hosting
dashboard, never in Git. Version 2.9.1 dated 2026-07-27 is not published: the
verified live service, tag, GitHub Release and Devpost entry remain at 2.4.0
dated 2026-07-21 until every 2.9.1 release gate is approved.

## 1. Choose the runtime

| Goal | Command | Persistence | Authentication |
|---|---|---|---|
| Private Windows app | `./scripts/start.ps1` | Local SQLite | Not required |
| Development | `./scripts/run-dev.ps1` or `./scripts/run-dev.sh` | Local SQLite | Optional |
| Production-shaped local stack | `docker compose up --build` | PostgreSQL 17 + dictionary volume | Required; demo works without OAuth keys |
| Private 2.9.1 staging web dated 2026-07-27 | `railway-staging.toml` | Isolated PostgreSQL + model volume | Google/GitHub test clients |
| Private reminder cron | `railway-reminders.toml` | Push tables only through dedicated role | No browser identity; no public domain |
| Public release | Railway Dockerfile deployment | Managed PostgreSQL | Google and/or GitHub OAuth + read-only demo |

## 2. Run the PostgreSQL Docker stack

Requirements: Docker Desktop or Docker Engine with Compose v2.

```bash
docker compose config --quiet
docker compose up --build --wait
curl http://127.0.0.1:8000/health/live
curl http://127.0.0.1:8000/health/ready
curl http://127.0.0.1:8000/version
```

Open `http://127.0.0.1:8000` and choose the demo session. The Compose password and session secret are explicitly local-development values. They must never be copied to a public deployment.

Compose sets `APP_ENV=development` deliberately because it uses loopback HTTP and a non-Secure cookie. It still exercises PostgreSQL, authentication, migrations, RLS, JSON logging and the production image. `APP_ENV=production` fails closed unless the public URL is HTTPS and cookies are Secure.

The services are:

- `volume-init`: one-shot ownership repair so volumes created by the root-running 1.x image remain writable by the 2.0 non-root UID.
- `postgres`: PostgreSQL 17 with a persistent named volume and readiness probe.
- `migrate`: one-shot Alembic upgrade and restricted-login provisioner that must finish successfully.
- `app`: non-root production image serving FastAPI and the compiled React PWA.

Useful operations:

```bash
docker compose ps
docker compose logs --no-log-prefix app
docker compose exec -T postgres psql \
  --username ivrit \
  --dbname ivrit_sheli \
  --no-psqlrc \
  --tuples-only \
  --no-align \
  --command "SELECT version_num FROM alembic_version;"
docker compose down
```

The revision query runs inside the local PostgreSQL container and should print
`20260727_0005`. Do not override the application entrypoint to run arbitrary
Alembic commands: the entrypoint deliberately removes `MIGRATION_DATABASE_URL`
from every command except the audited provisioner.

`docker compose down` preserves volumes. Adding `--volumes` destroys the local PostgreSQL and dictionary volumes; use it only when a disposable reset is intentional.

The ownership initializer is intentionally idempotent. It changes only the mounted Ivrit data volume to UID/GID `10001`; it does not touch source files or the PostgreSQL volume.

## 3. Production environment contract

### Required

| Variable | Production value |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | Restricted URL whose username is exactly `ivrit_sheli_runtime` |
| `MIGRATION_DATABASE_URL` | Administrator URL used only by the pre-deploy provisioner |
| `PUSH_DATABASE_URL` | Dedicated `ivrit_sheli_push_worker` URL; configure only on the reminder service and migration provisioner, never on the web runtime |
| `AUTH_REQUIRED` | `true` |
| `DEBUG` | `false`; production startup rejects debug responses |
| `SESSION_SECRET` | At least 32 cryptographically random characters |
| `SESSION_COOKIE_SECURE` | `true` |
| `PUBLIC_BASE_URL` | Exact public `https://` origin, without a trailing slash |
| `ALLOWED_ORIGINS` | Exact public origin; comma-separated only when additional trusted origins are deliberate |
| `TRUSTED_PROXY_MODE` | `railway` on Railway; this mode is production-only and requires Railway's injected `RAILWAY_ENVIRONMENT_ID` |

### Sign-in provider requirement

Production requires at least one complete OAuth provider. For the intended 2.4 learner experience, configure Google as the primary option and keep GitHub as the secondary option:

| Variable | Exact production value |
|---|---|
| `GOOGLE_AUTH_CLIENT_ID` | Google OAuth Web client ID |
| `GOOGLE_AUTH_CLIENT_SECRET` | Matching secret, stored only in the hosting secret field |
| `GOOGLE_AUTH_REDIRECT_URI` | `<PUBLIC_BASE_URL>/api/v1/auth/google/callback` |
| `GITHUB_CLIENT_ID` | GitHub OAuth application client ID |
| `GITHUB_CLIENT_SECRET` | Matching secret, stored only in the hosting secret field |
| `GITHUB_REDIRECT_URI` | `<PUBLIC_BASE_URL>/api/v1/auth/github/callback` |

Each provider is optional as a set, but partial credentials fail startup. When a provider is absent, `/api/v1/auth/me` omits it from `auth_providers` and the frontend does not show its button. The `GOOGLE_AUTH_*` variables are separate from the `GOOGLE_*` Workspace connector credentials.

### Recommended

| Variable | Recommended value |
|---|---|
| `LOG_LEVEL` | `INFO` |
| `SESSION_TTL_SECONDS` | `604800` (seven days) |
| `SESSION_RETENTION_SECONDS` | `604800`; expired/revoked session rows are then deleted opportunistically |
| `DEMO_SESSION_LIMIT` | `64`; caps only the shared read-only demo, not authenticated learners |
| `USER_SESSION_LIMIT` | `8`; a new sign-in removes the oldest live session beyond this per-user ceiling |
| `OAUTH_STATE_LIMIT` | `1024`; global PostgreSQL cap on live, unconsumed OAuth attempts across replicas |
| `AUTH_CLIENT_RATE_LIMIT_REQUESTS` | `20`; per public auth endpoint, resolved client and application process |
| `AUTH_GLOBAL_RATE_LIMIT_REQUESTS` | `1000`; higher per-endpoint circuit breaker for the application process |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | `60` |
| `AUTH_RATE_LIMIT_MAX_CLIENT_KEYS` | `10000`; novel-key overflow shares a bounded fallback bucket rather than growing memory without limit |
| `AUTHENTICATED_WRITE_RATE_LIMIT_REQUESTS` | `120`; per authenticated user and application process |
| `AUTHENTICATED_WRITE_RATE_LIMIT_WINDOW_SECONDS` | `60` |
| `AUTHENTICATED_WRITE_RATE_LIMIT_MAX_USERS` | `10000`; bounds in-memory authenticated-write limiter cardinality |
| `MAX_CLOUD_SNAPSHOT_BYTES` | `4194304` (4 MiB serialized UTF-8 learner snapshot, checked before persistence) |
| `MAX_REQUEST_BODY_BYTES` | `1048576` (1 MiB default) |
| `MAX_ICS_UPLOAD_BODY_BYTES` | `6291456` (6 MiB multipart envelope; file remains limited to 5 MiB) |
| `MAX_AUDIO_UPLOAD_BODY_BYTES` | `9437184` (9 MiB multipart envelope; decoded speech file remains limited to 8 MiB and 20 seconds) |
| `SESSION_COOKIE_NAME` | `ivrit_session` |
| `BUILD_COMMIT` | Immutable Git commit SHA |
| `AI_PROVIDER` | `offline` for the public demo |
| `ALLOW_CLOUD_PROCESSING` | `false` unless an explicit, reviewed cloud-AI policy is enabled |
| `APP_DATA_DIR` | `/app/data` |
| `DICTIONARY_DB_PATH` | `/app/data/hebrew_dictionary.db` |

### 2.9.1 speech and reminder staging variables — 2026-07-27

Web staging:

| Variable | Staging value |
|---|---|
| `SELF_HOSTED_SPEECH_ENABLED` | `true` |
| `WHISPER_PRELOAD_ON_START` | `true`; startup fails before readiness if the model cannot load |
| `WHISPER_MODEL` | `small` |
| `WHISPER_MODEL_CACHE_DIR` | `/app/data/models/faster-whisper` on a persistent volume; allocate at least 2 GB for staging headroom |
| `WHISPER_DEVICE` | `cpu` |
| `WHISPER_COMPUTE_TYPE` | `int8` |
| `WHISPER_LANGUAGE` | `he` |
| `WHISPER_TIMEOUT_SECONDS` | `45` |
| `WHISPER_MAX_DURATION_SECONDS` | `20` |
| `PUSH_NOTIFICATIONS_ENABLED` | `true` only after HTTPS, VAPID and the pilot consent UI are configured |
| `VAPID_PUBLIC_KEY` | Public VAPID application-server key |
| `PUSH_ENCRYPTION_KEY` | Independent random secret; web needs it only to encrypt/manage the current learner's subscription |

Reminder cron only:

| Variable | Cron value |
|---|---|
| `PUSH_DATABASE_URL` | Direct URL for exactly `ivrit_sheli_push_worker` |
| `PUSH_ENCRYPTION_KEY` | Same sealed encryption secret as staging web |
| `VAPID_PRIVATE_KEY` | Sealed private VAPID signing key |
| `VAPID_SUBJECT` | Operator `mailto:` or HTTPS contact URI |

Do not give `DATABASE_URL` or `MIGRATION_DATABASE_URL` to the cron. Do not give
`PUSH_DATABASE_URL` or the VAPID private key to the web service.

### Provider allowlists

Paid production cloud calls are identity-gated independently of account sign-in. The current cloud-AI and Google Workspace connector allowlists are deliberately GitHub-identity based:

- Cloud AI: `CLOUD_AI_ALLOWED_GITHUB_LOGINS`, `CLOUD_AI_ALLOWED_GITHUB_IDS`, and/or opaque `CLOUD_AI_ALLOWED_GOOGLE_SUBJECTS`.
- Google read-only previews: `GOOGLE_CONNECTORS_ALLOWED_GITHUB_LOGINS`, `GOOGLE_CONNECTORS_ALLOWED_GITHUB_IDS`, and/or opaque `GOOGLE_CONNECTORS_ALLOWED_GOOGLE_SUBJECTS`.

Google subject allowlists use the provider's immutable `sub` identifier. They do not use email addresses or display names, and they do not grant Gmail, Drive, or Calendar scopes by themselves.

Values are comma-separated. GitHub logins are matched case-insensitively; numeric provider IDs are matched exactly and remain stable if a login is renamed. Configure only identities you have verified—do not guess IDs. `ALLOW_CLOUD_PROCESSING=true` without a cloud-AI allowlist fails application startup in production. Supplying any Google Workspace connector credential without its connector allowlist also fails startup. A Google-sign-in identity is not silently treated as an allowlisted GitHub identity, so paid cloud operations fail closed while local/offline learning continues.

Production also fails startup when authentication is disabled, debug mode is enabled, an allowed origin is a wildcard/non-HTTPS URL/path rather than an exact origin, no OAuth provider is complete, or a configured provider callback differs from its one exact callback under `PUBLIC_BASE_URL`.

The built-in authentication limiter combines a per-client bucket with a much higher per-endpoint circuit breaker. Both are process-local, so multiple replicas multiply those allowances. `direct` mode keys the raw ASGI peer and is suitable only when that peer is the real client; `railway` mode reads exactly one syntactically valid `X-Real-IP` under the deployment assumption that Railway ingress overwrites it and the service has no direct public bypass. Missing, duplicate or malformed values share one unresolved bucket. `X-Forwarded-For` is never consulted, and Uvicorn starts with `--no-proxy-headers` so it cannot rewrite the raw peer first. The independent `OAUTH_STATE_LIMIT` decision is serialized in PostgreSQL with a transaction advisory lock and remains global across replicas.

Authenticated mutations also have a process-local per-user limiter. PostgreSQL persistence independently enforces the live OAuth-state cap, the per-user session ceiling, and the serialized UTF-8 learner-snapshot ceiling. These controls make one request and one account bounded; they do not replace hosting-edge abuse controls, monitoring or cost limits.

Generate a session secret locally and paste only its result into the hosting secret field:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Do not print deployed secrets in CI or support logs.

## 4. Railway deployment and private 2.9.1 staging — 2026-07-27

The repository includes the frozen production-oriented `railway.toml` plus
`railway-staging.toml` and `railway-reminders.toml`. Select each custom file in
the matching Railway service settings. Never point the existing public 2.4.0
service dated 2026-07-21 at a private-candidate config.

The migration URL and runtime URL must use different PostgreSQL users on the same host, port and database. The provisioner requires the migration login to be a superuser or have `CREATEROLE`; it checks this instead of assuming a hosting provider grants it. It creates or repairs the direct `ivrit_sheli_runtime` login as `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`, removes every role membership so `SET ROLE` cannot become an escalation path, grants only the required schema/table operations, revokes public schema creation, and verifies a fresh restricted connection. Readiness fails when the app uses an administrator URL, a privilege flag or role membership is unsafe, or the database is not at the packaged Alembic head.

Railway pre-deploy commands run in a separate container but receive the same service variables as the web container. The committed start command therefore pins the audited entrypoint, which removes `MIGRATION_DATABASE_URL` before executing Uvicorn or any non-migration command. A custom dashboard start command must not bypass that wrapper.

### Public project setup — unchanged 2.4.0 boundary — 2026-07-21

1. Create a Railway project from the GitHub repository.
2. Add a PostgreSQL service in the same project.
3. Set `MIGRATION_DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
4. Generate a separate URL-safe runtime password and configure `DATABASE_URL` as `postgresql://ivrit_sheli_runtime:<password>@${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}`.
5. Seal both database URL variables. Keep the runtime password stable across ordinary deploys.
6. Add the remaining required and recommended variables from the tables above, including `TRUSTED_PROXY_MODE=railway`. Do not set or override `RAILWAY_ENVIRONMENT_ID`; Railway injects it.
7. Generate a public domain for the application service.
8. Set `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` and every configured provider redirect URI to the final domain.
9. Keep Google sign-in scopes limited to `openid profile`; do not add Gmail, Drive or Calendar scopes to the login client.
10. Deploy and require `/health/ready` to return `200` before routing traffic.

Railway automatically detects the root Dockerfile. The committed configuration uses:

```toml
[deploy]
preDeployCommand = ["python -m ivrit_sheli.db_admin migrate"]
startCommand = "/app/scripts/docker-entrypoint.sh serve"
healthcheckPath = "/health/ready"
```

The service must bind to `0.0.0.0` and Railway's injected `PORT`; the container entrypoint handles both. PostgreSQL passwords placed inside a URI must be percent-encoded when they contain reserved URI characters. `python -c "import secrets; print(secrets.token_urlsafe(36))"` produces a URL-safe runtime value.

Changing the runtime password while an old deployment overlaps a new one invalidates new connections from the old container. For a planned rotation, disable overlap for that deployment or use a staged second login; ordinary releases reuse the same runtime password.

### Separate 2.9.1 staging setup — 2026-07-27

1. Create a distinct Railway staging environment/project and a new PostgreSQL
   database. Do not reuse production learner rows.
2. Create a staging web service from the private branch and set its config path
   to `/railway-staging.toml`.
3. Mount a persistent volume of at least 2 GB at `/app/data`; the verified
   `small` model cache alone uses 486,213,474 bytes (463.7 MiB). The pre-deploy
   container cannot populate it because Railway does not mount volumes or
   preserve filesystem changes during pre-deploy.
4. Configure the required production-safe web variables, staging Google OAuth
   client, `SELF_HOSTED_SPEECH_ENABLED=true` and
   `WHISPER_PRELOAD_ON_START=true`.
5. Configure a distinct staging domain and exact callbacks. Google remains
   `openid profile`; do not add Gmail, Drive or Calendar scopes.
6. Run the migration provisioner with administrator, runtime and Push-worker
   URLs so it creates and verifies both restricted roles.
7. Create a second private service from the same branch, set config path to
   `/railway-reminders.toml`, give it no public domain, and provide only the
   cron variables listed above.
8. Require `/health/ready`, `/version` and
   `/api/v1/audio/capabilities` (`self_hosted_status=ready`) before the pilot.

Railway cron schedules use UTC, have a five-minute minimum and skip a run while
the prior one remains active. `python -m ivrit_sheli.push_notifications`
performs one bounded pass, closes its connection and exits.

### Google OAuth Web client

Configure Google Auth Platform only after the final public domain exists:

- Application type: Web application.
- Authorized JavaScript origin: the exact `PUBLIC_BASE_URL`.
- Authorized redirect URI: `<PUBLIC_BASE_URL>/api/v1/auth/google/callback`.
- Requested sign-in scope: `openid profile` only.
- Application homepage: the public origin.
- Privacy policy: the public repository URL for `PRIVACY.md`.
- Terms of service: the public repository URL for `TERMS.md`.
- Client secret: store only in Railway's sealed variable field.

Do not reuse Google Workspace connector credentials for sign-in and do not add Gmail, Drive or Calendar scopes to this client. After configuration, verify successful and cancelled login, invalid/replayed/provider-swapped state, refresh persistence, logout and expired-session behavior. The source tests do not prove that the production client, consent screen or secret is correct.

Official references: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [OIDC endpoint reference](https://developers.google.com/identity/openid-connect/reference), and [OAuth 2.0 for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server).

### GitHub OAuth application

Create the OAuth application only after the final public domain exists:

- Homepage URL: the exact `PUBLIC_BASE_URL`.
- Authorization callback URL: the exact `GITHUB_REDIRECT_URI`.
- Client secret: store only in Railway's sealed variable field.
- Permissions: standard identity login only; the app does not request repository access.

After configuration, verify successful login, cancelled login, invalid/replayed state, logout and expired-session behavior.

For the 2.1 production check, the OAuth start flow reached GitHub's identity-only consent screen and the cancelled-login callback was verified. GitHub's anti-fraud protection disabled approval in the embedded test browser, so the final code exchange, authenticated session and logout must still be completed in a normal browser before OAuth is called fully verified.

The current 2.4.0 deployment verifies the separate Google identity-only path: live authorization succeeded, onboarding state and the authenticated session persisted across reload, and logout returned to the English landing page and remained signed out after another reload. This does not verify re-login after logout or a successful live GitHub authorization-code exchange. Google sign-in remains limited to `openid profile` and grants no Gmail, Drive or Calendar scope.

### Cost and data-retention guardrails

Railway's Free/Trial resources and retention can change. Before making the site a long-term public dependency:

- Review the current plan and estimated usage.
- Configure a hard usage limit where available.
- Keep the offline SQLite path fully usable.
- Export or back up PostgreSQL before any trial/plan expiry.
- Never enter a payment method or upgrade a plan as part of an automated deployment.

Official references: [Dockerfiles](https://docs.railway.com/builds/dockerfiles), [PostgreSQL](https://docs.railway.com/databases/postgresql), [variables](https://docs.railway.com/variables), [config as code](https://docs.railway.com/config-as-code), and [health checks](https://docs.railway.com/deployments/healthchecks).

## 5. Migration discipline

```bash
python -m ivrit_sheli.db_admin migrate
python -m alembic -c backend/alembic.ini current  # requires MIGRATION_DATABASE_URL
python -m alembic -c backend/alembic.ini history
```

Rules:

- Commit every schema change as an Alembic revision.
- Test upgrades against disposable PostgreSQL in CI.
- Run migrations once as a pre-deploy step, not independently in every replica.
- Prefer forward-compatible migrations. Document any irreversible operation.
- Do not report readiness until PostgreSQL is reachable, the exact packaged revision is active and the direct runtime identity passes every privilege check.

### 2.9.1 learner-snapshot compatibility boundary — 2026-07-27

Version 2.9.1 includes the v2.8 Learning Core/daily-practice fields (historical
date not re-verified in this slice), the 2.9.0 coach/reminder fields dated
2026-07-27 and the new `alphabet_progress` and
`alphabet_attempts` tables inside each tenant's serialized learning snapshot.
The 2.9.0 baseline adds
`learning_feedback`, `learner_model_state` and notification preferences inside
each tenant's serialized learning snapshot. Push subscriptions remain separate
PostgreSQL credentials and are never serialized. A 2.4.0 writer dated
2026-07-21 knows none of these additions and can silently remove newer learner
fields while preserving older account data.

Therefore the private 2.9.1 build must not point at the production learner-state database while 2.4.0 remains live. A future public rollout requires all of the following:

1. Create a PostgreSQL backup and prove it can restore before the first 2.9.1 learner write.
2. Deploy 2.9.1 as one controlled writer transition; do not run mixed 2.4.0 and 2.9.1 application replicas against the same learner-state rows.
3. Verify two real Google accounts through sign-in, one complete daily session, refresh, device change, logout/re-login and export; prove that neither account can access the other's state.
4. Verify a disposable account's deletion without deleting the owner's account.
5. After any 2.9.1 write, do not roll the application back to the 2.4.0 writer unless the pre-upgrade database backup is restored or a forward-preserving compatibility patch is deployed first.
6. Keep the private candidate on isolated/local state until that operational procedure and the mother-pilot acceptance retest are explicitly approved.

## 6. Release verification

Run locally before tagging:

```bash
ruff check backend/src backend/tests scripts/
mypy --config-file backend/pyproject.toml backend/src
pytest backend/tests -q
cd frontend && npm run typecheck && npm run test:run && npm run test:e2e && npm run build && cd ..
python -m pip_audit -r backend/requirements.txt
cd frontend && npm audit --omit=dev && cd ..
python -m ivrit_sheli --doctor
python scripts/generate_checksums.py   # regenerate SHA256SUMS.txt after the final content change
python scripts/verify_package.py       # fails on any checksum, version or required-file drift
docker compose config --quiet
docker compose build
docker compose up --wait
```

Run the PostgreSQL gate in its own shell, not by exporting the database
environment over the ordinary run. `DATABASE_URL` selects shared-cloud mode, so
a globally exported DSN makes three unrelated local-first tests fail for the
wrong reason. Split them:

```bash
pytest backend/tests -q -m "not postgres"   # ordinary run, no database env
pytest backend/tests -q -m postgres         # separate shell, database env set
```

Evidence for the current private candidate, **2.11.0**, lives in
`TEST_REPORT.md`; this section has not been rewritten for it, and its rollout
preconditions above are still phrased against 2.9.1.

The following results belong to the inherited 2.9.0 baseline dated 2026-07-27
and must not be relabelled as proof of 2.9.1, 2.10.0 or 2.11.0:

- Backend: 291 passed, 1 credential-gated PostgreSQL skip.
- Frontend: 337 passed across 37 files.
- Playwright/axe: 26 passed, 28 scoped matrix skips, 0 failed.
- Ruff, strict MyPy, TypeScript, compileall, offline doctor, Vite build and
  Compose configuration: passed.
- pip-audit and the npm production audit: 0 known vulnerabilities.

Faster Whisper `small` preloaded in 50.508 seconds; the 7-file cache totals
486,213,474 bytes (463.7 MiB). A real CTranslate2 inference on one second of
silence reached the expected no-speech response and confirmed temporary-file
deletion. The disposable PostgreSQL 17 gate passed all three cases, including
the credential-gated RLS/least-privilege case and safe endpoint transfer
migration `20260727_0005`. The non-root production image migrated an existing
volume and passed live, ready and version checks; the zero-due reminder worker
and structured-log privacy validator also passed. The source package verifier
and 321 canonical Git-index checksums pass. Hebrew recognition accuracy,
isolated HTTPS staging, two-real-account Google isolation and the
Kevin-and-mother speech pilot remain pending. None of the local results changes
public 2.4.0 dated 2026-07-21.

Build the ZIP and its external checksum directly from canonical Git blobs:

```bash
python scripts/build_release_archive.py \
  --ref HEAD \
  --output IvritSheli-v2.9.1.zip \
  --prefix IvritSheli-v2.9.1 \
  --checksum-output IvritSheli-v2.9.1.zip.sha256
```

Before deploying, create the PostgreSQL backup described below and complete a
restore drill against a separate database. Package the candidate only from the
final committed tree and verify the extracted archive. During the private
pilot, do not merge, push, tag `v2.9.1`, create a GitHub Release, alter Devpost
or replace public Railway. Those actions require a separate final review and
Kevin's explicit approval.

Verify against the public URL:

1. `/health/live` is `200` without database details.
2. `/health/ready` is `200` and confirms the expected mode.
3. `/version` shows the exact release being deployed and the deployed commit.
4. Demo login works and is read-only.
5. Google login works when configured; GitHub remains a working secondary path when configured; logout revokes each session.
6. Two distinct users cannot read or modify each other's data.
7. Refreshing the page preserves the authenticated user's PostgreSQL state.
8. Responses include `X-Request-ID`.
9. Application logs are JSON and contain no cookie, token, OAuth code or request body.
10. A Google-sign-in user and a non-allowlisted GitHub user cannot invoke paid cloud AI, cloud audio or Google Workspace previews.
11. A new learner can learn the pre-account three words, enter Guided/A0, complete one daily session, save a word, refresh, sign out/in and recover the same state.
12. Export downloads the authenticated learner state; account deletion remains verified with a disposable identity or the real PostgreSQL boundary test, not by deleting the owner's account.
13. Desktop, 390 px mobile, Hebrew RTL, reduced-motion, keyboard-only and 200% zoom modes remain usable.
14. Prove cached shell/dictionary/region browsing offline while confirming that cloud writes pause and request reconnection; private API responses must not appear in the service-worker cache.
15. Verify the 22-base-letter/5-final-form catalog, all three Alphabet Studio experiences, stale-token/idempotent attempts, demo read-only state, export/import, old-snapshot hydration and two-account alphabet isolation.
16. For a 2.9.1 rollout, prove the learner-snapshot writer transition, Push-role boundary and rollback/restore boundary above; a green 2.4.0 readiness check is not sufficient evidence.
17. Complete the mother-pilot acceptance retest from a WhatsApp link: find the primary action within 30 seconds, learn three words and finish a session without assistance. Record comprehension problems before approval.
18. Test microphone granted/denied, insecure HTTP, silence, invalid format, cancellation, timeout, Android, iPhone/PWA and manual fallback.
19. Run the planned 20-word/10-phrase pilot; record exact normalized coverage and median latency without inventing results.
20. Enable reminders explicitly on at least two devices and prove at most one private message per learner/local day, including quiet hours, rest day and an expired subscription.

### Current production verification record — 2.4.0 — 2026-07-21

- URL: https://ivritsheli-production.up.railway.app
- Runtime identity: release `2.4.0`, environment `production`, storage `postgresql`.
- Release implementation commit: `03bf84b9268ff8be528c0fab3c670f9652ee23b0`; Railway deployment completed successfully on 2026-07-21. Later evidence and documentation deployments preserve version `2.4.0`.
- Readiness: PostgreSQL and all 48 reviewed dictionary entries passed.
- Judge path: the `?lang=en` entry and four-stop read-only guided tour passed live browser checks.
- Google OAuth: identity-only sign-in succeeded; onboarding state and the authenticated session persisted across reload; logout returned to the English auth landing page and a subsequent reload remained signed out.
- Publication state: Git tag and GitHub Release `v2.4.0` are published.
- Remaining boundary: re-login after logout, live GitHub authorization, live OpenAI or Google Workspace connector calls, two-real-user production isolation and backup restoration are unverified. Identity-only Google sign-in grants no Gmail, Drive or Calendar scope.
- Visual boundary: the English entry and guided tour are verified live, while refreshed desktop/mobile/RTL/reduced-motion README captures remain pending.

### Historical production verification record — 2.2.0 — 2026-07-21

- Runtime identity: release `2.2.0`, environment `production`, storage `postgresql`.
- Production commit: `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1` from merged pull request #14.
- `/health/live`: HTTPS `200` with version `2.2.0` and the same immutable commit.
- `/health/ready`: HTTPS `200`; the 12-entry/12-sense shared-cloud dictionary and PostgreSQL readiness passed.
- Publication state: Git tag and GitHub Release `v2.2.0` were published for this historical source version and remained latest until `v2.4.0` was published.
- OAuth: GitHub consent handoff and cancellation had verified evidence; final live code exchange, authenticated refresh persistence and logout remained pending for that deployment.

### Historical production verification record — 2.1.1 — 2026-07-16

- Runtime identity: release `2.1.1`, environment `production`, storage `postgresql`.
- `/health/live` and `/health/ready`: HTTPS `200`; the 12-entry/12-sense seed dictionary and PostgreSQL readiness passed.
- GitHub pull request #11 and Railway deployment completed successfully from merge commit `95d02554d754928483ffc42d42a372b86c6fcb1b`.
- Browser smoke: desktop, Hebrew RTL and 390 px mobile layouts loaded without console errors; the seeded demo remained read-only.
- OAuth: GitHub consent handoff was present; final code exchange/session/logout remained pending in a normal browser.

### Historical production verification record — 2.1.0 — 2026-07-16

- URL: https://ivritsheli-production.up.railway.app
- Runtime identity: release `2.1.0`, environment `production`, storage `postgresql`.
- `/health/live` and `/health/ready`: HTTPS `200`; dictionary and PostgreSQL readiness passed.
- Pre-deploy: Alembic migrated successfully and the restricted `ivrit_sheli_runtime` role passed provisioning checks.
- Browser smoke: the authentication gateway and seeded read-only demo loaded successfully.
- OAuth: GitHub consent handoff and safe cancellation passed; final code exchange/session/logout remain pending in a normal browser.
- Logs: structured startup and health-request fields were present without visible credentials or request bodies.

## 7. Backups and restore drills

Use the provider's managed backup capability when available. A portable logical backup can be produced with PostgreSQL tooling:

```bash
pg_dump --format=custom --no-owner --file=ivrit-sheli.dump "$MIGRATION_DATABASE_URL"
createdb ivrit_sheli_restore_test
pg_restore --no-owner --dbname=ivrit_sheli_restore_test ivrit-sheli.dump
```

Keep backups encrypted and private because learner state may contain personal phrases, goals and reflections. A backup is not considered reliable until a restore drill succeeds.

## 8. Rollback

Application rollback and database rollback are separate decisions:

1. Stop routing new traffic if readiness fails.
2. Roll back to the previous immutable application image or commit only when its learner-snapshot writer is forward-compatible with data already written by the newer release.
3. Do not downgrade the database automatically.
4. If a migration is forward-compatible, keep it and deploy the previous app.
5. If data restoration is required, preserve the failed database first, then restore into a separate database and validate it before switching URLs.
6. Record the request IDs, deployed commit, migration revision and timeline.

For 2.9.1 dated 2026-07-27 specifically, an unmodified 2.4.0 writer dated
2026-07-21 is not a safe rollback target after 2.9.1 learning state has been
written. Restore the verified pre-upgrade backup or first ship a compatibility
writer that preserves unknown snapshot tables and columns.

The stable local-first mode is the user-facing continuity path if a cloud host is unavailable.
