#!/bin/bash

###############################################################################
# MCP Server Startup Script
# Automatically starts all required MCP servers for Sunzi Cerebro
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="/home/danii/Cerebrum/sunzi-cerebro-react-framework/backend/logs/mcp"
mkdir -p "$LOG_DIR"

echo -e "${GREEN}🚀 Starting MCP Servers for Sunzi Cerebro${NC}"
echo "=========================================="

###############################################################################
# Function: Check if process is running
###############################################################################
check_process() {
    local pattern=$1
    pgrep -f "$pattern" > /dev/null 2>&1
    return $?
}

###############################################################################
# Function: Start server with logging
###############################################################################
start_server() {
    local name=$1
    local command=$2
    local log_file=$3
    local check_pattern=$4

    echo -e "${YELLOW}➤ Starting $name...${NC}"

    # Check if already running
    if check_process "$check_pattern"; then
        echo -e "${GREEN}✓ $name is already running${NC}"
        return 0
    fi

    # Start the server
    eval "$command > $log_file 2>&1 &"
    local pid=$!

    # Wait for server to initialize
    sleep 3

    # Verify it started
    if check_process "$check_pattern"; then
        echo -e "${GREEN}✓ $name started successfully (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to start $name${NC}"
        echo -e "${YELLOW}Check logs: $log_file${NC}"
        return 1
    fi
}

###############################################################################
# 1. AttackMCP Server
###############################################################################
echo -e "\n${GREEN}1. AttackMCP FastMCP Server${NC}"
ATTACKMCP_DIR="/home/danii/attackmcp"
ATTACKMCP_VENV="$ATTACKMCP_DIR/attackmcp-venv"
ATTACKMCP_LOG="$LOG_DIR/attackmcp.log"

if [ -d "$ATTACKMCP_DIR" ]; then
    cd "$ATTACKMCP_DIR"

    # Activate virtual environment and start server
    start_server \
        "AttackMCP" \
        "source $ATTACKMCP_VENV/bin/activate && python server.py" \
        "$ATTACKMCP_LOG" \
        "server.py"
else
    echo -e "${RED}✗ AttackMCP directory not found: $ATTACKMCP_DIR${NC}"
fi

###############################################################################
# 2. Notion MCP Server
###############################################################################
echo -e "\n${GREEN}2. Notion MCP Server${NC}"
NOTION_DIR="/home/danii/attackmcp/warp_ai_integration"
NOTION_LOG="$LOG_DIR/notion-mcp.log"
NOTION_TOKEN="${NOTION_TOKEN:-ntn_T142672354291rL8erwWrk4rxchg1FEsMPqn4KGkWpN8vV}"

if [ -d "$NOTION_DIR" ]; then
    cd "$NOTION_DIR"

    # Start Notion MCP via npx
    start_server \
        "Notion MCP" \
        "NOTION_TOKEN=$NOTION_TOKEN npx -y @notionhq/client mcp-server-notion" \
        "$NOTION_LOG" \
        "@notionhq.*mcp"
else
    echo -e "${RED}✗ Notion MCP directory not found: $NOTION_DIR${NC}"
fi

###############################################################################
# 3. MCP-God-Mode Server
###############################################################################
echo -e "\n${GREEN}3. MCP-God-Mode Server${NC}"
GODMODE_DIR="/home/danii/MCP-God-Mode/dev"
GODMODE_LOG="$LOG_DIR/mcp-god-mode.log"

if [ -d "$GODMODE_DIR" ]; then
    cd "$GODMODE_DIR"

    # Start MCP-God-Mode
    start_server \
        "MCP-God-Mode" \
        "node dist/server-modular.js" \
        "$GODMODE_LOG" \
        "server-modular.js"
else
    echo -e "${RED}✗ MCP-God-Mode directory not found: $GODMODE_DIR${NC}"
fi

###############################################################################
# Summary
###############################################################################
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 MCP Server Startup Complete${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo "Active MCP Servers:"
echo "-------------------"

if check_process "server.py"; then
    echo -e "${GREEN}✓ AttackMCP (STDIO)${NC}"
else
    echo -e "${RED}✗ AttackMCP (STDIO) - Not Running${NC}"
fi

if check_process "@notionhq.*mcp"; then
    echo -e "${GREEN}✓ Notion MCP (STDIO)${NC}"
else
    echo -e "${RED}✗ Notion MCP (STDIO) - Not Running${NC}"
fi

if check_process "server-modular.js"; then
    echo -e "${GREEN}✓ MCP-God-Mode (STDIO)${NC}"
else
    echo -e "${RED}✗ MCP-God-Mode (STDIO) - Not Running${NC}"
fi

# Note: HexStrike AI runs separately
if check_process "hexstrike_server.py"; then
    echo -e "${GREEN}✓ HexStrike AI (HTTP) - Port 8888${NC}"
else
    echo -e "${YELLOW}⚠ HexStrike AI (HTTP) - Check if running separately${NC}"
fi

echo -e "\n${YELLOW}Logs available at: $LOG_DIR${NC}"
echo -e "${YELLOW}To monitor logs: tail -f $LOG_DIR/*.log${NC}\n"