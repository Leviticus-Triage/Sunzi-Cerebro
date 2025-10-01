#!/bin/bash

###############################################################################
# MCP Server Restart Script
# Stops and starts all MCP servers
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting MCP Servers..."
echo "============================="

# Stop all servers
echo "Step 1: Stopping all MCP servers..."
bash "$SCRIPT_DIR/stop-mcp-servers.sh"

# Wait a moment
echo ""
echo "Waiting 3 seconds before restart..."
sleep 3

# Start all servers
echo ""
echo "Step 2: Starting all MCP servers..."
bash "$SCRIPT_DIR/start-mcp-servers.sh"

echo ""
echo "✅ MCP Server Restart Complete!"