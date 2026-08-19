const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { eq } = require('drizzle-orm')

async function getSailingAuditScope(sailingOrId) {
  const sailingId = typeof sailingOrId === 'string' ? sailingOrId : sailingOrId?.id
  const providedSailing = typeof sailingOrId === 'object' && sailingOrId?.shipId ? sailingOrId : null
  if (!sailingId) return {}

  const sailing = providedSailing || (await db.select().from(sailingTable).where(eq(sailingTable.id, sailingId)).limit(1))[0]
  if (!sailing?.shipId) return { sailingId }

  const ship = (await db.select().from(shipTable).where(eq(shipTable.id, sailing.shipId)).limit(1))[0]
  return {
    cruiseLineId: ship?.cruiseLineId || null,
    shipId: sailing.shipId,
    sailingId
  }
}

async function getItineraryDayAuditScope(itineraryDayOrId) {
  const itineraryDayId = typeof itineraryDayOrId === 'string' ? itineraryDayOrId : itineraryDayOrId?.id
  const providedDay = typeof itineraryDayOrId === 'object' ? itineraryDayOrId : null
  if (!itineraryDayId && !providedDay?.sailingId) return {}

  const itineraryDay = providedDay || (await db.select().from(itineraryDayTable).where(eq(itineraryDayTable.id, itineraryDayId)).limit(1))[0]
  if (!itineraryDay?.sailingId) return {}
  return getSailingAuditScope(itineraryDay.sailingId)
}

async function getActivityAuditScope(activityScheduleId) {
  if (!activityScheduleId) return {}

  const activity = (await db.select().from(activityScheduleTable).where(eq(activityScheduleTable.id, activityScheduleId)).limit(1))[0]
  if (!activity?.itineraryDayId) return {}
  return getItineraryDayAuditScope(activity.itineraryDayId)
}

module.exports = {
  getActivityAuditScope,
  getItineraryDayAuditScope,
  getSailingAuditScope
}
