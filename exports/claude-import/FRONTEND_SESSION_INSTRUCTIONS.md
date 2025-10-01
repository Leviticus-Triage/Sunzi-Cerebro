# 🚨 KRITISCHE ANWEISUNGEN FÜR FRONTEND SESSION

## 🔴 SOFORTIGER HANDLUNGSBEDARF - BACKEND IST VOLLSTÄNDIG OPERATIONAL!

**WARNUNG**: Das Backend läuft PERFEKT auf Port 8890 mit 272+ echten Security Tools, SQLite Database, JWT Authentication und WebSockets. Das Frontend muss SOFORT von Mock-Daten auf echte Backend-Integration umgestellt werden!

---

## 📋 SYSTEM PROMPT FÜR FRONTEND SESSION:

```
Du bist ein PRODUCTION FRONTEND DEVELOPER für Sunzi Cerebro Enterprise AI Security Platform.

KRITISCHE INFORMATION:
- Das BACKEND IST VOLLSTÄNDIG OPERATIONAL auf http://localhost:8890
- SQLite Production Database läuft und ist synchronisiert
- 272+ echte MCP Security Tools sind aktiv und verfügbar
- JWT Authentication System funktioniert perfekt
- WebSocket Real-time Verbindung ist bereit
- Alle Backend APIs sind getestet und funktional

DEINE MISSION:
SOFORTIGE INTEGRATION des Frontends mit den echten Backend-APIs.
NIEMALS MOCK-DATEN verwenden wenn echte APIs verfügbar sind!

BACKEND ENDPOINTS (ALLE FUNKTIONIEREN):
✅ Authentication: http://localhost:8890/api/auth/*
✅ MCP Tools: http://localhost:8890/api/mcp/*
✅ Database: http://localhost:8890/api/database/*
✅ System: http://localhost:8890/api/system/*
✅ WebSocket: ws://localhost:8890/ws

QUALITÄTSSTANDARD: Production-Grade Enterprise Software
DOKUMENTATION: Lückenlose Kommentierung erforderlich
TESTS: Jeder API-Call muss getestet werden
```

---

## 🎯 HAUPT-PROMPT:

```
KRITISCHE MISSION: Frontend-Backend Integration SOFORT korrigieren!

Das Sunzi Cerebro Backend ist VOLLSTÄNDIG OPERATIONAL mit:
✅ SQLite Production Database (1 Org, 1 User, aktive Sessions)
✅ JWT Authentication System (Registration/Login funktioniert)
✅ 272+ echte MCP Security Tools (HexStrike AI, AttackMCP, MCP-God-Mode)
✅ WebSocket Real-time Communication
✅ Production APIs auf Port 8890

SOFORT-AUFGABEN:

1. **AUTHENTICATION SYSTEM REPARIEREN**
   - src/services/authService.ts - Echte JWT API-Calls implementieren
   - Mock-Login entfernen, echte POST /api/auth/login verwenden
   - Token-Management für echte JWT Tokens
   - Registration Flow zu POST /api/auth/register

2. **MCP INTEGRATION AKTIVIEREN**
   - src/services/mcpService.ts - Echte MCP API-Calls
   - 272+ Tools von GET /api/mcp/tools laden
   - Server Status von GET /api/mcp/servers
   - Tool Execution via POST /api/mcp/execute

3. **WEBSOCKET REAL-TIME VERBINDUNG**
   - WebSocket zu ws://localhost:8890/ws implementieren
   - Real-time Tool Execution Updates
   - Live System Monitoring

4. **DATABASE INTEGRATION**
   - Echte User-Daten von /api/auth/validate
   - Organization Data von Backend
   - Audit Logs und Session Management

5. **MOCK-DATEN KOMPLETT ENTFERNEN**
   - Alle Mock-Arrays und Fake-Data löschen
   - API-First Architecture implementieren
   - Error Handling für echte API-Calls

TESTE JEDEN API-CALL! Backend läuft auf http://localhost:8890!
Das Backend team hat perfekte Arbeit geleistet - nutze es!
```

---

## ❌ NEGATIV-PROMPT:

```
ABSOLUT VERBOTEN:

❌ Mock-Daten verwenden wenn Backend APIs verfügbar sind
❌ Fake Authentication implementieren statt echte JWT
❌ Frontend-only Simulationen erstellen
❌ API-Calls ignorieren oder umgehen
❌ Das funktionierende Backend ignorieren
❌ Dummy-Daten für UI-Tests verwenden
❌ Statische Arrays statt API-Calls
❌ localStorage statt echter Database
❌ setTimeout statt echte WebSocket Events

IMMER ERFORDERLICH:

✅ Echte API-Calls zu http://localhost:8890
✅ JWT Tokens vom Backend Authentication System
✅ WebSocket Real-time Verbindung zu ws://localhost:8890/ws
✅ Production-Grade Error Handling
✅ Axios/Fetch für alle HTTP Requests
✅ TypeScript Interfaces für Backend-Datenstrukturen
✅ Loading States für API-Calls
✅ Proper Authentication Headers (Bearer Token)
```

---

## 🔧 BACKEND API DOKUMENTATION:

### **Authentication APIs (FUNKTIONIEREN ALLE):**

```typescript
// Registration
POST http://localhost:8890/api/auth/register
Body: {
  username: string,
  email: string,
  password: string,
  organizationName: string
}
Response: { success: boolean, data: { user, token }, message }

// Login
POST http://localhost:8890/api/auth/login
Body: { username: string, password: string }
Response: { success: boolean, data: { user, token }, message }

// Validate Token
GET http://localhost:8890/api/auth/validate
Headers: { Authorization: "Bearer <jwt-token>" }
Response: { success: boolean, data: { user }, message }
```

### **MCP APIs (272+ ECHTE TOOLS):**

```typescript
// Get All Tools (272+ echte Security Tools)
GET http://localhost:8890/api/mcp/tools
Headers: { Authorization: "Bearer <jwt-token>" }
Response: { success: boolean, data: { tools: Tool[], total: number } }

// Get Server Status
GET http://localhost:8890/api/mcp/servers
Response: { success: boolean, data: { servers: McpServer[] } }

// Execute Tool
POST http://localhost:8890/api/mcp/execute
Body: { toolId: string, parameters: any }
Response: { success: boolean, data: { result } }
```

### **Database APIs:**

```typescript
// Get Current User Organizations
GET http://localhost:8890/api/database/user-organizations
Headers: { Authorization: "Bearer <jwt-token>" }

// Get User Statistics
GET http://localhost:8890/api/database/user-stats
Headers: { Authorization: "Bearer <jwt-token>" }
```

### **WebSocket Events:**

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8890/ws');

// Events:
- 'tool_execution_started'
- 'tool_execution_progress'
- 'tool_execution_completed'
- 'mcp_server_status_changed'
```

---

## 🎯 INTEGRATION CHECKLISTE:

### **Sofort zu korrigierende Files:**

1. **`src/services/authService.ts`** - Mock-Auth entfernen, echte APIs
2. **`src/services/mcpService.ts`** - Echte MCP Tool-Integration
3. **`src/services/mcpApi.ts`** - Backend API-Calls implementieren
4. **`src/services/analyticsEngine.ts`** - Echte Datenquellen
5. **`src/pages/Login/*`** - Echte Authentication Flow
6. **`src/pages/McpToolset/*`** - Echte 272+ Tools anzeigen
7. **`src/components/Dashboard/*`** - Echte System-Daten

### **Test-Kommandos:**

```bash
# Backend prüfen (läuft auf Port 8890)
curl http://localhost:8890/api/system/health

# MCP Tools prüfen (272+ echte Tools)
curl http://localhost:8890/api/mcp/tools

# Authentication testen
curl -X POST http://localhost:8890/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

---

## 🏆 ERFOLGS-KRITERIEN:

### **Frontend muss zeigen:**
✅ Echte User-Daten vom Backend (nicht Mock)
✅ 272+ echte MCP Security Tools (nicht Fake-Arrays)
✅ Real-time WebSocket Updates
✅ Echte JWT Authentication
✅ Funktionale Tool-Execution mit Backend
✅ Live System-Monitoring Daten
✅ Echte Database-Inhalte (Organizations, Users, Sessions)

### **Zero Tolerance für:**
❌ Mock-Daten bei verfügbaren APIs
❌ Fake Authentication
❌ Frontend-only Simulationen
❌ Ignorieren des funktionierenden Backends

---

## 🚀 SOFORT STARTEN:

```bash
# 1. Backend Status prüfen
curl http://localhost:8890/api/system/health

# 2. Frontend Services korrigieren
# Beginne mit src/services/authService.ts

# 3. Echte API-Integration implementieren

# 4. Alle Mock-Daten entfernen

# 5. WebSocket-Verbindung testen
```

---

**🎯 MISSION: Verwandle das Mock-Frontend in eine echte Enterprise-Anwendung!**
**🔥 Das Backend Team hat perfekte Arbeit geleistet - nutze deren APIs!**
**💪 Production-Grade Integration SOFORT umsetzen!**

---

*Sunzi Cerebro Enterprise - Wo Backend Excellence auf Frontend Integration trifft*