#!/bin/sh

# Sunzi Cerebro Backend Health Check Script
# Checks API endpoint availability and database connectivity

# Check if backend API is responding
if curl -f -s http://localhost:8890/api/system/health > /dev/null 2>&1; then
    echo "✅ Backend API is healthy"
    exit 0
else
    echo "❌ Backend API health check failed"
    exit 1
fi