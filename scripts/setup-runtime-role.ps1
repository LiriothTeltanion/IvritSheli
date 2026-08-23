<#
.SYNOPSIS
    Move Ivrit Sheli off the PostgreSQL superuser and onto the restricted
    ivrit_sheli_runtime role, in one step.

.DESCRIPTION
    The application refuses to start against a superuser DATABASE_URL by design:
    the postgres role carries BYPASSRLS, so every row-level-security policy in
    the schema is inert and one learner's connection can read another learner's
    rows. Do not remove that guard. Give the app a restricted login instead.

    Nothing needs to be written by hand. The migrations already create
    ivrit_sheli_runtime with its grants, and ivrit_sheli.db_admin turns it into a
    login role, encrypting the password client-side so the plaintext never
    reaches the server's DDL log. This script only sequences those pieces.

    Both passwords are read as secure strings. Neither is echoed, logged, or
    written anywhere except the DATABASE_URL line of .env, and the administrator
    URL is never written to disk at all.

.EXAMPLE
    pwsh -File scripts/setup-runtime-role.ps1
#>
[CmdletBinding()]
param(
    [switch]$SkipEnvUpdate
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env'
$python = Join-Path $root '.venv\Scripts\python.exe'

function Write-Step { param([string]$Text) Write-Host "`n$Text" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "  OK  $Text" -ForegroundColor Green }
function Write-Warn { param([string]$Text) Write-Host "  !!  $Text" -ForegroundColor Yellow }

if (-not (Test-Path $python)) { throw "Python venv not found at $python. Run scripts/setup.ps1 first." }
if (-not (Test-Path $envPath)) { throw "No .env at $envPath." }

# --- Read the current target without revealing the password ------------------
$envLines = Get-Content $envPath
$dbLine = $envLines | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $dbLine) { throw 'DATABASE_URL is not set in .env; nothing to migrate away from.' }

$rawUrl = ($dbLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
$parsed = [uri]$rawUrl
$dbHost = $parsed.Host
$dbPort = if ($parsed.Port -gt 0) { $parsed.Port } else { 5432 }
$dbName = $parsed.AbsolutePath.TrimStart('/')
$currentUser = $parsed.UserInfo.Split(':')[0]

Write-Step 'Target'
Write-Host "  host      $dbHost"
Write-Host "  database  $dbName"
Write-Host "  user now  $currentUser"

if ($currentUser -eq 'ivrit_sheli_runtime') {
    Write-Ok 'Already on the restricted role. Nothing to do.'
    exit 0
}

Write-Step 'Before you continue'
Write-Host '  1. Rotate the ' -NoNewline; Write-Host $currentUser -ForegroundColor Yellow -NoNewline
Write-Host ' password in the Supabase dashboard:'
Write-Host "     Project settings -> Database -> Reset database password" -ForegroundColor DarkGray
Write-Host '  2. Have a SEPARATE password ready for ivrit_sheli_runtime.'
Write-Host '     It must not be the same one.' -ForegroundColor DarkGray

$go = Read-Host "`nReady? (y/N)"
if ($go -ne 'y') { Write-Warn 'Stopped. Nothing changed.'; exit 1 }

# --- Collect both secrets ----------------------------------------------------
$adminSecure   = Read-Host "Rotated password for $currentUser" -AsSecureString
$runtimeSecure = Read-Host 'New password for ivrit_sheli_runtime' -AsSecureString
$confirmSecure = Read-Host 'Repeat it' -AsSecureString

function ConvertFrom-Secure { param([SecureString]$S)
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($S))
}

$adminPlain   = ConvertFrom-Secure $adminSecure
$runtimePlain = ConvertFrom-Secure $runtimeSecure
$confirmPlain = ConvertFrom-Secure $confirmSecure

try {
    if ([string]::IsNullOrWhiteSpace($runtimePlain)) { throw 'The runtime password is empty.' }
    if ($runtimePlain -ne $confirmPlain) { throw 'The two runtime passwords do not match.' }
    if ($runtimePlain -eq $adminPlain) { throw 'The runtime password must differ from the administrator password.' }

    $enc = [uri]::EscapeDataString($runtimePlain)
    $encAdmin = [uri]::EscapeDataString($adminPlain)
    $runtimeUrl = "postgresql://ivrit_sheli_runtime:$enc@${dbHost}:${dbPort}/$dbName"
    $adminUrl   = "postgresql://${currentUser}:$encAdmin@${dbHost}:${dbPort}/$dbName"

    # --- Provision -----------------------------------------------------------
    Write-Step 'Provisioning'
    Write-Host '  Running Alembic to head, creating the role, applying grants,' -ForegroundColor DarkGray
    Write-Host '  then connecting back as the restricted role to prove it works.' -ForegroundColor DarkGray

    $env:MIGRATION_DATABASE_URL = $adminUrl
    $env:DATABASE_URL = $runtimeUrl
    try {
        & $python -m ivrit_sheli.db_admin migrate
        if ($LASTEXITCODE -ne 0) { throw "The provisioner exited with code $LASTEXITCODE. Nothing was written to .env." }
    }
    finally {
        # The application must never see the administrator credential.
        Remove-Item Env:MIGRATION_DATABASE_URL -ErrorAction SilentlyContinue
    }
    Write-Ok 'Role provisioned and verified.'

    # --- Point .env at the restricted role -----------------------------------
    if ($SkipEnvUpdate) {
        Write-Warn 'Skipped .env update as requested. Set DATABASE_URL yourself.'
    }
    else {
        Write-Step 'Updating .env'
        Copy-Item $envPath "$envPath.bak" -Force
        $updated = $envLines | ForEach-Object {
            if ($_ -match '^\s*DATABASE_URL\s*=') { "DATABASE_URL=`"$runtimeUrl`"" } else { $_ }
        }
        if (-not ($updated | Where-Object { $_ -match '^\s*MIGRATION_DATABASE_URL\s*=' })) {
            # Nothing to strip; the admin URL was only ever an environment variable.
        }
        else {
            $updated = $updated | Where-Object { $_ -notmatch '^\s*MIGRATION_DATABASE_URL\s*=' }
            Write-Ok 'Removed MIGRATION_DATABASE_URL from .env — the app must never receive it.'
        }
        Set-Content -Path $envPath -Value $updated -Encoding UTF8
        Write-Ok "DATABASE_URL now authenticates as ivrit_sheli_runtime. Previous file kept at .env.bak"
    }
}
finally {
    # Clear the plaintext copies from this process.
    $adminPlain = $null; $runtimePlain = $null; $confirmPlain = $null
    [GC]::Collect()
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}

Write-Step 'Next'
Write-Host '  Start the PostgreSQL profile and confirm it reports postgresql storage:'
Write-Host '    preview_start backend        (or: .\scripts\start.ps1)' -ForegroundColor DarkGray
Write-Host '    curl http://127.0.0.1:8000/api/v1/version' -ForegroundColor DarkGray
Write-Host '  Then run the isolation test that is skipped today:'
Write-Host '    .venv\Scripts\python.exe -m pytest backend/tests/test_postgres_integration.py -q' -ForegroundColor DarkGray
Write-Host '  Delete .env.bak once you are satisfied.' -ForegroundColor DarkGray
