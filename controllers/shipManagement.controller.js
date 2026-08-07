const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { recordPlatformAuditEvent } = require('../services/platformAudit.service')
const { buildEntityHistoryPayload, buildEntityLifecycleTimestamps, buildEntityUpdateTimestamp } = require('../services/entityHistory.service')
const { withShipApiIdentity } = require('../services/apiIdentityBridge.service')
const { deleteShipHierarchy } = require('../services/fleetHierarchy.service')
const { eq } = require('drizzle-orm')

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
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

    return res.status(200).json(ships.map(withShipApiIdentity))
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

    const shipValues = { name, cruiseLineId, ...buildEntityLifecycleTimestamps() }
    if (currentPort !== undefined) {
      shipValues.currentPort = currentPort
    }
    const insertedRows = await db
      .insert(shipTable)
      .values(shipValues)
      .returning({ id: shipTable.id })

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'SHIP_CREATED',
      entityType: 'SHIP',
      entityId: insertedRows[0].id,
      cruiseLineId,
      shipId: insertedRows[0].id,
      eventPayload: buildEntityHistoryPayload({
        next: shipValues,
        entityRefs: { cruiseLineId, shipId: insertedRows[0].id },
        metadata: { operation: 'create' }
      })
    })

    return res.status(201).json({
      message: 'Ship created successfully',
      id: insertedRows[0].id
    })
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

    const shipUpdates = { name, cruiseLineId, ...buildEntityUpdateTimestamp() }
    if (currentPort !== undefined) {
      shipUpdates.currentPort = currentPort
    }
    await db
      .update(shipTable)
      .set(shipUpdates)
      .where(eq(shipTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'SHIP_UPDATED',
      entityType: 'SHIP',
      entityId: id,
      cruiseLineId,
      shipId: id,
      eventPayload: buildEntityHistoryPayload({
        previous: existingShipRows[0],
        next: { ...existingShipRows[0], ...shipUpdates },
        entityRefs: { cruiseLineId, shipId: id },
        metadata: { operation: 'update' }
      })
    })

    return res.status(200).json({ message: 'Ship updated successfully' })
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

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'SHIP_DELETED',
      entityType: 'SHIP',
      entityId: id,
      cruiseLineId: existingRows[0].cruiseLineId || null,
      shipId: null,
      sailingId: null,
      eventPayload: buildEntityHistoryPayload({ previous: existingRows[0], entityRefs: { cruiseLineId: existingRows[0].cruiseLineId || null, shipId: id }, metadata: { operation: 'delete' } })
    })

    return res.status(200).json({ message: 'Ship deleted successfully' })
  } catch (err) {
    next(err)
  }
}
