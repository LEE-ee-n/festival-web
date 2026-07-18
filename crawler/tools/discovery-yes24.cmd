@echo off
setlocal
title Festival Crawler - YES24

set "PROJECT=%USERPROFILE%\Documents\Codex\festival-web-work"
set "CRAWLER_ROOT=%USERPROFILE%\Desktop\festival-crwaler"

echo ========================================
echo  SITE: YES24 TICKET
echo  JOB : Create YES24 discovery JSON
echo ========================================
echo.

if not exist "%PROJECT%\package.json" (
  echo ERROR: festival-web-work folder was not found.
  echo Checked: %PROJECT%
  pause
  exit /b 1
)

cd /d "%PROJECT%"
call npm run crawler:process:yes24 -- --root="%CRAWLER_ROOT%" --webhook-file="%CRAWLER_ROOT%\discord-webhook-url.txt" --open

if errorlevel 1 (
  echo.
  echo ERROR: Failed to process the YES24 JSON.
  echo Download a YES24 JSON with the bookmarklet and try again.
  pause
  exit /b 1
)

exit /b 0
