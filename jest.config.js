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

  coverageThreshold: {
    global: {
      statements: 90,
      branches: 65,
      functions: 94,
      lines: 92
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
