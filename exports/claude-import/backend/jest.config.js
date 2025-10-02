/**
 * Jest Configuration for Sunzi Cerebro Backend Test Suite
 * Production-Ready Testing Configuration with Coverage and Reporting
 */

export default {
  // Test environment configuration
  testEnvironment: 'node',

  // ES Module support
  preset: null,
  globals: {
    'ts-jest': {
      useESM: true
    }
  },

  transform: {
    '^.+\\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
  },

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
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

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],

  // Coverage collection
  collectCoverageFrom: [
    'server.js',
    'routes/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/test-reports/**',
    '!**/tests/**',
    '!**/logs/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    },
    './services/': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    './routes/': {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-reports',
        outputName: 'junit.xml',
        suiteName: 'Sunzi Cerebro Backend Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    [
      'jest-html-reporter',
      {
        outputPath: 'test-reports/test-report.html',
        pageTitle: 'Sunzi Cerebro Backend Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
        theme: 'darkTheme'
      }
    ]
  ],

  // Verbose output
  verbose: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance options
  maxWorkers: '50%',

  // Clean up
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Global setup/teardown
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],

  // Watch plugins - disabled for compatibility
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ],

  // Snapshot configuration
  snapshotSerializers: [],

  // Custom matchers - already defined above
  // setupFilesAfterEnv: [
  //   '<rootDir>/tests/setup.js'
  // ]
}