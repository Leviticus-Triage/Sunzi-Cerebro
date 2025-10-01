# Sunzi Cerebro - Deployment Guide

## Development Setup

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Git
- Docker (optional, for containerized development)
- Access to GitHub repository

### Local Development Setup

1. **Clone the Repository**

```bash
git clone https://github.com/Leviticus-Triage/Sunzi-Cerebro.git
cd Sunzi-Cerebro
```

2. **Install Dependencies**

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Environment Configuration**

```bash
# Copy example environment files
cp .env.example .env
cd frontend && cp .env.example .env && cd ..
cd backend && cp .env.example .env && cd ..

# Edit .env files with your configuration
```

4. **Start Development Servers**

```bash
# Start everything (frontend + backend)
npm run start

# Or start individually:
# Frontend (localhost:3000)
npm run start:frontend

# Backend (localhost:8890)
npm run start:backend
```

## Production Deployment

### Docker Deployment

1. **Build Docker Images**

```bash
# Build all services
docker-compose build

# Or build individually
docker build -t sunzi-cerebro-frontend ./frontend
docker build -t sunzi-cerebro-backend ./backend
```

2. **Run with Docker Compose**

```bash
docker-compose up -d
```

### Kubernetes Deployment

1. **Prerequisites**

- Kubernetes cluster
- kubectl configured
- Helm (optional)

2. **Deploy to Kubernetes**

```bash
# Apply configurations
kubectl apply -f deployment/k8s/

# Or using Helm
helm install sunzi-cerebro ./deployment/helm
```

3. **Verify Deployment**

```bash
kubectl get pods
kubectl get services
```

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:8890
VITE_WS_URL=ws://localhost:8890
```

### Backend (.env)

```
PORT=8890
DB_PATH=./data/production.sqlite
MCP_API_KEY=your-mcp-api-key
SECRET_KEY=your-jwt-secret
```

## Health Checks

### Backend API

- Health endpoint: `GET /health`
- Expected response: `{"status": "ok"}`

### Frontend

- Health page: `/health`
- Status: Should display system status dashboard

## Monitoring Setup

### Logging

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Kubernetes logs: `kubectl logs -l app=sunzi-cerebro`

### Metrics

- Prometheus endpoints configured at `/metrics`
- Grafana dashboards available in `deployment/monitoring/`

## Backup & Recovery

### Database Backup

```bash
# Local backup
./scripts/backup-db.sh

# Container backup
docker exec sunzi-cerebro-db ./backup.sh
```

### System Recovery

```bash
# Restore from backup
./scripts/restore-db.sh <backup-file>
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**

```bash
# Check port usage
lsof -i :3000
lsof -i :8890
```

2. **Database Connection Issues**

```bash
# Verify SQLite file
sqlite3 ./data/production.sqlite .tables
```

3. **MCP Integration Problems**

```bash
# Test MCP connection
curl -H "Authorization: Bearer $MCP_API_KEY" http://localhost:8890/mcp/health
```

## Security Considerations

### Production Checklist

- [ ] Use HTTPS only
- [ ] Configure secure headers
- [ ] Set up WAF rules
- [ ] Enable audit logging
- [ ] Configure backup rotation
- [ ] Set up monitoring alerts

### Compliance Requirements

- Follow security baseline in `docs/security/BASELINE.md`
- Ensure all compliance checks are enabled
- Verify audit logging is properly configured
