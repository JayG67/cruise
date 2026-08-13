module.exports = {
  testEnvironment: 'node',

  setupFiles: ['<rootDir>/tests/setup/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  modulePathIgnorePatterns: [
    '<rootDir>/github-pages',
    '<rootDir>/playwright-report',
    '<rootDir>/test-results',
    '<rootDir>/.github'
  ],

  testPathIgnorePatterns: [
    '<rootDir>/playwright/',
    '<rootDir>/validation/.*\\.test\\.js$'
  ],

  coverageReporters: [
    'json',
    'json-summary',
    'lcov',
    'cobertura',
    'clover',
    'text',
    'text-summary'
  ],

  coverageThreshold: {
    global: {
      statements: 90.5,
      branches: 65.5,
      functions: 94.5,
      lines: 92.25
    }
  },

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/github-pages',
    '<rootDir>/playwright/',
    '<rootDir>/tests/',
    '<rootDir>/models/'
  ],
  testTimeout: 30000
}
