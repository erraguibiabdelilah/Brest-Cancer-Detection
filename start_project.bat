@echo off
echo.
echo ========================================
echo   Breast Cancer Detection - Demarrage
echo ========================================
echo.

echo [1/2] Demarrage du Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du Frontend (Angular)...
start "Frontend - Angular" cmd /k "cd frontEnd && npm start"

echo.
echo ========================================
echo   Projet demarre avec succes !
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:4200
echo.
echo Attendez 1-2 minutes que le frontend demarre...
echo.
echo Appuyez sur une touche pour ouvrir l'application...
pause >nul
start http://localhost:4200
