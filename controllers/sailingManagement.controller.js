const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const { recordPlatformAuditEvent } = require('../services/platformAudit.service')
const { getSailingAuditScope } = require('../services/sailingAuditScope.service')
const { buildEntityHistoryPayload, buildEntityLifecycleTimestamps, buildEntityUpdateTimestamp } = require('../services/entityHistory.service')
const { withSailingApiIdentity } = require('../services/apiIdentityBridge.service')
const { deleteItineraryForSailingIds } = require('../services/fleetHierarchy.service')
const db = require('../db')
const { eq } = require('drizzle-orm')

async function findOne(table, column, id) {
  const rows = await db.select().from(table).where(eq(column, id)).limit(1)
  return rows[0]
}

exports.getSailingsByShip = async (req, res, next) => {
  try {
    const { shipId } = req.params
    const ship = await findOne(shipTable, shipTable.id, shipId)

    if (!ship) return res.status(404).json({ message: 'Ship not found' })

    const sailings = await db.select().from(sailingTable).where(eq(sailingTable.shipId, shipId))
    return res.status(200).json((sailings || []).map(withSailingApiIdentity))
  } catch (error) {
    next(error)
  }
}

exports.insertSailing = async (req, res, next) => {
  try {
    const { shipId } = req.params
    const { departureDate, departurePort, arrivalPort, days, isRepositioning } = req.body
    const existingShip = await findOne(shipTable, shipTable.id, shipId)

    if (!existingShip) return res.status(404).json({ message: 'Ship not found' })

    const sailingValues = {
      shipId,
      departureDate,
      port: departurePort,
      departurePort,
      arrivalPort,
      days,
      isRepositioning: Boolean(isRepositioning),
      ...buildEntityLifecycleTimestamps()
    }
    const insertedRows = await db.insert(sailingTable).values(sailingValues).returning({ id: sailingTable.id })

    await recordPlatformAuditEvent(req, {
      eventType: 'SAILING_CREATED',
      entityType: 'SAILING',
      entityId: insertedRows[0].id,
      cruiseLineId: existingShip.cruiseLineId || null,
      shipId,
      sailingId: insertedRows[0].id,
      eventPayload: buildEntityHistoryPayload({
        next: sailingValues,
        entityRefs: { cruiseLineId: existingShip.cruiseLineId || null, shipId, sailingId: insertedRows[0].id },
        metadata: { operation: 'create' }
      })
    })

    return res.status(201).json({ message: 'Sailing created successfully', id: insertedRows[0].id })
  } catch (error) {
    next(error)
  }
}

exports.updateSailing = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departureDate, departurePort, arrivalPort, days, isRepositioning } = req.body
    const existingSailing = await findOne(sailingTable, sailingTable.id, id)

    if (!existingSailing) return res.status(404).json({ message: 'Sailing not found' })

    const sailingUpdates = {
      departureDate,
      port: departurePort,
      departurePort,
      arrivalPort,
      days,
      isRepositioning: Boolean(isRepositioning),
      ...buildEntityUpdateTimestamp()
    }
    await db.update(sailingTable).set(sailingUpdates).where(eq(sailingTable.id, id))

    const sailingScope = await getSailingAuditScope(existingSailing)
    await recordPlatformAuditEvent(req, {
      eventType: 'SAILING_UPDATED',
      entityType: 'SAILING',
      entityId: id,
      ...sailingScope,
      eventPayload: buildEntityHistoryPayload({
        previous: existingSailing,
        next: { ...existingSailing, ...sailingUpdates },
        entityRefs: { cruiseLineId: sailingScope.cruiseLineId, shipId: sailingScope.shipId, sailingId: id },
        metadata: { operation: 'update' }
      })
    })

    return res.status(200).json({ message: 'Sailing updated successfully' })
  } catch (error) {
    next(error)
  }
}

exports.deleteSailing = async (req, res, next) => {
  try {
    const { id } = req.params
    const existingSailing = await findOne(sailingTable, sailingTable.id, id)

    if (!existingSailing) return res.status(404).json({ message: 'Sailing not found' })

    await deleteItineraryForSailingIds([id])
    await db.delete(sailingTable).where(eq(sailingTable.id, id))

    const sailingScope = await getSailingAuditScope(existingSailing)
    await recordPlatformAuditEvent(req, {
      eventType: 'SAILING_DELETED',
      entityType: 'SAILING',
      entityId: id,
      ...sailingScope,
      sailingId: null,
      eventPayload: buildEntityHistoryPayload({
        previous: existingSailing,
        entityRefs: { cruiseLineId: sailingScope.cruiseLineId, shipId: sailingScope.shipId, sailingId: id },
        metadata: { operation: 'delete' }
      })
    })

    return res.status(200).json({ message: 'Sailing deleted successfully' })
  } catch (error) {
    next(error)
  }
}

