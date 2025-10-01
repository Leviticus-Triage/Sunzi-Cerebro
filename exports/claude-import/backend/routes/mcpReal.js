/**
 * Real MCP Integration Routes
 * NO MOCK DATA - Production Ready MCP Tool Management
 * Enterprise-grade API endpoints for 200+ MCP tools
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import McpIntegrationService from '../services/mcpIntegration.js';
import McpGodModeService from '../services/mcpGodModeService.js';

const router = express.Router();

// Initialize MCP Integration Service (singleton)
let mcpService = null;

const getMcpService = () => {
  if (!mcpService) {
    mcpService = new McpIntegrationService();
    console.log('🔌 MCP Integration Service initialized for API routes');
  }
  return mcpService;
};

// Initialize MCP-God-Mode Service (singleton)
let mcpGodModeService = null;

const getMcpGodModeService = () => {
  if (!mcpGodModeService) {
    mcpGodModeService = new McpGodModeService();
    console.log('🔧 MCP-God-Mode Service initialized for API routes');
  }
  return mcpGodModeService;
};

/**
 * GET /api/mcp/servers
 * Get all MCP server status and information
 */
router.get('/servers', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const status = service.getServerStatus();

  res.json({
    success: true,
    data: {
      servers: status.servers,
      summary: {
        total: status.totalServers,
        online: status.onlineServers,
        offline: status.offlineServers,
        totalTools: status.totalTools
      },
      lastUpdate: status.lastUpdate
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/mcp/tools
 * Get all discovered MCP tools with filtering and pagination
 */
router.get('/tools', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const {
    category,
    server,
    risk_level,
    enabled,
    search,
    page = 1,
    limit = 50,
    sort_by = 'name',
    sort_order = 'asc'
  } = req.query;

  let tools = service.getAllTools();

  // Apply filters
  if (category && category !== 'all') {
    tools = tools.filter(tool => tool.category === category);
  }

  if (server) {
    tools = tools.filter(tool => tool.serverId === server);
  }

  if (risk_level) {
    tools = tools.filter(tool => tool.riskLevel === risk_level);
  }

  if (enabled !== undefined) {
    const isEnabled = enabled === 'true';
    tools = tools.filter(tool => tool.enabled === isEnabled);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    tools = tools.filter(tool =>
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower)
    );
  }

  // Sort tools
  tools.sort((a, b) => {
    let aVal = a[sort_by] || '';
    let bVal = b[sort_by] || '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sort_order === 'desc') {
      return bVal > aVal ? 1 : -1;
    } else {
      return aVal > bVal ? 1 : -1;
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTools = tools.slice(startIndex, endIndex);

  // Generate categories summary
  const categories = service.getToolsByCategory();
  const categorySummary = Object.keys(categories).map(cat => ({
    id: cat,
    name: cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: categories[cat].length
  }));

  res.json({
    success: true,
    data: {
      tools: paginatedTools,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: tools.length,
        total_pages: Math.ceil(tools.length / limit),
        has_next: endIndex < tools.length,
        has_prev: page > 1
      },
      categories: categorySummary,
      filters_applied: {
        category,
        server,
        risk_level,
        enabled,
        search
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/mcp/tools/:toolId
 * Get detailed information about a specific tool
 */
router.get('/tools/:toolId', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const { toolId } = req.params;

  const tool = service.tools.get(toolId);

  if (!tool) {
    return res.status(404).json({
      success: false,
      message: `Tool ${toolId} not found`,
      timestamp: new Date().toISOString()
    });
  }

  // Get server information
  const server = service.servers.get(tool.serverId);

  res.json({
    success: true,
    data: {
      tool: tool,
      server: server ? {
        id: tool.serverId,
        name: server.name,
        status: server.status,
        endpoint: `${server.protocol}://${server.host}:${server.port}`
      } : null,
      usage_stats: {
        last_used: tool.lastUsed,
        usage_count: tool.usageCount,
        risk_assessment: tool.riskLevel
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/mcp/tools/:toolId/execute
 * Execute a specific MCP tool with parameters
 */
router.post('/tools/:toolId/execute', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const { toolId } = req.params;
  const { parameters = {}, options = {} } = req.body;

  // Validate tool exists
  const tool = service.tools.get(toolId);
  if (!tool) {
    return res.status(404).json({
      success: false,
      message: `Tool ${toolId} not found`,
      timestamp: new Date().toISOString()
    });
  }

  // Check if tool is enabled
  if (!tool.enabled) {
    return res.status(403).json({
      success: false,
      message: `Tool ${tool.name} is disabled`,
      timestamp: new Date().toISOString()
    });
  }

  // Validate server is online
  const server = service.servers.get(tool.serverId);
  if (!server || server.status !== 'online') {
    return res.status(503).json({
      success: false,
      message: `Server ${tool.serverId} is not available`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Log execution attempt
    console.log(`🚀 API: Executing tool ${tool.name} with parameters:`, parameters);

    // Execute tool
    const result = await service.executeTool(toolId, parameters, {
      ...options,
      requestId: req.headers['x-request-id'] || `api_${Date.now()}`,
      userId: req.user?.id || 'anonymous',
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `Tool ${tool.name} executed successfully`,
      data: {
        tool_id: toolId,
        tool_name: tool.name,
        server: tool.serverId,
        execution_time: new Date().toISOString(),
        result: result,
        parameters_used: parameters
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`💥 API: Tool execution failed for ${tool.name}:`, error);

    res.status(500).json({
      success: false,
      message: `Tool execution failed: ${error.message}`,
      data: {
        tool_id: toolId,
        tool_name: tool.name,
        server: tool.serverId,
        error_details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/mcp/execution/queue
 * Get current execution queue status
 */
router.get('/execution/queue', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const queueStatus = service.getExecutionQueueStatus();

  res.json({
    success: true,
    data: queueStatus,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/mcp/tools/:toolId/toggle
 * Enable/disable a specific tool
 */
router.post('/tools/:toolId/toggle', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const { toolId } = req.params;
  const { enabled } = req.body;

  const tool = service.tools.get(toolId);
  if (!tool) {
    return res.status(404).json({
      success: false,
      message: `Tool ${toolId} not found`,
      timestamp: new Date().toISOString()
    });
  }

  tool.enabled = Boolean(enabled);
  service.tools.set(toolId, tool);

  res.json({
    success: true,
    message: `Tool ${tool.name} ${tool.enabled ? 'enabled' : 'disabled'}`,
    data: {
      tool_id: toolId,
      tool_name: tool.name,
      enabled: tool.enabled
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/mcp/discovery/refresh
 * Trigger a fresh discovery of all MCP servers and tools
 */
router.post('/discovery/refresh', asyncHandler(async (req, res) => {
  const service = getMcpService();

  // Trigger new discovery
  setTimeout(() => {
    service.startDiscovery();
  }, 100);

  res.json({
    success: true,
    message: 'MCP server discovery initiated',
    data: {
      current_servers: service.servers.size,
      current_tools: service.tools.size,
      discovery_started: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/mcp/god-mode/status
 * Get MCP-God-Mode server status and capabilities
 */
router.get('/god-mode/status', asyncHandler(async (req, res) => {
  const godModeService = getMcpGodModeService();
  const status = godModeService.getStatus();

  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/mcp/god-mode/start
 * Start the MCP-God-Mode server
 */
router.post('/god-mode/start', asyncHandler(async (req, res) => {
  const godModeService = getMcpGodModeService();
  const result = await godModeService.start();

  res.json({
    success: result.success,
    message: result.message,
    data: {
      pid: result.pid,
      tools: result.tools,
      server: 'mcp-god-mode'
    },
    error: result.error,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/mcp/god-mode/stop
 * Stop the MCP-God-Mode server
 */
router.post('/god-mode/stop', asyncHandler(async (req, res) => {
  const godModeService = getMcpGodModeService();
  const result = await godModeService.stop();

  res.json({
    success: result.success,
    message: result.message,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/mcp/god-mode/categories
 * Get MCP-God-Mode tool categories
 */
router.get('/god-mode/categories', asyncHandler(async (req, res) => {
  const godModeService = getMcpGodModeService();
  const categories = godModeService.getToolCategories();

  res.json({
    success: true,
    data: {
      categories: categories,
      total: categories.length,
      server: 'mcp-god-mode'
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/mcp/god-mode/execute
 * Execute a tool via MCP-God-Mode
 */
router.post('/god-mode/execute', asyncHandler(async (req, res) => {
  const godModeService = getMcpGodModeService();
  const { toolName, parameters } = req.body;

  if (!toolName) {
    return res.status(400).json({
      success: false,
      message: 'Tool name is required',
      timestamp: new Date().toISOString()
    });
  }

  const result = await godModeService.executeTool(toolName, parameters);

  res.json({
    success: result.success,
    data: result,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/mcp/categories
 * Get tool categories with counts
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const service = getMcpService();
  const categorizedTools = service.getToolsByCategory();

  const categories = Object.keys(categorizedTools).map(categoryId => ({
    id: categoryId,
    name: categoryId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: categorizedTools[categoryId].length,
    tools: categorizedTools[categoryId].map(tool => ({
      id: tool.id,
      name: tool.name,
      server: tool.serverId,
      risk_level: tool.riskLevel
    }))
  }));

  res.json({
    success: true,
    data: {
      categories: categories,
      total_categories: categories.length,
      total_tools: service.tools.size
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * WebSocket endpoint setup helper
 */
export const setupMcpWebSocket = (wss) => {
  const service = getMcpService();

  // Forward MCP events to WebSocket clients
  service.on('server-discovered', (serverId, config) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'server-discovered',
          data: { serverId, config },
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  service.on('tools-discovered', (serverId, toolCount) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'tools-discovered',
          data: { serverId, toolCount },
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  service.on('tool-execution-started', (execution) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'tool-execution-started',
          data: execution,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  service.on('tool-execution-progress', (execution) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'tool-execution-progress',
          data: execution,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  service.on('tool-execution-completed', (execution) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'tool-execution-completed',
          data: execution,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  service.on('health-check-completed', (status) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'health-check-completed',
          data: status,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  console.log('🔌 MCP WebSocket events configured');
};

export default router;