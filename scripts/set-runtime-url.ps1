<#
.SYNOPSIS
    Point .env at the restricted ivrit_sheli_runtime login, and prove it works.

.DESCRIPTION
    Run this after scripts/setup-runtime-role.sql has been executed in the
    Supabase SQL Editor. It asks only for the password you set there.

    It does not connect as an administrator and it runs no migrations, so
    nothing here can fail for a credential or permission reason. It percent-
    encodes the password before placing it in the URL, keeps a .env.bak, and
    then opens one connection as the restricted role to confirm the login
    actually works before you find out from a failing server.

.EXAMPLE
    pwsh -File scripts/set-runtime-url.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env'
$python = Join-Path $root '.venv\Scripts\python.exe'

function Write-Step { param([string]$Text) Write-Host "`n$Text" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "  OK  $Text" -ForegroundColor Green }
function Write-Warn { param([string]$Text) Write-Host "  !!  $Text" -ForegroundColor Yellow }

if (-not (Test-Path $envPath)) { throw "No .env at $envPath." }

$envLines = Get-Content $envPath
$dbLine = $envLines | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $dbLine) { throw 'DATABASE_URL is not set in .env.' }

$rawUrl = ($dbLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
$parsed = [uri]$rawUrl
$dbHost = $parsed.Host
$dbPort = if ($parsed.Port -gt 0) { $parsed.Port } else { 5432 }
$dbName = $parsed.AbsolutePath.TrimStart('/')

Write-Step 'Target'
Write-Host "  host      $dbHost"
Write-Host "  database  $dbName"
Write-Host "  user      ivrit_sheli_runtime"

function ConvertFrom-Secure {
    param([SecureString]$S)
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($S)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Step 'Password'
Write-Host '  The one you put in the SQL Editor, in place of CAMBIA_ESTA_PASSWORD.' -ForegroundColor DarkGray

$plain = $null
for ($attempt = 1; $attempt -le 3; $attempt++) {
    $first = ConvertFrom-Secure (Read-Host 'Password for ivrit_sheli_runtime' -AsSecureString)
    if ([string]::IsNullOrEmpty($first)) { Write-Warn 'Nothing entered.'; continue }
    Write-Host "  read $($first.Length) characters" -ForegroundColor DarkGray
    $again = ConvertFrom-Secure (Read-Host 'Repeat it' -AsSecureString)
    Write-Host "  read $($again.Length) characters" -ForegroundColor DarkGray
    if ($first -eq $again) { $plain = $first; break }
    Write-Warn "They do not match ($($first.Length) vs $($again.Length)). Attempt $attempt of 3."
}
if (-not $plain) { throw 'Password not confirmed after three attempts. Nothing changed.' }

try {
    $encoded = [uri]::EscapeDataString($plain)
    $runtimeUrl = "postgresql://ivrit_sheli_runtime:$encoded@${dbHost}:${dbPort}/$dbName"

    # --- Prove the login works before writing anything -----------------------
    Write-Step 'Testing the login'
    $probe = @'
import sys
import psycopg
try:
    with psycopg.connect(sys.argv[1], connect_timeout=8) as c:
        row = c.execute("SELECT current_user, current_setting('is_superuser')").fetchone()
        print(f"connected as {row[0]}, superuser={row[1]}")
except Exception as error:
    print(f"FAILED: {error}", file=sys.stderr)
    raise SystemExit(1)
'@
    $probeFile = Join-Path ([IO.Path]::GetTempPath()) 'ivrit-runtime-probe.py'
    Set-Content -Path $probeFile -Value $probe -Encoding UTF8
    try {
        $result = & $python $probeFile $runtimeUrl 2>&1
        if ($LASTEXITCODE -ne 0) {
            $result | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
            throw 'The restricted login was refused. The password does not match what the SQL Editor set. Nothing was written to .env.'
        }
        Write-Ok ($result | Out-String).Trim()
    }
    finally {
        Remove-Item $probeFile -ErrorAction SilentlyContinue
    }

    # --- Write it ------------------------------------------------------------
    Write-Step 'Updating .env'
    Copy-Item $envPath "$envPath.bak" -Force
    $updated = $envLines |
        Where-Object { $_ -notmatch '^\s*MIGRATION_DATABASE_URL\s*=' } |
        ForEach-Object {
            if ($_ -match '^\s*DATABASE_URL\s*=') { "DATABASE_URL=`"$runtimeUrl`"" } else { $_ }
        }
    Set-Content -Path $envPath -Value $updated -Encoding UTF8
    Write-Ok 'DATABASE_URL now authenticates as ivrit_sheli_runtime.'
    Write-Ok 'Previous file kept at .env.bak'
}
finally {
    $plain = $null
    [GC]::Collect()
}

Write-Step 'Next'
Write-Host '  Start the PostgreSQL profile and confirm it reports postgresql storage:'
Write-Host '    curl http://127.0.0.1:8000/api/v1/version' -ForegroundColor DarkGray
Write-Host '  Clear the Supabase SQL Editor — the password is plaintext in it.' -ForegroundColor DarkGray
Write-Host '  Delete .env.bak once you are satisfied.' -ForegroundColor DarkGray
