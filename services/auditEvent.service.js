const auditEventTable = require('../models/auditEvent.model')
const db = require('../db')

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
  createdAt = new Date().toISOString()
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
    createdAt
  }
}

async function recordAuditEvent(event) {
  const values = buildAuditEventValues(event)
  await db.insert(auditEventTable).values(values)
  return values
}

module.exports = {
  buildAuditEventValues,
  recordAuditEvent
}
