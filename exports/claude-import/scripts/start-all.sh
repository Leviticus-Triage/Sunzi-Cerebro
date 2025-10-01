#!/bin/bash
# Sunzi Cerebro - Start All Services Script
# Version: 1.0.0

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Sunzi Cerebro - Starting All Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js v18 or v20 first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}❌ npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"
echo -e "${GREEN}✅ npm v$(npm --version) detected${NC}"
echo ""

# Create logs directory
mkdir -p backend/logs
mkdir -p logs

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    echo ""
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    echo ""
fi

# Kill existing processes on ports
echo "🔍 Checking for existing services..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing existing process on port 3000${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -Pi :8890 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing existing process on port 8890${NC}"
    lsof -ti:8890 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo ""

# Start Backend
echo -e "${BLUE}🔧 Starting Backend API Server...${NC}"
cd backend
nohup npm run start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: logs/backend.log"
echo "   Health: http://localhost:8890/health"

# Wait for backend to be ready
echo ""
echo -n "⏳ Waiting for backend to be ready"
for i in {1..30}; do
    if curl -s http://localhost:8890/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend Development Server...${NC}"
nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: logs/frontend.log"
echo "   URL: http://localhost:3000"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📍 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8890"
echo "   Health:    http://localhost:8890/health"
echo ""
echo "📊 Monitoring:"
echo "   tail -f logs/backend.log   # Backend logs"
echo "   tail -f logs/frontend.log  # Frontend logs"
echo "   ./scripts/health-check.sh  # Run health check"
echo ""
echo "🛑 Stop services:"
echo "   ./scripts/stop-all.sh"
echo ""

# Run health check after 5 seconds
sleep 5
if [ -f "./scripts/health-check.sh" ]; then
    echo "Running health check..."
    bash ./scripts/health-check.sh
fi
