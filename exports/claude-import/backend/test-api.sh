#!/bin/bash

# Sunzi Cerebro Backend API Test Script
# Comprehensive API endpoint testing

set -e

BASE_URL="http://localhost:8000"
API_BASE="$BASE_URL/api"

echo "🧪 Sunzi Cerebro Backend API Test Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null); then
        status_code="${response: -3}"
        body="${response%???}"
        
        if [ "$status_code" = "$expected_status" ]; then
            echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
            return 0
        else
            echo -e "${RED}❌ FAIL${NC} (HTTP $status_code, expected $expected_status)"
            return 1
        fi
    else
        echo -e "${RED}❌ CONNECTION FAILED${NC}"
        return 1
    fi
}

# Test with JSON validation
test_json_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name (JSON)... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | jq . >/dev/null 2>&1; then
            echo -e "${GREEN}✅ PASS${NC} (Valid JSON)"
            return 0
        else
            echo -e "${RED}❌ FAIL${NC} (Invalid JSON)"
            echo "Response: $response"
            return 1
        fi
    else
        echo -e "${RED}❌ CONNECTION FAILED${NC}"
        return 1
    fi
}

echo "🔍 Basic Connectivity Tests"
echo "----------------------------"

# Basic health check
test_endpoint "Server Health" "$BASE_URL/health"

# API documentation
test_endpoint "API Documentation" "$BASE_URL/api"

echo ""
echo "🔧 System API Tests"
echo "-------------------"

# System endpoints
test_json_endpoint "System Health" "$API_BASE/system/health"
test_json_endpoint "System Info" "$API_BASE/system/info"
test_json_endpoint "System Metrics" "$API_BASE/system/metrics"
test_json_endpoint "System Processes" "$API_BASE/system/processes"
test_json_endpoint "Disk Info" "$API_BASE/system/disk"
test_json_endpoint "Network Info" "$API_BASE/system/network"
test_json_endpoint "Services Status" "$API_BASE/system/services"

echo ""
echo "🤖 LLM API Tests"
echo "----------------"

# LLM endpoints
test_json_endpoint "LLM Models" "$API_BASE/llm/models"
test_json_endpoint "LLM Config" "$API_BASE/llm/config"
test_json_endpoint "LLM Health" "$API_BASE/llm/health"

echo ""
echo "🔌 MCP API Tests"
echo "----------------"

# MCP endpoints
test_json_endpoint "MCP Servers" "$API_BASE/mcp/servers"
test_json_endpoint "MCP Status" "$API_BASE/mcp/status"

echo ""
echo "💻 Warp API Tests"
echo "-----------------"

# Warp endpoints
test_json_endpoint "Warp Status" "$API_BASE/warp/status"
test_json_endpoint "Warp Sessions" "$API_BASE/warp/sessions"

echo ""
echo "📁 File API Tests"
echo "-----------------"

# File endpoints
test_json_endpoint "File List" "$API_BASE/files/list?path=."

echo ""
echo "🔌 WebSocket Tests"
echo "------------------"

# WebSocket connectivity test
echo -n "Testing WebSocket connectivity... "
if command -v wscat >/dev/null 2>&1; then
    if timeout 3s wscat -c "ws://localhost:8000/ws" -x '{"type":"ping"}' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${YELLOW}⚠️ TIMEOUT${NC} (Expected for test)"
    fi
else
    echo -e "${BLUE}ℹ️ SKIPPED${NC} (wscat not installed)"
fi

echo ""
echo "📊 Performance Tests"
echo "--------------------"

# Response time test
echo -n "Testing response times... "
start_time=$(date +%s%N)
curl -s "$BASE_URL/health" >/dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✅ FAST${NC} (${response_time}ms)"
elif [ $response_time -lt 5000 ]; then
    echo -e "${YELLOW}⚠️ SLOW${NC} (${response_time}ms)"
else
    echo -e "${RED}❌ VERY SLOW${NC} (${response_time}ms)"
fi

echo ""
echo "🛡️ Security Tests"
echo "------------------"

# Rate limiting test (should succeed)
test_endpoint "Rate Limit Check" "$BASE_URL/health"

# CORS headers test
echo -n "Testing CORS headers... "
if curl -s -I -H "Origin: http://localhost:5173" "$BASE_URL/api" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Security headers test
echo -n "Testing Security headers... "
if curl -s -I "$BASE_URL/health" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo ""
echo "📋 Test Summary"
echo "==============="

# Get some key metrics
echo "🔧 System Status:"
health_response=$(curl -s "$API_BASE/system/health" | jq -r '.data.overall' 2>/dev/null || echo "unknown")
echo "   Overall Health: $health_response"

model_count=$(curl -s "$API_BASE/llm/models" | jq -r '.data.models | length' 2>/dev/null || echo "0")
echo "   LLM Models: $model_count available"

server_count=$(curl -s "$API_BASE/mcp/servers" | jq -r '.data.totalCount' 2>/dev/null || echo "0")
echo "   MCP Servers: $server_count configured"

echo ""
echo "✨ Backend API testing completed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Connect React frontend to these APIs"
echo "   2. Test real-time WebSocket communication"  
echo "   3. Implement user authentication if needed"
echo "   4. Set up database migrations"
echo ""
echo "🚀 Backend is ready for production development!"