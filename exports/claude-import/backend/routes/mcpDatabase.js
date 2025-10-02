/**
 * MCP Database Server API Routes
 * Provides RESTful API access to the MCP Database Server
 * Enhanced by Moses Team - Enterprise Database MCP Integration
 * Version: v3.2.0 Production
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/authProduction.js';
import { mcpOptimizer } from '../services/mcpPerformanceOptimizer.js';

const router = express.Router();

// Reference to MCP Database Server (set by main server)
let mcpDatabaseServer = null;

export const setMcpDatabaseServer = (server) => {
  mcpDatabaseServer = server;
};

/**
 * GET /api/mcp/database/status
 * Get MCP Database Server status
 */
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available',
      code: 'SERVER_NOT_AVAILABLE'
    });
  }

  const info = mcpDatabaseServer.getServerInfo();

  res.json({
    success: true,
    data: {
      server: info,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/mcp/database/tools
 * Get available database tools
 */
router.get('/tools', authenticate, asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  const tools = mcpDatabaseServer.getTools();

  res.json({
    success: true,
    data: {
      tools,
      count: tools.length
    }
  });
}));

/**
 * POST /api/mcp/database/execute
 * Execute a database tool
 */
router.post('/execute', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  const { tool, parameters = {} } = req.body;

  if (!tool) {
    return res.status(400).json({
      success: false,
      error: 'Tool name is required'
    });
  }

  try {
    const result = await mcpDatabaseServer.executeTool(tool, parameters);

    res.json({
      success: true,
      data: result,
      metadata: {
        tool,
        executed_by: req.user.username,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      tool: tool
    });
  }
}));

/**
 * GET /api/mcp/database/stats
 * Get database statistics (shortcut for get_database_stats tool)
 */
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  try {
    const result = await mcpDatabaseServer.executeTool('get_database_stats');

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/mcp/database/users
 * Query users (shortcut for query_users tool)
 */
router.get('/users', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  try {
    const { organization_id, role, status, limit = 10, offset = 0 } = req.query;

    const parameters = {
      filters: {},
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (organization_id) parameters.filters.organization_id = organization_id;
    if (role) parameters.filters.role = role;
    if (status) parameters.filters.status = status;

    const result = await mcpDatabaseServer.executeTool('query_users', parameters);

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/mcp/database/organizations
 * Query organizations (shortcut for query_organizations tool)
 */
router.get('/organizations', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  try {
    const { tier, status, limit = 10 } = req.query;

    const parameters = {
      filters: {},
      limit: parseInt(limit)
    };

    if (tier) parameters.filters.tier = tier;
    if (status) parameters.filters.status = status;

    const result = await mcpDatabaseServer.executeTool('query_organizations', parameters);

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/mcp/database/audit-logs
 * Query audit logs (shortcut for query_audit_logs tool)
 */
router.get('/audit-logs', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  try {
    const { user_id, organization_id, action, severity, date_from, date_to, limit = 100, offset = 0 } = req.query;

    const parameters = {
      filters: {},
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    if (user_id) parameters.filters.user_id = user_id;
    if (organization_id) parameters.filters.organization_id = organization_id;
    if (action) parameters.filters.action = action;
    if (severity) parameters.filters.severity = severity;
    if (date_from) parameters.filters.date_from = date_from;
    if (date_to) parameters.filters.date_to = date_to;

    const result = await mcpDatabaseServer.executeTool('query_audit_logs', parameters);

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/mcp/database/user-activity/:userId
 * Get user activity summary
 */
router.get('/user-activity/:userId', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  if (!mcpDatabaseServer) {
    return res.status(503).json({
      success: false,
      error: 'MCP Database Server not available'
    });
  }

  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const parameters = {
      user_id: userId,
      days: parseInt(days)
    };

    const result = await mcpDatabaseServer.executeTool('get_user_activity', parameters);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/mcp/database/performance
 * Get MCP Database Server performance statistics
 */
router.get('/performance', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  try {
    const performanceStats = mcpOptimizer.getPerformanceStats();
    const healthCheck = mcpOptimizer.healthCheck();

    res.json({
      success: true,
      data: {
        performance: performanceStats,
        health: healthCheck,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/mcp/database/optimize
 * Trigger MCP performance optimization
 */
router.post('/optimize', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  try {
    mcpOptimizer.autoOptimize();

    res.json({
      success: true,
      message: 'MCP performance optimization triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

export default router;