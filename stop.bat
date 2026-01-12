@echo off
echo === Stopping Voynich Services ===
echo.

:: Kill FastAPI (uvicorn)
echo Stopping FastAPI...
taskkill /FI "WINDOWTITLE eq Voynich-FastAPI*" /F >nul 2>&1
taskkill /IM uvicorn.exe /F >nul 2>&1

:: Kill Celery
echo Stopping Celery...
taskkill /FI "WINDOWTITLE eq Voynich-Celery*" /F >nul 2>&1
taskkill /IM celery.exe /F >nul 2>&1

echo.
echo [OK] Services stopped
echo.
echo Docker containers (Redis, PostgreSQL) are still running.
echo To stop them: docker stop redis postgres
pause
