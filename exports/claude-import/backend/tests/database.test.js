/**
 * Database Test Suite
 * Sunzi Cerebro Backend - SQLite Database Testing
 *
 * Tests database models, relationships, queries, migrations,
 * data integrity and performance with SQLite production database.
 */

import { jest } from '@jest/globals'
import { Sequelize, DataTypes } from 'sequelize'
import db from '../models/index.js'

describe('Database System', () => {
  beforeAll(async () => {
    // Sync database for testing
    await db.sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  beforeEach(async () => {
    // Clean database before each test
    await db.sequelize.sync({ force: true })
  })

  describe('Database Connection', () => {
    test('should connect to SQLite database successfully', async () => {
      expect(db.sequelize).toBeDefined()
      expect(db.sequelize.config.dialect).toBe('sqlite')

      // Test connection
      await db.sequelize.authenticate()
      expect(true).toBe(true) // If no error thrown, connection is successful
    })

    test('should have correct database configuration', () => {
      const config = db.sequelize.config

      expect(config.dialect).toBe('sqlite')
      expect(config.storage).toContain('sunzi_cerebro.db')
      expect(config.logging).toBeDefined()
    })

    test('should support SQLite specific features', async () => {
      // Test SQLite pragma settings
      const [results] = await db.sequelize.query("PRAGMA foreign_keys")
      expect(results).toBeDefined()

      // Test JSON support
      const [jsonResults] = await db.sequelize.query("SELECT json('{\"test\": true}') as json_data")
      expect(jsonResults[0].json_data).toBe('{"test":true}')
    })
  })

  describe('Model Definitions', () => {
    test('should have all required models defined', () => {
      const requiredModels = [
        'User',
        'Organization',
        'Session',
        'AuditLog',
        'McpServer',
        'ToolExecution',
        'SystemMetric'
      ]

      requiredModels.forEach(modelName => {
        expect(db[modelName]).toBeDefined()
        expect(typeof db[modelName]).toBe('function')
      })
    })

    test('should have correct User model structure', () => {
      const User = db.User
      const attributes = User.getAttributes()

      // Required fields
      expect(attributes).toHaveProperty('id')
      expect(attributes).toHaveProperty('email')
      expect(attributes).toHaveProperty('password')
      expect(attributes).toHaveProperty('name')
      expect(attributes).toHaveProperty('role')
      expect(attributes).toHaveProperty('organizationId')

      // Field types
      expect(attributes.email.type).toBeInstanceOf(DataTypes.STRING)
      expect(attributes.password.type).toBeInstanceOf(DataTypes.STRING)
      expect(attributes.role.type).toBeInstanceOf(DataTypes.ENUM)
    })

    test('should have correct Organization model structure', () => {
      const Organization = db.Organization
      const attributes = Organization.getAttributes()

      expect(attributes).toHaveProperty('id')
      expect(attributes).toHaveProperty('name')
      expect(attributes).toHaveProperty('domain')
      expect(attributes).toHaveProperty('settings')
      expect(attributes).toHaveProperty('subscription')
      expect(attributes).toHaveProperty('status')

      // JSON field
      expect(attributes.settings.type).toBeInstanceOf(DataTypes.JSON)
    })

    test('should have correct Session model structure', () => {
      const Session = db.Session
      const attributes = Session.getAttributes()

      expect(attributes).toHaveProperty('id')
      expect(attributes).toHaveProperty('userId')
      expect(attributes).toHaveProperty('token')
      expect(attributes).toHaveProperty('expiresAt')
      expect(attributes).toHaveProperty('ipAddress')
      expect(attributes).toHaveProperty('userAgent')
    })
  })

  describe('Model Relationships', () => {
    test('should have correct User-Organization relationship', async () => {
      // Create organization
      const org = await db.Organization.create({
        name: 'Test Org',
        domain: 'test.com',
        settings: { theme: 'dark' },
        subscription: 'enterprise',
        status: 'active'
      })

      // Create user
      const user = await db.User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        organizationId: org.id
      })

      // Test association
      const userWithOrg = await db.User.findByPk(user.id, {
        include: [db.Organization]
      })

      expect(userWithOrg.Organization).toBeDefined()
      expect(userWithOrg.Organization.id).toBe(org.id)
      expect(userWithOrg.Organization.name).toBe('Test Org')
    })

    test('should have correct User-Session relationship', async () => {
      const org = await db.Organization.create({
        name: 'Test Org',
        domain: 'test.com',
        settings: {},
        subscription: 'basic',
        status: 'active'
      })

      const user = await db.User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        organizationId: org.id
      })

      const session = await db.Session.create({
        userId: user.id,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      })

      // Test association
      const userWithSessions = await db.User.findByPk(user.id, {
        include: [db.Session]
      })

      expect(userWithSessions.Sessions).toBeDefined()
      expect(userWithSessions.Sessions).toHaveLength(1)
      expect(userWithSessions.Sessions[0].token).toBe('test-token')
    })

    test('should cascade delete sessions when user is deleted', async () => {
      const org = await db.Organization.create({
        name: 'Test Org',
        domain: 'test.com',
        settings: {},
        subscription: 'basic',
        status: 'active'
      })

      const user = await db.User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        organizationId: org.id
      })

      await db.Session.create({
        userId: user.id,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      })

      // Delete user
      await user.destroy()

      // Check sessions are deleted
      const remainingSessions = await db.Session.count({
        where: { userId: user.id }
      })
      expect(remainingSessions).toBe(0)
    })
  })

  describe('Data Validation', () => {
    test('should validate user email format', async () => {
      const org = await db.Organization.create({
        name: 'Test Org',
        domain: 'test.com',
        settings: {},
        subscription: 'basic',
        status: 'active'
      })

      // Invalid email should throw validation error
      await expect(
        db.User.create({
          email: 'invalid-email',
          password: 'hashedpassword',
          name: 'Test User',
          role: 'user',
          organizationId: org.id
        })
      ).rejects.toThrow()
    })

    test('should enforce unique email constraint', async () => {
      const org = await db.Organization.create({
        name: 'Test Org',
        domain: 'test.com',
        settings: {},
        subscription: 'basic',
        status: 'active'
      })

      await db.User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User 1',
        role: 'user',
        organizationId: org.id
      })

      // Duplicate email should throw constraint error
      await expect(
        db.User.create({
          email: 'test@example.com',
          password: 'hashedpassword2',
          name: 'Test User 2',
          role: 'admin',
          organizationId: org.id
        })
      ).rejects.toThrow()
    })

    test('should validate role enum values', async () => {
      const org = await db.Organization.create({
        name: 'Test Org',
        domain: 'test.com',
        settings: {},
        subscription: 'basic',
        status: 'active'
      })

      // Invalid role should throw validation error
      await expect(
        db.User.create({
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Test User',
          role: 'invalid_role',
          organizationId: org.id
        })
      ).rejects.toThrow()
    })

    test('should validate required fields', async () => {
      // Missing required fields should throw validation error
      await expect(
        db.User.create({
          email: 'test@example.com'
          // Missing password, name, role, organizationId
        })
      ).rejects.toThrow()
    })
  })

  describe('Complex Queries', () => {
    let testOrg, testUser1, testUser2, testAdmin

    beforeEach(async () => {
      testOrg = await db.Organization.create({
        name: 'Test Organization',
        domain: 'test.sunzi-cerebro.com',
        settings: { theme: 'dark', language: 'en' },
        subscription: 'enterprise',
        status: 'active'
      })

      testUser1 = await db.User.create({
        email: 'user1@test.com',
        password: 'hashedpassword1',
        name: 'Test User 1',
        role: 'user',
        organizationId: testOrg.id
      })

      testUser2 = await db.User.create({
        email: 'user2@test.com',
        password: 'hashedpassword2',
        name: 'Test User 2',
        role: 'user',
        organizationId: testOrg.id
      })

      testAdmin = await db.User.create({
        email: 'admin@test.com',
        password: 'hashedpassword3',
        name: 'Test Admin',
        role: 'admin',
        organizationId: testOrg.id
      })

      // Create some audit logs
      await db.AuditLog.create({
        userId: testUser1.id,
        organizationId: testOrg.id,
        action: 'LOGIN',
        resource: 'auth',
        details: { success: true },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })

      await db.AuditLog.create({
        userId: testUser2.id,
        organizationId: testOrg.id,
        action: 'LOGOUT',
        resource: 'auth',
        details: { success: true },
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome/91.0'
      })
    })

    test('should find users by organization', async () => {
      const users = await db.User.findAll({
        where: { organizationId: testOrg.id },
        include: [db.Organization]
      })

      expect(users).toHaveLength(3)
      users.forEach(user => {
        expect(user.organizationId).toBe(testOrg.id)
        expect(user.Organization.name).toBe('Test Organization')
      })
    })

    test('should find users by role', async () => {
      const adminUsers = await db.User.findAll({
        where: {
          role: 'admin',
          organizationId: testOrg.id
        }
      })

      const regularUsers = await db.User.findAll({
        where: {
          role: 'user',
          organizationId: testOrg.id
        }
      })

      expect(adminUsers).toHaveLength(1)
      expect(regularUsers).toHaveLength(2)
      expect(adminUsers[0].email).toBe('admin@test.com')
    })

    test('should aggregate audit log data', async () => {
      const actionCounts = await db.AuditLog.findAll({
        attributes: [
          'action',
          [db.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: { organizationId: testOrg.id },
        group: ['action']
      })

      expect(actionCounts).toHaveLength(2)

      const loginCount = actionCounts.find(ac => ac.action === 'LOGIN')
      const logoutCount = actionCounts.find(ac => ac.action === 'LOGOUT')

      expect(loginCount.get('count')).toBe(1)
      expect(logoutCount.get('count')).toBe(1)
    })

    test('should perform complex joins with conditions', async () => {
      const usersWithRecentActivity = await db.User.findAll({
        include: [{
          model: db.AuditLog,
          where: {
            createdAt: {
              [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          required: true // INNER JOIN
        }],
        where: { organizationId: testOrg.id }
      })

      expect(usersWithRecentActivity).toHaveLength(2) // user1 and user2 have audit logs

      const userIds = usersWithRecentActivity.map(u => u.id)
      expect(userIds).toContain(testUser1.id)
      expect(userIds).toContain(testUser2.id)
      expect(userIds).not.toContain(testAdmin.id) // No audit logs
    })
  })

  describe('Performance Tests', () => {
    test('should handle bulk inserts efficiently', async () => {
      const org = await db.Organization.create({
        name: 'Bulk Test Org',
        domain: 'bulk.test.com',
        settings: {},
        subscription: 'enterprise',
        status: 'active'
      })

      const users = []
      for (let i = 0; i < 100; i++) {
        users.push({
          email: `user${i}@bulk.test.com`,
          password: 'hashedpassword',
          name: `Bulk User ${i}`,
          role: 'user',
          organizationId: org.id
        })
      }

      const startTime = Date.now()
      await db.User.bulkCreate(users)
      const endTime = Date.now()

      const createdCount = await db.User.count({
        where: { organizationId: org.id }
      })

      expect(createdCount).toBe(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    test('should handle large result sets efficiently', async () => {
      const org = await db.Organization.create({
        name: 'Large Data Org',
        domain: 'large.test.com',
        settings: {},
        subscription: 'enterprise',
        status: 'active'
      })

      // Create 1000 audit logs
      const auditLogs = []
      for (let i = 0; i < 1000; i++) {
        auditLogs.push({
          organizationId: org.id,
          action: i % 2 === 0 ? 'LOGIN' : 'LOGOUT',
          resource: 'auth',
          details: { test: true, index: i },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent'
        })
      }

      await db.AuditLog.bulkCreate(auditLogs)

      // Query with pagination
      const startTime = Date.now()
      const results = await db.AuditLog.findAndCountAll({
        where: { organizationId: org.id },
        limit: 50,
        offset: 0,
        order: [['createdAt', 'DESC']]
      })
      const endTime = Date.now()

      expect(results.count).toBe(1000)
      expect(results.rows).toHaveLength(50)
      expect(endTime - startTime).toBeLessThan(100) // Should be very fast with proper indexing
    })

    test('should optimize queries with proper indexing', async () => {
      // Test that commonly queried fields are indexed
      const indexes = await db.sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='index'",
        { type: db.sequelize.QueryTypes.SELECT }
      )

      const indexNames = indexes.map(idx => idx.name)

      // Check for important indexes (these would be created by Sequelize automatically)
      expect(indexNames.some(name => name.includes('email'))).toBe(true)
      expect(indexNames.some(name => name.includes('organizationId'))).toBe(true)
    })
  })

  describe('Transaction Support', () => {
    test('should support database transactions', async () => {
      const transaction = await db.sequelize.transaction()

      try {
        const org = await db.Organization.create({
          name: 'Transaction Test Org',
          domain: 'transaction.test.com',
          settings: {},
          subscription: 'basic',
          status: 'active'
        }, { transaction })

        const user = await db.User.create({
          email: 'transaction@test.com',
          password: 'hashedpassword',
          name: 'Transaction User',
          role: 'user',
          organizationId: org.id
        }, { transaction })

        await transaction.commit()

        // Verify data was committed
        const savedUser = await db.User.findByPk(user.id)
        expect(savedUser).toBeTruthy()
        expect(savedUser.email).toBe('transaction@test.com')
      } catch (error) {
        await transaction.rollback()
        throw error
      }
    })

    test('should rollback transactions on error', async () => {
      const transaction = await db.sequelize.transaction()

      try {
        await db.Organization.create({
          name: 'Rollback Test Org',
          domain: 'rollback.test.com',
          settings: {},
          subscription: 'basic',
          status: 'active'
        }, { transaction })

        // Create invalid user to trigger rollback
        await db.User.create({
          email: 'invalid-email', // This should fail validation
          password: 'hashedpassword',
          name: 'Rollback User',
          role: 'user'
          // Missing organizationId
        }, { transaction })

        await transaction.commit()
      } catch (error) {
        await transaction.rollback()

        // Verify rollback - organization should not exist
        const orgCount = await db.Organization.count({
          where: { domain: 'rollback.test.com' }
        })
        expect(orgCount).toBe(0)
      }
    })
  })

  describe('JSON Data Handling', () => {
    test('should store and retrieve JSON data correctly', async () => {
      const complexSettings = {
        theme: 'dark',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        features: ['feature1', 'feature2', 'feature3'],
        preferences: {
          dashboard: {
            layout: 'grid',
            widgets: [
              { type: 'chart', position: { x: 0, y: 0 } },
              { type: 'table', position: { x: 1, y: 0 } }
            ]
          }
        }
      }

      const org = await db.Organization.create({
        name: 'JSON Test Org',
        domain: 'json.test.com',
        settings: complexSettings,
        subscription: 'enterprise',
        status: 'active'
      })

      const retrievedOrg = await db.Organization.findByPk(org.id)

      expect(retrievedOrg.settings).toEqual(complexSettings)
      expect(retrievedOrg.settings.theme).toBe('dark')
      expect(retrievedOrg.settings.notifications.email).toBe(true)
      expect(retrievedOrg.settings.features).toHaveLength(3)
    })

    test('should query JSON fields', async () => {
      await db.Organization.create({
        name: 'JSON Query Org 1',
        domain: 'json1.test.com',
        settings: { theme: 'dark', version: 1 },
        subscription: 'basic',
        status: 'active'
      })

      await db.Organization.create({
        name: 'JSON Query Org 2',
        domain: 'json2.test.com',
        settings: { theme: 'light', version: 2 },
        subscription: 'basic',
        status: 'active'
      })

      // SQLite JSON query syntax
      const darkThemeOrgs = await db.Organization.findAll({
        where: db.sequelize.where(
          db.sequelize.fn('json_extract', db.sequelize.col('settings'), '$.theme'),
          'dark'
        )
      })

      expect(darkThemeOrgs).toHaveLength(1)
      expect(darkThemeOrgs[0].name).toBe('JSON Query Org 1')
    })
  })
})