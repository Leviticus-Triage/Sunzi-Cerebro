/**
 * Session Model - User Session Management
 * Enhanced session tracking with security features
 */

export default (sequelize, DataTypes) => {
  const Session = sequelize.define('session', {
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
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    refresh_token: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('web', 'api', 'mobile', 'desktop'),
      defaultValue: 'web',
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'revoked', 'invalidated'),
      defaultValue: 'active',
    },
    ip_address: {
      type: DataTypes.INET,
    },
    user_agent: {
      type: DataTypes.STRING(1000),
    },
    device_info: {
      type: DataTypes.JSONB,
      defaultValue: {
        browser: null,
        os: null,
        device: null,
        fingerprint: null
      }
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {
        country: null,
        region: null,
        city: null,
        timezone: null
      }
    },
    last_activity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    refresh_expires_at: {
      type: DataTypes.DATE,
    },
    revoked_at: {
      type: DataTypes.DATE,
    },
    revoked_by: {
      type: DataTypes.UUID,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    revoke_reason: {
      type: DataTypes.STRING(255),
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {}
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
      { fields: ['token'] },
      { fields: ['refresh_token'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['last_activity'] },
      { fields: ['expires_at'] },
      { fields: ['ip_address'] }
    ],
    hooks: {
      beforeUpdate: (session, options) => {
        session.last_activity = new Date();
      }
    }
  });

  // Associations
  Session.associate = (models) => {
    // Session belongs to Tenant
    Session.belongsTo(models.tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });

    // Session belongs to User
    Session.belongsTo(models.user, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Session was revoked by User
    Session.belongsTo(models.user, {
      foreignKey: 'revoked_by',
      as: 'revoker'
    });

    // Session has many Tool Executions
    Session.hasMany(models.tool_execution, {
      foreignKey: 'session_id',
      as: 'tool_executions',
      onDelete: 'SET NULL'
    });
  };

  // Instance Methods
  Session.prototype.isActive = function() {
    const now = new Date();
    return (
      this.status === 'active' &&
      this.expires_at > now
    );
  };

  Session.prototype.isExpired = function() {
    return new Date() > this.expires_at;
  };

  Session.prototype.canRefresh = function() {
    const now = new Date();
    return (
      this.refresh_token &&
      this.refresh_expires_at &&
      this.refresh_expires_at > now &&
      this.status === 'active'
    );
  };

  Session.prototype.updateActivity = async function() {
    this.last_activity = new Date();
    return await this.save();
  };

  Session.prototype.revoke = async function(revokedBy = null, reason = null) {
    this.status = 'revoked';
    this.revoked_at = new Date();
    if (revokedBy) this.revoked_by = revokedBy;
    if (reason) this.revoke_reason = reason;
    return await this.save();
  };

  Session.prototype.extend = async function(additionalSeconds = 3600) {
    const newExpiry = new Date(this.expires_at);
    newExpiry.setSeconds(newExpiry.getSeconds() + additionalSeconds);
    this.expires_at = newExpiry;
    return await this.save();
  };

  Session.prototype.refresh = async function(newExpirySeconds = 3600) {
    if (!this.canRefresh()) {
      throw new Error('Session cannot be refreshed');
    }

    // Generate new tokens
    const crypto = require('crypto');
    this.token = crypto.randomBytes(32).toString('hex');
    this.refresh_token = crypto.randomBytes(32).toString('hex');

    // Update expiry times
    this.expires_at = new Date(Date.now() + newExpirySeconds * 1000);
    this.refresh_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return await this.save();
  };

  Session.prototype.toSafeJSON = function() {
    const sessionData = this.toJSON();
    delete sessionData.token;
    delete sessionData.refresh_token;
    return sessionData;
  };

  // Class Methods
  Session.findByToken = function(token) {
    return this.findOne({
      where: { token },
      include: [
        {
          model: sequelize.models.user,
          as: 'user',
          include: [
            { model: sequelize.models.tenant, as: 'tenant' },
            { model: sequelize.models.organization, as: 'organization' }
          ]
        }
      ]
    });
  };

  Session.findActiveByUser = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        status: 'active',
        expires_at: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['last_activity', 'DESC']]
    });
  };

  Session.createSession = async function(user, sessionData = {}) {
    const crypto = require('crypto');

    const defaultExpiry = 8 * 60 * 60; // 8 hours
    const refreshExpiry = 7 * 24 * 60 * 60; // 7 days

    const session = await this.create({
      tenant_id: user.tenant_id,
      user_id: user.id,
      token: crypto.randomBytes(32).toString('hex'),
      refresh_token: crypto.randomBytes(32).toString('hex'),
      type: sessionData.type || 'web',
      ip_address: sessionData.ip_address,
      user_agent: sessionData.user_agent,
      device_info: sessionData.device_info || {},
      location: sessionData.location || {},
      expires_at: new Date(Date.now() + defaultExpiry * 1000),
      refresh_expires_at: new Date(Date.now() + refreshExpiry * 1000),
      permissions: sessionData.permissions || user.permissions,
      metadata: sessionData.metadata || {}
    });

    return session;
  };

  Session.cleanupExpired = async function() {
    const deletedCount = await this.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expires_at: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      }
    );

    return deletedCount[0];
  };

  Session.revokeAllUserSessions = async function(userId, revokedBy = null, reason = null) {
    const [updatedCount] = await this.update(
      {
        status: 'revoked',
        revoked_at: new Date(),
        revoked_by: revokedBy,
        revoke_reason: reason
      },
      {
        where: {
          user_id: userId,
          status: 'active'
        }
      }
    );

    return updatedCount;
  };

  Session.getStats = async function(tenantId, period = '30d') {
    const periodMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = periodMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalSessions,
      activeSessions,
      uniqueUsers,
      byType,
      byStatus,
      avgDuration
    ] = await Promise.all([
      this.count({
        where: {
          tenant_id: tenantId,
          created_at: {
            [sequelize.Sequelize.Op.gte]: startDate
          }
        }
      }),
      this.count({
        where: {
          tenant_id: tenantId,
          status: 'active',
          expires_at: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        }
      }),
      this.count({
        where: {
          tenant_id: tenantId,
          created_at: {
            [sequelize.Sequelize.Op.gte]: startDate
          }
        },
        distinct: true,
        col: 'user_id'
      }),
      this.findAll({
        where: {
          tenant_id: tenantId,
          created_at: {
            [sequelize.Sequelize.Op.gte]: startDate
          }
        },
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['type']
      }),
      this.findAll({
        where: {
          tenant_id: tenantId,
          created_at: {
            [sequelize.Sequelize.Op.gte]: startDate
          }
        },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status']
      }),
      this.findOne({
        where: {
          tenant_id: tenantId,
          created_at: {
            [sequelize.Sequelize.Op.gte]: startDate
          },
          revoked_at: {
            [sequelize.Sequelize.Op.not]: null
          }
        },
        attributes: [
          [
            sequelize.fn('AVG',
              sequelize.literal('EXTRACT(EPOCH FROM (revoked_at - created_at))')
            ),
            'avg_duration_seconds'
          ]
        ]
      })
    ]);

    return {
      summary: {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        unique_users: uniqueUsers,
        avg_duration_hours: avgDuration?.get('avg_duration_seconds')
          ? (avgDuration.get('avg_duration_seconds') / 3600).toFixed(2)
          : 0
      },
      by_type: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.get('count'));
        return acc;
      }, {}),
      by_status: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.get('count'));
        return acc;
      }, {})
    };
  };

  return Session;
};