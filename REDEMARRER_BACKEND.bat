@echo off
echo.
echo ========================================
echo   Redemarrage Force du Backend
echo ========================================
echo.

echo Arret de tous les processus Python/Uvicorn...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Demarrage du backend avec Gemini AI...
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
