const fs = require('fs')
const path = require('path')
const { buildSeedRows } = require('./cruiseSeedRows.service')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const demoUserTable = require('../models/demoUser.model')
const appUserTable = require('../models/appUser.model')
const appRoleTable = require('../models/appRole.model')
const appUserRoleTable = require('../models/appUserRole.model')
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')
const customerPreCruiseChecklistTable = require('../models/customerPreCruiseChecklist.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundTaskUpdateTable = require('../models/turnaroundTaskUpdate.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundStaffingTable = require('../models/turnaroundStaffing.model')
const turnaroundTaskDependencyTable = require('../models/turnaroundTaskDependency.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')

const SEED_FILE_PATH = path.join(__dirname, '..', 'data', 'cruise.json')
const INSERT_CHUNK_SIZE = 500

let cachedCruiseData

function readCruiseSeedData() {
  if (!cachedCruiseData) {
    const fileContents = fs.readFileSync(SEED_FILE_PATH, 'utf-8')
    cachedCruiseData = JSON.parse(fileContents)
  }

  return cachedCruiseData
}


async function insertRows(tx, table, rows) {
  if (!rows.length) return 0

  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    await tx.insert(table).values(rows.slice(index, index + INSERT_CHUNK_SIZE))
  }

  return rows.length
}

async function performLoadCruiseData() {
  const cruiseData = readCruiseSeedData()
  const rows = buildSeedRows(cruiseData)

  await db.transaction(async tx => {
    await tx.delete(demoUserTable)
    await tx.delete(appUserRoleTable)
    await tx.delete(appUserTable)
    await tx.delete(appRoleTable)
    await tx.delete(turnaroundTaskUpdateTable)
    await tx.delete(turnaroundEscalationTable)
    await tx.delete(turnaroundTaskDependencyTable)
    await tx.delete(turnaroundHandoffTable)
    await tx.delete(turnaroundStaffingTable)
    await tx.delete(turnaroundSignoffTable)
    await tx.delete(turnaroundTaskTable)
    await tx.delete(turnaroundOperationTable)
    await tx.delete(customerPreCruiseChecklistTable)
    await tx.delete(customerItineraryFavoriteTable)
    await tx.delete(bookingPassengerTable)
    await tx.delete(bookingTable)
    await tx.delete(customerTable)
    await tx.delete(activityScheduleTable)
    await tx.delete(itineraryDayTable)
    await tx.delete(sailingTable)
    await tx.delete(shipTable)
    await tx.delete(cruiseLineTable)

    await insertRows(tx, cruiseLineTable, rows.cruiseLineRows)
    await insertRows(tx, shipTable, rows.shipRows)
    await insertRows(tx, sailingTable, rows.sailingRows)
    await insertRows(tx, itineraryDayTable, rows.itineraryDayRows)
    await insertRows(tx, activityScheduleTable, rows.activityRows)
    await insertRows(tx, customerTable, rows.customerRows)
    await insertRows(tx, appRoleTable, rows.appRoleRows)
    await insertRows(tx, appUserTable, rows.appUserRows)
    await insertRows(tx, appUserRoleTable, rows.appUserRoleRows)
    await insertRows(tx, bookingTable, rows.bookingRows)
    await insertRows(tx, bookingPassengerTable, rows.bookingPassengerRows)
    await insertRows(tx, demoUserTable, rows.demoUserRows)
    await insertRows(tx, turnaroundOperationTable, rows.turnaroundOperationRows)
    await insertRows(tx, turnaroundTaskTable, rows.turnaroundTaskRows)
    await insertRows(tx, turnaroundTaskUpdateTable, rows.turnaroundTaskUpdateRows)
    await insertRows(tx, turnaroundSignoffTable, rows.turnaroundSignoffRows)
    await insertRows(tx, turnaroundEscalationTable, rows.turnaroundEscalationRows)
    await insertRows(tx, turnaroundStaffingTable, rows.turnaroundStaffingRows)
    await insertRows(tx, turnaroundTaskDependencyTable, rows.turnaroundTaskDependencyRows)
    await insertRows(tx, turnaroundHandoffTable, rows.turnaroundHandoffRows)
  })

  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Cruise seed data reset from data/cruise.json')
  }

  return {
    cruiseLineCount: rows.cruiseLineRows.length,
    shipCount: rows.shipRows.length,
    sailingCount: rows.sailingRows.length,
    itineraryDayCount: rows.itineraryDayRows.length,
    activityCount: rows.activityRows.length,
    customerCount: rows.customerRows.length,
    bookingCount: rows.bookingRows.length,
    bookingPassengerCount: rows.bookingPassengerRows.length,
    demoUserCount: rows.demoUserRows.length,
    appUserCount: rows.appUserRows.length,
    appRoleCount: rows.appRoleRows.length,
    appUserRoleCount: rows.appUserRoleRows.length,
    turnaroundOperationCount: rows.turnaroundOperationRows.length,
    turnaroundTaskCount: rows.turnaroundTaskRows.length,
    turnaroundTaskUpdateCount: rows.turnaroundTaskUpdateRows.length,
    turnaroundSignoffCount: rows.turnaroundSignoffRows.length,
    turnaroundEscalationCount: rows.turnaroundEscalationRows.length,
    turnaroundStaffingCount: rows.turnaroundStaffingRows.length,
    turnaroundTaskDependencyCount: rows.turnaroundTaskDependencyRows.length,
    turnaroundHandoffCount: rows.turnaroundHandoffRows.length,
    source: 'data/cruise.json'
  }
}

let activeSeedLoadPromise = null

async function loadCruiseData() {
  if (!activeSeedLoadPromise) {
    activeSeedLoadPromise = performLoadCruiseData().finally(() => {
      activeSeedLoadPromise = null
    })
  }

  return activeSeedLoadPromise
}

module.exports = loadCruiseData
