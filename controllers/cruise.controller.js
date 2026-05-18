const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const db = require('../db')
const { eq, inArray } = require('drizzle-orm')

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

    const itineraryDays = await db
      .select()
      .from(itineraryDayTable)
      .where(eq(itineraryDayTable.sailingId, sailingId))

    if (!itineraryDays || itineraryDays.length === 0) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    const itineraryWithActivities = []

    for (const itineraryDay of itineraryDays.sort((a, b) => a.day - b.day)) {
      const activitySchedule = await db
        .select()
        .from(activityScheduleTable)
        .where(eq(activityScheduleTable.itineraryDayId, itineraryDay.id))

      itineraryWithActivities.push({
        ...itineraryDay,
        activitySchedule
      })
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
