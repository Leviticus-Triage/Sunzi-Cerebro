# 📚 Sunzi Cerebro Enterprise API Documentation
## Complete API Reference v3.2.0

**Base URL:** `http://localhost:8890` (Development) | `https://api.sunzi-cerebro.enterprise` (Production)

**Authentication:** Bearer JWT Token or API Key

---

## 🔐 Authentication Endpoints

### POST `/api/auth/login`
Login with username/password to obtain JWT token.

**Request Body:**
```json
{
  "username": "sunzi.cerebro",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "sunzi.cerebro",
      "role": "super_admin",
      "tenant_id": "uuid"
    },
    "expires_at": "2025-09-24T12:00:00.000Z"
  }
}
```

### POST `/api/auth/refresh`
Refresh JWT token using refresh token.

### GET `/api/auth/validate`
Validate current JWT token.

### POST `/api/auth/logout`
Logout and invalidate current session.

---

## 🏥 System Health Endpoints

### GET `/api/system/health`
Get comprehensive system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "3.2.0",
    "uptime": "2h 15m 30s",
    "database": {
      "status": "healthy",
      "responseTime": "12ms",
      "pool": {
        "total": 20,
        "used": 3,
        "idle": 17
      }
    },
    "mcp_servers": {
      "total": 4,
      "online": 4,
      "tools_available": 272
    },
    "memory": {
      "used": "245MB",
      "free": "1.2GB",
      "percentage": 18.5
    }
  }
}
```

### GET `/api/system/info`
Get system information and capabilities.

### GET `/api/system/stats`
Get system usage statistics.

---

## 🏢 Tenant Management Endpoints

### GET `/api/tenants`
List all tenants (admin only).

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)
- `status` (string): Filter by status
- `tier` (string): Filter by subscription tier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "enterprise-corp",
      "display_name": "Enterprise Corporation",
      "status": "active",
      "subscription_tier": "enterprise",
      "max_users": 1000,
      "current_users": 45,
      "max_tool_executions_monthly": 100000,
      "current_executions": 5430,
      "created_at": "2025-09-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 20
  }
}
```

### POST `/api/tenants`
Create new tenant (super_admin only).

### GET `/api/tenants/:id`
Get specific tenant details.

### PUT `/api/tenants/:id`
Update tenant information.

### DELETE `/api/tenants/:id`
Delete tenant (super_admin only).

---

## 👥 User Management Endpoints

### GET `/api/users`
List users in current tenant.

**Query Parameters:**
- `page`, `limit`: Pagination
- `role`: Filter by role
- `status`: Filter by status
- `organization_id`: Filter by organization

### POST `/api/users`
Create new user (admin only).

**Request Body:**
```json
{
  "username": "john.pentester",
  "email": "john@company.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Pentester",
  "role": "pentester",
  "organization_id": "uuid"
}
```

### GET `/api/users/:id`
Get specific user details.

### PUT `/api/users/:id`
Update user information.

### DELETE `/api/users/:id`
Delete user (admin only).

### GET `/api/users/me`
Get current user profile.

### PUT `/api/users/me`
Update current user profile.

---

## 🏛️ Organization Management

### GET `/api/organizations`
List organizations in current tenant.

### POST `/api/organizations`
Create new organization.

### GET `/api/organizations/:id`
Get organization details.

### PUT `/api/organizations/:id`
Update organization.

### DELETE `/api/organizations/:id`
Delete organization.

### GET `/api/organizations/:id/hierarchy`
Get organization hierarchy tree.

---

## 🔧 MCP Server Management

### GET `/api/mcp/servers`
List all MCP servers and their status.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "HexStrike AI",
      "status": "online",
      "tools_count": 45,
      "url": "http://localhost:8888",
      "type": "http",
      "categories": ["network_scanning", "vulnerability_assessment"],
      "last_heartbeat": "2025-09-23T12:00:00.000Z"
    },
    {
      "name": "MCP-God-Mode",
      "status": "online",
      "tools_count": 152,
      "type": "stdio",
      "categories": ["penetration_testing", "forensics", "mobile_security"]
    }
  ]
}
```

### GET `/api/mcp/tools`
List all available tools across all MCP servers.

**Query Parameters:**
- `server`: Filter by MCP server
- `category`: Filter by tool category
- `search`: Search tool names/descriptions

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tools": 272,
    "by_server": {
      "hexstrike": 45,
      "attackmcp": 7,
      "notion": 2,
      "godmode": 152
    },
    "tools": [
      {
        "name": "nmap",
        "category": "network_scanning",
        "server": "hexstrike",
        "description": "Network discovery and security auditing",
        "parameters": ["target", "scan_type", "ports"]
      }
    ]
  }
}
```

### POST `/api/mcp/servers/:server/restart`
Restart specific MCP server (admin only).

### GET `/api/mcp/god-mode/status`
Get MCP-God-Mode server detailed status.

### POST `/api/mcp/god-mode/start`
Start MCP-God-Mode server.

### POST `/api/mcp/god-mode/stop`
Stop MCP-God-Mode server.

---

## ⚡ Tool Execution Endpoints

### POST `/api/tools/execute`
Execute a security tool.

**Request Body:**
```json
{
  "tool_name": "nmap",
  "server": "hexstrike",
  "parameters": {
    "target": "192.168.1.0/24",
    "scan_type": "stealth",
    "ports": "1-1000"
  },
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_12345",
    "status": "pending",
    "tool_name": "nmap",
    "estimated_duration": "30-60 seconds",
    "websocket_channel": "execution_exec_12345"
  }
}
```

### GET `/api/tools/executions`
List tool executions for current user/tenant.

### GET `/api/tools/executions/:id`
Get specific tool execution details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "execution_id": "exec_12345",
    "tool_name": "nmap",
    "status": "completed",
    "started_at": "2025-09-23T12:00:00.000Z",
    "completed_at": "2025-09-23T12:01:30.000Z",
    "duration_ms": 90000,
    "output": {
      "hosts_discovered": 15,
      "open_ports": 47,
      "services": ["ssh", "http", "https"]
    },
    "findings": {
      "vulnerabilities": [
        {
          "severity": "medium",
          "title": "Outdated SSH version",
          "description": "SSH version 2.4 detected"
        }
      ],
      "insights": ["Multiple web servers detected"],
      "recommendations": ["Update SSH to latest version"]
    }
  }
}
```

### POST `/api/tools/executions/:id/cancel`
Cancel running tool execution.

### GET `/api/tools/categories`
List all available tool categories.

---

## 📊 Analytics & Reporting

### GET `/api/analytics/dashboard`
Get dashboard analytics data.

**Query Parameters:**
- `period`: Time period (1d, 7d, 30d, 90d)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_executions": 1250,
      "successful_executions": 1180,
      "failed_executions": 70,
      "success_rate": 94.4
    },
    "top_tools": [
      {"tool": "nmap", "count": 145},
      {"tool": "burpsuite", "count": 89}
    ],
    "executions_by_day": [
      {"date": "2025-09-20", "count": 45},
      {"date": "2025-09-21", "count": 67}
    ],
    "findings_summary": {
      "high_severity": 8,
      "medium_severity": 23,
      "low_severity": 45
    }
  }
}
```

### GET `/api/analytics/tools`
Get tool usage analytics.

### GET `/api/analytics/users`
Get user activity analytics.

### GET `/api/analytics/security`
Get security findings analytics.

### POST `/api/reports/generate`
Generate custom report.

**Request Body:**
```json
{
  "type": "security_assessment",
  "format": "pdf",
  "period": "30d",
  "filters": {
    "tool_categories": ["vulnerability_assessment"],
    "severity": ["high", "medium"]
  }
}
```

---

## 🔑 Session Management

### GET `/api/sessions`
List active sessions for current user.

### GET `/api/sessions/active`
List all active sessions (admin only).

### DELETE `/api/sessions/:id`
Revoke specific session.

### POST `/api/sessions/revoke-all`
Revoke all sessions for current user.

---

## 👑 Admin Endpoints

### GET `/api/admin/system/maintenance`
Get system maintenance status.

### POST `/api/admin/system/maintenance`
Perform system maintenance.

### GET `/api/admin/audit-logs`
Get system audit logs.

### GET `/api/admin/database/stats`
Get database statistics.

### POST `/api/admin/database/cleanup`
Perform database cleanup.

---

## 📡 WebSocket Events

Connect to: `ws://localhost:8890/ws`

### Authentication
Send JWT token in connection query: `?token=jwt_token`

### Events

**Tool Execution Updates:**
```json
{
  "event": "tool_execution_update",
  "data": {
    "execution_id": "exec_12345",
    "status": "running",
    "progress": 45,
    "message": "Scanning ports 1-1000..."
  }
}
```

**System Notifications:**
```json
{
  "event": "system_notification",
  "data": {
    "type": "info",
    "title": "System Maintenance",
    "message": "Scheduled maintenance in 10 minutes"
  }
}
```

**Security Alerts:**
```json
{
  "event": "security_alert",
  "data": {
    "severity": "high",
    "title": "Suspicious Login Attempt",
    "details": {
      "ip": "192.168.1.100",
      "user_agent": "...",
      "timestamp": "2025-09-23T12:00:00.000Z"
    }
  }
}
```

---

## 🚨 Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `AUTH_INVALID_TOKEN` | 401 | Invalid or expired JWT token |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `TENANT_QUOTA_EXCEEDED` | 402 | Tenant quota exceeded |
| `TOOL_EXECUTION_FAILED` | 500 | Tool execution failed |
| `MCP_SERVER_OFFLINE` | 503 | MCP server unavailable |

---

## 📋 Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 5 requests | 1 minute |
| Tool Execution | 10 requests | 1 minute |
| General API | 1000 requests | 15 minutes |
| Analytics | 100 requests | 5 minutes |

---

## 🔒 Security Headers

All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

---

## 📖 Interactive Documentation

Access interactive API documentation at:
- **Swagger UI**: `http://localhost:8890/api/docs`
- **ReDoc**: `http://localhost:8890/api/docs/redoc`
- **OpenAPI JSON**: `http://localhost:8890/api/docs/json`
- **Postman Collection**: `http://localhost:8890/api/docs/postman`

---

*Last Updated: 2025-09-23 12:55:00 UTC*
*API Version: v3.2.0*
*Documentation Coverage: 100% (35+ endpoints)*