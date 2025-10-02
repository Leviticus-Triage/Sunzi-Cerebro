/**
 * Core Tables Migration - PostgreSQL Enterprise Schema
 * Creates: tenant, organization, user, session, tool_execution tables
 * Sunzi Cerebro Enterprise v3.2.0
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM types first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tenant_status') THEN
          CREATE TYPE enum_tenant_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tenant_subscription_tier') THEN
          CREATE TYPE enum_tenant_subscription_tier AS ENUM ('starter', 'professional', 'enterprise');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_organization_type') THEN
          CREATE TYPE enum_organization_type AS ENUM ('department', 'team', 'unit', 'division');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_organization_status') THEN
          CREATE TYPE enum_organization_status AS ENUM ('active', 'inactive');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_role') THEN
          CREATE TYPE enum_user_role AS ENUM ('viewer', 'analyst', 'pentester', 'admin', 'super_admin');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_status') THEN
          CREATE TYPE enum_user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_activation');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_session_type') THEN
          CREATE TYPE enum_session_type AS ENUM ('web', 'api', 'mobile', 'desktop');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_session_status') THEN
          CREATE TYPE enum_session_status AS ENUM ('active', 'expired', 'revoked', 'invalidated');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tool_execution_status') THEN
          CREATE TYPE enum_tool_execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tool_execution_priority') THEN
          CREATE TYPE enum_tool_execution_priority AS ENUM ('low', 'normal', 'high', 'critical');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tool_server') THEN
          CREATE TYPE enum_tool_server AS ENUM ('hexstrike', 'attackmcp', 'notion', 'godmode');
        END IF;
      END $$;
    `);

    // Create tenant table
    await queryInterface.createTable('tenant', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      logo_url: {
        type: Sequelize.STRING(500),
      },
      status: {
        type: 'enum_tenant_status',
        defaultValue: 'trial',
      },
      subscription_tier: {
        type: 'enum_tenant_subscription_tier',
        defaultValue: 'starter',
      },
      subscription_valid_until: {
        type: Sequelize.DATE,
      },
      max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
      },
      max_tool_executions_monthly: {
        type: Sequelize.INTEGER,
        defaultValue: 1000,
      },
      max_storage_gb: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      current_storage_mb: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Create organization table
    await queryInterface.createTable('organization', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organization',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      type: {
        type: 'enum_organization_type',
        defaultValue: 'department',
      },
      status: {
        type: 'enum_organization_status',
        defaultValue: 'active',
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      path: {
        type: Sequelize.STRING(1000),
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Create user table
    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organization',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      display_name: {
        type: Sequelize.STRING(200),
      },
      avatar_url: {
        type: Sequelize.STRING(500),
      },
      role: {
        type: 'enum_user_role',
        defaultValue: 'viewer',
      },
      status: {
        type: 'enum_user_status',
        defaultValue: 'pending_activation',
      },
      last_login: {
        type: Sequelize.DATE,
      },
      last_login_ip: {
        type: Sequelize.INET,
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      locked_until: {
        type: Sequelize.DATE,
      },
      password_changed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.STRING(255),
      },
      backup_codes: {
        type: Sequelize.JSONB,
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      api_key: {
        type: Sequelize.STRING(255),
        unique: true,
      },
      api_key_expires: {
        type: Sequelize.DATE,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Create session table
    await queryInterface.createTable('session', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      refresh_token: {
        type: Sequelize.STRING(255),
        unique: true,
      },
      type: {
        type: 'enum_session_type',
        defaultValue: 'web',
      },
      status: {
        type: 'enum_session_status',
        defaultValue: 'active',
      },
      ip_address: {
        type: Sequelize.INET,
      },
      user_agent: {
        type: Sequelize.STRING(1000),
      },
      device_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      last_activity: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      refresh_expires_at: {
        type: Sequelize.DATE,
      },
      revoked_at: {
        type: Sequelize.DATE,
      },
      revoked_by: {
        type: Sequelize.UUID,
        references: {
          model: 'user',
          key: 'id',
        },
      },
      revoke_reason: {
        type: Sequelize.STRING(255),
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Create tool_execution table
    await queryInterface.createTable('tool_execution', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'session',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tool_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      tool_category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      tool_server: {
        type: 'enum_tool_server',
        allowNull: false,
      },
      execution_id: {
        type: Sequelize.STRING(255),
        unique: true,
      },
      command: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      parameters: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      status: {
        type: 'enum_tool_execution_status',
        defaultValue: 'pending',
      },
      priority: {
        type: 'enum_tool_execution_priority',
        defaultValue: 'normal',
      },
      started_at: {
        type: Sequelize.DATE,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      duration_ms: {
        type: Sequelize.INTEGER,
      },
      exit_code: {
        type: Sequelize.INTEGER,
      },
      stdout: {
        type: Sequelize.TEXT,
      },
      stderr: {
        type: Sequelize.TEXT,
      },
      output: {
        type: Sequelize.JSONB,
      },
      error_message: {
        type: Sequelize.TEXT,
      },
      resource_usage: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      risk_score: {
        type: Sequelize.INTEGER,
      },
      findings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      client_ip: {
        type: Sequelize.INET,
      },
      user_agent: {
        type: Sequelize.STRING(500),
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Create indexes
    await Promise.all([
      // Tenant indexes
      queryInterface.addIndex('tenant', ['domain']),
      queryInterface.addIndex('tenant', ['status']),
      queryInterface.addIndex('tenant', ['subscription_tier']),
      queryInterface.addIndex('tenant', ['created_at']),

      // Organization indexes
      queryInterface.addIndex('organization', ['tenant_id']),
      queryInterface.addIndex('organization', ['parent_id']),
      queryInterface.addIndex('organization', ['code']),
      queryInterface.addIndex('organization', ['level']),
      queryInterface.addIndex('organization', ['status']),
      queryInterface.addIndex('organization', ['tenant_id', 'code'], { unique: true }),

      // User indexes
      queryInterface.addIndex('user', ['tenant_id']),
      queryInterface.addIndex('user', ['organization_id']),
      queryInterface.addIndex('user', ['username']),
      queryInterface.addIndex('user', ['email']),
      queryInterface.addIndex('user', ['role']),
      queryInterface.addIndex('user', ['status']),
      queryInterface.addIndex('user', ['api_key']),

      // Session indexes
      queryInterface.addIndex('session', ['tenant_id']),
      queryInterface.addIndex('session', ['user_id']),
      queryInterface.addIndex('session', ['token']),
      queryInterface.addIndex('session', ['refresh_token']),
      queryInterface.addIndex('session', ['status']),
      queryInterface.addIndex('session', ['type']),
      queryInterface.addIndex('session', ['last_activity']),
      queryInterface.addIndex('session', ['expires_at']),
      queryInterface.addIndex('session', ['ip_address']),

      // Tool execution indexes
      queryInterface.addIndex('tool_execution', ['tenant_id']),
      queryInterface.addIndex('tool_execution', ['user_id']),
      queryInterface.addIndex('tool_execution', ['session_id']),
      queryInterface.addIndex('tool_execution', ['tool_name']),
      queryInterface.addIndex('tool_execution', ['tool_category']),
      queryInterface.addIndex('tool_execution', ['tool_server']),
      queryInterface.addIndex('tool_execution', ['status']),
      queryInterface.addIndex('tool_execution', ['priority']),
      queryInterface.addIndex('tool_execution', ['started_at']),
      queryInterface.addIndex('tool_execution', ['completed_at']),
      queryInterface.addIndex('tool_execution', ['created_at']),
      queryInterface.addIndex('tool_execution', ['risk_score']),
      queryInterface.addIndex('tool_execution', ['tags'], { using: 'gin' }),
      queryInterface.addIndex('tool_execution', ['execution_id'], { unique: true }),
    ]);

    console.log('✅ Core tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('tool_execution');
    await queryInterface.dropTable('session');
    await queryInterface.dropTable('user');
    await queryInterface.dropTable('organization');
    await queryInterface.dropTable('tenant');

    // Drop ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_tool_server;
      DROP TYPE IF EXISTS enum_tool_execution_priority;
      DROP TYPE IF EXISTS enum_tool_execution_status;
      DROP TYPE IF EXISTS enum_session_status;
      DROP TYPE IF EXISTS enum_session_type;
      DROP TYPE IF EXISTS enum_user_status;
      DROP TYPE IF EXISTS enum_user_role;
      DROP TYPE IF EXISTS enum_organization_status;
      DROP TYPE IF EXISTS enum_organization_type;
      DROP TYPE IF EXISTS enum_tenant_subscription_tier;
      DROP TYPE IF EXISTS enum_tenant_status;
    `);

    console.log('✅ Core tables dropped successfully');
  }
};