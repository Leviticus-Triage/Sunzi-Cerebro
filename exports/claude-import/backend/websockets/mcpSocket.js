/**
 * MCP Server Status WebSocket Handler
 * Real-time MCP server monitoring
 */

import { v4 as uuidv4 } from 'uuid';
import { logWebSocketEvent } from '../middleware/logger.js';

export function setupMcpWebSocket(ws, request) {
  const connectionId = uuidv4().substring(0, 8);
  
  logWebSocketEvent('Connected', connectionId, { url: request.url });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'MCP Status WebSocket connected',
    connectionId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      logWebSocketEvent('Message received', connectionId, { type: message.type });

      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        case 'subscribe-status':
          // Start streaming MCP server status updates
          const statusInterval = setInterval(() => {
            ws.send(JSON.stringify({
              type: 'server-status-update',
              data: {
                servers: [
                  {
                    id: 'hexstrike',
                    name: 'HexStrike AI',
                    status: Math.random() > 0.1 ? 'running' : 'error',
                    responseTime: Math.floor(Math.random() * 100) + 20,
                    lastCheck: new Date().toISOString()
                  },
                  {
                    id: 'sunzi-cerebro',
                    name: 'Sunzi Cerebro MCP',
                    status: 'running',
                    responseTime: Math.floor(Math.random() * 50) + 10,
                    lastCheck: new Date().toISOString()
                  }
                ]
              },
              timestamp: new Date().toISOString()
            }));
          }, 5000);

          // Store interval for cleanup
          ws.statusInterval = statusInterval;
          break;

        case 'unsubscribe-status':
          if (ws.statusInterval) {
            clearInterval(ws.statusInterval);
            delete ws.statusInterval;
          }
          break;

        case 'server-health-check':
          // Mock health check response
          ws.send(JSON.stringify({
            type: 'health-check-result',
            data: {
              serverId: message.serverId,
              healthy: Math.random() > 0.1,
              responseTime: Math.floor(Math.random() * 200) + 50,
              details: {
                version: '1.0.0',
                uptime: Math.floor(Math.random() * 86400),
                memoryUsage: Math.random() * 512
              }
            },
            timestamp: new Date().toISOString()
          }));
          break;

        case 'get-server-metrics':
          ws.send(JSON.stringify({
            type: 'server-metrics',
            data: {
              serverId: message.serverId,
              metrics: {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                requests: Math.floor(Math.random() * 1000),
                errors: Math.floor(Math.random() * 10)
              }
            },
            timestamp: new Date().toISOString()
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${message.type}`,
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      logWebSocketEvent('Message error', connectionId, { error: error.message });
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON message',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    logWebSocketEvent('Disconnected', connectionId);
    
    // Cleanup intervals
    if (ws.statusInterval) {
      clearInterval(ws.statusInterval);
    }
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    logWebSocketEvent('Error', connectionId, { error: error.message });
  });

  // Send periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      }));
    }
  }, 30000); // Every 30 seconds

  ws.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}