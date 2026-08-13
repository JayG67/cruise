const { and, eq, inArray } = require('drizzle-orm')

const db = require('../db')
const demoUserTable = require('../models/demoUser.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const { getScopedDemoUserId } = require('../middleware/requestIdentity.middleware')
const { resolveRequestAuditActor } = require('./requestAuthorization.service')
const { AUTH_MODES, getAuthenticationMode } = require('./authentication.service')
const { canAccessOperationScope, resolvePrincipalOperationalScope } = require('./turnaroundAccess.service')

const TURNAROUND_OPERATION_FORBIDDEN_MESSAGE = 'Selected person is not assigned to this turnaround operation'
const TURNAROUND_AUDIT_SOURCE = 'TURNAROUND_OPERATIONS_API'

function isOperationalDemoRole(role = '') {
  const normalizedRole = String(role || '').toLowerCase().replace(/_/g, '-')
  return [
    'turnaround-manager',
    'housekeeping-lead',
    'guest-services-lead',
    'food-beverage-lead',
    'engineering-lead'
  ].some(operationalRole => normalizedRole.includes(operationalRole))
}

async function selectByIds(table, column, ids) {
  const filteredIds = [...new Set((ids || []).filter(Boolean))]
  if (filteredIds.length === 0) return []
  return db.select().from(table).where(inArray(column, filteredIds))
}

async function resolveRequestDemoUser(req) {
  const demoUserId = getScopedDemoUserId(req)
  if (!demoUserId) return null

  const demoUserRows = await db
    .select()
    .from(demoUserTable)
    .where(eq(demoUserTable.id, demoUserId))
    .limit(1)

  return demoUserRows[0] || null
}

async function getSailingIdsForOperationalAssignment(demoUser) {
  if (!demoUser || !isOperationalDemoRole(demoUser.role)) return null

  if (demoUser.assignedShipId) {
    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.shipId, demoUser.assignedShipId))

    return sailingRows.map(sailing => sailing.id)
  }

  if (demoUser.cruiseLineId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.cruiseLineId, demoUser.cruiseLineId))

    const sailingRows = await selectByIds(
      sailingTable,
      sailingTable.shipId,
      shipRows.map(ship => ship.id)
    )

    return sailingRows.map(sailing => sailing.id)
  }

  return []
}

async function getTurnaroundOperationsForRequest(req) {
  if (getAuthenticationMode() === AUTH_MODES.JWT) {
    const scope = await resolvePrincipalOperationalScope(req)
    if (!scope) return []
    if (scope.isGlobalAdmin) return db.select().from(turnaroundOperationTable)

    let sailingRows = []
    if (scope.assignedShipId) {
      sailingRows = await db.select().from(sailingTable).where(eq(sailingTable.shipId, scope.assignedShipId))
    } else if (scope.cruiseLineId) {
      const shipRows = await db.select().from(shipTable).where(eq(shipTable.cruiseLineId, scope.cruiseLineId))
      sailingRows = await selectByIds(sailingTable, sailingTable.shipId, shipRows.map(ship => ship.id))
    }

    const sailingIds = sailingRows.map(sailing => sailing.id)
    if (sailingIds.length === 0) return []
    return db.select().from(turnaroundOperationTable).where(inArray(turnaroundOperationTable.sailingId, sailingIds))
  }

  const demoUser = await resolveRequestDemoUser(req)

  if (!getScopedDemoUserId(req)) {
    return db.select().from(turnaroundOperationTable)
  }

  if (!demoUser) return []

  const scopedSailingIds = await getSailingIdsForOperationalAssignment(demoUser)

  if (scopedSailingIds === null) {
    return db.select().from(turnaroundOperationTable)
  }

  if (scopedSailingIds.length === 0) return []

  return db
    .select()
    .from(turnaroundOperationTable)
    .where(inArray(turnaroundOperationTable.sailingId, scopedSailingIds))
}

async function canAccessTurnaroundOperationForRequest(req, operation) {
  if (!operation) return false
  if (getAuthenticationMode() === AUTH_MODES.JWT) {
    return canAccessOperationScope(req, operation.id)
  }
  if (!getScopedDemoUserId(req)) return true

  const demoUser = await resolveRequestDemoUser(req)
  if (!demoUser) return false

  const scopedSailingIds = await getSailingIdsForOperationalAssignment(demoUser)

  if (scopedSailingIds === null) return true

  return scopedSailingIds.includes(operation.sailingId)
}

async function getTurnaroundScopeForOperation(operation = {}) {
  const context = {
    cruiseLineId: null,
    shipId: null,
    sailingId: operation?.sailingId || null,
    operationId: operation?.id || null
  }

  if (!operation?.sailingId) return context

  const scopeRows = await db
    .select({
      sailingId: sailingTable.id,
      shipId: sailingTable.shipId,
      cruiseLineId: shipTable.cruiseLineId
    })
    .from(sailingTable)
    .leftJoin(shipTable, eq(sailingTable.shipId, shipTable.id))
    .where(eq(sailingTable.id, operation.sailingId))
    .limit(1)

  const scope = scopeRows[0]
  if (!scope) return context

  return {
    cruiseLineId: scope.cruiseLineId || null,
    shipId: scope.shipId || null,
    sailingId: scope.sailingId || operation.sailingId || null,
    operationId: operation?.id || null
  }
}

async function buildTurnaroundAuditContext(req, operation = {}) {
  const actor = await resolveRequestAuditActor(req)
  const scope = await getTurnaroundScopeForOperation(operation)

  return {
    actorUserId: actor.actorUserId || null,
    actorDisplayName: actor.actorDisplayName || null,
    ...scope,
    source: TURNAROUND_AUDIT_SOURCE
  }
}

function sendTurnaroundOperationForbidden(res) {
  return res.status(403).json({ message: TURNAROUND_OPERATION_FORBIDDEN_MESSAGE })
}

module.exports = {
  TURNAROUND_OPERATION_FORBIDDEN_MESSAGE,
  buildTurnaroundAuditContext,
  canAccessTurnaroundOperationForRequest,
  getSailingIdsForOperationalAssignment,
  getTurnaroundOperationsForRequest,
  getTurnaroundScopeForOperation,
  isOperationalDemoRole,
  resolveRequestDemoUser,
  sendTurnaroundOperationForbidden
}
