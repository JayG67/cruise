process.env.NODE_ENV = 'test'
require('../tests/integration/jest.integration.env')

const db = require('../db')
const { sql } = require('drizzle-orm')

const maxAttempts = Number(process.env.TEST_DB_READY_ATTEMPTS || 30)
const delayMs = Number(process.env.TEST_DB_READY_DELAY_MS || 1000)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function redactConnectionString(connectionString) {
  return String(connectionString || '').replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')
}

async function waitForTestDatabase() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await db.execute(sql`
        SELECT
          current_user AS current_user,
          current_database() AS current_database,
          inet_server_port() AS server_port;
      `)

      const row = result.rows ? result.rows[0] : result[0]

      console.log('Test database is ready.')
      console.log(`Resolved connection string: ${redactConnectionString(db.connectionString)}`)
      console.log(`Current user: ${row.current_user}`)
      console.log(`Current database: ${row.current_database}`)
      console.log(`Server port: ${row.server_port}`)
      return
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts

      console.log(`Waiting for test database on attempt ${attempt}/${maxAttempts}...`)

      if (isLastAttempt) {
        console.error('Test database did not become ready in time.')
        console.error(error)
        process.exitCode = 1
        return
      }

      await sleep(delayMs)
    }
  }
}

waitForTestDatabase()
  .finally(async () => {
    await db.pool.end()
  })
