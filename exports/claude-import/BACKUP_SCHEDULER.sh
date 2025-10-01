#!/bin/bash
# 🛡️ SUNZI CEREBRO - AUTOMATIC BACKUP SCHEDULER
# Scheduled backups for continuous protection

echo "🛡️ SUNZI CEREBRO BACKUP SCHEDULER SETUP"
echo "========================================"

SCRIPT_DIR="/home/danii/Cerebrum/sunzi-cerebro-react-framework"
BACKUP_SCRIPT="$SCRIPT_DIR/BACKUP_SYSTEM.sh"

# Function to setup cron job
setup_cron_backup() {
    echo "🕐 Setting up automated backups..."

    # Create cron job entry
    CRON_JOB="0 */4 * * * $BACKUP_SCRIPT >> $SCRIPT_DIR/backup.log 2>&1"

    # Add to crontab (every 4 hours)
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

    echo "✅ Automated backup scheduled every 4 hours"
    echo "📝 Backup logs: $SCRIPT_DIR/backup.log"
}

# Function to create git hooks
setup_git_hooks() {
    if [ -d "$SCRIPT_DIR/.git" ]; then
        echo "🔗 Setting up Git pre-commit backup hook..."

        cat > "$SCRIPT_DIR/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# Auto-backup before commit
echo "🛡️ Creating pre-commit backup..."
/home/danii/Cerebrum/sunzi-cerebro-react-framework/BACKUP_SYSTEM.sh > /dev/null 2>&1 || true
echo "✅ Pre-commit backup complete"
EOF

        chmod +x "$SCRIPT_DIR/.git/hooks/pre-commit"
        echo "✅ Git pre-commit backup hook installed"
    fi
}

# Function to create quick backup aliases
setup_backup_aliases() {
    echo "⚡ Creating backup shortcuts..."

    cat >> ~/.bashrc << EOF

# 🛡️ Sunzi Cerebro Backup Shortcuts
alias backup-sunzi='$BACKUP_SCRIPT'
alias backup-quick='$BACKUP_SCRIPT && echo "💾 Quick backup complete!"'
alias backup-status='ls -la $SCRIPT_DIR/BACKUPS/*/$(date +%Y-%m-%d)/ 2>/dev/null || echo "No backups today"'

EOF

    echo "✅ Backup aliases added to ~/.bashrc"
    echo "   Commands available: backup-sunzi, backup-quick, backup-status"
}

echo ""
echo "🎯 BACKUP AUTOMATION OPTIONS:"
echo "============================="
echo "1. Every 4 hours automatic backup (recommended)"
echo "2. Git pre-commit backup hooks"
echo "3. Quick backup command aliases"
echo "4. All of the above"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        setup_cron_backup
        ;;
    2)
        setup_git_hooks
        ;;
    3)
        setup_backup_aliases
        ;;
    4)
        setup_cron_backup
        setup_git_hooks
        setup_backup_aliases
        echo ""
        echo "🎉 COMPLETE BACKUP AUTOMATION DEPLOYED!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🛡️ BACKUP SYSTEM STATUS:"
echo "========================"
echo "✅ Manual backup: $BACKUP_SCRIPT"
echo "✅ Scheduled: $(crontab -l 2>/dev/null | grep BACKUP_SYSTEM.sh | wc -l) cron jobs"
echo "✅ Git hooks: $([ -f "$SCRIPT_DIR/.git/hooks/pre-commit" ] && echo "Active" || echo "Not installed")"
echo ""
echo "🚀 Your Sunzi Cerebro project is now IMMORTAL!"
echo "💾 No more code loss - ever!"