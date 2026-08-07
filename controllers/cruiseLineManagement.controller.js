const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const db = require('../db')
const { recordPlatformAuditEvent } = require('../services/platformAudit.service')
const { buildEntityHistoryPayload, buildEntityLifecycleTimestamps, buildEntityUpdateTimestamp } = require('../services/entityHistory.service')
const { withCruiseLineApiIdentity } = require('../services/apiIdentityBridge.service')
const { deleteSailingsForShipIds } = require('../services/fleetHierarchy.service')
const { eq } = require('drizzle-orm')

function buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }) {
  return Object.fromEntries(
    Object.entries({ name, country, website, brandFamily, brandTheme, marketPositioning })
      .filter(([, value]) => value !== undefined)
  )
}

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
}

exports.getCruiseLines = async (req, res, next) => {
  try {
    const cruiseLines = await db.select().from(cruiseLineTable)

    if (!cruiseLines || cruiseLines.length === 0) {
      return res.status(404).json({ message: 'No cruise lines found' })
    }

    return res.status(200).json(cruiseLines.map(withCruiseLineApiIdentity))
  } catch (err) {
    next(err)
  }
}

exports.getMissingCruiseLineId = async (req, res) => {
  return res.status(404).json({ message: 'Cruise line not found' })
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

    return res.status(200).json(withCruiseLineApiIdentity(cruiseLine))
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

    const cruiseLineValues = {
      ...buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }),
      ...buildEntityLifecycleTimestamps()
    }
    const insertedRows = await db
      .insert(cruiseLineTable)
      .values(cruiseLineValues)
      .returning({ id: cruiseLineTable.id })

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CRUISE_LINE_CREATED',
      entityType: 'CRUISE_LINE',
      entityId: insertedRows[0].id,
      cruiseLineId: insertedRows[0].id,
      eventPayload: buildEntityHistoryPayload({
        next: cruiseLineValues,
        entityRefs: { cruiseLineId: insertedRows[0].id },
        metadata: { operation: 'create' }
      })
    })

    return res.status(201).json({
      message: 'Cruise line created successfully',
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

    const cruiseLineUpdates = {
      ...buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }),
      ...buildEntityUpdateTimestamp()
    }
    await db
      .update(cruiseLineTable)
      .set(cruiseLineUpdates)
      .where(eq(cruiseLineTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CRUISE_LINE_UPDATED',
      entityType: 'CRUISE_LINE',
      entityId: id,
      cruiseLineId: id,
      eventPayload: buildEntityHistoryPayload({
        previous: existingRows[0],
        next: { ...existingRows[0], ...cruiseLineUpdates },
        entityRefs: { cruiseLineId: id },
        metadata: { operation: 'update' }
      })
    })

    return res.status(200).json({ message: 'Cruise line updated successfully' })
  } catch (err) {
    next(err)
  }
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

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CRUISE_LINE_DELETED',
      entityType: 'CRUISE_LINE',
      entityId: id,
      cruiseLineId: null,
      shipId: null,
      sailingId: null,
      eventPayload: buildEntityHistoryPayload({ previous: existingRows[0], entityRefs: { cruiseLineId: id, deletedShipIds: shipIds }, metadata: { operation: 'delete' } })
    })

    return res.status(200).json({ message: 'Cruise line deleted successfully' })
  } catch (err) {
    next(err)
  }
}

