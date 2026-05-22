require('../tests/integration/jest.integration.env')

const db = require('../db')

function redactConnectionString(connectionString) {
  return String(connectionString || '').replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')
}

console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL:', redactConnectionString(process.env.DATABASE_URL))
console.log('INTEGRATION_DATABASE_URL:', redactConnectionString(process.env.INTEGRATION_DATABASE_URL))
console.log('Resolved connectionString:', redactConnectionString(db.connectionString))

db.pool.end()
