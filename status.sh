#!/bin/bash

# Voynich - Check Service Status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Voynich Service Status ===${NC}"
echo ""

check_service() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${GREEN}[RUNNING]${NC} $name (PID: $pid)"
            return 0
        fi
    fi
    echo -e "${RED}[STOPPED]${NC} $name"
    return 1
}

# Check external services
echo "External Services:"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}[RUNNING]${NC} Redis"
else
    echo -e "  ${RED}[STOPPED]${NC} Redis"
fi

if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}[RUNNING]${NC} PostgreSQL"
else
    echo -e "  ${RED}[STOPPED]${NC} PostgreSQL"
fi

echo ""
echo "Voynich Services:"
echo -n "  "
check_service "fastapi"
echo -n "  "
check_service "celery"

echo ""

# Check if API is responding
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "API Health: ${GREEN}[OK]${NC} http://localhost:8000"
    echo -e "API Docs:   ${GREEN}[OK]${NC} http://localhost:8000/docs"
else
    echo -e "API Health: ${RED}[NOT RESPONDING]${NC}"
fi
