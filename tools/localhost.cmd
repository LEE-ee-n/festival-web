@echo off
setlocal

cd /d "%~dp0.."
if errorlevel 1 exit /b 1

echo Festibom: http://localhost:3000
npm.cmd run dev
