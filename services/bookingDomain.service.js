const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const db = require('../db')
const { eq, inArray } = require('drizzle-orm')
const {
  withBookingApiIdentity,
  withBookingPassengerApiIdentity,
  withCruiseLineApiIdentity,
  withCustomerApiIdentity,
  withSailingApiIdentity,
  withShipApiIdentity
} = require('./apiIdentityBridge.service')

function addDays(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  return date
}

function sailingEndDate(sailing) {
  const days = Number(sailing?.days || 1)
  return addDays(sailing.departureDate, Math.max(days - 1, 0))
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA
}

async function findBookingOverlapForPassengers({ bookingIdToExclude, sailing, passengers }) {
  const requestedStart = new Date(`${sailing.departureDate}T00:00:00.000Z`)
  const requestedEnd = sailingEndDate(sailing)
  const passengerIds = passengers.map(passenger => passenger.customerId)

  for (const customerId of passengerIds) {
    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, customerId))

    for (const passengerRow of passengerRows) {
      if (bookingIdToExclude && passengerRow.bookingId === bookingIdToExclude) {
        continue
      }

      const existingBookings = await db
        .select()
        .from(bookingTable)
        .where(eq(bookingTable.id, passengerRow.bookingId))
        .limit(1)

      const existingBooking = existingBookings[0]
      if (!existingBooking) continue

      const existingSailings = await db
        .select()
        .from(sailingTable)
        .where(eq(sailingTable.id, existingBooking.sailingId))
        .limit(1)

      const existingSailing = existingSailings[0]
      if (!existingSailing) continue

      const existingStart = new Date(`${existingSailing.departureDate}T00:00:00.000Z`)
      const existingEnd = sailingEndDate(existingSailing)

      if (rangesOverlap(requestedStart, requestedEnd, existingStart, existingEnd)) {
        return {
          customerId,
          bookingId: existingBooking.id,
          departureDate: existingSailing.departureDate
        }
      }
    }
  }

  return null
}

function groupRowsBy(rows, keyName) {
  return (rows || []).reduce((groups, row) => {
    const key = row[keyName]
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
    return groups
  }, new Map())
}

function indexRowsBy(rows, keyName) {
  return new Map((rows || []).map(row => [row[keyName], row]))
}

function buildBookingPassengerStorageValues(bookingId, passenger, existingPassenger) {
  const values = {
    id: `${bookingId}-${passenger.customerId}`,
    bookingId,
    customerId: passenger.customerId,
    passengerRole: passenger.passengerRole,
    isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
    diningPreference: passenger.diningPreference,
    accessibilityNotes: passenger.accessibilityNotes,
    boardingGroup: passenger.boardingGroup
  }

  if (existingPassenger?.bookingPassengerUuid) {
    values.bookingPassengerUuid = existingPassenger.bookingPassengerUuid
  }

  return values
}

const BULK_SELECT_CHUNK_SIZE = 500

async function selectByIds(table, column, ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))]
  if (uniqueIds.length === 0) return []

  const rows = []

  for (let index = 0; index < uniqueIds.length; index += BULK_SELECT_CHUNK_SIZE) {
    const idChunk = uniqueIds.slice(index, index + BULK_SELECT_CHUNK_SIZE)
    rows.push(...await db.select().from(table).where(inArray(column, idChunk)))
  }

  return rows
}

async function getBookingDetailsBatch(bookings) {
  if (!bookings || bookings.length === 0) return []

  const bookingIds = bookings.map(booking => booking.id)
  const sailingIds = bookings.map(booking => booking.sailingId)

  const [passengerRows, sailingRows] = await Promise.all([
    selectByIds(bookingPassengerTable, bookingPassengerTable.bookingId, bookingIds),
    selectByIds(sailingTable, sailingTable.id, sailingIds)
  ])

  const customerRows = await selectByIds(
    customerTable,
    customerTable.id,
    passengerRows.map(passenger => passenger.customerId)
  )
  const shipRows = await selectByIds(
    shipTable,
    shipTable.id,
    sailingRows.map(sailing => sailing.shipId)
  )
  const cruiseLineRows = await selectByIds(
    cruiseLineTable,
    cruiseLineTable.id,
    shipRows.map(ship => ship.cruiseLineId)
  )

  const passengersByBooking = groupRowsBy(passengerRows, 'bookingId')
  const customersById = indexRowsBy(customerRows, 'id')
  const sailingsById = indexRowsBy(sailingRows, 'id')
  const shipsById = indexRowsBy(shipRows, 'id')
  const cruiseLinesById = indexRowsBy(cruiseLineRows, 'id')

  return bookings.map(booking => {
    const rawSailing = sailingsById.get(booking.sailingId) || null
    const rawShip = rawSailing?.shipId ? shipsById.get(rawSailing.shipId) || null : null
    const rawCruiseLine = rawShip?.cruiseLineId ? cruiseLinesById.get(rawShip.cruiseLineId) || null : null
    const sailing = rawSailing ? withSailingApiIdentity(rawSailing) : null
    const ship = rawShip ? withShipApiIdentity(rawShip) : null
    const cruiseLine = rawCruiseLine ? withCruiseLineApiIdentity(rawCruiseLine) : null
    const passengers = (passengersByBooking.get(booking.id) || []).map(passenger => withBookingPassengerApiIdentity({
      ...passenger,
      customer: customersById.get(passenger.customerId) ? withCustomerApiIdentity(customersById.get(passenger.customerId)) : null
    }))

    return withBookingApiIdentity({
      ...booking,
      sailing,
      ship,
      cruiseLine,
      passengers
    })
  })
}

async function getBookingPassengers(bookingId) {
  const passengerRows = await db
    .select()
    .from(bookingPassengerTable)
    .where(eq(bookingPassengerTable.bookingId, bookingId))

  const passengers = []

  for (const passenger of passengerRows || []) {
    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, passenger.customerId))
      .limit(1)

    passengers.push(withBookingPassengerApiIdentity({
      ...passenger,
      customer: customerRows[0] ? withCustomerApiIdentity(customerRows[0]) : null
    }))
  }

  return passengers
}

async function getSailingItineraryDetails(sailingId) {
  if (!sailingId) return []

  const itineraryDays = await db
    .select()
    .from(itineraryDayTable)
    .where(eq(itineraryDayTable.sailingId, sailingId))

  const itineraryWithActivities = []

  for (const itineraryDay of itineraryDays || []) {
    const activities = await db
      .select()
      .from(activityScheduleTable)
      .where(eq(activityScheduleTable.itineraryDayId, itineraryDay.id))

    itineraryWithActivities.push({
      ...itineraryDay,
      activitySchedule: [...(activities || [])].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    })
  }

  return itineraryWithActivities.sort((a, b) => Number(a.day || 0) - Number(b.day || 0))
}

async function getBookingDetails(booking) {
  if (!booking) return null

  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, booking.sailingId))
    .limit(1)

  const rawSailing = sailingRows[0] || null
  const sailing = rawSailing ? withSailingApiIdentity(rawSailing) : null
  let ship = null
  let cruiseLine = null

  if (rawSailing?.shipId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, rawSailing.shipId))
      .limit(1)

    ship = shipRows[0] ? withShipApiIdentity(shipRows[0]) : null

    if (ship?.cruiseLineId) {
      const cruiseLineRows = await db
        .select()
        .from(cruiseLineTable)
        .where(eq(cruiseLineTable.id, ship.cruiseLineId))
        .limit(1)

      cruiseLine = cruiseLineRows[0] ? withCruiseLineApiIdentity(cruiseLineRows[0]) : null
    }
  }

  const passengers = await getBookingPassengers(booking.id)
  const itineraryDays = await getSailingItineraryDetails(booking.sailingId)
  const sailingWithItinerary = sailing
    ? {
        ...sailing,
        itinerary: itineraryDays,
        itineraryDays
      }
    : null

  return withBookingApiIdentity({
    ...booking,
    sailing: sailingWithItinerary,
    ship,
    cruiseLine,
    passengers,
    itinerary: itineraryDays,
    itineraryDays
  })
}

module.exports = {
  buildBookingPassengerStorageValues,
  findBookingOverlapForPassengers,
  getBookingDetails,
  getBookingDetailsBatch,
  indexRowsBy,
  selectByIds
}
