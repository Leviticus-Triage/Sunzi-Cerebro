/**
 * MCP Server Management Routes
 * Handles MCP server status, configuration, and monitoring
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { McpService } from '../services/McpService.js';

const router = express.Router();
const mcpService = new McpService();

// Get all MCP servers status
router.get('/servers', asyncHandler(async (req, res) => {
  const servers = await mcpService.getAllServers();
  
  res.json({
    success: true,
    data: {
      servers: servers.map(server => ({
        name: server.name,
        url: server.url,
        status: server.status,
        lastCheck: server.lastCheck,
        version: server.version,
        capabilities: server.capabilities,
        uptime: server.uptime,
        errorCount: server.errorCount
      })),
      totalCount: servers.length,
      activeCount: servers.filter(s => s.status === 'running').length,
      errorCount: servers.filter(s => s.status === 'error').length
    },
    timestamp: new Date().toISOString()
  });
}));

// Get specific MCP server status
router.get('/servers/:serverId', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const server = await mcpService.getServer(serverId);
  
  if (!server) {
    return res.status(404).json({
      error: {
        status: 404,
        message: 'MCP server not found',
        serverId,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  res.json({
    success: true,
    data: {
      id: server.id,
      name: server.name,
      url: server.url,
      status: server.status,
      version: server.version,
      capabilities: server.capabilities,
      configuration: server.configuration,
      statistics: server.statistics,
      lastCheck: server.lastCheck,
      uptime: server.uptime,
      healthHistory: server.healthHistory
    },
    timestamp: new Date().toISOString()
  });
}));

// Test MCP server connection
router.post('/servers/:serverId/test', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const testResult = await mcpService.testServerConnection(serverId);
  
  res.json({
    success: testResult.success,
    message: testResult.message,
    data: {
      serverId,
      connected: testResult.success,
      responseTime: testResult.responseTime,
      version: testResult.version,
      capabilities: testResult.capabilities,
      error: testResult.error
    },
    timestamp: new Date().toISOString()
  });
}));

// Start MCP server
router.post('/servers/:serverId/start', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const result = await mcpService.startServer(serverId);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      serverId,
      status: result.status,
      processId: result.processId
    },
    timestamp: new Date().toISOString()
  });
}));

// Stop MCP server
router.post('/servers/:serverId/stop', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const result = await mcpService.stopServer(serverId);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      serverId,
      status: result.status
    },
    timestamp: new Date().toISOString()
  });
}));

// Restart MCP server
router.post('/servers/:serverId/restart', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const result = await mcpService.restartServer(serverId);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      serverId,
      status: result.status,
      processId: result.processId
    },
    timestamp: new Date().toISOString()
  });
}));

// Get MCP server logs
router.get('/servers/:serverId/logs', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const { limit = 100, level = 'all' } = req.query;
  
  const logs = await mcpService.getServerLogs(serverId, {
    limit: parseInt(limit),
    level
  });
  
  res.json({
    success: true,
    data: {
      serverId,
      logs: logs.entries,
      totalCount: logs.total,
      level
    },
    timestamp: new Date().toISOString()
  });
}));

// Get MCP server configuration
router.get('/servers/:serverId/config', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const config = await mcpService.getServerConfiguration(serverId);
  
  res.json({
    success: true,
    data: config,
    timestamp: new Date().toISOString()
  });
}));

// Update MCP server configuration
router.put('/servers/:serverId/config', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const config = req.body;
  
  const result = await mcpService.updateServerConfiguration(serverId, config);
  
  res.json({
    success: result.success,
    message: result.message,
    data: result.configuration,
    timestamp: new Date().toISOString()
  });
}));

// Add new MCP server
router.post('/servers', asyncHandler(async (req, res) => {
  const { name, url, configuration = {} } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Server name and URL are required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await mcpService.addServer({ name, url, configuration });
  
  res.status(201).json({
    success: result.success,
    message: result.message,
    data: {
      serverId: result.serverId,
      server: result.server
    },
    timestamp: new Date().toISOString()
  });
}));

// Remove MCP server
router.delete('/servers/:serverId', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const result = await mcpService.removeServer(serverId);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      serverId,
      removed: result.success
    },
    timestamp: new Date().toISOString()
  });
}));

// Get MCP server tools/capabilities
router.get('/servers/:serverId/tools', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const tools = await mcpService.getServerTools(serverId);
  
  res.json({
    success: true,
    data: {
      serverId,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        category: tool.category,
        lastUsed: tool.lastUsed,
        usageCount: tool.usageCount
      })),
      count: tools.length
    },
    timestamp: new Date().toISOString()
  });
}));

// Execute tool on MCP server
router.post('/servers/:serverId/tools/:toolName/execute', asyncHandler(async (req, res) => {
  const { serverId, toolName } = req.params;
  const { parameters = {} } = req.body;
  
  const result = await mcpService.executeTool(serverId, toolName, parameters);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      serverId,
      toolName,
      result: result.data,
      executionTime: result.executionTime,
      error: result.error
    },
    timestamp: new Date().toISOString()
  });
}));

// Get MCP system overview
router.get('/overview', asyncHandler(async (req, res) => {
  const overview = await mcpService.getSystemOverview();
  
  res.json({
    success: true,
    data: {
      totalServers: overview.totalServers,
      activeServers: overview.activeServers,
      errorServers: overview.errorServers,
      totalTools: overview.totalTools,
      recentActivity: overview.recentActivity,
      systemHealth: overview.systemHealth,
      performance: overview.performance
    },
    timestamp: new Date().toISOString()
  });
}));

// Get MCP server metrics
router.get('/servers/:serverId/metrics', asyncHandler(async (req, res) => {
  const { serverId } = req.params;
  const { timeframe = '1h' } = req.query;
  
  const metrics = await mcpService.getServerMetrics(serverId, timeframe);
  
  res.json({
    success: true,
    data: {
      serverId,
      timeframe,
      metrics: {
        responseTime: metrics.responseTime,
        requestCount: metrics.requestCount,
        errorRate: metrics.errorRate,
        uptime: metrics.uptime,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage
      },
      history: metrics.history
    },
    timestamp: new Date().toISOString()
  });
}));

// Bulk operations on MCP servers
router.post('/bulk-action', asyncHandler(async (req, res) => {
  const { action, serverIds } = req.body;
  
  if (!action || !serverIds || !Array.isArray(serverIds)) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Action and serverIds array are required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const results = await mcpService.bulkAction(action, serverIds);
  
  res.json({
    success: true,
    data: {
      action,
      serverIds,
      results: results.map(result => ({
        serverId: result.serverId,
        success: result.success,
        message: result.message,
        status: result.status
      })),
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;