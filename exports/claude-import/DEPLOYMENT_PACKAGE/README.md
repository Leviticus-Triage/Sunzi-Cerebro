# Sunzi Cerebro Enterprise - All-in-One Deployment Package

## 🚀 Quick Start - One Command Deployment

```bash
# Extract and deploy everything
tar -xzf sunzi-cerebro-enterprise-deployment.tar.gz
cd sunzi-cerebro-deployment
chmod +x deploy.sh
./deploy.sh
```

## 📋 Package Contents

This deployment package contains a complete Sunzi Cerebro Enterprise system with:

### 🎨 Frontend Components
- **React TypeScript Application** (Port 3000)
- Material-UI v5 components
- PWA capabilities
- Real-time WebSocket integration

### 🔧 Backend Components
- **Node.js Express API** (Port 8890)
- SQLite production database
- JWT authentication system
- WebSocket support
- Comprehensive logging

### 🛡️ MCP Server Ecosystem (272+ Security Tools)
- **HexStrike AI Server** (Port 8888) - 45+ penetration testing tools
- **AttackMCP Server** (STDIO) - 7+ network assessment tools
- **MCP-God-Mode Server** (STDIO) - 152+ professional security tools
- **Notion MCP Server** (STDIO) - Documentation and reporting tools

### 🐳 Infrastructure
- Docker Compose configuration
- NGINX reverse proxy
- PostgreSQL database (optional)
- Redis caching
- Prometheus monitoring
- Grafana dashboards

## 🏗️ System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+, Debian 11+, or CentOS 8+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB free space
- **CPU**: 4 cores minimum, 8 cores recommended
- **Network**: Internet connection for tool downloads

### Required Software (Auto-installed)
- Docker & Docker Compose
- Node.js 18+
- Python 3.9+
- Git
- Common security tools (nmap, curl, etc.)

## 📦 Deployment Options

### Option 1: Docker Deployment (Recommended)
```bash
./deploy.sh --mode docker
```
- Complete containerized deployment
- Automatic service management
- Isolated environments
- Production-ready configuration

### Option 2: Native Deployment
```bash
./deploy.sh --mode native
```
- Direct system installation
- Better performance
- Full system integration
- Requires root access

### Option 3: Development Mode
```bash
./deploy.sh --mode development
```
- Local development setup
- Hot-reload enabled
- Debug logging
- SQLite database

## 🔧 Configuration

### Environment Variables
The deployment script will create appropriate `.env` files with:

- **Database Configuration**: SQLite (default) or PostgreSQL
- **Authentication**: JWT secrets and session keys
- **MCP Servers**: Connection strings and API keys
- **Monitoring**: Prometheus and Grafana settings
- **Security**: CORS, rate limiting, and security headers

### Port Configuration
Default ports (configurable during deployment):
- Frontend: 3000
- Backend API: 8890
- HexStrike AI: 8888
- Prometheus: 9090
- Grafana: 3001
- NGINX: 80/443

## 🚀 Post-Deployment

### Access Points
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8890/api/docs
- **System Monitoring**: http://localhost:3001 (Grafana)
- **Metrics**: http://localhost:9090 (Prometheus)

### Default Credentials
- **Admin User**: `sunzi.cerebro` / `admin123`
- **Grafana**: `admin` / `sunzi-cerebro-2025`
- **Database**: Auto-configured

### Health Checks
```bash
# Verify all services
curl http://localhost:8890/api/system/health

# Check MCP servers
curl http://localhost:8890/api/mcp/servers

# Test tool availability
curl http://localhost:8890/api/mcp/tools
```

## 📊 Features Included

### ✅ Core Platform
- Multi-tenant architecture
- Role-based access control (RBAC)
- Real-time collaboration
- Comprehensive audit logging
- RESTful API with OpenAPI documentation

### ✅ Security Tools Integration
- **272+ Professional Security Tools**
- Network reconnaissance and scanning
- Web application security testing
- Binary analysis and reverse engineering
- Cloud security assessment
- OSINT and intelligence gathering
- Compliance frameworks (GDPR, ISO 27001)

### ✅ AI-Powered Features
- Smart tool recommendations
- Automated vulnerability assessment
- Strategic analysis based on Sun Tzu principles
- Predictive threat intelligence
- AI-generated security reports

### ✅ Enterprise Features
- Horizontal scaling support
- Load balancing configuration
- Backup and recovery systems
- Performance monitoring
- Security compliance reporting

## 🔒 Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- TLS/SSL encryption in transit
- Secure JWT token management
- Regular security updates

### Network Security
- Firewall configuration included
- Rate limiting and DDoS protection
- API authentication required
- Audit logging for all activities

### Compliance
- GDPR compliance features
- ISO 27001 framework support
- SOC 2 Type II controls
- Regular security assessments

## 📚 Documentation

### Included Documentation
- **Technical Documentation**: Complete API reference
- **User Guides**: Step-by-step usage instructions
- **Admin Guides**: System administration
- **Security Policies**: Compliance and security procedures
- **Troubleshooting**: Common issues and solutions

### Online Resources
- **GitHub Repository**: Latest updates and issues
- **Community Forum**: User discussions and support
- **Security Advisories**: CVE notifications and patches
- **Training Materials**: Video tutorials and workshops

## 🆘 Support

### Self-Service
- Built-in health monitoring
- Automated log analysis
- Performance diagnostics
- System recovery tools

### Professional Support
- Email support: support@sunzi-cerebro.com
- Community forum: forum.sunzi-cerebro.com
- Documentation: docs.sunzi-cerebro.com
- Emergency hotline: +1-XXX-XXX-XXXX

## 📄 License

This deployment package includes:
- **Sunzi Cerebro Platform**: MIT License
- **Third-party Tools**: Various licenses (see LICENSES/ directory)
- **Documentation**: Creative Commons Attribution 4.0

## 🔄 Updates

### Automatic Updates
```bash
# Check for updates
./update.sh --check

# Apply updates
./update.sh --apply
```

### Manual Updates
- Download latest deployment package
- Run migration scripts
- Verify system integrity

---

**🎯 Sunzi Cerebro Enterprise - Where Ancient Wisdom Meets Modern Cybersecurity**

*"Know your enemy, know yourself, and victory is assured." - Sun Tzu*

---

For detailed technical documentation, see the `docs/` directory.
For quick troubleshooting, see `TROUBLESHOOTING.md`.
For enterprise deployment, see `ENTERPRISE_SETUP.md`.