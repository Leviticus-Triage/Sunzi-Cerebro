/**
 * Tool Execution Model - Security Tool Execution Tracking
 * Comprehensive logging and analytics for all 272+ security tools
 */

export default (sequelize, DataTypes) => {
  const ToolExecution = sequelize.define('tool_execution', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenant',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'session',
        key: 'id'
      }
    },
    tool_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tool_category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tool_server: {
      type: DataTypes.ENUM('hexstrike', 'attackmcp', 'notion', 'godmode'),
      allowNull: false,
    },
    execution_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    command: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'critical'),
      defaultValue: 'normal',
    },
    started_at: {
      type: DataTypes.DATE,
    },
    completed_at: {
      type: DataTypes.DATE,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
    },
    exit_code: {
      type: DataTypes.INTEGER,
    },
    stdout: {
      type: DataTypes.TEXT,
    },
    stderr: {
      type: DataTypes.TEXT,
    },
    output: {
      type: DataTypes.JSONB,
    },
    error_message: {
      type: DataTypes.TEXT,
    },
    resource_usage: {
      type: DataTypes.JSONB,
      defaultValue: {
        cpu_percent: null,
        memory_mb: null,
        disk_io: null,
        network_io: null
      }
    },
    risk_score: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100
      }
    },
    findings: {
      type: DataTypes.JSONB,
      defaultValue: {
        vulnerabilities: [],
        insights: [],
        recommendations: []
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    client_ip: {
      type: DataTypes.INET,
    },
    user_agent: {
      type: DataTypes.STRING(500),
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['user_id'] },
      { fields: ['session_id'] },
      { fields: ['tool_name'] },
      { fields: ['tool_category'] },
      { fields: ['tool_server'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['started_at'] },
      { fields: ['completed_at'] },
      { fields: ['created_at'] },
      { fields: ['risk_score'] },
      { fields: ['tags'], using: 'gin' },
      { unique: true, fields: ['execution_id'] }
    ],
    hooks: {
      beforeUpdate: async (toolExecution, options) => {
        if (toolExecution.changed('status')) {
          const now = new Date();

          if (toolExecution.status === 'running' && !toolExecution.started_at) {
            toolExecution.started_at = now;
          }

          if (['completed', 'failed', 'cancelled', 'timeout'].includes(toolExecution.status)) {
            if (!toolExecution.completed_at) {
              toolExecution.completed_at = now;
            }

            if (toolExecution.started_at) {
              toolExecution.duration_ms = toolExecution.completed_at - toolExecution.started_at;
            }
          }
        }
      }
    }
  });

  // Associations
  ToolExecution.associate = (models) => {
    // ToolExecution belongs to Tenant
    ToolExecution.belongsTo(models.tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });

    // ToolExecution belongs to User
    ToolExecution.belongsTo(models.user, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // ToolExecution belongs to Session
    ToolExecution.belongsTo(models.session, {
      foreignKey: 'session_id',
      as: 'session'
    });
  };

  // Instance Methods
  ToolExecution.prototype.markAsStarted = async function() {
    this.status = 'running';
    this.started_at = new Date();
    return await this.save();
  };

  ToolExecution.prototype.markAsCompleted = async function(output, exitCode = 0) {
    this.status = 'completed';
    this.completed_at = new Date();
    this.exit_code = exitCode;

    if (output) {
      if (typeof output === 'string') {
        this.stdout = output;
      } else {
        this.output = output;
      }
    }

    if (this.started_at) {
      this.duration_ms = this.completed_at - this.started_at;
    }

    return await this.save();
  };

  ToolExecution.prototype.markAsFailed = async function(error, exitCode = 1) {
    this.status = 'failed';
    this.completed_at = new Date();
    this.exit_code = exitCode;
    this.error_message = error.message || error;
    this.stderr = error.stderr || error.stack;

    if (this.started_at) {
      this.duration_ms = this.completed_at - this.started_at;
    }

    return await this.save();
  };

  ToolExecution.prototype.addFinding = async function(finding) {
    if (!this.findings) {
      this.findings = { vulnerabilities: [], insights: [], recommendations: [] };
    }

    const { type, ...data } = finding;

    if (type === 'vulnerability') {
      this.findings.vulnerabilities.push(data);
    } else if (type === 'insight') {
      this.findings.insights.push(data);
    } else if (type === 'recommendation') {
      this.findings.recommendations.push(data);
    }

    return await this.save();
  };

  ToolExecution.prototype.getDurationFormatted = function() {
    if (!this.duration_ms) return 'N/A';

    const seconds = Math.floor(this.duration_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Class Methods
  ToolExecution.findByExecutionId = function(executionId) {
    return this.findOne({
      where: { execution_id: executionId },
      include: [
        { model: sequelize.models.user, as: 'user' },
        { model: sequelize.models.tenant, as: 'tenant' }
      ]
    });
  };

  ToolExecution.getStats = async function(tenantId, period = '30d') {
    const periodMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const days = periodMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseWhere = {
      tenant_id: tenantId,
      created_at: {
        [sequelize.Sequelize.Op.gte]: startDate
      }
    };

    const [
      totalCount,
      completedCount,
      failedCount,
      avgDuration,
      byStatus,
      byTool,
      byCategory,
      byServer
    ] = await Promise.all([
      this.count({ where: baseWhere }),
      this.count({ where: { ...baseWhere, status: 'completed' } }),
      this.count({ where: { ...baseWhere, status: 'failed' } }),
      this.findOne({
        where: { ...baseWhere, status: 'completed', duration_ms: { [sequelize.Sequelize.Op.not]: null } },
        attributes: [[sequelize.fn('AVG', sequelize.col('duration_ms')), 'avg_duration']]
      }),
      this.findAll({
        where: baseWhere,
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status']
      }),
      this.findAll({
        where: baseWhere,
        attributes: ['tool_name', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['tool_name'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      }),
      this.findAll({
        where: baseWhere,
        attributes: ['tool_category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['tool_category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      }),
      this.findAll({
        where: baseWhere,
        attributes: ['tool_server', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['tool_server'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      })
    ]);

    return {
      summary: {
        total: totalCount,
        completed: completedCount,
        failed: failedCount,
        success_rate: totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(2) : 0,
        avg_duration_ms: avgDuration?.get('avg_duration') || 0
      },
      by_status: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.get('count'));
        return acc;
      }, {}),
      top_tools: byTool.map(item => ({
        tool: item.tool_name,
        count: parseInt(item.get('count'))
      })),
      by_category: byCategory.reduce((acc, item) => {
        acc[item.tool_category] = parseInt(item.get('count'));
        return acc;
      }, {}),
      by_server: byServer.reduce((acc, item) => {
        acc[item.tool_server] = parseInt(item.get('count'));
        return acc;
      }, {})
    };
  };

  ToolExecution.getActiveExecutions = function(tenantId) {
    return this.findAll({
      where: {
        tenant_id: tenantId,
        status: ['pending', 'running']
      },
      include: [
        { model: sequelize.models.user, as: 'user', attributes: ['id', 'username', 'display_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  ToolExecution.cleanupOldExecutions = async function(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedCount = await this.destroy({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.lt]: cutoffDate
        },
        status: ['completed', 'failed', 'cancelled']
      }
    });

    return deletedCount;
  };

  return ToolExecution;
};