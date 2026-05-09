require('dotenv/config')

const { drizzle } = require('drizzle-orm/node-postgres')
const { Pool } = require('pg')

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:password@localhost:5432/cruise'

const pool = new Pool({
  connectionString
})

const db = drizzle(pool)

module.exports = db
module.exports.pool = pool