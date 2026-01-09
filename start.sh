#!/bin/bash

# Voynich - Start All Services
# This script starts all required services for the Voynich audiobook converter

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"
mkdir -p "$SCRIPT_DIR/data/uploads" "$SCRIPT_DIR/data/outputs" "$SCRIPT_DIR/data/voices"

echo -e "${GREEN}=== Voynich Audiobook Converter ===${NC}"
echo ""

# Check if services are already running
check_running() {
    if [ -f "$PID_DIR/$1.pid" ]; then
        pid=$(cat "$PID_DIR/$1.pid")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}$1 is already running (PID: $pid)${NC}"
            return 0
        fi
    fi
    return 1
}

# Check prerequisites
echo "Checking prerequisites..."

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}Redis is not running. Starting Redis...${NC}"
    if command -v brew &> /dev/null; then
        brew services start redis 2>/dev/null || redis-server --daemonize yes
    else
        redis-server --daemonize yes
    fi
    sleep 2
fi
echo -e "${GREEN}[OK] Redis is running${NC}"

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}[WARN] PostgreSQL may not be running. Please ensure it's started.${NC}"
    echo "  On macOS: brew services start postgresql"
    echo "  On Linux: sudo systemctl start postgresql"
else
    echo -e "${GREEN}[OK] PostgreSQL is running${NC}"
fi

echo ""

# Activate virtual environment
cd "$BACKEND_DIR"
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo -e "${RED}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head 2>/dev/null || echo -e "${YELLOW}[WARN] Migration failed or already up to date${NC}"

echo ""

# Start FastAPI server
if ! check_running "fastapi"; then
    echo "Starting FastAPI server..."
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/fastapi.log" 2>&1 &
    echo $! > "$PID_DIR/fastapi.pid"
    sleep 2
    echo -e "${GREEN}[OK] FastAPI server started on http://localhost:8000${NC}"
fi

# Start Celery worker
if ! check_running "celery"; then
    echo "Starting Celery worker..."
    nohup celery -A celery_app worker --loglevel=info --queues=conversions > "$LOG_DIR/celery.log" 2>&1 &
    echo $! > "$PID_DIR/celery.pid"
    sleep 2
    echo -e "${GREEN}[OK] Celery worker started${NC}"
fi

echo ""
echo -e "${GREEN}=== All services started! ===${NC}"
echo ""
echo "Access the API at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Logs are available at:"
echo "  - FastAPI: $LOG_DIR/fastapi.log"
echo "  - Celery:  $LOG_DIR/celery.log"
echo ""
echo "To stop all services, run: ./stop.sh"
