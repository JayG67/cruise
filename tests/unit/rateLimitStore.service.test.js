const {
  createMemoryRateLimitStore,
  createDatabaseRateLimitStore,
  getRateLimitStore
} = require('../../services/rateLimitStore.service')

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('rate limit store', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => restoreEnv('NODE_ENV', originalNodeEnv))

  it('keeps deterministic bounded counters in the non-production memory store', () => {
    const store = createMemoryRateLimitStore({ maxBuckets: 2 })
    expect(store.consume({ key: 'a', now: 1000, windowMs: 100 })).toEqual({ count: 1, resetAt: 1100 })
    expect(store.consume({ key: 'a', now: 1050, windowMs: 100 })).toEqual({ count: 2, resetAt: 1100 })
    expect(store.consume({ key: 'a', now: 1100, windowMs: 100 })).toEqual({ count: 1, resetAt: 1200 })
    store.consume({ key: 'b', now: 1100, windowMs: 100 })
    store.consume({ key: 'c', now: 1100, windowMs: 100 })
    expect(store.consume({ key: 'c', now: 1101, windowMs: 100 }).count).toBe(2)
  })

  it('uses an atomic PostgreSQL upsert and periodically prunes expired shared buckets', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ requestCount: '3', resetAt: new Date(5000) }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ requestCount: '4', resetAt: new Date(5000) }] })

    const store = createDatabaseRateLimitStore({ query, pruneIntervalMs: 1000 })
    await expect(store.consume({ key: 'general:user:U1', now: 1000, windowMs: 4000 })).resolves.toEqual({ count: 3, resetAt: 5000 })
    await expect(store.consume({ key: 'general:user:U1', now: 1500, windowMs: 4000 })).resolves.toEqual({ count: 4, resetAt: 5000 })

    expect(query.mock.calls[0][0]).toContain('ON CONFLICT ("bucketKey") DO UPDATE')
    expect(query.mock.calls[0][0]).toContain('rate_limit_buckets."requestCount" + 1')
    expect(query.mock.calls[0][1][0]).toBe('general:user:U1')
    expect(query.mock.calls[1][0]).toContain('DELETE FROM rate_limit_buckets')
    expect(query).toHaveBeenCalledTimes(3)
  })

  it('selects PostgreSQL storage only in production and memory elsewhere', () => {
    process.env.NODE_ENV = 'test'
    expect(getRateLimitStore().type).toBe('memory')
    process.env.NODE_ENV = 'development'
    expect(getRateLimitStore().type).toBe('memory')
    process.env.NODE_ENV = 'production'
    expect(getRateLimitStore().type).toBe('database')
  })
})
