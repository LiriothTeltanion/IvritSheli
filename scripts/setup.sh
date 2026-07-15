#!/usr/bin/env bash
# Module: project setup
# Purpose: Create a reproducible local environment, initialize private data, and build the production UI.
# Author: Kevin "Lirioth" Cusnir
# Date: 2026-07-15 | TZ: Asia/Jerusalem
# Notes: Fails with actionable messages; optional full dictionary download is explicit.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
INSTALL_DEV=true
DOWNLOAD_DICTIONARY=false
SKIP_BUILD=false

usage() {
  cat <<'HELP'
Usage: ./scripts/setup.sh [options]

Options:
  --runtime-only       Install backend runtime dependencies without test tools.
  --full-dictionary   Download and import the attributed Kaikki Hebrew dictionary.
  --skip-build        Skip the production frontend build.
  -h, --help          Show this help message.
HELP
}

while (($#)); do
  case "$1" in
    --runtime-only) INSTALL_DEV=false ;;
    --full-dictionary) DOWNLOAD_DICTIONARY=true ;;
    --skip-build) SKIP_BUILD=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

command -v python3 >/dev/null 2>&1 || { echo "Python 3.10+ is required." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm 10+ is required." >&2; exit 1; }

python3 - <<'PY'
import sys
if sys.version_info < (3, 10):
    raise SystemExit(f"Python 3.10+ is required; found {sys.version.split()[0]}")
PY

node - <<'JS'
const major = Number(process.versions.node.split('.')[0]);
if (major < 20) {
  console.error(`Node.js 20+ is required; found ${process.versions.node}`);
  process.exit(1);
}
JS

cd "${ROOT_DIR}"
if [[ ! -d "${VENV_DIR}" ]]; then
  python3 -m venv "${VENV_DIR}"
fi

PYTHON_BIN="${VENV_DIR}/bin/python"
PIP_BIN="${VENV_DIR}/bin/pip"
REQUIREMENTS="backend/requirements.txt"
if [[ "${INSTALL_DEV}" == true ]]; then
  REQUIREMENTS="backend/requirements-dev.txt"
fi

"${PIP_BIN}" install -r "${REQUIREMENTS}"
(
  cd frontend
  npm ci
)

PYTHONPATH=backend/src "${PYTHON_BIN}" -m ivrit_sheli --init --seed

if [[ "${DOWNLOAD_DICTIONARY}" == true ]]; then
  if ! PYTHONPATH=backend/src "${PYTHON_BIN}" -m ivrit_sheli --download-dictionary; then
    echo "Full dictionary download failed. The attributed demo lexicon remains available." >&2
    echo "Retry later with: make dictionary" >&2
    exit 1
  fi
fi

if [[ "${SKIP_BUILD}" == false ]]; then
  (
    cd frontend
    npm run build
  )
fi

cat <<'DONE'
Ivrit Sheli Ultimate is ready ✅

Development:
  ./scripts/run-dev.sh

Production-style local run:
  PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli --serve
  Open http://127.0.0.1:8000
DONE
