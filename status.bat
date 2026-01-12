@echo off
echo === Voynich Service Status ===
echo.

echo Docker containers:
docker ps --format "  {{.Names}}: {{.Status}}" --filter "name=redis" --filter "name=postgres" 2>nul || echo   Docker not running

echo.
echo FastAPI (uvicorn):
tasklist /FI "IMAGENAME eq uvicorn.exe" 2>nul | findstr uvicorn >nul && echo   Running || echo   Not running

echo.
echo Celery:
tasklist /FI "IMAGENAME eq celery.exe" 2>nul | findstr celery >nul && echo   Running || echo   Not running

echo.
pause
