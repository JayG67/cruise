const db = require('../db')
const initializeDatabase = require('./initializeDatabase.service')
const loadCruiseData = require('./loadCruiseData.service')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')

const BUSINESS_TABLES = Object.freeze([
  cruiseLineTable,
  shipTable,
  sailingTable,
  customerTable,
  bookingTable,
  turnaroundOperationTable
])

async function hasAnyBusinessData(dbClient = db) {
  for (const table of BUSINESS_TABLES) {
    const rows = await dbClient.select({ id: table.id }).from(table).limit(1)
    if (Array.isArray(rows) && rows.length > 0) return true
  }

  return false
}

async function bootstrapProductionDemoData({
  confirmed = false,
  dbClient = db,
  initialize = initializeDatabase,
  seed = loadCruiseData
} = {}) {
  if (!confirmed) {
    const error = new Error('Production demo bootstrap requires explicit --demo-if-empty confirmation.')
    error.code = 'PRODUCTION_DEMO_BOOTSTRAP_CONFIRMATION_REQUIRED'
    throw error
  }

  await initialize()

  if (await hasAnyBusinessData(dbClient)) {
    return {
      seeded: false,
      reason: 'database-not-empty'
    }
  }

  const counts = await seed()

  return {
    seeded: true,
    reason: 'empty-database-bootstrap',
    counts
  }
}

module.exports = {
  BUSINESS_TABLES,
  bootstrapProductionDemoData,
  hasAnyBusinessData
}
