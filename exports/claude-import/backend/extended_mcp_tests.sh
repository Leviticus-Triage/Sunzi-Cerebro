#!/bin/bash

echo "🔌 EXTENDED MCP SERVER TESTING"
echo "=============================="

AUTH_TOKEN="mock-jwt-token-test"

# Test additional MCP endpoints
echo -e "\n1. MCP GOD MODE SERVER TEST"
MCP_GODMODE=$(curl -s http://localhost:8890/api/mcp/god-mode/status \
  -H "Authorization: Bearer $AUTH_TOKEN")
echo "$MCP_GODMODE"

if echo "$MCP_GODMODE" | grep -q '"isRunning":true'; then
  echo "✅ MCP God Mode: ACTIVE"
  
  # Test God Mode tools
  GODMODE_TOOLS=$(curl -s http://localhost:8890/api/mcp/god-mode/tools \
    -H "Authorization: Bearer $AUTH_TOKEN")
  echo -e "\nMCP God Mode Tools:"
  echo "$GODMODE_TOOLS" | head -300
else
  echo "❌ MCP God Mode: OFFLINE"
fi

echo -e "\n2. HEXSTRIKE AI SERVER TEST"
HEXSTRIKE_STATUS=$(curl -s http://localhost:8888/health 2>/dev/null || echo '{"error":"server_offline"}')
echo "$HEXSTRIKE_STATUS"

if echo "$HEXSTRIKE_STATUS" | grep -q '"status":"healthy"'; then
  echo "✅ HexStrike AI: ONLINE"
else
  echo "❌ HexStrike AI: OFFLINE (Expected - not running)"
fi

echo -e "\n3. MCP SERVERS INVENTORY"
MCP_SERVERS=$(curl -s http://localhost:8890/api/mcp/servers \
  -H "Authorization: Bearer $AUTH_TOKEN")
echo "$MCP_SERVERS"

echo -e "\n4. MCP TOOLS COMPREHENSIVE LIST"
MCP_TOOLS_ALL=$(curl -s http://localhost:8890/api/mcp/tools \
  -H "Authorization: Bearer $AUTH_TOKEN")
echo "$MCP_TOOLS_ALL" | head -400

echo -e "\n5. WEBSOCKET CONNECTION TEST"
# Test WebSocket endpoint
WS_RESPONSE=$(curl -s -I http://localhost:8890/socket.io/ 2>/dev/null | head -5)
echo "WebSocket Response Headers:"
echo "$WS_RESPONSE"

if echo "$WS_RESPONSE" | grep -q "200\|101"; then
  echo "✅ WebSocket: ACCESSIBLE"
else
  echo "❌ WebSocket: CONNECTION ISSUES"
fi

echo -e "\n🧪 MCP EXTENDED TESTING COMPLETED"
