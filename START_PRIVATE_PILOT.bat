@echo off
setlocal
cd /d "%~dp0"
title Ivrit Sheli 2.12.3 - Mama Private Pilot
set "MOTHER_PILOT_DATA=%LOCALAPPDATA%\IvritSheli\pilots\mama"

echo.
echo   Ivrit Sheli private mother pilot
echo   This shares the local app only with devices on the same Wi-Fi.
echo   If Windows Firewall asks, allow Python on Private networks only.
echo   Keep this window and the PC open during the test.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" -BindAddress 0.0.0.0 -Port 8129 -DataDirectory "%MOTHER_PILOT_DATA%" -Language es -RequirePreferredPort %*
if errorlevel 1 (
    echo.
    echo Ivrit Sheli could not start. Review the error above, then press any key.
    pause >nul
)

endlocal
