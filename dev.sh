#!/bin/bash

# Voynich - Development Mode
# Starts servers with auto-reload for development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Voynich Development Mode ===${NC}"
echo ""

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}Redis is not running. Please start Redis first:${NC}"
    echo "  brew services start redis  (macOS)"
    echo "  sudo systemctl start redis (Linux)"
    exit 1
fi

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}[WARN] PostgreSQL may not be running${NC}"
fi

cd "$BACKEND_DIR"
source venv/bin/activate

# Run migrations
alembic upgrade head 2>/dev/null || true

echo ""
echo "Starting in development mode with auto-reload..."
echo "Press Ctrl+C to stop"
echo ""
echo -e "${YELLOW}Note: Open a second terminal and run:${NC}"
echo "  cd $BACKEND_DIR && source venv/bin/activate"
echo "  celery -A celery_app worker --loglevel=info --queues=conversions"
echo ""

# Start FastAPI with reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
