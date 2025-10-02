# 🧹 BACKUP GUIDELINES - SAUBERE PROJEKTSICHERUNG

**WICHTIG:** Nur projektrelevante Dateien sichern - KEIN MÜLL!

---

## ✅ **WAS GESICHERT WERDEN SOLL**

### **📋 Projektdateien**
- `*.md` - Dokumentation und README files
- `*.json` - package.json, tsconfig.json etc.
- `*.js`, `*.ts`, `*.tsx` - Source code
- `*.yml`, `*.yaml` - CI/CD Konfiguration
- `.env.example` - Beispiel-Konfiguration
- `.gitignore` - Git-Konfiguration

### **📁 Verzeichnisse (ohne Müll)**
- `src/` - Frontend Source Code
- `backend/` - Backend Source Code (OHNE node_modules!)
- `.github/` - CI/CD Workflows
- `Documentation/` - Projektdokumentation
- `public/` - Statische Assets (begrenzt)
- `scripts/` - Build und Deploy Scripts

---

## ❌ **WAS NIEMALS GESICHERT WERDEN SOLL**

### **🗑️ Build-Artefakte**
- `node_modules/` - NPM Dependencies (GB groß!)
- `dist/` - Build Output
- `build/` - Build Output
- `coverage/` - Test Coverage Reports
- `test-reports/` - Test Berichte

### **📊 Runtime-Dateien**
- `logs/` - Log-Dateien
- `*.log` - Einzelne Log-Dateien
- `data/` - Datenbank-Dateien
- `exports/` - Export-Dateien
- `backups/` - Alte Backups
- `temp/`, `tmp/` - Temporäre Dateien

### **🔒 Sensible Dateien**
- `.env` - Environment Variables (Secrets!)
- `*.sqlite`, `*.db` - Datenbank-Dateien
- `*.pid` - Process IDs
- Cache-Verzeichnisse

### **💻 IDE/System-Dateien**
- `.vscode/` - IDE Konfiguration
- `.idea/` - IDE Konfiguration
- `.DS_Store` - macOS System-Dateien
- `Thumbs.db` - Windows System-Dateien

---

## 📊 **BACKUP-GRÖßEN RICHTLINIEN**

### **✅ Akzeptable Backup-Größen**
- **Kleines Projekt:** 1-10 MB
- **Mittleres Projekt:** 10-50 MB
- **Großes Projekt:** 50-200 MB

### **🚨 WARNSIGNALE - ZU GROß**
- **> 500 MB:** Definitiv zu groß - node_modules enthalten!
- **> 1 GB:** Extremer Fehler - System-Dateien enthalten!
- **> 5 GB:** Katastrophaler Fehler - gesamtes System gesichert!

---

## 🛠️ **VERWENDUNG DES SAUBEREN BACKUP-SCRIPTS**

```bash
# Sauberes Backup erstellen (nur Projektdateien)
./scripts/clean-backup.sh

# Backup-Größe prüfen
du -sh /home/danii/Cerebrum/backups/clean-backup-*

# Alte Backups bereinigen
find /home/danii/Cerebrum/backups -name "*backup*" -type d -mtime +7 -delete
```

---

## 🎯 **BACKUP-QUALITÄTSKONTROLLE**

### **✅ Checkliste für saubere Backups**
- [ ] Backup-Größe unter 200 MB
- [ ] Keine `node_modules/` Verzeichnisse
- [ ] Keine Log-Dateien enthalten
- [ ] Keine Datenbank-Dateien
- [ ] Keine temporären Dateien
- [ ] Nur Source Code und Dokumentation

### **🚨 Notfall-Bereinigung**
```bash
# Große Verzeichnisse finden und löschen
find /home/danii/Cerebrum -name "node_modules" -type d -exec rm -rf {} \;
find /home/danii/Cerebrum -name "*.log" -delete
find /home/danii/Cerebrum -name "dist" -type d -exec rm -rf {} \;
```

---

## 💡 **WARUM DIESE RICHTLINIEN?**

1. **Speicherplatz:** node_modules kann GB groß sein
2. **Performance:** Kleinere Backups = schnellere Übertragung
3. **Sicherheit:** Keine sensiblen Daten in Backups
4. **Klarheit:** Nur relevante Projektdateien
5. **Wartung:** Einfache Backup-Verwaltung

---

**🎯 ZIEL: SAUBERE, KLEINE, FOKUSSIERTE PROJEKTBACKUPS!**

*Nie wieder riesige Müll-Backups - nur das Wesentliche sichern.*