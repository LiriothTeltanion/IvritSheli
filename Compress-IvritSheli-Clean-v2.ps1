#requires -Version 5.1
<#
===============================================================================
 IvritSheli - Clean Source Packager v2 (Git -C fix)
 Personalized from the repository audit generated 2026-08-10
===============================================================================

PURPOSE
  Create a very small, safe SOURCE snapshot of the CURRENT IvritSheli working
  tree. It keeps:
    - every Git-tracked file, INCLUDING current uncommitted modifications;
    - legitimate untracked files that are NOT ignored by .gitignore.

  It deliberately omits:
    - .git history/metadata;
    - .venv and Python caches;
    - frontend/node_modules and generated frontend output;
    - tmp and test-results;
    - local databases, audio/private data, downloaded models and backups;
    - previous release ZIPs;
    - local editor/agent folders already ignored by Git;
    - real .env files, keys and credential files;
    - this audit/compression tooling and generated audit/output folders.

SAFETY
  - DOES NOT delete, move, rename, clean, reset, checkout, commit or modify
    anything in your IvritSheli project.
  - It copies selected files to a TEMP staging folder, archives that staging
    folder, verifies the 7z, writes a SHA-256, then removes only the TEMP copy.

IMPORTANT
  This is a SOURCE snapshot, not a full machine/runtime backup. Dependencies and
  downloaded/local runtime data are intentionally rebuilt/restored separately.
#>

[CmdletBinding()]
param(
    [ValidateRange(1,9)]
    [int]$CompressionLevel = 9
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ----------------------------- Core paths ------------------------------------
$ScriptPath = $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Get-Location).Path
}
$Root = [System.IO.Path]::GetFullPath($Root).TrimEnd('\')
$RepoName = Split-Path $Root -Leaf
$Parent = Split-Path -Parent $Root
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"

$OutputDir = Join-Path $Parent "_IVRITSHELI_EXPORTS"
$StageRoot = Join-Path $env:TEMP ("IvritSheli_Source_Stage_" + [guid]::NewGuid().ToString("N"))
$StageProject = Join-Path $StageRoot "IvritSheli"

# ----------------------------- Helpers ---------------------------------------
function Format-Bytes {
    param([long]$Bytes)
    if ($Bytes -ge 1TB) { return "{0:N2} TB" -f ($Bytes / 1TB) }
    if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    if ($Bytes -ge 1KB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    return "$Bytes B"
}

function Get-7ZipExecutable {
    $names = @("7z.exe", "7zz.exe", "7za.exe", "7z", "7zz", "7za")
    foreach ($name in $names) {
        try {
            $cmd = Get-Command $name -ErrorAction Stop
            if ($cmd -and $cmd.Source) {
                return $cmd.Source
            }
        } catch {}
    }

    $candidates = @(
        "$env:ProgramFiles\7-Zip\7z.exe",
        "${env:ProgramFiles(x86)}\7-Zip\7z.exe",
        "$env:LOCALAPPDATA\Programs\7-Zip\7z.exe",
        "$env:LOCALAPPDATA\7-Zip\7z.exe"
    )

    foreach ($candidate in $candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and
            (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return $candidate
        }
    }

    return $null
}

function Test-ManualToolingExclude {
    param([string]$RelativePath)

    $r = ($RelativePath -replace '/', '\').TrimStart('\')
    $leaf = [System.IO.Path]::GetFileName($r)

    # Audit folders/reports created by the previous diagnostic phase.
    if ($r -match '(^|\\)_IVRITSHELI_AUDIT_[^\\]*(\\|$)') { return $true }

    # Export/package folders in case one was ever created inside the repo.
    if ($r -match '(^|\\)_IVRITSHELI_EXPORTS(\\|$)') { return $true }
    if ($r -match '(^|\\)_IVRITSHELI_PACKAGE_[^\\]*(\\|$)') { return $true }

    # Nova audit and packaging helpers: useful locally, not product source.
    $toolFiles = @(
        "IvritSheli_RepoAudit.ps1",
        "RUN_IvritSheli_RepoAudit.cmd",
        "Compress-IvritSheli-Clean.ps1",
        "RUN_Compress_IvritSheli_Clean.cmd",
        "IvritSheli_Compressor_Package.zip"
    )
    if ($toolFiles -contains $leaf) { return $true }

    # Sidecar outputs that this packager can generate.
    if ($leaf -like "IvritSheli-Source-*.7z") { return $true }
    if ($leaf -like "IvritSheli-Source-*.sha256.txt") { return $true }
    if ($leaf -like "IvritSheli-Source-*.report.txt") { return $true }

    return $false
}

function Test-SensitivePath {
    param([string]$RelativePath)

    $r = ($RelativePath -replace '/', '\').TrimStart('\')
    $leaf = [System.IO.Path]::GetFileName($r).ToLowerInvariant()
    $ext = [System.IO.Path]::GetExtension($leaf).ToLowerInvariant()

    # Keep safe environment templates, but never real environment files.
    if ($leaf -match '^\.env($|\.)') {
        if ($leaf -match '\.(example|sample|template|dist)$') {
            return $false
        }
        return $true
    }

    if ($leaf -in @(
        "credentials.json",
        "token.json",
        "client_secret.json",
        "secrets.json",
        "secret.json"
    )) {
        return $true
    }

    if ($leaf -match '^service[-_]?account.*\.json$') { return $true }
    if ($leaf -match '(^|[-_.])(private[-_]?key|api[-_]?key|access[-_]?token|refresh[-_]?token)([-_.]|$)') {
        return $true
    }

    if ($ext -in @(".pem", ".key", ".p12", ".pfx", ".jks", ".keystore")) {
        return $true
    }

    return $false
}

function Get-ProjectVersion {
    param(
        [string]$RepoRoot,
        [string]$Branch
    )

    # Prefer the frontend package version if present.
    $packageJson = Join-Path $RepoRoot "frontend\package.json"
    if (Test-Path -LiteralPath $packageJson -PathType Leaf) {
        try {
            $pkg = Get-Content -LiteralPath $packageJson -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($pkg.version -and "$($pkg.version)" -match '^\d+\.\d+\.\d+') {
                return "$($pkg.version)"
            }
        } catch {}
    }

    # Then try backend/pyproject.toml.
    $pyproject = Join-Path $RepoRoot "backend\pyproject.toml"
    if (Test-Path -LiteralPath $pyproject -PathType Leaf) {
        try {
            $raw = Get-Content -LiteralPath $pyproject -Raw -Encoding UTF8
            $match = [regex]::Match($raw, '(?m)^\s*version\s*=\s*["'']([^"'']+)["'']')
            if ($match.Success) {
                return $match.Groups[1].Value
            }
        } catch {}
    }

    # Finally infer from a branch such as codex/ivrit-sheli-v2.9.2-...
    if ($Branch -match '(?i)v?(\d+\.\d+\.\d+)') {
        return $Matches[1]
    }

    return "working"
}

function Get-FileBytes {
    param([string[]]$RelativePaths)
    [int64]$sum = 0
    foreach ($rel in $RelativePaths) {
        $p = Join-Path $Root $rel
        if (Test-Path -LiteralPath $p -PathType Leaf) {
            $sum += [int64](Get-Item -LiteralPath $p -Force).Length
        }
    }
    return $sum
}

function Write-Section {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Title
    )
    $Lines.Add("")
    $Lines.Add($Title)
    $Lines.Add(("-" * 78))
}

# ----------------------------- Banner ----------------------------------------
Clear-Host
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " IVRITSHELI - CLEAN SOURCE PACKAGER" -ForegroundColor Cyan
Write-Host " Current working tree -> minimal verified 7z source snapshot" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $Root"
Write-Host "Safety:  READ project -> COPY to TEMP -> COMPRESS -> VERIFY" -ForegroundColor Green
Write-Host "         No project files will be deleted or changed." -ForegroundColor Green
Write-Host ""

# ----------------------------- Preconditions ---------------------------------
$git = $null
try {
    $git = (Get-Command git -ErrorAction Stop).Source
} catch {
    throw "Git was not found in PATH. IvritSheli is a Git repo and this packager uses Git to select the correct working-tree files safely."
}

$sevenZip = Get-7ZipExecutable
if (-not $sevenZip) {
    Write-Host "7-Zip command-line executable was not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install the official 7-Zip desktop app, then run this launcher again." -ForegroundColor Yellow
    Write-Host "The script looks for 7z.exe / 7zz.exe / 7za.exe in PATH and standard install locations."
    throw "7-Zip CLI not found."
}

Write-Host "Git:   $git" -ForegroundColor DarkGray
Write-Host "7-Zip: $sevenZip" -ForegroundColor DarkGray
Write-Host ""

# ----------------------------- Git snapshot ----------------------------------
# Always address the repository explicitly with `git -C <root>`.
# This avoids PowerShell/OneDrive/current-directory quirks and makes the script
# independent of where the launcher happened to start.
$insideOutput = @(& $git -C $Root rev-parse --is-inside-work-tree 2>&1)
$insideExit = $LASTEXITCODE
$inside = if ($insideOutput.Count -gt 0) { "$($insideOutput[0])".Trim() } else { "" }

if ($insideExit -ne 0 -or $inside -ne "true") {
    $details = ($insideOutput | ForEach-Object { "$_" }) -join "`n"
    if ([string]::IsNullOrWhiteSpace($details)) { $details = "(Git returned no diagnostic text.)" }

    throw @"
Git could not open IvritSheli as a working tree.

Repository path:
$Root

Git diagnostic:
$details

Try this command manually in PowerShell:
& "$git" -C "$Root" status
"@
}

$gitRootOutput = @(& $git -C $Root rev-parse --show-toplevel 2>&1)
$gitRootExit = $LASTEXITCODE
$gitRootRaw = if ($gitRootOutput.Count -gt 0) { "$($gitRootOutput[0])".Trim() } else { "" }

if ($gitRootExit -ne 0 -or [string]::IsNullOrWhiteSpace($gitRootRaw)) {
    $details = ($gitRootOutput | ForEach-Object { "$_" }) -join "`n"
    throw "Could not determine the Git repository root.`nGit diagnostic:`n$details"
}

$gitRoot = [System.IO.Path]::GetFullPath(($gitRootRaw -replace '/', '\')).TrimEnd('\')
if (-not $gitRoot.Equals($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Place both compression files in the IvritSheli repository ROOT.`nDetected Git root: $gitRoot`nScript root: $Root"
}

$branchOutput = @(& $git -C $Root branch --show-current 2>&1)
$branchExit = $LASTEXITCODE
$branch = if ($branchExit -eq 0 -and $branchOutput.Count -gt 0) { "$($branchOutput[0])".Trim() } else { "" }
if ([string]::IsNullOrWhiteSpace($branch)) { $branch = "(detached HEAD)" }

$headOutput = @(& $git -C $Root rev-parse --short HEAD 2>&1)
$headExit = $LASTEXITCODE
$head = if ($headExit -eq 0 -and $headOutput.Count -gt 0) { "$($headOutput[0])".Trim() } else { "(unknown)" }

$status = @(& $git -C $Root -c core.quotepath=false status --short 2>&1)
$statusExit = $LASTEXITCODE
if ($statusExit -ne 0) {
    $details = ($status | ForEach-Object { "$_" }) -join "`n"
    throw "git status failed.`nGit diagnostic:`n$details"
}

# THIS is the key selection:
#   -c = tracked/cached files
#   -o = untracked files
#   --exclude-standard = omit .gitignore / info/exclude / global ignores
#
# Therefore current modified tracked files are preserved, and legitimate
# new untracked source files are preserved too.
$gitCandidates = @(& $git -C $Root -c core.quotepath=false ls-files -c -o --exclude-standard 2>&1)
$candidateExit = $LASTEXITCODE
if ($candidateExit -ne 0) {
    $details = ($gitCandidates | ForEach-Object { "$_" }) -join "`n"
    throw "git ls-files failed while building the source selection.`nGit diagnostic:`n$details"
}

# Used only for reporting how much ignored content is intentionally omitted.
$gitIgnored = @(& $git -C $Root -c core.quotepath=false ls-files -o -i --exclude-standard 2>&1)
$ignoredExit = $LASTEXITCODE
if ($ignoredExit -ne 0) {
    $details = ($gitIgnored | ForEach-Object { "$_" }) -join "`n"
    throw "Git could not enumerate ignored files.`nGit diagnostic:`n$details"
}

$version = Get-ProjectVersion -RepoRoot $Root -Branch $branch
$safeVersion = ($version -replace '[^0-9A-Za-z._-]', '_')
$ArchiveName = "IvritSheli-Source-v{0}-{1}.7z" -f $safeVersion, $Stamp
$ArchivePath = Join-Path $OutputDir $ArchiveName
$HashPath = $ArchivePath + ".sha256.txt"
$ReportPath = $ArchivePath + ".report.txt"

# ----------------------------- Select exact files ----------------------------
$selectedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$manualExcluded = New-Object System.Collections.Generic.List[string]
$sensitiveExcluded = New-Object System.Collections.Generic.List[string]
$missingCandidates = New-Object System.Collections.Generic.List[string]

foreach ($raw in $gitCandidates) {
    if ([string]::IsNullOrWhiteSpace($raw)) { continue }

    $rel = ($raw -replace '/', '\').TrimStart('\')

    if (Test-ManualToolingExclude $rel) {
        $manualExcluded.Add($rel)
        continue
    }

    if (Test-SensitivePath $rel) {
        $sensitiveExcluded.Add($rel)
        continue
    }

    $source = Join-Path $Root $rel
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        $missingCandidates.Add($rel)
        continue
    }

    [void]$selectedSet.Add($rel)
}

$selected = @($selectedSet | Sort-Object)
if ($selected.Count -eq 0) {
    throw "No source files were selected. Refusing to create an empty archive."
}

$selectedBytes = Get-FileBytes $selected

# Report ignored bytes that still exist as files.
$ignoredExisting = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($raw in $gitIgnored) {
    if ([string]::IsNullOrWhiteSpace($raw)) { continue }
    $rel = ($raw -replace '/', '\').TrimStart('\')
    $p = Join-Path $Root $rel
    if (Test-Path -LiteralPath $p -PathType Leaf) {
        [void]$ignoredExisting.Add($rel)
    }
}
$ignoredList = @($ignoredExisting)
$ignoredBytes = Get-FileBytes $ignoredList

# Get .git size separately for a truthful "not packaged" summary.
[int64]$gitMetadataBytes = 0
$gitMetadataPath = Join-Path $Root ".git"
if (Test-Path -LiteralPath $gitMetadataPath) {
    try {
        $gitMetadataBytes = [int64](
            (Get-ChildItem -LiteralPath $gitMetadataPath -Recurse -Force -File -ErrorAction SilentlyContinue |
                Measure-Object -Property Length -Sum).Sum
        )
    } catch {}
}

# Current physical tree size is only for the user-facing ratio.
# Exclude generated audit directories and this script/launcher from the logical
# decision, but physical total intentionally reflects what is on disk.
[int64]$physicalBytes = 0
[int64]$physicalFiles = 0
try {
    $physicalItems = @(
        Get-ChildItem -LiteralPath $Root -Recurse -Force -File -ErrorAction SilentlyContinue |
        Where-Object {
            $full = $_.FullName
            $rel = if ($full.StartsWith($Root + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
                $full.Substring($Root.Length + 1)
            } else {
                $full
            }
            -not (Test-ManualToolingExclude $rel)
        }
    )
    $physicalFiles = $physicalItems.Count
    $physicalBytes = [int64](($physicalItems | Measure-Object -Property Length -Sum).Sum)
} catch {}

Write-Host "Selection complete." -ForegroundColor Green
Write-Host ("  Working-tree changes: {0:N0}" -f $status.Count)
Write-Host ("  Source files selected: {0:N0}" -f $selected.Count)
Write-Host ("  Selected source size:   {0}" -f (Format-Bytes $selectedBytes)) -ForegroundColor Cyan
Write-Host ("  Git-ignored files:      {0:N0} ({1})" -f $ignoredList.Count, (Format-Bytes $ignoredBytes)) -ForegroundColor Yellow
Write-Host ("  .git metadata omitted:  {0}" -f (Format-Bytes $gitMetadataBytes)) -ForegroundColor Yellow
if ($sensitiveExcluded.Count -gt 0) {
    Write-Host ("  Sensitive paths blocked: {0:N0}" -f $sensitiveExcluded.Count) -ForegroundColor Red
}
Write-Host ""

# ----------------------------- Stage clean copy -------------------------------
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $StageProject -Force | Out-Null

try {
    Write-Host "Copying ONLY selected source files to temporary staging..." -ForegroundColor Cyan

    $copied = 0
    foreach ($rel in $selected) {
        $source = Join-Path $Root $rel
        $dest = Join-Path $StageProject $rel
        $destDir = Split-Path -Parent $dest

        if (-not (Test-Path -LiteralPath $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        Copy-Item -LiteralPath $source -Destination $dest -Force
        $copied++

        if (($copied % 100) -eq 0) {
            Write-Host ("  Copied {0:N0}/{1:N0}" -f $copied, $selected.Count) -ForegroundColor DarkGray
        }
    }

    # ------------------------- Package metadata -------------------------------
    $info = New-Object System.Collections.Generic.List[string]
    $info.Add("IVRITSHELI CLEAN SOURCE SNAPSHOT")
    $info.Add(("=" * 78))
    $info.Add("Generated:       " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"))
    $info.Add("Source root:     " + $Root)
    $info.Add("Git branch:      " + $branch)
    $info.Add("Git HEAD:        " + $head)
    $info.Add("Detected version:" + " " + $version)
    $info.Add(("Selected files:  {0:N0}" -f $selected.Count))
    $info.Add("Selected bytes:  " + (Format-Bytes $selectedBytes))
    $info.Add(("Working changes: {0:N0}" -f $status.Count))
    $info.Add("")
    $info.Add("SELECTION POLICY")
    $info.Add("- Included: Git-tracked files from the CURRENT working tree.")
    $info.Add("- Included: untracked files that are NOT ignored by standard Git excludes.")
    $info.Add("- Included: uncommitted modifications and legitimate new source files.")
    $info.Add("- Excluded: .git history/metadata.")
    $info.Add("- Excluded: all standard Git-ignored runtime/generated/local content.")
    $info.Add("- Excluded: Nova audit/compression helper files and audit/export folders.")
    $info.Add("- Blocked: real .env files, credential names and private-key extensions.")
    $info.Add("")
    $info.Add("IMPORTANT")
    $info.Add("This is a SOURCE snapshot, not a complete runtime or local-data backup.")
    $info.Add("Dependencies, downloaded models and local databases are intentionally omitted.")

    if ($status.Count -gt 0) {
        Write-Section -Lines $info -Title "GIT STATUS AT PACKAGING TIME"
        foreach ($line in $status) {
            $info.Add([string]$line)
        }
    }

    if ($sensitiveExcluded.Count -gt 0) {
        Write-Section -Lines $info -Title "SENSITIVE PATHS BLOCKED BY PACKAGER"
        foreach ($line in ($sensitiveExcluded | Sort-Object -Unique)) {
            $info.Add($line)
        }
    }

    $packageInfoPath = Join-Path $StageProject "00_PACKAGE_INFO.txt"
    $info | Set-Content -LiteralPath $packageInfoPath -Encoding UTF8

    $restore = @"
IVRITSHELI - RESTORE / REBUILD NOTES
==============================================================================

This archive contains the clean CURRENT source snapshot.

1) Extract the IvritSheli folder.

2) Frontend dependencies:
   cd frontend
   npm ci

3) Backend Python environment, from the project root:
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   pip install -r backend\requirements.txt

4) Configure environment:
   Copy the safe .env.example to your own local .env as appropriate.
   Do NOT commit or share real secrets.

5) Local runtime data intentionally NOT present:
   - data/models/* (including the downloaded Faster-Whisper model)
   - data/**/*.db* and SQLite local state
   - data/audio/*, data/private/*, backups/import artifacts
   - tmp/*
   - frontend/test-results/*
   - frontend/node_modules/*
   - .venv/*
   - .git/*

The application's own documented setup/start commands remain in the source
(README, START_*.bat, scripts, Docker files, package/requirements files).
"@
    $restore | Set-Content -LiteralPath (Join-Path $StageProject "00_RESTORE_SOURCE.txt") -Encoding UTF8

    # ------------------------- SHA-256 manifest inside archive ----------------
    Write-Host "Generating internal SHA-256 file manifest..." -ForegroundColor Cyan
    $manifestName = "00_PACKAGE_MANIFEST_SHA256.txt"
    $manifestPath = Join-Path $StageProject $manifestName
    $manifestLines = New-Object System.Collections.Generic.List[string]
    $manifestLines.Add("SHA-256 manifest for all files in this source snapshot except this manifest itself.")
    $manifestLines.Add("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"))
    $manifestLines.Add("")

    $stageFiles = @(
        Get-ChildItem -LiteralPath $StageProject -Recurse -Force -File |
        Where-Object { $_.FullName -ne $manifestPath } |
        Sort-Object FullName
    )

    foreach ($f in $stageFiles) {
        $hash = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $rel = $f.FullName.Substring($StageProject.Length + 1) -replace '\\','/'
        $manifestLines.Add("$hash  $rel")
    }
    $manifestLines | Set-Content -LiteralPath $manifestPath -Encoding UTF8

    # ------------------------- Compress ---------------------------------------
    Write-Host ""
    Write-Host "Compressing with 7-Zip / LZMA2 Ultra..." -ForegroundColor Cyan
    Write-Host "  Solid archive: ON"
    Write-Host "  LZMA2 level:   $CompressionLevel"
    Write-Host "  Dictionary:    64 MB (larger is unnecessary for this ~10 MB source set)"
    Write-Host "  Fast bytes:    273"
    Write-Host ""

    if (Test-Path -LiteralPath $ArchivePath) {
        Remove-Item -LiteralPath $ArchivePath -Force
    }

    Push-Location $StageRoot
    try {
        & $sevenZip a `
            "-t7z" `
            $ArchivePath `
            ".\IvritSheli" `
            "-mx=$CompressionLevel" `
            "-m0=lzma2" `
            "-md=64m" `
            "-mfb=273" `
            "-ms=on" `
            "-mmt=on" `
            "-bb1"

        $archiveExit = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($archiveExit -ne 0 -or -not (Test-Path -LiteralPath $ArchivePath -PathType Leaf)) {
        throw "7-Zip archive creation failed with exit code $archiveExit."
    }

    # ------------------------- Verify archive ---------------------------------
    Write-Host ""
    Write-Host "Testing archive integrity..." -ForegroundColor Cyan
    & $sevenZip t $ArchivePath "-bb0" | Out-Null
    $testExit = $LASTEXITCODE
    if ($testExit -ne 0) {
        throw "7-Zip integrity test FAILED with exit code $testExit. Do not trust this archive."
    }

    $archiveItem = Get-Item -LiteralPath $ArchivePath
    $archiveBytes = [int64]$archiveItem.Length
    $archiveHash = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()

    "$archiveHash  $ArchiveName" | Set-Content -LiteralPath $HashPath -Encoding ASCII

    $selectedReduction = if ($selectedBytes -gt 0) {
        [math]::Round((1 - ($archiveBytes / [double]$selectedBytes)) * 100, 2)
    } else { 0 }

    $physicalReduction = if ($physicalBytes -gt 0) {
        [math]::Round((1 - ($archiveBytes / [double]$physicalBytes)) * 100, 2)
    } else { 0 }

    # ------------------------- External report --------------------------------
    $report = New-Object System.Collections.Generic.List[string]
    $report.Add("IVRITSHELI CLEAN SOURCE PACKAGE REPORT")
    $report.Add(("=" * 78))
    $report.Add("Generated:              " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"))
    $report.Add("Branch:                 " + $branch)
    $report.Add("HEAD:                   " + $head)
    $report.Add("Version:                " + $version)
    $report.Add(("Working-tree changes:   {0:N0}" -f $status.Count))
    $report.Add(("Files selected:         {0:N0}" -f $selected.Count))
    $report.Add("Selected source size:    " + (Format-Bytes $selectedBytes))
    $report.Add(("Git-ignored files:      {0:N0}" -f $ignoredList.Count))
    $report.Add("Git-ignored size:        " + (Format-Bytes $ignoredBytes))
    $report.Add(".git metadata omitted:   " + (Format-Bytes $gitMetadataBytes))
    if ($physicalBytes -gt 0) {
        $report.Add(("Physical repo scan:       {0:N0} files / {1}" -f $physicalFiles, (Format-Bytes $physicalBytes)))
    }
    $report.Add("Final 7z size:           " + (Format-Bytes $archiveBytes))
    $report.Add(("7z vs selected reduction:{0,8:N2}%" -f $selectedReduction))
    if ($physicalBytes -gt 0) {
        $report.Add(("7z vs physical reduction:{0,8:N2}%" -f $physicalReduction))
    }
    $report.Add("Archive SHA-256:         " + $archiveHash)
    $report.Add("Archive:                 " + $ArchivePath)
    $report.Add("")
    $report.Add("INTENTIONAL EXCLUSIONS")
    $report.Add("- .git")
    $report.Add("- standard .gitignore content (.venv, node_modules, dist, tmp, test-results, local data/models/db/etc.)")
    $report.Add("- prior IvritSheli release ZIPs ignored by the repository")
    $report.Add("- audit/packaging tooling and generated audit folders")
    $report.Add("- real environment/secrets/key files")
    $report.Add("")
    $report.Add("The archive passed: 7z t")
    $report | Set-Content -LiteralPath $ReportPath -Encoding UTF8

    # ------------------------- Final console ----------------------------------
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host " SUCCESS - CLEAN SOURCE PACKAGE VERIFIED" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host ("Selected source: {0,12}  ({1:N0} files)" -f (Format-Bytes $selectedBytes), $selected.Count)
    Write-Host ("Final archive:   {0,12}" -f (Format-Bytes $archiveBytes)) -ForegroundColor Cyan
    if ($physicalBytes -gt 0) {
        Write-Host ("Physical tree:   {0,12}" -f (Format-Bytes $physicalBytes))
        Write-Host ("Total reduction: {0,11:N2}%" -f $physicalReduction) -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "Archive:" -ForegroundColor White
    Write-Host $ArchivePath -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SHA-256:" -ForegroundColor White
    Write-Host $archiveHash -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Sidecars:"
    Write-Host "  $HashPath"
    Write-Host "  $ReportPath"
    Write-Host ""

    try {
        Start-Process explorer.exe "/select,`"$ArchivePath`""
    } catch {}

} finally {
    # The ONLY deletion performed by this script: its own random TEMP staging copy.
    if (Test-Path -LiteralPath $StageRoot) {
        try {
            Remove-Item -LiteralPath $StageRoot -Recurse -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}

Read-Host "Press ENTER to close"
