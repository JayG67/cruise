module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.integration.setup.js']
}