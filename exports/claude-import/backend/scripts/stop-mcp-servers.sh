#!/bin/bash

###############################################################################
# MCP Server Shutdown Script
# Gracefully stops all MCP servers
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping MCP Servers...${NC}"
echo "==============================="

###############################################################################
# Function: Stop process by pattern
###############################################################################
stop_process() {
    local name=$1
    local pattern=$2

    echo -e "\n${YELLOW}➤ Stopping $name...${NC}"

    # Find PIDs
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)

    if [ -z "$pids" ]; then
        echo -e "${YELLOW}⚠ $name is not running${NC}"
        return 0
    fi

    # Send SIGTERM for graceful shutdown
    for pid in $pids; do
        echo -e "${YELLOW}  Sending SIGTERM to PID $pid...${NC}"
        kill -TERM "$pid" 2>/dev/null || true
    done

    # Wait up to 5 seconds for graceful shutdown
    local count=0
    while [ $count -lt 5 ]; do
        if ! pgrep -f "$pattern" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name stopped gracefully${NC}"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done

    # Force kill if still running
    pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${RED}⚠ Force killing $name...${NC}"
        for pid in $pids; do
            kill -KILL "$pid" 2>/dev/null || true
        done
        echo -e "${GREEN}✓ $name force killed${NC}"
    fi
}

###############################################################################
# Stop all MCP servers
###############################################################################

# 1. AttackMCP
stop_process "AttackMCP" "/home/danii/attackmcp/server.py"

# 2. Notion MCP
stop_process "Notion MCP" "@notionhq.*mcp"

# 3. MCP-God-Mode
stop_process "MCP-God-Mode" "server-modular.js"

# Note: HexStrike AI is typically long-running, ask before stopping
echo -e "\n${YELLOW}ℹ HexStrike AI (hexstrike_server.py) is still running${NC}"
echo -e "${YELLOW}  To stop it manually: pkill -f hexstrike_server.py${NC}"

###############################################################################
# Summary
###############################################################################
echo -e "\n${GREEN}===============================${NC}"
echo -e "${GREEN}✅ MCP Server Shutdown Complete${NC}"
echo -e "${GREEN}===============================${NC}\n"

# Verify all stopped
echo "Current MCP Server Status:"
echo "--------------------------"

if pgrep -f "server.py" > /dev/null 2>&1; then
    echo -e "${RED}✗ AttackMCP - Still Running${NC}"
else
    echo -e "${GREEN}✓ AttackMCP - Stopped${NC}"
fi

if pgrep -f "@notionhq.*mcp" > /dev/null 2>&1; then
    echo -e "${RED}✗ Notion MCP - Still Running${NC}"
else
    echo -e "${GREEN}✓ Notion MCP - Stopped${NC}"
fi

if pgrep -f "server-modular.js" > /dev/null 2>&1; then
    echo -e "${RED}✗ MCP-God-Mode - Still Running${NC}"
else
    echo -e "${GREEN}✓ MCP-God-Mode - Stopped${NC}"
fi

echo ""