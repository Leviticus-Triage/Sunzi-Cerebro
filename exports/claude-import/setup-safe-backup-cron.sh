#!/bin/bash

# Setup safe weekly backup cron job
# Optional - only run if you want automated backups

echo "🛡️ Setting up SAFE 12-hour backup cron job..."

# Add backup every 12 hours (at 2 AM and 2 PM)
(crontab -l 2>/dev/null; echo "0 2,14 * * * /home/danii/Cerebrum/sunzi-cerebro-react-framework/SAFE_BACKUP.sh >> /home/danii/Cerebrum/sunzi-cerebro-react-framework/backup.log 2>&1") | crontab -

echo "✅ 12-hour backup cron job added:"
echo "   Every day at 2:00 AM and 2:00 PM"
echo "   Uses SAFE_BACKUP.sh (non-recursive)"
echo "   Logs to backup.log"
echo ""
echo "To remove this cron job later:"
echo "   crontab -e"
echo "   (then delete the line with SAFE_BACKUP.sh)"