module.exports = {
  testEnvironment: 'node',

  setupFiles: ['<rootDir>/tests/setup/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  modulePathIgnorePatterns: [
    '<rootDir>/github-pages',
    '<rootDir>/playwright-report',
    '<rootDir>/test-results'
  ],

  testPathIgnorePatterns: [
    '<rootDir>/playwright/'
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/github-pages',
    '<rootDir>/playwright/',
    '<rootDir>/tests/',
    '<rootDir>/models/'
  ],
  testTimeout: 30000
}
