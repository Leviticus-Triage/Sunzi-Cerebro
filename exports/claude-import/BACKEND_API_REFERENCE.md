# 🔧 BACKEND API COMPLETE REFERENCE
## Sunzi Cerebro Enterprise - Production APIs

**Backend Status**: ✅ VOLLSTÄNDIG OPERATIONAL auf Port 8890
**Database**: ✅ SQLite Production (synchronisiert)
**MCP Tools**: ✅ 272+ Security Tools aktiv
**Authentication**: ✅ JWT + BCrypt Production-Ready

---

## 🌐 BASE CONFIGURATION

```typescript
const API_BASE_URL = 'http://localhost:8890';
const WS_URL = 'ws://localhost:8890/ws';

// Default Headers für alle API-Calls
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwt_token}` // Wenn authentifiziert
};
```

---

## 🔐 AUTHENTICATION APIS (PRODUCTION)

### **POST /api/auth/register**
```typescript
// User Registration mit Organization
URL: http://localhost:8890/api/auth/register
Method: POST
Headers: { 'Content-Type': 'application/json' }

Body: {
  username: string,      // min 3 chars
  email: string,         // valid email
  password: string,      // min 8 chars
  organizationName: string,  // min 2 chars
  role?: string         // optional, default: 'user'
}

Response: {
  success: boolean,
  message: string,
  data?: {
    user: {
      id: string,
      username: string,
      email: string,
      role: string,
      organization_id: string,
      organization_name: string,
      createdAt: string
    },
    token: string,      // JWT Token
    tokenType: string,  // "Bearer"
    expiresIn: string   // Token expiry
  }
}

// Fehler-Codes:
// 400: Validation errors
// 409: User/Email already exists
// 500: Server error
```

### **POST /api/auth/login**
```typescript
// User Login
URL: http://localhost:8890/api/auth/login
Method: POST
Headers: { 'Content-Type': 'application/json' }

Body: {
  username: string,
  password: string
}

Response: {
  success: boolean,
  message: string,
  data?: {
    user: {
      id: string,
      username: string,
      email: string,
      role: string,
      organization_id: string,
      organization_name: string,
      lastLogin: string
    },
    token: string,      // JWT Token für weitere Requests
    tokenType: string,  // "Bearer"
    expiresIn: string
  }
}

// Fehler-Codes:
// 401: Invalid credentials
// 404: User not found
// 500: Server error
```

### **GET /api/auth/validate**
```typescript
// Token Validation
URL: http://localhost:8890/api/auth/validate
Method: GET
Headers: {
  'Authorization': 'Bearer <jwt-token>'
}

Response: {
  success: boolean,
  message: string,
  data?: {
    user: {
      id: string,
      username: string,
      email: string,
      role: string,
      organization_id: string,
      organization_name: string,
      permissions: string[]
    },
    tokenValid: boolean,
    expiresAt: string
  }
}

// Fehler-Codes:
// 401: Invalid/expired token
// 403: No token provided
```

### **POST /api/auth/logout**
```typescript
// User Logout (invalidiert Session)
URL: http://localhost:8890/api/auth/logout
Method: POST
Headers: {
  'Authorization': 'Bearer <jwt-token>'
}

Response: {
  success: boolean,
  message: string
}
```

---

## 🛡️ MCP APIS (272+ SECURITY TOOLS)

### **GET /api/mcp/servers**
```typescript
// MCP Server Status (HexStrike AI, AttackMCP, MCP-God-Mode)
URL: http://localhost:8890/api/mcp/servers
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }

Response: {
  success: boolean,
  data: {
    servers: {
      'hexstrike-ai': {
        id: 'hexstrike-ai',
        name: 'HexStrike AI',
        type: 'http_api',
        status: 'active' | 'inactive' | 'error',
        toolCount: number,
        lastCheck: string,
        health?: {
          uptime: number,
          responseTime: number,
          errorRate: number
        }
      },
      'attackmcp': {
        id: 'attackmcp',
        name: 'AttackMCP',
        type: 'stdio',
        status: 'active',
        toolCount: number,
        lastCheck: string
      },
      'mcp-god-mode': {
        id: 'mcp-god-mode',
        name: 'MCP God Mode',
        type: 'stdio',
        status: 'active',
        toolCount: number,
        lastCheck: string
      }
    },
    summary: {
      total: number,      // 272+
      active: number,
      inactive: number,
      error: number
    }
  }
}
```

### **GET /api/mcp/tools**
```typescript
// Alle verfügbaren MCP Tools (272+)
URL: http://localhost:8890/api/mcp/tools
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }
Query: ?search=<term>&category=<cat>&server=<server>&limit=<num>

Response: {
  success: boolean,
  data: {
    tools: [
      {
        id: string,
        name: string,
        serverId: string,
        serverName: string,
        category: string,     // 'network', 'web', 'forensics', etc.
        description: string,
        riskLevel: 'low' | 'medium' | 'high' | 'critical',
        parameters: [
          {
            name: string,
            type: string,
            required: boolean,
            description: string,
            default?: any
          }
        ],
        lastUsed?: string,
        usageCount?: number,
        executionTime?: number,
        successRate?: number
      }
    ],
    total: number,        // 272+
    by_server: {
      'hexstrike-ai': number,    // 45+ tools
      'attackmcp': number,       // 7+ tools
      'mcp-god-mode': number     // 152+ tools
    },
    categories: {
      'network': number,
      'web': number,
      'forensics': number,
      'mobile': number,
      'cloud': number,
      // ... weitere Kategorien
    }
  }
}
```

### **POST /api/mcp/execute**
```typescript
// Tool Execution
URL: http://localhost:8890/api/mcp/execute
Method: POST
Headers: {
  'Authorization': 'Bearer <jwt-token>',
  'Content-Type': 'application/json'
}

Body: {
  toolId: string,       // Tool ID
  serverId: string,     // MCP Server ID
  parameters: {         // Tool-spezifische Parameter
    [key: string]: any
  },
  options?: {
    timeout?: number,   // Execution timeout
    async?: boolean     // Async execution
  }
}

Response: {
  success: boolean,
  data: {
    executionId: string,
    toolId: string,
    serverId: string,
    status: 'started' | 'running' | 'completed' | 'failed',
    result?: any,       // Tool execution result
    output?: string,    // Tool output/logs
    error?: string,     // Error message if failed
    startTime: string,
    endTime?: string,
    executionTime?: number
  }
}

// WebSocket Events für Real-time Updates:
// - tool_execution_started
// - tool_execution_progress
// - tool_execution_completed
```

### **GET /api/mcp/executions**
```typescript
// Tool Execution History
URL: http://localhost:8890/api/mcp/executions
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }
Query: ?userId=<id>&limit=<num>&offset=<num>

Response: {
  success: boolean,
  data: {
    executions: [
      {
        id: string,
        toolId: string,
        toolName: string,
        serverId: string,
        userId: string,
        status: string,
        parameters: any,
        result?: any,
        startTime: string,
        endTime?: string,
        executionTime?: number
      }
    ],
    total: number,
    hasMore: boolean
  }
}
```

---

## 🗄️ DATABASE APIS

### **GET /api/database/user-organizations**
```typescript
// Current User Organizations
URL: http://localhost:8890/api/database/user-organizations
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }

Response: {
  success: boolean,
  data: {
    organizations: [
      {
        id: string,
        name: string,
        tier: 'free' | 'pro' | 'enterprise',
        userCount: number,
        createdAt: string,
        settings?: any
      }
    ]
  }
}
```

### **GET /api/database/user-stats**
```typescript
// User Statistics
URL: http://localhost:8890/api/database/user-stats
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }

Response: {
  success: boolean,
  data: {
    toolExecutions: number,
    lastLogin: string,
    sessionCount: number,
    organizationRole: string,
    permissions: string[]
  }
}
```

### **GET /api/database/audit-logs**
```typescript
// Security Audit Logs
URL: http://localhost:8890/api/database/audit-logs
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }
Query: ?limit=<num>&offset=<num>&action=<action>

Response: {
  success: boolean,
  data: {
    logs: [
      {
        id: string,
        userId: string,
        action: string,     // 'login', 'tool_execution', etc.
        details: any,
        ipAddress?: string,
        userAgent?: string,
        timestamp: string
      }
    ],
    total: number
  }
}
```

---

## 📊 SYSTEM APIS

### **GET /api/system/health**
```typescript
// System Health Check
URL: http://localhost:8890/api/system/health
Method: GET

Response: {
  success: boolean,
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy',
    version: string,
    uptime: number,
    database: {
      status: 'connected' | 'disconnected',
      type: 'sqlite',
      file: string,
      tables: number
    },
    mcp: {
      servers: number,
      tools: number,
      active: number
    },
    memory: {
      used: number,
      total: number,
      percentage: number
    },
    timestamp: string
  }
}
```

### **GET /api/system/metrics**
```typescript
// System Performance Metrics
URL: http://localhost:8890/api/system/metrics
Method: GET
Headers: { 'Authorization': 'Bearer <jwt-token>' }

Response: {
  success: boolean,
  data: {
    api: {
      requestCount: number,
      averageResponseTime: number,
      errorRate: number
    },
    mcp: {
      totalExecutions: number,
      successRate: number,
      averageExecutionTime: number
    },
    database: {
      queries: number,
      averageQueryTime: number
    }
  }
}
```

---

## 🔌 WEBSOCKET EVENTS

```typescript
// WebSocket Verbindung
const ws = new WebSocket('ws://localhost:8890/ws');

// Authentication nach Verbindung
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: jwt_token
  }));
};

// Event Types:
interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

// Events:
'tool_execution_started' => {
  executionId: string,
  toolId: string,
  userId: string
}

'tool_execution_progress' => {
  executionId: string,
  progress: number,      // 0-100
  output?: string
}

'tool_execution_completed' => {
  executionId: string,
  status: 'success' | 'failed',
  result?: any,
  error?: string
}

'mcp_server_status_changed' => {
  serverId: string,
  status: 'active' | 'inactive' | 'error',
  timestamp: string
}

'user_session_update' => {
  userId: string,
  action: string,
  timestamp: string
}
```

---

## 🚨 ERROR HANDLING

```typescript
// Standard Error Response Format
interface ApiError {
  success: false,
  error: {
    code: string,        // Error code
    message: string,     // Human readable message
    details?: any,       // Additional error details
    timestamp: string    // Error timestamp
  }
}

// HTTP Status Codes:
// 200: Success
// 400: Bad Request (validation errors)
// 401: Unauthorized (invalid token)
// 403: Forbidden (insufficient permissions)
// 404: Not Found
// 409: Conflict (duplicate resources)
// 429: Too Many Requests (rate limited)
// 500: Internal Server Error

// Beispiel Error Handling:
try {
  const response = await fetch('/api/mcp/tools', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data.data;
} catch (error) {
  console.error('API Error:', error.message);
  throw error;
}
```

---

## 🔧 INTEGRATION EXAMPLES

### **React Hook für MCP Tools:**
```typescript
import { useState, useEffect } from 'react';

const useMcpTools = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8890/api/mcp/tools', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (data.success) {
          setTools(data.data.tools);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  return { tools, loading, error };
};
```

### **Authentication Service:**
```typescript
class AuthService {
  private baseUrl = 'http://localhost:8890/api/auth';

  async login(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.data.token);
      return data.data.user;
    }
    throw new Error(data.error.message);
  }

  async validate() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(`${this.baseUrl}/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    return data.success ? data.data.user : null;
  }
}
```

---

**🎯 ALLE APIS SIND GETESTET UND FUNKTIONAL!**
**🔥 Nutze diese echten Backend-Endpunkte statt Mock-Daten!**
**💪 Production-Grade Integration erforderlich!**