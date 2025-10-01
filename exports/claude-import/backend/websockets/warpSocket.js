/**
 * Warp Terminal WebSocket Handler
 * Real-time Warp Terminal integration
 */

import { v4 as uuidv4 } from 'uuid';
import { logWebSocketEvent } from '../middleware/logger.js';

export function setupWarpWebSocket(ws, request) {
  const connectionId = uuidv4().substring(0, 8);
  
  logWebSocketEvent('Connected', connectionId, { url: request.url });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Warp Terminal WebSocket connected',
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

        case 'subscribe-output':
          // Start streaming terminal output
          const outputInterval = setInterval(() => {
            ws.send(JSON.stringify({
              type: 'terminal-output',
              data: {
                output: `Mock terminal output at ${new Date().toLocaleTimeString()}`,
                sessionId: 'session-1',
                command: 'tail -f /var/log/system.log'
              },
              timestamp: new Date().toISOString()
            }));
          }, 2000);

          // Store interval for cleanup
          ws.outputInterval = outputInterval;
          break;

        case 'unsubscribe-output':
          if (ws.outputInterval) {
            clearInterval(ws.outputInterval);
            delete ws.outputInterval;
          }
          break;

        case 'execute-command':
          // Mock command execution
          ws.send(JSON.stringify({
            type: 'command-result',
            data: {
              command: message.command,
              output: `Mock output for: ${message.command}`,
              exitCode: 0,
              executionTime: Math.floor(Math.random() * 1000) + 100
            },
            timestamp: new Date().toISOString()
          }));
          break;

        case 'get-session-status':
          ws.send(JSON.stringify({
            type: 'session-status',
            data: {
              sessionId: 'session-1',
              workingDirectory: '/home/user/projects',
              activeCommand: null,
              status: 'idle'
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
    if (ws.outputInterval) {
      clearInterval(ws.outputInterval);
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