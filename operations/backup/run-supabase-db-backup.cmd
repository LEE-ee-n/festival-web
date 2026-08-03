@echo off
setlocal

if "%~1"=="" (
  echo Usage: run-supabase-db-backup.cmd "BACKUP_DESTINATION"
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-supabase-db-backup.ps1" -Destination "%~1"
exit /b %ERRORLEVEL%
