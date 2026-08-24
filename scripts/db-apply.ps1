<#
.SYNOPSIS
    Apply pending schema work to the database, in one command.

.DESCRIPTION
    Schema changes belong in Alembic migrations, not in SQL pasted into a
    dashboard. This runs the project's own provisioner: Alembic to head, then the
    role hardening and grants, then a verification connect as the restricted
    role. It is idempotent — running it when nothing is pending is a no-op.

    The administrator credential is used for this command and nothing else. It is
    never written to .env, never passed to the application, and cleared from the
    environment before this script exits. That separation is the architecture,
    not caution: a runtime role that could alter the schema could also disable
    row-level security.

    By default it asks for the password each time. If you would rather not type
    it, put the administrator URL in .env.admin (gitignored) and this reads it:

        MIGRATION_DATABASE_URL="postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres"

    That is a real trade: it removes the prompt, and it leaves an administrator
    credential on disk that any process on this machine can read.

.EXAMPLE
    pwsh -File scripts/db-apply.ps1
#>
[CmdletBinding()]
param(
    [switch]$Prompt   # ignore .env.admin and ask, even if the file exists
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root '.venv\Scripts\python.exe'
$envPath = Join-Path $root '.env'
$adminPath = Join-Path $root '.env.admin'

function Write-Step { param([string]$T) Write-Host "`n$T" -ForegroundColor Cyan }
function Write-Ok   { param([string]$T) Write-Host "  OK  $T" -ForegroundColor Green }
function Write-Warn { param([string]$T) Write-Host "  !!  $T" -ForegroundColor Yellow }

if (-not (Test-Path $python)) { throw "No venv at $python." }

# --- The runtime URL the application uses ------------------------------------
$dbLine = Get-Content $envPath | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $dbLine) { throw 'DATABASE_URL is not set in .env; the app is in local SQLite mode and needs no migration.' }
$runtimeUrl = ($dbLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
$parsed = [uri]$runtimeUrl
if ($parsed.UserInfo.Split(':')[0] -ne 'ivrit_sheli_runtime') {
    throw "DATABASE_URL authenticates as '$($parsed.UserInfo.Split(':')[0])', not ivrit_sheli_runtime. Fix that first: docs/SUPABASE_RUNTIME_ROLE.md"
}

Write-Step 'Target'
Write-Host "  host      $($parsed.Host)"
Write-Host "  database  $($parsed.AbsolutePath.TrimStart('/'))"

# --- The administrator URL, used only for this command -----------------------
$adminUrl = $null
if ((Test-Path $adminPath) -and -not $Prompt) {
    $line = Get-Content $adminPath | Where-Object { $_ -match '^\s*MIGRATION_DATABASE_URL\s*=' } | Select-Object -First 1
    if ($line) {
        $adminUrl = ($line -replace '^\s*MIGRATION_DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
        Write-Ok 'Administrator URL read from .env.admin'
    }
}
if (-not $adminUrl) {
    Write-Step 'Administrator password'
    Write-Host '  The postgres password from the Supabase dashboard. Not stored.' -ForegroundColor DarkGray
    $secure = Read-Host "Password for postgres@$($parsed.Host)" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    if ([string]::IsNullOrEmpty($plain)) { throw 'Nothing entered.' }
    Write-Host "  read $($plain.Length) characters" -ForegroundColor DarkGray
    $port = if ($parsed.Port -gt 0) { $parsed.Port } else { 5432 }
    $adminUrl = "postgresql://postgres:$([uri]::EscapeDataString($plain))@$($parsed.Host):$port/$($parsed.AbsolutePath.TrimStart('/'))"
    $plain = $null
}

# --- Apply -------------------------------------------------------------------
Write-Step 'Applying'
Write-Host '  Alembic to head, role hardening and grants, then a verifying' -ForegroundColor DarkGray
Write-Host '  connect as the restricted role. Idempotent.' -ForegroundColor DarkGray
try {
    $env:MIGRATION_DATABASE_URL = $adminUrl
    $env:DATABASE_URL = $runtimeUrl
    $captured = & $python -m ivrit_sheli.db_admin migrate 2>&1
    $captured | ForEach-Object { Write-Host "      $_" }
    if ($LASTEXITCODE -ne 0) {
        $text = ($captured | Out-String)
        if ($text -match 'password authentication failed') {
            Write-Warn 'The database rejected that password. Reset it in the dashboard and use exactly that value.'
        }
        elseif ($text -match 'SUPERUSER attribute') {
            Write-Warn 'This administrator may not set superuser-only attributes. Update the repository — fixed in ec8845c.'
        }
        throw 'Nothing was changed.'
    }
}
finally {
    # The application must never hold this. Clear it before anything else runs.
    Remove-Item Env:MIGRATION_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    $adminUrl = $null
    [GC]::Collect()
}
Write-Ok 'Schema and roles are at head.'

# --- Confirm what the application will see ------------------------------------
Write-Step 'Verifying as the application sees it'
& $python (Join-Path $root 'scripts\db.py') --check
