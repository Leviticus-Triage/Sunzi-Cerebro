/**
 * Admin Tenant Seeder - Initial System Setup
 * Creates default tenant, organization and admin user
 * Sunzi Cerebro Enterprise v3.2.0
 */

'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    // Create default tenant
    const tenantId = uuidv4();
    await queryInterface.bulkInsert('tenant', [{
      id: tenantId,
      name: 'sunzi-cerebro-default',
      domain: 'default',
      display_name: 'Sunzi Cerebro Default',
      description: 'Default tenant for Sunzi Cerebro Enterprise System',
      status: 'active',
      subscription_tier: 'enterprise',
      subscription_valid_until: oneYearFromNow,
      max_users: 1000,
      max_tool_executions_monthly: 100000,
      max_storage_gb: 100,
      current_storage_mb: 0,
      settings: {
        features: {
          advanced_analytics: true,
          custom_integrations: true,
          sso_enabled: false,
          api_access: true,
        },
        security: {
          session_timeout: 8 * 3600, // 8 hours
          password_policy: 'enterprise',
          two_factor_required: false,
        },
        notifications: {
          email_enabled: true,
          webhook_url: null,
        }
      },
      metadata: {
        created_by: 'system',
        purpose: 'default_tenant',
        version: '3.2.0'
      },
      created_at: now,
      updated_at: now
    }]);

    // Create root organization
    const orgId = uuidv4();
    await queryInterface.bulkInsert('organization', [{
      id: orgId,
      tenant_id: tenantId,
      parent_id: null,
      name: 'Security Operations',
      code: 'secops',
      description: 'Main Security Operations Division',
      type: 'division',
      status: 'active',
      level: 0,
      path: 'secops',
      settings: {
        permissions: {
          inherit_from_parent: false,
          custom_permissions: {
            tools: ['*'],
            reports: ['*'],
            analytics: ['*'],
            admin: ['*']
          }
        },
        quotas: {
          tool_executions_monthly: null,
          storage_limit_gb: null,
          users_limit: null
        }
      },
      metadata: {
        created_by: 'system',
        purpose: 'root_organization'
      },
      created_at: now,
      updated_at: now
    }]);

    // Create sub-organizations
    const pentestTeamId = uuidv4();
    const analystTeamId = uuidv4();

    await queryInterface.bulkInsert('organization', [
      {
        id: pentestTeamId,
        tenant_id: tenantId,
        parent_id: orgId,
        name: 'Penetration Testing Team',
        code: 'pentest',
        description: 'Offensive Security and Penetration Testing',
        type: 'team',
        status: 'active',
        level: 1,
        path: 'secops/pentest',
        settings: {
          permissions: {
            inherit_from_parent: true,
            custom_permissions: {}
          },
          quotas: {
            tool_executions_monthly: 10000,
            storage_limit_gb: 20,
            users_limit: 50
          }
        },
        metadata: {
          created_by: 'system',
          purpose: 'pentest_team'
        },
        created_at: now,
        updated_at: now
      },
      {
        id: analystTeamId,
        tenant_id: tenantId,
        parent_id: orgId,
        name: 'Security Analysts',
        code: 'analysts',
        description: 'Threat Intelligence and Security Analysis',
        type: 'team',
        status: 'active',
        level: 1,
        path: 'secops/analysts',
        settings: {
          permissions: {
            inherit_from_parent: true,
            custom_permissions: {}
          },
          quotas: {
            tool_executions_monthly: 5000,
            storage_limit_gb: 10,
            users_limit: 30
          }
        },
        metadata: {
          created_by: 'system',
          purpose: 'analyst_team'
        },
        created_at: now,
        updated_at: now
      }
    ]);

    // Create admin user
    const adminUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 12);

    await queryInterface.bulkInsert('user', [{
      id: adminUserId,
      tenant_id: tenantId,
      organization_id: orgId,
      username: 'sunzi.cerebro',
      email: 'admin@sunzi-cerebro.local',
      password_hash: hashedPassword,
      first_name: 'Sunzi',
      last_name: 'Cerebro',
      display_name: 'Sunzi Cerebro Admin',
      role: 'super_admin',
      status: 'active',
      last_login: null,
      last_login_ip: null,
      failed_login_attempts: 0,
      locked_until: null,
      password_changed_at: now,
      two_factor_enabled: false,
      permissions: {
        dashboard: ['*'],
        tools: ['*'],
        reports: ['*'],
        analytics: ['*'],
        admin: ['*']
      },
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          tool_completion: true,
          security_alerts: true
        }
      },
      metadata: {
        created_by: 'system',
        purpose: 'initial_admin',
        version: '3.2.0'
      },
      created_at: now,
      updated_at: now
    }]);

    // Create additional demo users
    const demoUsers = [
      {
        id: uuidv4(),
        tenant_id: tenantId,
        organization_id: pentestTeamId,
        username: 'john.pentester',
        email: 'john@sunzi-cerebro.local',
        password_hash: await bcrypt.hash('pentest123', 12),
        first_name: 'John',
        last_name: 'Pentester',
        display_name: 'John Pentester',
        role: 'pentester',
        status: 'active',
        permissions: {
          dashboard: ['read'],
          tools: ['read', 'execute', 'configure'],
          reports: ['read', 'create', 'update'],
          analytics: ['read'],
          admin: []
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            browser: true,
            tool_completion: true,
            security_alerts: true
          }
        },
        metadata: {
          created_by: 'system',
          purpose: 'demo_pentester'
        },
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        organization_id: analystTeamId,
        username: 'jane.analyst',
        email: 'jane@sunzi-cerebro.local',
        password_hash: await bcrypt.hash('analyst123', 12),
        first_name: 'Jane',
        last_name: 'Analyst',
        display_name: 'Jane Analyst',
        role: 'analyst',
        status: 'active',
        permissions: {
          dashboard: ['read'],
          tools: ['read', 'execute'],
          reports: ['read', 'create'],
          analytics: ['read'],
          admin: []
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            browser: true,
            tool_completion: true,
            security_alerts: false
          }
        },
        metadata: {
          created_by: 'system',
          purpose: 'demo_analyst'
        },
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        organization_id: analystTeamId,
        username: 'bob.viewer',
        email: 'bob@sunzi-cerebro.local',
        password_hash: await bcrypt.hash('viewer123', 12),
        first_name: 'Bob',
        last_name: 'Viewer',
        display_name: 'Bob Viewer',
        role: 'viewer',
        status: 'active',
        permissions: {
          dashboard: ['read'],
          tools: ['read'],
          reports: ['read'],
          analytics: [],
          admin: []
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: false,
            browser: true,
            tool_completion: false,
            security_alerts: false
          }
        },
        metadata: {
          created_by: 'system',
          purpose: 'demo_viewer'
        },
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('user', demoUsers);

    console.log('✅ Admin tenant, organizations, and users created successfully');
    console.log('📋 Login credentials:');
    console.log('   Admin: sunzi.cerebro / admin123');
    console.log('   Pentester: john.pentester / pentest123');
    console.log('   Analyst: jane.analyst / analyst123');
    console.log('   Viewer: bob.viewer / viewer123');
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded data
    await queryInterface.bulkDelete('user', {
      username: {
        [Sequelize.Op.in]: ['sunzi.cerebro', 'john.pentester', 'jane.analyst', 'bob.viewer']
      }
    }, {});

    await queryInterface.bulkDelete('organization', {
      domain: 'default'
    }, {});

    await queryInterface.bulkDelete('tenant', {
      domain: 'default'
    }, {});

    console.log('✅ Admin tenant seeded data removed successfully');
  }
};