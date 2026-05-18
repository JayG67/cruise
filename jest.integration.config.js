module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/integration/jest.integration.env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.integration.setup.js'],
  testTimeout: 30000
}
