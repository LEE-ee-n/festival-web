@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows-scheduled-task.ps1" %*
exit /b %ERRORLEVEL%
