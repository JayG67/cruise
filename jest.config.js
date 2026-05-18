module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setup/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  modulePathIgnorePatterns: [
    '<rootDir>/.github',
    '<rootDir>/github-pages',
    '<rootDir>/playwright-report',
    '<rootDir>/test-results'
  ],

  testPathIgnorePatterns: [
    '<rootDir>/playwright/'
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.github',
    '<rootDir>/github-pages',
    '<rootDir>/playwright/'
  ]
}
