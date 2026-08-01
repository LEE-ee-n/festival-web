@echo off
setlocal
chcp 65001 >nul

set "SOURCE=%~dp0..\src"
set "TARGET=%USERPROFILE%\Documents\Codex\2026-07-19\11-11-url-url-url-instagram\src"

if not exist "%TARGET%\bot.js" (
  echo ERROR: Bot runtime folder was not found.
  echo %TARGET%
  exit /b 1
)

copy /b /y "%SOURCE%\bot.js" "%TARGET%\bot.js"
if errorlevel 1 exit /b 2
copy /b /y "%SOURCE%\discordAttachment.js" "%TARGET%\discordAttachment.js"
if errorlevel 1 exit /b 3
copy /b /y "%SOURCE%\discordReplacement.js" "%TARGET%\discordReplacement.js"
if errorlevel 1 exit /b 4
copy /b /y "%SOURCE%\ticketExclusion.js" "%TARGET%\ticketExclusion.js"
if errorlevel 1 exit /b 5

echo Bot runtime copy complete.
exit /b 0
