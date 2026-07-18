@echo off
setlocal
title Festival Crawler - TICKETLINK

set "PROJECT=%USERPROFILE%\Documents\Codex\festival-web-work"
set "CRAWLER_ROOT=%USERPROFILE%\Desktop\festival-crwaler"

echo ========================================
echo  SITE: TICKETLINK
echo  JOB : Create TICKETLINK discovery JSON
echo ========================================
echo.

if not exist "%PROJECT%\package.json" (
  echo ERROR: festival-web-work folder was not found.
  echo Checked: %PROJECT%
  pause
  exit /b 1
)

cd /d "%PROJECT%"
call npm run crawler:process:ticketlink -- --root="%CRAWLER_ROOT%" --webhook-file="%CRAWLER_ROOT%\discord-webhook-url.txt" --open

if errorlevel 1 (
  echo.
  echo ERROR: Failed to process the Ticketlink JSON.
  echo Download a Ticketlink JSON with the bookmarklet and try again.
  pause
  exit /b 1
)

exit /b 0
