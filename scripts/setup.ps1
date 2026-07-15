# Module: Windows project setup
# Purpose: Create the Python environment, install dependencies, seed local data, and build the UI on Windows.
# Author: Kevin "Lirioth" Cusnir
# Date: 2026-07-15 | TZ: Asia/Jerusalem
# Notes: Cloud processing remains disabled unless the user explicitly configures it.

param(
    [switch]$RuntimeOnly,
    [switch]$FullDictionary,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Python 3.10+ is required." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 20+ is required." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm 10+ is required." }

python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 'Python 3.10+ is required')"
if (-not (Test-Path ".venv")) { python -m venv .venv }

$Requirements = if ($RuntimeOnly) { "backend/requirements.txt" } else { "backend/requirements-dev.txt" }
& .\.venv\Scripts\python.exe -m pip install -r $Requirements
Push-Location frontend
npm ci
Pop-Location

$env:PYTHONPATH = "backend/src"
& .\.venv\Scripts\python.exe -m ivrit_sheli --init --seed
if ($FullDictionary) {
    & .\.venv\Scripts\python.exe -m ivrit_sheli --download-dictionary
}
if (-not $SkipBuild) {
    Push-Location frontend
    npm run build
    Pop-Location
}

Write-Host "Ivrit Sheli Ultimate is ready ✅"
Write-Host "Run .\scripts\run-dev.ps1 and open http://127.0.0.1:5173"
