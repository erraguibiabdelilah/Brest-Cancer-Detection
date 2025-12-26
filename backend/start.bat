@echo off
echo ========================================
echo Breast Cancer Detection API with Gemini AI
echo ========================================
echo.

REM Check if GEMINI_API_KEY is set
if "%GEMINI_API_KEY%"=="" (
    echo WARNING: GEMINI_API_KEY not set!
    echo.
    echo The system will use fallback static content.
    echo To enable AI-generated reports:
    echo   1. Get API key from: https://makersuite.google.com/app/apikey
    echo   2. Set it with: set GEMINI_API_KEY=your_key_here
    echo   3. Or create a .env file with: GEMINI_API_KEY=your_key_here
    echo.
    pause
) else (
    echo ✓ GEMINI_API_KEY is configured
    echo ✓ AI-generated reports enabled
    echo.
)

echo Starting FastAPI server...
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
