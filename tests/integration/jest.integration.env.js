process.env.NODE_ENV = 'test'

const defaultLocalTestDatabaseUrl = 'postgres://postgres:password@127.0.0.1:5433/cruise'

// Integration tests use a dedicated test database URL so local developer
// shell variables and production DATABASE_URL values cannot accidentally
// hijack the test run.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  defaultLocalTestDatabaseUrl
