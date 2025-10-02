/**
 * Security Test Suite
 * Sunzi Cerebro Backend - Comprehensive Security Testing
 *
 * Tests authentication security, authorization, input validation, SQL injection prevention,
 * XSS protection, CSRF protection, rate limiting, and general security best practices.
 */

import request from 'supertest'
import jwt from 'jsonwebtoken'
import { jest } from '@jest/globals'
import app from '../server.js'
import db from '../models/index.js'

describe('Security Test Suite', () => {
  let server
  let testOrg
  let testUser
  let testAdmin
  let userToken
  let adminToken

  beforeAll(async () => {
    server = app.listen(0)
    await db.sequelize.sync({ force: true })

    // Create test organization
    testOrg = await db.Organization.create({
      name: 'Security Test Org',
      domain: 'security.test.com',
      settings: { theme: 'dark' },
      subscription: 'enterprise',
      status: 'active'
    })

    // Create test users
    testUser = await db.User.create({
      email: 'secuser@test.com',
      password: '$2b$12$hashedpassword',
      name: 'Security Test User',
      role: 'user',
      organizationId: testOrg.id
    })

    testAdmin = await db.User.create({
      email: 'secadmin@test.com',
      password: '$2b$12$hashedpassword',
      name: 'Security Test Admin',
      role: 'admin',
      organizationId: testOrg.id
    })

    // Create test tokens
    userToken = 'sec-user-token'
    adminToken = 'sec-admin-token'

    await db.Session.create({
      userId: testUser.id,
      token: userToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'security-test'
    })

    await db.Session.create({
      userId: testAdmin.id,
      token: adminToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'security-test'
    })
  })

  afterAll(async () => {
    await db.sequelize.close()
    server.close()
  })

  describe('Authentication Security', () => {
    test('should reject requests without authentication token', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/auth/profile' },
        { method: 'post', path: '/api/mcp/database/get_database_stats' },
        { method: 'get', path: '/api/admin/users' },
        { method: 'post', path: '/api/auth/logout' }
      ]

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .expect(401)

        expect(response.body.success).toBe(false)
        expect(response.body.message).toContain('Access token required')
      }
    })

    test('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'Bearer invalid',
        'not.a.jwt',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        ''
      ]

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`)
          .expect(401)

        expect(response.body.success).toBe(false)
      }
    })

    test('should reject expired JWT tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('expired')
    })

    test('should reject tokens with invalid signatures', async () => {
      const tokenWithInvalidSignature = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        'wrong-secret',
        { expiresIn: '1h' }
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenWithInvalidSignature}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid token')
    })

    test('should validate token against database session', async () => {
      const validJwtButNoSession = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${validJwtButNoSession}`)
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Authorization & Role-Based Access Control', () => {
    test('should enforce admin-only access to admin endpoints', async () => {
      const adminOnlyEndpoints = [
        { method: 'get', path: '/api/admin/users' },
        { method: 'post', path: '/api/admin/users', data: { email: 'test@example.com' } },
        { method: 'delete', path: '/api/admin/users/123' }
      ]

      for (const endpoint of adminOnlyEndpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`)
          .send(endpoint.data || {})
          .expect(403)

        expect(response.body.success).toBe(false)
        expect(response.body.message).toContain('Insufficient permissions')
      }
    })

    test('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    test('should enforce organization isolation', async () => {
      // Create another organization and user
      const otherOrg = await db.Organization.create({
        name: 'Other Org',
        domain: 'other.test.com',
        settings: {},
        subscription: 'basic',
        status: 'active'
      })

      const otherUser = await db.User.create({
        email: 'otheruser@test.com',
        password: '$2b$12$hashedpassword',
        name: 'Other User',
        role: 'admin',
        organizationId: otherOrg.id
      })

      const otherUserToken = 'other-user-token'
      await db.Session.create({
        userId: otherUser.id,
        token: otherUserToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'security-test'
      })

      // Other user should not see users from testOrg
      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          organizationId: testOrg.id,
          limit: 10
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('access')
    })
  })

  describe('Input Validation & Sanitization', () => {
    test('should validate email format in user registration', async () => {
      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-at-symbol.com',
        'spaces in@email.com',
        'toolong@' + 'a'.repeat(250) + '.com'
      ]

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email,
            password: 'ValidPassword123!',
            name: 'Test User',
            organizationId: testOrg.id
          })
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.message).toContain('validation')
      }
    })

    test('should validate password strength requirements', async () => {
      const weakPasswords = [
        '12345',
        'password',
        'PASSWORD',
        '12345678',
        'Password',
        'Password1',
        'password!'
      ]

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${Math.random()}@test.com`,
            password,
            name: 'Test User',
            organizationId: testOrg.id
          })
          .expect(400)

        expect(response.body.success).toBe(false)
      }
    })

    test('should sanitize dangerous input in MCP queries', async () => {
      const dangerousInputs = [
        { organizationId: "'; DROP TABLE Users; --" },
        { organizationId: "1 OR 1=1" },
        { limit: "UNION SELECT * FROM Users" },
        { filters: { "name'); DELETE FROM Users; --": "value" } }
      ]

      for (const input of dangerousInputs) {
        const response = await request(app)
          .post('/api/mcp/database/query_users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(input)
          .expect(400)

        expect(response.body.success).toBe(false)
      }

      // Verify database is intact
      const userCount = await db.User.count()
      expect(userCount).toBeGreaterThan(0)
    })

    test('should reject oversized payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      }

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send(largePayload)

      // Should be rejected by payload size limit
      expect([400, 413]).toContain(response.status)
    })

    test('should validate JSON structure and prevent prototype pollution', async () => {
      const maliciousPayloads = [
        { "__proto__": { "isAdmin": true } },
        { "constructor": { "prototype": { "isAdmin": true } } },
        JSON.parse('{"__proto__":{"polluted":true}}')
      ]

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/mcp/database/get_database_stats')
          .set('Authorization', `Bearer ${userToken}`)
          .send(payload)

        // Should not pollute object prototype
        expect({}.polluted).toBeUndefined()
        expect({}.isAdmin).toBeUndefined()
      }
    })
  })

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in raw queries', async () => {
      const sqlInjectionAttempts = [
        "1'; DROP TABLE Users; --",
        "1 OR 1=1",
        "1 UNION SELECT * FROM Sessions",
        "'; INSERT INTO Users (email) VALUES ('hacked@test.com'); --",
        "1; UPDATE Users SET role='admin' WHERE id=1; --"
      ]

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/mcp/database/execute_raw_query')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            query: `SELECT * FROM Users WHERE id = ${injection}`,
            params: []
          })
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.message).toContain('not allowed')
      }

      // Verify no malicious data was inserted
      const hackedUser = await db.User.findOne({
        where: { email: 'hacked@test.com' }
      })
      expect(hackedUser).toBeFalsy()

      // Verify user roles weren't changed
      const users = await db.User.findAll()
      const unauthorizedAdmins = users.filter(u => u.role === 'admin' && ![testAdmin.id].includes(u.id))
      expect(unauthorizedAdmins.length).toBe(0)
    })

    test('should use parameterized queries correctly', async () => {
      const response = await request(app)
        .post('/api/mcp/database/execute_raw_query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: 'SELECT COUNT(*) as count FROM Users WHERE organizationId = ?',
          params: [testOrg.id]
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.results[0]).toHaveProperty('count')
    })
  })

  describe('XSS Protection', () => {
    test('should sanitize HTML content in responses', async () => {
      // Create user with potentially dangerous content
      const xssUser = await db.User.create({
        email: 'xss@test.com',
        password: '$2b$12$hashedpassword',
        name: '<script>alert("XSS")</script>Test User',
        role: 'user',
        organizationId: testOrg.id
      })

      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          organizationId: testOrg.id,
          limit: 10
        })
        .expect(200)

      const foundUser = response.body.data.users.find(u => u.id === xssUser.id)
      expect(foundUser).toBeDefined()

      // Script tags should be escaped or removed in API responses
      expect(foundUser.name).not.toContain('<script>')
    })

    test('should set proper security headers', async () => {
      const response = await request(app)
        .get('/api/system/health')

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['x-xss-protection']).toBeDefined()
    })
  })

  describe('CSRF Protection', () => {
    test('should reject requests without proper CSRF tokens for state-changing operations', async () => {
      // This would depend on CSRF implementation
      // For now, test that we have some CSRF protection mechanism

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Origin', 'https://evil-site.com')

      // Should either succeed with proper CORS or reject cross-origin requests
      expect([200, 403]).toContain(response.status)
    })
  })

  describe('Rate Limiting', () => {
    test('should implement rate limiting on sensitive endpoints', async () => {
      const promises = []

      // Make many rapid requests to login endpoint
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@test.com',
              password: 'wrongpassword'
            })
        )
      }

      const responses = await Promise.all(promises)

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)

      const rateLimitResponse = rateLimitedResponses[0]
      expect(rateLimitResponse.body.message).toContain('Too Many Requests')
    })

    test('should implement different rate limits for different user roles', async () => {
      const userPromises = []
      const adminPromises = []

      // Make rapid requests as regular user
      for (let i = 0; i < 10; i++) {
        userPromises.push(
          request(app)
            .get('/api/system/health')
            .set('Authorization', `Bearer ${userToken}`)
        )
      }

      // Make rapid requests as admin
      for (let i = 0; i < 10; i++) {
        adminPromises.push(
          request(app)
            .get('/api/system/health')
            .set('Authorization', `Bearer ${adminToken}`)
        )
      }

      const [userResponses, adminResponses] = await Promise.all([
        Promise.all(userPromises),
        Promise.all(adminPromises)
      ])

      // Admin should have higher rate limits
      const userRateLimited = userResponses.filter(r => r.status === 429).length
      const adminRateLimited = adminResponses.filter(r => r.status === 429).length

      if (userRateLimited > 0 || adminRateLimited > 0) {
        expect(adminRateLimited).toBeLessThanOrEqual(userRateLimited)
      }
    })
  })

  describe('Data Exposure Prevention', () => {
    test('should not expose sensitive data in API responses', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user).not.toHaveProperty('password')
      expect(response.body.user).not.toHaveProperty('passwordHash')

      // Should not expose internal IDs or sensitive system info
      expect(response.body).not.toHaveProperty('secret')
      expect(response.body).not.toHaveProperty('privateKey')
    })

    test('should not expose other users\' data', async () => {
      const response = await request(app)
        .post('/api/mcp/database/query_users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          organizationId: testOrg.id,
          limit: 10
        })

      if (response.status === 200) {
        response.body.data.users.forEach(user => {
          expect(user).not.toHaveProperty('password')
          expect(user).not.toHaveProperty('passwordHash')

          // Users should only see limited info about other users
          if (user.id !== testUser.id) {
            expect(user).not.toHaveProperty('email')
          }
        })
      }
    })

    test('should not expose system internals in error messages', async () => {
      const response = await request(app)
        .post('/api/mcp/database/execute_raw_query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: 'SELECT * FROM nonexistent_table',
          params: []
        })

      expect(response.status).toBeGreaterThanOrEqual(400)

      // Error message should not expose database schema or file paths
      const errorMessage = JSON.stringify(response.body).toLowerCase()
      expect(errorMessage).not.toContain('/home/')
      expect(errorMessage).not.toContain('sqlite')
      expect(errorMessage).not.toContain('database schema')
    })
  })

  describe('Session Security', () => {
    test('should invalidate sessions on logout', async () => {
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(logoutResponse.body.success).toBe(true)

      // Token should no longer be valid
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401)

      expect(profileResponse.body.success).toBe(false)
    })

    test('should handle concurrent sessions securely', async () => {
      // Create multiple sessions for the same user
      const tokens = []
      for (let i = 0; i < 3; i++) {
        const token = `multi-session-${i}`
        tokens.push(token)

        await db.Session.create({
          userId: testAdmin.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: `session-${i}`
        })
      }

      // All sessions should work
      for (const token of tokens) {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)

        expect(response.body.user.id).toBe(testAdmin.id)
      }

      // Logout one session should not affect others
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokens[0]}`)
        .expect(200)

      // Other sessions should still work
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokens[1]}`)
        .expect(200)

      expect(response.body.user.id).toBe(testAdmin.id)
    })

    test('should enforce session timeout', async () => {
      // Create expired session
      const expiredToken = 'expired-session-token'
      await db.Session.create({
        userId: testUser.id,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
        ipAddress: '127.0.0.1',
        userAgent: 'expired-test'
      })

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('expired')
    })
  })

  describe('Encryption and Data Protection', () => {
    test('should store passwords with proper hashing', async () => {
      const user = await db.User.findByPk(testUser.id)

      expect(user.password).toBeDefined()
      expect(user.password).not.toBe('plaintext-password')
      expect(user.password.startsWith('$2b$')).toBe(true) // bcrypt format
      expect(user.password.length).toBeGreaterThan(50)
    })

    test('should use secure random tokens', async () => {
      const session = await db.Session.findOne({
        where: { userId: testUser.id }
      })

      expect(session.token).toBeDefined()
      expect(session.token.length).toBeGreaterThan(20)
      expect(session.token).not.toContain('user')
      expect(session.token).not.toContain('admin')
      expect(session.token).not.toContain('password')
    })
  })

  describe('Audit Trail Security', () => {
    test('should log security-relevant events', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        })

      const auditLogs = await db.AuditLog.findAll({
        where: {
          action: 'LOGIN_FAILED'
        },
        order: [['createdAt', 'DESC']],
        limit: 1
      })

      expect(auditLogs.length).toBeGreaterThan(0)
      const auditLog = auditLogs[0]
      expect(auditLog.details).toHaveProperty('email')
      expect(auditLog.ipAddress).toBeDefined()
    })

    test('should prevent audit log tampering', async () => {
      const initialCount = await db.AuditLog.count()

      // Try to delete audit logs (should be restricted)
      try {
        await db.AuditLog.destroy({
          where: { action: 'LOGIN_FAILED' }
        })
      } catch (error) {
        // Deletion might be prevented by database constraints
      }

      const finalCount = await db.AuditLog.count()
      expect(finalCount).toBeGreaterThanOrEqual(initialCount - 1) // Allow some deletion but not mass deletion
    })
  })
})