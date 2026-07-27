const { and, desc, eq } = require('drizzle-orm')

const auditEventTable = require('../models/auditEvent.model')
const db = require('../db')


function parseAuditPayload(eventPayload) {
  if (!eventPayload) return null

  try {
    return JSON.parse(eventPayload)
  } catch (error) {
    return eventPayload
  }
}

function mapAuditEvent(row = {}) {
  return {
    id: row.id,
    eventType: row.eventType,
    entityType: row.entityType,
    entityId: row.entityId,
    actorUserId: row.actorUserId,
    actorDisplayName: row.actorDisplayName,
    cruiseLineId: row.cruiseLineId,
    shipId: row.shipId,
    sailingId: row.sailingId,
    operationId: row.operationId,
    source: row.source,
    eventPayload: parseAuditPayload(row.eventPayload),
    createdAt: row.createdAt,
    createdAtTimestamp: row.createdAtTimestamp || null
  }
}

function normalizeAuditEventLimit(limit = 25) {
  const parsedLimit = Number(limit)
  if (!Number.isFinite(parsedLimit)) return 25
  return Math.max(1, Math.min(100, Math.trunc(parsedLimit)))
}

function serializeAuditPayload(payload = {}) {
  if (!payload || Object.keys(payload).length === 0) {
    return null
  }

  return JSON.stringify(payload)
}

function buildAuditEventValues({
  eventType,
  entityType,
  entityId,
  actorUserId = null,
  actorDisplayName = null,
  cruiseLineId = null,
  shipId = null,
  sailingId = null,
  operationId = null,
  source = 'APPLICATION',
  eventPayload = null,
  createdAt = new Date().toISOString(),
  createdAtTimestamp = new Date(createdAt)
}) {
  if (!eventType) {
    throw new Error('Audit event type is required.')
  }

  if (!entityType) {
    throw new Error('Audit entity type is required.')
  }

  if (!entityId) {
    throw new Error('Audit entity id is required.')
  }

  return {
    eventType,
    entityType,
    entityId,
    actorUserId,
    actorDisplayName,
    cruiseLineId,
    shipId,
    sailingId,
    operationId,
    source,
    eventPayload: typeof eventPayload === 'string' ? eventPayload : serializeAuditPayload(eventPayload),
    createdAt,
    createdAtTimestamp
  }
}


async function listAuditEvents(filters = {}, { limit = 25 } = {}) {
  const conditions = []

  for (const [field, column] of Object.entries({
    eventType: auditEventTable.eventType,
    entityType: auditEventTable.entityType,
    entityId: auditEventTable.entityId,
    actorUserId: auditEventTable.actorUserId,
    cruiseLineId: auditEventTable.cruiseLineId,
    shipId: auditEventTable.shipId,
    sailingId: auditEventTable.sailingId,
    operationId: auditEventTable.operationId,
    source: auditEventTable.source
  })) {
    if (filters[field]) {
      conditions.push(eq(column, filters[field]))
    }
  }

  let query = db
    .select()
    .from(auditEventTable)

  if (conditions.length === 1) {
    query = query.where(conditions[0])
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions))
  }

  const rows = await query
    .orderBy(desc(auditEventTable.createdAt))
    .limit(normalizeAuditEventLimit(limit))

  return rows.map(mapAuditEvent)
}

async function listAuditEventsForOperation(operationId, { limit = 25 } = {}) {
  if (!operationId) return []

  return listAuditEvents({ operationId }, { limit })
}

async function recordAuditEvent(event) {
  const values = buildAuditEventValues(event)
  await db.insert(auditEventTable).values(values)
  return values
}

module.exports = {
  buildAuditEventValues,
  listAuditEvents,
  listAuditEventsForOperation,
  mapAuditEvent,
  normalizeAuditEventLimit,
  parseAuditPayload,
  recordAuditEvent
}
