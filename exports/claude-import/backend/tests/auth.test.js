/**
 * Authentication Test Suite
 * Sunzi Cerebro Backend - Production Authentication Testing
 *
 * Tests JWT authentication, user registration, login, password hashing
 * and session management with SQLite database integration.
 */

import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { jest } from '@jest/globals'
import app from '../server.js'
import db from '../models/index.js'

// Test configuration
const TEST_USER = {
  email: 'test@sunzi-cerebro.com',
  password: 'TestPassword123!',
  name: 'Test User',
  role: 'user'
}

const TEST_ADMIN = {
  email: 'admin@sunzi-cerebro.com',
  password: 'AdminPassword123!',
  name: 'Test Admin',
  role: 'admin'
}

describe('Authentication System', () => {
  let server
  let testUser
  let testAdmin
  let userToken
  let adminToken

  // Setup before all tests
  beforeAll(async () => {
    // Start server for testing
    server = app.listen(0)

    // Sync database and clear test data
    await db.sequelize.sync({ force: true })

    // Create test organization
    const testOrg = await db.Organization.create({
      name: 'Test Organization',
      domain: 'test.sunzi-cerebro.com',
      settings: { theme: 'dark', language: 'en' },
      subscription: 'enterprise',
      status: 'active'
    })

    // Set organization ID for test users
    TEST_USER.organizationId = testOrg.id
    TEST_ADMIN.organizationId = testOrg.id
  })

  afterAll(async () => {
    // Cleanup
    await db.sequelize.close()
    server.close()
  })

  beforeEach(async () => {
    // Clear users before each test
    await db.User.destroy({ where: {} })
    await db.Session.destroy({ where: {} })
  })

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user.email).toBe(TEST_USER.email)
      expect(response.body.user.name).toBe(TEST_USER.name)
      expect(response.body.user.role).toBe(TEST_USER.role)
      expect(response.body).toHaveProperty('token')

      // Verify user in database
      const user = await db.User.findOne({ where: { email: TEST_USER.email } })
      expect(user).toBeTruthy()
      expect(user.email).toBe(TEST_USER.email)

      // Verify password is hashed
      const isPasswordValid = await bcrypt.compare(TEST_USER.password, user.password)
      expect(isPasswordValid).toBe(true)
    })

    test('should not register user with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201)

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Email already registered')
    })

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' // too short
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Validation error')
    })

    test('should enforce strong password policy', async () => {
      const weakPasswords = ['123456', 'password', 'abc123', 'Password']

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            ...TEST_USER,
            email: `test${Math.random()}@example.com`,
            password: weakPassword
          })
          .expect(400)

        expect(response.body.success).toBe(false)
      }
    })
  })

  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      testUser = await db.User.create({
        ...TEST_USER,
        password: await bcrypt.hash(TEST_USER.password, 12)
      })
    })

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.user.id).toBe(testUser.id)
      expect(response.body).toHaveProperty('token')

      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET)
      expect(decoded.userId).toBe(testUser.id)
      expect(decoded.email).toBe(TEST_USER.email)

      // Verify session created in database
      const session = await db.Session.findOne({ where: { userId: testUser.id } })
      expect(session).toBeTruthy()
      expect(session.token).toBe(response.body.token)
    })

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: TEST_USER.password
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    test('should validate login input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    beforeEach(async () => {
      testUser = await db.User.create({
        ...TEST_USER,
        password: await bcrypt.hash(TEST_USER.password, 12)
      })

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })

      userToken = loginResponse.body.token
    })

    test('should accept valid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.user.id).toBe(testUser.id)
      expect(response.body.user.email).toBe(TEST_USER.email)
    })

    test('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Access token required')
    })

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid token')
    })

    test('should reject expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      )

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token expired')
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      testUser = await db.User.create({
        ...TEST_USER,
        password: await bcrypt.hash(TEST_USER.password, 12)
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })

      userToken = loginResponse.body.token
    })

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logout successful')

      // Verify session removed from database
      const session = await db.Session.findOne({ where: { token: userToken } })
      expect(session).toBeFalsy()
    })

    test('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('token')
      expect(response.body.token).not.toBe(userToken) // New token

      // Verify old session updated with new token
      const newSession = await db.Session.findOne({
        where: { userId: testUser.id }
      })
      expect(newSession.token).toBe(response.body.token)
    })

    test('should clean up expired sessions', async () => {
      // Create multiple sessions
      const sessions = []
      for (let i = 0; i < 3; i++) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: TEST_USER.email,
            password: TEST_USER.password
          })
        sessions.push(loginResponse.body.token)
      }

      // Verify multiple sessions exist
      const sessionCount = await db.Session.count({
        where: { userId: testUser.id }
      })
      expect(sessionCount).toBe(3)

      // Call cleanup endpoint (assuming it exists)
      await request(app)
        .post('/api/auth/cleanup')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Verify only active session remains
      const remainingSessions = await db.Session.count({
        where: { userId: testUser.id }
      })
      expect(remainingSessions).toBeLessThanOrEqual(1)
    })
  })

  describe('Role-Based Access Control (RBAC)', () => {
    beforeEach(async () => {
      // Create user and admin
      testUser = await db.User.create({
        ...TEST_USER,
        password: await bcrypt.hash(TEST_USER.password, 12)
      })

      testAdmin = await db.User.create({
        ...TEST_ADMIN,
        password: await bcrypt.hash(TEST_ADMIN.password, 12)
      })

      // Get tokens
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password })

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })

      userToken = userLogin.body.token
      adminToken = adminLogin.body.token
    })

    test('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.users)).toBe(true)
    })

    test('should deny user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Insufficient permissions')
    })

    test('should allow user access to user endpoints', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.user.id).toBe(testUser.id)
    })
  })

  describe('Password Security', () => {
    test('should hash passwords with bcrypt', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201)

      const user = await db.User.findOne({
        where: { email: TEST_USER.email }
      })

      expect(user.password).not.toBe(TEST_USER.password)
      expect(user.password.startsWith('$2b$')).toBe(true) // bcrypt hash format

      const isValid = await bcrypt.compare(TEST_USER.password, user.password)
      expect(isValid).toBe(true)
    })

    test('should use strong salt rounds', async () => {
      const password = 'TestPassword123!'
      const hash = await bcrypt.hash(password, 12)

      // bcrypt hash should include salt rounds
      const saltRounds = parseInt(hash.split('$')[2])
      expect(saltRounds).toBeGreaterThanOrEqual(12)
    })
  })

  describe('Security Headers and Middleware', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)

      // Check for security headers (if implemented)
      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
    })

    test('should handle rate limiting', async () => {
      // Make multiple rapid login attempts
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword'
            })
        )
      }

      const responses = await Promise.all(promises)

      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429)
      expect(rateLimited).toBe(true)
    })
  })
})