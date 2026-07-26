#!/usr/bin/env bash
# Module: complete verification suite
# Purpose: Run formatting-independent static checks, backend/frontend tests, builds, diagnostics, and package QA.
# Author: Kevin "Lirioth" Cusnir
# Date: 2026-07-15 | TZ: Asia/Jerusalem
# Notes: Uses isolated temporary databases so verification never touches personal data.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIR}"' EXIT

cd "${ROOT_DIR}"
[[ -x "${VENV_DIR}/bin/python" ]] || { echo "Run ./scripts/setup.sh first." >&2; exit 1; }
[[ -d frontend/node_modules ]] || { echo "Run ./scripts/setup.sh first." >&2; exit 1; }

export PYTHONPATH=backend/src
export APP_DATA_DIR="${TEMP_DIR}/data"
export APP_DB_PATH="${TEMP_DIR}/data/learning.db"
export DICTIONARY_DB_PATH="${TEMP_DIR}/data/dictionary.db"
export AI_PROVIDER=offline
export ALLOW_CLOUD_PROCESSING=false

"${VENV_DIR}/bin/ruff" check backend/src backend/tests scripts/
"${VENV_DIR}/bin/mypy" --config-file backend/pyproject.toml backend/src
"${VENV_DIR}/bin/pytest" backend/tests -q
"${VENV_DIR}/bin/python" -m compileall -q backend/src scripts/
"${VENV_DIR}/bin/python" -m pip_audit -r backend/requirements.txt
"${VENV_DIR}/bin/python" -m ivrit_sheli --doctor

(
  cd frontend
  npm run typecheck
  npm run test:run
  npm run test:e2e
  npm run build
  npm audit --omit=dev
)

docker compose config --quiet
"${VENV_DIR}/bin/python" scripts/verify_package.py

echo "[OK] All local verification checks passed."
