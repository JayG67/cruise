process.env.NODE_ENV = 'test'

const defaultLocalTestDatabaseUrl = 'postgres://postgres:password@127.0.0.1:5433/cruise'

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  defaultLocalTestDatabaseUrl
