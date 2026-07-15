# Module: Windows development launcher
# Purpose: Run the local FastAPI and Vite development servers in separate processes.
# Author: Kevin "Lirioth" Cusnir
# Date: 2026-07-15 | TZ: Asia/Jerusalem
# Notes: Stop both spawned processes when this launcher exits.

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

if (-not (Test-Path ".venv\Scripts\python.exe")) { throw "Run .\scripts\setup.ps1 first." }
if (-not (Test-Path "frontend\node_modules")) { throw "Run .\scripts\setup.ps1 first." }

$env:PYTHONPATH = "backend/src"
$BackendArgs = @(
    "-m", "uvicorn", "ivrit_sheli.api:app",
    "--app-dir", "backend/src",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--reload"
)
$FrontendArgs = @(
    "--prefix", "frontend", "run", "dev", "--",
    "--host", "127.0.0.1",
    "--port", "5173"
)

$Backend = Start-Process -PassThru -NoNewWindow -FilePath ".\.venv\Scripts\python.exe" -ArgumentList $BackendArgs
$Frontend = Start-Process -PassThru -NoNewWindow -FilePath "npm.cmd" -ArgumentList $FrontendArgs

Write-Host "Ivrit Sheli is running at http://127.0.0.1:5173 ✅"
try {
    while (-not $Backend.HasExited -and -not $Frontend.HasExited) { Start-Sleep -Seconds 1 }
}
finally {
    if (-not $Frontend.HasExited) { Stop-Process -Id $Frontend.Id -Force }
    if (-not $Backend.HasExited) { Stop-Process -Id $Backend.Id -Force }
}
