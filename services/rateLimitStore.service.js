const { pool } = require('../db')

const DEFAULT_MAX_MEMORY_BUCKETS = 10000
const DEFAULT_PRUNE_INTERVAL_MS = 60 * 1000

function createMemoryRateLimitStore({ maxBuckets = DEFAULT_MAX_MEMORY_BUCKETS } = {}) {
  const buckets = new Map()

  function prune(now) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
    while (buckets.size > maxBuckets) buckets.delete(buckets.keys().next().value)
  }

  return {
    type: 'memory',
    consume({ key, now, windowMs }) {
      let bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs }
        buckets.set(key, bucket)
      }
      bucket.count += 1
      if (bucket.count === 1 || buckets.size > maxBuckets) prune(now)
      return { ...bucket }
    }
  }
}

function createDatabaseRateLimitStore({ query = pool.query.bind(pool), pruneIntervalMs = DEFAULT_PRUNE_INTERVAL_MS } = {}) {
  let lastPruneAt = 0

  async function pruneExpired(now) {
    if (now - lastPruneAt < pruneIntervalMs) return
    lastPruneAt = now
    await query('DELETE FROM rate_limit_buckets WHERE "resetAt" <= $1', [new Date(now)])
  }

  return {
    type: 'database',
    async consume({ key, now, windowMs }) {
      const requestTime = new Date(now)
      const nextResetAt = new Date(now + windowMs)
      const result = await query(`
        INSERT INTO rate_limit_buckets ("bucketKey", "requestCount", "resetAt", "updatedAt")
        VALUES ($1, 1, $2, $3)
        ON CONFLICT ("bucketKey") DO UPDATE SET
          "requestCount" = CASE
            WHEN rate_limit_buckets."resetAt" <= $3 THEN 1
            ELSE rate_limit_buckets."requestCount" + 1
          END,
          "resetAt" = CASE
            WHEN rate_limit_buckets."resetAt" <= $3 THEN EXCLUDED."resetAt"
            ELSE rate_limit_buckets."resetAt"
          END,
          "updatedAt" = $3
        RETURNING "requestCount", "resetAt"
      `, [key, nextResetAt, requestTime])

      await pruneExpired(now)
      const row = result.rows[0]
      return { count: Number(row.requestCount), resetAt: new Date(row.resetAt).getTime() }
    }
  }
}

const memoryStore = createMemoryRateLimitStore()
const databaseStore = createDatabaseRateLimitStore()

function getRateLimitStore() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
    ? databaseStore
    : memoryStore
}

module.exports = {
  DEFAULT_MAX_MEMORY_BUCKETS,
  DEFAULT_PRUNE_INTERVAL_MS,
  createMemoryRateLimitStore,
  createDatabaseRateLimitStore,
  getRateLimitStore
}
