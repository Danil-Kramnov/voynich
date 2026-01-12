@echo off
echo === Voynich Audiobook Converter ===
echo.

:: Create directories
if not exist "logs" mkdir logs
if not exist "data\uploads" mkdir data\uploads
if not exist "data\outputs" mkdir data\outputs
if not exist "data\voices" mkdir data\voices

:: Check Docker containers
echo Checking Docker containers...
docker ps | findstr redis >nul 2>&1
if errorlevel 1 (
    echo Starting Redis...
    docker start redis 2>nul || docker run -d --name redis -p 6379:6379 redis
)
docker ps | findstr postgres >nul 2>&1
if errorlevel 1 (
    echo Starting PostgreSQL...
    docker start postgres 2>nul || docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=yourpassword postgres
)
echo [OK] Docker containers running
echo.

:: Start FastAPI in new window
echo Starting FastAPI server...
start "Voynich-FastAPI" cmd /k "cd /d %~dp0backend && ..\venv\Scripts\activate && uvicorn main:app --reload"

:: Wait a moment
timeout /t 3 /nobreak >nul

:: Start Celery in new window
echo Starting Celery worker...
start "Voynich-Celery" cmd /k "cd /d %~dp0backend && ..\venv\Scripts\activate && celery -A celery_app worker --loglevel=info --pool=solo -Q conversions"

echo.
echo === All services started! ===
echo.
echo Access the app at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Two new windows opened for FastAPI and Celery.
echo Close those windows to stop services, or run stop.bat
pause
