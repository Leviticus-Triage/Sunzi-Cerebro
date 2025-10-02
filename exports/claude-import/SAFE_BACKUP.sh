#!/bin/bash

# 🛡️ SUNZI CEREBRO - SAFE PROJECT BACKUP
# Non-recursive, project-only backup system
# Version: 2.0 Safe Edition

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_ROOT="/home/danii/Cerebrum/sunzi-cerebro-react-framework"
EXTERNAL_BACKUP_DIR="/home/danii/Cerebrum/sunzi-cerebro-backups"  # OUTSIDE project directory
BACKUP_NAME="sunzi-cerebro-safe-backup-${TIMESTAMP}"

echo -e "${BLUE}🛡️  SUNZI CEREBRO SAFE BACKUP${NC}"
echo -e "${BLUE}==============================${NC}"
echo -e "Timestamp: ${YELLOW}$TIMESTAMP${NC}"
echo -e "Source: ${YELLOW}$PROJECT_ROOT${NC}"
echo -e "Target: ${YELLOW}$EXTERNAL_BACKUP_DIR${NC}"
echo ""

# Create external backup directory (OUTSIDE project)
mkdir -p "$EXTERNAL_BACKUP_DIR"

# Safety check: Make sure we're not backing up into ourselves
if [[ "$EXTERNAL_BACKUP_DIR" == "$PROJECT_ROOT"* ]]; then
    echo -e "${RED}❌ ERROR: Backup directory is inside project directory!${NC}"
    echo -e "${RED}   This would cause recursive backups.${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Creating safe project backup...${NC}"

# Create comprehensive but SAFE backup
tar -czf "$EXTERNAL_BACKUP_DIR/$BACKUP_NAME.tar.gz" \
    -C "$(dirname "$PROJECT_ROOT")" \
    --exclude='sunzi-cerebro-react-framework/node_modules' \
    --exclude='sunzi-cerebro-react-framework/.git' \
    --exclude='sunzi-cerebro-react-framework/dist' \
    --exclude='sunzi-cerebro-react-framework/build' \
    --exclude='sunzi-cerebro-react-framework/backend/node_modules' \
    --exclude='sunzi-cerebro-react-framework/backend/logs' \
    --exclude='sunzi-cerebro-react-framework/backend/data/*.sqlite*' \
    --exclude='sunzi-cerebro-react-framework/.vite' \
    --exclude='sunzi-cerebro-react-framework/.cache' \
    --exclude='sunzi-cerebro-react-framework/*.log' \
    --exclude='sunzi-cerebro-react-framework/BACKUPS' \
    --exclude='sunzi-cerebro-react-framework/DEPLOYMENT_PACKAGE/*.tar.gz' \
    --exclude='*.tar.gz' \
    --exclude='*.zip' \
    "$(basename "$PROJECT_ROOT")"

# Check backup was created successfully
if [ -f "$EXTERNAL_BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
    BACKUP_SIZE=$(du -sh "$EXTERNAL_BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: $BACKUP_SIZE${NC}"
    echo -e "${GREEN}   Location: $EXTERNAL_BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"

    # Create backup manifest
    cat > "$EXTERNAL_BACKUP_DIR/$BACKUP_NAME.manifest" << EOF
# SUNZI CEREBRO SAFE BACKUP MANIFEST
Created: $(date)
Backup File: $BACKUP_NAME.tar.gz
Size: $BACKUP_SIZE
Source: $PROJECT_ROOT
Method: Safe non-recursive backup

# Contents:
- Frontend source code (src/)
- Backend source code (backend/)
- Configuration files
- Documentation
- Scripts
- Docker configuration

# Excluded:
- node_modules (frontend & backend)
- Build artifacts (dist/, build/)
- Logs and temporary files
- Git repository (.git/)
- Database files (*.sqlite)
- Previous backups (BACKUPS/, *.tar.gz)
- Cache directories
EOF

    echo -e "${GREEN}✅ Backup manifest created${NC}"

    # Show total backup directory size
    TOTAL_SIZE=$(du -sh "$EXTERNAL_BACKUP_DIR" | cut -f1)
    echo -e "${BLUE}📊 Total backup directory size: $TOTAL_SIZE${NC}"

    # Keep only last 5 backups to prevent accumulation
    echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 5)...${NC}"
    cd "$EXTERNAL_BACKUP_DIR"
    ls -t sunzi-cerebro-safe-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f || true
    ls -t sunzi-cerebro-safe-backup-*.manifest 2>/dev/null | tail -n +6 | xargs rm -f || true

    REMAINING_BACKUPS=$(ls sunzi-cerebro-safe-backup-*.tar.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Cleanup complete. $REMAINING_BACKUPS backups remaining.${NC}"

else
    echo -e "${RED}❌ Backup creation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 SAFE BACKUP COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}No recursive backup risks. Project safely preserved.${NC}"