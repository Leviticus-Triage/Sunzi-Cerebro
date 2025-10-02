/**
 * Jest Global Setup
 * Sunzi Cerebro Backend - Test Suite Global Initialization
 */

export default async function globalSetup() {
  console.log('🚀 Initializing Sunzi Cerebro Backend Test Suite...')

  // Set global test environment
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
  process.env.DB_STORAGE = ':memory:'
  process.env.LOG_LEVEL = 'error'
  process.env.MCP_DATABASE_SERVER_PORT = '3001'

  // Global test start time
  global.__TEST_START_TIME__ = Date.now()

  console.log('✅ Global test setup completed')
}