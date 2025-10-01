/**
 * Production Database Service - PostgreSQL Enterprise Integration
 * Comprehensive multi-tenant database operations for Sunzi Cerebro
 * Enhanced by Moses Team - Ultrathinking Backend Architecture
 * Version: v3.2.0 Production Enterprise
 */

import { Sequelize, DataTypes } from 'sequelize';
import { EventEmitter } from 'events';
import databaseConfig from '../config/database.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class DatabaseServiceProduction extends EventEmitter {
  constructor() {
    super();
    this.sequelize = null;
    this.models = {};
    this.connectionPool = null;
    this.healthMetrics = {
      connections: 0,
      queries: 0,
      avgResponseTime: 0,
      errors: 0,
      uptime: Date.now()
    };

    console.log('🗄️ Database Service Production initialized');
    this.initializeDatabase();
  }

  /**
   * Initialize PostgreSQL connection with production settings
   */
  async initializeDatabase() {
    const env = process.env.NODE_ENV || 'development';
    const config = databaseConfig.config[env];

    try {
      this.sequelize = new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging,
        benchmark: true,
        pool: config.pool,
        define: config.define,
        timezone: '+00:00',
        dialectOptions: {
          ...config.dialectOptions,
          useUTC: true,
          dateStrings: true,
          typeCast: true
        },
        hooks: {
          beforeConnect: () => {
            this.healthMetrics.connections++;
          },
          beforeQuery: () => {
            this.healthMetrics.queries++;
          }
        }
      });

      // Test connection
      await this.sequelize.authenticate();
      console.log('✅ PostgreSQL connection established successfully');

      // Initialize models
      await this.initializeModels();

      // Sync database schema
      if (env === 'development') {
        await this.sequelize.sync({ alter: true });
        console.log('✅ Database schema synchronized');
      }

      this.emit('database_ready', { status: 'connected', timestamp: new Date() });

    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      this.emit('database_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize production database models
   */
  async initializeModels() {
    // Organizations (Multi-Tenant)
    this.models.Organization = this.sequelize.define('Organization', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      tier: {
        type: DataTypes.ENUM('free', 'professional', 'enterprise'),
        defaultValue: 'free'
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      limits: {
        type: DataTypes.JSONB,
        defaultValue: {
          users: 10,
          tools: 50,
          storage: '1GB',
          api_calls: 1000
        }
      },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'deleted'),
        defaultValue: 'active'
      }
    });

    // Users with RBAC
    this.models.User = this.sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('viewer', 'analyst', 'pentester', 'admin', 'super_admin'),
        defaultValue: 'analyst'
      },
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: []
      },
      profile: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      last_login: {
        type: DataTypes.DATE
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      organization_id: {
        type: DataTypes.UUID,
        references: {
          model: 'Organization',
          key: 'id'
        }
      }
    });

    // User Sessions
    this.models.Session = this.sequelize.define('Session', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      session_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      ip_address: DataTypes.INET,
      user_agent: DataTypes.TEXT,
      expires_at: DataTypes.DATE,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    });

    // MCP Server Registry
    this.models.McpServer = this.sequelize.define('McpServer', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('http_api', 'stdio'),
        allowNull: false
      },
      configuration: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
        defaultValue: 'inactive'
      },
      health_metrics: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      tool_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      last_health_check: DataTypes.DATE
    });

    // Tool Execution Logs
    this.models.ToolExecution = this.sequelize.define('ToolExecution', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      organization_id: {
        type: DataTypes.UUID,
        references: {
          model: 'Organization',
          key: 'id'
        }
      },
      mcp_server_id: {
        type: DataTypes.UUID,
        references: {
          model: 'McpServer',
          key: 'id'
        }
      },
      tool_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      parameters: DataTypes.JSONB,
      result: DataTypes.JSONB,
      execution_time: DataTypes.INTEGER, // milliseconds
      status: {
        type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
        defaultValue: 'pending'
      },
      error_message: DataTypes.TEXT,
      risk_level: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      }
    });

    // Audit Logs
    this.models.AuditLog = this.sequelize.define('AuditLog', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      organization_id: {
        type: DataTypes.UUID,
        references: {
          model: 'Organization',
          key: 'id'
        }
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      resource_type: DataTypes.STRING,
      resource_id: DataTypes.UUID,
      details: DataTypes.JSONB,
      ip_address: DataTypes.INET,
      user_agent: DataTypes.TEXT,
      severity: {
        type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
        defaultValue: 'info'
      }
    });

    // Security Policies
    this.models.SecurityPolicy = this.sequelize.define('SecurityPolicy', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: DataTypes.UUID,
        references: {
          model: 'Organization',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      policy_type: {
        type: DataTypes.ENUM('access_control', 'tool_restrictions', 'data_retention'),
        allowNull: false
      },
      rules: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    });

    // Set up associations
    this.setupAssociations();

    console.log('✅ Database models initialized successfully');
  }

  /**
   * Set up model associations
   */
  setupAssociations() {
    const { Organization, User, Session, McpServer, ToolExecution, AuditLog, SecurityPolicy } = this.models;

    // Organization relationships
    Organization.hasMany(User, { foreignKey: 'organization_id' });
    Organization.hasMany(ToolExecution, { foreignKey: 'organization_id' });
    Organization.hasMany(AuditLog, { foreignKey: 'organization_id' });
    Organization.hasMany(SecurityPolicy, { foreignKey: 'organization_id' });

    // User relationships
    User.belongsTo(Organization, { foreignKey: 'organization_id' });
    User.hasMany(Session, { foreignKey: 'user_id' });
    User.hasMany(ToolExecution, { foreignKey: 'user_id' });
    User.hasMany(AuditLog, { foreignKey: 'user_id' });

    // Session relationships
    Session.belongsTo(User, { foreignKey: 'user_id' });

    // Tool execution relationships
    ToolExecution.belongsTo(User, { foreignKey: 'user_id' });
    ToolExecution.belongsTo(Organization, { foreignKey: 'organization_id' });
    ToolExecution.belongsTo(McpServer, { foreignKey: 'mcp_server_id' });

    // MCP Server relationships
    McpServer.hasMany(ToolExecution, { foreignKey: 'mcp_server_id' });

    // Audit log relationships
    AuditLog.belongsTo(User, { foreignKey: 'user_id' });
    AuditLog.belongsTo(Organization, { foreignKey: 'organization_id' });

    // Security policy relationships
    SecurityPolicy.belongsTo(Organization, { foreignKey: 'organization_id' });
  }

  /**
   * Create new organization with default settings
   */
  async createOrganization(data) {
    try {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const organization = await this.models.Organization.create({
        name: data.name,
        slug,
        tier: data.tier || 'free',
        settings: data.settings || {},
        limits: data.limits || {
          users: 10,
          tools: 50,
          storage: '1GB',
          api_calls: 1000
        }
      });

      await this.logAudit({
        action: 'organization_created',
        resource_type: 'Organization',
        resource_id: organization.id,
        details: { name: organization.name, tier: organization.tier },
        severity: 'info'
      });

      return organization;
    } catch (error) {
      this.healthMetrics.errors++;
      throw error;
    }
  }

  /**
   * Create new user with password hashing
   */
  async createUser(data) {
    try {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(data.password, saltRounds);

      const user = await this.models.User.create({
        username: data.username,
        email: data.email,
        password_hash,
        role: data.role || 'analyst',
        permissions: data.permissions || [],
        profile: data.profile || {},
        organization_id: data.organization_id
      });

      await this.logAudit({
        user_id: user.id,
        organization_id: user.organization_id,
        action: 'user_created',
        resource_type: 'User',
        resource_id: user.id,
        details: { username: user.username, role: user.role },
        severity: 'info'
      });

      // Remove password_hash from response
      const userResponse = user.toJSON();
      delete userResponse.password_hash;

      return userResponse;
    } catch (error) {
      this.healthMetrics.errors++;
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(username, password, ipAddress, userAgent) {
    try {
      const user = await this.models.User.findOne({
        where: { username, status: 'active' },
        include: [{ model: this.models.Organization }]
      });

      if (!user) {
        await this.logAudit({
          action: 'login_failed',
          details: { username, reason: 'user_not_found' },
          ip_address: ipAddress,
          user_agent: userAgent,
          severity: 'warning'
        });
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await this.logAudit({
          user_id: user.id,
          organization_id: user.organization_id,
          action: 'login_failed',
          details: { username, reason: 'invalid_password' },
          ip_address: ipAddress,
          user_agent: userAgent,
          severity: 'warning'
        });
        return null;
      }

      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent);

      // Update last login
      await user.update({ last_login: new Date() });

      await this.logAudit({
        user_id: user.id,
        organization_id: user.organization_id,
        action: 'login_successful',
        details: { username },
        ip_address: ipAddress,
        user_agent: userAgent,
        severity: 'info'
      });

      const userResponse = user.toJSON();
      delete userResponse.password_hash;

      return { user: userResponse, session };
    } catch (error) {
      this.healthMetrics.errors++;
      throw error;
    }
  }

  /**
   * Create user session
   */
  async createSession(userId, ipAddress, userAgent) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await this.models.Session.create({
      session_token: sessionToken,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt
    });

    return session;
  }

  /**
   * Register MCP server in database
   */
  async registerMcpServer(serverData) {
    try {
      const server = await this.models.McpServer.create({
        name: serverData.name,
        type: serverData.type,
        configuration: serverData.configuration,
        status: 'active',
        tool_count: serverData.toolCount || 0,
        health_metrics: serverData.healthMetrics || {},
        last_health_check: new Date()
      });

      console.log(`✅ MCP Server registered: ${server.name} (${server.tool_count} tools)`);
      return server;
    } catch (error) {
      this.healthMetrics.errors++;
      console.error(`❌ Failed to register MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log tool execution
   */
  async logToolExecution(executionData) {
    try {
      const execution = await this.models.ToolExecution.create({
        user_id: executionData.userId,
        organization_id: executionData.organizationId,
        mcp_server_id: executionData.mcpServerId,
        tool_name: executionData.toolName,
        parameters: executionData.parameters,
        result: executionData.result,
        execution_time: executionData.executionTime,
        status: executionData.status || 'completed',
        error_message: executionData.errorMessage,
        risk_level: executionData.riskLevel || 'medium'
      });

      // Log audit entry
      await this.logAudit({
        user_id: executionData.userId,
        organization_id: executionData.organizationId,
        action: 'tool_execution',
        resource_type: 'ToolExecution',
        resource_id: execution.id,
        details: {
          tool_name: executionData.toolName,
          status: execution.status,
          risk_level: execution.risk_level
        },
        severity: execution.status === 'failed' ? 'error' : 'info'
      });

      return execution;
    } catch (error) {
      this.healthMetrics.errors++;
      throw error;
    }
  }

  /**
   * Log audit entry
   */
  async logAudit(auditData) {
    try {
      return await this.models.AuditLog.create({
        user_id: auditData.user_id,
        organization_id: auditData.organization_id,
        action: auditData.action,
        resource_type: auditData.resource_type,
        resource_id: auditData.resource_id,
        details: auditData.details || {},
        ip_address: auditData.ip_address,
        user_agent: auditData.user_agent,
        severity: auditData.severity || 'info'
      });
    } catch (error) {
      console.error('❌ Failed to log audit entry:', error.message);
    }
  }

  /**
   * Get database health metrics
   */
  async getHealthMetrics() {
    const uptime = Date.now() - this.healthMetrics.uptime;

    return {
      status: 'healthy',
      connection: this.sequelize ? 'connected' : 'disconnected',
      uptime: Math.round(uptime / 1000),
      metrics: this.healthMetrics,
      pool: {
        active: this.sequelize?.connectionManager?.pool?.borrowed || 0,
        idle: this.sequelize?.connectionManager?.pool?.available || 0,
        total: this.sequelize?.connectionManager?.pool?.size || 0
      }
    };
  }

  /**
   * Shutdown database connection
   */
  async shutdown() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('✅ Database connection closed');
    }
  }
}

export default DatabaseServiceProduction;