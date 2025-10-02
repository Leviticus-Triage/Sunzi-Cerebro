# Sunzi Cerebro Enterprise - Production Deployment Guide

## 🏢 Enterprise Production Deployment

This guide covers production deployment for enterprise environments with high availability, security, and compliance requirements.

## 📋 Enterprise Requirements

### Infrastructure Requirements
- **Minimum**: 32GB RAM, 16 CPU cores, 500GB SSD storage
- **Recommended**: 64GB RAM, 32 CPU cores, 1TB NVMe storage
- **Operating System**: Ubuntu 22.04 LTS or RHEL 8.5+
- **Network**: 1Gbps+ network connectivity
- **SSL**: Valid SSL certificates for HTTPS

### Security Requirements
- **Firewall**: Properly configured enterprise firewall
- **VPN**: Secure VPN access for administration
- **RBAC**: Active Directory or LDAP integration
- **Compliance**: SOC 2, ISO 27001, GDPR compliance
- **Backup**: Enterprise backup solution

## 🚀 Production Deployment Steps

### 1. Pre-Deployment Preparation

```bash
# Download and extract deployment package
wget https://releases.sunzi-cerebro.com/enterprise/latest.tar.gz
tar -xzf sunzi-cerebro-enterprise-latest.tar.gz
cd sunzi-cerebro-deployment

# Verify checksums
sha256sum -c checksums.txt
```

### 2. Infrastructure Setup

```bash
# Create dedicated user
useradd -m -s /bin/bash sunzi-cerebro
usermod -aG docker sunzi-cerebro

# Create data directories
mkdir -p /opt/sunzi-cerebro/{data,logs,backups,ssl}
chown -R sunzi-cerebro:sunzi-cerebro /opt/sunzi-cerebro

# Copy deployment files
cp -r * /opt/sunzi-cerebro/
chown -R sunzi-cerebro:sunzi-cerebro /opt/sunzi-cerebro
```

### 3. SSL Certificate Configuration

```bash
# Place your SSL certificates
cp your-domain.crt /opt/sunzi-cerebro/ssl/
cp your-domain.key /opt/sunzi-cerebro/ssl/
cp ca-bundle.crt /opt/sunzi-cerebro/ssl/

# Set proper permissions
chmod 600 /opt/sunzi-cerebro/ssl/*.key
chmod 644 /opt/sunzi-cerebro/ssl/*.crt
```

### 4. Environment Configuration

```bash
# Switch to sunzi-cerebro user
su - sunzi-cerebro
cd /opt/sunzi-cerebro

# Configure production environment
cp .env.production.example .env.production

# Edit configuration
vim .env.production
```

#### Production Environment Variables
```bash
# Domain Configuration
DOMAIN=your-domain.com
SSL_CERT_PATH=/opt/sunzi-cerebro/ssl/your-domain.crt
SSL_KEY_PATH=/opt/sunzi-cerebro/ssl/your-domain.key

# Database Configuration (PostgreSQL for production)
DB_TYPE=postgresql
DB_HOST=postgres.internal.domain.com
DB_PORT=5432
DB_NAME=sunzi_cerebro_prod
DB_USER=sunzi_cerebro
DB_PASSWORD=<strong-password>
DB_SSL=true

# Redis Configuration
REDIS_HOST=redis.internal.domain.com
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Authentication
JWT_SECRET=<64-character-random-string>
SESSION_SECRET=<64-character-random-string>

# Security
RATE_LIMIT_WINDOW=300000
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://your-domain.com

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
LOG_LEVEL=warn

# LDAP/Active Directory
LDAP_ENABLED=true
LDAP_URL=ldap://ad.internal.domain.com
LDAP_BASE_DN=DC=internal,DC=domain,DC=com
LDAP_BIND_DN=CN=sunzi-bind,OU=Service Accounts,DC=internal,DC=domain,DC=com
LDAP_BIND_PASSWORD=<ldap-password>

# Compliance
AUDIT_LOGGING=true
DATA_RETENTION_DAYS=2555  # 7 years
ENCRYPTION_AT_REST=true
```

### 5. Database Setup (PostgreSQL)

```bash
# Create PostgreSQL database
sudo -u postgres psql << EOF
CREATE DATABASE sunzi_cerebro_prod;
CREATE USER sunzi_cerebro WITH ENCRYPTED PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE sunzi_cerebro_prod TO sunzi_cerebro;
\q
EOF

# Run database migrations
cd /opt/sunzi-cerebro/backend
npm run db:migrate:production
```

### 6. Production Deployment

```bash
# Deploy with production profile
./deploy.sh --mode docker --profile production

# Or for native deployment
./deploy.sh --mode native --production
```

### 7. Load Balancer Configuration

#### NGINX Configuration
```nginx
upstream sunzi_cerebro_backend {
    server 127.0.0.1:8890;
    server 127.0.0.1:8891;
    server 127.0.0.1:8892;
}

upstream sunzi_cerebro_frontend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /opt/sunzi-cerebro/ssl/your-domain.crt;
    ssl_certificate_key /opt/sunzi-cerebro/ssl/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=100r/s;

    # Frontend
    location / {
        limit_req zone=web burst=20 nodelay;
        proxy_pass http://sunzi_cerebro_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://sunzi_cerebro_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://sunzi_cerebro_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8. Firewall Configuration

```bash
# UFW configuration
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH access (change port as needed)
ufw allow 22/tcp

# HTTPS/HTTP
ufw allow 80/tcp
ufw allow 443/tcp

# Internal services (adjust for your network)
ufw allow from 10.0.0.0/8 to any port 5432    # PostgreSQL
ufw allow from 10.0.0.0/8 to any port 6379    # Redis
ufw allow from 10.0.0.0/8 to any port 9090    # Prometheus
ufw allow from 10.0.0.0/8 to any port 3001    # Grafana

ufw --force enable
```

### 9. Monitoring Setup

```bash
# Configure Prometheus
cp prometheus/production.yml prometheus/prometheus.yml

# Configure Grafana
cp grafana/production-dashboard.json grafana/dashboards/

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

### 10. Backup Configuration

```bash
# Create backup script
cat > /opt/sunzi-cerebro/backup-production.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/sunzi-cerebro/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Database backup
pg_dump -h postgres.internal.domain.com -U sunzi_cerebro sunzi_cerebro_prod | \
    gzip > "${BACKUP_DIR}/database_${DATE}.sql.gz"

# Application data backup
tar -czf "${BACKUP_DIR}/app_data_${DATE}.tar.gz" \
    /opt/sunzi-cerebro/data \
    /opt/sunzi-cerebro/logs

# Upload to S3 (if configured)
if [ -n "$AWS_S3_BUCKET" ]; then
    aws s3 cp "${BACKUP_DIR}/database_${DATE}.sql.gz" \
        "s3://${AWS_S3_BUCKET}/backups/"
    aws s3 cp "${BACKUP_DIR}/app_data_${DATE}.tar.gz" \
        "s3://${AWS_S3_BUCKET}/backups/"
fi

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
EOF

chmod +x /opt/sunzi-cerebro/backup-production.sh

# Schedule backup
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sunzi-cerebro/backup-production.sh") | crontab -
```

## 🔒 Security Hardening

### 1. System Hardening
```bash
# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups
systemctl disable avahi-daemon

# Configure fail2ban
apt install fail2ban
cp fail2ban/sunzi-cerebro.conf /etc/fail2ban/jail.d/
systemctl enable fail2ban
systemctl start fail2ban

# Configure auditd
apt install auditd
cp audit/sunzi-cerebro.rules /etc/audit/rules.d/
systemctl restart auditd
```

### 2. Container Security
```bash
# Use non-root users in containers
# Scan images for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image sunzi-cerebro:latest

# Implement resource limits
docker-compose -f docker-compose.production.yml up -d
```

### 3. Network Security
```bash
# Configure network segmentation
docker network create --driver bridge \
    --subnet=172.21.0.0/16 \
    --opt com.docker.network.bridge.name=sunzi-br0 \
    sunzi-production

# Enable network policies
kubectl apply -f kubernetes/network-policies.yml
```

## 📊 Monitoring and Alerting

### 1. Health Checks
```bash
# Automated health monitoring
cat > /opt/sunzi-cerebro/health-check.sh << 'EOF'
#!/bin/bash

# Check all services
services=("frontend:3000" "backend:8890" "hexstrike:8888")

for service in "${services[@]}"; do
    name=${service%:*}
    port=${service#*:}

    if curl -f -s "http://localhost:${port}/health" > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is unhealthy"
        # Send alert
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Sunzi Cerebro $name service is down\"}"
    fi
done
EOF

# Schedule health checks
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/sunzi-cerebro/health-check.sh") | crontab -
```

### 2. Log Aggregation
```bash
# Configure centralized logging
docker run -d --name elasticsearch \
    -p 9200:9200 -p 9300:9300 \
    -e "discovery.type=single-node" \
    elasticsearch:7.17.0

docker run -d --name kibana \
    -p 5601:5601 \
    --link elasticsearch:elasticsearch \
    kibana:7.17.0

# Configure log shipping
cp logging/filebeat.yml /etc/filebeat/
systemctl enable filebeat
systemctl start filebeat
```

## 🔄 Update and Maintenance

### 1. Rolling Updates
```bash
# Zero-downtime updates
./update.sh --strategy rolling --health-check

# Rollback if needed
./rollback.sh --to-version 1.0.0
```

### 2. Maintenance Windows
```bash
# Schedule maintenance
cat > /opt/sunzi-cerebro/maintenance.sh << 'EOF'
#!/bin/bash

# Put system in maintenance mode
curl -X POST http://localhost:8890/api/admin/maintenance/enable

# Perform updates
docker-compose pull
docker-compose up -d

# Wait for health checks
sleep 60

# Exit maintenance mode
curl -X POST http://localhost:8890/api/admin/maintenance/disable
EOF
```

## 📋 Compliance

### 1. GDPR Compliance
- Data encryption at rest and in transit
- Right to be forgotten implementation
- Data retention policies
- Audit logging of all data access

### 2. SOC 2 Controls
- Access controls and authentication
- System monitoring and logging
- Change management procedures
- Incident response procedures

### 3. ISO 27001
- Information security management system
- Risk assessment and treatment
- Security awareness training
- Business continuity planning

## 🆘 Troubleshooting

### Common Issues
1. **High memory usage**: Scale horizontally or increase resources
2. **Database locks**: Monitor PostgreSQL performance
3. **SSL certificate expiry**: Implement automated renewal
4. **Network connectivity**: Check firewall rules and DNS

### Emergency Procedures
1. **Service failure**: Use health check scripts and alerting
2. **Security incident**: Follow incident response plan
3. **Data corruption**: Restore from verified backups
4. **Performance degradation**: Scale resources or investigate bottlenecks

## 📞 Enterprise Support

- **24/7 Support**: enterprise@sunzi-cerebro.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Status Page**: status.sunzi-cerebro.com
- **Documentation**: docs.sunzi-cerebro.com/enterprise

---

**🏢 Enterprise deployment requires careful planning and testing. Always test in a staging environment first.**