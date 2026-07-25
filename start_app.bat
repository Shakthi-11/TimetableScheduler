@echo off
title Starting Timetable Scheduler ERP
echo ========================================================
echo         Launching Timetable Scheduler ERP...
echo ========================================================
echo.

:: Start Backend API in background
echo Starting Backend API Server (Port 8000)...
start "Timetable Backend API" /min cmd /k "python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Start Frontend UI in background
echo Starting Frontend UI Server (Port 5173)...
start "Timetable Frontend UI" /min cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host"

:: Wait 4 seconds for servers to start
echo Waiting for servers to initialize...
timeout /t 4 /nobreak > nul

:: Open the default browser to the web app
echo Opening App in Web Browser...
start http://localhost:5173

echo.
echo ========================================================
echo  Timetable Scheduler is active!
echo  - Local URL:   http://localhost:5173
echo  - Network URL: http://^<YOUR-IP-ADDRESS^>:5173
echo ========================================================
echo.
pause
