# Module: Windows one-click launcher
# Purpose: Prepare, build, initialize, open, and cleanly stop the complete local application.
# Author: Kevin "Lirioth" Cusnir
# Notes: Runs one private production-style server on localhost; cloud settings remain user-controlled.

param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8000,

    [ValidateSet("127.0.0.1", "0.0.0.0")]
    [string]$BindAddress = "127.0.0.1",

    [string]$DataDirectory = "",

    [ValidateSet("", "en", "es", "he")]
    [string]$Language = "",

    [switch]$RequirePreferredPort,

    [switch]$NoBrowser,

    [ValidateRange(0, 86400)]
    [int]$AutoStopAfterSeconds = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $Utf8
$OutputEncoding = $Utf8
$env:PYTHONIOENCODING = "utf-8"

$RootDir = Split-Path -Parent $PSScriptRoot
$VenvPython = Join-Path $RootDir ".venv\Scripts\python.exe"
$NodeModules = Join-Path $RootDir "frontend\node_modules"
$DependencyStamp = Join-Path $RootDir ".venv\ivrit-sheli-runtime.sha256"
$EnvFile = Join-Path $RootDir ".env"
$Server = $null
$ResultCode = 0

Set-Location $RootDir

$ExplicitDataDirectory = -not [string]::IsNullOrWhiteSpace($DataDirectory)
if ($ExplicitDataDirectory) {
    $ResolvedDataDirectory = [System.IO.Path]::GetFullPath($DataDirectory)
    $env:APP_DATA_DIR = $ResolvedDataDirectory
    $env:APP_DB_PATH = Join-Path $ResolvedDataDirectory "ivrit_sheli.db"
    $env:DICTIONARY_DB_PATH = Join-Path $ResolvedDataDirectory "hebrew_dictionary.db"
}

$EnvFileConfiguresData = (
    (Test-Path $EnvFile) -and
    (Select-String -Path $EnvFile -Pattern '^\s*APP_DATA_DIR\s*=' -Quiet)
)
if ([string]::IsNullOrWhiteSpace($env:APP_DATA_DIR) -and -not $EnvFileConfiguresData) {
    $LocalAppData = [Environment]::GetFolderPath("LocalApplicationData")
    $env:APP_DATA_DIR = Join-Path $LocalAppData "IvritSheli\data"
}

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "`n  $Message" -ForegroundColor Cyan
}

function Assert-NativeSuccess {
    param([Parameter(Mandatory)][string]$Action)
    if ($LASTEXITCODE -ne 0) {
        throw "$Action failed with exit code $LASTEXITCODE."
    }
}

function Get-FileSha256 {
    param([Parameter(Mandatory)][string]$Path)

    $Sha256 = [System.Security.Cryptography.SHA256]::Create()
    $Stream = [System.IO.File]::OpenRead((Resolve-Path $Path))
    try {
        $HashBytes = $Sha256.ComputeHash($Stream)
        return ([System.BitConverter]::ToString($HashBytes)).Replace("-", "")
    }
    finally {
        $Stream.Dispose()
        $Sha256.Dispose()
    }
}

function Get-DependencyFingerprint {
    $RequirementHash = Get-FileSha256 -Path "backend\requirements.txt"
    $PackageLockHash = Get-FileSha256 -Path "frontend\package-lock.json"
    return "$RequirementHash`:$PackageLockHash"
}

function Test-PortAvailable {
    param([Parameter(Mandatory)][int]$CandidatePort)

    $Listener = $null
    try {
        $Listener = [System.Net.Sockets.TcpListener]::new(
            [System.Net.IPAddress]::Loopback,
            $CandidatePort
        )
        $Listener.Start()
        return $true
    }
    catch [System.Net.Sockets.SocketException] {
        return $false
    }
    finally {
        if ($null -ne $Listener) {
            $Listener.Stop()
        }
    }
}

function Test-IvritHealth {
    param([Parameter(Mandatory)][int]$CandidatePort)

    try {
        $Health = Invoke-RestMethod `
            -Uri "http://127.0.0.1:$CandidatePort/api/v1/health" `
            -Method Get `
            -TimeoutSec 2
        return $Health.status -eq "ok"
    }
    catch {
        return $false
    }
}

function Find-AvailablePort {
    param([Parameter(Mandatory)][int]$PreferredPort)

    $LastCandidate = [Math]::Min(65535, $PreferredPort + 20)
    foreach ($Candidate in $PreferredPort..$LastCandidate) {
        if (Test-PortAvailable -CandidatePort $Candidate) {
            return $Candidate
        }
    }
    throw "No available localhost port was found between $PreferredPort and $LastCandidate."
}

function Open-IvritBrowser {
    param([Parameter(Mandatory)][string]$Url)

    if (-not $NoBrowser) {
        Start-Process $Url
    }
}

function Get-LanIPv4Address {
    foreach ($NetworkInterface in [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
        if (
            $NetworkInterface.OperationalStatus -ne
                [System.Net.NetworkInformation.OperationalStatus]::Up -or
            $NetworkInterface.NetworkInterfaceType -eq
                [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback
        ) {
            continue
        }
        $Properties = $NetworkInterface.GetIPProperties()
        if ($Properties.GatewayAddresses.Count -eq 0) {
            continue
        }
        foreach ($Address in $Properties.UnicastAddresses) {
            if (
                $Address.Address.AddressFamily -eq
                    [System.Net.Sockets.AddressFamily]::InterNetwork -and
                -not [System.Net.IPAddress]::IsLoopback($Address.Address)
            ) {
                return $Address.Address.ToString()
            }
        }
    }
    return $null
}

function Wait-ForIvritServer {
    param(
        [Parameter(Mandatory)][System.Diagnostics.Process]$Process,
        [Parameter(Mandatory)][int]$ServerPort
    )

    for ($Attempt = 1; $Attempt -le 60; $Attempt++) {
        $Process.Refresh()
        if ($Process.HasExited) {
            throw "The local server stopped before it became ready."
        }
        if (Test-IvritHealth -CandidatePort $ServerPort) {
            return
        }
        Start-Sleep -Milliseconds 500
    }
    throw "The local server did not become ready within 30 seconds."
}

try {
    Write-Host "" 
    Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor DarkCyan
    Write-Host "  ║   Ivrit Sheli Ultimate · עברית שלי   ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor DarkCyan

    if (
        ($BindAddress -eq "127.0.0.1" -or $RequirePreferredPort) -and
        (Test-IvritHealth -CandidatePort $Port)
    ) {
        $ExistingLanguageQuery = if ([string]::IsNullOrWhiteSpace($Language)) { "" } else { "?lang=$Language" }
        $ExistingUrl = "http://127.0.0.1:$Port/$ExistingLanguageQuery"
        Write-Host "`n  Ivrit Sheli is already running ✅" -ForegroundColor Green
        Write-Host "  $ExistingUrl" -ForegroundColor White
        if ($BindAddress -eq "0.0.0.0") {
            $ExistingLanAddress = Get-LanIPv4Address
            if ($null -ne $ExistingLanAddress) {
                $ExistingShareLanguage = if ([string]::IsNullOrWhiteSpace($Language)) { "es" } else { $Language }
                $ExistingShareUrl = "http://$ExistingLanAddress`:$Port/?lang=$ExistingShareLanguage"
                Write-Host "`n  Mother pilot link (same Wi-Fi only):" -ForegroundColor Yellow
                Write-Host "  $ExistingShareUrl" -ForegroundColor White
                try {
                    Set-Clipboard -Value $ExistingShareUrl
                    Write-Host "  Link copied to the clipboard for WhatsApp." -ForegroundColor Green
                }
                catch {
                    Write-Host "  Copy the link above into WhatsApp." -ForegroundColor DarkGray
                }
            }
        }
        Open-IvritBrowser -Url $ExistingUrl
        exit 0
    }

    $Fingerprint = Get-DependencyFingerprint
    $InstalledFingerprint = if (Test-Path $DependencyStamp) {
        (Get-Content -Raw $DependencyStamp).Trim()
    }
    else {
        ""
    }

    $NeedsSetup = (
        -not (Test-Path $VenvPython) -or
        -not (Test-Path $NodeModules) -or
        $InstalledFingerprint -ne $Fingerprint
    )

    if ($NeedsSetup) {
        Write-Step "Preparing the app for this computer (first run may take a few minutes)…"
        & "$PSScriptRoot\setup.ps1" -RuntimeOnly
        Assert-NativeSuccess -Action "Application setup"
        Set-Content -Path $DependencyStamp -Value $Fingerprint -Encoding ASCII -NoNewline
    }
    else {
        Write-Step "Refreshing the interface…"
        & npm.cmd --prefix frontend run build
        Assert-NativeSuccess -Action "Frontend build"
    }

    Write-Step "Preparing your private learning data…"
    $env:PYTHONPATH = Join-Path $RootDir "backend\src"
    # Keep the one-click experience private and local even if .env contains
    # cloud deployment credentials. Railway and Docker never set this marker.
    $env:IVRIT_LOCAL_ONLY = "true"
    $env:APP_HOST = $BindAddress

    & $VenvPython -m ivrit_sheli --init --seed
    Assert-NativeSuccess -Action "Local data initialization"

    if ($RequirePreferredPort -and -not (Test-PortAvailable -CandidatePort $Port)) {
        throw "Required port $Port is already in use by another process."
    }
    $SelectedPort = if ($RequirePreferredPort) {
        $Port
    }
    else {
        Find-AvailablePort -PreferredPort $Port
    }
    if ($SelectedPort -ne $Port) {
        Write-Host "  Port $Port is busy; using $SelectedPort instead." -ForegroundColor Yellow
    }
    $env:APP_PORT = "$SelectedPort"

    Write-Step "Starting your Hebrew learning space…"
    $ServerArgs = @(
        "-m", "ivrit_sheli",
        "--serve",
        "--host", $BindAddress,
        "--port", "$SelectedPort"
    )
    $Server = Start-Process `
        -PassThru `
        -NoNewWindow `
        -WorkingDirectory $RootDir `
        -FilePath $VenvPython `
        -ArgumentList $ServerArgs

    Wait-ForIvritServer -Process $Server -ServerPort $SelectedPort

    $LanguageQuery = if ([string]::IsNullOrWhiteSpace($Language)) { "" } else { "?lang=$Language" }
    $AppUrl = "http://127.0.0.1:$SelectedPort/$LanguageQuery"
    Write-Host "`n  Ivrit Sheli is ready ✅" -ForegroundColor Green
    Write-Host "  $AppUrl" -ForegroundColor White
    if ($BindAddress -eq "0.0.0.0") {
        $LanAddress = Get-LanIPv4Address
        if ($null -ne $LanAddress) {
            $ShareLanguage = if ([string]::IsNullOrWhiteSpace($Language)) { "es" } else { $Language }
            $ShareUrl = "http://$LanAddress`:$SelectedPort/?lang=$ShareLanguage"
            Write-Host "`n  Mother pilot link (same Wi-Fi only):" -ForegroundColor Yellow
            Write-Host "  $ShareUrl" -ForegroundColor White
            Write-Host "  If Windows Firewall asks, allow Python on Private networks only." -ForegroundColor DarkGray
            Write-Host "  The link works while this PC and this window stay open." -ForegroundColor DarkGray
            try {
                Set-Clipboard -Value $ShareUrl
                Write-Host "  Link copied to the clipboard for WhatsApp." -ForegroundColor Green
            }
            catch {
                Write-Host "  Copy the link above into WhatsApp." -ForegroundColor DarkGray
            }
        }
        else {
            Write-Host "`n  A Wi-Fi address could not be detected. Use the local link above." -ForegroundColor Yellow
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($env:APP_DATA_DIR)) {
        Write-Host "  Private data: $env:APP_DATA_DIR" -ForegroundColor DarkGray
    }
    Write-Host "`n  Keep this window open. Press Ctrl+C to stop the app safely." -ForegroundColor DarkGray
    Open-IvritBrowser -Url $AppUrl

    $StartedAt = Get-Date
    while (-not $Server.HasExited) {
        if (
            $AutoStopAfterSeconds -gt 0 -and
            ((Get-Date) - $StartedAt).TotalSeconds -ge $AutoStopAfterSeconds
        ) {
            Write-Host "`n  Automatic validation stop reached." -ForegroundColor DarkGray
            break
        }
        Start-Sleep -Milliseconds 500
        $Server.Refresh()
    }

    if ($Server.HasExited -and $Server.ExitCode -ne 0) {
        throw "The local server exited unexpectedly with code $($Server.ExitCode)."
    }
}
catch [System.Management.Automation.PipelineStoppedException] {
    Write-Host "`n  Stop requested." -ForegroundColor DarkGray
}
catch {
    $ResultCode = 1
    Write-Host "`n  Ivrit Sheli could not start ❌" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($null -ne $Server) {
        $Server.Refresh()
        if (-not $Server.HasExited) {
            Write-Host "`n  Stopping Ivrit Sheli…" -ForegroundColor DarkGray
            Stop-Process -Id $Server.Id -ErrorAction SilentlyContinue
        }
    }
    Write-Host "  Ivrit Sheli is stopped. Your progress remains saved locally. 💙" -ForegroundColor DarkCyan
}

exit $ResultCode
