#!/bin/bash
# Sunzi Cerebro - Stop All Services Script
# Version: 1.0.0

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🛑 Sunzi Cerebro - Stopping All Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Stop Frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -n "Stopping Frontend (PID: $FRONTEND_PID)... "
        kill -15 $FRONTEND_PID 2>/dev/null
        sleep 2
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        rm logs/frontend.pid
        echo -e "${GREEN}✅ Stopped${NC}"
    else
        echo -e "${RED}Frontend process not running${NC}"
        rm logs/frontend.pid
    fi
else
    # Try to kill by port
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -n "Stopping Frontend (port 3000)... "
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Stopped${NC}"
    fi
fi

# Stop Backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -n "Stopping Backend (PID: $BACKEND_PID)... "
        kill -15 $BACKEND_PID 2>/dev/null
        sleep 2
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        rm logs/backend.pid
        echo -e "${GREEN}✅ Stopped${NC}"
    else
        echo -e "${RED}Backend process not running${NC}"
        rm logs/backend.pid
    fi
else
    # Try to kill by port
    if lsof -Pi :8890 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -n "Stopping Backend (port 8890)... "
        lsof -ti:8890 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Stopped${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 All services stopped${NC}"
echo ""
