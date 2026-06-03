const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

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
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')

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

function buildSeedRows(cruiseData) {
  const cruiseLineRows = []
  const shipRows = []
  const sailingRows = []
  const itineraryDayRows = []
  const activityRows = []
  const customerRows = []
  const bookingRows = []
  const bookingPassengerRows = []
  const demoUserRows = []
  const sailingIdBySeedKey = new Map()

  for (const cruiseLine of cruiseData.cruiseLines || []) {
    const cruiseLineId = randomUUID()

    cruiseLineRows.push({
      id: cruiseLineId,
      name: cruiseLine.name,
      country: cruiseLine.country,
      website: cruiseLine.website,
      brandFamily: cruiseLine.brandFamily,
      brandTheme: cruiseLine.brandTheme,
      marketPositioning: cruiseLine.marketPositioning
    })

    for (const ship of cruiseLine.ships || []) {
      const shipId = randomUUID()

      shipRows.push({
        id: shipId,
        name: ship.name,
        currentPort: ship.currentPort,
        cruiseLineId
      })

      for (const sailing of ship.sailings || []) {
        const sailingId = randomUUID()

        sailingIdBySeedKey.set(`${ship.name}|${sailing.departureDate}`, sailingId)
        sailingRows.push({
          id: sailingId,
          shipId,
          departureDate: sailing.departureDate,
          port: sailing.port || sailing.departurePort,
          departurePort: sailing.departurePort || sailing.port,
          arrivalPort: sailing.arrivalPort || sailing.port,
          days: sailing.days,
          isRepositioning: Boolean(sailing.isRepositioning)
        })

        for (const itineraryDay of sailing.itinerary || []) {
          const itineraryDayId = randomUUID()

          itineraryDayRows.push({
            id: itineraryDayId,
            sailingId,
            day: itineraryDay.day,
            title: itineraryDay.title,
            port: itineraryDay.port
          })

          for (const activity of itineraryDay.activitySchedule || []) {
            activityRows.push({
              id: randomUUID(),
              itineraryDayId,
              time: activity.time,
              activity: activity.activity
            })
          }
        }
      }
    }
  }

  for (const customer of cruiseData.customers || []) {
    customerRows.push({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      loyaltyNumber: customer.loyaltyNumber
    })
  }

  for (const booking of cruiseData.bookings || []) {
    const sailingId = booking.sailingId || sailingIdBySeedKey.get(`${booking.shipName}|${booking.departureDate}`)

    if (!sailingId) {
      throw new Error(`Unable to resolve sailing for booking ${booking.id}`)
    }

    bookingRows.push({
      id: booking.id,
      sailingId,
      bookingStatus: booking.bookingStatus,
      cabinNumber: booking.cabinNumber,
      fareCode: booking.fareCode,
      embarkationPort: booking.embarkationPort,
      debarkationPort: booking.debarkationPort,
      createdByCustomerId: booking.createdByCustomerId
    })

    for (const passenger of booking.passengers || []) {
      bookingPassengerRows.push({
        id: `${booking.id}-${passenger.customerId}`,
        bookingId: booking.id,
        customerId: passenger.customerId,
        passengerRole: passenger.passengerRole,
        isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
        diningPreference: passenger.diningPreference,
        accessibilityNotes: passenger.accessibilityNotes,
        boardingGroup: passenger.boardingGroup
      })
    }
  }

  for (const demoUser of cruiseData.demoUsers || []) {
    demoUserRows.push({
      id: demoUser.id,
      displayName: demoUser.displayName,
      role: demoUser.role,
      customerId: demoUser.customerId
    })
  }

  return {
    cruiseLineRows,
    shipRows,
    sailingRows,
    itineraryDayRows,
    activityRows,
    customerRows,
    bookingRows,
    bookingPassengerRows,
    demoUserRows
  }
}

async function loadCruiseData() {
  const cruiseData = readCruiseSeedData()
  const rows = buildSeedRows(cruiseData)

  await db.transaction(async tx => {
    await tx.delete(demoUserTable)
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
    await insertRows(tx, bookingTable, rows.bookingRows)
    await insertRows(tx, bookingPassengerTable, rows.bookingPassengerRows)
    await insertRows(tx, demoUserTable, rows.demoUserRows)
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
    source: 'data/cruise.json'
  }
}

module.exports = loadCruiseData
