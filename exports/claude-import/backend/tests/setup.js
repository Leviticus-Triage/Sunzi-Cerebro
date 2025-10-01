/**
 * Jest Test Setup
 * Sunzi Cerebro Backend - Global Test Configuration
 */

import { jest } from '@jest/globals'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.DB_STORAGE = ':memory:'
process.env.LOG_LEVEL = 'error'

// Global test timeout
jest.setTimeout(30000)

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  mockJWT: 'test-jwt-token-mock',
  mockUser: {
    id: 1,
    email: 'test@sunzi-cerebro.com',
    name: 'Test User',
    role: 'admin',
    organizationId: 1
  }
}

export default {}