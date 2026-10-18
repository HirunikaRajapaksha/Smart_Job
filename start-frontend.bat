@echo off
title SmartJob AI - Frontend Runner
echo =======================================================
echo Starting SmartJob AI Frontend (Port 5173)...
echo =======================================================

if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
if exist "%LOCALAPPDATA%\Programs\node" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
if exist "C:\Program Files (x86)\nodejs" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

cd client
npm run dev
pause
