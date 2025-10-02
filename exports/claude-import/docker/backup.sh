#!/bin/bash
# Comprehensive backup script for Sunzi Cerebro Enterprise
# Handles PostgreSQL database and application data backups

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sunzi_cerebro}"
DB_USER="${DB_USER:-sunzi_cerebro}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [BACKUP] $1"
}

# Create backup directories
mkdir -p "$BACKUP_DIR/database" "$BACKUP_DIR/data" "$BACKUP_DIR/logs"

log "Starting Sunzi Cerebro Enterprise backup process"

# Database backup
log "Creating PostgreSQL database backup..."
DB_BACKUP_FILE="$BACKUP_DIR/database/sunzi_cerebro_${TIMESTAMP}.sql"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --if-exists --create \
    --format=custom --compress=9 \
    --file="$DB_BACKUP_FILE.custom" 2>/dev/null; then
    log "✅ Database backup completed: $DB_BACKUP_FILE.custom"
else
    log "❌ Database backup failed"
    exit 1
fi

# Also create plain SQL backup for easier restoration
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --if-exists --create \
    --format=plain \
    --file="$DB_BACKUP_FILE" 2>/dev/null; then
    gzip "$DB_BACKUP_FILE"
    log "✅ Plain SQL backup completed: $DB_BACKUP_FILE.gz"
fi

# Application data backup (if volumes are mounted)
if [ -d "/app/data" ] && [ "$(ls -A /app/data 2>/dev/null)" ]; then
    log "Creating application data backup..."
    DATA_BACKUP_FILE="$BACKUP_DIR/data/app_data_${TIMESTAMP}.tar.gz"

    if tar -czf "$DATA_BACKUP_FILE" -C /app data 2>/dev/null; then
        log "✅ Application data backup completed: $DATA_BACKUP_FILE"
    else
        log "⚠️  Application data backup warning - some files may be inaccessible"
    fi
fi

# Logs backup
if [ -d "/app/logs" ] && [ "$(ls -A /app/logs 2>/dev/null)" ]; then
    log "Creating logs backup..."
    LOGS_BACKUP_FILE="$BACKUP_DIR/logs/logs_${TIMESTAMP}.tar.gz"

    if tar -czf "$LOGS_BACKUP_FILE" -C /app logs 2>/dev/null; then
        log "✅ Logs backup completed: $LOGS_BACKUP_FILE"
    fi
fi

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.custom" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Backup verification
log "Verifying backup integrity..."

if [ -f "$DB_BACKUP_FILE.custom" ]; then
    if pg_restore --list "$DB_BACKUP_FILE.custom" >/dev/null 2>&1; then
        log "✅ Database backup integrity verified"
    else
        log "❌ Database backup integrity check failed"
        exit 1
    fi
fi

# Generate backup report
BACKUP_REPORT="$BACKUP_DIR/backup_report_${TIMESTAMP}.txt"
cat > "$BACKUP_REPORT" << EOF
Sunzi Cerebro Enterprise Backup Report
======================================
Timestamp: $(date)
Backup Location: $BACKUP_DIR

Database Backup:
- File: $(basename "$DB_BACKUP_FILE.custom")
- Size: $(du -h "$DB_BACKUP_FILE.custom" 2>/dev/null | cut -f1 || echo "Unknown")
- Status: $([ -f "$DB_BACKUP_FILE.custom" ] && echo "✅ Success" || echo "❌ Failed")

$([ -f "$DATA_BACKUP_FILE" ] && cat << DATAEOF
Application Data Backup:
- File: $(basename "$DATA_BACKUP_FILE")
- Size: $(du -h "$DATA_BACKUP_FILE" | cut -f1)
- Status: ✅ Success
DATAEOF
)

$([ -f "$LOGS_BACKUP_FILE" ] && cat << LOGSEOF
Logs Backup:
- File: $(basename "$LOGS_BACKUP_FILE")
- Size: $(du -h "$LOGS_BACKUP_FILE" | cut -f1)
- Status: ✅ Success
LOGSEOF
)

Storage Usage:
$(df -h "$BACKUP_DIR" | tail -n 1)

Recent Backups:
$(ls -lah "$BACKUP_DIR"/database/*.custom 2>/dev/null | tail -n 5 || echo "No recent database backups found")
EOF

log "✅ Backup process completed successfully"
log "📄 Backup report generated: $BACKUP_REPORT"

# Optional: Send backup notification (webhook, email, etc.)
if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Sunzi Cerebro backup completed at $(date)\"}" \
        2>/dev/null || log "⚠️  Failed to send backup notification"
fi

exit 0