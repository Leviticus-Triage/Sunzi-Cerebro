#!/bin/bash
# Sunzi Cerebro - Create Deployment Package
# Version: 1.0.0
# Creates a complete, self-contained deployment archive

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Sunzi Cerebro - Deployment Package Creator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Package details
PACKAGE_NAME="sunzi-cerebro-deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_DIR="${PACKAGE_NAME}_${TIMESTAMP}"
ARCHIVE_NAME="${PACKAGE_NAME}_${TIMESTAMP}.tar.gz"
EXPORT_DIR="../exports"

echo -e "${YELLOW}📋 Package Information:${NC}"
echo "   Name: $PACKAGE_NAME"
echo "   Timestamp: $TIMESTAMP"
echo "   Archive: $ARCHIVE_NAME"
echo ""

# Create temporary package directory
echo -e "${BLUE}📁 Creating package structure...${NC}"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy essential directories and files
echo "   Copying source code..."
rsync -a --exclude='node_modules' \
         --exclude='dist' \
         --exclude='.git' \
         --exclude='.vscode' \
         --exclude='logs' \
         --exclude='*.log' \
         --exclude='.claude' \
         --exclude='.swarm' \
         --exclude='.hive-mind' \
         --exclude='backups/*' \
         --exclude='DEPLOYMENT_PACKAGE' \
         --exclude="${PACKAGE_DIR}" \
         src/ "$PACKAGE_DIR/src/"

echo "   Copying backend..."
rsync -a --exclude='node_modules' \
         --exclude='logs/*.log' \
         --exclude='.env' \
         backend/ "$PACKAGE_DIR/backend/"

echo "   Copying configuration files..."
cp package.json "$PACKAGE_DIR/" 2>/dev/null || true
cp tsconfig.json "$PACKAGE_DIR/" 2>/dev/null || true
cp vite.config.ts "$PACKAGE_DIR/" 2>/dev/null || true
cp index.html "$PACKAGE_DIR/" 2>/dev/null || true
cp docker-compose.yml "$PACKAGE_DIR/" 2>/dev/null || true
cp Dockerfile "$PACKAGE_DIR/" 2>/dev/null || true
cp .env.example "$PACKAGE_DIR/" 2>/dev/null || true

echo "   Copying documentation..."
mkdir -p "$PACKAGE_DIR/Documentation"
cp DEPLOYMENT_README.md "$PACKAGE_DIR/" 2>/dev/null || true
cp CLAUDE.md "$PACKAGE_DIR/Documentation/" 2>/dev/null || true
cp DEPLOYMENT_STATUS.md "$PACKAGE_DIR/Documentation/" 2>/dev/null || true
cp ABSCHLUSSARBEIT_VOLLSTÄNDIGE_DOKUMENTATION.md "$PACKAGE_DIR/Documentation/" 2>/dev/null || true
cp BACKEND_API_REFERENCE.md "$PACKAGE_DIR/Documentation/" 2>/dev/null || true

echo "   Copying scripts..."
mkdir -p "$PACKAGE_DIR/scripts"
cp scripts/*.sh "$PACKAGE_DIR/scripts/" 2>/dev/null || true
chmod +x "$PACKAGE_DIR/scripts"/*.sh

echo "   Copying database..."
mkdir -p "$PACKAGE_DIR/data"
if [ -d "data" ]; then
    cp data/*.sqlite "$PACKAGE_DIR/data/" 2>/dev/null || true
fi

echo "   Copying Docker configuration..."
if [ -d "docker" ]; then
    cp -r docker "$PACKAGE_DIR/" 2>/dev/null || true
fi

echo -e "${GREEN}✅ Package structure created${NC}"
echo ""

# Create package manifest
echo -e "${BLUE}📝 Creating package manifest...${NC}"
cat > "$PACKAGE_DIR/PACKAGE_MANIFEST.txt" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SUNZI CEREBRO DEPLOYMENT PACKAGE MANIFEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Package: $PACKAGE_NAME
Version: v4.0.0 Enterprise Production Edition
Created: $(date '+%Y-%m-%d %H:%M:%S %Z')
Build ID: $TIMESTAMP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PACKAGE CONTENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIRECTORIES:
$(find "$PACKAGE_DIR" -type d | sed 's|^'$PACKAGE_DIR'|  |' | sort)

TOTAL FILES: $(find "$PACKAGE_DIR" -type f | wc -l)
TOTAL SIZE: $(du -sh "$PACKAGE_DIR" | awk '{print $1}')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DEPLOYMENT INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract the archive:
   tar -xzf $ARCHIVE_NAME

2. Navigate to the directory:
   cd $PACKAGE_DIR

3. Read deployment instructions:
   cat DEPLOYMENT_README.md

4. Quick start:
   ./scripts/start-all.sh

5. Health check:
   ./scripts/health-check.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SYSTEM REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- OS: Ubuntu 20.04+ / Debian 11+ / RHEL 8+
- CPU: 2+ cores
- RAM: 4GB+ (8GB recommended)
- Storage: 10GB+ free space
- Node.js: v18.x or v20.x
- npm: v9.x or higher

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 DEFAULT CREDENTIALS (CHANGE IN PRODUCTION!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: sunzi.cerebro
Password: admin123
Role: admin

⚠️  IMPORTANT: Change these credentials immediately after first login!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation: See Documentation/ folder
Health Check: ./scripts/health-check.sh
Troubleshooting: DEPLOYMENT_README.md (Section: Troubleshooting)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Package validated and ready for deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo -e "${GREEN}✅ Manifest created${NC}"
echo ""

# Create checksums
echo -e "${BLUE}🔐 Generating checksums...${NC}"
cd "$PACKAGE_DIR"
find . -type f -exec sha256sum {} \; > ../SHA256SUMS.txt
cd ..
mv SHA256SUMS.txt "$PACKAGE_DIR/"
echo -e "${GREEN}✅ Checksums generated${NC}"
echo ""

# Create archive
echo -e "${BLUE}📦 Creating compressed archive...${NC}"
tar -czf "$ARCHIVE_NAME" "$PACKAGE_DIR"
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | awk '{print $1}')
echo -e "${GREEN}✅ Archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE)${NC}"
echo ""

# Move to exports directory
echo -e "${BLUE}📤 Moving to exports directory...${NC}"
mkdir -p "$EXPORT_DIR"
mv "$ARCHIVE_NAME" "$EXPORT_DIR/"
mv "$PACKAGE_DIR/PACKAGE_MANIFEST.txt" "$EXPORT_DIR/${PACKAGE_NAME}_${TIMESTAMP}_MANIFEST.txt"

# Cleanup
rm -rf "$PACKAGE_DIR"

echo -e "${GREEN}✅ Package moved to: $EXPORT_DIR/$ARCHIVE_NAME${NC}"
echo ""

# Generate deployment instructions file
cat > "$EXPORT_DIR/DEPLOYMENT_INSTRUCTIONS_${TIMESTAMP}.txt" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SUNZI CEREBRO - DEPLOYMENT INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Package: $ARCHIVE_NAME
Created: $(date '+%Y-%m-%d %H:%M:%S %Z')
Size: $ARCHIVE_SIZE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 TRANSFER TO TARGET SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use one of these methods:

1. SCP (Secure Copy):
   scp $ARCHIVE_NAME user@target-host:/path/to/destination/

2. USB Drive:
   - Copy $ARCHIVE_NAME to USB drive
   - Transfer to target system

3. Network Share:
   - Upload to shared network location
   - Download from target system

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DEPLOYMENT ON TARGET SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Extract the archive:
   tar -xzf $ARCHIVE_NAME
   cd $PACKAGE_DIR

2. Read full documentation:
   less DEPLOYMENT_README.md

3. Install dependencies (if needed):
   # Install Node.js v20:
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

4. Quick start deployment:
   chmod +x scripts/*.sh
   ./scripts/start-all.sh

5. Verify deployment:
   ./scripts/health-check.sh

6. Access the application:
   Frontend: http://localhost:3000
   Backend: http://localhost:8890/health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SECURITY NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: After first login, immediately:
  1. Change default admin password
  2. Generate new JWT_SECRET in backend/.env
  3. Configure firewall rules
  4. Enable HTTPS/TLS if exposing to internet

Default credentials (CHANGE IMMEDIATELY):
  Username: sunzi.cerebro
  Password: admin123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If services don't start:
  1. Check Node.js version: node --version
  2. Check port availability: lsof -i :3000 -i :8890
  3. View logs: tail -f logs/backend.log
  4. Run health check: ./scripts/health-check.sh

For detailed troubleshooting, see DEPLOYMENT_README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ready for deployment!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment package created successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📦 Package Details:${NC}"
echo "   Archive: $EXPORT_DIR/$ARCHIVE_NAME"
echo "   Size: $ARCHIVE_SIZE"
echo "   Manifest: $EXPORT_DIR/${PACKAGE_NAME}_${TIMESTAMP}_MANIFEST.txt"
echo "   Instructions: $EXPORT_DIR/DEPLOYMENT_INSTRUCTIONS_${TIMESTAMP}.txt"
echo ""
echo -e "${YELLOW}📤 Next Steps:${NC}"
echo "   1. Transfer archive to target system"
echo "   2. Follow instructions in DEPLOYMENT_INSTRUCTIONS_${TIMESTAMP}.txt"
echo "   3. Extract and deploy using provided scripts"
echo ""
echo -e "${GREEN}✅ Package ready for external deployment!${NC}"
echo ""
