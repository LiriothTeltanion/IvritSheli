@echo off
setlocal
cd /d "%~dp0"

echo.
echo ==============================================================================
echo  IVRITSHELI - CLEAN SOURCE PACKAGER v2
echo  Git -C robust mode for OneDrive / PowerShell
echo ==============================================================================
echo  Keeps current source + legitimate untracked work.
echo  Omits dependencies, caches, local models/data, test output, .git and secrets.
echo  Does NOT delete or modify the project.
echo.

where pwsh.exe >nul 2>nul
if %errorlevel%==0 (
    pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Compress-IvritSheli-Clean-v2.ps1"
) else (
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Compress-IvritSheli-Clean-v2.ps1"
)

if errorlevel 1 (
    echo.
    echo ==============================================================================
    echo  PACKAGING FAILED
    echo ==============================================================================
    echo  Copy the complete Git diagnostic shown above and send it to Nova.
    pause
)

endlocal
