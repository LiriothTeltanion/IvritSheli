#!/usr/bin/env bash
# Module: development launcher
# Purpose: Run the FastAPI backend and Vite frontend together with clean shutdown behavior.
# Author: Kevin "Lirioth" Cusnir
# Date: 2026-07-15 | TZ: Asia/Jerusalem
# Notes: Uses local-only defaults and never enables cloud processing implicitly.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  [[ -n "${FRONTEND_PID}" ]] && kill "${FRONTEND_PID}" 2>/dev/null || true
  [[ -n "${BACKEND_PID}" ]] && kill "${BACKEND_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "${ROOT_DIR}"
[[ -x .venv/bin/python ]] || { echo "Run ./scripts/setup.sh first." >&2; exit 1; }
[[ -d frontend/node_modules ]] || { echo "Frontend dependencies are missing; run ./scripts/setup.sh." >&2; exit 1; }

PYTHONPATH=backend/src .venv/bin/uvicorn ivrit_sheli.api:app \
  --app-dir backend/src \
  --host 127.0.0.1 \
  --port 8000 \
  --reload &
BACKEND_PID=$!

(
  cd frontend
  npm run dev -- --host 127.0.0.1 --port 5173
) &
FRONTEND_PID=$!

echo "Ivrit Sheli is running at http://127.0.0.1:5173 ✅"
wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
