# 🚀 PRODUCTION INTEGRATION GUIDE
## Sunzi Cerebro Enterprise - Frontend-Backend Integration

**Status**: 🎯 **NEUE ERKENNTNISSE** - Frontend ist bereits gut integriert!
**Problem**: Spezifische API-Endpoint und Auth-Header Fixes erforderlich
**Backend**: ✅ Vollständig operational auf Port 8890

---

## 📋 EXECUTIVE SUMMARY

Das Frontend ist **BEREITS GUT ENTWICKELT** und nutzt echte Backend-APIs. Das Problem sind **spezifische Integration-Details**:

1. **API Endpoint Mismatch** - Falsche URLs werden aufgerufen
2. **Fehlende Authorization Headers** - JWT Tokens werden nicht gesendet
3. **Response Structure Issues** - Backend Response-Format wird falsch geparst
4. **Missing WebSocket** - Real-time Updates nicht implementiert

**KEINE KOMPLETTE NEUSCHREIBUNG ERFORDERLICH** - nur gezielte Fixes!

---

## 🔧 SOFORT-FIXES (PRIORITY 1)

### **Fix 1: MCP Service API Endpoints korrigieren**

**File**: `src/services/mcpService.ts`

**Problem**:
```typescript
// ❌ AKTUELL: Falscher Endpoint
async getServers() {
  const response = await axios.get(`${API_BASE_URL}/api/mcp/tools`);
  return response.data.data.servers; // servers existiert hier nicht
}
```

**Lösung**:
```typescript
// ✅ KORRIGIERT: Separate Endpoints für Server und Tools
class McpService {
  private getAuthHeaders() {
    const token = localStorage.getItem('sunzi_cerebro_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Get MCP Server Status (HexStrike AI, AttackMCP, MCP-God-Mode)
   */
  async getServers(): Promise<McpServer[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mcp/servers`, {
        headers: this.getAuthHeaders()
      });

      if (response.data.success) {
        // Backend returns servers as object, convert to array
        const serversObj = response.data.data.servers;
        return Object.values(serversObj);
      } else {
        throw new Error(response.data.message || 'Failed to fetch MCP servers');
      }
    } catch (error: any) {
      console.error('MCP Service - getServers error:', error);
      if (error.response?.status === 401) {
        // Token expired - handle logout
        localStorage.removeItem('sunzi_cerebro_token');
        window.location.href = '/login';
      }
      throw error;
    }
  }

  /**
   * Get All MCP Tools (272+ Security Tools)
   */
  async getTools(): Promise<McpTool[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mcp/tools`, {
        headers: this.getAuthHeaders()
      });

      if (response.data.success) {
        return response.data.data.tools;
      } else {
        throw new Error(response.data.message || 'Failed to fetch MCP tools');
      }
    } catch (error: any) {
      console.error('MCP Service - getTools error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('sunzi_cerebro_token');
        window.location.href = '/login';
      }
      throw error;
    }
  }

  /**
   * Execute MCP Tool
   */
  async executeTool(toolId: string, serverId: string, parameters: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcp/execute`, {
        toolId,
        serverId,
        parameters
      }, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Tool execution failed');
      }
    } catch (error: any) {
      console.error('MCP Service - executeTool error:', error);
      throw error;
    }
  }
}
```

---

### **Fix 2: WebSocket Real-time Integration**

**File**: `src/services/websocketService.ts` (NEU ERSTELLEN)

```typescript
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export type EventHandler = (event: WebSocketEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to Backend WebSocket
   */
  connect(): void {
    try {
      this.ws = new WebSocket('ws://localhost:8890/ws');

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to Sunzi Cerebro Backend');
        this.reconnectAttempts = 0;
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      this.ws.onclose = () => {
        console.warn('⚠️ WebSocket connection closed');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Authenticate WebSocket connection
   */
  private authenticate(): void {
    const token = localStorage.getItem('sunzi_cerebro_token');
    if (token && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Handle incoming WebSocket events
   */
  private handleEvent(event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    });
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`🔄 Attempting WebSocket reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max WebSocket reconnection attempts reached');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Auto-connect when service is imported
const token = localStorage.getItem('sunzi_cerebro_token');
if (token) {
  websocketService.connect();
}
```

---

### **Fix 3: React Hooks für Integration**

**File**: `src/hooks/useMcpData.ts` (NEU ERSTELLEN)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { mcpService } from '../services/mcpService';
import { websocketService } from '../services/websocketService';
import type { McpServer, McpTool } from '../services/mcpService';

export const useMcpServers = () => {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mcpService.getServers();
      setServers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch MCP servers');
      console.error('Error fetching MCP servers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();

    // Listen for real-time server status updates
    const handleServerStatusChange = (event: any) => {
      if (event.type === 'mcp_server_status_changed') {
        setServers(prev => prev.map(server =>
          server.id === event.data.serverId
            ? { ...server, status: event.data.status }
            : server
        ));
      }
    };

    websocketService.on('mcp_server_status_changed', handleServerStatusChange);

    return () => {
      websocketService.off('mcp_server_status_changed', handleServerStatusChange);
    };
  }, [fetchServers]);

  return { servers, loading, error, refetch: fetchServers };
};

export const useMcpTools = () => {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mcpService.getTools();
      setTools(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch MCP tools');
      console.error('Error fetching MCP tools:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return { tools, loading, error, refetch: fetchTools };
};

export const useToolExecution = () => {
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});

  const executeTool = useCallback(async (
    toolId: string,
    serverId: string,
    parameters: any
  ) => {
    try {
      setExecuting(prev => ({ ...prev, [toolId]: true }));

      const result = await mcpService.executeTool(toolId, serverId, parameters);

      setResults(prev => ({ ...prev, [toolId]: result }));
      return result;
    } catch (error) {
      console.error('Tool execution error:', error);
      throw error;
    } finally {
      setExecuting(prev => ({ ...prev, [toolId]: false }));
    }
  }, []);

  useEffect(() => {
    // Listen for real-time execution updates
    const handleExecutionUpdate = (event: any) => {
      if (event.type === 'tool_execution_completed') {
        const { executionId, toolId, status, result } = event.data;

        if (status === 'success') {
          setResults(prev => ({ ...prev, [toolId]: result }));
        }

        setExecuting(prev => ({ ...prev, [toolId]: false }));
      }
    };

    websocketService.on('tool_execution_completed', handleExecutionUpdate);

    return () => {
      websocketService.off('tool_execution_completed', handleExecutionUpdate);
    };
  }, []);

  return { executeTool, executing, results };
};
```

---

### **Fix 4: Dashboard Integration Update**

**File**: `src/pages/Dashboard/Dashboard.tsx` (UPDATE)

```typescript
import React from 'react';
import { useMcpServers, useMcpTools } from '../../hooks/useMcpData';
import { websocketService } from '../../services/websocketService';

const Dashboard: React.FC = () => {
  const { servers, loading: serversLoading, error: serversError } = useMcpServers();
  const { tools, loading: toolsLoading, error: toolsError } = useMcpTools();

  // Calculate real statistics from backend data
  const stats = React.useMemo(() => {
    const activeServers = servers.filter(s => s.status === 'active').length;
    const totalTools = tools.length;
    const toolsByCategory = tools.reduce((acc, tool) => {
      acc[tool.category] = (acc[tool.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      activeServers,
      totalServers: servers.length,
      totalTools,
      toolsByCategory,
      isConnected: websocketService.isConnected()
    };
  }, [servers, tools]);

  if (serversLoading || toolsLoading) {
    return <div>Loading real backend data...</div>;
  }

  if (serversError || toolsError) {
    return <div>Error: {serversError || toolsError}</div>;
  }

  return (
    <div className="dashboard">
      {/* Real-time connection status */}
      <div className={`connection-status ${stats.isConnected ? 'connected' : 'disconnected'}`}>
        WebSocket: {stats.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Real MCP Server Statistics */}
      <div className="server-stats">
        <h3>MCP Infrastructure Status</h3>
        <p>Active Servers: {stats.activeServers}/{stats.totalServers}</p>
        <p>Total Security Tools: {stats.totalTools}</p>
      </div>

      {/* Real Server List */}
      <div className="servers-list">
        {servers.map(server => (
          <div key={server.id} className={`server-card ${server.status}`}>
            <h4>{server.name}</h4>
            <p>Status: {server.status}</p>
            <p>Tools: {server.toolCount}</p>
            <p>Type: {server.type}</p>
          </div>
        ))}
      </div>

      {/* Real Tool Categories */}
      <div className="tool-categories">
        <h3>Security Tool Categories</h3>
        {Object.entries(stats.toolsByCategory).map(([category, count]) => (
          <div key={category} className="category-item">
            <span>{category}</span>
            <span>{count} tools</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 🧪 TESTING & VALIDATION

### **Test Script für Frontend Session**

```bash
#!/bin/bash
# File: test-frontend-integration.sh

echo "🧪 Testing Sunzi Cerebro Frontend-Backend Integration"

# 1. Test Backend Health
echo "1. Testing Backend Health..."
curl -s http://localhost:8890/api/system/health | jq .

# 2. Test Authentication
echo "2. Testing Authentication..."
curl -X POST http://localhost:8890/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mcptest","password":"password123"}' | jq .

# 3. Test MCP Servers (requires auth)
echo "3. Testing MCP Servers endpoint..."
TOKEN="mock-jwt-token-test"  # Replace with real token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8890/api/mcp/servers | jq .

# 4. Test MCP Tools (requires auth)
echo "4. Testing MCP Tools endpoint..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8890/api/mcp/tools | jq '.data.tools | length'

echo "✅ Backend integration tests completed"
```

### **Manual Testing Checklist**

```typescript
// Frontend Session Testing Checklist

1. ✅ Login Flow
   - Try login with existing user (mcptest/password123)
   - Verify JWT token is stored
   - Check if user data is loaded

2. ✅ MCP Servers Display
   - Dashboard should show 3 servers (HexStrike AI, AttackMCP, MCP-God-Mode)
   - Server status should be "active"
   - Tool counts should be real numbers (45+, 7+, 152+)

3. ✅ MCP Tools List
   - Tools page should show 272+ real security tools
   - Categories should be populated (network, web, forensics, etc.)
   - Search/filter should work with real data

4. ✅ WebSocket Connection
   - Browser DevTools → Network → WS should show connection
   - Real-time updates when tool execution happens

5. ✅ Error Handling
   - Invalid login should show proper error
   - Expired token should redirect to login
   - Network errors should be handled gracefully
```

---

## 🎯 ERFOLGS-KRITERIEN

### **Frontend Session muss erreichen**:

✅ **Authentication**: Login/Register mit echten Backend-APIs
✅ **MCP Integration**: 272+ echte Security Tools anzeigen
✅ **Real-time Updates**: WebSocket-Verbindung für Live-Updates
✅ **Server Status**: Echte MCP Server Stati (HexStrike AI, AttackMCP, MCP-God-Mode)
✅ **Tool Execution**: Funktionale Tool-Ausführung über Backend
✅ **Error Handling**: Graceful handling von Token expiry, Network errors
✅ **Performance**: Responsive UI mit Loading States

### **Zero Tolerance für**:
❌ Mock-Daten wenn Backend verfügbar ist
❌ Frontend-only Simulationen
❌ Ignorieren der Backend-APIs
❌ Fehlende Error Handling
❌ Statische Arrays statt API-Calls

---

## 📝 FRONTEND SESSION PROMPT

```
KRITISCHE MISSION: Frontend-Backend Integration optimieren!

Das Backend ist VOLLSTÄNDIG OPERATIONAL mit 272+ echten Security Tools.
Deine Aufgabe: Die letzten Integration-Details perfektionieren.

SOFORT-FIXES ERFORDERLICH:
1. MCP Service - API Endpoints korrigieren (/servers vs /tools)
2. Authorization Headers - JWT Token bei allen API-Calls hinzufügen
3. WebSocket Service - Real-time Updates implementieren
4. Error Handling - Token expiry und Network errors behandeln

DAS BACKEND FUNKTIONIERT PERFEKT! Backend Team hat exzellente Arbeit geleistet.
Nutze deren APIs und erstelle eine Production-Grade Frontend-Integration!

TEST COMMAND: curl http://localhost:8890/api/system/health
ALLE BACKEND-APIS SIND VERFÜGBAR UND GETESTET!
```

**🚀 Das Frontend ist näher an der Perfektion als gedacht - nur gezielte API-Integration-Fixes erforderlich!**