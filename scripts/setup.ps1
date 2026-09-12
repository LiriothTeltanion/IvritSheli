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
$Utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $Utf8
$OutputEncoding = $Utf8
$env:PYTHONIOENCODING = "utf-8"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Python 3.10+ is required." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 20.19+ is required." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm 10+ is required." }

python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 'Python 3.10+ is required')"
if ($LASTEXITCODE -ne 0) { throw "Python 3.10+ is required." }
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 20 || (major === 20 && minor >= 19) ? 0 : 1)"
if ($LASTEXITCODE -ne 0) { throw "Node.js 20.19+ is required; Node.js 22 LTS is recommended." }
$NpmMajor = [int]((npm --version).Split('.')[0])
if ($LASTEXITCODE -ne 0 -or $NpmMajor -lt 10) { throw "npm 10+ is required." }
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw "Could not create the Python environment." }
}

$Requirements = if ($RuntimeOnly) { "backend/requirements.txt" } else { "backend/requirements-dev.txt" }
& .\.venv\Scripts\python.exe -m pip install -r $Requirements
if ($LASTEXITCODE -ne 0) { throw "Could not install Python dependencies." }
& .\.venv\Scripts\python.exe -m pip uninstall --yes ivrit-sheli-ultimate
if ($LASTEXITCODE -ne 0) { throw "Could not remove the retired Python package identity." }
& .\.venv\Scripts\python.exe -m pip install --no-deps --editable backend
if ($LASTEXITCODE -ne 0) { throw "Could not install the current Ivrit Sheli package identity." }
Push-Location frontend
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Could not install frontend dependencies." }
    if (-not $RuntimeOnly) {
        npx playwright install chromium
        if ($LASTEXITCODE -ne 0) { throw "Could not install Chromium for browser tests." }
    }
}
finally {
    Pop-Location
}

$env:PYTHONPATH = "backend/src"
& .\.venv\Scripts\python.exe -m ivrit_sheli --init --seed
if ($LASTEXITCODE -ne 0) { throw "Could not initialize local learning data." }
if ($FullDictionary) {
    & .\.venv\Scripts\python.exe -m ivrit_sheli --download-dictionary
    if ($LASTEXITCODE -ne 0) { throw "Could not download the full dictionary." }
}
if (-not $SkipBuild) {
    Push-Location frontend
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Could not build the frontend." }
    }
    finally {
        Pop-Location
    }
}

Write-Host "Ivrit Sheli is ready ✅"
Write-Host "Start with .\START_IVRIT_SHELI.bat or .\scripts\start.ps1"
Write-Host "Developers can still use .\scripts\run-dev.ps1 for hot reload."

