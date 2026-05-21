const fs = require('fs')
const path = require('path')

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

let cachedCruiseData

function readCruiseSeedData() {
  if (!cachedCruiseData) {
    const fileContents = fs.readFileSync(SEED_FILE_PATH, 'utf-8')
    cachedCruiseData = JSON.parse(fileContents)
  }

  return cachedCruiseData
}

async function insertRows(tx, table, rows) {
  if (!rows.length) return []

  return tx.insert(table).values(rows).returning()
}

async function loadCruiseData() {
  let cruiseLineCount = 0
  let shipCount = 0
  let sailingCount = 0
  let itineraryDayCount = 0
  let activityCount = 0
  let customerCount = 0
  let bookingCount = 0
  let bookingPassengerCount = 0
  let demoUserCount = 0

  const cruiseData = readCruiseSeedData()
  const sailingIdBySeedKey = new Map()

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

    for (const cruiseLine of cruiseData.cruiseLines || []) {
      const insertedCruiseLines = await tx
        .insert(cruiseLineTable)
        .values({
          name: cruiseLine.name,
          country: cruiseLine.country,
          website: cruiseLine.website
        })
        .returning({ id: cruiseLineTable.id })

      const cruiseLineId = insertedCruiseLines[0].id
      cruiseLineCount += 1

      for (const ship of cruiseLine.ships || []) {
        const insertedShips = await tx
          .insert(shipTable)
          .values({
            name: ship.name,
            currentPort: ship.currentPort,
            cruiseLineId
          })
          .returning({ id: shipTable.id })

        const shipId = insertedShips[0].id
        shipCount += 1

        for (const sailing of ship.sailings || []) {
          const insertedSailings = await tx
            .insert(sailingTable)
            .values({
              shipId,
              departureDate: sailing.departureDate,
              port: sailing.port || sailing.departurePort,
              departurePort: sailing.departurePort || sailing.port,
              arrivalPort: sailing.arrivalPort || sailing.port,
              days: sailing.days,
              isRepositioning: Boolean(sailing.isRepositioning)
            })
            .returning({ id: sailingTable.id })

          const sailingId = insertedSailings[0].id
          sailingIdBySeedKey.set(`${ship.name}|${sailing.departureDate}`, sailingId)
          sailingCount += 1

          const itineraryRows = (sailing.itinerary || []).map(itineraryDay => ({
            sailingId,
            day: itineraryDay.day,
            title: itineraryDay.title,
            port: itineraryDay.port
          }))

          const insertedItineraryDays = await insertRows(tx, itineraryDayTable, itineraryRows)
          itineraryDayCount += insertedItineraryDays.length

          const activityRows = []

          insertedItineraryDays.forEach((insertedItineraryDay, index) => {
            const sourceItineraryDay = sailing.itinerary[index]

            for (const activity of sourceItineraryDay.activitySchedule || []) {
              activityRows.push({
                itineraryDayId: insertedItineraryDay.id,
                time: activity.time,
                activity: activity.activity
              })
            }
          })

          await insertRows(tx, activityScheduleTable, activityRows)
          activityCount += activityRows.length
        }
      }
    }

    const customerRows = (cruiseData.customers || []).map(customer => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      loyaltyNumber: customer.loyaltyNumber
    }))

    await insertRows(tx, customerTable, customerRows)
    customerCount += customerRows.length

    for (const booking of cruiseData.bookings || []) {
      const sailingId = booking.sailingId || sailingIdBySeedKey.get(`${booking.shipName}|${booking.departureDate}`)

      if (!sailingId) {
        throw new Error(`Unable to resolve sailing for booking ${booking.id}`)
      }

      await tx.insert(bookingTable).values({
        id: booking.id,
        sailingId,
        bookingStatus: booking.bookingStatus,
        cabinNumber: booking.cabinNumber,
        fareCode: booking.fareCode,
        embarkationPort: booking.embarkationPort,
        debarkationPort: booking.debarkationPort,
        createdByCustomerId: booking.createdByCustomerId
      })
      bookingCount += 1

      const bookingPassengerRows = (booking.passengers || []).map(passenger => ({
        id: `${booking.id}-${passenger.customerId}`,
        bookingId: booking.id,
        customerId: passenger.customerId,
        passengerRole: passenger.passengerRole,
        isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
        diningPreference: passenger.diningPreference,
        accessibilityNotes: passenger.accessibilityNotes,
        boardingGroup: passenger.boardingGroup
      }))

      await insertRows(tx, bookingPassengerTable, bookingPassengerRows)
      bookingPassengerCount += bookingPassengerRows.length
    }

    for (const demoUser of cruiseData.demoUsers || []) {
      await tx
        .insert(demoUserTable)
        .values({
          id: demoUser.id,
          displayName: demoUser.displayName,
          role: demoUser.role,
          customerId: demoUser.customerId
        })
        .onConflictDoUpdate({
          target: demoUserTable.id,
          set: {
            displayName: demoUser.displayName,
            role: demoUser.role,
            customerId: demoUser.customerId
          }
        })

      demoUserCount += 1
    }
  })

  if (process.env.NODE_ENV !== 'test' && process.env.SUPPRESS_DB_LOGS !== 'true') {
    console.log('Cruise seed data reset from data/cruise.json')
  }

  return {
    cruiseLineCount,
    shipCount,
    sailingCount,
    itineraryDayCount,
    activityCount,
    customerCount,
    bookingCount,
    bookingPassengerCount,
    demoUserCount,
    source: 'data/cruise.json'
  }
}

module.exports = loadCruiseData
