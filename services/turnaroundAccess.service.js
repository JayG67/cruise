const { and, eq } = require('drizzle-orm')

const db = require('../db')
const appUserTable = require('../models/appUser.model')
const appUserRoleTable = require('../models/appUserRole.model')
const sailingTable = require('../models/sailing.model')
const shipTable = require('../models/ship.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')
const { isAdminRole, normalizeRole } = require('./requestAuthorization.service')

const TURNAROUND_ACCESS_FORBIDDEN_MESSAGE = 'You do not have access to modify this turnaround operation.'
const TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE = 'You do not have access to modify this turnaround department.'

function normalizeOperationalRole(role = '') {
  return normalizeRole(role)
}

function isTurnaroundManager(role = '') {
  return normalizeOperationalRole(role) === 'TURNAROUND_MANAGER'
}

function canRoleManageDepartment(role = '', departmentRole = '') {
  const normalizedRole = normalizeOperationalRole(role)
  const normalizedDepartment = normalizeOperationalRole(departmentRole)
  return isAdminRole(normalizedRole) || isTurnaroundManager(normalizedRole) || Boolean(normalizedRole && normalizedRole === normalizedDepartment)
}

async function selectFirst(table, predicate) {
  const rows = await db.select().from(table).where(predicate).limit(1)
  return rows[0] || null
}

async function resolvePrincipalOperationalScope(req = {}) {
  const principal = req?.requestIdentity?.principal || null
  if (!principal?.userId) return null

  if (isAdminRole(principal.role)) {
    return { userId: principal.userId, role: normalizeOperationalRole(principal.role), isAdmin: true, cruiseLineId: null, assignedShipId: null }
  }

  const appUser = await selectFirst(appUserTable, eq(appUserTable.id, principal.userId))
  if (!appUser || String(appUser.status || '').toUpperCase() !== 'ACTIVE') return null

  const normalizedRole = normalizeOperationalRole(principal.role)
  const roleRows = await db
    .select()
    .from(appUserRoleTable)
    .where(and(eq(appUserRoleTable.userId, principal.userId), eq(appUserRoleTable.status, 'ACTIVE')))
  const matchedRole = roleRows.find(row => normalizeOperationalRole(row.roleId) === normalizedRole)
  if (!matchedRole) return null

  return {
    userId: principal.userId,
    role: normalizedRole,
    isAdmin: false,
    cruiseLineId: matchedRole.cruiseLineId || appUser.cruiseLineId || null,
    assignedShipId: matchedRole.assignedShipId || appUser.assignedShipId || null
  }
}

async function resolveOperationContext(operationId) {
  if (!operationId) return null
  const operation = await selectFirst(turnaroundOperationTable, eq(turnaroundOperationTable.id, operationId))
  if (!operation) return null
  const sailing = await selectFirst(sailingTable, eq(sailingTable.id, operation.sailingId))
  if (!sailing) return null
  const ship = await selectFirst(shipTable, eq(shipTable.id, sailing.shipId))
  if (!ship) return null
  return { operation, sailing, ship }
}

async function canAccessOperationScope(req, operationId) {
  const scope = await resolvePrincipalOperationalScope(req)
  if (!scope) return false
  if (scope.isAdmin) return true
  if (!isTurnaroundManager(scope.role) && !scope.role.endsWith('_LEAD')) return false

  const context = await resolveOperationContext(operationId)
  if (!context) return false
  if (scope.assignedShipId) return scope.assignedShipId === context.ship.id
  if (scope.cruiseLineId) return scope.cruiseLineId === context.ship.cruiseLineId
  return false
}


async function canReadTurnaroundOperations(req) {
  const scope = await resolvePrincipalOperationalScope(req)
  if (!scope) return false
  if (scope.isAdmin) return true
  return isTurnaroundManager(scope.role) || scope.role.endsWith('_LEAD')
}

async function canManageOperation(req, operationId) {
  const scope = await resolvePrincipalOperationalScope(req)
  if (!scope) return false
  if (scope.isAdmin) return true
  if (!isTurnaroundManager(scope.role)) return false
  return canAccessOperationScope(req, operationId)
}

async function canManageOperationDepartment(req, operationId, departmentRole) {
  const scope = await resolvePrincipalOperationalScope(req)
  if (!scope) return false
  if (!canRoleManageDepartment(scope.role, departmentRole)) return false
  return canAccessOperationScope(req, operationId)
}

async function resolveTask(id) {
  return id ? selectFirst(turnaroundTaskTable, eq(turnaroundTaskTable.id, id)) : null
}

async function resolveEscalation(id) {
  return id ? selectFirst(turnaroundEscalationTable, eq(turnaroundEscalationTable.id, id)) : null
}

async function resolveHandoff(id) {
  return id ? selectFirst(turnaroundHandoffTable, eq(turnaroundHandoffTable.id, id)) : null
}

async function canManageTask(req, taskId) {
  const task = await resolveTask(taskId)
  if (!task) return false
  return canManageOperationDepartment(req, task.operationId, task.departmentRole)
}

async function canManageEscalation(req, escalationId) {
  const escalation = await resolveEscalation(escalationId)
  if (!escalation) return false
  return canManageOperationDepartment(req, escalation.operationId, escalation.departmentRole)
}

async function canManageHandoff(req, handoffId) {
  const handoff = await resolveHandoff(handoffId)
  if (!handoff) return false
  const scope = await resolvePrincipalOperationalScope(req)
  if (!scope) return false
  const allowedDepartment = canRoleManageDepartment(scope.role, handoff.fromDepartmentRole) || canRoleManageDepartment(scope.role, handoff.toDepartmentRole)
  if (!allowedDepartment) return false
  return canAccessOperationScope(req, handoff.operationId)
}

module.exports = {
  TURNAROUND_ACCESS_FORBIDDEN_MESSAGE,
  TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE,
  canAccessOperationScope,
  canManageEscalation,
  canReadTurnaroundOperations,
  canManageHandoff,
  canManageOperation,
  canManageOperationDepartment,
  canManageTask,
  canRoleManageDepartment,
  isTurnaroundManager,
  normalizeOperationalRole,
  resolveOperationContext,
  resolvePrincipalOperationalScope
}
