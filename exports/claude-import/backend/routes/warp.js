/**
 * Warp Terminal Integration Routes
 * Handles Warp Terminal session monitoring and command execution
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { WarpService } from '../services/WarpService.js';

const router = express.Router();
const warpService = new WarpService();

// Get Warp Terminal status
router.get('/status', asyncHandler(async (req, res) => {
  const status = await warpService.getStatus();
  
  res.json({
    success: true,
    data: {
      connected: status.connected,
      version: status.version,
      activeSession: status.activeSession,
      sessionCount: status.sessionCount,
      lastActivity: status.lastActivity,
      integrationStatus: status.integrationStatus
    },
    timestamp: new Date().toISOString()
  });
}));

// Get current session information
router.get('/session', asyncHandler(async (req, res) => {
  const session = await warpService.getCurrentSession();
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      workingDirectory: session.workingDirectory,
      environment: session.environment,
      history: session.history,
      startTime: session.startTime,
      lastCommand: session.lastCommand,
      status: session.status
    },
    timestamp: new Date().toISOString()
  });
}));

// Get session history
router.get('/session/history', asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, filter } = req.query;
  
  const history = await warpService.getSessionHistory({
    limit: parseInt(limit),
    offset: parseInt(offset),
    filter
  });
  
  res.json({
    success: true,
    data: {
      commands: history.commands,
      total: history.total,
      currentPage: Math.floor(offset / limit) + 1,
      hasMore: (offset + limit) < history.total
    },
    timestamp: new Date().toISOString()
  });
}));

// Execute command in Warp Terminal
router.post('/execute', asyncHandler(async (req, res) => {
  const { command, workingDirectory, timeout = 30000 } = req.body;
  
  if (!command) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Command is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await warpService.executeCommand({
    command,
    workingDirectory,
    timeout
  });
  
  res.json({
    success: result.success,
    data: {
      command: result.command,
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      workingDirectory: result.workingDirectory
    },
    timestamp: new Date().toISOString()
  });
}));

// Get live terminal output (for monitoring)
router.get('/live-output', asyncHandler(async (req, res) => {
  // Set up server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const cleanup = warpService.streamLiveOutput((data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
  
  // Handle client disconnect
  req.on('close', () => {
    cleanup();
  });
}));

// Get session list
router.get('/sessions', asyncHandler(async (req, res) => {
  const sessions = await warpService.getAllSessions();
  
  res.json({
    success: true,
    data: {
      sessions: sessions.map(session => ({
        id: session.id,
        name: session.name,
        workingDirectory: session.workingDirectory,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        status: session.status,
        commandCount: session.commandCount
      })),
      count: sessions.length
    },
    timestamp: new Date().toISOString()
  });
}));

// Switch to specific session
router.post('/sessions/:sessionId/activate', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const result = await warpService.activateSession(sessionId);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      sessionId: sessionId,
      active: result.success,
      session: result.session
    },
    timestamp: new Date().toISOString()
  });
}));

// Export session data
router.post('/export', asyncHandler(async (req, res) => {
  const { format = 'json', sessionId, includeOutput = true } = req.body;
  
  const exportData = await warpService.exportSession({
    sessionId,
    format,
    includeOutput
  });
  
  // Set appropriate headers for file download
  const filename = `warp-session-${sessionId || 'current'}-${new Date().toISOString().split('T')[0]}.${format}`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
  
  res.send(exportData);
}));

// Get environment variables
router.get('/environment', asyncHandler(async (req, res) => {
  const environment = await warpService.getEnvironment();
  
  res.json({
    success: true,
    data: {
      variables: environment.variables,
      path: environment.path,
      shell: environment.shell,
      user: environment.user,
      hostname: environment.hostname
    },
    timestamp: new Date().toISOString()
  });
}));

// Update Warp Terminal configuration
router.put('/config', asyncHandler(async (req, res) => {
  const config = req.body;
  
  const result = await warpService.updateConfiguration(config);
  
  res.json({
    success: result.success,
    message: result.message,
    data: result.config,
    timestamp: new Date().toISOString()
  });
}));

// Get current configuration
router.get('/config', asyncHandler(async (req, res) => {
  const config = await warpService.getConfiguration();
  
  res.json({
    success: true,
    data: config,
    timestamp: new Date().toISOString()
  });
}));

// Test Warp Terminal connection
router.post('/test-connection', asyncHandler(async (req, res) => {
  const testResult = await warpService.testConnection();
  
  res.json({
    success: testResult.success,
    message: testResult.message,
    data: {
      connected: testResult.success,
      version: testResult.version,
      features: testResult.features,
      responseTime: testResult.responseTime
    },
    timestamp: new Date().toISOString()
  });
}));

// Get system information through Warp
router.get('/system-info', asyncHandler(async (req, res) => {
  const systemInfo = await warpService.getSystemInfo();
  
  res.json({
    success: true,
    data: systemInfo,
    timestamp: new Date().toISOString()
  });
}));

// Search command history
router.get('/search', asyncHandler(async (req, res) => {
  const { query, limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Search query is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const results = await warpService.searchHistory(query, parseInt(limit));
  
  res.json({
    success: true,
    data: {
      query,
      results: results.commands,
      count: results.count
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;