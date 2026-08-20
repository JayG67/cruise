const fs = require('fs')
const path = require('path')
const db = require('../db')
const initializeDatabase = require('./initializeDatabase.service')
const loadCruiseData = require('./loadCruiseData.service')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const demoUserTable = require('../models/demoUser.model')
const appUserTable = require('../models/appUser.model')
const appRoleTable = require('../models/appRole.model')
const appUserRoleTable = require('../models/appUserRole.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')

const BUSINESS_TABLES = Object.freeze([
  cruiseLineTable,
  shipTable,
  sailingTable,
  customerTable,
  bookingTable,
  turnaroundOperationTable
])

const PORTFOLIO_ANCHOR_TABLES = Object.freeze([
  customerTable,
  bookingTable,
  demoUserTable,
  appUserTable,
  appRoleTable,
  appUserRoleTable
])

const SEED_FILE_PATH = path.join(__dirname, '..', 'data', 'cruise.json')

function readCanonicalCruiseLineNames() {
  const cruiseData = JSON.parse(fs.readFileSync(SEED_FILE_PATH, 'utf-8'))
  return (cruiseData.cruiseLines || [])
    .map(cruiseLine => String(cruiseLine?.name || '').trim())
    .filter(Boolean)
    .sort()
}

const CANONICAL_CRUISE_LINE_NAMES = Object.freeze(readCanonicalCruiseLineNames())

async function readFirstRow(dbClient, table, selection = { id: table.id }) {
  const rows = await dbClient.select(selection).from(table).limit(1)
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

async function hasAnyBusinessData(dbClient = db) {
  for (const table of BUSINESS_TABLES) {
    if (await readFirstRow(dbClient, table)) return true
  }

  return false
}

async function hasAnyPortfolioAnchorData(dbClient = db) {
  for (const table of PORTFOLIO_ANCHOR_TABLES) {
    if (await readFirstRow(dbClient, table)) return true
  }

  return false
}

async function hasCanonicalCruiseLineReferenceSet(dbClient = db) {
  const rows = await dbClient.select({ name: cruiseLineTable.name }).from(cruiseLineTable)
  if (!Array.isArray(rows) || rows.length !== CANONICAL_CRUISE_LINE_NAMES.length) return false

  const actualNames = rows
    .map(row => String(row?.name || '').trim())
    .filter(Boolean)
    .sort()

  return actualNames.length === CANONICAL_CRUISE_LINE_NAMES.length
    && actualNames.every((name, index) => name === CANONICAL_CRUISE_LINE_NAMES[index])
}

async function getProductionDemoBootstrapState(dbClient = db) {
  const hasBusinessData = await hasAnyBusinessData(dbClient)
  if (!hasBusinessData) return 'empty'

  if (await hasAnyPortfolioAnchorData(dbClient)) return 'populated'

  if (await hasCanonicalCruiseLineReferenceSet(dbClient)) return 'incomplete-demo-reference-only'

  return 'populated'
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

  const state = await getProductionDemoBootstrapState(dbClient)
  if (state === 'populated') {
    return {
      seeded: false,
      reason: 'database-not-empty'
    }
  }

  const counts = await seed()

  return {
    seeded: true,
    reason: state === 'empty' ? 'empty-database-bootstrap' : 'incomplete-demo-repair',
    counts
  }
}

module.exports = {
  BUSINESS_TABLES,
  CANONICAL_CRUISE_LINE_NAMES,
  PORTFOLIO_ANCHOR_TABLES,
  bootstrapProductionDemoData,
  getProductionDemoBootstrapState,
  hasAnyBusinessData,
  hasAnyPortfolioAnchorData,
  hasCanonicalCruiseLineReferenceSet
}
