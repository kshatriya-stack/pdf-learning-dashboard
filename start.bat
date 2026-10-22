@echo off
setlocal
title AeroLearn OS - PDF-Grounded Daily Learning Dashboard

echo =======================================================
echo   AeroLearn OS: PDF-Grounded Daily Learning Dashboard
echo   Grounded in Azure Data Engineering ^& Power BI Curriculums
echo =======================================================
echo.

set "PATH=C:\Users\SHUBH\.tools\nodejs;C:\Users\SHUBH\.tools\git\cmd;%PATH%"

cd /d "%~dp0"

if not exist node_modules (
  echo [Info] Installing dependencies...
  call npm install
)

if not exist data\curriculum.json (
  echo [Info] Generating authoritative curriculum manifest...
  call node generate_curriculum.js
)

echo [Info] Launching browser to http://localhost:3001 ...
start "" "http://localhost:3001"

echo [Info] Starting Express backend server on port 3001...
npm start

pause
