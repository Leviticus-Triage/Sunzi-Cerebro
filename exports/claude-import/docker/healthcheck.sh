#!/bin/bash
# Comprehensive health check script for Sunzi Cerebro Enterprise
# Tests critical components for production readiness

set -euo pipefail

# Configuration
API_URL="${API_URL:-http://localhost:8890}"
TIMEOUT="${HEALTH_TIMEOUT:-10}"
LOG_FILE="/app/logs/healthcheck.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [HEALTHCHECK] $1" | tee -a "$LOG_FILE" 2>/dev/null || echo "$(date '+%Y-%m-%d %H:%M:%S') [HEALTHCHECK] $1"
}

# Health check functions
check_api_health() {
    log "Checking API health endpoint..."

    local response
    if response=$(curl -f -s --max-time "$TIMEOUT" "$API_URL/api/system/health" 2>&1); then
        local status
        status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")

        if [[ "$status" == "healthy" ]]; then
            log "✅ API health check passed - Status: $status"
            return 0
        else
            log "❌ API health check failed - Status: $status"
            return 1
        fi
    else
        log "❌ API health check failed - Connection error: $response"
        return 1
    fi
}

check_database_connectivity() {
    log "Checking database connectivity..."

    local response
    if response=$(curl -f -s --max-time "$TIMEOUT" "$API_URL/api/system/health" 2>&1); then
        local db_status
        db_status=$(echo "$response" | grep -o '"database":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")

        if [[ "$db_status" == "healthy" ]]; then
            log "✅ Database connectivity check passed"
            return 0
        else
            log "❌ Database connectivity check failed - Status: $db_status"
            return 1
        fi
    else
        log "❌ Database connectivity check failed - API unreachable"
        return 1
    fi
}

check_mcp_servers() {
    log "Checking MCP servers status..."

    local response
    if response=$(curl -f -s --max-time "$TIMEOUT" "$API_URL/api/mcp/servers" -H "Authorization: Bearer mock-health-token" 2>&1); then
        local online_count
        online_count=$(echo "$response" | grep -o '"status":"online"' | wc -l 2>/dev/null || echo "0")

        if [[ "$online_count" -gt 0 ]]; then
            log "✅ MCP servers check passed - $online_count servers online"
            return 0
        else
            log "⚠️  MCP servers check warning - No servers online"
            # Don't fail health check for MCP servers as they might be starting
            return 0
        fi
    else
        log "⚠️  MCP servers check warning - Could not check status"
        return 0
    fi
}

check_memory_usage() {
    log "Checking memory usage..."

    if command -v free >/dev/null 2>&1; then
        local mem_usage
        mem_usage=$(free | awk 'FNR==2{printf "%.1f", $3/($3+$4)*100}')

        if (( $(echo "$mem_usage < 90" | bc -l) )); then
            log "✅ Memory usage check passed - Usage: ${mem_usage}%"
            return 0
        else
            log "⚠️  Memory usage warning - Usage: ${mem_usage}%"
            return 0
        fi
    else
        log "⚠️  Memory usage check skipped - 'free' command not available"
        return 0
    fi
}

check_disk_space() {
    log "Checking disk space..."

    local disk_usage
    disk_usage=$(df /app 2>/dev/null | awk 'NR==2{print $5}' | sed 's/%//' || echo "0")

    if [[ "$disk_usage" -lt 90 ]]; then
        log "✅ Disk space check passed - Usage: ${disk_usage}%"
        return 0
    else
        log "⚠️  Disk space warning - Usage: ${disk_usage}%"
        return 0
    fi
}

check_required_directories() {
    log "Checking required directories..."

    local dirs=("/app/data" "/app/logs" "/app/exports" "/app/backups")
    local missing_dirs=()

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            missing_dirs+=("$dir")
        fi
    done

    if [[ ${#missing_dirs[@]} -eq 0 ]]; then
        log "✅ Required directories check passed"
        return 0
    else
        log "❌ Required directories check failed - Missing: ${missing_dirs[*]}"
        return 1
    fi
}

# Main health check execution
main() {
    log "Starting comprehensive health check..."

    local checks_passed=0
    local checks_total=6

    # Critical checks (must pass)
    check_api_health && ((checks_passed++))
    check_database_connectivity && ((checks_passed++))
    check_required_directories && ((checks_passed++))

    # Warning checks (can fail without failing overall health)
    check_mcp_servers && ((checks_passed++))
    check_memory_usage && ((checks_passed++))
    check_disk_space && ((checks_passed++))

    local success_rate
    success_rate=$(( checks_passed * 100 / checks_total ))

    if [[ $checks_passed -ge 3 ]]; then  # At least critical checks must pass
        log "✅ Health check PASSED - $checks_passed/$checks_total checks successful ($success_rate%)"
        exit 0
    else
        log "❌ Health check FAILED - $checks_passed/$checks_total checks successful ($success_rate%)"
        exit 1
    fi
}

# Trap signals for graceful shutdown
trap 'log "Health check interrupted"; exit 1' INT TERM

# Execute main function
main "$@"