/**
 * Jest Configuration for E2E Tests Only
 * Simplified configuration for end-to-end testing
 */

export default {
  // Test environment
  testEnvironment: 'node',

  // ES Module support
  preset: null,
  transform: {},

  // Test file patterns - only E2E tests
  testMatch: [
    '**/tests/e2e.test.js'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test-reports/',
    '/logs/',
    '/data/',
    '/exports/',
    '/backups/'
  ],

  // Test timeout for E2E tests
  testTimeout: 60000,

  // Simple reporters only
  reporters: ['default'],

  // Verbose output
  verbose: true,

  // Error handling
  errorOnDeprecated: false,

  // Clean up
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Performance options
  maxWorkers: 1, // Run E2E tests sequentially

  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ]
};