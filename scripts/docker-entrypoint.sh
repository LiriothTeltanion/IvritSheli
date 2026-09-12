#!/bin/sh
set -eu

run_as_ivrit() {
  if [ "$(id -u)" -eq 0 ]; then
    exec python /app/scripts/drop_privileges.py "$@"
  fi
  exec "$@"
}

bootstrap_data_volume() {
  if [ "$(id -u)" -ne 0 ]; then
    return
  fi
  mkdir -p /app/data
  chown -R 10001:10001 /app/data
}

# Compose uses the same audited bootstrap as Railway without keeping the app
# process privileged.
if [ "$#" -eq 1 ] && [ "$1" = "volume-init" ]; then
  if [ "$(id -u)" -ne 0 ]; then
    echo "volume-init requires the container bootstrap user" >&2
    exit 1
  fi
  bootstrap_data_volume
  exit 0
fi

# Railway may pass pre-deploy commands through the image entrypoint. Preserve the
# administrator URL only for the one exact, audited provisioning command.
if [ "$#" -eq 4 ] \
  && [ "$1" = "python" ] \
  && [ "$2" = "-m" ] \
  && [ "$3" = "ivrit_sheli.db_admin" ] \
  && [ "$4" = "migrate" ]; then
  unset VAPID_PRIVATE_KEY
  unset VAPID_SUBJECT
  run_as_ivrit "$@"
fi

# Preserve the dedicated Push credential only for the exact terminating worker.
if [ "$#" -eq 3 ] \
  && [ "$1" = "python" ] \
  && [ "$2" = "-m" ] \
  && [ "$3" = "ivrit_sheli.push_notifications" ]; then
  unset MIGRATION_DATABASE_URL
  unset DATABASE_URL
  run_as_ivrit "$@"
fi

if [ "${1:-}" = "serve" ]; then
  shift
fi

bootstrap_data_volume

# Re-enter the same audited command router after the only privileged filesystem
# operation. The second pass runs as UID/GID 10001 and cannot regain root.
if [ "$(id -u)" -eq 0 ]; then
  exec python /app/scripts/drop_privileges.py /app/scripts/docker-entrypoint.sh "$@"
fi

# Railway gives pre-deploy and runtime containers the same service variables.
# Remove administrator/worker credentials before Uvicorn or diagnostics run.
unset MIGRATION_DATABASE_URL
unset PUSH_DATABASE_URL
unset VAPID_PRIVATE_KEY
unset VAPID_SUBJECT

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
