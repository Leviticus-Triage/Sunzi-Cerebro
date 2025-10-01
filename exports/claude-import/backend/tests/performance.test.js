/**
 * Performance Test Suite
 * Sunzi Cerebro Backend - System Performance Testing
 *
 * Tests API response times, database query performance, concurrent load handling,
 * memory usage, MCP tool execution performance and system resource utilization.
 */

import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../server.js'
import db from '../models/index.js'

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 200, // Max 200ms for standard API calls
  DATABASE_QUERY_TIME: 100, // Max 100ms for database queries
  MCP_TOOL_EXECUTION_TIME: 500, // Max 500ms for MCP tool execution
  CONCURRENT_REQUESTS: 50, // Number of concurrent requests to test
  BULK_OPERATIONS: 1000, // Number of records for bulk operations
  MEMORY_USAGE_THRESHOLD: 512 * 1024 * 1024 // 512MB max memory usage
}

describe('Performance Test Suite', () => {
  let server
  let testOrg
  let testUser
  let authToken

  beforeAll(async () => {
    server = app.listen(0)
    await db.sequelize.sync({ force: true })

    // Create test data
    testOrg = await db.Organization.create({
      name: 'Performance Test Org',
      domain: 'perf.test.com',
      settings: { theme: 'dark' },
      subscription: 'enterprise',
      status: 'active'
    })

    testUser = await db.User.create({
      email: 'perf@test.com',
      password: '$2b$12$hashedpassword',
      name: 'Performance Test User',
      role: 'admin',
      organizationId: testOrg.id
    })

    authToken = 'perf-test-token'
    await db.Session.create({
      userId: testUser.id,
      token: authToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'jest-perf-test'
    })
  })

  afterAll(async () => {
    await db.sequelize.close()
    server.close()
  })

  describe('API Response Time Performance', () => {
    const measureResponseTime = async (method, endpoint, data = {}) => {
      const startTime = process.hrtime.bigint()

      const response = await request(app)
        [method](endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data)

      const endTime = process.hrtime.bigint()
      const responseTime = Number(endTime - startTime) / 1000000 // Convert to milliseconds

      return { response, responseTime }
    }

    test('authentication endpoints should respond within threshold', async () => {
      const endpoints = [
        { method: 'get', path: '/api/auth/profile' },
        { method: 'post', path: '/api/auth/refresh' },
        { method: 'get', path: '/api/system/health' }
      ]

      for (const endpoint of endpoints) {
        const { response, responseTime } = await measureResponseTime(
          endpoint.method,
          endpoint.path
        )

        expect(response.status).toBeLessThan(500)
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME)

        console.log(`📊 ${endpoint.method.toUpperCase()} ${endpoint.path}: ${responseTime.toFixed(2)}ms`)
      }
    })

    test('MCP database endpoints should respond within threshold', async () => {
      const mcpEndpoints = [
        { method: 'post', path: '/api/mcp/database/get_database_stats', data: {} },
        { method: 'post', path: '/api/mcp/database/query_users', data: { organizationId: testOrg.id, limit: 10 } },
        { method: 'post', path: '/api/mcp/database/query_organizations', data: { limit: 5 } }
      ]

      for (const endpoint of mcpEndpoints) {
        const { response, responseTime } = await measureResponseTime(
          endpoint.method,
          endpoint.path,
          endpoint.data
        )

        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MCP_TOOL_EXECUTION_TIME)

        console.log(`📊 MCP ${endpoint.path}: ${responseTime.toFixed(2)}ms`)
      }
    })

    test('system monitoring endpoints should be fast', async () => {
      const systemEndpoints = [
        { method: 'get', path: '/api/system/health' },
        { method: 'get', path: '/api/system/metrics' },
        { method: 'get', path: '/api/mcp/stats' }
      ]

      for (const endpoint of systemEndpoints) {
        const { response, responseTime } = await measureResponseTime(
          endpoint.method,
          endpoint.path
        )

        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(100) // System endpoints should be very fast

        console.log(`📊 System ${endpoint.path}: ${responseTime.toFixed(2)}ms`)
      }
    })
  })

  describe('Database Query Performance', () => {
    beforeEach(async () => {
      // Create bulk test data for performance testing
      const users = []
      for (let i = 0; i < 100; i++) {
        users.push({
          email: `perfuser${i}@test.com`,
          password: '$2b$12$hashedpassword',
          name: `Performance User ${i}`,
          role: i % 10 === 0 ? 'admin' : 'user',
          organizationId: testOrg.id
        })
      }
      await db.User.bulkCreate(users)

      // Create audit logs for testing
      const auditLogs = []
      for (let i = 0; i < 500; i++) {
        auditLogs.push({
          organizationId: testOrg.id,
          action: i % 4 === 0 ? 'LOGIN' : i % 4 === 1 ? 'LOGOUT' : i % 4 === 2 ? 'VIEW' : 'EDIT',
          resource: 'performance_test',
          details: { testIndex: i, timestamp: new Date() },
          ipAddress: '127.0.0.1',
          userAgent: 'perf-test'
        })
      }
      await db.AuditLog.bulkCreate(auditLogs)
    })

    afterEach(async () => {
      // Clean up test data
      await db.User.destroy({ where: { email: { [db.Sequelize.Op.like]: 'perfuser%' } } })
      await db.AuditLog.destroy({ where: { resource: 'performance_test' } })
    })

    test('user queries should be performant', async () => {
      const startTime = process.hrtime.bigint()

      const users = await db.User.findAndCountAll({
        where: { organizationId: testOrg.id },
        include: [db.Organization],
        limit: 20,
        offset: 0,
        order: [['createdAt', 'DESC']]
      })

      const endTime = process.hrtime.bigint()
      const queryTime = Number(endTime - startTime) / 1000000

      expect(users.count).toBeGreaterThan(90)
      expect(users.rows).toHaveLength(20)
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME)

      console.log(`📊 User query with joins: ${queryTime.toFixed(2)}ms`)
    })

    test('audit log aggregations should be fast', async () => {
      const startTime = process.hrtime.bigint()

      const actionCounts = await db.AuditLog.findAll({
        attributes: [
          'action',
          [db.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: { organizationId: testOrg.id },
        group: ['action'],
        order: [[db.sequelize.fn('COUNT', '*'), 'DESC']]
      })

      const endTime = process.hrtime.bigint()
      const queryTime = Number(endTime - startTime) / 1000000

      expect(actionCounts.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME)

      console.log(`📊 Audit log aggregation: ${queryTime.toFixed(2)}ms`)
    })

    test('complex queries with multiple joins should perform well', async () => {
      const startTime = process.hrtime.bigint()

      const usersWithActivity = await db.User.findAll({
        include: [
          {
            model: db.Organization,
            attributes: ['name', 'domain', 'subscription']
          },
          {
            model: db.AuditLog,
            where: {
              createdAt: {
                [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            },
            required: false,
            limit: 5
          },
          {
            model: db.Session,
            where: {
              expiresAt: {
                [db.Sequelize.Op.gt]: new Date()
              }
            },
            required: false
          }
        ],
        where: { organizationId: testOrg.id },
        limit: 10
      })

      const endTime = process.hrtime.bigint()
      const queryTime = Number(endTime - startTime) / 1000000

      expect(usersWithActivity.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME * 2) // Allow 2x for complex queries

      console.log(`📊 Complex multi-join query: ${queryTime.toFixed(2)}ms`)
    })

    test('bulk operations should be efficient', async () => {
      const testData = []
      for (let i = 0; i < PERFORMANCE_THRESHOLDS.BULK_OPERATIONS; i++) {
        testData.push({
          organizationId: testOrg.id,
          action: 'BULK_TEST',
          resource: 'performance',
          details: { bulkIndex: i },
          ipAddress: '127.0.0.1',
          userAgent: 'bulk-test'
        })
      }

      const startTime = process.hrtime.bigint()

      await db.AuditLog.bulkCreate(testData)

      const endTime = process.hrtime.bigint()
      const insertTime = Number(endTime - startTime) / 1000000

      // Bulk insert of 1000 records should complete within reasonable time
      expect(insertTime).toBeLessThan(2000) // 2 seconds max

      console.log(`📊 Bulk insert (${PERFORMANCE_THRESHOLDS.BULK_OPERATIONS} records): ${insertTime.toFixed(2)}ms`)

      // Cleanup
      await db.AuditLog.destroy({ where: { action: 'BULK_TEST' } })
    })
  })

  describe('Concurrent Load Testing', () => {
    test('should handle concurrent API requests', async () => {
      const concurrentRequests = []
      const numberOfRequests = PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS

      for (let i = 0; i < numberOfRequests; i++) {
        concurrentRequests.push(
          request(app)
            .get('/api/system/health')
            .set('Authorization', `Bearer ${authToken}`)
        )
      }

      const startTime = process.hrtime.bigint()
      const responses = await Promise.all(concurrentRequests)
      const endTime = process.hrtime.bigint()

      const totalTime = Number(endTime - startTime) / 1000000

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200)
      })

      // Average response time should be reasonable
      const averageTime = totalTime / numberOfRequests
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME)

      console.log(`📊 ${numberOfRequests} concurrent requests: ${totalTime.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`)
    })

    test('should handle concurrent database queries', async () => {
      const concurrentQueries = []
      const numberOfQueries = 20

      for (let i = 0; i < numberOfQueries; i++) {
        concurrentQueries.push(
          db.User.findAndCountAll({
            where: { organizationId: testOrg.id },
            limit: 10,
            offset: i * 10
          })
        )
      }

      const startTime = process.hrtime.bigint()
      const results = await Promise.all(concurrentQueries)
      const endTime = process.hrtime.bigint()

      const totalTime = Number(endTime - startTime) / 1000000

      // All queries should succeed
      results.forEach(result => {
        expect(result.count).toBeGreaterThan(0)
        expect(Array.isArray(result.rows)).toBe(true)
      })

      expect(totalTime).toBeLessThan(1000) // All queries within 1 second

      console.log(`📊 ${numberOfQueries} concurrent DB queries: ${totalTime.toFixed(2)}ms`)
    })

    test('should handle concurrent MCP tool executions', async () => {
      const concurrentMcpCalls = []
      const numberOfCalls = 10

      for (let i = 0; i < numberOfCalls; i++) {
        concurrentMcpCalls.push(
          request(app)
            .post('/api/mcp/database/get_database_stats')
            .set('Authorization', `Bearer ${authToken}`)
            .send({})
        )
      }

      const startTime = process.hrtime.bigint()
      const responses = await Promise.all(concurrentMcpCalls)
      const endTime = process.hrtime.bigint()

      const totalTime = Number(endTime - startTime) / 1000000

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      const averageTime = totalTime / numberOfCalls
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MCP_TOOL_EXECUTION_TIME)

      console.log(`📊 ${numberOfCalls} concurrent MCP calls: ${totalTime.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`)
    })
  })

  describe('Memory and Resource Usage', () => {
    const getMemoryUsage = () => {
      const usage = process.memoryUsage()
      return {
        rss: usage.rss, // Resident Set Size
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      }
    }

    test('memory usage should stay within acceptable limits', async () => {
      const initialMemory = getMemoryUsage()

      // Perform memory-intensive operations
      const users = []
      for (let i = 0; i < 1000; i++) {
        users.push({
          email: `memtest${i}@test.com`,
          password: '$2b$12$hashedpassword',
          name: `Memory Test User ${i}`,
          role: 'user',
          organizationId: testOrg.id
        })
      }

      await db.User.bulkCreate(users)

      // Query large dataset
      const allUsers = await db.User.findAll({
        where: { email: { [db.Sequelize.Op.like]: 'memtest%' } },
        include: [db.Organization]
      })

      const peakMemory = getMemoryUsage()

      // Clean up
      await db.User.destroy({ where: { email: { [db.Sequelize.Op.like]: 'memtest%' } } })

      const finalMemory = getMemoryUsage()

      expect(allUsers.length).toBe(1000)
      expect(peakMemory.heapUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_THRESHOLD)

      console.log(`📊 Memory usage - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, Peak: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    })

    test('should handle memory cleanup after operations', async () => {
      const initialMemory = getMemoryUsage()

      // Create and destroy data multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        const testData = []
        for (let i = 0; i < 200; i++) {
          testData.push({
            organizationId: testOrg.id,
            action: 'MEMORY_TEST',
            resource: `cycle_${cycle}`,
            details: { cycle, index: i },
            ipAddress: '127.0.0.1',
            userAgent: 'memory-test'
          })
        }

        await db.AuditLog.bulkCreate(testData)
        await db.AuditLog.destroy({ where: { action: 'MEMORY_TEST', resource: `cycle_${cycle}` } })

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = getMemoryUsage()

      // Memory should not grow significantly after cleanup
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth

      console.log(`📊 Memory cleanup test - Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`)
    })
  })

  describe('MCP Tool Performance', () => {
    test('database tool performance benchmarks', async () => {
      const tools = [
        { name: 'get_database_stats', data: {} },
        { name: 'query_users', data: { organizationId: testOrg.id, limit: 10 } },
        { name: 'query_organizations', data: { limit: 5 } },
        { name: 'query_audit_logs', data: { organizationId: testOrg.id, limit: 20 } }
      ]

      for (const tool of tools) {
        const executionTimes = []

        // Run each tool 5 times to get average
        for (let i = 0; i < 5; i++) {
          const startTime = process.hrtime.bigint()

          const response = await request(app)
            .post(`/api/mcp/database/${tool.name}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(tool.data)

          const endTime = process.hrtime.bigint()
          const executionTime = Number(endTime - startTime) / 1000000

          expect(response.status).toBe(200)
          executionTimes.push(executionTime)
        }

        const averageTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        const minTime = Math.min(...executionTimes)
        const maxTime = Math.max(...executionTimes)

        expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MCP_TOOL_EXECUTION_TIME)

        console.log(`📊 MCP Tool ${tool.name}: ${averageTime.toFixed(2)}ms avg (${minTime.toFixed(2)}-${maxTime.toFixed(2)}ms range)`)
      }
    })
  })

  describe('Database Connection Pool Performance', () => {
    test('connection pool should handle concurrent queries efficiently', async () => {
      const concurrentQueries = []

      // Create many concurrent queries that would require multiple connections
      for (let i = 0; i < 30; i++) {
        concurrentQueries.push(
          db.sequelize.query(
            'SELECT COUNT(*) as count FROM Users WHERE organizationId = ?',
            {
              replacements: [testOrg.id],
              type: db.sequelize.QueryTypes.SELECT
            }
          )
        )
      }

      const startTime = process.hrtime.bigint()
      const results = await Promise.all(concurrentQueries)
      const endTime = process.hrtime.bigint()

      const totalTime = Number(endTime - startTime) / 1000000

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
        expect(result[0]).toHaveProperty('count')
      })

      expect(totalTime).toBeLessThan(1000) // Should complete within 1 second

      console.log(`📊 Connection pool test (30 concurrent queries): ${totalTime.toFixed(2)}ms`)
    })
  })
})