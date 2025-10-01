# 🚀 Sunzi Cerebro - Complete Deployment Package
## Enterprise AI-Powered Security Intelligence Platform

**Version:** v4.0.0 Enterprise Production Edition
**Created:** 2025-10-01
**Package Type:** Complete Self-Contained Deployment

---

## 📦 Package Contents

This deployment package contains everything needed to deploy Sunzi Cerebro on a fresh system:

```
sunzi-cerebro-deployment/
├── src/                          # React frontend source code
├── backend/                      # Node.js backend API
├── data/                         # SQLite database files
├── Documentation/                # Complete project documentation
├── docker/                       # Docker configurations
├── scripts/                      # Deployment automation scripts
├── DEPLOYMENT_README.md          # This file
├── docker-compose.yml            # Production Docker setup
├── package.json                  # Frontend dependencies
└── backend/package.json          # Backend dependencies
```

---

## ⚙️ System Requirements

### Minimum Requirements
- **OS:** Ubuntu 20.04+ / Debian 11+ / RHEL 8+
- **CPU:** 2 cores (4 recommended)
- **RAM:** 4GB (8GB recommended)
- **Storage:** 10GB free space
- **Network:** Internet connection for initial setup

### Required Software
- **Node.js:** v18.x or v20.x (LTS)
- **npm:** v9.x or higher
- **Docker:** 20.10+ (optional, for containerized deployment)
- **Docker Compose:** v2.x (optional)
- **Git:** v2.x (for version control)

---

## 🚀 Quick Start Deployment

### Option 1: Direct Installation (Recommended for Development)

```bash
# 1. Extract deployment package
tar -xzf sunzi-cerebro-deployment.tar.gz
cd sunzi-cerebro-deployment

# 2. Run automated setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Start services
./scripts/start-all.sh

# 4. Verify deployment
./scripts/health-check.sh
```

### Option 2: Docker Deployment (Recommended for Production)

```bash
# 1. Extract and navigate
tar -xzf sunzi-cerebro-deployment.tar.gz
cd sunzi-cerebro-deployment

# 2. Deploy with Docker Compose
docker-compose up -d

# 3. Check status
docker-compose ps
docker-compose logs -f
```

---

## 📋 Step-by-Step Manual Installation

### 1. Install Node.js (if not present)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version   # Should show v9.x or higher
```

### 2. Install Frontend Dependencies

```bash
# Navigate to project root
cd sunzi-cerebro-deployment

# Install frontend dependencies
npm install

# Build frontend for production (optional)
npm run build
```

### 3. Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Return to project root
cd ..
```

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional - defaults work for development)
nano .env

# Key variables:
# PORT=8890                     # Backend API port
# NODE_ENV=production           # Environment mode
# JWT_SECRET=<generate-secure>  # JWT signing key
# VITE_API_BASE_URL=http://localhost:8890  # Frontend API endpoint
```

### 5. Start Services

```bash
# Terminal 1: Start Backend API
cd backend
npm run start  # or npm run dev for development

# Terminal 2: Start Frontend (development)
# In project root:
npm run dev

# OR build and serve production frontend:
npm run build
npm run preview
```

### 6. Verify Deployment

```bash
# Check backend health
curl http://localhost:8890/health

# Expected response:
# {"status":"OK","timestamp":"...","services":{...}}

# Access frontend
# Open browser: http://localhost:3000
```

---

## 🐳 Docker Deployment Details

### Single Command Deployment

```bash
docker-compose up -d
```

### Docker Services Architecture

```
┌─────────────────────────────────────────────┐
│         Sunzi Cerebro Docker Stack          │
├─────────────────────────────────────────────┤
│ Frontend (React)     │ Port 3000           │
│ Backend API          │ Port 8890           │
│ SQLite Database      │ Persistent Volume   │
│ Health Monitoring    │ Auto-restart        │
└─────────────────────────────────────────────┘
```

### Docker Management Commands

```bash
# View logs
docker-compose logs -f              # All services
docker-compose logs -f frontend     # Frontend only
docker-compose logs -f backend      # Backend only

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Scale backend instances (load balancing)
docker-compose up -d --scale backend=3

# Update deployment
git pull  # or extract new package
docker-compose up -d --build
```

---

## 🔧 Configuration Guide

### Frontend Configuration

File: `.env` (project root)

```bash
# API Endpoint
VITE_API_BASE_URL=http://localhost:8890

# WebSocket Endpoint
VITE_WS_URL=ws://localhost:8890/ws

# Application Settings
VITE_APP_TITLE=Sunzi Cerebro
VITE_APP_VERSION=4.0.0
```

### Backend Configuration

File: `backend/.env`

```bash
# Server Settings
PORT=8890
NODE_ENV=production
HOST=0.0.0.0

# Authentication
JWT_SECRET=<generate-strong-secret-key>
JWT_EXPIRATION=24h

# Database
DATABASE_PATH=../data/sunzi_cerebro_production.sqlite

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

---

## 🔐 Security Configuration

### Default Credentials (CHANGE IN PRODUCTION!)

```
Username: sunzi.cerebro
Password: admin123
Role: admin
```

**⚠️ IMPORTANT:** Change default credentials immediately after first login!

### Security Checklist

- [ ] Change default admin password
- [ ] Generate secure JWT_SECRET
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up audit logging
- [ ] Implement backup strategy

---

## 🧪 Validation Scripts

### Health Check Script

```bash
./scripts/health-check.sh
```

Output:
```
🏥 Sunzi Cerebro Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Frontend: ONLINE (http://localhost:3000)
✅ Backend API: ONLINE (http://localhost:8890)
✅ Database: CONNECTED
✅ WebSocket: ACTIVE
✅ MCP Servers: 3/3 ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 System Status: HEALTHY
```

### Dependency Check

```bash
./scripts/check-dependencies.sh
```

Validates:
- Node.js version
- npm packages integrity
- System resources
- Port availability

### Database Validation

```bash
./scripts/validate-database.sh
```

Checks:
- Database file exists
- Schema integrity
- Test data insertion
- Query performance

---

## 📊 System Monitoring

### Backend Health Endpoint

```bash
curl http://localhost:8890/health | jq
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-01T13:26:56.691Z",
  "uptime": 5.73,
  "version": "3.2.0-production",
  "services": {
    "api": "running",
    "websocket": "running",
    "database": "healthy",
    "mcp_production": "active",
    "auth_production": "active"
  }
}
```

### Real-time Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend build logs (if using production build)
tail -f dist/build.log

# System logs (Docker)
docker-compose logs -f --tail=100
```

---

## 🐛 Troubleshooting Guide

### Issue: Frontend Not Loading

**Symptom:** Blank page or perpetual loading screen

**Solutions:**
1. Check backend is running:
   ```bash
   curl http://localhost:8890/health
   ```
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check browser console for errors (F12)
4. Verify API endpoint in `.env`

### Issue: Backend Connection Refused

**Symptom:** `ECONNREFUSED` errors

**Solutions:**
1. Verify backend is running:
   ```bash
   lsof -i :8890
   ```
2. Check backend logs:
   ```bash
   cat backend/logs/error.log
   ```
3. Restart backend:
   ```bash
   cd backend && npm run start
   ```

### Issue: Database Errors

**Symptom:** Database connection failures

**Solutions:**
1. Check database file exists:
   ```bash
   ls -lh data/*.sqlite
   ```
2. Verify permissions:
   ```bash
   chmod 664 data/*.sqlite
   ```
3. Reinitialize database:
   ```bash
   rm data/sunzi_cerebro_*.sqlite
   # Restart backend to auto-create
   ```

### Issue: Port Already in Use

**Symptom:** `EADDRINUSE` error

**Solutions:**
1. Find process using port:
   ```bash
   lsof -i :3000  # Frontend
   lsof -i :8890  # Backend
   ```
2. Kill process:
   ```bash
   kill -9 <PID>
   ```
3. Or change port in configuration

### Issue: npm Install Failures

**Symptom:** Dependency installation errors

**Solutions:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete lock files and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Use specific Node.js version:
   ```bash
   nvm use 20
   npm install
   ```

---

## 🔄 Backup and Restore

### Backup Script

```bash
./scripts/backup.sh
```

Creates:
- Database backup (`data/backups/`)
- Configuration backup
- Logs archive
- Timestamp: `backup-YYYYMMDD-HHMMSS.tar.gz`

### Manual Backup

```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d)

# Backup database
cp data/*.sqlite backups/$(date +%Y%m%d)/

# Backup configuration
cp .env backend/.env backups/$(date +%Y%m%d)/

# Backup logs
tar -czf backups/$(date +%Y%m%d)/logs.tar.gz backend/logs/
```

### Restore from Backup

```bash
./scripts/restore.sh <backup-file>
```

Or manually:
```bash
# Extract backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz

# Restore database
cp backup/data/*.sqlite data/

# Restore configuration
cp backup/.env .
cp backup/backend/.env backend/

# Restart services
docker-compose restart  # or manual restart
```

---

## 📈 Performance Optimization

### Production Build Optimization

```bash
# Build optimized frontend
npm run build

# Serve with production server (nginx recommended)
# Or use built-in preview:
npm run preview
```

### Database Optimization

```bash
# Compact SQLite database
sqlite3 data/sunzi_cerebro_production.sqlite "VACUUM;"

# Analyze and optimize
sqlite3 data/sunzi_cerebro_production.sqlite "ANALYZE;"
```

### Nginx Reverse Proxy (Recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8890;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8890;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📚 Additional Documentation

- **Technical Documentation:** `ABSCHLUSSARBEIT_VOLLSTÄNDIGE_DOKUMENTATION.md`
- **API Reference:** `BACKEND_API_REFERENCE.md`
- **System Architecture:** `CLAUDE.md`
- **Development Guide:** `DEVELOPMENT_STATUS_REPORT.md`
- **MCP Integration:** `MCP_TOOLS_TECHNICAL_SPECS.md`

---

## 🆘 Support and Contact

### Common Issues Database
Check `TROUBLESHOOTING.md` for detailed solutions to common problems.

### Log Files Location
- Backend logs: `backend/logs/app.log`
- Error logs: `backend/logs/error.log`
- Access logs: `backend/logs/access.log`
- Audit logs: `data/audit.log`

### System Information Command

```bash
./scripts/system-info.sh
```

Provides:
- OS and kernel version
- Node.js and npm versions
- Disk space usage
- Memory usage
- Active processes
- Port bindings

---

## ✅ Post-Deployment Checklist

After successful deployment, verify:

- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend health check passes
- [ ] Database initialized with test data
- [ ] WebSocket connection established
- [ ] Login functionality works
- [ ] MCP tools accessible
- [ ] Logs being written correctly
- [ ] Backup script runs successfully
- [ ] Security configurations applied
- [ ] Default credentials changed

---

## 🎉 Deployment Complete!

Your Sunzi Cerebro instance is now running!

**Access Points:**
- **Frontend UI:** http://localhost:3000
- **API Health:** http://localhost:8890/health
- **API Documentation:** http://localhost:8890/api/docs

**Next Steps:**
1. Change default admin password
2. Configure production security settings
3. Set up SSL/TLS certificates
4. Configure backup automation
5. Review audit logs regularly

---

**🛡️ Sunzi Cerebro - Enterprise AI-Powered Security Intelligence Platform**
*"Know your enemy, know yourself, and victory is assured." - Sun Tzu*

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-01
**Deployment Package:** v4.0.0 Enterprise Production Edition
