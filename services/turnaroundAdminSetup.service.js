const { and, eq, ne } = require('drizzle-orm')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const demoUserTable = require('../models/demoUser.model')

const TURNAROUND_OPERATIONAL_ROLES = [
  'turnaround-manager',
  'housekeeping-lead',
  'guest-services-lead',
  'food-beverage-lead',
  'engineering-lead',
  'security-lead',
  'port-operations-lead'
]

function normalizeOperationalRole(role = '') {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
}

function isTurnaroundOperationalRole(role = '') {
  return TURNAROUND_OPERATIONAL_ROLES.includes(normalizeOperationalRole(role))
}

function toDemoUserRole(role = '') {
  return normalizeOperationalRole(role).toUpperCase().replace(/-/g, '_')
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function getCruiseLineById(cruiseLineId) {
  if (!cruiseLineId) return null
  const rows = await db.select().from(cruiseLineTable).where(eq(cruiseLineTable.id, cruiseLineId)).limit(1)
  return rows[0] || null
}

async function getShipById(shipId) {
  if (!shipId) return null
  const rows = await db.select().from(shipTable).where(eq(shipTable.id, shipId)).limit(1)
  return rows[0] || null
}

async function getSailingById(sailingId) {
  if (!sailingId) return null
  const rows = await db.select().from(sailingTable).where(eq(sailingTable.id, sailingId)).limit(1)
  return rows[0] || null
}

async function assertShipBelongsToCruiseLine({ shipId, cruiseLineId }) {
  if (!shipId) return null

  const ship = await getShipById(shipId)
  if (!ship) {
    const error = new Error('Assigned ship was not found.')
    error.statusCode = 404
    throw error
  }

  if (cruiseLineId && ship.cruiseLineId !== cruiseLineId) {
    const error = new Error('Turnaround personnel can only be assigned to ships within their cruise line.')
    error.statusCode = 400
    throw error
  }

  return ship
}

async function assertSailingBelongsToShip({ sailingId, shipId }) {
  if (!sailingId) return null

  const sailing = await getSailingById(sailingId)
  if (!sailing) {
    const error = new Error('Assigned sailing was not found.')
    error.statusCode = 404
    throw error
  }

  if (shipId && sailing.shipId !== shipId) {
    const error = new Error('Turnaround assignment sailing must belong to the selected ship.')
    error.statusCode = 400
    throw error
  }

  return sailing
}

async function assertSingleCruiseLineAssignment({ displayName, userIdToExclude = '', cruiseLineId }) {
  if (!displayName || !cruiseLineId) return

  const matches = await db
    .select()
    .from(demoUserTable)
    .where(eq(demoUserTable.displayName, displayName))

  const conflictingMatch = matches.find(user => (
    user.id !== userIdToExclude
    && isTurnaroundOperationalRole(user.role)
    && user.cruiseLineId
    && user.cruiseLineId !== cruiseLineId
  ))

  if (conflictingMatch) {
    const error = new Error('Turnaround personnel can belong to exactly one cruise line. This person already has a different cruise line assignment.')
    error.statusCode = 400
    throw error
  }
}

async function buildTurnaroundSetupSummary() {
  const [demoUsers, cruiseLines, ships, sailings] = await Promise.all([
    db.select().from(demoUserTable),
    db.select().from(cruiseLineTable),
    db.select().from(shipTable),
    db.select().from(sailingTable)
  ])

  const turnaroundPeople = demoUsers
    .filter(user => isTurnaroundOperationalRole(user.role))
    .map(user => ({
      ...user,
      roleView: normalizeOperationalRole(user.role),
      role: normalizeOperationalRole(user.role)
    }))
    .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)))

  return {
    turnaroundPeople,
    cruiseLines,
    ships,
    sailings,
    supportedRoles: TURNAROUND_OPERATIONAL_ROLES
  }
}

function buildDemoUserId({ displayName, role, cruiseLineId, shipId }) {
  const prefix = `tu-${slugify(displayName).slice(0, 8) || 'person'}`
  const roleToken = slugify(role).split('-').map(part => part[0]).join('').slice(0, 4) || 'role'
  const scopeToken = slugify(shipId || cruiseLineId).replace(/-/g, '').slice(0, 5) || 'scope'
  return `${prefix}-${roleToken}-${scopeToken}`.slice(0, 20)
}

async function createTurnaroundPerson(payload = {}) {
  const displayName = String(payload.displayName || '').trim()
  const role = normalizeOperationalRole(payload.role)
  const cruiseLineId = payload.cruiseLineId || null
  const assignedShipId = payload.assignedShipId || null
  const sailingId = payload.sailingId || null

  if (!displayName) {
    const error = new Error('Turnaround person display name is required.')
    error.statusCode = 400
    throw error
  }

  if (!isTurnaroundOperationalRole(role)) {
    const error = new Error('A supported turnaround operational role is required.')
    error.statusCode = 400
    throw error
  }

  const cruiseLine = await getCruiseLineById(cruiseLineId)
  if (!cruiseLine) {
    const error = new Error('A valid cruise line is required for turnaround personnel.')
    error.statusCode = 400
    throw error
  }

  const ship = await assertShipBelongsToCruiseLine({ shipId: assignedShipId, cruiseLineId })
  await assertSailingBelongsToShip({ sailingId, shipId: assignedShipId })
  await assertSingleCruiseLineAssignment({ displayName, cruiseLineId })

  const requestedId = String(payload.id || '').trim()
  let id = requestedId || buildDemoUserId({ displayName, role, cruiseLineId, shipId: assignedShipId })
  const existingIdRows = await db.select().from(demoUserTable).where(eq(demoUserTable.id, id)).limit(1)
  if (existingIdRows[0]) {
    id = `${id.slice(0, 16)}${String(Date.now()).slice(-4)}`.slice(0, 20)
  }

  const [created] = await db
    .insert(demoUserTable)
    .values({
      id,
      displayName,
      role: toDemoUserRole(role),
      customerId: null,
      normalizedUserId: null,
      normalizedRoleId: role,
      cruiseLineId,
      assignedShipId,
      cruiseLineName: cruiseLine.name,
      assignedShipName: ship?.name || null
    })
    .returning()

  return created
}

async function updateTurnaroundPerson(id, payload = {}) {
  const existingRows = await db.select().from(demoUserTable).where(eq(demoUserTable.id, id)).limit(1)
  const existing = existingRows[0]

  if (!existing) {
    const error = new Error('Turnaround person was not found.')
    error.statusCode = 404
    throw error
  }

  const displayName = String(payload.displayName ?? existing.displayName).trim()
  const role = normalizeOperationalRole(payload.role ?? existing.role)
  const cruiseLineId = payload.cruiseLineId ?? existing.cruiseLineId
  const assignedShipId = payload.assignedShipId ?? existing.assignedShipId
  const sailingId = payload.sailingId || null

  if (!displayName) {
    const error = new Error('Turnaround person display name is required.')
    error.statusCode = 400
    throw error
  }

  if (!isTurnaroundOperationalRole(role)) {
    const error = new Error('A supported turnaround operational role is required.')
    error.statusCode = 400
    throw error
  }

  const cruiseLine = await getCruiseLineById(cruiseLineId)
  if (!cruiseLine) {
    const error = new Error('A valid cruise line is required for turnaround personnel.')
    error.statusCode = 400
    throw error
  }

  const ship = await assertShipBelongsToCruiseLine({ shipId: assignedShipId, cruiseLineId })
  await assertSailingBelongsToShip({ sailingId, shipId: assignedShipId })
  await assertSingleCruiseLineAssignment({ displayName, userIdToExclude: id, cruiseLineId })

  const [updated] = await db
    .update(demoUserTable)
    .set({
      displayName,
      role: toDemoUserRole(role),
      normalizedRoleId: role,
      cruiseLineId,
      assignedShipId,
      cruiseLineName: cruiseLine.name,
      assignedShipName: ship?.name || null
    })
    .where(eq(demoUserTable.id, id))
    .returning()

  return updated
}

module.exports = {
  TURNAROUND_OPERATIONAL_ROLES,
  buildTurnaroundSetupSummary,
  createTurnaroundPerson,
  isTurnaroundOperationalRole,
  normalizeOperationalRole,
  updateTurnaroundPerson
}
