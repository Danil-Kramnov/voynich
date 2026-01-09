#!/bin/bash

# Voynich - Stop All Services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Stopping Voynich Services ===${NC}"
echo ""

stop_service() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null
            sleep 1
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            echo -e "${GREEN}[OK] $name stopped${NC}"
        else
            echo -e "${YELLOW}$name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}$name PID file not found${NC}"
    fi
}

# Stop services
stop_service "celery"
stop_service "fastapi"

# Also kill any orphaned processes
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "celery -A celery_app" 2>/dev/null || true

echo ""
echo -e "${GREEN}All Voynich services stopped.${NC}"
