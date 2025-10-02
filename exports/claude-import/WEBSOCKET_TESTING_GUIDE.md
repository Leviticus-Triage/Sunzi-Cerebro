# WebSocket Testing Quick Start Guide

**System:** Sunzi Cerebro Enterprise v3.2.0
**Date:** 2025-09-30
**Purpose:** Quick guide for testing WebSocket connections

---

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd /home/danii/Cerebrum/sunzi-cerebro-react-framework/backend
   npm run dev

   # Should see:
   # 🚀 Sunzi Cerebro Backend Server started successfully!
   # 🔌 WebSocket available at: ws://localhost:8890/ws
   ```

2. **Check Server Health**
   ```bash
   curl http://localhost:8890/health

   # Should return:
   # {"status":"OK", "services":{"websocket":"running"}}
   ```

---

## Quick Test Methods

### Method 1: HTML Test Interface (Recommended)

**Location:** `/tmp/ws_test.html`

**Steps:**
```bash
# 1. Open in browser
firefox /tmp/ws_test.html
# OR
google-chrome /tmp/ws_test.html

# 2. Click test buttons in order:
#    - Test Generic WebSocket
#    - Test MCP WebSocket
#    - Test Warp WebSocket
#    - Test Authenticated WebSocket

# 3. Watch the log output for:
#    - ✓ WebSocket connected (success)
#    - → Sending messages
#    - ← Received responses
#    - Connection closed
```

**Expected Results:**
- Connection status turns green
- Log shows connection messages
- Ping/pong messages exchanged
- Heartbeat messages every 30 seconds
- Clean disconnect on close

### Method 2: Command Line (wscat)

**Install wscat:**
```bash
npm install -g wscat
```

**Test Generic WebSocket:**
```bash
wscat -c ws://localhost:8890/ws

# Send messages:
{"type":"ping"}
{"type":"test","data":"hello"}

# Press Ctrl+C to disconnect
```

**Test MCP WebSocket:**
```bash
wscat -c ws://localhost:8890/ws/mcp

# Send messages:
{"type":"ping"}
{"type":"subscribe-status"}
{"type":"get-server-metrics","serverId":"hexstrike"}

# Should see server status updates every 5 seconds
```

**Test Warp WebSocket:**
```bash
wscat -c ws://localhost:8890/ws/warp

# Send messages:
{"type":"ping"}
{"type":"get-session-status"}
{"type":"execute-command","command":"ls -la"}

# Should see command results
```

### Method 3: Browser DevTools

**Steps:**
```bash
# 1. Start frontend
cd /home/danii/Cerebrum/sunzi-cerebro-react-framework
npm run dev

# 2. Open http://localhost:3000 in browser

# 3. Open DevTools (F12)

# 4. Go to Network tab → WS filter

# 5. Navigate to MCP Toolset page

# 6. Watch WebSocket connections establish

# 7. Check Console for WebSocket logs:
#    🔌 MCP WebSocket connected
#    🔍 Server discovered: HexStrike AI
```

---

## Expected WebSocket Behavior

### Generic WebSocket (/ws)

**Connection:**
```json
← {"type":"connection","message":"WebSocket connected successfully","timestamp":"2025-09-30T09:30:31Z"}
```

**Ping/Pong:**
```json
→ {"type":"ping"}
← {"type":"pong","timestamp":"2025-09-30T09:30:31Z"}
```

**Echo Test:**
```json
→ {"type":"test","data":"hello"}
← {"type":"echo","data":{"type":"test","data":"hello"},"timestamp":"2025-09-30T09:30:31Z"}
```

### MCP WebSocket (/ws/mcp)

**Connection:**
```json
← {"type":"connection","message":"MCP Status WebSocket connected","connectionId":"a1b2c3d4","timestamp":"2025-09-30T09:30:31Z"}
```

**Subscribe to Status:**
```json
→ {"type":"subscribe-status"}
← {"type":"server-status-update","data":{"servers":[...]}}
← {"type":"server-status-update","data":{"servers":[...]}} (every 5 seconds)
```

**Server Metrics:**
```json
→ {"type":"get-server-metrics","serverId":"hexstrike"}
← {"type":"server-metrics","data":{"serverId":"hexstrike","metrics":{...}}}
```

**Heartbeat:**
```json
← {"type":"heartbeat","timestamp":"2025-09-30T09:30:31Z"} (every 30 seconds)
```

### Warp WebSocket (/ws/warp)

**Execute Command:**
```json
→ {"type":"execute-command","command":"ls -la"}
← {"type":"command-result","data":{"command":"ls -la","output":"...","exitCode":0,"executionTime":523}}
```

**Get Session:**
```json
→ {"type":"get-session-status"}
← {"type":"session-status","data":{"sessionId":"session-1","workingDirectory":"/home/user/projects","status":"idle"}}
```

### MCP-Real WebSocket (/ws/mcp-real)

**Authentication:**
```json
→ {"type":"authenticate","data":{"token":"jwt-token-here","sessionId":"test-session","userId":"test-user"}}
← {"type":"auth_success"}
```

**Subscribe to Tool Execution:**
```json
→ {"type":"subscribe","data":{"streamType":"tool_execution"}}
← {"type":"tool-execution-started","data":{...}}
← {"type":"tool-execution-progress","data":{...}}
← {"type":"tool-execution-completed","data":{...}}
```

---

## Troubleshooting

### Problem: Connection Refused

**Symptom:**
```
Error: Connection refused
OR
WebSocket error: ECONNREFUSED
```

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8890/health

# If not running, start it:
cd /home/danii/Cerebrum/sunzi-cerebro-react-framework/backend
npm run dev
```

### Problem: Authentication Failed

**Symptom:**
```
← {"type":"auth_failed","error":"Invalid token"}
```

**Solution:**
```bash
# Make sure you have a valid token
# For testing, use:
localStorage.setItem('sunzi_auth_token', 'mock-jwt-token-test')

# Or authenticate via API first:
curl -X POST http://localhost:8890/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Problem: No Messages Received

**Symptom:**
- Connection successful
- No responses to messages

**Solution:**
```bash
# Check message format (must be valid JSON)
# Correct:
{"type":"ping"}

# Incorrect:
{type:"ping"}  # Missing quotes
{'type':'ping'}  # Wrong quotes

# Check backend logs:
tail -f backend/logs/app.log
```

### Problem: Connection Drops Immediately

**Symptom:**
- Connects then immediately disconnects

**Solution:**
```bash
# Check CORS configuration in backend
# Should allow: ws://localhost:*

# Check firewall
sudo ufw status

# Check if port is blocked
netstat -tuln | grep 8890
```

### Problem: Heartbeat Not Received

**Symptom:**
- Connected but no heartbeat messages

**Solution:**
```bash
# Wait 30 seconds (heartbeat interval)
# Heartbeat messages are sent every 30 seconds

# Check connection is still open:
# In wscat, type anything - if connection is alive, you'll get a response
```

---

## Testing Checklist

### Basic Connectivity ✓

- [ ] Backend server starts without errors
- [ ] Health endpoint returns OK
- [ ] WebSocket port 8890 is listening
- [ ] Can connect to /ws endpoint
- [ ] Can connect to /ws/mcp endpoint
- [ ] Can connect to /ws/warp endpoint
- [ ] Can connect to /ws/mcp-real endpoint

### Message Flow ✓

- [ ] Ping/pong works on all endpoints
- [ ] Echo messages work on generic endpoint
- [ ] Subscribe/unsubscribe works
- [ ] Error messages for invalid JSON
- [ ] Heartbeat received every 30 seconds
- [ ] Clean disconnect on close

### MCP Functionality ✓

- [ ] Server status updates received
- [ ] Can request server metrics
- [ ] Can request health checks
- [ ] Status updates every 5 seconds
- [ ] All server data is valid

### Warp Functionality ✓

- [ ] Can execute commands
- [ ] Command results received
- [ ] Can get session status
- [ ] Output streaming works
- [ ] Can subscribe/unsubscribe to output

### Authentication ✓

- [ ] Can authenticate with JWT
- [ ] Receives auth_success on valid token
- [ ] Receives auth_failed on invalid token
- [ ] Can access authenticated endpoints
- [ ] Token from localStorage works

### Reconnection ✓

- [ ] Reconnects after disconnect (5 seconds)
- [ ] Reconnects up to max attempts (10)
- [ ] Stops after max attempts
- [ ] Exponential backoff works
- [ ] Message buffer preserved

### Frontend Integration ✓

- [ ] mcpApi.setupWebSocket() works
- [ ] realTimeDataPipeline connects
- [ ] Event listeners receive messages
- [ ] Dashboard receives updates
- [ ] Connection status indicator works

---

## Performance Testing

### Concurrent Connections

```bash
# Test multiple connections
for i in {1..10}; do
  (wscat -c ws://localhost:8890/ws &)
done

# Check active connections
curl http://localhost:8890/api/system/metrics
```

### Message Throughput

```bash
# Send rapid messages
wscat -c ws://localhost:8890/ws
# Then paste:
{"type":"ping"}
{"type":"ping"}
{"type":"ping"}
# ... (paste 100 times)

# Check response time in logs
```

### Memory Leak Test

```bash
# Connect and stay connected for 1 hour
wscat -c ws://localhost:8890/ws

# In another terminal, monitor memory:
watch -n 5 'ps aux | grep node'

# Memory should stay stable
```

---

## Advanced Testing

### Load Testing with Artillery

```bash
# Install artillery
npm install -g artillery

# Create test file: websocket-load-test.yml
config:
  target: 'ws://localhost:8890'
  phases:
    - duration: 60
      arrivalRate: 10
  engines:
    ws: {}
scenarios:
  - engine: ws
    flow:
      - connect:
          target: '/ws'
      - send:
          payload: '{"type":"ping"}'
      - think: 1
      - send:
          payload: '{"type":"test","data":"load test"}'

# Run load test
artillery run websocket-load-test.yml
```

### Stress Testing

```bash
# High connection rate
for i in {1..100}; do
  (wscat -c ws://localhost:8890/ws -x '{"type":"ping"}' &)
  sleep 0.1
done

# Monitor server
htop
```

---

## Integration Test Examples

### Frontend Component Test

```typescript
// Example: Testing WebSocket in React component
import { useEffect, useState } from 'react';
import { realTimeDataPipeline } from '../services/realTimeDataPipeline';

function TestComponent() {
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Subscribe to connection events
    realTimeDataPipeline.on('connected', () => {
      setConnected(true);
      console.log('✅ WebSocket connected');
    });

    realTimeDataPipeline.on('disconnected', () => {
      setConnected(false);
      console.log('❌ WebSocket disconnected');
    });

    // Subscribe to system metrics
    realTimeDataPipeline.on('system_metrics_update', (data) => {
      setMetrics(data);
      console.log('📊 Metrics update:', data);
    });

    // Cleanup
    return () => {
      realTimeDataPipeline.disconnect();
    };
  }, []);

  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
}
```

---

## Monitoring Commands

### Check Active Connections

```bash
# Show active WebSocket connections
netstat -an | grep 8890 | grep ESTABLISHED

# Count active connections
netstat -an | grep 8890 | grep ESTABLISHED | wc -l
```

### View Backend Logs

```bash
# Live logs
tail -f backend/logs/app.log

# WebSocket logs only
tail -f backend/logs/app.log | grep WebSocket

# Connection logs
tail -f backend/logs/app.log | grep "Connected\|Disconnected"
```

### Check Server Resources

```bash
# CPU and memory usage
ps aux | grep "node.*server.js"

# Detailed process info
top -p $(pgrep -f "node.*server.js")

# Network connections
lsof -i :8890
```

---

## Quick Reference

### WebSocket URLs

```
Generic:        ws://localhost:8890/ws
MCP Status:     ws://localhost:8890/ws/mcp
Warp Terminal:  ws://localhost:8890/ws/warp
MCP Real-time:  ws://localhost:8890/ws/mcp-real
```

### Message Types

```javascript
// Connection
connection, authenticate, auth_success, auth_failed

// Heartbeat
ping, pong, heartbeat

// MCP
server-discovered, server-status-update, tools-discovered
tool-execution-started, tool-execution-progress, tool-execution-completed

// Subscriptions
subscribe, unsubscribe, subscribe-status, subscribe-output

// System
system-metrics, security-alert

// Errors
error
```

### Key Files

```
Backend Server:        backend/server.js
Warp Handler:          backend/websockets/warpSocket.js
MCP Handler:           backend/websockets/mcpSocket.js
Frontend MCP API:      src/services/mcpApi.ts
Real-time Pipeline:    src/services/realTimeDataPipeline.ts
Test Interface:        /tmp/ws_test.html
```

---

## Support & Documentation

**Full Documentation:** `/home/danii/Cerebrum/sunzi-cerebro-react-framework/WEBSOCKET_TEST_RESULTS.md`

**Backend Code:**
- Server: `backend/server.js` (lines 245-306)
- Warp Handler: `backend/websockets/warpSocket.js`
- MCP Handler: `backend/websockets/mcpSocket.js`

**Frontend Code:**
- MCP API: `src/services/mcpApi.ts`
- Real-time Pipeline: `src/services/realTimeDataPipeline.ts`

**Test Tools:**
- HTML Interface: `/tmp/ws_test.html`
- Backend Health: `http://localhost:8890/health`
- API Documentation: `http://localhost:8890/api`

---

**Guide Version:** 1.0
**Last Updated:** 2025-09-30
**Status:** Production Ready