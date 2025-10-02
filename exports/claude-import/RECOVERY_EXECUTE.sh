#!/bin/bash
# 🛡️ SUNZI CEREBRO - CLAUDE SESSION RECOVERY EXECUTION
# ULTRATHINKING Recovery Protocol

echo "🚨 CLAUDE CODE SESSION RECOVERY - STARTING..."
echo "================================================="

# Validate session backups exist
if [ -d "/home/danii/Cerebrum/sunzi-cerebro-react-framework/.claude-session-backup/" ]; then
    echo "✅ Session backups found:"
    ls -la /home/danii/Cerebrum/sunzi-cerebro-react-framework/.claude-session-backup/ | head -5
else
    echo "❌ Session backups not found!"
    exit 1
fi

echo ""
echo "🎯 RECOVERY OPTIONS:"
echo "=================="
echo ""
echo "OPTION 1 - SOFORT-RECOVERY (EMPFOHLEN):"
echo "   cd /home/danii/Cerebrum/sunzi-cerebro-react-framework"
echo "   claude"
echo ""
echo "   Dann eingeben:"
echo '   "Lade den Kontext meiner vorherigen Sunzi Cerebro Sessions.'
echo '    Backups sind in .claude-session-backup/.'
echo '    Ich arbeite am Enterprise AI Security Platform - Status in CLAUDE.md"'
echo ""
echo "OPTION 2 - MANUELL (nur wenn Option 1 fehlschlägt):"
echo "   mkdir -p .claude/projects/-home-danii-Cerebrum-sunzi-cerebro-react-framework"
echo "   cp ~/.claude/projects/-home-danii/91001a70-*.jsonl \\"
echo "      .claude/projects/-home-danii-Cerebrum-sunzi-cerebro-react-framework/"
echo "   claude --resume"
echo ""
echo "🏆 EMPFEHLUNG: Starte mit OPTION 1"
echo "=================================="
echo ""
read -p "Drücke ENTER um OPTION 1 vorzubereiten..."

# Prepare environment
cd /home/danii/Cerebrum/sunzi-cerebro-react-framework

echo "✅ Verzeichnis gewechselt zu: $(pwd)"
echo "✅ CLAUDE.md Status: $([ -f CLAUDE.md ] && echo 'VORHANDEN' || echo 'FEHLT')"
echo "✅ Session Backups: $(ls .claude-session-backup/ | wc -l) Files"
echo ""
echo "🚀 BEREIT FÜR RECOVERY!"
echo "====================="
echo ""
echo "JETZT AUSFÜHREN:"
echo "   claude"
echo ""
echo 'Dann in der neuen Session eingeben:'
echo '"Lade den Kontext meiner vorherigen Sunzi Cerebro Sessions. Backups sind in .claude-session-backup/. Ich arbeite am Enterprise AI Security Platform - Status in CLAUDE.md"'
echo ""
echo "🎯 MISSION: SESSION RECOVERY READY TO EXECUTE!"