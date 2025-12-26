@echo off
echo.
echo ========================================
echo   Arret des serveurs...
echo ========================================
echo.

echo Arret du Backend (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo Arret du Frontend (port 4200)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4200" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo.
echo ========================================
echo   Serveurs arretes !
echo ========================================
echo.
pause
