/**
 * User Model - Enterprise Authentication & RBAC
 * User management with role-based access control
 */

import bcrypt from 'bcryptjs';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
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
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organization',
        key: 'id'
      }
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100],
        is: /^[a-zA-Z0-9._-]+$/,
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    display_name: {
      type: DataTypes.STRING(200),
    },
    avatar_url: {
      type: DataTypes.STRING(500),
    },
    role: {
      type: DataTypes.ENUM('viewer', 'analyst', 'pentester', 'admin', 'super_admin'),
      defaultValue: 'viewer',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_activation'),
      defaultValue: 'pending_activation',
    },
    last_login: {
      type: DataTypes.DATE,
    },
    last_login_ip: {
      type: DataTypes.INET,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    locked_until: {
      type: DataTypes.DATE,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
    },
    backup_codes: {
      type: DataTypes.JSONB,
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {
        dashboard: ['read'],
        tools: ['read'],
        reports: ['read'],
        analytics: [],
        admin: []
      }
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          tool_completion: true,
          security_alerts: true
        }
      }
    },
    api_key: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    api_key_expires: {
      type: DataTypes.DATE,
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
      { fields: ['organization_id'] },
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['status'] },
      { fields: ['api_key'] }
    ],
    hooks: {
      beforeCreate: async (user, options) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
        user.display_name = user.display_name || `${user.first_name} ${user.last_name}`;
      },
      beforeUpdate: async (user, options) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
          user.password_changed_at = new Date();
        }
        if (user.changed('first_name') || user.changed('last_name')) {
          user.display_name = `${user.first_name} ${user.last_name}`;
        }
      }
    }
  });

  // Associations
  User.associate = (models) => {
    // User belongs to Tenant
    User.belongsTo(models.tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });

    // User belongs to Organization
    User.belongsTo(models.organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    // User has many Sessions
    User.hasMany(models.session, {
      foreignKey: 'user_id',
      as: 'sessions',
      onDelete: 'CASCADE'
    });

    // User has many Tool Executions
    User.hasMany(models.tool_execution, {
      foreignKey: 'user_id',
      as: 'tool_executions',
      onDelete: 'CASCADE'
    });
  };

  // Instance Methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.isLocked = function() {
    return this.locked_until && new Date() < this.locked_until;
  };

  User.prototype.hasPermission = function(resource, action) {
    const userPermissions = this.permissions[resource] || [];
    return userPermissions.includes(action) || userPermissions.includes('*');
  };

  User.prototype.hasRole = function(requiredRoles) {
    if (typeof requiredRoles === 'string') {
      return this.role === requiredRoles;
    }
    return requiredRoles.includes(this.role);
  };

  User.prototype.canExecuteTools = function() {
    if (this.status !== 'active') return false;
    if (this.isLocked()) return false;
    return this.hasPermission('tools', 'execute') ||
           this.hasRole(['analyst', 'pentester', 'admin', 'super_admin']);
  };

  User.prototype.generateApiKey = function() {
    const crypto = require('crypto');
    this.api_key = 'sk_' + crypto.randomBytes(32).toString('hex');
    this.api_key_expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  };

  User.prototype.toSafeJSON = function() {
    const userData = this.toJSON();
    delete userData.password_hash;
    delete userData.two_factor_secret;
    delete userData.backup_codes;
    delete userData.api_key;
    return userData;
  };

  // Class Methods
  User.findByEmailOrUsername = function(identifier) {
    return this.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: identifier },
          { username: identifier }
        ]
      },
      include: [
        { model: sequelize.models.tenant, as: 'tenant' },
        { model: sequelize.models.organization, as: 'organization' }
      ]
    });
  };

  User.findByApiKey = function(apiKey) {
    return this.findOne({
      where: {
        api_key: apiKey,
        api_key_expires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      include: [
        { model: sequelize.models.tenant, as: 'tenant' }
      ]
    });
  };

  // Define role permissions
  User.ROLE_PERMISSIONS = {
    viewer: {
      dashboard: ['read'],
      tools: ['read'],
      reports: ['read'],
      analytics: [],
      admin: []
    },
    analyst: {
      dashboard: ['read'],
      tools: ['read', 'execute'],
      reports: ['read', 'create'],
      analytics: ['read'],
      admin: []
    },
    pentester: {
      dashboard: ['read'],
      tools: ['read', 'execute', 'configure'],
      reports: ['read', 'create', 'update'],
      analytics: ['read'],
      admin: []
    },
    admin: {
      dashboard: ['read', 'configure'],
      tools: ['*'],
      reports: ['*'],
      analytics: ['*'],
      admin: ['read', 'update']
    },
    super_admin: {
      dashboard: ['*'],
      tools: ['*'],
      reports: ['*'],
      analytics: ['*'],
      admin: ['*']
    }
  };

  return User;
};