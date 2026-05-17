const mockDrizzle = jest.fn(pool => ({ pool, query: {} }))
const mockPoolEnd = jest.fn()

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockDrizzle
}))

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(config => ({
    config,
    ended: false,
    end: mockPoolEnd
  }))
}))

describe('db/index', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockPoolEnd.mockResolvedValue(undefined)
    delete process.env.DATABASE_URL
  })

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl
    }
  })

  it('creates a Postgres pool using the default local database URL when DATABASE_URL is not set', () => {
    const db = require('../../../db')
    const { Pool } = require('pg')

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://postgres:password@127.0.0.1:5433/cruise'
    })
    expect(mockDrizzle).toHaveBeenCalledWith(db.pool)
    expect(db.connectionString).toBe('postgres://postgres:password@127.0.0.1:5433/cruise')
  })

  it('creates a Postgres pool using DATABASE_URL when it is set', () => {
    process.env.DATABASE_URL = 'postgres://test-user:test-password@localhost:5432/test-cruise'

    const db = require('../../../db')
    const { Pool } = require('pg')

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://test-user:test-password@localhost:5432/test-cruise'
    })
    expect(mockDrizzle).toHaveBeenCalledWith(db.pool)
    expect(db.connectionString).toBe('postgres://test-user:test-password@localhost:5432/test-cruise')
  })

  it('exports the pool, connection string, and closePool helper on the db object', () => {
    const db = require('../../../db')

    expect(db.pool).toBeDefined()
    expect(db.connectionString).toBeDefined()
    expect(typeof db.closePool).toBe('function')
  })

  it('closes the Postgres pool when closePool is called and the pool is open', async () => {
    const db = require('../../../db')

    await db.closePool()

    expect(mockPoolEnd).toHaveBeenCalledTimes(1)
  })

  it('does not attempt to close the Postgres pool when it has already ended', async () => {
    const db = require('../../../db')
    db.pool.ended = true

    await db.closePool()

    expect(mockPoolEnd).not.toHaveBeenCalled()
  })
})
