const { sql } = require('drizzle-orm')

async function provisionRateLimitStore(db) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      "bucketKey" varchar(255) PRIMARY KEY,
      "requestCount" integer NOT NULL DEFAULT 0 CHECK ("requestCount" >= 0),
      "resetAt" timestamptz NOT NULL,
      "updatedAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_reset_at
    ON rate_limit_buckets("resetAt");
  `)
}

module.exports = provisionRateLimitStore
