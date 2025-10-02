#!/bin/bash
# 🛡️ SUNZI CEREBRO - PORT CONFLICT MONITOR & PREVENTION
# Prevents Docker/Service Port Conflicts

echo "🚨 SUNZI CEREBRO PORT CONFLICT ANALYSIS"
echo "======================================="

# Define Sunzi Cerebro Port Map
declare -A SUNZI_PORTS=(
    [3000]="Frontend (React Vite)"
    [8890]="Backend API (Express)"
    [8888]="HexStrike AI MCP"
    [3001]="Grafana Monitoring"
    [5432]="PostgreSQL Database"
    [6379]="Redis Cache"
    [9090]="Prometheus Metrics"
)

echo ""
echo "📊 SUNZI CEREBRO REQUIRED PORTS:"
for port in "${!SUNZI_PORTS[@]}"; do
    status="AVAILABLE"
    process=""

    # Check if port is in use
    if lsof -ti:$port &>/dev/null; then
        status="OCCUPIED"
        process=$(lsof -ti:$port | xargs ps -p | tail -n +2 | head -1 | awk '{print $4}')
    fi

    printf "   Port %s: %s - %s\n" "$port" "${SUNZI_PORTS[$port]}" "$status"
    if [ "$status" = "OCCUPIED" ]; then
        printf "      └─ Process: %s (PID: %s)\n" "$process" "$(lsof -ti:$port)"
    fi
done

echo ""
echo "🐳 DOCKER CONTAINER ANALYSIS:"
echo "=============================="

# Check Docker containers
if docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "."; then
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "   No Docker containers found"
fi

echo ""
echo "⚠️  POTENTIAL CONFLICTS:"
echo "========================"

# Check for non-Sunzi processes on Sunzi ports
conflicts=0
for port in "${!SUNZI_PORTS[@]}"; do
    if lsof -ti:$port &>/dev/null; then
        pid=$(lsof -ti:$port)
        process=$(ps -p $pid -o comm= 2>/dev/null)

        # Check if it's NOT a Sunzi process
        case "$port" in
            3000)
                if [[ "$process" != "node" ]] && [[ "$process" != *"vite"* ]]; then
                    echo "   ⚠️  Port $port: Non-Vite process '$process' (PID: $pid)"
                    conflicts=$((conflicts + 1))
                fi
                ;;
            8890)
                if [[ "$process" != "node" ]]; then
                    echo "   ⚠️  Port $port: Non-Node process '$process' (PID: $pid)"
                    conflicts=$((conflicts + 1))
                fi
                ;;
            8888)
                if [[ "$process" != "python" ]] && [[ "$process" != "python3" ]]; then
                    echo "   ⚠️  Port $port: Non-Python process '$process' (PID: $pid)"
                    conflicts=$((conflicts + 1))
                fi
                ;;
        esac
    fi
done

if [ $conflicts -eq 0 ]; then
    echo "   ✅ No conflicts detected - all ports clean!"
fi

echo ""
echo "🔧 AUTOMATIC CONFLICT RESOLUTION:"
echo "================================="

# Offer to kill conflicting processes
if [ $conflicts -gt 0 ]; then
    echo "   Found $conflicts conflicts. Run with --fix to resolve automatically."
    echo ""
    echo "   Manual resolution commands:"
    for port in "${!SUNZI_PORTS[@]}"; do
        if lsof -ti:$port &>/dev/null; then
            pid=$(lsof -ti:$port)
            process=$(ps -p $pid -o comm= 2>/dev/null)

            case "$port" in
                3000)
                    if [[ "$process" != "node" ]] && [[ "$process" != *"vite"* ]]; then
                        echo "   kill $pid  # Free port $port from '$process'"
                    fi
                    ;;
                8890)
                    if [[ "$process" != "node" ]]; then
                        echo "   kill $pid  # Free port $port from '$process'"
                    fi
                    ;;
                8888)
                    if [[ "$process" != "python" ]] && [[ "$process" != "python3" ]]; then
                        echo "   kill $pid  # Free port $port from '$process'"
                    fi
                    ;;
            esac
        fi
    done
fi

echo ""
echo "🚀 SUNZI CEREBRO STARTUP SEQUENCE:"
echo "=================================="
echo "   1. cd /home/danii/Cerebrum/sunzi-cerebro-react-framework"
echo "   2. ./PORT_CONFLICT_MONITOR.sh --fix  # Resolve conflicts"
echo "   3. docker-compose up -d              # Start infrastructure"
echo "   4. npm run dev                       # Start frontend"
echo "   5. cd backend && npm run dev         # Start backend"

echo ""
echo "📈 SYSTEM STATUS:"
if [ $conflicts -eq 0 ]; then
    echo "   🟢 READY FOR DEPLOYMENT"
else
    echo "   🔴 CONFLICTS DETECTED - RESOLUTION REQUIRED"
fi

# Auto-fix option
if [ "$1" = "--fix" ]; then
    echo ""
    echo "🛠️  EXECUTING AUTO-FIX..."
    echo "========================="

    for port in "${!SUNZI_PORTS[@]}"; do
        if lsof -ti:$port &>/dev/null; then
            pid=$(lsof -ti:$port)
            process=$(ps -p $pid -o comm= 2>/dev/null)

            case "$port" in
                3000)
                    if [[ "$process" != "node" ]] && [[ "$process" != *"vite"* ]]; then
                        echo "   🔧 Killing conflicting process on port $port (PID: $pid)"
                        kill $pid
                    fi
                    ;;
                8890)
                    if [[ "$process" != "node" ]]; then
                        echo "   🔧 Killing conflicting process on port $port (PID: $pid)"
                        kill $pid
                    fi
                    ;;
                8888)
                    if [[ "$process" != "python" ]] && [[ "$process" != "python3" ]]; then
                        echo "   🔧 Killing conflicting process on port $port (PID: $pid)"
                        kill $pid
                    fi
                    ;;
            esac
        fi
    done

    sleep 2
    echo "   ✅ Auto-fix complete. Re-run script to verify."
fi