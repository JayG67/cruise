const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const db = require('../db')
const { recordPlatformAuditEvent } = require('../services/platformAudit.service')
const { getActivityAuditScope, getItineraryDayAuditScope, getSailingAuditScope } = require('../services/sailingAuditScope.service')
const { deleteActivitiesForItineraryDayIds } = require('../services/fleetHierarchy.service')
const { eq } = require('drizzle-orm')

async function findOne(table, column, id) {
  const rows = await db.select().from(table).where(eq(column, id)).limit(1)
  return rows[0]
}

function buildTimestampBridgeValues(timestamp = new Date().toISOString()) {
  return {
    createdAt: timestamp,
    createdAtTimestamp: new Date(timestamp),
    updatedAt: timestamp,
    updatedAtTimestamp: new Date(timestamp)
  }
}

function buildTimestampUpdateValues(timestamp = new Date().toISOString()) {
  return {
    updatedAt: timestamp,
    updatedAtTimestamp: new Date(timestamp)
  }
}

exports.insertItineraryDay = async (req, res, next) => {
  try {
    const { sailingId } = req.params
    const { day, title, port, activitySchedule } = req.body
    const validationErrors = []

    if (!Number.isInteger(day) || day < 1 || day > 30) validationErrors.push({ field: 'day', message: 'Day must be between 1 and 30' })
    if (!String(title || '').trim()) validationErrors.push({ field: 'title', message: 'Itinerary title is required' })
    if (!String(port || '').trim()) validationErrors.push({ field: 'port', message: 'Itinerary port is required' })
    if (validationErrors.length > 0) return res.status(400).json({ message: 'Validation failed', errors: validationErrors })

    const existingSailing = await findOne(sailingTable, sailingTable.id, sailingId)
    if (!existingSailing) return res.status(404).json({ message: 'Sailing not found' })

    const itineraryDayValues = { sailingId, day, title, port, ...buildTimestampBridgeValues() }
    const insertedRows = await db.insert(itineraryDayTable).values(itineraryDayValues).returning({ id: itineraryDayTable.id })
    const itineraryDayId = insertedRows[0].id
    const createdActivityIds = []

    for (const scheduledActivity of activitySchedule || []) {
      const activityRows = await db.insert(activityScheduleTable).values({
        itineraryDayId,
        time: scheduledActivity.time,
        activity: scheduledActivity.activity,
        ...buildTimestampBridgeValues()
      }).returning({ id: activityScheduleTable.id })
      if (activityRows[0]?.id) createdActivityIds.push(activityRows[0].id)
    }

    const itineraryScope = await getSailingAuditScope(existingSailing)
    await recordPlatformAuditEvent(req, {
      eventType: 'ITINERARY_DAY_CREATED',
      entityType: 'ITINERARY_DAY',
      entityId: itineraryDayId,
      ...itineraryScope,
      eventPayload: { itineraryDay: { ...itineraryDayValues, id: itineraryDayId }, createdActivityIds }
    })

    return res.status(201).json({ message: 'Itinerary day created successfully', id: itineraryDayId })
  } catch (error) {
    next(error)
  }
}

exports.updateItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params
    const { day, title, port } = req.body
    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, id)

    if (!existingItineraryDay) return res.status(404).json({ message: 'Itinerary day not found' })

    const itineraryDayUpdates = { day, title, port, ...buildTimestampUpdateValues() }
    const updatedRows = await db.update(itineraryDayTable).set(itineraryDayUpdates).where(eq(itineraryDayTable.id, id)).returning({ id: itineraryDayTable.id })
    if (!updatedRows[0]?.id) return res.status(404).json({ message: 'Itinerary day not found' })
    const itineraryScope = await getItineraryDayAuditScope(existingItineraryDay)
    await recordPlatformAuditEvent(req, {
      eventType: 'ITINERARY_DAY_UPDATED',
      entityType: 'ITINERARY_DAY',
      entityId: id,
      ...itineraryScope,
      eventPayload: { previous: existingItineraryDay, updates: itineraryDayUpdates }
    })

    return res.status(200).json({ message: 'Itinerary day updated successfully' })
  } catch (error) {
    next(error)
  }
}
exports.deleteItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params
    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, id)

    if (!existingItineraryDay) return res.status(404).json({ message: 'Itinerary day not found' })

    const deletedActivities = await db.select().from(activityScheduleTable).where(eq(activityScheduleTable.itineraryDayId, id))
    await deleteActivitiesForItineraryDayIds([id])
    const deletedRows = await db.delete(itineraryDayTable).where(eq(itineraryDayTable.id, id)).returning({ id: itineraryDayTable.id })
    if (!deletedRows[0]?.id) return res.status(404).json({ message: 'Itinerary day not found' })
    const itineraryScope = await getItineraryDayAuditScope(existingItineraryDay)
    await recordPlatformAuditEvent(req, {
      eventType: 'ITINERARY_DAY_DELETED',
      entityType: 'ITINERARY_DAY',
      entityId: id,
      ...itineraryScope,
      eventPayload: { deletedItineraryDay: existingItineraryDay, deletedActivities }
    })

    return res.status(200).json({ message: 'Itinerary day deleted successfully' })
  } catch (error) {
    next(error)
  }
}

exports.insertActivitySchedule = async (req, res, next) => {
  try {
    const { itineraryDayId } = req.params
    const { time, activity } = req.body
    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, itineraryDayId)

    if (!existingItineraryDay) return res.status(404).json({ message: 'Itinerary day not found' })

    const activityValues = { itineraryDayId, time, activity, ...buildTimestampBridgeValues() }
    const insertedRows = await db.insert(activityScheduleTable).values(activityValues).returning({ id: activityScheduleTable.id })
    const activityScope = await getItineraryDayAuditScope(existingItineraryDay)

    await recordPlatformAuditEvent(req, {
      eventType: 'ITINERARY_ACTIVITY_CREATED',
      entityType: 'ITINERARY_ACTIVITY',
      entityId: insertedRows[0].id,
      ...activityScope,
      eventPayload: { activity: { ...activityValues, id: insertedRows[0].id } }
    })

    return res.status(201).json({ message: 'Activity created successfully', id: insertedRows[0].id })
  } catch (error) {
    next(error)
  }
}

exports.updateActivitySchedule = async (req, res, next) => {
  try {
    const { id } = req.params
    const { time, activity } = req.body
    const existingActivity = await findOne(activityScheduleTable, activityScheduleTable.id, id)

    if (!existingActivity) return res.status(404).json({ message: 'Activity not found' })

    const activityUpdates = { time, activity, ...buildTimestampUpdateValues() }
    const updatedRows = await db.update(activityScheduleTable).set(activityUpdates).where(eq(activityScheduleTable.id, id)).returning({ id: activityScheduleTable.id })
    if (!updatedRows[0]?.id) return res.status(404).json({ message: 'Activity not found' })
    const activityScope = await getActivityAuditScope(id)

    await recordPlatformAuditEvent(req, {
      eventType: 'ITINERARY_ACTIVITY_UPDATED',
      entityType: 'ITINERARY_ACTIVITY',
      entityId: id,
      ...activityScope,
      eventPayload: { previous: existingActivity, updates: activityUpdates }
    })

    return res.status(200).json({ message: 'Activity updated successfully' })
  } catch (error) {
    next(error)
  }
}
exports.deleteActivitySchedule = async (req, res, next) => {
  try {
    const { id } = req.params
    const existingActivity = await findOne(activityScheduleTable, activityScheduleTable.id, id)

    if (!existingActivity) return res.status(404).json({ message: 'Activity not found' })

    const activityScope = await getActivityAuditScope(id)
    const deletedRows = await db.delete(activityScheduleTable).where(eq(activityScheduleTable.id, id)).returning({ id: activityScheduleTable.id })
    if (!deletedRows[0]?.id) return res.status(404).json({ message: 'Activity not found' })
    await recordPlatformAuditEvent(req, {
      eventType: 'ITINERARY_ACTIVITY_DELETED',
      entityType: 'ITINERARY_ACTIVITY',
      entityId: id,
      ...activityScope,
      eventPayload: { deletedActivity: existingActivity }
    })

    return res.status(200).json({ message: 'Activity deleted successfully' })
  } catch (error) {
    next(error)
  }
}
