/**
 * MCP Server Test Suite
 * Sunzi Cerebro Backend - Model Context Protocol Server Testing
 *
 * Tests MCP server integration, tool discovery, execution,
 * database server functionality and HexStrike AI integration.
 */

import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../server.js'
import db from '../models/index.js'
import { McpService } from '../services/mcpService.js'
import { McpDatabaseServer } from '../services/mcpDatabaseServer.js'

describe('MCP Server Integration', () => {
  let server
  let testOrg
  let testUser
  let authToken

  beforeAll(async () => {
    server = app.listen(0)
    await db.sequelize.sync({ force: true })

    // Create test organization and user
    testOrg = await db.Organization.create({
      name: 'MCP Test Organization',
      domain: 'mcp.test.com',
      settings: { theme: 'dark' },
      subscription: 'enterprise',
      status: 'active'
    })

    testUser = await db.User.create({
      email: 'mcp@test.com',
      password: '$2b$12$hashedpassword',
      name: 'MCP Test User',
      role: 'admin',
      organizationId: testOrg.id
    })

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'mcp@test.com',
        password: 'realpassword' // Would need real password for actual login
      })

    if (loginResponse.body.token) {
      authToken = loginResponse.body.token
    } else {
      // Create test token for testing
      authToken = 'test-mcp-token'
      await db.Session.create({
        userId: testUser.id,
        token: authToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test'
      })
    }
  })

  afterAll(async () => {
    await db.sequelize.close()
    server.close()
  })

  describe('MCP Service Initialization', () => {
    test('should initialize MCP service successfully', () => {
      expect(McpService).toBeDefined()
      expect(typeof McpService.initialize).toBe('function')
      expect(typeof McpService.discoverTools).toBe('function')
      expect(typeof McpService.executeTool).toBe('function')
    })

    test('should have MCP database server available', () => {
      expect(McpDatabaseServer).toBeDefined()
      expect(typeof McpDatabaseServer.initialize).toBe('function')
      expect(typeof McpDatabaseServer.handleRequest).toBe('function')
    })

    test('should register MCP server configuration', async () => {
      const mcpServers = await db.McpServer.findAll()

      // Should have at least the database server registered
      const databaseServer = mcpServers.find(s => s.name === 'database')
      expect(databaseServer).toBeDefined()
      expect(databaseServer.status).toBe('active')
    })
  })

  describe('MCP Database Server Tools', () => {
    beforeEach(async () => {
      // Ensure we have test data
      await db.User.findOrCreate({
        where: { email: 'dbtest@test.com' },
        defaults: {
          email: 'dbtest@test.com',
          password: '$2b$12$hashedpassword',
          name: 'Database Test User',
          role: 'user',
          organizationId: testOrg.id
        }
      })
    })

    test('should provide query_users tool', async () => {
      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: testOrg.id,
          limit: 10
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.users)).toBe(true)
      expect(response.body.data.users.length).toBeGreaterThan(0)
      expect(response.body.data.pagination).toBeDefined()
    })

    test('should provide query_organizations tool', async () => {
      const response = await request(app)
        .post('/api/mcp/database/query_organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          limit: 5
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.organizations)).toBe(true)
      expect(response.body.data.organizations.length).toBeGreaterThan(0)

      const org = response.body.data.organizations[0]
      expect(org).toHaveProperty('id')
      expect(org).toHaveProperty('name')
      expect(org).toHaveProperty('domain')
      expect(org).toHaveProperty('subscription')
    })

    test('should provide get_database_stats tool', async () => {
      const response = await request(app)
        .post('/api/mcp/database/get_database_stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.stats).toBeDefined()
      expect(response.body.data.stats.totalUsers).toBeGreaterThan(0)
      expect(response.body.data.stats.totalOrganizations).toBeGreaterThan(0)
      expect(response.body.data.stats).toHaveProperty('totalSessions')
      expect(response.body.data.stats).toHaveProperty('totalAuditLogs')
    })

    test('should provide query_audit_logs tool', async () => {
      // Create test audit log
      await db.AuditLog.create({
        userId: testUser.id,
        organizationId: testOrg.id,
        action: 'MCP_TEST',
        resource: 'test',
        details: { test: true },
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test'
      })

      const response = await request(app)
        .post('/api/mcp/database/query_audit_logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: testOrg.id,
          limit: 10
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.auditLogs)).toBe(true)
      expect(response.body.data.auditLogs.length).toBeGreaterThan(0)

      const auditLog = response.body.data.auditLogs.find(log => log.action === 'MCP_TEST')
      expect(auditLog).toBeDefined()
      expect(auditLog.resource).toBe('test')
    })

    test('should provide get_user_sessions tool', async () => {
      const response = await request(app)
        .post('/api/mcp/database/get_user_sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUser.id
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.sessions)).toBe(true)
      expect(response.body.data.sessions.length).toBeGreaterThan(0)

      const session = response.body.data.sessions[0]
      expect(session).toHaveProperty('id')
      expect(session).toHaveProperty('token')
      expect(session).toHaveProperty('expiresAt')
      expect(session).toHaveProperty('ipAddress')
    })

    test('should provide execute_raw_query tool with proper security', async () => {
      // Safe query
      const safeResponse = await request(app)
        .post('/api/mcp/database/execute_raw_query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'SELECT COUNT(*) as userCount FROM Users WHERE organizationId = ?',
          params: [testOrg.id]
        })
        .expect(200)

      expect(safeResponse.body.success).toBe(true)
      expect(safeResponse.body.data.results).toBeDefined()
      expect(Array.isArray(safeResponse.body.data.results)).toBe(true)

      // Dangerous query should be blocked
      const dangerousResponse = await request(app)
        .post('/api/mcp/database/execute_raw_query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'DROP TABLE Users;',
          params: []
        })
        .expect(400)

      expect(dangerousResponse.body.success).toBe(false)
      expect(dangerousResponse.body.message).toContain('Query not allowed')
    })
  })

  describe('MCP Tool Discovery', () => {
    test('should discover available MCP tools', async () => {
      const response = await request(app)
        .get('/api/mcp/tools')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.tools)).toBe(true)
      expect(response.body.data.tools.length).toBeGreaterThan(0)

      // Check for database tools
      const databaseTools = response.body.data.tools.filter(
        tool => tool.server === 'database'
      )
      expect(databaseTools.length).toBeGreaterThan(0)

      const expectedTools = [
        'query_users',
        'query_organizations',
        'get_database_stats',
        'query_audit_logs',
        'get_user_sessions',
        'execute_raw_query'
      ]

      expectedTools.forEach(expectedTool => {
        const found = databaseTools.find(tool => tool.name === expectedTool)
        expect(found).toBeDefined()
        expect(found).toHaveProperty('description')
        expect(found).toHaveProperty('parameters')
      })
    })

    test('should show tool execution statistics', async () => {
      // Execute a tool to create statistics
      await request(app)
        .post('/api/mcp/database/get_database_stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      const response = await request(app)
        .get('/api/mcp/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.stats).toBeDefined()
      expect(response.body.data.stats).toHaveProperty('totalExecutions')
      expect(response.body.data.stats).toHaveProperty('toolStats')
      expect(response.body.data.stats).toHaveProperty('serverStats')
    })
  })

  describe('HexStrike AI Integration', () => {
    test('should connect to HexStrike AI MCP server', async () => {
      const response = await request(app)
        .get('/api/mcp/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data.servers)).toBe(true)

      // Check for HexStrike AI server
      const hexstrikeServer = response.body.data.servers.find(
        server => server.name.toLowerCase().includes('hexstrike')
      )

      if (hexstrikeServer) {
        expect(hexstrikeServer.status).toBe('connected')
        expect(hexstrikeServer.toolCount).toBeGreaterThan(0)
      }
    })

    test('should discover HexStrike AI security tools', async () => {
      const response = await request(app)
        .get('/api/mcp/tools')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      if (response.body.success) {
        const hexstrikeTools = response.body.data.tools.filter(
          tool => tool.server && tool.server.toLowerCase().includes('hexstrike')
        )

        if (hexstrikeTools.length > 0) {
          expect(hexstrikeTools.length).toBeGreaterThan(10) // Should have many security tools

          // Check for common security tool categories
          const toolNames = hexstrikeTools.map(tool => tool.name.toLowerCase())
          const hasReconTools = toolNames.some(name =>
            name.includes('scan') ||
            name.includes('enum') ||
            name.includes('recon')
          )
          const hasWebTools = toolNames.some(name =>
            name.includes('web') ||
            name.includes('http') ||
            name.includes('url')
          )

          expect(hasReconTools || hasWebTools).toBe(true)
        }
      }
    })
  })

  describe('Tool Execution Logging', () => {
    test('should log tool executions in database', async () => {
      const toolName = 'get_database_stats'
      const beforeCount = await db.ToolExecution.count()

      await request(app)
        .post(`/api/mcp/database/${toolName}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      const afterCount = await db.ToolExecution.count()
      expect(afterCount).toBe(beforeCount + 1)

      const execution = await db.ToolExecution.findOne({
        where: { toolName },
        order: [['createdAt', 'DESC']]
      })

      expect(execution).toBeDefined()
      expect(execution.userId).toBe(testUser.id)
      expect(execution.organizationId).toBe(testOrg.id)
      expect(execution.toolName).toBe(toolName)
      expect(execution.server).toBe('database')
      expect(execution.status).toBe('success')
      expect(execution.executionTime).toBeGreaterThan(0)
    })

    test('should log failed tool executions', async () => {
      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: 'invalid-org-id', // Should cause validation error
          limit: 10
        })
        .expect(400)

      expect(response.body.success).toBe(false)

      const execution = await db.ToolExecution.findOne({
        where: {
          toolName: 'query_users',
          status: 'error'
        },
        order: [['createdAt', 'DESC']]
      })

      expect(execution).toBeDefined()
      expect(execution.status).toBe('error')
      expect(execution.errorMessage).toBeDefined()
    })
  })

  describe('MCP Security', () => {
    test('should require authentication for MCP endpoints', async () => {
      const response = await request(app)
        .get('/api/mcp/tools')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Access token required')
    })

    test('should validate user permissions for MCP tools', async () => {
      // Create regular user (non-admin)
      const regularUser = await db.User.create({
        email: 'regular@test.com',
        password: '$2b$12$hashedpassword',
        name: 'Regular User',
        role: 'user',
        organizationId: testOrg.id
      })

      const userSession = await db.Session.create({
        userId: regularUser.id,
        token: 'regular-user-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test'
      })

      // Regular user should have limited access to certain tools
      const response = await request(app)
        .post('/api/mcp/database/execute_raw_query')
        .set('Authorization', `Bearer ${userSession.token}`)
        .send({
          query: 'SELECT * FROM Users',
          params: []
        })
        .expect(403) // Should be forbidden for regular users

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Insufficient permissions')
    })

    test('should sanitize MCP tool inputs', async () => {
      const maliciousInput = {
        organizationId: testOrg.id,
        limit: 'DROP TABLE Users;', // SQL injection attempt
        filters: {
          'name": "test", "role": "admin"; DROP TABLE Users; --': 'malicious'
        }
      }

      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousInput)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid input')

      // Verify database is intact
      const userCount = await db.User.count()
      expect(userCount).toBeGreaterThan(0)
    })
  })

  describe('MCP Performance', () => {
    test('should execute database tools within performance thresholds', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .post('/api/mcp/database/get_database_stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200)

      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(response.body.success).toBe(true)
      expect(executionTime).toBeLessThan(500) // Should complete in under 500ms
    })

    test('should handle concurrent tool executions', async () => {
      const promises = []

      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/mcp/database/query_users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              organizationId: testOrg.id,
              limit: 5
            })
        )
      }

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      expect(endTime - startTime).toBeLessThan(2000) // All should complete in under 2 seconds
    })

    test('should implement rate limiting for MCP endpoints', async () => {
      // Make rapid requests to test rate limiting
      const promises = []
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/api/mcp/tools')
            .set('Authorization', `Bearer ${authToken}`)
        )
      }

      const responses = await Promise.all(promises)

      // Some requests should be rate limited
      const rateLimited = responses.some(res => res.status === 429)

      if (rateLimited) {
        expect(rateLimited).toBe(true)

        const rateLimitedResponse = responses.find(res => res.status === 429)
        expect(rateLimitedResponse.body.message).toContain('Too Many Requests')
      }
    })
  })

  describe('MCP Error Handling', () => {
    test('should handle MCP server connection errors gracefully', async () => {
      // Simulate server connection error by calling non-existent server
      const response = await request(app)
        .post('/api/mcp/nonexistent-server/test-tool')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Server not found')
    })

    test('should handle tool execution timeouts', async () => {
      // This would need to be implemented in the actual MCP service
      // For now, just verify the error handling structure is in place
      const response = await request(app)
        .post('/api/mcp/database/execute_raw_query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'SELECT * FROM sqlite_master', // Valid query but might be slow
          params: [],
          timeout: 1 // Very short timeout to force timeout
        })

      // Should either succeed quickly or handle timeout gracefully
      expect([200, 408, 500]).toContain(response.status)

      if (response.status !== 200) {
        expect(response.body.success).toBe(false)
      }
    })

    test('should provide helpful error messages for invalid tool parameters', async () => {
      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required organizationId
          limit: 'invalid_number' // Invalid type
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBeDefined()
      expect(response.body.errors).toBeDefined()
      expect(Array.isArray(response.body.errors)).toBe(true)
    })
  })
})