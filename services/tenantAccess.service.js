const { and, eq } = require('drizzle-orm')

const db = require('../db')
const appUserTable = require('../models/appUser.model')
const appUserRoleTable = require('../models/appUserRole.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const { isAdminRole, normalizeRole } = require('./requestAuthorization.service')

const TENANT_ACCESS_FORBIDDEN_MESSAGE = 'You do not have access to this cruise-line tenant.'
const GLOBAL_ADMIN_REQUIRED_MESSAGE = 'This operation requires a global administrator.'

async function selectFirst(table, predicate) {
  const rows = await db.select().from(table).where(predicate).limit(1)
  return rows[0] || null
}

async function resolvePrincipalTenantScope(req = {}) {
  const principal = req?.requestIdentity?.principal || null
  if (!principal?.userId || !isAdminRole(principal.role)) return null

  const appUser = await selectFirst(appUserTable, eq(appUserTable.id, principal.userId))
  if (!appUser || String(appUser.status || '').toUpperCase() !== 'ACTIVE') return null

  const activeRoles = await db
    .select()
    .from(appUserRoleTable)
    .where(and(eq(appUserRoleTable.userId, principal.userId), eq(appUserRoleTable.status, 'ACTIVE')))

  const normalizedRole = normalizeRole(principal.role)
  const assignment = activeRoles.find(row => normalizeRole(row.roleId) === normalizedRole)
  if (!assignment) return null

  const assignmentScope = String(assignment.assignmentScope || '').trim().toUpperCase()
  const cruiseLineId = assignment.cruiseLineId || appUser.cruiseLineId || null
  const assignedShipId = assignment.assignedShipId || appUser.assignedShipId || null
  const isGlobalAdmin = assignmentScope === 'GLOBAL' && !cruiseLineId && !assignedShipId

  const claimedTenantId = String(principal.tenantId || '').trim() || null
  if (!isGlobalAdmin && claimedTenantId && claimedTenantId !== cruiseLineId) return null

  return {
    userId: principal.userId,
    role: normalizedRole,
    assignmentScope,
    isGlobalAdmin,
    cruiseLineId,
    assignedShipId
  }
}

async function canAccessCruiseLineTenant(req, cruiseLineId) {
  const scope = await resolvePrincipalTenantScope(req)
  if (!scope || !cruiseLineId) return false
  if (scope.isGlobalAdmin) return true
  return Boolean(scope.cruiseLineId && scope.cruiseLineId === String(cruiseLineId))
}

async function canCreateCruiseLineTenant(req) {
  const scope = await resolvePrincipalTenantScope(req)
  return Boolean(scope?.isGlobalAdmin)
}

async function resolveShipTenant(shipId) {
  if (!shipId) return null
  const ship = await selectFirst(shipTable, eq(shipTable.id, shipId))
  return ship ? { cruiseLineId: ship.cruiseLineId, shipId: ship.id } : null
}

async function resolveSailingTenant(sailingId) {
  if (!sailingId) return null
  const sailing = await selectFirst(sailingTable, eq(sailingTable.id, sailingId))
  if (!sailing) return null
  const shipScope = await resolveShipTenant(sailing.shipId)
  return shipScope ? { ...shipScope, sailingId: sailing.id } : null
}

async function resolveItineraryDayTenant(itineraryDayId) {
  if (!itineraryDayId) return null
  const day = await selectFirst(itineraryDayTable, eq(itineraryDayTable.id, itineraryDayId))
  if (!day) return null
  const sailingScope = await resolveSailingTenant(day.sailingId)
  return sailingScope ? { ...sailingScope, itineraryDayId: day.id } : null
}

async function resolveActivityTenant(activityId) {
  if (!activityId) return null
  const activity = await selectFirst(activityScheduleTable, eq(activityScheduleTable.id, activityId))
  if (!activity) return null
  const dayScope = await resolveItineraryDayTenant(activity.itineraryDayId)
  return dayScope ? { ...dayScope, activityId: activity.id } : null
}

async function canAccessResolvedTenant(req, resourceScope) {
  if (!resourceScope?.cruiseLineId) return false
  return canAccessCruiseLineTenant(req, resourceScope.cruiseLineId)
}

async function canAccessShipTenant(req, shipId) {
  return canAccessResolvedTenant(req, await resolveShipTenant(shipId))
}

async function canAccessSailingTenant(req, sailingId) {
  return canAccessResolvedTenant(req, await resolveSailingTenant(sailingId))
}

async function canAccessItineraryDayTenant(req, itineraryDayId) {
  return canAccessResolvedTenant(req, await resolveItineraryDayTenant(itineraryDayId))
}

async function canAccessActivityTenant(req, activityId) {
  return canAccessResolvedTenant(req, await resolveActivityTenant(activityId))
}

function constrainAuditFiltersToTenant(filters = {}, scope = {}) {
  const normalized = { ...filters }
  if (!scope || scope.isGlobalAdmin) return normalized
  if (!scope.cruiseLineId) return null
  if (normalized.cruiseLineId && normalized.cruiseLineId !== scope.cruiseLineId) return null
  normalized.cruiseLineId = scope.cruiseLineId
  return normalized
}

module.exports = {
  GLOBAL_ADMIN_REQUIRED_MESSAGE,
  TENANT_ACCESS_FORBIDDEN_MESSAGE,
  canAccessActivityTenant,
  canAccessCruiseLineTenant,
  canAccessItineraryDayTenant,
  canAccessSailingTenant,
  canAccessShipTenant,
  canCreateCruiseLineTenant,
  constrainAuditFiltersToTenant,
  resolveActivityTenant,
  resolveItineraryDayTenant,
  resolvePrincipalTenantScope,
  resolveSailingTenant,
  resolveShipTenant
}
