process.env.NODE_ENV = 'test'
require('../tests/integration/jest.integration.env')

const db = require('../db')
const { sql } = require('drizzle-orm')

async function verifyTestDatabaseConnection() {
  try {
    const result = await db.execute(sql`
      SELECT
        current_user AS current_user,
        current_database() AS current_database,
        inet_server_addr() AS server_address,
        inet_server_port() AS server_port;
    `)

    const row = result.rows ? result.rows[0] : result[0]

    console.log('Test database connection verified.')
    console.log(`Resolved connection string: ${db.connectionString}`)
    console.log(`Current user: ${row.current_user}`)
    console.log(`Current database: ${row.current_database}`)
    console.log(`Server address: ${row.server_address}`)
    console.log(`Server port: ${row.server_port}`)
  } catch (err) {
    console.error('Test database connection failed.')
    console.error(err)
    process.exitCode = 1
  } finally {
    await db.pool.end()
  }
}

verifyTestDatabaseConnection()
