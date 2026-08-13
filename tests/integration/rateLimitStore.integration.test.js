const initializeDatabase = require('../../services/initializeDatabase.service')
const { pool } = require('../../db')
const { createDatabaseRateLimitStore } = require('../../services/rateLimitStore.service')

const prefix = `integration-${Date.now()}-`

beforeAll(async () => {
  await initializeDatabase()
  await pool.query('DELETE FROM rate_limit_buckets WHERE "bucketKey" LIKE $1', [`${prefix}%`])
})

afterAll(async () => {
  if (!pool.ended) await pool.query('DELETE FROM rate_limit_buckets WHERE "bucketKey" LIKE $1', [`${prefix}%`])
})

describe('shared PostgreSQL rate-limit store integration', () => {
  it('shares counters across independent store instances', async () => {
    const firstStore = createDatabaseRateLimitStore({ pruneIntervalMs: Number.MAX_SAFE_INTEGER })
    const secondStore = createDatabaseRateLimitStore({ pruneIntervalMs: Number.MAX_SAFE_INTEGER })
    const key = `${prefix}shared`
    const now = Date.now()

    await expect(firstStore.consume({ key, now, windowMs: 60000 })).resolves.toEqual(expect.objectContaining({ count: 1 }))
    await expect(secondStore.consume({ key, now: now + 1, windowMs: 60000 })).resolves.toEqual(expect.objectContaining({ count: 2 }))
  })

  it('keeps concurrent increments atomic and resets expired buckets', async () => {
    const store = createDatabaseRateLimitStore({ pruneIntervalMs: Number.MAX_SAFE_INTEGER })
    const key = `${prefix}atomic`
    const now = Date.now()
    const results = await Promise.all(Array.from({ length: 12 }, (_, index) => (
      store.consume({ key, now: now + index, windowMs: 60000 })
    )))

    expect(results.map(result => result.count).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    await pool.query('UPDATE rate_limit_buckets SET "resetAt" = NOW() - INTERVAL \'1 second\' WHERE "bucketKey" = $1', [key])
    await expect(store.consume({ key, now: Date.now(), windowMs: 60000 })).resolves.toEqual(expect.objectContaining({ count: 1 }))
  })
})
