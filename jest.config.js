module.exports = {
  testEnvironment: 'node',

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
    '<rootDir>/playwright/'
  ]
}