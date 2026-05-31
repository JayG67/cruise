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
const db = require('../db')
const { and, eq, inArray } = require('drizzle-orm')



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


async function getCustomerFavoriteActivityIds(customerId) {
  if (!customerId) return new Set()

  const rows = await db
    .select()
    .from(customerItineraryFavoriteTable)
    .where(eq(customerItineraryFavoriteTable.customerId, customerId))

  return new Set(rows.map(row => row.activityScheduleId))
}

async function decorateItineraryWithFavorites(itineraryDays, customerId) {
  const favoriteIds = await getCustomerFavoriteActivityIds(customerId)

  return itineraryDays.map(day => ({
    ...day,
    activitySchedule: (day.activitySchedule || []).map(activity => ({
      ...activity,
      isFavorite: favoriteIds.has(activity.id)
    }))
  }))
}

exports.getCruiseLines = async (req, res, next) => {
  try {
    const cruiseLines = await db.select().from(cruiseLineTable)

    if (!cruiseLines || cruiseLines.length === 0) {
      return res.status(404).json({ message: 'No cruise lines found' })
    }

    return res.status(200).json(cruiseLines)
  } catch (err) {
    next(err)
  }
}

exports.getCruiseLineById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Cruise line ID is required' })
    }

    const rows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))
      .limit(1)

    const cruiseLine = rows[0]

    if (!cruiseLine) {
      return res.status(404).json({ message: 'Cruise line not found' })
    }

    return res.status(200).json(cruiseLine)
  } catch (err) {
    next(err)
  }
}

exports.getShipsByCruiseLine = async (req, res, next) => {
  try {
    const { cruiseLineId } = req.params

    const ships = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.cruiseLineId, cruiseLineId))

    if (!ships || ships.length === 0) {
      return res.status(404).json({ message: 'No ships found for the specified cruise line' })
    }

    return res.status(200).json(ships)
  } catch (err) {
    next(err)
  }
}

exports.insertCruiseLine = async (req, res, next) => {
  try {
    const { name, country, website } = req.body

    const existingRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.name, name))
      .limit(1)

    if (existingRows[0]) {
      return res.status(400).json({ message: 'Cruise line with the same name already exists' })
    }

    const insertedRows = await db
      .insert(cruiseLineTable)
      .values({ name, country, website })
      .returning({ id: cruiseLineTable.id })

    return res.status(201).json({
      message: 'Cruise line created successfully',
      id: insertedRows[0].id
    })
  } catch (err) {
    next(err)
  }
}

exports.insertShip = async (req, res, next) => {
  try {
    const { name, currentPort, cruiseLineId } = req.body

    const existingShipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.name, name))
      .limit(1)

    if (existingShipRows[0]) {
      return res.status(400).json({ message: 'Ship with the same name already exists' })
    }

    const existingCruiseLineRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, cruiseLineId))
      .limit(1)

    if (!existingCruiseLineRows[0]) {
      return res.status(400).json({ message: 'Invalid cruise line ID' })
    }

    const insertedRows = await db
      .insert(shipTable)
      .values({ name, currentPort, cruiseLineId })
      .returning({ id: shipTable.id })

    return res.status(201).json({
      message: 'Ship created successfully',
      id: insertedRows[0].id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateCruiseLine = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, country, website } = req.body

    if (!id) {
      return res.status(400).json({ message: 'Cruise line ID is required' })
    }

    const existingRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Cruise line not found' })
    }

    const duplicateNameRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.name, name))
      .limit(1)

    if (duplicateNameRows[0] && duplicateNameRows[0].id !== id) {
      return res.status(400).json({ message: 'Cruise line with the same name already exists' })
    }

    await db
      .update(cruiseLineTable)
      .set({ name, country, website })
      .where(eq(cruiseLineTable.id, id))

    return res.status(200).json({ message: 'Cruise line updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.updateShip = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, currentPort, cruiseLineId } = req.body

    if (!id) {
      return res.status(400).json({ message: 'Ship ID is required' })
    }

    const existingShipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, id))
      .limit(1)

    if (!existingShipRows[0]) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    const duplicateShipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.name, name))
      .limit(1)

    if (duplicateShipRows[0] && duplicateShipRows[0].id !== id) {
      return res.status(400).json({ message: 'Ship with the same name already exists' })
    }

    const existingCruiseLineRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, cruiseLineId))
      .limit(1)

    if (!existingCruiseLineRows[0]) {
      return res.status(400).json({ message: 'Invalid cruise line ID' })
    }

    await db
      .update(shipTable)
      .set({ name, currentPort, cruiseLineId })
      .where(eq(shipTable.id, id))

    return res.status(200).json({ message: 'Ship updated successfully' })
  } catch (err) {
    next(err)
  }
}


async function deleteActivitiesForItineraryDayIds(itineraryDayIds) {
  if (!itineraryDayIds.length) return

  await db
    .delete(activityScheduleTable)
    .where(inArray(activityScheduleTable.itineraryDayId, itineraryDayIds))
}

async function deleteItineraryForSailingIds(sailingIds) {
  if (!sailingIds.length) return

  const itineraryDays = await db
    .select({ id: itineraryDayTable.id })
    .from(itineraryDayTable)
    .where(inArray(itineraryDayTable.sailingId, sailingIds))

  const itineraryDayIds = itineraryDays.map(day => day.id)

  await deleteActivitiesForItineraryDayIds(itineraryDayIds)

  await db
    .delete(itineraryDayTable)
    .where(inArray(itineraryDayTable.sailingId, sailingIds))
}

async function deleteSailingsForShipIds(shipIds) {
  if (!shipIds.length) return

  const sailings = await db
    .select({ id: sailingTable.id })
    .from(sailingTable)
    .where(inArray(sailingTable.shipId, shipIds))

  const sailingIds = sailings.map(sailing => sailing.id)

  await deleteItineraryForSailingIds(sailingIds)

  await db
    .delete(sailingTable)
    .where(inArray(sailingTable.shipId, shipIds))
}

async function deleteShipHierarchy(shipId) {
  await deleteSailingsForShipIds([shipId])

  await db
    .delete(shipTable)
    .where(eq(shipTable.id, shipId))
}

exports.deleteCruiseLine = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Cruise line ID is required' })
    }

    const existingRows = await db
      .select()
      .from(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Cruise line not found' })
    }

    const ships = await db
      .select({ id: shipTable.id })
      .from(shipTable)
      .where(eq(shipTable.cruiseLineId, id))

    const shipIds = ships.map(ship => ship.id)

    await deleteSailingsForShipIds(shipIds)

    await db
      .delete(shipTable)
      .where(eq(shipTable.cruiseLineId, id))

    await db
      .delete(cruiseLineTable)
      .where(eq(cruiseLineTable.id, id))

    return res.status(200).json({ message: 'Cruise line deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteShip = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Ship ID is required' })
    }

    const existingRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    await deleteShipHierarchy(id)

    return res.status(200).json({ message: 'Ship deleted successfully' })
  } catch (err) {
    next(err)
  }
}

async function findOne(table, column, id) {
  const rows = await db.select().from(table).where(eq(column, id)).limit(1)
  return rows[0]
}

exports.getSailingsByShip = async (req, res, next) => {
  try {
    const { shipId } = req.params

    const sailings = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.shipId, shipId))

    if (!sailings || sailings.length === 0) {
      return res.status(404).json({ message: 'No sailings found for the specified ship' })
    }

    return res.status(200).json(sailings)
  } catch (err) {
    next(err)
  }
}

exports.getItineraryBySailing = async (req, res, next) => {
  try {
    const { sailingId } = req.params
    const { customerId, favoritesOnly } = req.query

    const itineraryDays = await db
      .select()
      .from(itineraryDayTable)
      .where(eq(itineraryDayTable.sailingId, sailingId))

    if (!itineraryDays || itineraryDays.length === 0) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    const favoriteIds = await getCustomerFavoriteActivityIds(customerId)
    const itineraryWithActivities = []

    for (const itineraryDay of itineraryDays.sort((a, b) => a.day - b.day)) {
      const activitySchedule = await db
        .select()
        .from(activityScheduleTable)
        .where(eq(activityScheduleTable.itineraryDayId, itineraryDay.id))

      const decoratedActivities = activitySchedule.map(activity => ({
        ...activity,
        isFavorite: favoriteIds.has(activity.id)
      }))

      const visibleActivities = favoritesOnly === 'true'
        ? decoratedActivities.filter(activity => activity.isFavorite)
        : decoratedActivities

      if (favoritesOnly === 'true' && visibleActivities.length === 0) {
        continue
      }

      itineraryWithActivities.push({
        ...itineraryDay,
        activitySchedule: visibleActivities
      })
    }

    if (!itineraryWithActivities.length) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    return res.status(200).json(itineraryWithActivities)
  } catch (err) {
    next(err)
  }
}

exports.insertSailing = async (req, res, next) => {
  try {
    const { shipId } = req.params
    const { departureDate, departurePort, arrivalPort, days, isRepositioning } = req.body

    const existingShip = await findOne(shipTable, shipTable.id, shipId)

    if (!existingShip) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    const insertedRows = await db
      .insert(sailingTable)
      .values({
        shipId,
        departureDate,
        port: departurePort,
        departurePort,
        arrivalPort,
        days,
        isRepositioning: Boolean(isRepositioning)
      })
      .returning({ id: sailingTable.id })

    return res.status(201).json({ message: 'Sailing created successfully', id: insertedRows[0].id })
  } catch (err) {
    next(err)
  }
}

exports.updateSailing = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departureDate, departurePort, arrivalPort, days, isRepositioning } = req.body

    const existingSailing = await findOne(sailingTable, sailingTable.id, id)

    if (!existingSailing) {
      return res.status(404).json({ message: 'Sailing not found' })
    }

    await db
      .update(sailingTable)
      .set({
        departureDate,
        port: departurePort,
        departurePort,
        arrivalPort,
        days,
        isRepositioning: Boolean(isRepositioning)
      })
      .where(eq(sailingTable.id, id))

    return res.status(200).json({ message: 'Sailing updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteSailing = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingSailing = await findOne(sailingTable, sailingTable.id, id)

    if (!existingSailing) {
      return res.status(404).json({ message: 'Sailing not found' })
    }

    await deleteItineraryForSailingIds([id])

    await db.delete(sailingTable).where(eq(sailingTable.id, id))

    return res.status(200).json({ message: 'Sailing deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.insertItineraryDay = async (req, res, next) => {
  try {
    const { sailingId } = req.params
    const { day, title, port, activitySchedule } = req.body

    const existingSailing = await findOne(sailingTable, sailingTable.id, sailingId)

    if (!existingSailing) {
      return res.status(404).json({ message: 'Sailing not found' })
    }

    const insertedRows = await db
      .insert(itineraryDayTable)
      .values({ sailingId, day, title, port })
      .returning({ id: itineraryDayTable.id })

    const itineraryDayId = insertedRows[0].id

    for (const activity of activitySchedule || []) {
      await db.insert(activityScheduleTable).values({
        itineraryDayId,
        time: activity.time,
        activity: activity.activity
      })
    }

    return res.status(201).json({ message: 'Itinerary day created successfully', id: itineraryDayId })
  } catch (err) {
    next(err)
  }
}

exports.updateItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params
    const { day, title, port } = req.body

    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, id)

    if (!existingItineraryDay) {
      return res.status(404).json({ message: 'Itinerary day not found' })
    }

    await db.update(itineraryDayTable).set({ day, title, port }).where(eq(itineraryDayTable.id, id))

    return res.status(200).json({ message: 'Itinerary day updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, id)

    if (!existingItineraryDay) {
      return res.status(404).json({ message: 'Itinerary day not found' })
    }

    await deleteActivitiesForItineraryDayIds([id])

    await db.delete(itineraryDayTable).where(eq(itineraryDayTable.id, id))

    return res.status(200).json({ message: 'Itinerary day deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.insertActivitySchedule = async (req, res, next) => {
  try {
    const { itineraryDayId } = req.params
    const { time, activity } = req.body

    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, itineraryDayId)

    if (!existingItineraryDay) {
      return res.status(404).json({ message: 'Itinerary day not found' })
    }

    const insertedRows = await db
      .insert(activityScheduleTable)
      .values({ itineraryDayId, time, activity })
      .returning({ id: activityScheduleTable.id })

    return res.status(201).json({ message: 'Activity created successfully', id: insertedRows[0].id })
  } catch (err) {
    next(err)
  }
}

exports.updateActivitySchedule = async (req, res, next) => {
  try {
    const { id } = req.params
    const { time, activity } = req.body

    const existingActivity = await findOne(activityScheduleTable, activityScheduleTable.id, id)

    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' })
    }

    await db.update(activityScheduleTable).set({ time, activity }).where(eq(activityScheduleTable.id, id))

    return res.status(200).json({ message: 'Activity updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteActivitySchedule = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingActivity = await findOne(activityScheduleTable, activityScheduleTable.id, id)

    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' })
    }

    await db.delete(activityScheduleTable).where(eq(activityScheduleTable.id, id))

    return res.status(200).json({ message: 'Activity deleted successfully' })
  } catch (err) {
    next(err)
  }
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

    passengers.push({
      ...passenger,
      customer: customerRows[0] || null
    })
  }

  return passengers
}

async function getBookingDetails(booking) {
  if (!booking) return null

  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, booking.sailingId))
    .limit(1)

  const sailing = sailingRows[0] || null
  let ship = null
  let cruiseLine = null

  if (sailing?.shipId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, sailing.shipId))
      .limit(1)

    ship = shipRows[0] || null

    if (ship?.cruiseLineId) {
      const cruiseLineRows = await db
        .select()
        .from(cruiseLineTable)
        .where(eq(cruiseLineTable.id, ship.cruiseLineId))
        .limit(1)

      cruiseLine = cruiseLineRows[0] || null
    }
  }

  const passengers = await getBookingPassengers(booking.id)

  return {
    ...booking,
    sailing,
    ship,
    cruiseLine,
    passengers
  }
}


exports.getDemoUsers = async (req, res, next) => {
  try {
    const demoUsers = await db.select().from(demoUserTable)

    if (!demoUsers || demoUsers.length === 0) {
      return res.status(404).json({ message: 'No demo users found' })
    }

    return res.status(200).json(demoUsers)
  } catch (err) {
    next(err)
  }
}

exports.getDemoUserContext = async (req, res, next) => {
  try {
    const { id } = req.params

    const userRows = await db
      .select()
      .from(demoUserTable)
      .where(eq(demoUserTable.id, id))
      .limit(1)

    const user = userRows[0]

    if (!user) {
      return res.status(404).json({ message: 'Demo user not found' })
    }

    if (user.role === 'ADMIN') {
      const customers = await db.select().from(customerTable)
      const bookings = await db.select().from(bookingTable)

      return res.status(200).json({
        user,
        customer: null,
        bookings: [],
        visibility: {
          canManageCruiseData: true,
          canViewAllCustomers: true,
          canViewAllBookings: true,
          accessibleCustomerCount: customers.length,
          accessibleBookingCount: bookings.length
        }
      })
    }

    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, user.customerId))
      .limit(1)

    const customer = customerRows[0] || null

    if (!customer) {
      return res.status(200).json({
        user,
        customer: null,
        bookings: [],
        visibility: {
          canManageCruiseData: false,
          canViewAllCustomers: false,
          canViewAllBookings: false,
          accessibleCustomerCount: 0,
          accessibleBookingCount: 0
        }
      })
    }

    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, customer.id))

    const bookings = []

    for (const passengerRow of passengerRows) {
      const bookingRows = await db
        .select()
        .from(bookingTable)
        .where(eq(bookingTable.id, passengerRow.bookingId))
        .limit(1)

      if (bookingRows[0]) {
        bookings.push(await getBookingDetails(bookingRows[0]))
      }
    }

    const accessibleCustomerIds = new Set([customer.id])

    if (user.role === 'GROUP_LEADER') {
      bookings.forEach(booking => {
        booking.passengers.forEach(passenger => accessibleCustomerIds.add(passenger.customerId))
      })
    }

    return res.status(200).json({
      user,
      customer,
      bookings,
      visibility: {
        canManageCruiseData: false,
        canViewAllCustomers: false,
        canViewAllBookings: false,
        accessibleCustomerCount: accessibleCustomerIds.size,
        accessibleBookingCount: bookings.length
      }
    })
  } catch (err) {
    next(err)
  }
}

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await db.select().from(customerTable)

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: 'No customers found' })
    }

    return res.status(200).json(customers)
  } catch (err) {
    next(err)
  }
}

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params

    const rows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!rows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    return res.status(200).json(rows[0])
  } catch (err) {
    next(err)
  }
}

exports.insertCustomer = async (req, res, next) => {
  try {
    const { id, firstName, lastName, email, phone, loyaltyNumber } = req.body

    const duplicateIdRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (duplicateIdRows[0]) {
      return res.status(400).json({ message: 'Customer with the same ID already exists' })
    }

    const duplicateEmailRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.email, email))
      .limit(1)

    if (duplicateEmailRows[0]) {
      return res.status(400).json({ message: 'Customer with the same email already exists' })
    }

    await db
      .insert(customerTable)
      .values({ id, firstName, lastName, email, phone, loyaltyNumber })

    return res.status(201).json({
      message: 'Customer created successfully',
      id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, loyaltyNumber } = req.body

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    await db
      .update(customerTable)
      .set({ firstName, lastName, email, phone, loyaltyNumber })
      .where(eq(customerTable.id, id))

    return res.status(200).json({ message: 'Customer updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    await db
      .update(bookingTable)
      .set({ createdByCustomerId: null })
      .where(eq(bookingTable.createdByCustomerId, id))

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, id))

    await db
      .delete(customerTable)
      .where(eq(customerTable.id, id))

    return res.status(200).json({ message: 'Customer deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await db.select().from(bookingTable)

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found' })
    }

    const bookingDetails = []

    for (const booking of bookings) {
      bookingDetails.push(await getBookingDetails(booking))
    }

    return res.status(200).json(bookingDetails)
  } catch (err) {
    next(err)
  }
}

exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params

    const rows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (!rows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    return res.status(200).json(await getBookingDetails(rows[0]))
  } catch (err) {
    next(err)
  }
}

exports.getBookingsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params

    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, customerId))
      .limit(1)

    if (!customerRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, customerId))

    if (!passengerRows || passengerRows.length === 0) {
      return res.status(404).json({ message: 'No bookings found for the specified customer' })
    }

    const bookings = []

    for (const passengerRow of passengerRows) {
      const bookingRows = await db
        .select()
        .from(bookingTable)
        .where(eq(bookingTable.id, passengerRow.bookingId))
        .limit(1)

      if (bookingRows[0]) {
        bookings.push(await getBookingDetails(bookingRows[0]))
      }
    }

    return res.status(200).json(bookings)
  } catch (err) {
    next(err)
  }
}

exports.insertBooking = async (req, res, next) => {
  try {
    const {
      id,
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId,
      passengers
    } = req.body

    const duplicateRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (duplicateRows[0]) {
      return res.status(400).json({ message: 'Booking with the same ID already exists' })
    }

    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.id, sailingId))
      .limit(1)

    if (!sailingRows[0]) {
      return res.status(400).json({ message: 'Invalid sailing ID' })
    }

    for (const passenger of passengers) {
      const customerRows = await db
        .select()
        .from(customerTable)
        .where(eq(customerTable.id, passenger.customerId))
        .limit(1)

      if (!customerRows[0]) {
        return res.status(400).json({ message: `Invalid customer ID ${passenger.customerId}` })
      }
    }

    const uniquePassengerIds = new Set(passengers.map(passenger => passenger.customerId))

    if (uniquePassengerIds.size !== passengers.length) {
      return res.status(400).json({ message: 'Booking cannot include duplicate customers' })
    }


    const primaryGuestCount = passengers.filter(passenger => passenger.isPrimaryGuest).length

    if (primaryGuestCount !== 1) {
      return res.status(400).json({ message: 'Booking must include exactly one primary guest' })
    }

    const overlappingBooking = await findBookingOverlapForPassengers({
      sailing: sailingRows[0],
      passengers
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    await db.transaction(async tx => {
      await tx.insert(bookingTable).values({
        id,
        sailingId,
        bookingStatus,
        cabinNumber,
        fareCode,
        embarkationPort,
        debarkationPort,
        createdByCustomerId
      })

      for (const passenger of passengers) {
        await tx.insert(bookingPassengerTable).values({
          id: `${id}-${passenger.customerId}`,
          bookingId: id,
          customerId: passenger.customerId,
          passengerRole: passenger.passengerRole,
          isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
          diningPreference: passenger.diningPreference,
          accessibilityNotes: passenger.accessibilityNotes,
          boardingGroup: passenger.boardingGroup
        })
      }
    })

    return res.status(201).json({
      message: 'Booking created successfully',
      id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId,
      passengers
    } = req.body

    const existingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.id, sailingId))
      .limit(1)

    if (!sailingRows[0]) {
      return res.status(400).json({ message: 'Invalid sailing ID' })
    }

    const uniquePassengerIds = new Set(passengers.map(passenger => passenger.customerId))

    if (uniquePassengerIds.size !== passengers.length) {
      return res.status(400).json({ message: 'Booking cannot include duplicate customers' })
    }

    for (const passenger of passengers) {
      const customerRows = await db
        .select()
        .from(customerTable)
        .where(eq(customerTable.id, passenger.customerId))
        .limit(1)

      if (!customerRows[0]) {
        return res.status(400).json({ message: `Invalid customer ID ${passenger.customerId}` })
      }
    }

    const primaryGuestCount = passengers.filter(passenger => passenger.isPrimaryGuest).length

    if (primaryGuestCount !== 1) {
      return res.status(400).json({ message: 'Booking must include exactly one primary guest' })
    }

    const overlappingBooking = await findBookingOverlapForPassengers({
      bookingIdToExclude: id,
      sailing: sailingRows[0],
      passengers
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    await db.transaction(async tx => {
      await tx
        .update(bookingTable)
        .set({
          sailingId,
          bookingStatus,
          cabinNumber,
          fareCode,
          embarkationPort,
          debarkationPort,
          createdByCustomerId
        })
        .where(eq(bookingTable.id, id))

      await tx
        .delete(bookingPassengerTable)
        .where(eq(bookingPassengerTable.bookingId, id))

      for (const passenger of passengers) {
        await tx.insert(bookingPassengerTable).values({
          id: `${id}-${passenger.customerId}`,
          bookingId: id,
          customerId: passenger.customerId,
          passengerRole: passenger.passengerRole,
          isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
          diningPreference: passenger.diningPreference,
          accessibilityNotes: passenger.accessibilityNotes,
          boardingGroup: passenger.boardingGroup
        })
      }
    })

    return res.status(200).json({ message: 'Booking updated successfully' })
  } catch (err) {
    next(err)
  }
}


exports.updatePassengerSelfServiceProfile = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, diningPreference, accessibilityNotes } = req.body

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    await db
      .update(customerTable)
      .set({ firstName, lastName, email, phone })
      .where(eq(customerTable.id, id))

    await db
      .update(bookingPassengerTable)
      .set({ diningPreference, accessibilityNotes })
      .where(eq(bookingPassengerTable.customerId, id))

    return res.status(200).json({ message: 'Passenger profile updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.updatePassengerBookingPreferences = async (req, res, next) => {
  try {
    const { bookingId, customerId } = req.params
    const { diningPreference, accessibilityNotes } = req.body

    const existingRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Booking passenger not found' })
    }

    await db
      .update(bookingPassengerTable)
      .set({ diningPreference, accessibilityNotes })
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))

    return res.status(200).json({ message: 'Booking preferences updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.addItineraryFavorite = async (req, res, next) => {
  try {
    const { customerId, activityScheduleId } = req.body
    const id = `${customerId}-${activityScheduleId}`

    await db
      .insert(customerItineraryFavoriteTable)
      .values({ id, customerId, activityScheduleId })
      .onConflictDoNothing()

    return res.status(201).json({ message: 'Itinerary favorite saved successfully', id })
  } catch (err) {
    next(err)
  }
}

exports.deleteItineraryFavorite = async (req, res, next) => {
  try {
    const { customerId, activityScheduleId } = req.params

    await db
      .delete(customerItineraryFavoriteTable)
      .where(eq(customerItineraryFavoriteTable.id, `${customerId}-${activityScheduleId}`))

    return res.status(200).json({ message: 'Itinerary favorite removed successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.bookingId, id))

    await db
      .delete(bookingTable)
      .where(eq(bookingTable.id, id))

    return res.status(200).json({ message: 'Booking deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.addBookingPassenger = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const {
      customerId,
      passengerRole,
      isPrimaryGuest,
      diningPreference,
      accessibilityNotes,
      boardingGroup
    } = req.body

    const bookingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, bookingId))
      .limit(1)

    if (!bookingRows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, customerId))
      .limit(1)

    if (!customerRows[0]) {
      return res.status(400).json({ message: 'Invalid customer ID' })
    }

    const existingPassengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(
        and(
          eq(bookingPassengerTable.bookingId, bookingId),
          eq(bookingPassengerTable.customerId, customerId)
        )
      )
      .limit(1)

    if (existingPassengerRows[0]) {
      return res.status(400).json({ message: 'Customer is already on this booking' })
    }

    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.id, bookingRows[0].sailingId))
      .limit(1)

    const overlappingBooking = await findBookingOverlapForPassengers({
      bookingIdToExclude: bookingId,
      sailing: sailingRows[0],
      passengers: [{ customerId }]
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    await db.insert(bookingPassengerTable).values({
      id: `${bookingId}-${customerId}`,
      bookingId,
      customerId,
      passengerRole,
      isPrimaryGuest: Boolean(isPrimaryGuest),
      diningPreference,
      accessibilityNotes,
      boardingGroup
    })

    return res.status(201).json({ message: 'Booking passenger added successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteBookingPassenger = async (req, res, next) => {
  try {
    const { bookingId, customerId } = req.params

    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))
      .limit(1)

    if (!passengerRows[0]) {
      return res.status(404).json({ message: 'Booking passenger not found' })
    }

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))

    return res.status(200).json({ message: 'Booking passenger deleted successfully' })
  } catch (err) {
    next(err)
  }
}
