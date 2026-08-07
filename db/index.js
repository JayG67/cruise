require('../config/loadEnvironment').loadEnvironment()

const { drizzle } = require('drizzle-orm/node-postgres')
const { Pool } = require('pg')

const defaultLocalDatabaseUrl = 'postgres://postgres:password@127.0.0.1:5433/cruise'

const connectionString =
  process.env.DATABASE_URL ||
  defaultLocalDatabaseUrl

const pool = new Pool({
  connectionString
})

const db = drizzle(pool)

module.exports = db
module.exports.pool = pool
module.exports.connectionString = connectionString


module.exports.closePool = async function closePool() {
  if (pool.ended) {
    return
  }

  await pool.end()
}
