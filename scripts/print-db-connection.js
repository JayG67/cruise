require('../tests/integration/jest.integration.env')

const db = require('../db')

console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('INTEGRATION_DATABASE_URL:', process.env.INTEGRATION_DATABASE_URL)
console.log('Resolved connectionString:', db.connectionString)

db.pool.end()
