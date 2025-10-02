/**
 * Tenant Model - Multi-Tenant Enterprise Architecture
 * Core tenant management for Sunzi Cerebro Enterprise
 */

export default (sequelize, DataTypes) => {
  const Tenant = sequelize.define('tenant', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        is: /^[a-z0-9-]+$/,
      }
    },
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    logo_url: {
      type: DataTypes.STRING(500),
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'trial'),
      defaultValue: 'trial',
    },
    subscription_tier: {
      type: DataTypes.ENUM('starter', 'professional', 'enterprise'),
      defaultValue: 'starter',
    },
    subscription_valid_until: {
      type: DataTypes.DATE,
    },
    max_users: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    max_tool_executions_monthly: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
    },
    max_storage_gb: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    current_storage_mb: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        features: {
          advanced_analytics: false,
          custom_integrations: false,
          sso_enabled: false,
          api_access: false,
        },
        security: {
          session_timeout: 3600,
          password_policy: 'standard',
          two_factor_required: false,
        },
        notifications: {
          email_enabled: true,
          webhook_url: null,
        }
      }
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
      { fields: ['domain'] },
      { fields: ['status'] },
      { fields: ['subscription_tier'] },
      { fields: ['created_at'] }
    ]
  });

  // Associations
  Tenant.associate = (models) => {
    // Tenant has many Organizations
    Tenant.hasMany(models.organization, {
      foreignKey: 'tenant_id',
      as: 'organizations',
      onDelete: 'CASCADE'
    });

    // Tenant has many Users
    Tenant.hasMany(models.user, {
      foreignKey: 'tenant_id',
      as: 'users',
      onDelete: 'CASCADE'
    });

    // Tenant has many Tool Executions
    Tenant.hasMany(models.tool_execution, {
      foreignKey: 'tenant_id',
      as: 'tool_executions',
      onDelete: 'CASCADE'
    });

    // Tenant has many Sessions
    Tenant.hasMany(models.session, {
      foreignKey: 'tenant_id',
      as: 'sessions',
      onDelete: 'CASCADE'
    });
  };

  // Instance Methods
  Tenant.prototype.canExecuteTools = function() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check subscription validity
    if (this.subscription_valid_until && new Date(this.subscription_valid_until) < now) {
      return false;
    }

    // Check status
    if (this.status !== 'active' && this.status !== 'trial') {
      return false;
    }

    return true;
  };

  Tenant.prototype.getRemainingToolExecutions = async function() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const executionsThisMonth = await sequelize.models.tool_execution.count({
      where: {
        tenant_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startOfMonth
        }
      }
    });

    return Math.max(0, this.max_tool_executions_monthly - executionsThisMonth);
  };

  Tenant.prototype.isStorageExceeded = function() {
    return this.current_storage_mb > (this.max_storage_gb * 1024);
  };

  // Class Methods
  Tenant.findByDomain = function(domain) {
    return this.findOne({
      where: { domain: domain.toLowerCase() }
    });
  };

  return Tenant;
};