/**
 * Jest Configuration for Sunzi Cerebro Enterprise
 * Comprehensive testing setup for unit, integration, and e2e tests
 */

export default {
  // Test environment
  testEnvironment: 'node',

  // ES6 module support
  preset: 'jest',
  transform: {
    '^.+\\.js$': ['@babel/preset-env', { targets: { node: 'current' } }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|@babel/runtime)/)'
  ],

  // Module settings
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],

  // Test directories
  roots: [
    '<rootDir>/tests',
    '<rootDir>/'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/dist/',
    '/logs/',
    '/data/',
    '/exports/',
    '/backups/'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!babel.config.js'
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  bail: false,
  errorOnDeprecated: true,

  // Watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/data/',
    '/exports/',
    '/backups/'
  ],

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage',
        outputName: 'junit.xml',
        suiteName: 'Sunzi Cerebro Enterprise Tests'
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/coverage',
        filename: 'report.html',
        pageTitle: 'Sunzi Cerebro Test Report',
        expand: true
      }
    ]
  ],

  // Test categories
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 60000
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 120000
    }
  ],

  // Mock configuration
  moduleFileExtensions: ['js', 'json', 'node'],

  // Performance
  maxWorkers: '50%',
  maxConcurrency: 5,

  // Snapshot settings
  updateSnapshot: false,

  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',

  // Custom matchers (integrated with existing setup)
  // setupFilesAfterEnv: ['jest-extended/all'],  // Merged into main setupFilesAfterEnv above

  // Environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};