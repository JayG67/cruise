const { eq } = require('drizzle-orm')

const db = require('../db')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const demoUserTable = require('../models/demoUser.model')
const appRoleTable = require('../models/appRole.model')

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

function formatOperationalRoleDisplayName(role = '') {
  return normalizeOperationalRole(role)
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function ensureOperationalRoleCatalogEntry(role) {
  const normalizedRole = normalizeOperationalRole(role)
  const existingRoles = await selectAllRows(appRoleTable)
  if (existingRoles.some(entry => entry.id === normalizedRole)) return

  await db
    .insert(appRoleTable)
    .values({
      id: normalizedRole,
      displayName: formatOperationalRoleDisplayName(normalizedRole),
      roleType: 'OPERATIONS',
      description: 'Turnaround operational role used by admin team assignments'
    })
    .onConflictDoNothing()
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

function getTurnaroundPersonBaseName(displayName = '') {
  return String(displayName || '')
    .replace(/\s+—\s+.+$/, '')
    .replace(/\s+(Turnaround Manager|Housekeeping Lead|Guest Services Lead|Food & Beverage Lead|Engineering Lead|Security Lead|Port Operations Lead)$/i, '')
    .trim()
    .toLowerCase()
}

function buildServiceError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  Object.defineProperty(error, 'message', {
    value: message,
    enumerable: true,
    configurable: true
  })
  return error
}

async function selectAllRows(table) {
  return db.select().from(table)
}

async function getCruiseLineById(cruiseLineId) {
  if (!cruiseLineId) return null
  const rows = await selectAllRows(cruiseLineTable)
  return rows.find(cruiseLine => cruiseLine.id === cruiseLineId) || null
}

async function getShipById(shipId) {
  if (!shipId) return null
  const rows = await selectAllRows(shipTable)
  return rows.find(ship => ship.id === shipId) || null
}

async function getSailingById(sailingId) {
  if (!sailingId) return null
  const rows = await selectAllRows(sailingTable)
  return rows.find(sailing => sailing.id === sailingId) || null
}

async function assertShipBelongsToCruiseLine({ shipId, cruiseLineId }) {
  if (!shipId) return null

  const ship = await getShipById(shipId)
  if (!ship) {
    throw buildServiceError('Assigned ship was not found.', 404)
  }

  if (cruiseLineId && ship.cruiseLineId !== cruiseLineId) {
    throw buildServiceError('Turnaround personnel can only be assigned to ships within their cruise line.', 400)
  }

  return ship
}

async function assertSailingBelongsToShip({ sailingId, shipId }) {
  if (!sailingId) return null

  if (!shipId) {
    throw buildServiceError('Select a ship before assigning a turnaround sailing.', 400)
  }

  const sailing = await getSailingById(sailingId)
  if (!sailing) {
    throw buildServiceError('Assigned sailing was not found.', 404)
  }

  if (shipId && sailing.shipId !== shipId) {
    throw buildServiceError('Turnaround assignment sailing must belong to the selected ship.', 400)
  }

  return sailing
}

async function assertSingleCruiseLineAssignment({ displayName, userIdToExclude = '', cruiseLineId }) {
  if (!displayName || !cruiseLineId) return

  const requestedBaseName = getTurnaroundPersonBaseName(displayName)
  const users = await db.select().from(demoUserTable)
  const matches = users.filter(user => getTurnaroundPersonBaseName(user.displayName) === requestedBaseName)

  const conflictingMatch = matches.find(user => (
    user.id !== userIdToExclude
    && isTurnaroundOperationalRole(user.role)
    && user.cruiseLineId
    && user.cruiseLineId !== cruiseLineId
  ))

  if (conflictingMatch) {
    throw buildServiceError('Turnaround personnel can belong to exactly one cruise line. This person already has a different cruise line assignment.', 400)
  }
}

function getSailingDate(sailing = {}) {
  return sailing?.departureDate || sailing?.date || sailing?.sailingDate || ''
}

function buildScopedTurnaroundShips({ ships = [], turnaroundPeople = [] } = {}) {
  const activeCruiseLineIds = new Set(turnaroundPeople
    .map(person => person.cruiseLineId)
    .filter(Boolean))

  if (activeCruiseLineIds.size === 0) return ships

  return ships.filter(ship => activeCruiseLineIds.has(ship.cruiseLineId))
}

function buildScopedTurnaroundSailings({ sailings = [], ships = [], turnaroundPeople = [] } = {}) {
  const scopedShipIds = new Set(ships.map(ship => ship.id).filter(Boolean))
  const activeTurnaroundDates = new Set(turnaroundPeople
    .map(person => sailings.find(sailing => sailing.id === person.assignedSailingId))
    .map(getSailingDate)
    .filter(Boolean))

  return sailings.filter(sailing => {
    if (scopedShipIds.size > 0 && !scopedShipIds.has(sailing.shipId)) return false
    if (activeTurnaroundDates.size > 0) return activeTurnaroundDates.has(getSailingDate(sailing))
    return true
  })
}

async function assertNoSameDayTurnaroundConflict({ displayName, userIdToExclude = '', cruiseLineId, assignedSailingId }) {
  if (!displayName || !cruiseLineId || !assignedSailingId) return

  const targetSailing = await getSailingById(assignedSailingId)
  const targetDate = getSailingDate(targetSailing)
  if (!targetDate) return

  const requestedBaseName = getTurnaroundPersonBaseName(displayName)
  const users = await db.select().from(demoUserTable)
  const matches = users.filter(user => getTurnaroundPersonBaseName(user.displayName) === requestedBaseName)

  const candidateSailingIds = [...new Set(matches
    .filter(user => (
      user.id !== userIdToExclude
      && user.cruiseLineId === cruiseLineId
      && isTurnaroundOperationalRole(user.role)
      && user.assignedSailingId
    ))
    .map(user => user.assignedSailingId))]

  const sailingRows = await Promise.all(candidateSailingIds.map(getSailingById))
  const sailingById = new Map(sailingRows.filter(Boolean).map(sailing => [sailing.id, sailing]))

  const duplicateSailingMatch = matches.find(user => (
    user.id !== userIdToExclude
    && user.cruiseLineId === cruiseLineId
    && isTurnaroundOperationalRole(user.role)
    && user.assignedSailingId === assignedSailingId
  ))

  if (duplicateSailingMatch) {
    throw buildServiceError('This turnaround person is already assigned to the selected sailing.', 400)
  }

  const conflictingMatch = matches.find(user => {
    if (user.id === userIdToExclude) return false
    if (user.cruiseLineId !== cruiseLineId) return false
    if (!isTurnaroundOperationalRole(user.role)) return false
    if (!user.assignedSailingId) return false
    if (user.assignedSailingId === assignedSailingId) return false

    const existingSailing = sailingById.get(user.assignedSailingId)
    return getSailingDate(existingSailing) === targetDate
  })

  if (conflictingMatch) {
    throw buildServiceError('Turnaround personnel cannot be assigned to more than one turnaround sailing on the same date.', 400)
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

  const scopedShips = buildScopedTurnaroundShips({ ships, turnaroundPeople })
  const scopedSailings = buildScopedTurnaroundSailings({
    sailings,
    ships: scopedShips,
    turnaroundPeople
  })

  return {
    turnaroundPeople,
    cruiseLines,
    ships: scopedShips,
    sailings: scopedSailings,
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
  const assignedSailingId = payload.assignedSailingId || payload.sailingId || null

  if (!displayName) {
    throw buildServiceError('Turnaround person display name is required.', 400)
  }

  if (!isTurnaroundOperationalRole(role)) {
    throw buildServiceError('A supported turnaround operational role is required.', 400)
  }

  const cruiseLine = await getCruiseLineById(cruiseLineId)
  if (!cruiseLine) {
    throw buildServiceError('A valid cruise line is required for turnaround personnel.', 400)
  }

  const ship = await assertShipBelongsToCruiseLine({ shipId: assignedShipId, cruiseLineId })
  const sailing = await assertSailingBelongsToShip({ sailingId: assignedSailingId, shipId: assignedShipId })
  await assertSingleCruiseLineAssignment({ displayName, cruiseLineId })
  await assertNoSameDayTurnaroundConflict({ displayName, cruiseLineId, assignedSailingId })
  await ensureOperationalRoleCatalogEntry(role)

  const requestedId = String(payload.id || '').trim()
  let id = requestedId || buildDemoUserId({ displayName, role, cruiseLineId, shipId: assignedShipId })
  const existingIdRows = await selectAllRows(demoUserTable)
  if (existingIdRows.find(user => user.id === id)) {
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
      assignedSailingId,
      cruiseLineName: cruiseLine.name,
      assignedShipName: ship?.name || null
    })
    .returning()

  return created
}

async function updateTurnaroundPerson(id, payload = {}) {
  const existingRows = await selectAllRows(demoUserTable)
  const existing = existingRows.find(user => user.id === id)

  if (!existing) {
    throw buildServiceError('Turnaround person was not found.', 404)
  }

  const displayName = String(payload.displayName ?? existing.displayName).trim()
  const role = normalizeOperationalRole(payload.role ?? existing.role)
  const cruiseLineId = payload.cruiseLineId ?? existing.cruiseLineId
  const assignedShipId = Object.prototype.hasOwnProperty.call(payload, 'assignedShipId')
    ? payload.assignedShipId
    : existing.assignedShipId
  const assignedSailingId = Object.prototype.hasOwnProperty.call(payload, 'assignedSailingId')
    ? payload.assignedSailingId
    : Object.prototype.hasOwnProperty.call(payload, 'sailingId')
      ? payload.sailingId
      : existing.assignedSailingId

  if (!displayName) {
    throw buildServiceError('Turnaround person display name is required.', 400)
  }

  if (!isTurnaroundOperationalRole(role)) {
    throw buildServiceError('A supported turnaround operational role is required.', 400)
  }

  const cruiseLine = await getCruiseLineById(cruiseLineId)
  if (!cruiseLine) {
    throw buildServiceError('A valid cruise line is required for turnaround personnel.', 400)
  }

  const ship = await assertShipBelongsToCruiseLine({ shipId: assignedShipId, cruiseLineId })
  const sailing = await assertSailingBelongsToShip({ sailingId: assignedSailingId, shipId: assignedShipId })
  await assertSingleCruiseLineAssignment({ displayName, userIdToExclude: id, cruiseLineId })
  await assertNoSameDayTurnaroundConflict({ displayName, userIdToExclude: id, cruiseLineId, assignedSailingId })
  await ensureOperationalRoleCatalogEntry(role)

  const [updated] = await db
    .update(demoUserTable)
    .set({
      displayName,
      role: toDemoUserRole(role),
      normalizedRoleId: role,
      cruiseLineId,
      assignedShipId,
      assignedSailingId,
      cruiseLineName: cruiseLine.name,
      assignedShipName: ship?.name || null
    })
    .where(eq(demoUserTable.id, id))
    .returning()

  return updated
}

async function deleteTurnaroundPerson(id) {
  const existingRows = await selectAllRows(demoUserTable)
  const existing = existingRows.find(user => user.id === id)

  if (!existing) {
    throw buildServiceError('Turnaround person was not found.', 404)
  }

  if (!isTurnaroundOperationalRole(existing.role)) {
    throw buildServiceError('Only turnaround personnel can be removed from setup.', 400)
  }

  const [unassigned] = await db
    .update(demoUserTable)
    .set({
      assignedShipId: null,
      assignedSailingId: null,
      assignedShipName: null
    })
    .where(eq(demoUserTable.id, id))
    .returning()

  return unassigned
}

module.exports = {
  TURNAROUND_OPERATIONAL_ROLES,
  buildTurnaroundSetupSummary,
  assertNoSameDayTurnaroundConflict,
  getTurnaroundPersonBaseName,
  createTurnaroundPerson,
  deleteTurnaroundPerson,
  isTurnaroundOperationalRole,
  normalizeOperationalRole,
  updateTurnaroundPerson
}
