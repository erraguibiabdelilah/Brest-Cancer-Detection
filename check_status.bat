@echo off
echo.
echo ========================================
echo   Verification de l'etat des serveurs
echo ========================================
echo.

echo [Backend - Port 8000]
netstat -an | find ":8000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo Status: EN LIGNE
    echo URL:    http://localhost:8000
) else (
    echo Status: HORS LIGNE
    echo Action: Demarrez avec start_project.bat
)

echo.
echo [Frontend - Port 4200]
netstat -an | find ":4200" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo Status: EN LIGNE
    echo URL:    http://localhost:4200
) else (
    echo Status: HORS LIGNE ou EN DEMARRAGE
    echo Action: Attendez ou demarrez avec start_project.bat
)

echo.
echo ========================================
echo   Appuyez sur une touche pour quitter
echo ========================================
pause >nul
