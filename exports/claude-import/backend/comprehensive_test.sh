#!/bin/bash

echo "🧪 SUNZI CEREBRO - COMPREHENSIVE TESTING SUITE"
echo "==============================================="

# Test 1: System Health
echo -e "\n1. SYSTEM HEALTH CHECK"
curl -s http://localhost:8890/health | head -200

# Test 2: User Registration
echo -e "\n\n2. USER REGISTRATION TEST"
RESPONSE=$(curl -s -X POST http://localhost:8890/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "qatest001",
    "email": "qatest001@sunzi.local",
    "password": "SecureTestPass123!",
    "organizationName": "QATestOrg", 
    "role": "admin"
  }')

echo "$RESPONSE"
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed - no token received"
  exit 1
fi

echo "✅ Registration successful, token received"

# Test 3: Authentication Validation  
echo -e "\n\n3. AUTHENTICATION VALIDATION TEST"
AUTH_RESPONSE=$(curl -s http://localhost:8890/api/auth/validate \
  -H "Authorization: Bearer $TOKEN")
echo "$AUTH_RESPONSE"

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Authentication validation successful"
else
  echo "❌ Authentication validation failed"
fi

# Test 4: MCP Database Server Status
echo -e "\n\n4. MCP DATABASE SERVER TEST"  
MCP_RESPONSE=$(curl -s http://localhost:8890/api/mcp/database/status \
  -H "Authorization: Bearer $TOKEN")
echo "$MCP_RESPONSE"

if echo "$MCP_RESPONSE" | grep -q '"success":true'; then
  echo "✅ MCP Database Server accessible"
else
  echo "❌ MCP Database Server test failed"
fi

# Test 5: Database Stats
echo -e "\n\n5. DATABASE STATISTICS TEST"
STATS_RESPONSE=$(curl -s http://localhost:8890/api/mcp/database/stats \
  -H "Authorization: Bearer $TOKEN")
echo "$STATS_RESPONSE"

# Test 6: User Query Test
echo -e "\n\n6. USER QUERY TEST"
USERS_RESPONSE=$(curl -s 'http://localhost:8890/api/mcp/database/users?limit=3' \
  -H "Authorization: Bearer $TOKEN")
echo "$USERS_RESPONSE"

# Test 7: Organization Query Test
echo -e "\n\n7. ORGANIZATION QUERY TEST"
ORGS_RESPONSE=$(curl -s http://localhost:8890/api/mcp/database/organizations \
  -H "Authorization: Bearer $TOKEN")
echo "$ORGS_RESPONSE"

# Test 8: Performance Test
echo -e "\n\n8. PERFORMANCE TEST (Response Times)"
echo "Testing API response times..."
for i in {1..5}; do
  start_time=$(date +%s%3N)
  curl -s http://localhost:8890/health > /dev/null
  end_time=$(date +%s%3N)
  response_time=$((end_time - start_time))
  echo "Health check $i: ${response_time}ms"
done

echo -e "\n\n✅ COMPREHENSIVE TEST SUITE COMPLETED"
echo "======================================"
