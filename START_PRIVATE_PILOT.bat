@echo off
setlocal
cd /d "%~dp0"
title Ivrit Sheli 2.12.3 - Mama Private Pilot
set "MOTHER_PILOT_DATA=%LOCALAPPDATA%\IvritSheli\pilots\mama"

REM SEC-05. This used to bind 0.0.0.0 and print a Wi-Fi link to send over
REM WhatsApp. That put a WRITABLE local workspace on the home network with
REM local authentication off by default, so any device already on the wifi
REM could change a learner's data. The pilot link is now the hosted staging
REM service, which has HTTPS, real authentication and the real database.

echo.
echo   Ivrit Sheli private mother pilot
echo.
echo   To let her try it on her own phone, send her this link:
echo.
echo     https://ivrit-sheli-staging.onrender.com/?lang=es
echo.
echo   Open it yourself first and wait for it to load. The free hosting puts
echo   the service to sleep after 15 minutes and it takes about 25 seconds to
echo   wake, which reads as a broken app to someone who is not a developer.
echo.
echo   This window starts the app on THIS computer only, at 127.0.0.1, for
echo   testing beside her.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" -Port 8129 -DataDirectory "%MOTHER_PILOT_DATA%" -Language es -RequirePreferredPort %*
if errorlevel 1 (
    echo.
    echo Ivrit Sheli could not start. Review the error above, then press any key.
    pause >nul
)

endlocal
