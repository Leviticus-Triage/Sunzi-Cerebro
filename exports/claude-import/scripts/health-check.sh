#!/bin/bash
# Sunzi Cerebro - System Health Check Script
# Version: 1.0.0

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏥 Sunzi Cerebro - System Health Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed. Please install curl first.${NC}"
    exit 1
fi

# Check if jq is installed (optional but recommended)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Installing for better output...${NC}"
    # Uncomment if you want auto-install
    # sudo apt-get install -y jq 2>/dev/null || echo "Please install jq manually"
fi

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8890"
BACKEND_HEALTH="${BACKEND_URL}/health"

OVERALL_STATUS="HEALTHY"

# Check Frontend
echo -n "Checking Frontend (Port 3000)... "
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${FRONTEND_URL}" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ ONLINE${NC}"
else
    echo -e "${RED}❌ OFFLINE${NC}"
    OVERALL_STATUS="UNHEALTHY"
fi

# Check Backend API
echo -n "Checking Backend API (Port 8890)... "
BACKEND_STATUS=$(curl -s --max-time 5 "${BACKEND_HEALTH}" 2>/dev/null)
if [ $? -eq 0 ] && echo "$BACKEND_STATUS" | grep -q "OK"; then
    echo -e "${GREEN}✅ ONLINE${NC}"

    # Parse health check response
    if command -v jq &> /dev/null; then
        echo ""
        echo -e "${BLUE}Backend Health Details:${NC}"
        echo "$BACKEND_STATUS" | jq -r '
            "  Status: \(.status)",
            "  Uptime: \(.uptime // 0 | tonumber | floor)s",
            "  Version: \(.version)",
            "  Services:",
            "    - API: \(.services.api)",
            "    - WebSocket: \(.services.websocket)",
            "    - Database: \(.services.database)",
            "    - MCP: \(.services.mcp_production)",
            "    - Auth: \(.services.auth_production)"
        ' 2>/dev/null || echo "$BACKEND_STATUS"
    fi
else
    echo -e "${RED}❌ OFFLINE${NC}"
    OVERALL_STATUS="UNHEALTHY"
fi

# Check Database
echo ""
echo -n "Checking Database... "
if [ -f "../data/sunzi_cerebro_dev.sqlite" ] || [ -f "data/sunzi_cerebro_dev.sqlite" ]; then
    echo -e "${GREEN}✅ CONNECTED${NC}"
else
    echo -e "${YELLOW}⚠️  Database file not found${NC}"
    OVERALL_STATUS="WARNING"
fi

# Check Ports
echo ""
echo -e "${BLUE}Port Status:${NC}"
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "  Port $port ($name): ${GREEN}✅ LISTENING${NC}"
    else
        echo -e "  Port $port ($name): ${RED}❌ NOT LISTENING${NC}"
        OVERALL_STATUS="UNHEALTHY"
    fi
}

check_port 3000 "Frontend"
check_port 8890 "Backend API"

# Check Node.js
echo ""
echo -n "Node.js version: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}$NODE_VERSION ✅${NC}"
else
    echo -e "${RED}NOT INSTALLED ❌${NC}"
    OVERALL_STATUS="UNHEALTHY"
fi

# Check npm
echo -n "npm version: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}v$NPM_VERSION ✅${NC}"
else
    echo -e "${RED}NOT INSTALLED ❌${NC}"
    OVERALL_STATUS="UNHEALTHY"
fi

# Check Disk Space
echo ""
echo -e "${BLUE}System Resources:${NC}"
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
echo -n "  Disk usage: $DISK_USAGE% "
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅${NC}"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    OVERALL_STATUS="WARNING"
else
    echo -e "${RED}❌ CRITICAL${NC}"
    OVERALL_STATUS="CRITICAL"
fi

# Check Memory
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100}')
    echo -n "  Memory usage: $MEMORY_USAGE% "
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✅${NC}"
    elif [ "$MEMORY_USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠️  WARNING${NC}"
    else
        echo -e "${RED}❌ HIGH${NC}"
    fi
fi

# Final Status
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$OVERALL_STATUS" == "HEALTHY" ]; then
    echo -e "${GREEN}🎯 System Status: HEALTHY ✅${NC}"
    exit 0
elif [ "$OVERALL_STATUS" == "WARNING" ]; then
    echo -e "${YELLOW}⚠️  System Status: WARNING${NC}"
    exit 0
else
    echo -e "${RED}❌ System Status: UNHEALTHY${NC}"
    echo -e "${YELLOW}Please check the above errors and restart services.${NC}"
    exit 1
fi
