/**
 * Organization Model - Enterprise Hierarchical Structure
 * Multi-level organization management within tenants
 */

export default (sequelize, DataTypes) => {
  const Organization = sequelize.define('organization', {
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
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organization',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.ENUM('department', 'team', 'unit', 'division'),
      defaultValue: 'department',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    path: {
      type: DataTypes.STRING(1000),
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        permissions: {
          inherit_from_parent: true,
          custom_permissions: {}
        },
        quotas: {
          tool_executions_monthly: null,
          storage_limit_gb: null,
          users_limit: null
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
      { fields: ['tenant_id'] },
      { fields: ['parent_id'] },
      { fields: ['code'] },
      { fields: ['level'] },
      { fields: ['status'] },
      { unique: true, fields: ['tenant_id', 'code'] }
    ],
    hooks: {
      beforeCreate: async (organization, options) => {
        if (organization.parent_id) {
          const parent = await Organization.findByPk(organization.parent_id);
          if (parent) {
            organization.level = parent.level + 1;
            organization.path = parent.path ? `${parent.path}/${organization.code}` : organization.code;
          }
        } else {
          organization.level = 0;
          organization.path = organization.code;
        }
      },
      beforeUpdate: async (organization, options) => {
        if (organization.changed('parent_id') || organization.changed('code')) {
          if (organization.parent_id) {
            const parent = await Organization.findByPk(organization.parent_id);
            if (parent) {
              organization.level = parent.level + 1;
              organization.path = parent.path ? `${parent.path}/${organization.code}` : organization.code;
            }
          } else {
            organization.level = 0;
            organization.path = organization.code;
          }

          // Update all children paths
          await Organization.updateChildrenPaths(organization);
        }
      }
    }
  });

  // Associations
  Organization.associate = (models) => {
    // Organization belongs to Tenant
    Organization.belongsTo(models.tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant'
    });

    // Self-referencing: Organization has parent and children
    Organization.belongsTo(Organization, {
      foreignKey: 'parent_id',
      as: 'parent'
    });

    Organization.hasMany(Organization, {
      foreignKey: 'parent_id',
      as: 'children',
      onDelete: 'CASCADE'
    });

    // Organization has many Users
    Organization.hasMany(models.user, {
      foreignKey: 'organization_id',
      as: 'users',
      onDelete: 'SET NULL'
    });
  };

  // Instance Methods
  Organization.prototype.getAncestors = async function() {
    const ancestors = [];
    let current = this;

    while (current.parent_id) {
      current = await Organization.findByPk(current.parent_id);
      if (current) {
        ancestors.unshift(current);
      } else {
        break;
      }
    }

    return ancestors;
  };

  Organization.prototype.getDescendants = async function() {
    return await Organization.findAll({
      where: {
        tenant_id: this.tenant_id,
        path: {
          [sequelize.Sequelize.Op.like]: `${this.path}/%`
        }
      },
      order: [['level', 'ASC'], ['code', 'ASC']]
    });
  };

  Organization.prototype.getDirectChildren = async function() {
    return await Organization.findAll({
      where: {
        parent_id: this.id
      },
      order: [['code', 'ASC']]
    });
  };

  Organization.prototype.getUserCount = async function() {
    return await sequelize.models.user.count({
      where: {
        organization_id: this.id,
        status: 'active'
      }
    });
  };

  Organization.prototype.getToolExecutionsThisMonth = async function() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return await sequelize.models.tool_execution.count({
      include: [{
        model: sequelize.models.user,
        as: 'user',
        where: {
          organization_id: this.id
        }
      }],
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startOfMonth
        }
      }
    });
  };

  // Class Methods
  Organization.findByTenantAndCode = function(tenantId, code) {
    return this.findOne({
      where: {
        tenant_id: tenantId,
        code: code
      }
    });
  };

  Organization.getHierarchy = async function(tenantId) {
    const rootOrgs = await this.findAll({
      where: {
        tenant_id: tenantId,
        parent_id: null
      },
      include: [{
        model: this,
        as: 'children',
        hierarchy: true
      }],
      order: [['code', 'ASC']]
    });

    return rootOrgs;
  };

  Organization.updateChildrenPaths = async function(organization) {
    const children = await this.findAll({
      where: {
        parent_id: organization.id
      }
    });

    for (const child of children) {
      child.path = `${organization.path}/${child.code}`;
      child.level = organization.level + 1;
      await child.save();

      // Recursively update children's children
      await this.updateChildrenPaths(child);
    }
  };

  Organization.getStats = async function(tenantId) {
    const [totalCount, activeCount, byType, byLevel] = await Promise.all([
      this.count({ where: { tenant_id: tenantId } }),
      this.count({ where: { tenant_id: tenantId, status: 'active' } }),
      this.findAll({
        where: { tenant_id: tenantId },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      }),
      this.findAll({
        where: { tenant_id: tenantId },
        attributes: [
          'level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['level'],
        order: [['level', 'ASC']]
      })
    ]);

    return {
      total: totalCount,
      active: activeCount,
      by_type: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.get('count'));
        return acc;
      }, {}),
      by_level: byLevel.reduce((acc, item) => {
        acc[item.level] = parseInt(item.get('count'));
        return acc;
      }, {})
    };
  };

  return Organization;
};