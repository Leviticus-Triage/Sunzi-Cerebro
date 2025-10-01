#!/bin/bash

# Clean Backup Script - Nur projektrelevante Dateien
# KEIN Müll, KEINE node_modules, NUR wichtige Projektdateien

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
PROJECT_DIR="/home/danii/Cerebrum/sunzi-cerebro-react-framework"
BACKUP_DIR="/home/danii/Cerebrum/backups/clean-backup-${TIMESTAMP}"

echo "🧹 SAUBERES BACKUP - NUR PROJEKTDATEIEN"
echo "Backup Ziel: $BACKUP_DIR"

# Erstelle Backup-Verzeichnis
mkdir -p "$BACKUP_DIR"

# PROJEKTDATEIEN - NUR DAS WICHTIGE
echo "📋 Sichere Projektdateien..."

# Root-Level Dateien
cp "$PROJECT_DIR"/*.md "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/*.json "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/*.js "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/*.ts "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/*.tsx "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/*.yml "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/*.yaml "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/.env* "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR"/.gitignore "$BACKUP_DIR/" 2>/dev/null || true

# Source Code (OHNE node_modules!)
echo "📁 Sichere Source Code..."
rsync -av --exclude='node_modules' --exclude='dist' --exclude='build' \
      --exclude='.git' --exclude='coverage' --exclude='test-reports' \
      --exclude='logs' --exclude='*.log' --exclude='temp' --exclude='tmp' \
      "$PROJECT_DIR/src/" "$BACKUP_DIR/src/" 2>/dev/null || true

# Backend Code (OHNE node_modules!)
echo "🔧 Sichere Backend Code..."
rsync -av --exclude='node_modules' --exclude='dist' --exclude='build' \
      --exclude='.git' --exclude='coverage' --exclude='test-reports' \
      --exclude='logs' --exclude='*.log' --exclude='data' --exclude='exports' \
      "$PROJECT_DIR/backend/" "$BACKUP_DIR/backend/" 2>/dev/null || true

# GitHub Workflows
echo "⚙️ Sichere CI/CD..."
cp -r "$PROJECT_DIR/.github" "$BACKUP_DIR/" 2>/dev/null || true

# Documentation
echo "📚 Sichere Dokumentation..."
cp -r "$PROJECT_DIR/Documentation" "$BACKUP_DIR/" 2>/dev/null || true

# Public Assets (begrenzt)
echo "🖼️ Sichere Assets..."
cp -r "$PROJECT_DIR/public" "$BACKUP_DIR/" 2>/dev/null || true

# Berechne Backup-Größe
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo "✅ SAUBERES BACKUP ERSTELLT"
echo "📊 Backup-Größe: $BACKUP_SIZE"
echo "📍 Pfad: $BACKUP_DIR"

# Zeige Inhalt
echo "📋 Backup-Inhalt:"
find "$BACKUP_DIR" -type f | head -20
echo "..."

# Lösche alte große Backups (älter als 7 Tage)
find "/home/danii/Cerebrum/backups" -name "*backup*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "🧹 Alte Backups bereinigt"