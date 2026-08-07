const db = require('../db')
const activityScheduleTable = require('../models/activitySchedule.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const sailingTable = require('../models/sailing.model')
const shipTable = require('../models/ship.model')
const { eq, inArray } = require('drizzle-orm')

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

  await deleteActivitiesForItineraryDayIds(itineraryDays.map(day => day.id))

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

  await deleteItineraryForSailingIds(sailings.map(sailing => sailing.id))

  await db
    .delete(sailingTable)
    .where(inArray(sailingTable.shipId, shipIds))
}

async function deleteShipHierarchy(shipId) {
  await deleteSailingsForShipIds([shipId])
  await db.delete(shipTable).where(eq(shipTable.id, shipId))
}

module.exports = {
  deleteActivitiesForItineraryDayIds,
  deleteItineraryForSailingIds,
  deleteSailingsForShipIds,
  deleteShipHierarchy
}
