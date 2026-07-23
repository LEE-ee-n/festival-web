@echo off
setlocal
title Festibom Ticket Discovery Report

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%USERPROFILE%\Documents\festibom\crawler\tools\run-manual-discovery.ps1"
set "RESULT=%ERRORLEVEL%"

echo.
if "%RESULT%"=="0" (
  echo RESULT: SUCCESS
) else (
  echo RESULT: FAILED - error code %RESULT%
)
pause
exit /b %RESULT%
