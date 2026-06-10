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
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundTaskUpdateTable = require('../models/turnaroundTaskUpdate.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundStaffingTable = require('../models/turnaroundStaffing.model')
const turnaroundTaskDependencyTable = require('../models/turnaroundTaskDependency.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')
const db = require('../db')
const { and, eq, inArray, like } = require('drizzle-orm')



async function getAssignedShipForOperation(operation = {}) {
  if (!operation?.sailingId) return null

  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, operation.sailingId))
    .limit(1)

  const sailing = sailingRows[0]
  if (!sailing?.shipId) return null

  const shipRows = await db
    .select()
    .from(shipTable)
    .where(eq(shipTable.id, sailing.shipId))
    .limit(1)

  return shipRows[0] || null
}

async function resolveOperationalUserIdByName(displayName, operation = null) {
  if (!displayName) return null

  const exactMatches = await db
    .select()
    .from(appUserTable)
    .where(eq(appUserTable.displayName, displayName))
    .limit(1)

  if (exactMatches[0]) return exactMatches[0].id

  const assignedShip = operation ? await getAssignedShipForOperation(operation) : null

  if (assignedShip?.id) {
    const scopedMatches = await db
      .select()
      .from(appUserTable)
      .where(and(
        like(appUserTable.displayName, `${displayName} — %`),
        eq(appUserTable.assignedShipId, assignedShip.id)
      ))
      .limit(1)

    if (scopedMatches[0]) return scopedMatches[0].id
  }

  const prefixedMatches = await db
    .select()
    .from(appUserTable)
    .where(like(appUserTable.displayName, `${displayName} — %`))
    .limit(1)

  return prefixedMatches[0]?.id || null
}


async function buildAppUserDisplayLookup(userIds = []) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))]
  if (!uniqueUserIds.length) return new Map()

  const userRows = await db
    .select()
    .from(appUserTable)
    .where(inArray(appUserTable.id, uniqueUserIds))

  return new Map(userRows.map(user => [user.id, user.displayName]))
}

function enrichOperationalPerson(row = {}, userDisplayById = new Map(), userIdField, displayField) {
  if (!row) return row

  const userId = row[userIdField]
  const displayName = userId ? userDisplayById.get(userId) : null

  return {
    ...row,
    [displayField]: displayName || row[displayField] || row.ownerName || row.authorName || row.approverName || row.leadName || null
  }
}

function buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }) {
  return Object.fromEntries(
    Object.entries({ name, country, website, brandFamily, brandTheme, marketPositioning })
      .filter(([, value]) => value !== undefined)
  )
}

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
    const { name, country, website, brandFamily, brandTheme, marketPositioning } = req.body

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
      .values(buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }))
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
    const { name, country, website, brandFamily, brandTheme, marketPositioning } = req.body

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
      .set(buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }))
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

    const ship = await findOne(shipTable, shipTable.id, shipId)

    if (!ship) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    const sailings = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.shipId, shipId))

    return res.status(200).json(sailings || [])
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

async function selectByIds(table, column, ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))]
  if (uniqueIds.length === 0) return []
  return db.select().from(table).where(inArray(column, uniqueIds))
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
  const itineraryDayRows = await selectByIds(itineraryDayTable, itineraryDayTable.sailingId, sailingIds)
  const activityRows = await selectByIds(
    activityScheduleTable,
    activityScheduleTable.itineraryDayId,
    itineraryDayRows.map(day => day.id)
  )

  const passengersByBooking = groupRowsBy(passengerRows, 'bookingId')
  const customersById = indexRowsBy(customerRows, 'id')
  const sailingsById = indexRowsBy(sailingRows, 'id')
  const shipsById = indexRowsBy(shipRows, 'id')
  const cruiseLinesById = indexRowsBy(cruiseLineRows, 'id')
  const itineraryDaysBySailing = groupRowsBy(itineraryDayRows, 'sailingId')
  const activitiesByDay = groupRowsBy(activityRows, 'itineraryDayId')

  return bookings.map(booking => {
    const sailing = sailingsById.get(booking.sailingId) || null
    const ship = sailing?.shipId ? shipsById.get(sailing.shipId) || null : null
    const cruiseLine = ship?.cruiseLineId ? cruiseLinesById.get(ship.cruiseLineId) || null : null
    const passengers = (passengersByBooking.get(booking.id) || []).map(passenger => ({
      ...passenger,
      customer: customersById.get(passenger.customerId) || null
    }))
    const itineraryDays = (itineraryDaysBySailing.get(booking.sailingId) || [])
      .map(day => ({
        ...day,
        activitySchedule: [...(activitiesByDay.get(day.id) || [])]
          .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
      }))
      .sort((a, b) => Number(a.day || 0) - Number(b.day || 0))
    const sailingWithItinerary = sailing
      ? {
          ...sailing,
          itinerary: itineraryDays,
          itineraryDays
        }
      : null

    return {
      ...booking,
      sailing: sailingWithItinerary,
      ship,
      cruiseLine,
      passengers,
      itinerary: itineraryDays,
      itineraryDays
    }
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

    passengers.push({
      ...passenger,
      customer: customerRows[0] || null
    })
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
  const itineraryDays = await getSailingItineraryDetails(booking.sailingId)
  const sailingWithItinerary = sailing
    ? {
        ...sailing,
        itinerary: itineraryDays,
        itineraryDays
      }
    : null

  return {
    ...booking,
    sailing: sailingWithItinerary,
    ship,
    cruiseLine,
    passengers,
    itinerary: itineraryDays,
    itineraryDays
  }
}


async function getPassengerCountForSailing(sailingId) {
  const bookingRows = await db
    .select()
    .from(bookingTable)
    .where(eq(bookingTable.sailingId, sailingId))

  let passengerCount = 0

  for (const booking of bookingRows || []) {
    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.bookingId, booking.id))

    passengerCount += passengerRows.length
  }

  return passengerCount
}


function getTurnaroundProgress(tasks = []) {
  const totalTasks = tasks.length
  const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
  const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length

  return {
    totalTasks,
    completeTasks,
    blockedTasks,
    inProgressTasks,
    completionPercent: totalTasks === 0 ? 0 : Math.round((completeTasks / totalTasks) * 100)
  }
}


function getTurnaroundSignoffSummary(signoffs = []) {
  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffs.filter(signoff => signoff.status === 'APPROVED').length
  const blockedSignoffs = signoffs.filter(signoff => signoff.status === 'BLOCKED').length
  const pendingSignoffs = signoffs.filter(signoff => signoff.status === 'PENDING').length

  return {
    totalSignoffs,
    approvedSignoffs,
    blockedSignoffs,
    pendingSignoffs,
    approvalPercent: totalSignoffs === 0 ? 0 : Math.round((approvedSignoffs / totalSignoffs) * 100)
  }
}

function getTurnaroundEscalationSummary(escalations = []) {
  const totalEscalations = escalations.length
  const openEscalations = escalations.filter(escalation => escalation.status === 'OPEN').length
  const monitoringEscalations = escalations.filter(escalation => escalation.status === 'MONITORING').length
  const resolvedEscalations = escalations.filter(escalation => escalation.status === 'RESOLVED').length
  const criticalEscalations = escalations.filter(escalation => escalation.severity === 'CRITICAL' && escalation.status !== 'RESOLVED').length

  return {
    totalEscalations,
    openEscalations,
    monitoringEscalations,
    resolvedEscalations,
    criticalEscalations
  }
}


function getTurnaroundStaffingSummary(staffing = []) {
  const plannedCount = staffing.reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
  const checkedInCount = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)
  const gapCount = Math.max(plannedCount - checkedInCount, 0)

  return {
    totalDepartments: staffing.length,
    plannedCount,
    checkedInCount,
    gapCount,
    checkInPercent: plannedCount === 0 ? 0 : Math.round((checkedInCount / plannedCount) * 100)
  }
}

function getDerivedTurnaroundReadinessLevel(tasks = [], signoffs = [], escalations = []) {
  const progress = getTurnaroundProgress(tasks)
  const signoffSummary = getTurnaroundSignoffSummary(signoffs)
  const escalationSummary = getTurnaroundEscalationSummary(escalations)

  if (progress.blockedTasks > 0 || signoffSummary.blockedSignoffs > 0 || escalationSummary.criticalEscalations > 0) return 'Blocked'
  if (progress.totalTasks > 0 && progress.completeTasks === progress.totalTasks && signoffSummary.totalSignoffs > 0 && signoffSummary.approvedSignoffs === signoffSummary.totalSignoffs) return 'Ready for embarkation'
  if (progress.inProgressTasks > 0 || progress.completeTasks > 0 || signoffSummary.approvedSignoffs > 0) return 'In progress'

  return 'Planning'
}

function getDerivedTurnaroundStatus(tasks = [], escalations = []) {
  const progress = getTurnaroundProgress(tasks)
  const escalationSummary = getTurnaroundEscalationSummary(escalations)

  if (progress.blockedTasks > 0 || escalationSummary.criticalEscalations > 0) return 'BLOCKED'
  if (progress.totalTasks > 0 && progress.completeTasks === progress.totalTasks) return 'COMPLETE'
  if (progress.inProgressTasks > 0 || progress.completeTasks > 0) return 'IN_PROGRESS'

  return 'PLANNED'
}

function getTurnaroundDependencySummary(dependencies = []) {
  const activeDependencies = dependencies.filter(dependency => dependency.status !== 'CLEARED').length
  const clearedDependencies = dependencies.filter(dependency => dependency.status === 'CLEARED').length

  return {
    totalDependencies: dependencies.length,
    activeDependencies,
    clearedDependencies
  }
}

function getTurnaroundHandoffSummary(handoffs = []) {
  const completedHandoffs = handoffs.filter(handoff => handoff.status === 'COMPLETE').length
  const blockedHandoffs = handoffs.filter(handoff => handoff.status === 'BLOCKED').length

  return {
    totalHandoffs: handoffs.length,
    completedHandoffs,
    blockedHandoffs,
    openHandoffs: Math.max(handoffs.length - completedHandoffs, 0)
  }
}

async function getTurnaroundOperationDetails(operation) {
  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, operation.sailingId))
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

  const tasks = await db
    .select()
    .from(turnaroundTaskTable)
    .where(eq(turnaroundTaskTable.operationId, operation.id))

  const signoffs = await db
    .select()
    .from(turnaroundSignoffTable)
    .where(eq(turnaroundSignoffTable.operationId, operation.id))

  const escalations = await db
    .select()
    .from(turnaroundEscalationTable)
    .where(eq(turnaroundEscalationTable.operationId, operation.id))

  const staffing = await db
    .select()
    .from(turnaroundStaffingTable)
    .where(eq(turnaroundStaffingTable.operationId, operation.id))

  const taskDependencies = await db
    .select()
    .from(turnaroundTaskDependencyTable)
    .where(eq(turnaroundTaskDependencyTable.operationId, operation.id))

  const handoffs = await db
    .select()
    .from(turnaroundHandoffTable)
    .where(eq(turnaroundHandoffTable.operationId, operation.id))

  const taskUpdateRowsByTaskId = new Map()
  const operationalUserIds = [
    ...(tasks || []).map(task => task.ownerUserId),
    ...(signoffs || []).map(signoff => signoff.approverUserId),
    ...(escalations || []).map(escalation => escalation.ownerUserId),
    ...(handoffs || []).map(handoff => handoff.ownerUserId)
  ]

  for (const task of tasks || []) {
    const updates = await db
      .select()
      .from(turnaroundTaskUpdateTable)
      .where(eq(turnaroundTaskUpdateTable.taskId, task.id))

    taskUpdateRowsByTaskId.set(task.id, updates || [])
    operationalUserIds.push(...(updates || []).map(update => update.authorUserId))
  }

  const userDisplayById = await buildAppUserDisplayLookup(operationalUserIds)

  const sortedSignoffs = [...(signoffs || [])]
    .map(signoff => enrichOperationalPerson(signoff, userDisplayById, 'approverUserId', 'approverDisplayName'))
    .sort((a, b) => String(a.departmentRole).localeCompare(String(b.departmentRole)))
  const sortedEscalations = [...(escalations || [])]
    .map(escalation => enrichOperationalPerson(escalation, userDisplayById, 'ownerUserId', 'ownerDisplayName'))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const sortedStaffing = [...(staffing || [])].sort((a, b) => String(a.departmentRole).localeCompare(String(b.departmentRole)))
  const sortedTaskDependencies = [...(taskDependencies || [])].sort((a, b) => String(a.status).localeCompare(String(b.status)))
  const sortedHandoffs = [...(handoffs || [])]
    .map(handoff => enrichOperationalPerson(handoff, userDisplayById, 'ownerUserId', 'ownerDisplayName'))
    .sort((a, b) => String(a.dueTime || '').localeCompare(String(b.dueTime || '')))

  const sortedTasks = []

  for (const task of [...(tasks || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))) {
    const updates = taskUpdateRowsByTaskId.get(task.id) || []

    sortedTasks.push({
      ...enrichOperationalPerson(task, userDisplayById, 'ownerUserId', 'ownerDisplayName'),
      updates: [...updates]
        .map(update => enrichOperationalPerson(update, userDisplayById, 'authorUserId', 'authorDisplayName'))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    })
  }

  const taskNameById = new Map(sortedTasks.map(task => [task.id, task.taskName]))
  const enrichedDependencies = sortedTaskDependencies.map(dependency => ({
    ...dependency,
    taskName: taskNameById.get(dependency.taskId) || 'Unknown task',
    dependsOnTaskName: taskNameById.get(dependency.dependsOnTaskId) || 'Unknown prerequisite'
  }))

  return {
    ...operation,
    commandStatus: operation.status,
    commandReadinessLevel: operation.readinessLevel,
    status: getDerivedTurnaroundStatus(sortedTasks, sortedEscalations),
    readinessLevel: getDerivedTurnaroundReadinessLevel(sortedTasks, sortedSignoffs, sortedEscalations),
    signoffs: sortedSignoffs,
    signoffSummary: getTurnaroundSignoffSummary(sortedSignoffs),
    escalations: sortedEscalations,
    escalationSummary: getTurnaroundEscalationSummary(sortedEscalations),
    staffing: sortedStaffing,
    staffingSummary: getTurnaroundStaffingSummary(sortedStaffing),
    taskDependencies: enrichedDependencies,
    dependencySummary: getTurnaroundDependencySummary(enrichedDependencies),
    handoffs: sortedHandoffs,
    handoffSummary: getTurnaroundHandoffSummary(sortedHandoffs),
    sailing,
    ship,
    cruiseLine,
    passengerCount: await getPassengerCountForSailing(operation.sailingId),
    taskSummary: getTurnaroundProgress(sortedTasks),
    tasks: sortedTasks
  }
}

function isOperationalDemoRole(role = '') {
  const normalizedRole = String(role || '').toLowerCase().replace(/_/g, '-')
  return [
    'turnaround-manager',
    'housekeeping-lead',
    'guest-services-lead',
    'food-beverage-lead',
    'engineering-lead'
  ].some(operationalRole => normalizedRole.includes(operationalRole))
}

async function getSailingIdsForOperationalAssignment(demoUser) {
  if (!demoUser || !isOperationalDemoRole(demoUser.role)) return null

  if (demoUser.assignedShipId) {
    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.shipId, demoUser.assignedShipId))

    return sailingRows.map(sailing => sailing.id)
  }

  if (demoUser.cruiseLineId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.cruiseLineId, demoUser.cruiseLineId))

    const sailingRows = await selectByIds(
      sailingTable,
      sailingTable.shipId,
      shipRows.map(ship => ship.id)
    )

    return sailingRows.map(sailing => sailing.id)
  }

  return []
}


async function canAccessTurnaroundOperationForRequest(req, operation) {
  const demoUserId = req.query?.demoUserId

  if (!demoUserId) return true
  if (!operation) return false

  const demoUserRows = await db
    .select()
    .from(demoUserTable)
    .where(eq(demoUserTable.id, demoUserId))
    .limit(1)

  const demoUser = demoUserRows[0]

  if (!demoUser) return false

  const scopedSailingIds = await getSailingIdsForOperationalAssignment(demoUser)

  if (scopedSailingIds === null) return true

  return scopedSailingIds.includes(operation.sailingId)
}

function sendTurnaroundOperationForbidden(res) {
  return res.status(403).json({ message: 'Selected demo user is not assigned to this turnaround operation' })
}

async function getTurnaroundOperationsForRequest(req) {
  const demoUserId = req.query?.demoUserId

  if (!demoUserId) {
    return db.select().from(turnaroundOperationTable)
  }

  const demoUserRows = await db
    .select()
    .from(demoUserTable)
    .where(eq(demoUserTable.id, demoUserId))
    .limit(1)

  const demoUser = demoUserRows[0]

  if (!demoUser) return []

  const scopedSailingIds = await getSailingIdsForOperationalAssignment(demoUser)

  if (scopedSailingIds === null) {
    return db.select().from(turnaroundOperationTable)
  }

  if (scopedSailingIds.length === 0) return []

  return db
    .select()
    .from(turnaroundOperationTable)
    .where(inArray(turnaroundOperationTable.sailingId, scopedSailingIds))
}

exports.getTurnaroundOperations = async (req, res, next) => {
  try {
    const operations = await getTurnaroundOperationsForRequest(req)

    if (!operations || operations.length === 0) {
      return res.status(404).json({ message: 'No turnaround operations found' })
    }

    const operationDetails = []

    for (const operation of operations) {
      operationDetails.push(await getTurnaroundOperationDetails(operation))
    }

    return res.status(200).json(operationDetails.sort((a, b) => String(a.turnaroundDate).localeCompare(String(b.turnaroundDate))))
  } catch (err) {
    next(err)
  }
}



exports.updateTurnaroundOperationCommand = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['status', 'readinessLevel', 'port', 'notes']
    const operationUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        operationUpdates[field] = req.body[field] || null
      }
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.keys(operationUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround command field is required' })
    }

    await db
      .update(turnaroundOperationTable)
      .set(operationUpdates)
      .where(eq(turnaroundOperationTable.id, id))

    const refreshedOperationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    return res.status(200).json({
      message: 'Turnaround command plan updated successfully',
      operation: await getTurnaroundOperationDetails(refreshedOperationRows[0] || operation)
    })
  } catch (err) {
    next(err)
  }
}


exports.createTurnaroundEscalation = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departmentRole, severity = 'WATCH', title, ownerName, status = 'OPEN', resolutionNotes } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .insert(turnaroundEscalationTable)
      .values({
        operationId: id,
        departmentRole,
        severity,
        title,
        ownerName: ownerName || null,
        ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
        status,
        resolutionNotes: resolutionNotes || null,
        createdAt: new Date().toISOString()
      })

    return res.status(201).json({
      message: 'Turnaround escalation created successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundEscalation = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['severity', 'title', 'ownerName', 'status', 'resolutionNotes']
    const escalationUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        escalationUpdates[field] = req.body[field] || null
      }
    }

    const escalationRows = await db
      .select()
      .from(turnaroundEscalationTable)
      .where(eq(turnaroundEscalationTable.id, id))
      .limit(1)

    const escalation = escalationRows[0]

    if (!escalation) {
      return res.status(404).json({ message: 'Turnaround escalation not found' })
    }

    if (Object.keys(escalationUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround escalation field is required' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, escalation.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
      escalationUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
    }

    await db
      .update(turnaroundEscalationTable)
      .set(escalationUpdates)
      .where(eq(turnaroundEscalationTable.id, id))

    return res.status(200).json({
      message: 'Turnaround escalation updated successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}


exports.updateTurnaroundStaffing = async (req, res, next) => {
  try {
    const { id, departmentRole } = req.params
    const { plannedCount, checkedInCount, leadName, musterLocation, notes } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const staffingValues = {
      plannedCount: Number(plannedCount || 0),
      checkedInCount: Number(checkedInCount || 0),
      leadName: leadName || null,
      musterLocation: musterLocation || null,
      notes: notes || null
    }

    const existingStaffing = await db
      .select()
      .from(turnaroundStaffingTable)
      .where(and(
        eq(turnaroundStaffingTable.operationId, id),
        eq(turnaroundStaffingTable.departmentRole, departmentRole)
      ))
      .limit(1)

    if (existingStaffing[0]) {
      await db
        .update(turnaroundStaffingTable)
        .set(staffingValues)
        .where(eq(turnaroundStaffingTable.id, existingStaffing[0].id))
    } else {
      await db
        .insert(turnaroundStaffingTable)
        .values({
          operationId: id,
          departmentRole,
          ...staffingValues
        })
    }

    return res.status(200).json({
      message: 'Turnaround staffing plan updated successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundSignoff = async (req, res, next) => {
  try {
    const { id, departmentRole } = req.params
    const { status, approverName, notes } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const existingSignoffs = await db
      .select()
      .from(turnaroundSignoffTable)
      .where(and(
        eq(turnaroundSignoffTable.operationId, id),
        eq(turnaroundSignoffTable.departmentRole, departmentRole)
      ))
      .limit(1)

    const signoffValues = {
      approverName,
      approverUserId: await resolveOperationalUserIdByName(approverName, operation),
      status,
      notes: notes || null,
      signedAt: status === 'PENDING' ? null : new Date().toISOString()
    }

    if (existingSignoffs[0]) {
      await db
        .update(turnaroundSignoffTable)
        .set(signoffValues)
        .where(eq(turnaroundSignoffTable.id, existingSignoffs[0].id))
    } else {
      await db
        .insert(turnaroundSignoffTable)
        .values({
          operationId: id,
          departmentRole,
          ...signoffValues
        })
    }

    return res.status(200).json({
      message: 'Turnaround readiness signoff updated successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    const nextTaskValues = { status }

    if (Object.prototype.hasOwnProperty.call(req.body, 'blockerReason')) {
      nextTaskValues.blockerReason = status === 'BLOCKED' ? req.body.blockerReason || 'Blocked pending operational follow-up' : req.body.blockerReason || null
    } else if (status !== 'BLOCKED') {
      nextTaskValues.blockerReason = null
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .update(turnaroundTaskTable)
      .set(nextTaskValues)
      .where(eq(turnaroundTaskTable.id, id))

    if (!operation) {
      return res.status(200).json({ message: 'Turnaround task status updated successfully' })
    }

    return res.status(200).json({
      message: 'Turnaround task status updated successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}



exports.createTurnaroundTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departmentRole, taskName, ownerName, dueTime, location, blockerReason, status = 'READY' } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.operationId, id))

    const nextSortOrder = existingTasks.reduce((maxSortOrder, task) => Math.max(maxSortOrder, Number(task.sortOrder || 0)), 0) + 1

    await db
      .insert(turnaroundTaskTable)
      .values({
        operationId: id,
        departmentRole,
        taskName,
        ownerName: ownerName || null,
        ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
        dueTime: dueTime || null,
        location: location || null,
        blockerReason: blockerReason || null,
        status,
        sortOrder: nextSortOrder
      })

    return res.status(201).json({
      message: 'Turnaround task created successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.createTurnaroundTaskUpdate = async (req, res, next) => {
  try {
    const { id } = req.params
    const { authorName, updateType = 'NOTE', message } = req.body

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .insert(turnaroundTaskUpdateTable)
      .values({
        taskId: id,
        authorName,
        authorUserId: await resolveOperationalUserIdByName(authorName, operation),
        updateType,
        message,
        createdAt: new Date().toISOString()
      })

    return res.status(201).json({
      message: 'Turnaround task update added successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}


exports.deleteTurnaroundTask = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .delete(turnaroundTaskDependencyTable)
      .where(eq(turnaroundTaskDependencyTable.taskId, id))

    await db
      .delete(turnaroundTaskDependencyTable)
      .where(eq(turnaroundTaskDependencyTable.dependsOnTaskId, id))

    await db
      .delete(turnaroundTaskUpdateTable)
      .where(eq(turnaroundTaskUpdateTable.taskId, id))

    await db
      .delete(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))

    return res.status(200).json({
      message: 'Turnaround task removed successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundTaskDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['ownerName', 'dueTime', 'location', 'blockerReason']
    const taskUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        taskUpdates[field] = req.body[field] || null
      }
    }

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    if (Object.keys(taskUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround task detail is required' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .update(turnaroundTaskTable)
      .set(taskUpdates)
      .where(eq(turnaroundTaskTable.id, id))

    return res.status(200).json({
      message: 'Turnaround task details updated successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}


exports.updateTurnaroundHandoff = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['status', 'ownerName', 'dueTime', 'notes']
    const handoffUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        handoffUpdates[field] = req.body[field] || null
      }
    }

    if (handoffUpdates.status === 'COMPLETE') {
      handoffUpdates.completedAt = new Date().toISOString()
    } else if (Object.prototype.hasOwnProperty.call(handoffUpdates, 'status')) {
      handoffUpdates.completedAt = null
    }

    const handoffRows = await db
      .select()
      .from(turnaroundHandoffTable)
      .where(eq(turnaroundHandoffTable.id, id))
      .limit(1)

    const handoff = handoffRows[0]

    if (!handoff) {
      return res.status(404).json({ message: 'Turnaround handoff not found' })
    }

    if (Object.keys(handoffUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround handoff field is required' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, handoff.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
      handoffUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
    }

    await db
      .update(turnaroundHandoffTable)
      .set(handoffUpdates)
      .where(eq(turnaroundHandoffTable.id, id))

    return res.status(200).json({
      message: 'Turnaround handoff updated successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
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

    return res.status(200).json(await getBookingDetailsBatch(bookings))
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

    const bookingRows = await selectByIds(
      bookingTable,
      bookingTable.id,
      passengerRows.map(passengerRow => passengerRow.bookingId)
    )

    return res.status(200).json(await getBookingDetailsBatch(bookingRows))
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
