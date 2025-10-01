#!/bin/bash

# Sunzi Cerebro Enterprise - Deployment Archive Creator
# Creates a complete, self-contained deployment package

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARCHIVE_NAME="sunzi-cerebro-enterprise-deployment-$(date +%Y%m%d-%H%M%S)"
TEMP_DIR="/tmp/${ARCHIVE_NAME}"

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
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

print_banner() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     📦 SUNZI CEREBRO DEPLOYMENT PACKAGE CREATOR 📦         ║
    ║                                                              ║
    ║         Creating All-in-One Enterprise Package              ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

create_directory_structure() {
    log_info "Creating deployment directory structure..."

    # Create main directories
    mkdir -p "$TEMP_DIR"/{frontend,backend,mcp-servers,docker,docs,scripts,requirements}

    # Create MCP server directories
    mkdir -p "$TEMP_DIR"/mcp-servers/{hexstrike-ai,attackmcp,MCP-God-Mode,notion-mcp}

    # Create additional directories
    mkdir -p "$TEMP_DIR"/{data,logs,backups,exports,ssl}
    mkdir -p "$TEMP_DIR"/docker/{grafana,prometheus,nginx}
    mkdir -p "$TEMP_DIR"/docs/{api,user,admin}

    log_success "Directory structure created"
}

copy_frontend_files() {
    log_info "Copying frontend application..."

    # Copy React frontend source
    cp -r "$PROJECT_ROOT"/src "$TEMP_DIR"/frontend/

    # Copy public directory if it exists
    if [ -d "$PROJECT_ROOT"/public ]; then
        cp -r "$PROJECT_ROOT"/public "$TEMP_DIR"/frontend/
    else
        log_warning "No public directory found, creating minimal public structure"
        mkdir -p "$TEMP_DIR"/frontend/public
        echo '<!DOCTYPE html><html><head><title>Sunzi Cerebro</title></head><body><div id="root"></div></body></html>' > "$TEMP_DIR"/frontend/public/index.html
    fi

    # Copy configuration files
    cp "$PROJECT_ROOT"/{package.json,package-lock.json} "$TEMP_DIR"/frontend/
    cp "$PROJECT_ROOT"/{tsconfig.json,tsconfig.node.json} "$TEMP_DIR"/frontend/
    cp "$PROJECT_ROOT"/{vite.config.ts,tailwind.config.js,postcss.config.js} "$TEMP_DIR"/frontend/
    cp "$PROJECT_ROOT"/index.html "$TEMP_DIR"/frontend/

    # Copy environment template
    if [ -f "$PROJECT_ROOT"/.env.example ]; then
        cp "$PROJECT_ROOT"/.env.example "$TEMP_DIR"/frontend/.env.example
    else
        log_warning "No .env.example found, creating template"
        cat > "$TEMP_DIR"/frontend/.env.example << 'EOF'
VITE_API_BASE_URL=http://localhost:8890
VITE_WS_URL=ws://localhost:8890
VITE_ENVIRONMENT=production
EOF
    fi

    log_success "Frontend files copied"
}

copy_backend_files() {
    log_info "Copying backend application..."

    # Copy backend source
    cp -r "$PROJECT_ROOT"/backend/* "$TEMP_DIR"/backend/

    # Exclude development files
    rm -rf "$TEMP_DIR"/backend/node_modules
    rm -rf "$TEMP_DIR"/backend/data/*.sqlite
    rm -rf "$TEMP_DIR"/backend/logs/*
    rm -rf "$TEMP_DIR"/backend/test-results

    # Create empty directories
    mkdir -p "$TEMP_DIR"/backend/{data,logs,exports,backups}

    log_success "Backend files copied"
}

copy_mcp_servers() {
    log_info "Copying MCP servers..."

    # Copy HexStrike AI (if available)
    if [ -d "/home/danii/hexstrike-ai" ]; then
        log_info "Copying HexStrike AI server..."
        cp -r /home/danii/hexstrike-ai/* "$TEMP_DIR"/mcp-servers/hexstrike-ai/
        rm -rf "$TEMP_DIR"/mcp-servers/hexstrike-ai/{hexstrike-env,*.log}
    else
        log_warning "HexStrike AI not found, creating placeholder"
        echo "# HexStrike AI server files should be placed here" > "$TEMP_DIR"/mcp-servers/hexstrike-ai/README.md
    fi

    # Copy AttackMCP (if available)
    if [ -d "/home/danii/attackmcp" ]; then
        log_info "Copying AttackMCP server..."
        cp -r /home/danii/attackmcp/* "$TEMP_DIR"/mcp-servers/attackmcp/
        rm -rf "$TEMP_DIR"/mcp-servers/attackmcp/{attackmcp-venv,*.db,*.log}
    else
        log_warning "AttackMCP not found, creating placeholder"
        echo "# AttackMCP server files should be placed here" > "$TEMP_DIR"/mcp-servers/attackmcp/README.md
    fi

    # Copy MCP-God-Mode (if available)
    if [ -d "/home/danii/MCP-God-Mode" ]; then
        log_info "Copying MCP-God-Mode server..."
        cp -r /home/danii/MCP-God-Mode/* "$TEMP_DIR"/mcp-servers/MCP-God-Mode/
        rm -rf "$TEMP_DIR"/mcp-servers/MCP-God-Mode/node_modules
    else
        log_warning "MCP-God-Mode not found, creating placeholder"
        echo "# MCP-God-Mode server files should be placed here" > "$TEMP_DIR"/mcp-servers/MCP-God-Mode/README.md
    fi

    log_success "MCP servers copied"
}

copy_deployment_files() {
    log_info "Copying deployment configuration files..."

    # Copy Docker files
    cp "$SCRIPT_DIR"/docker/* "$TEMP_DIR"/docker/
    cp "$PROJECT_ROOT"/docker-compose.yml "$TEMP_DIR"/
    cp "$PROJECT_ROOT"/Dockerfile "$TEMP_DIR"/

    # Copy requirements files
    cp "$SCRIPT_DIR"/requirements/* "$TEMP_DIR"/requirements/

    # Copy deployment scripts
    cp "$SCRIPT_DIR"/{deploy.sh,setup-mcp-servers.sh} "$TEMP_DIR"/
    chmod +x "$TEMP_DIR"/{deploy.sh,setup-mcp-servers.sh}

    log_success "Deployment files copied"
}

copy_documentation() {
    log_info "Copying documentation..."

    # Copy main documentation
    cp "$SCRIPT_DIR"/{README.md,ENTERPRISE_SETUP.md,TROUBLESHOOTING.md} "$TEMP_DIR"/docs/

    # Copy project documentation
    if [ -f "$PROJECT_ROOT"/README.md ]; then
        cp "$PROJECT_ROOT"/README.md "$TEMP_DIR"/docs/PROJECT_README.md
    fi

    # Copy technical documentation
    if [ -f "$PROJECT_ROOT"/CLAUDE.md ]; then
        cp "$PROJECT_ROOT"/CLAUDE.md "$TEMP_DIR"/docs/TECHNICAL_GUIDE.md
    fi

    # Copy additional documentation
    find "$PROJECT_ROOT" -name "*.md" -not -path "*/node_modules/*" -not -path "*/BACKUPS/*" | \
        head -20 | while read -r doc; do
            filename=$(basename "$doc")
            cp "$doc" "$TEMP_DIR"/docs/additional/
        done 2>/dev/null || true

    log_success "Documentation copied"
}

create_configuration_templates() {
    log_info "Creating configuration templates..."

    # Create main environment template
    cat > "$TEMP_DIR"/.env.example << 'EOF'
# Sunzi Cerebro Enterprise Configuration

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8890
VITE_WS_URL=ws://localhost:8890
VITE_ENVIRONMENT=production

# Backend Configuration
NODE_ENV=production
PORT=8890

# Database Configuration
DB_TYPE=sqlite
DB_PATH=./data/sunzi_cerebro_prod.sqlite

# PostgreSQL Configuration (if using)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sunzi_cerebro
DB_USER=sunzi_cerebro
DB_PASSWORD=change_this_password

# Authentication
JWT_SECRET=generate_random_64_character_string
SESSION_SECRET=generate_random_64_character_string

# MCP Servers
HEXSTRIKE_URL=http://localhost:8888
ATTACKMCP_ENABLED=true
GODMODE_ENABLED=true
NOTION_MCP_ENABLED=true

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
CORS_ORIGIN=http://localhost:3000

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Features
ENABLE_WEBSOCKETS=true
ENABLE_METRICS=true
ENABLE_SWAGGER=true
EOF

    # Create Docker environment template
    cat > "$TEMP_DIR"/.env.docker.example << 'EOF'
# Docker Compose Configuration
COMPOSE_PROJECT_NAME=sunzi-cerebro

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=8890
HEXSTRIKE_PORT=8888
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Security
JWT_SECRET=change_this_jwt_secret
SESSION_SECRET=change_this_session_secret
DB_PASSWORD=change_this_db_password

# Paths (adjust for your system)
HEXSTRIKE_PATH=/opt/sunzi-cerebro/mcp-servers/hexstrike-ai
ATTACKMCP_PATH=/opt/sunzi-cerebro/mcp-servers/attackmcp
GODMODE_PATH=/opt/sunzi-cerebro/mcp-servers/MCP-God-Mode
EOF

    log_success "Configuration templates created"
}

create_quick_start_script() {
    log_info "Creating quick start script..."

    cat > "$TEMP_DIR"/quick-start.sh << 'EOF'
#!/bin/bash

# Sunzi Cerebro Enterprise - Quick Start Script

echo "🚀 Sunzi Cerebro Enterprise Quick Start"
echo "======================================"
echo

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker detected - Starting Docker deployment..."
    ./deploy.sh --mode docker
elif command -v node &> /dev/null && command -v python3 &> /dev/null; then
    echo "✅ Node.js and Python detected - Starting native deployment..."
    ./deploy.sh --mode native
else
    echo "❌ Missing dependencies. Please install Docker or Node.js + Python3"
    echo
    echo "Docker installation:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sh get-docker.sh"
    echo
    echo "Or install Node.js 18+ and Python 3.9+"
    exit 1
fi
EOF

    chmod +x "$TEMP_DIR"/quick-start.sh

    log_success "Quick start script created"
}

create_version_info() {
    log_info "Creating version information..."

    cat > "$TEMP_DIR"/VERSION << EOF
Sunzi Cerebro Enterprise Deployment Package
==========================================

Version: 1.0.0
Build Date: $(date '+%Y-%m-%d %H:%M:%S UTC')
Git Commit: $(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo "unknown")
Build Host: $(hostname)

Components:
- Frontend: React 18.3.1 + TypeScript + Material-UI
- Backend: Node.js + Express + SQLite/PostgreSQL
- MCP Servers: 272+ security tools
- Infrastructure: Docker + Prometheus + Grafana

System Requirements:
- OS: Ubuntu 20.04+, Debian 11+, CentOS 8+
- RAM: 8GB minimum, 16GB recommended
- Storage: 50GB free space
- CPU: 4 cores minimum

Quick Start:
  ./quick-start.sh

Full Deployment:
  ./deploy.sh --mode docker

For support: https://docs.sunzi-cerebro.com
EOF

    log_success "Version information created"
}

create_checksums() {
    log_info "Creating checksums..."

    cd "$TEMP_DIR"
    find . -type f -not -name "checksums.txt" -exec sha256sum {} \; > checksums.txt

    log_success "Checksums created"
}

create_archive() {
    log_info "Creating deployment archive..."

    cd "$(dirname "$TEMP_DIR")"

    # Create compressed archive
    tar -czf "${ARCHIVE_NAME}.tar.gz" "$ARCHIVE_NAME"

    # Create archive info
    ARCHIVE_PATH="$(pwd)/${ARCHIVE_NAME}.tar.gz"
    ARCHIVE_SIZE=$(du -h "${ARCHIVE_NAME}.tar.gz" | cut -f1)

    log_success "Archive created: $ARCHIVE_PATH"
    log_info "Archive size: $ARCHIVE_SIZE"

    # Move archive to deployment package directory
    mv "${ARCHIVE_NAME}.tar.gz" "$SCRIPT_DIR/"

    echo "$SCRIPT_DIR/${ARCHIVE_NAME}.tar.gz"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    log_success "Cleanup completed"
}

print_summary() {
    echo
    log_success "🎉 Deployment package created successfully!"
    echo
    log_info "Package contents:"
    log_info "  📱 Frontend: React TypeScript application"
    log_info "  🔧 Backend: Node.js API server with SQLite"
    log_info "  🛡️  MCP Servers: 272+ security tools"
    log_info "  🐳 Docker: Complete containerized deployment"
    log_info "  📚 Documentation: Complete setup and usage guides"
    log_info "  🔧 Scripts: One-command deployment automation"
    echo
    log_info "To deploy the package:"
    log_info "  1. Extract: tar -xzf ${ARCHIVE_NAME}.tar.gz"
    log_info "  2. Deploy: cd ${ARCHIVE_NAME} && ./quick-start.sh"
    echo
    log_info "Package location: $SCRIPT_DIR/${ARCHIVE_NAME}.tar.gz"
    echo
    log_info "For enterprise deployment, see docs/ENTERPRISE_SETUP.md"
    log_info "For troubleshooting, see docs/TROUBLESHOOTING.md"
}

# Main execution
main() {
    print_banner

    log_info "Creating comprehensive deployment package..."
    log_info "Project root: $PROJECT_ROOT"
    log_info "Archive name: $ARCHIVE_NAME"

    create_directory_structure
    copy_frontend_files
    copy_backend_files
    copy_mcp_servers
    copy_deployment_files
    copy_documentation
    create_configuration_templates
    create_quick_start_script
    create_version_info
    create_checksums

    FINAL_ARCHIVE=$(create_archive)
    cleanup

    print_summary

    echo "$FINAL_ARCHIVE"
}

# Run main function
main "$@"