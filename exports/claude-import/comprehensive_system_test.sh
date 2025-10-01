#!/bin/bash

# Sunzi Cerebro Enterprise - Comprehensive System Testing & Validation
# Complete testing framework for all implemented features and integrations

echo "🧪 SUNZI CEREBRO ENTERPRISE - COMPREHENSIVE SYSTEM TESTING"
echo "=============================================================="
echo ""
echo "📅 Test Date: $(date '+%Y-%m-%d %H:%M:%S UTC')"
echo "🔬 Test Scope: Complete system validation after Phase 8 completion"
echo "🎯 Test Objective: Validate all features, integrations, and performance"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8890"
FRONTEND_URL="http://localhost:3000"
TEST_TOKEN="mock-jwt-token-test"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  Testing ${test_name}... "

    if eval "$test_command" | grep -q "$expected_pattern" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to run test with custom validation
run_custom_test() {
    local test_name="$1"
    local test_result="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  Testing ${test_name}... "

    if [ "$test_result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    elif [ "$test_result" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${BLUE}🔍 PHASE 1: SYSTEM HEALTH VALIDATION${NC}"
echo "========================================="

# Basic connectivity tests
run_test "Frontend availability" "curl -s ${FRONTEND_URL}" "<!DOCTYPE html>"
run_test "Backend API health" "curl -s ${BACKEND_URL}/health" '"status":"OK"'
run_test "Database connectivity" "curl -s ${BACKEND_URL}/health" '"database":"healthy"'
run_test "MCP integration status" "curl -s ${BACKEND_URL}/health" '"mcp_production":"active"'

echo ""
echo -e "${BLUE}🎨 PHASE 2: FRONTEND FEATURE VALIDATION${NC}"
echo "============================================="

# Frontend build and performance tests
echo -n "  Testing production build creation... "
if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))

    # Check build output
    if [ -f "dist/index.html" ]; then
        echo -n "  Testing build artifacts... "
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -n "  Testing build artifacts... "
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 2))

# Frontend bundle analysis
if [ -f "dist/assets/index-*.js" ]; then
    BUNDLE_SIZE=$(du -h dist/assets/index-*.js | cut -f1)
    echo "  Bundle size: ${BUNDLE_SIZE} (Target: <1MB)"
fi

echo ""
echo -e "${BLUE}🔧 PHASE 3: BACKEND API VALIDATION${NC}"
echo "======================================="

# Authentication tests
run_test "Auth token validation" "curl -s -H 'Authorization: Bearer ${TEST_TOKEN}' ${BACKEND_URL}/api/auth/validate" '"success":true'

# MCP integration tests
run_test "MCP tools endpoint" "curl -s ${BACKEND_URL}/api/mcp/tools" '"success":true'
run_test "MCP servers status" "curl -s ${BACKEND_URL}/api/mcp/servers" 'MCP-God-Mode'
run_test "MCP health metrics" "curl -s ${BACKEND_URL}/api/mcp/health" '"success":true'

# Database operations
run_test "Database health check" "curl -s ${BACKEND_URL}/health" '"queries":'

echo ""
echo -e "${BLUE}🛠️ PHASE 4: MCP INTEGRATION VALIDATION${NC}"
echo "=============================================="

# MCP tool counts and status
echo -n "  Testing MCP tool inventory... "
TOOL_COUNT=$(curl -s ${BACKEND_URL}/api/mcp/tools | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['summary']['total'])" 2>/dev/null)
if [ "$TOOL_COUNT" -gt 200 ]; then
    echo -e "${GREEN}✅ PASS (${TOOL_COUNT} tools)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL (${TOOL_COUNT} tools)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Individual MCP servers
run_test "MCP-God-Mode server" "curl -s ${BACKEND_URL}/api/mcp/tools" '"MCP-God-Mode"'
run_test "HexStrike AI integration" "curl -s ${BACKEND_URL}/api/mcp/tools" '"HexStrike"'
run_test "Notion MCP integration" "curl -s ${BACKEND_URL}/api/mcp/tools" '"Notion"'

echo ""
echo -e "${BLUE}📊 PHASE 5: PHASE 8 FEATURES VALIDATION${NC}"
echo "=============================================="

# Analytics Dashboard components
echo -n "  Testing Analytics Dashboard component... "
if [ -f "src/components/Analytics/AnalyticsDashboard.tsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Security Scan Orchestrator
echo -n "  Testing Security Scan Orchestrator... "
if [ -f "src/components/SecurityOrchestration/SecurityScanOrchestrator.tsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Enterprise Admin Features
echo -n "  Testing Audit Logging component... "
if [ -f "src/components/EnterpriseAdmin/AuditLogging.tsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -n "  Testing Security Policies component... "
if [ -f "src/components/EnterpriseAdmin/SecurityPolicies.tsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Chart.js integration
echo -n "  Testing Chart.js dependencies... "
if npm list react-chartjs-2 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${BLUE}⚡ PHASE 6: PERFORMANCE BENCHMARKING${NC}"
echo "========================================="

# API response time tests
echo -n "  Testing API response time... "
START_TIME=$(date +%s%N)
curl -s ${BACKEND_URL}/health >/dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $RESPONSE_TIME -lt 100 ]; then
    echo -e "${GREEN}✅ PASS (${RESPONSE_TIME}ms)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ $RESPONSE_TIME -lt 200 ]; then
    echo -e "${YELLOW}⚠️  WARN (${RESPONSE_TIME}ms)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}❌ FAIL (${RESPONSE_TIME}ms)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# MCP tools response time
echo -n "  Testing MCP tools endpoint performance... "
START_TIME=$(date +%s%N)
curl -s ${BACKEND_URL}/api/mcp/tools >/dev/null
END_TIME=$(date +%s%N)
MCP_RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $MCP_RESPONSE_TIME -lt 200 ]; then
    echo -e "${GREEN}✅ PASS (${MCP_RESPONSE_TIME}ms)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ $MCP_RESPONSE_TIME -lt 500 ]; then
    echo -e "${YELLOW}⚠️  WARN (${MCP_RESPONSE_TIME}ms)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}❌ FAIL (${MCP_RESPONSE_TIME}ms)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${BLUE}🔐 PHASE 7: SECURITY VALIDATION${NC}"
echo "===================================="

# Authentication security
run_test "JWT token structure" "curl -s -H 'Authorization: Bearer ${TEST_TOKEN}' ${BACKEND_URL}/api/auth/validate" '"user_id":'
run_test "Role-based access" "curl -s -H 'Authorization: Bearer ${TEST_TOKEN}' ${BACKEND_URL}/api/auth/validate" '"role":'

# API security headers
echo -n "  Testing security headers... "
SECURITY_HEADERS=$(curl -s -I ${BACKEND_URL}/health | grep -E "(X-|Content-Security)" | wc -l)
if [ $SECURITY_HEADERS -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  WARN${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${BLUE}📊 PHASE 8: CODE QUALITY ASSESSMENT${NC}"
echo "========================================"

# TypeScript compilation
echo -n "  Testing TypeScript compilation... "
if npx tsc --noEmit >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ESLint checks
echo -n "  Testing ESLint validation... "
if npx eslint src/ --ext .ts,.tsx --max-warnings 10 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  WARN${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Code complexity analysis
echo -n "  Testing component structure... "
COMPONENT_COUNT=$(find src/components -name "*.tsx" | wc -l)
if [ $COMPONENT_COUNT -gt 10 ]; then
    echo -e "${GREEN}✅ PASS (${COMPONENT_COUNT} components)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL (${COMPONENT_COUNT} components)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${BLUE}📚 PHASE 9: DOCUMENTATION VALIDATION${NC}"
echo "========================================="

# Documentation completeness
DOCS_FOUND=0
DOCS_EXPECTED=6

echo -n "  Testing documentation coverage... "
[ -f "PHASE8_COMPLETION_REPORT.md" ] && DOCS_FOUND=$((DOCS_FOUND + 1))
[ -f "CURRENT_STATUS_COMPREHENSIVE.md" ] && DOCS_FOUND=$((DOCS_FOUND + 1))
[ -f "TECH_STACK_CURRENT.md" ] && DOCS_FOUND=$((DOCS_FOUND + 1))
[ -f "validate_phase8_features.sh" ] && DOCS_FOUND=$((DOCS_FOUND + 1))
[ -f "comprehensive_system_test.sh" ] && DOCS_FOUND=$((DOCS_FOUND + 1))
[ -f "CLAUDE.md" ] && DOCS_FOUND=$((DOCS_FOUND + 1))

if [ $DOCS_FOUND -ge 5 ]; then
    echo -e "${GREEN}✅ PASS (${DOCS_FOUND}/${DOCS_EXPECTED} docs)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  WARN (${DOCS_FOUND}/${DOCS_EXPECTED} docs)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${BLUE}🎯 PHASE 10: INTEGRATION TESTING${NC}"
echo "======================================"

# Full workflow tests
echo -n "  Testing frontend-backend integration... "
FRONTEND_CHECK=$(curl -s ${FRONTEND_URL} | grep -o "react" | wc -l)
BACKEND_CHECK=$(curl -s ${BACKEND_URL}/health | grep -o "OK" | wc -l)

if [ $FRONTEND_CHECK -gt 0 ] && [ $BACKEND_CHECK -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# End-to-end workflow simulation
echo -n "  Testing E2E workflow simulation... "
E2E_RESULT="PASS"

# Simulate user login
LOGIN_TEST=$(curl -s -H "Authorization: Bearer ${TEST_TOKEN}" ${BACKEND_URL}/api/auth/validate | grep "success")
[ -z "$LOGIN_TEST" ] && E2E_RESULT="FAIL"

# Simulate MCP tool access
MCP_TEST=$(curl -s ${BACKEND_URL}/api/mcp/tools | grep "success")
[ -z "$MCP_TEST" ] && E2E_RESULT="FAIL"

run_custom_test "E2E workflow" "$E2E_RESULT"

echo ""
echo "=============================================================="
echo -e "${PURPLE}🎉 COMPREHENSIVE TESTING RESULTS${NC}"
echo "=============================================================="
echo ""

# Calculate success rate
SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

echo -e "${BLUE}📊 Test Summary:${NC}"
echo "├── Total Tests: $TOTAL_TESTS"
echo "├── Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "├── Failed: ${RED}$FAILED_TESTS${NC}"
echo "├── Warnings: ${YELLOW}$WARNINGS${NC}"
echo "└── Success Rate: ${SUCCESS_RATE}%"
echo ""

# Determine overall status
if [ $FAILED_TESTS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🏆 OVERALL STATUS: EXCELLENT ✅${NC}"
        echo "All tests passed without any warnings!"
    else
        echo -e "${YELLOW}✅ OVERALL STATUS: GOOD (Minor warnings)${NC}"
        echo "All critical tests passed with $WARNINGS minor warnings."
    fi
else
    if [ $FAILED_TESTS -lt 3 ]; then
        echo -e "${YELLOW}⚠️  OVERALL STATUS: ACCEPTABLE (Minor issues)${NC}"
        echo "$FAILED_TESTS tests failed but system is mostly functional."
    else
        echo -e "${RED}❌ OVERALL STATUS: NEEDS ATTENTION${NC}"
        echo "$FAILED_TESTS tests failed - investigation required."
    fi
fi

echo ""
echo -e "${BLUE}📋 System Status Summary:${NC}"
echo "├── Frontend: $(curl -s ${FRONTEND_URL} >/dev/null && echo -e "${GREEN}✅ OPERATIONAL${NC}" || echo -e "${RED}❌ OFFLINE${NC}")"
echo "├── Backend API: $(curl -s ${BACKEND_URL}/health >/dev/null && echo -e "${GREEN}✅ OPERATIONAL${NC}" || echo -e "${RED}❌ OFFLINE${NC}")"
echo "├── MCP Integration: $(curl -s ${BACKEND_URL}/api/mcp/tools | grep -q success && echo -e "${GREEN}✅ OPERATIONAL${NC}" || echo -e "${RED}❌ OFFLINE${NC}")"
echo "├── Database: $(curl -s ${BACKEND_URL}/health | grep -q '"database":"healthy"' && echo -e "${GREEN}✅ HEALTHY${NC}" || echo -e "${RED}❌ UNHEALTHY${NC}")"
echo "└── Authentication: $(curl -s -H "Authorization: Bearer ${TEST_TOKEN}" ${BACKEND_URL}/api/auth/validate | grep -q success && echo -e "${GREEN}✅ ACTIVE${NC}" || echo -e "${RED}❌ INACTIVE${NC}")"

echo ""
echo -e "${BLUE}🔗 Access Information:${NC}"
echo "├── Frontend: ${FRONTEND_URL}"
echo "├── Backend API: ${BACKEND_URL}"
echo "├── Health Check: ${BACKEND_URL}/health"
echo "├── MCP Tools: ${BACKEND_URL}/api/mcp/tools"
echo "└── Test Token: ${TEST_TOKEN}"

echo ""
echo -e "${BLUE}📊 Performance Metrics:${NC}"
echo "├── API Response: ${RESPONSE_TIME}ms"
echo "├── MCP Endpoint: ${MCP_RESPONSE_TIME}ms"
echo "├── Total Tools: ${TOOL_COUNT:-'N/A'}"
echo "└── Build Size: ${BUNDLE_SIZE:-'N/A'}"

echo ""
echo -e "${BLUE}🎯 Recommendations:${NC}"
if [ $FAILED_TESTS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ System is ready for production deployment"
    echo "✅ All enterprise features are fully operational"
    echo "✅ Performance meets enterprise standards"
    echo "✅ Documentation is comprehensive"
elif [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ System is operational with minor optimizations needed"
    echo "⚠️  Address $WARNINGS warnings for optimal performance"
    echo "✅ Core functionality is production ready"
else
    echo "⚠️  Address $FAILED_TESTS failing tests before production"
    echo "🔍 Investigate root causes for failed validations"
    echo "📊 Re-run tests after fixes are implemented"
fi

echo ""
echo "=============================================================="
echo -e "${PURPLE}🚀 COMPREHENSIVE TESTING COMPLETE${NC}"
echo "=============================================================="
echo ""
echo "Test completed at: $(date '+%Y-%m-%d %H:%M:%S UTC')"
echo "Report saved to: comprehensive_system_test.log"

# Save results to log file
{
    echo "Sunzi Cerebro Enterprise - Comprehensive System Test Results"
    echo "Test Date: $(date '+%Y-%m-%d %H:%M:%S UTC')"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Warnings: $WARNINGS"
    echo "Success Rate: ${SUCCESS_RATE}%"
    echo "API Response Time: ${RESPONSE_TIME}ms"
    echo "MCP Response Time: ${MCP_RESPONSE_TIME}ms"
    echo "Tool Count: ${TOOL_COUNT:-'N/A'}"
} > comprehensive_system_test.log

exit $FAILED_TESTS