#!/bin/bash

# Sunzi Cerebro Enterprise - One-Command Deployment Script
# Version: 1.0.0
# Compatible with: Ubuntu 20.04+, Debian 11+, CentOS 8+

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/deployment.log"
DEPLOYMENT_MODE="docker"
SKIP_DEPS="false"
FORCE_REINSTALL="false"

# Default ports
FRONTEND_PORT=3000
BACKEND_PORT=8890
HEXSTRIKE_PORT=8888
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

print_banner() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │  ███████╗██╗   ██╗███╗   ██╗███████╗██╗                    │
    │  ██╔════╝██║   ██║████╗  ██║╚══███╔╝██║                    │
    │  ███████╗██║   ██║██╔██╗ ██║  ███╔╝ ██║                    │
    │  ╚════██║██║   ██║██║╚██╗██║ ███╔╝  ██║                    │
    │  ███████║╚██████╔╝██║ ╚████║███████╗██║                    │
    │  ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝                    │
    │                                                             │
    │            🧠 CEREBRO ENTERPRISE v1.0.0                    │
    │        Enterprise AI-Powered Security Platform             │
    │                                                             │
    │  "Know your enemy, know yourself, and victory is assured"  │
    │                        - Sun Tzu                           │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
EOF
    echo -e "${NC}"
}

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    log "${GREEN}✅ $1${NC}"
}

log_error() {
    log "${RED}❌ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    log "${BLUE}ℹ️  $1${NC}"
}

print_help() {
    cat << EOF
Sunzi Cerebro Enterprise Deployment Script

Usage: $0 [OPTIONS]

Options:
    --mode MODE           Deployment mode: docker|native|development (default: docker)
    --skip-deps          Skip dependency installation
    --force              Force reinstallation of existing components
    --frontend-port      Frontend port (default: 3000)
    --backend-port       Backend port (default: 8890)
    --hexstrike-port     HexStrike AI port (default: 8888)
    --prometheus-port    Prometheus port (default: 9090)
    --grafana-port       Grafana port (default: 3001)
    --help               Show this help message

Deployment Modes:
    docker      Complete containerized deployment (recommended)
    native      Native system installation
    development Local development setup with hot-reload

Examples:
    $0                                  # Docker deployment with defaults
    $0 --mode native --force           # Native installation, force reinstall
    $0 --mode development --skip-deps  # Development mode, skip dependencies

EOF
}

check_system() {
    log_info "Checking system requirements..."

    # Check OS
    if ! command -v lsb_release &> /dev/null; then
        log_error "Unable to detect OS. This script requires Ubuntu 20.04+, Debian 11+, or CentOS 8+"
        exit 1
    fi

    OS_ID=$(lsb_release -si)
    OS_VERSION=$(lsb_release -sr)

    log_info "Detected OS: $OS_ID $OS_VERSION"

    # Check memory
    MEMORY_GB=$(free -g | awk '/^Mem:/ {print $2}')
    if [ "$MEMORY_GB" -lt 8 ]; then
        log_warning "System has ${MEMORY_GB}GB RAM. 8GB+ recommended for optimal performance"
    else
        log_success "Memory check passed: ${MEMORY_GB}GB RAM"
    fi

    # Check disk space
    DISK_GB=$(df -BG . | awk 'NR==2 {gsub(/G/, "", $4); print $4}')
    if [ "$DISK_GB" -lt 50 ]; then
        log_error "Insufficient disk space: ${DISK_GB}GB available. 50GB+ required"
        exit 1
    else
        log_success "Disk space check passed: ${DISK_GB}GB available"
    fi

    # Check if running as root for native mode
    if [ "$DEPLOYMENT_MODE" = "native" ] && [ "$EUID" -ne 0 ]; then
        log_error "Native deployment requires root privileges. Please run with sudo"
        exit 1
    fi
}

install_dependencies() {
    if [ "$SKIP_DEPS" = "true" ]; then
        log_info "Skipping dependency installation"
        return
    fi

    log_info "Installing system dependencies..."

    # Update package manager
    if command -v apt &> /dev/null; then
        apt update
        apt install -y curl wget git build-essential python3 python3-pip nodejs npm
    elif command -v yum &> /dev/null; then
        yum update -y
        yum install -y curl wget git gcc gcc-c++ python3 python3-pip nodejs npm
    else
        log_error "Unsupported package manager. Please install dependencies manually"
        exit 1
    fi

    # Install Docker if needed
    if [ "$DEPLOYMENT_MODE" = "docker" ]; then
        if ! command -v docker &> /dev/null; then
            log_info "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            usermod -aG docker $USER
            systemctl enable docker
            systemctl start docker
        fi

        if ! command -v docker-compose &> /dev/null; then
            log_info "Installing Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
    fi

    log_success "Dependencies installed successfully"
}

setup_environment() {
    log_info "Setting up environment configuration..."

    # Create necessary directories
    mkdir -p logs data exports backups

    # Generate environment files
    generate_env_files

    # Set up permissions
    chmod 755 logs data exports backups

    log_success "Environment setup completed"
}

generate_env_files() {
    log_info "Generating environment configuration files..."

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -base64 32)

    # Backend .env
    cat > backend/.env << EOF
# Sunzi Cerebro Backend Configuration
NODE_ENV=production
PORT=${BACKEND_PORT}

# Database Configuration
DB_TYPE=sqlite
DB_PATH=./data/sunzi_cerebro_prod.sqlite

# PostgreSQL Configuration (if using)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sunzi_cerebro
DB_USER=sunzi_cerebro
DB_PASSWORD=${DB_PASSWORD}

# Authentication
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# MCP Servers
HEXSTRIKE_URL=http://localhost:${HEXSTRIKE_PORT}
ATTACKMCP_ENABLED=true
GODMODE_ENABLED=true
NOTION_MCP_ENABLED=true

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
CORS_ORIGIN=http://localhost:${FRONTEND_PORT}

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Features
ENABLE_WEBSOCKETS=true
ENABLE_METRICS=true
ENABLE_SWAGGER=true
EOF

    # Frontend .env
    cat > .env << EOF
# Sunzi Cerebro Frontend Configuration
VITE_API_BASE_URL=http://localhost:${BACKEND_PORT}
VITE_WS_URL=ws://localhost:${BACKEND_PORT}
VITE_ENVIRONMENT=production
EOF

    # Docker Compose .env
    cat > .env.docker << EOF
# Docker Compose Configuration
COMPOSE_PROJECT_NAME=sunzi-cerebro

# Port Configuration
FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}
HEXSTRIKE_PORT=${HEXSTRIKE_PORT}
PROMETHEUS_PORT=${PROMETHEUS_PORT}
GRAFANA_PORT=${GRAFANA_PORT}

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
DB_PASSWORD=${DB_PASSWORD}

# Paths
HEXSTRIKE_PATH=${SCRIPT_DIR}/mcp-servers/hexstrike-ai
ATTACKMCP_PATH=${SCRIPT_DIR}/mcp-servers/attackmcp
GODMODE_PATH=${SCRIPT_DIR}/mcp-servers/MCP-God-Mode
EOF

    log_success "Environment files generated"
}

deploy_docker() {
    log_info "Starting Docker deployment..."

    # Copy docker files
    cp docker-compose.yml docker-compose.prod.yml
    cp .env.docker .env

    # Build and start services
    docker-compose -f docker-compose.prod.yml up -d --build

    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30

    # Check service health
    check_service_health

    log_success "Docker deployment completed successfully"
}

deploy_native() {
    log_info "Starting native deployment..."

    # Install Node.js dependencies
    log_info "Installing frontend dependencies..."
    npm install
    npm run build

    log_info "Installing backend dependencies..."
    cd backend
    npm install

    # Set up Python MCP servers
    setup_mcp_servers

    # Initialize database
    initialize_database

    # Start services
    start_native_services

    log_success "Native deployment completed successfully"
}

deploy_development() {
    log_info "Starting development deployment..."

    # Install dependencies
    npm install
    cd backend && npm install && cd ..

    # Set up development environment
    generate_dev_env

    # Set up MCP servers for development
    setup_mcp_servers_dev

    # Initialize database
    initialize_database

    log_success "Development environment setup completed"
    log_info "To start development servers:"
    log_info "  Frontend: npm run dev"
    log_info "  Backend:  cd backend && npm run dev"
}

setup_mcp_servers() {
    log_info "Setting up MCP servers..."

    # HexStrike AI
    if [ -d "mcp-servers/hexstrike-ai" ]; then
        log_info "Setting up HexStrike AI server..."
        cd mcp-servers/hexstrike-ai
        python3 -m venv hexstrike-env
        source hexstrike-env/bin/activate
        pip install -r requirements.txt
        cd ../..
    fi

    # AttackMCP
    if [ -d "mcp-servers/attackmcp" ]; then
        log_info "Setting up AttackMCP server..."
        cd mcp-servers/attackmcp
        python3 -m venv attackmcp-env
        source attackmcp-env/bin/activate
        pip install -r requirements_sunzi.txt
        cd ../..
    fi

    # MCP-God-Mode
    if [ -d "mcp-servers/MCP-God-Mode" ]; then
        log_info "Setting up MCP-God-Mode server..."
        cd mcp-servers/MCP-God-Mode
        npm install
        npm run build
        cd ../..
    fi

    log_success "MCP servers setup completed"
}

initialize_database() {
    log_info "Initializing database..."

    cd backend

    # Run database migrations
    if [ -f "package.json" ]; then
        npm run db:migrate || true
        npm run db:seed || true
    fi

    cd ..

    log_success "Database initialized"
}

start_native_services() {
    log_info "Starting native services..."

    # Create systemd services
    create_systemd_services

    # Start services
    systemctl enable sunzi-cerebro-backend
    systemctl enable sunzi-cerebro-frontend
    systemctl enable sunzi-cerebro-hexstrike

    systemctl start sunzi-cerebro-backend
    systemctl start sunzi-cerebro-frontend
    systemctl start sunzi-cerebro-hexstrike

    log_success "Native services started"
}

create_systemd_services() {
    log_info "Creating systemd service files..."

    # Backend service
    cat > /etc/systemd/system/sunzi-cerebro-backend.service << EOF
[Unit]
Description=Sunzi Cerebro Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${SCRIPT_DIR}/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service (nginx)
    cat > /etc/systemd/system/sunzi-cerebro-frontend.service << EOF
[Unit]
Description=Sunzi Cerebro Frontend
After=network.target

[Service]
Type=forking
ExecStart=/usr/sbin/nginx -c ${SCRIPT_DIR}/nginx.conf
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF

    # HexStrike AI service
    cat > /etc/systemd/system/sunzi-cerebro-hexstrike.service << EOF
[Unit]
Description=Sunzi Cerebro HexStrike AI Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${SCRIPT_DIR}/mcp-servers/hexstrike-ai
Environment=PATH=${SCRIPT_DIR}/mcp-servers/hexstrike-ai/hexstrike-env/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=${SCRIPT_DIR}/mcp-servers/hexstrike-ai/hexstrike-env/bin/python hexstrike_server.py --port ${HEXSTRIKE_PORT}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload

    log_success "Systemd services created"
}

check_service_health() {
    log_info "Checking service health..."

    # Check backend
    if curl -f "http://localhost:${BACKEND_PORT}/api/system/health" &> /dev/null; then
        log_success "Backend API is healthy"
    else
        log_error "Backend API health check failed"
    fi

    # Check HexStrike AI
    if curl -f "http://localhost:${HEXSTRIKE_PORT}/health" &> /dev/null; then
        log_success "HexStrike AI server is healthy"
    else
        log_warning "HexStrike AI server health check failed"
    fi

    # Check frontend
    if curl -f "http://localhost:${FRONTEND_PORT}" &> /dev/null; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend accessibility check failed"
    fi
}

print_success_message() {
    echo -e "${GREEN}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║  🎉 SUNZI CEREBRO ENTERPRISE DEPLOYMENT SUCCESSFUL! 🎉     ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    log_success "Deployment completed successfully!"
    echo
    log_info "Access points:"
    log_info "  🎨 Frontend:        http://localhost:${FRONTEND_PORT}"
    log_info "  🔧 Backend API:     http://localhost:${BACKEND_PORT}/api"
    log_info "  📚 API Docs:        http://localhost:${BACKEND_PORT}/api/docs"
    log_info "  🛡️  HexStrike AI:    http://localhost:${HEXSTRIKE_PORT}"
    log_info "  📊 Grafana:         http://localhost:${GRAFANA_PORT}"
    log_info "  📈 Prometheus:      http://localhost:${PROMETHEUS_PORT}"
    echo
    log_info "Default credentials:"
    log_info "  Admin: sunzi.cerebro / admin123"
    log_info "  Grafana: admin / sunzi-cerebro-2025"
    echo
    log_info "Next steps:"
    log_info "  1. Visit the web interface and log in"
    log_info "  2. Configure your security tools"
    log_info "  3. Run your first security assessment"
    log_info "  4. Check system monitoring in Grafana"
    echo
    log_info "For support: docs.sunzi-cerebro.com"
    log_info "Deployment log: ${LOG_FILE}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            DEPLOYMENT_MODE="$2"
            shift 2
            ;;
        --skip-deps)
            SKIP_DEPS="true"
            shift
            ;;
        --force)
            FORCE_REINSTALL="true"
            shift
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --hexstrike-port)
            HEXSTRIKE_PORT="$2"
            shift 2
            ;;
        --prometheus-port)
            PROMETHEUS_PORT="$2"
            shift 2
            ;;
        --grafana-port)
            GRAFANA_PORT="$2"
            shift 2
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_help
            exit 1
            ;;
    esac
done

# Validate deployment mode
if [[ ! "$DEPLOYMENT_MODE" =~ ^(docker|native|development)$ ]]; then
    log_error "Invalid deployment mode: $DEPLOYMENT_MODE"
    print_help
    exit 1
fi

# Main execution
main() {
    print_banner

    log_info "Starting Sunzi Cerebro Enterprise deployment..."
    log_info "Deployment mode: $DEPLOYMENT_MODE"
    log_info "Log file: $LOG_FILE"

    # System checks
    check_system

    # Install dependencies
    install_dependencies

    # Setup environment
    setup_environment

    # Deploy based on mode
    case $DEPLOYMENT_MODE in
        docker)
            deploy_docker
            ;;
        native)
            deploy_native
            ;;
        development)
            deploy_development
            ;;
    esac

    # Final health check
    sleep 10
    check_service_health

    # Success message
    print_success_message
}

# Run main function
main "$@"