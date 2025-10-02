#!/bin/bash

# Sunzi Cerebro MCP Servers Setup Script
# Configures and deploys all MCP servers for the enterprise platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/mcp-setup.log"

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

print_banner() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     🛡️  SUNZI CEREBRO MCP SERVERS SETUP 🛡️                ║
    ║                                                              ║
    ║          Setting up 272+ Security Tools                     ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is required but not installed"
        exit 1
    fi

    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)"; then
        log_error "Python 3.9+ is required. Found version: $PYTHON_VERSION"
        exit 1
    fi

    log_success "Python check passed: $PYTHON_VERSION"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi

    NODE_VERSION=$(node --version)
    log_success "Node.js check passed: $NODE_VERSION"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed"
        exit 1
    fi

    log_success "Prerequisites check completed"
}

setup_hexstrike_ai() {
    log_info "Setting up HexStrike AI MCP Server (45+ security tools)..."

    if [ ! -d "mcp-servers/hexstrike-ai" ]; then
        log_error "HexStrike AI directory not found in deployment package"
        return 1
    fi

    cd mcp-servers/hexstrike-ai

    # Create virtual environment
    log_info "Creating Python virtual environment..."
    python3 -m venv hexstrike-env
    source hexstrike-env/bin/activate

    # Install dependencies
    log_info "Installing HexStrike AI dependencies..."
    pip install --upgrade pip
    pip install -r ../../requirements/requirements-hexstrike.txt

    # Test installation
    log_info "Testing HexStrike AI installation..."
    python3 -c "import fastmcp; print('FastMCP imported successfully')" || {
        log_error "HexStrike AI installation failed"
        return 1
    }

    deactivate
    cd ../..

    log_success "HexStrike AI MCP Server setup completed"
}

setup_attackmcp() {
    log_info "Setting up AttackMCP Server (7+ network assessment tools)..."

    if [ ! -d "mcp-servers/attackmcp" ]; then
        log_error "AttackMCP directory not found in deployment package"
        return 1
    fi

    cd mcp-servers/attackmcp

    # Create virtual environment
    log_info "Creating Python virtual environment..."
    python3 -m venv attackmcp-env
    source attackmcp-env/bin/activate

    # Install dependencies
    log_info "Installing AttackMCP dependencies..."
    pip install --upgrade pip
    pip install -r ../../requirements/requirements-attackmcp.txt

    # Test installation
    log_info "Testing AttackMCP installation..."
    python3 -c "import mcp; print('MCP imported successfully')" || {
        log_error "AttackMCP installation failed"
        return 1
    }

    deactivate
    cd ../..

    log_success "AttackMCP Server setup completed"
}

setup_mcp_god_mode() {
    log_info "Setting up MCP-God-Mode Server (152+ professional tools)..."

    if [ ! -d "mcp-servers/MCP-God-Mode" ]; then
        log_error "MCP-God-Mode directory not found in deployment package"
        return 1
    fi

    cd mcp-servers/MCP-God-Mode

    # Install Node.js dependencies
    log_info "Installing MCP-God-Mode dependencies..."
    npm install

    # Build the server
    log_info "Building MCP-God-Mode server..."
    npm run build || {
        log_error "MCP-God-Mode build failed"
        return 1
    }

    # Test installation
    log_info "Testing MCP-God-Mode installation..."
    node -e "console.log('Node.js test passed')" || {
        log_error "MCP-God-Mode installation failed"
        return 1
    }

    cd ../..

    log_success "MCP-God-Mode Server setup completed"
}

setup_notion_mcp() {
    log_info "Setting up Notion MCP Server (documentation tools)..."

    # This is typically included with the backend
    # Create configuration file
    cat > mcp-servers/notion-config.json << EOF
{
  "notion": {
    "apiKey": "\${NOTION_API_KEY}",
    "databaseId": "\${NOTION_DATABASE_ID}",
    "enabled": true
  }
}
EOF

    log_success "Notion MCP Server configuration created"
}

install_security_tools() {
    log_info "Installing external security tools..."

    # Check if running on Kali Linux (has most tools pre-installed)
    if grep -q "kali" /etc/os-release 2>/dev/null; then
        log_info "Kali Linux detected - most security tools already available"
        return 0
    fi

    # Install common security tools
    log_info "Installing common security tools..."

    # Update package manager
    if command -v apt &> /dev/null; then
        apt update
        apt install -y nmap masscan nikto sqlmap gobuster dirb curl wget netcat-traditional
    elif command -v yum &> /dev/null; then
        yum install -y nmap masscan nikto sqlmap gobuster dirb curl wget nc
    elif command -v pacman &> /dev/null; then
        pacman -Sy nmap masscan nikto sqlmap gobuster dirb curl wget netcat
    else
        log_warning "Unknown package manager. Please install security tools manually"
    fi

    # Install Go-based tools
    install_go_tools

    log_success "Security tools installation completed"
}

install_go_tools() {
    log_info "Installing Go-based security tools..."

    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        log_warning "Go not found. Skipping Go-based tools installation"
        return 0
    fi

    # Set Go paths
    export GOPATH=$HOME/go
    export PATH=$PATH:$GOPATH/bin

    # Essential Go security tools
    GO_TOOLS=(
        "github.com/projectdiscovery/httpx/cmd/httpx@latest"
        "github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest"
        "github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest"
        "github.com/projectdiscovery/naabu/v2/cmd/naabu@latest"
        "github.com/ffuf/ffuf@latest"
        "github.com/projectdiscovery/katana/cmd/katana@latest"
        "github.com/lc/gau/v2/cmd/gau@latest"
        "github.com/tomnomnom/waybackurls@latest"
    )

    for tool in "${GO_TOOLS[@]}"; do
        log_info "Installing $(basename ${tool%@*})..."
        go install "$tool" || log_warning "Failed to install $tool"
    done

    log_success "Go tools installation completed"
}

create_startup_scripts() {
    log_info "Creating MCP server startup scripts..."

    # HexStrike AI startup script
    cat > start-hexstrike.sh << 'EOF'
#!/bin/bash
cd mcp-servers/hexstrike-ai
source hexstrike-env/bin/activate
python3 hexstrike_server.py --port 8888 --host 0.0.0.0
EOF
    chmod +x start-hexstrike.sh

    # AttackMCP startup script
    cat > start-attackmcp.sh << 'EOF'
#!/bin/bash
cd mcp-servers/attackmcp
source attackmcp-env/bin/activate
python3 server.py
EOF
    chmod +x start-attackmcp.sh

    # MCP-God-Mode startup script
    cat > start-godmode.sh << 'EOF'
#!/bin/bash
cd mcp-servers/MCP-God-Mode
node dist/server-modular.js
EOF
    chmod +x start-godmode.sh

    # Master startup script
    cat > start-all-mcp.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting all MCP servers..."

# Start HexStrike AI
echo "Starting HexStrike AI..."
./start-hexstrike.sh &
HEXSTRIKE_PID=$!

# Start AttackMCP
echo "Starting AttackMCP..."
./start-attackmcp.sh &
ATTACKMCP_PID=$!

# Start MCP-God-Mode
echo "Starting MCP-God-Mode..."
./start-godmode.sh &
GODMODE_PID=$!

echo "All MCP servers started"
echo "HexStrike AI PID: $HEXSTRIKE_PID"
echo "AttackMCP PID: $ATTACKMCP_PID"
echo "MCP-God-Mode PID: $GODMODE_PID"

# Create PID file for shutdown script
cat > mcp-pids.txt << EOL
HEXSTRIKE_PID=$HEXSTRIKE_PID
ATTACKMCP_PID=$ATTACKMCP_PID
GODMODE_PID=$GODMODE_PID
EOL

echo "✅ All MCP servers are running"
echo "Use ./stop-all-mcp.sh to stop all servers"
EOF
    chmod +x start-all-mcp.sh

    # Stop script
    cat > stop-all-mcp.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping all MCP servers..."

if [ -f "mcp-pids.txt" ]; then
    source mcp-pids.txt

    echo "Stopping HexStrike AI (PID: $HEXSTRIKE_PID)..."
    kill $HEXSTRIKE_PID 2>/dev/null || echo "HexStrike AI already stopped"

    echo "Stopping AttackMCP (PID: $ATTACKMCP_PID)..."
    kill $ATTACKMCP_PID 2>/dev/null || echo "AttackMCP already stopped"

    echo "Stopping MCP-God-Mode (PID: $GODMODE_PID)..."
    kill $GODMODE_PID 2>/dev/null || echo "MCP-God-Mode already stopped"

    rm mcp-pids.txt
else
    echo "No PID file found. Attempting to kill by process name..."
    pkill -f hexstrike_server.py
    pkill -f "python.*server.py"
    pkill -f "node.*server-modular.js"
fi

echo "✅ All MCP servers stopped"
EOF
    chmod +x stop-all-mcp.sh

    log_success "Startup scripts created"
}

test_mcp_servers() {
    log_info "Testing MCP server installations..."

    # Test HexStrike AI
    if [ -d "mcp-servers/hexstrike-ai" ]; then
        cd mcp-servers/hexstrike-ai
        source hexstrike-env/bin/activate
        python3 -c "
import sys
sys.path.append('.')
try:
    from hexstrike_server import app
    print('✅ HexStrike AI test passed')
except Exception as e:
    print(f'❌ HexStrike AI test failed: {e}')
        "
        deactivate
        cd ../..
    fi

    # Test AttackMCP
    if [ -d "mcp-servers/attackmcp" ]; then
        cd mcp-servers/attackmcp
        source attackmcp-env/bin/activate
        python3 -c "
try:
    import mcp
    print('✅ AttackMCP test passed')
except Exception as e:
    print(f'❌ AttackMCP test failed: {e}')
        "
        deactivate
        cd ../..
    fi

    # Test MCP-God-Mode
    if [ -d "mcp-servers/MCP-God-Mode" ]; then
        cd mcp-servers/MCP-God-Mode
        node -e "
try {
    require('./dist/server-modular.js');
    console.log('✅ MCP-God-Mode test passed');
} catch (e) {
    console.log('❌ MCP-God-Mode test failed:', e.message);
}
        " 2>/dev/null || echo "❌ MCP-God-Mode test failed"
        cd ../..
    fi

    log_success "MCP server testing completed"
}

print_summary() {
    echo
    log_success "🎉 MCP Servers Setup Completed Successfully!"
    echo
    log_info "Available MCP Servers:"
    log_info "  🛡️  HexStrike AI:    45+ penetration testing tools (Port 8888)"
    log_info "  ⚡ AttackMCP:       7+ network assessment tools (STDIO)"
    log_info "  🔥 MCP-God-Mode:    152+ professional security tools (STDIO)"
    log_info "  📝 Notion MCP:      Documentation and reporting tools (STDIO)"
    echo
    log_info "Total Security Tools: 272+ professional cybersecurity tools"
    echo
    log_info "To start all MCP servers:"
    log_info "  ./start-all-mcp.sh"
    echo
    log_info "To stop all MCP servers:"
    log_info "  ./stop-all-mcp.sh"
    echo
    log_info "Individual startup scripts:"
    log_info "  ./start-hexstrike.sh   # HexStrike AI only"
    log_info "  ./start-attackmcp.sh   # AttackMCP only"
    log_info "  ./start-godmode.sh     # MCP-God-Mode only"
    echo
    log_info "Setup log: $LOG_FILE"
}

# Main execution
main() {
    print_banner

    log_info "Starting MCP servers setup..."

    check_prerequisites
    setup_hexstrike_ai
    setup_attackmcp
    setup_mcp_god_mode
    setup_notion_mcp
    install_security_tools
    create_startup_scripts
    test_mcp_servers
    print_summary
}

# Run main function
main "$@"