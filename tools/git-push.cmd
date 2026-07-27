@echo off
setlocal

cd /d "%~dp0.."
if errorlevel 1 exit /b 1

if "%~1"=="" (
  echo Usage: tools\git-push "commit message"
  exit /b 1
)

git add -A
if errorlevel 1 exit /b 1

git status --short
git commit -m "%~1"
if errorlevel 1 exit /b 1

git push
