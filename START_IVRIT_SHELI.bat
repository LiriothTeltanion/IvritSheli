@echo off
setlocal
cd /d "%~dp0"
title Ivrit Sheli - Private Learning Space

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" %*
if errorlevel 1 (
    echo.
    echo Ivrit Sheli could not start. Review the error above, then press any key.
    pause >nul
)

endlocal
