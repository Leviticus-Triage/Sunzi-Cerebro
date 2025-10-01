#!/bin/bash
# Sunzi Cerebro - Quick Start Script
# This script provides easy access to the web interface

echo "╔══════════════════════════════════════════════════════════╗"
echo "║    🚀 SUNZI CEREBRO - Enterprise Security Platform      ║"
echo "║         Quick Start & Access Guide                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if frontend is running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is RUNNING on port 3000"
    FRONTEND_PID=$(lsof -ti:3000)
    echo "   Process ID: $FRONTEND_PID"
else
    echo "❌ Frontend is NOT running"
    echo "   Starting frontend..."
    cd /home/danii/Cerebrum/sunzi-cerebro-react-framework
    nohup npm run dev > /tmp/vite-dev.log 2>&1 &
    sleep 3
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "✅ Frontend started successfully!"
    else
        echo "⚠️  Frontend failed to start. Check logs: tail -f /tmp/vite-dev.log"
    fi
fi

echo ""

# Check if backend is running
if curl -s http://localhost:8890/health > /dev/null 2>&1; then
    echo "✅ Backend is RUNNING on port 8890"
    BACKEND_STATUS=$(curl -s http://localhost:8890/health | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['version'])" 2>/dev/null)
    echo "   Version: $BACKEND_STATUS"
else
    echo "⚠️  Backend is NOT responding"
    echo "   Check backend status: curl http://localhost:8890/health"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    ACCESS URLS                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Web Interface:    http://localhost:3000"
echo "🔧 Backend API:      http://localhost:8890"
echo "🏥 Health Check:     http://localhost:8890/health"
echo "📊 MCP Servers:      http://localhost:8890/api/mcp/servers"
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  QUICK COMMANDS                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Open in Browser:     xdg-open http://localhost:3000"
echo "Check Status:        curl http://localhost:3000"
echo "View Frontend Logs:  tail -f /tmp/vite-dev.log"
echo "View Backend Logs:   tail -f backend/logs/app.log"
echo "Stop Frontend:       pkill -f vite"
echo "Stop Backend:        pkill -f 'node.*server.js'"
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              DOCUMENTATION AVAILABLE                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📄 IEEE/ACM Research Paper:    IEEE_ACM_RESEARCH_PAPER.md (28,500 words)"
echo "📄 Performance Benchmarking:   PERFORMANCE_BENCHMARKING_REPORT.md (35,000 words)"
echo "📄 Access Guide:               WEB_INTERFACE_ACCESS_GUIDE.md"
echo "📄 Deployment Success:         FRONTEND_DEPLOYMENT_SUCCESS.md"
echo "📄 Kubernetes Deployment:      K8S_DEPLOYMENT_COMPLETE.md"
echo ""
echo "✅ System Ready for Evaluation!"
echo ""
