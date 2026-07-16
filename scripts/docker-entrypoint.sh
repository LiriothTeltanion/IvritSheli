#!/bin/sh
set -eu

# Railway may pass pre-deploy commands through the image entrypoint. Preserve the
# administrator URL only for the one exact, audited provisioning command.
if [ "$#" -eq 4 ] \
  && [ "$1" = "python" ] \
  && [ "$2" = "-m" ] \
  && [ "$3" = "ivrit_sheli.db_admin" ] \
  && [ "$4" = "migrate" ]; then
  exec "$@"
fi

if [ "${1:-}" = "serve" ]; then
  shift
fi

# Railway gives pre-deploy and runtime containers the same service variables.
# Remove the administrator credential before Uvicorn or any diagnostic command runs.
unset MIGRATION_DATABASE_URL

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  python -m ivrit_sheli --init --seed
fi

exec uvicorn ivrit_sheli.api:app \
  --app-dir backend/src \
  --host "${APP_HOST:-0.0.0.0}" \
  --port "${PORT:-${APP_PORT:-8000}}" \
  --log-config backend/logging.json \
  --no-access-log \
  --no-proxy-headers
