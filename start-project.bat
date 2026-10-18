@echo off
title SmartJob AI - Full Stack Runner
echo =======================================================
echo Starting SmartJob AI (Backend + Frontend)...
echo =======================================================

:: Add standard Node.js installation paths to PATH if missing
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
if exist "%LOCALAPPDATA%\Programs\node" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
if exist "C:\Program Files (x86)\nodejs" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not recognized or not installed!
    echo Please install Node.js from https://nodejs.org/
    echo If already installed, close and reopen this terminal or IDE.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm was not found!
    echo Please verify your Node.js installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js and npm detected!
echo.
node run-all.js
pause

