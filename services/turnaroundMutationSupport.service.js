const sailingTable = require('../models/sailing.model')
const shipTable = require('../models/ship.model')
const appUserTable = require('../models/appUser.model')
const db = require('../db')
const { recordAuditEvent } = require('./auditEvent.service')
const { buildTurnaroundAuditContext } = require('./turnaroundScope.service')
const { buildEntityHistoryPayload } = require('./entityHistory.service')
const { and, eq, like } = require('drizzle-orm')

function buildTurnaroundHistoryPayload({ operation = {}, previous = null, next = null, entityRefs = {}, metadata = {} } = {}) {
  return buildEntityHistoryPayload({
    previous,
    next,
    entityRefs: {
      operationId: operation?.id || null,
      sailingId: operation?.sailingId || null,
      ...entityRefs
    },
    metadata: {
      domain: 'turnaround-operations',
      historyShape: 'TURNAROUND_BEFORE_AFTER_V1',
      ...metadata
    }
  })
}

function mergeTurnaroundEntity(previous = {}, updates = {}) {
  return {
    ...(previous || {}),
    ...(updates || {})
  }
}

async function recordTurnaroundAuditEvent(req, operation, event) {
  const context = await buildTurnaroundAuditContext(req, operation)
  return recordAuditEvent({
    ...context,
    ...event
  })
}

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

module.exports = {
  buildTurnaroundHistoryPayload,
  mergeTurnaroundEntity,
  recordTurnaroundAuditEvent,
  resolveOperationalUserIdByName
}
