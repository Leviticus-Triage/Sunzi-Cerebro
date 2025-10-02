# Sunzi Cerebro Enterprise - Troubleshooting Guide

## 🔍 Quick Diagnostics

### System Health Check
```bash
# Run comprehensive health check
./health-check.sh

# Manual service checks
curl -f http://localhost:3000/                           # Frontend
curl -f http://localhost:8890/api/system/health          # Backend API
curl -f http://localhost:8888/health                     # HexStrike AI
curl -f http://localhost:9090/-/healthy                  # Prometheus
curl -f http://localhost:3001/api/health                 # Grafana
```

### Log Analysis
```bash
# View application logs
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# Docker container logs
docker-compose logs -f sunzi-cerebro-backend
docker-compose logs -f sunzi-cerebro-frontend
docker-compose logs -f hexstrike-ai

# System logs
journalctl -u sunzi-cerebro-backend -f
journalctl -u docker -f
```

## 🚨 Common Issues and Solutions

### 1. Frontend Issues

#### Issue: Frontend not loading / White screen
**Symptoms**: Browser shows blank page or loading indefinitely

**Solutions**:
```bash
# Check if frontend service is running
curl -I http://localhost:3000

# Check browser console for errors
# Open DevTools (F12) and check Console tab

# Restart frontend service
docker-compose restart sunzi-cerebro-frontend

# For native deployment
systemctl restart sunzi-cerebro-frontend

# Check build process
npm run build
```

#### Issue: API connection errors
**Symptoms**: Frontend loads but shows "Connection Error" or "API Unavailable"

**Solutions**:
```bash
# Verify backend is running
curl http://localhost:8890/api/system/health

# Check CORS configuration
grep CORS backend/.env

# Verify environment variables
cat .env | grep VITE_API_BASE_URL

# Common fix: Update API URL
echo "VITE_API_BASE_URL=http://localhost:8890" >> .env
```

### 2. Backend API Issues

#### Issue: Backend won't start
**Symptoms**: API endpoints return connection refused or timeout

**Solutions**:
```bash
# Check port availability
lsof -ti:8890

# Kill conflicting processes
lsof -ti:8890 | xargs kill -9

# Check environment configuration
cd backend && cat .env

# Check database connectivity
sqlite3 data/sunzi_cerebro_dev.sqlite ".tables"

# Restart with verbose logging
LOG_LEVEL=debug npm run dev
```

#### Issue: Database errors
**Symptoms**: "Database not found" or "Table doesn't exist" errors

**Solutions**:
```bash
# Check database file
ls -la backend/data/

# Run migrations
cd backend
npm run db:migrate

# Reset database (development only)
npm run db:reset

# For SQLite issues
sqlite3 data/sunzi_cerebro_dev.sqlite "PRAGMA integrity_check;"

# Check database permissions
chmod 664 data/sunzi_cerebro_dev.sqlite
```

#### Issue: Authentication failures
**Symptoms**: "Invalid token" or "Authentication required" errors

**Solutions**:
```bash
# Check JWT secret
grep JWT_SECRET backend/.env

# Regenerate JWT secret
openssl rand -hex 32

# Clear browser storage (client-side)
# In browser DevTools: Application > Storage > Clear Storage

# Reset user session
DELETE FROM user_sessions WHERE user_id = 1;
```

### 3. MCP Server Issues

#### Issue: HexStrike AI not responding
**Symptoms**: Port 8888 not accessible or health check fails

**Solutions**:
```bash
# Check if HexStrike is running
curl http://localhost:8888/health

# Check Python virtual environment
cd mcp-servers/hexstrike-ai
source hexstrike-env/bin/activate
python3 --version

# Check Python dependencies
pip list | grep fastmcp

# Restart HexStrike AI
./start-hexstrike.sh

# Check logs
tail -f mcp-servers/hexstrike-ai/hexstrike.log

# Port conflict resolution
lsof -ti:8888 | xargs kill -9
```

#### Issue: MCP-God-Mode not starting
**Symptoms**: Node.js MCP server fails to start

**Solutions**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Check build status
cd mcp-servers/MCP-God-Mode
npm run build

# Check dependencies
npm list @modelcontextprotocol/sdk

# Restart service
./start-godmode.sh

# Debug mode
DEBUG=* node dist/server-modular.js
```

#### Issue: AttackMCP connection problems
**Symptoms**: STDIO MCP server not accessible

**Solutions**:
```bash
# Check Python environment
cd mcp-servers/attackmcp
source attackmcp-env/bin/activate

# Test MCP server
python3 server.py

# Check dependencies
pip list | grep mcp

# Verify tool availability
which nmap
which httpx
```

### 4. Docker Issues

#### Issue: Container won't start
**Symptoms**: Docker container exits immediately or fails to start

**Solutions**:
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs sunzi-cerebro-backend

# Check resource usage
docker stats

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d

# Clean Docker system
docker system prune -f
docker volume prune -f
```

#### Issue: Port conflicts
**Symptoms**: "Port already in use" errors

**Solutions**:
```bash
# Find processes using ports
lsof -ti:3000,8890,8888

# Kill conflicting processes
pkill -f "npm.*dev"
pkill -f "node.*server"
pkill -f "python.*server"

# Use different ports
export FRONTEND_PORT=3001
export BACKEND_PORT=8891
export HEXSTRIKE_PORT=8889

# Restart with new ports
docker-compose up -d
```

### 5. Database Issues

#### Issue: SQLite database locked
**Symptoms**: "Database is locked" error messages

**Solutions**:
```bash
# Check for long-running queries
sqlite3 data/sunzi_cerebro_dev.sqlite "PRAGMA busy_timeout=30000;"

# Restart application
pkill -f "node.*server.js"
sleep 5
npm run dev

# Check file permissions
ls -la data/sunzi_cerebro_dev.sqlite
chmod 664 data/sunzi_cerebro_dev.sqlite

# Last resort: backup and recreate
cp data/sunzi_cerebro_dev.sqlite data/backup.sqlite
rm data/sunzi_cerebro_dev.sqlite
npm run db:migrate
```

#### Issue: Migration failures
**Symptoms**: Database schema out of sync

**Solutions**:
```bash
# Check migration status
cd backend
npx sequelize-cli db:migrate:status

# Run pending migrations
npx sequelize-cli db:migrate

# Rollback and retry
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate

# Reset database (development only)
npm run db:reset
```

### 6. Performance Issues

#### Issue: Slow API responses
**Symptoms**: API calls taking >5 seconds to respond

**Solutions**:
```bash
# Check system resources
top
htop
free -h
df -h

# Check database performance
sqlite3 data/sunzi_cerebro_dev.sqlite "ANALYZE;"

# Enable query optimization
sqlite3 data/sunzi_cerebro_dev.sqlite "PRAGMA optimize;"

# Check for memory leaks
ps aux | grep node
pmap [node_process_id]

# Restart services
./deploy.sh --mode docker
```

#### Issue: High memory usage
**Symptoms**: System running out of memory

**Solutions**:
```bash
# Check memory usage by service
docker stats

# Restart services with memory limits
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Clear cache
redis-cli FLUSHALL

# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 7. Network Issues

#### Issue: Cannot access web interface
**Symptoms**: Connection timeout when accessing http://localhost:3000

**Solutions**:
```bash
# Check if services are bound to localhost
netstat -tlnp | grep :3000

# Check firewall rules
ufw status
iptables -L

# For Docker networking issues
docker network ls
docker network inspect sunzi-cerebro-network

# Test internal connectivity
docker exec sunzi-cerebro-backend curl http://sunzi-cerebro-frontend:3000
```

#### Issue: CORS errors
**Symptoms**: Browser console shows CORS policy errors

**Solutions**:
```bash
# Check CORS configuration
grep CORS backend/.env

# Update CORS origin
echo "CORS_ORIGIN=http://localhost:3000" >> backend/.env

# For development, allow all origins
echo "CORS_ORIGIN=*" >> backend/.env

# Restart backend
docker-compose restart sunzi-cerebro-backend
```

## 🔧 Advanced Diagnostics

### System Resource Monitoring
```bash
# CPU and memory monitoring
htop

# Disk I/O monitoring
iotop

# Network monitoring
iftop

# Docker resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### Database Diagnostics
```bash
# SQLite diagnostics
sqlite3 data/sunzi_cerebro_dev.sqlite << EOF
.schema
.tables
PRAGMA table_info(users);
PRAGMA integrity_check;
PRAGMA foreign_key_check;
ANALYZE;
.quit
EOF

# Check database size
du -h data/sunzi_cerebro_dev.sqlite

# Vacuum database
sqlite3 data/sunzi_cerebro_dev.sqlite "VACUUM;"
```

### MCP Server Diagnostics
```bash
# Test MCP protocol
python3 -c "
import json
import subprocess

# Test HexStrike AI
try:
    result = subprocess.run(['curl', 'http://localhost:8888/tools'],
                          capture_output=True, text=True)
    print('HexStrike Tools:', len(json.loads(result.stdout)))
except:
    print('HexStrike AI not accessible')
"

# Test tool execution
curl -X POST http://localhost:8888/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "nmap", "target": "127.0.0.1", "options": ["-sn"]}'
```

## 🚑 Emergency Recovery

### Complete System Reset
```bash
# DANGER: This will destroy all data
./emergency-reset.sh

# Or manual steps:
docker-compose down -v
docker system prune -af
rm -rf data/ logs/
./deploy.sh --mode docker --force
```

### Backup and Restore
```bash
# Create emergency backup
tar -czf emergency-backup-$(date +%Y%m%d).tar.gz \
  data/ logs/ .env backend/.env

# Restore from backup
tar -xzf emergency-backup-YYYYMMDD.tar.gz
docker-compose up -d
```

### Service Recovery
```bash
# Restart all services
./stop-all-mcp.sh
docker-compose down
sleep 10
docker-compose up -d
./start-all-mcp.sh

# Health check after recovery
./health-check.sh
```

## 📞 Getting Help

### Information to Collect
When reporting issues, please collect:

```bash
# System information
uname -a
docker --version
node --version
python3 --version

# Service status
docker-compose ps
systemctl status sunzi-cerebro-*

# Recent logs
tail -n 100 backend/logs/error.log
docker-compose logs --tail=100 sunzi-cerebro-backend

# Configuration (remove sensitive data)
cat .env | grep -v PASSWORD | grep -v SECRET
```

### Support Channels
- **GitHub Issues**: https://github.com/sunzi-cerebro/issues
- **Documentation**: https://docs.sunzi-cerebro.com
- **Community Forum**: https://forum.sunzi-cerebro.com
- **Email Support**: support@sunzi-cerebro.com

### Emergency Contacts
- **Critical Issues**: emergency@sunzi-cerebro.com
- **Security Issues**: security@sunzi-cerebro.com
- **24/7 Hotline**: +1-XXX-XXX-XXXX (Enterprise customers)

---

**🛠️ Remember: Most issues can be resolved by restarting services and checking logs. Always backup your data before making major changes.**