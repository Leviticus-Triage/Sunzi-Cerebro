/**
 * MCP Database Server - Provides database access to Claude Code agents
 * Interfaces with the production SQLite database for secure agent queries
 * Enhanced by Moses Team - Enterprise Database MCP Integration
 * Version: v3.2.0 Production
 */

import { EventEmitter } from 'events';
import { Op } from 'sequelize';
import { DatabaseServiceProduction } from './databaseService.js';
import { mcpOptimizer } from './mcpPerformanceOptimizer.js';

export class McpDatabaseServer extends EventEmitter {
  constructor() {
    super();
    this.databaseService = null;
    this.isRunning = false;
    this.tools = [
      {
        name: 'query_users',
        description: 'Query user data with filters and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              properties: {
                organization_id: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' }
              }
            },
            limit: { type: 'number', default: 10 },
            offset: { type: 'number', default: 0 }
          }
        }
      },
      {
        name: 'query_organizations',
        description: 'Query organization data with filters',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              properties: {
                tier: { type: 'string' },
                status: { type: 'string' }
              }
            },
            limit: { type: 'number', default: 10 }
          }
        }
      },
      {
        name: 'query_tool_executions',
        description: 'Query tool execution history',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                organization_id: { type: 'string' },
                tool_name: { type: 'string' },
                status: { type: 'string' },
                date_from: { type: 'string' },
                date_to: { type: 'string' }
              }
            },
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 }
          }
        }
      },
      {
        name: 'query_audit_logs',
        description: 'Query system audit logs for security analysis',
        inputSchema: {
          type: 'object',
          properties: {
            filters: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                organization_id: { type: 'string' },
                action: { type: 'string' },
                severity: { type: 'string' },
                date_from: { type: 'string' },
                date_to: { type: 'string' }
              }
            },
            limit: { type: 'number', default: 100 },
            offset: { type: 'number', default: 0 }
          }
        }
      },
      {
        name: 'get_database_stats',
        description: 'Get database statistics and health metrics',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_user_activity',
        description: 'Get user activity summary for a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', required: true },
            days: { type: 'number', default: 30 }
          },
          required: ['user_id']
        }
      }
    ];
  }

  async initialize(databaseService) {
    try {
      console.log('🗄️ Initializing MCP Database Server...');

      this.databaseService = databaseService;

      // Verify database connection
      if (!this.databaseService || !this.databaseService.sequelize) {
        throw new Error('Database service not available');
      }

      this.isRunning = true;
      console.log('✅ MCP Database Server initialized successfully');

      this.emit('server_ready', {
        server: 'database',
        tools: this.tools.length,
        status: 'active'
      });

      return true;
    } catch (error) {
      console.error('❌ MCP Database Server initialization failed:', error.message);
      this.isRunning = false;
      this.emit('server_error', { error: error.message });
      return false;
    }
  }

  getServerInfo() {
    return {
      name: 'database',
      description: 'SQLite Database Access for Claude Code Agents',
      version: '1.0.0',
      type: 'database',
      status: this.isRunning ? 'active' : 'inactive',
      tools: this.tools.length,
      capabilities: [
        'user_queries',
        'organization_queries',
        'audit_log_access',
        'tool_execution_history',
        'database_analytics'
      ]
    };
  }

  getTools() {
    return this.tools;
  }

  async executeTool(toolName, parameters = {}) {
    try {
      if (!this.isRunning) {
        throw new Error('MCP Database Server is not running');
      }

      console.log(`🔧 Executing database tool: ${toolName}`, parameters);

      // Use performance optimizer for optimized query execution
      return await mcpOptimizer.optimizedQuery(toolName, parameters, async () => {
        return await this._executeToolInternal(toolName, parameters);
      });
    } catch (error) {
      console.error(`❌ Tool execution failed: ${toolName}`, error);
      throw error;
    }
  }

  async _executeToolInternal(toolName, parameters = {}) {
    try {

      switch (toolName) {
        case 'query_users':
          return await this.queryUsers(parameters);

        case 'query_organizations':
          return await this.queryOrganizations(parameters);

        case 'query_tool_executions':
          return await this.queryToolExecutions(parameters);

        case 'query_audit_logs':
          return await this.queryAuditLogs(parameters);

        case 'get_database_stats':
          return await this.getDatabaseStats();

        case 'get_user_activity':
          return await this.getUserActivity(parameters);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`❌ Database tool execution failed (${toolName}):`, error.message);
      throw error;
    }
  }

  async queryUsers(parameters) {
    const { filters = {}, limit = 10, offset = 0 } = parameters;

    const whereClause = {};
    if (filters.organization_id) whereClause.organization_id = filters.organization_id;
    if (filters.role) whereClause.role = filters.role;
    if (filters.status) whereClause.status = filters.status;

    const users = await this.databaseService.models.User.findAll({
      where: whereClause,
      include: [{
        model: this.databaseService.models.Organization,
        attributes: ['id', 'name', 'tier']
      }],
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: users,
      metadata: {
        count: users.length,
        limit,
        offset,
        filters
      }
    };
  }

  async queryOrganizations(parameters) {
    const { filters = {}, limit = 10 } = parameters;

    const whereClause = {};
    if (filters.tier) whereClause.tier = filters.tier;
    if (filters.status) whereClause.status = filters.status;

    const organizations = await this.databaseService.models.Organization.findAll({
      where: whereClause,
      limit,
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: organizations,
      metadata: {
        count: organizations.length,
        limit,
        filters
      }
    };
  }

  async queryToolExecutions(parameters) {
    const { filters = {}, limit = 50, offset = 0 } = parameters;

    const whereClause = {};
    if (filters.user_id) whereClause.user_id = filters.user_id;
    if (filters.organization_id) whereClause.organization_id = filters.organization_id;
    if (filters.tool_name) whereClause.tool_name = filters.tool_name;
    if (filters.status) whereClause.status = filters.status;

    if (filters.date_from || filters.date_to) {
      whereClause.created_at = {};
      if (filters.date_from) whereClause.created_at[Op.gte] = new Date(filters.date_from);
      if (filters.date_to) whereClause.created_at[Op.lte] = new Date(filters.date_to);
    }

    const executions = await this.databaseService.models.ToolExecution.findAll({
      where: whereClause,
      include: [{
        model: this.databaseService.models.User,
        attributes: ['username', 'role']
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: executions,
      metadata: {
        count: executions.length,
        limit,
        offset,
        filters
      }
    };
  }

  async queryAuditLogs(parameters) {
    const { filters = {}, limit = 100, offset = 0 } = parameters;

    const whereClause = {};
    if (filters.user_id) whereClause.user_id = filters.user_id;
    if (filters.organization_id) whereClause.organization_id = filters.organization_id;
    if (filters.action) whereClause.action = filters.action;
    if (filters.severity) whereClause.severity = filters.severity;

    if (filters.date_from || filters.date_to) {
      whereClause.created_at = {};
      if (filters.date_from) whereClause.created_at[Op.gte] = new Date(filters.date_from);
      if (filters.date_to) whereClause.created_at[Op.lte] = new Date(filters.date_to);
    }

    const logs = await this.databaseService.models.AuditLog.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: logs,
      metadata: {
        count: logs.length,
        limit,
        offset,
        filters
      }
    };
  }

  async getDatabaseStats() {
    const stats = await this.databaseService.getHealthMetrics();

    // Get table counts
    const counts = {
      organizations: await this.databaseService.models.Organization.count(),
      users: await this.databaseService.models.User.count(),
      sessions: await this.databaseService.models.Session.count({ where: { is_active: true } }),
      tool_executions: await this.databaseService.models.ToolExecution.count(),
      audit_logs: await this.databaseService.models.AuditLog.count(),
      security_policies: await this.databaseService.models.SecurityPolicy.count()
    };

    return {
      success: true,
      data: {
        health: stats,
        record_counts: counts,
        timestamp: new Date().toISOString()
      }
    };
  }

  async getUserActivity(parameters) {
    const { user_id, days = 30 } = parameters;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user info
    const user = await this.databaseService.models.User.findByPk(user_id, {
      include: [{
        model: this.databaseService.models.Organization,
        attributes: ['name', 'tier']
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get activity data
    const [toolExecutions, auditLogs, sessions] = await Promise.all([
      this.databaseService.models.ToolExecution.count({
        where: {
          user_id,
          created_at: { [Op.gte]: startDate }
        }
      }),
      this.databaseService.models.AuditLog.count({
        where: {
          user_id,
          created_at: { [Op.gte]: startDate }
        }
      }),
      this.databaseService.models.Session.count({
        where: {
          user_id,
          created_at: { [Op.gte]: startDate }
        }
      })
    ]);

    return {
      success: true,
      data: {
        user: user,
        period_days: days,
        activity: {
          tool_executions: toolExecutions,
          audit_events: auditLogs,
          login_sessions: sessions,
          last_login: user.last_login
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  async shutdown() {
    console.log('🔄 Shutting down MCP Database Server...');
    this.isRunning = false;
    this.emit('server_shutdown', { server: 'database' });
    console.log('✅ MCP Database Server shut down successfully');
  }
}

export default McpDatabaseServer;