@echo off
setlocal
cd /d "%~dp0"
title Ivrit Sheli 2.8 - Mother Pilot
set "MOTHER_PILOT_DATA=%LOCALAPPDATA%\IvritSheli\pilots\mother-final-v2.8"

echo.
echo   Ivrit Sheli private mother pilot
echo   This shares the local app only with devices on the same Wi-Fi.
echo   If Windows Firewall asks, allow Python on Private networks only.
echo   Keep this window and the PC open during the test.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" -BindAddress 0.0.0.0 -Port 8127 -DataDirectory "%MOTHER_PILOT_DATA%" -Language es -RequirePreferredPort %*
if errorlevel 1 (
    echo.
    echo Ivrit Sheli could not start. Review the error above, then press any key.
    pause >nul
)

endlocal
