@echo off
echo.
echo ========================================
echo   Redemarrage du Backend
echo ========================================
echo.

echo Arret du serveur actuel...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak >nul

echo Demarrage du serveur optimise...
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
