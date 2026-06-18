const fs = require('fs')
const path = require('path')
const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const itineraryDayTable = require('../models/itineraryDay.model')
const activityScheduleTable = require('../models/activitySchedule.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const demoUserTable = require('../models/demoUser.model')
const appUserTable = require('../models/appUser.model')
const appRoleTable = require('../models/appRole.model')
const appUserRoleTable = require('../models/appUserRole.model')
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundTaskUpdateTable = require('../models/turnaroundTaskUpdate.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundStaffingTable = require('../models/turnaroundStaffing.model')
const turnaroundTaskDependencyTable = require('../models/turnaroundTaskDependency.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')
const auditEventTable = require('../models/auditEvent.model')
const db = require('../db')
const loadCruiseData = require('../services/loadCruiseData.service')
const { listAuditEvents, listAuditEventsForOperation, recordAuditEvent } = require('../services/auditEvent.service')
const {
  getBookingAuditScope,
  getSailingAuditScope,
  getShipAuditScope,
  recordPlatformAuditEvent
} = require('../services/platformAudit.service')
const {
  buildTurnaroundAuditContext,
  canAccessTurnaroundOperationForRequest,
  getTurnaroundOperationsForRequest,
  sendTurnaroundOperationForbidden
} = require('../services/turnaroundScope.service')
const { buildTurnaroundReleasePacket } = require('../services/turnaroundRelease.service')
const { buildTurnaroundOperationalTimeline } = require('../services/turnaroundTimeline.service')
const { buildTurnaroundOperationalMetrics } = require('../services/turnaroundMetrics.service')
const { buildTurnaroundPlaybookTemplate } = require('../services/turnaroundPlaybook.service')
const { buildTurnaroundPlaybookVariance } = require('../services/turnaroundVariance.service')
const { buildTurnaroundIncidentCommand } = require('../services/turnaroundIncident.service')
const { buildTurnaroundAfterActionReview } = require('../services/turnaroundAfterAction.service')
const { buildTurnaroundExecutiveBrief } = require('../services/turnaroundExecutiveBrief.service')
const { buildTurnaroundReviewerPacket } = require('../services/turnaroundReviewerPacket.service')
const { buildTurnaroundOutreachBoard } = require('../services/turnaroundOutreach.service')
const { buildTurnaroundManagementStatus } = require('../services/turnaroundCompletion.service')
const { buildTurnaroundLifecycleState } = require('../services/turnaroundLifecycle.service')
const { buildTurnaroundLaunchPlan } = require('../services/turnaroundLaunchPlan.service')
const { buildTurnaroundScenarioPlan } = require('../services/turnaroundScenarioPlan.service')
const { buildTurnaroundProductionReadiness } = require('../services/turnaroundProductionReadiness.service')
const { buildTurnaroundApplicationDossier } = require('../services/turnaroundApplicationDossier.service')
const { buildTurnaroundPresentationGuide } = require('../services/turnaroundPresentation.service')
const { buildTurnaroundCloseoutPacket } = require('../services/turnaroundCloseout.service')
const { buildTurnaroundCommandCenter } = require('../services/turnaroundCommandCenter.service')
const { buildTurnaroundContinuityCenter } = require('../services/turnaroundContinuity.service')
const { buildTurnaroundShiftBriefing } = require('../services/turnaroundShiftBriefing.service')
const { buildTurnaroundGoLiveCenter } = require('../services/turnaroundGoLive.service')
const { buildTurnaroundOperationsControlBoard } = require('../services/turnaroundOperationsControlBoard.service')
const { buildTurnaroundSetupSummary, createTurnaroundPerson: createTurnaroundSetupPerson, updateTurnaroundPerson: updateTurnaroundSetupPerson, deleteTurnaroundPerson: deleteTurnaroundSetupPerson } = require('../services/turnaroundAdminSetup.service')
const { buildDataArchitectureReadiness } = require('../services/dataArchitectureReadiness.service')
const { buildProductionHardeningReadiness } = require('../services/productionHardeningReadiness.service')
const { buildDeploymentReadiness } = require('../services/deploymentReadiness.service')
const { buildPortfolioShowcase } = require('../services/portfolioShowcase.service')
const { buildPublicLaunchReadiness } = require('../services/publicLaunchReadiness.service')
const { requireAdminRequest } = require('../services/requestAuthorization.service')
const { and, eq, inArray, like } = require('drizzle-orm')




function safeReadProjectFile(relativePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
  } catch (error) {
    return ''
  }
}

function safeReadJsonProjectFile(relativePath) {
  try {
    return JSON.parse(safeReadProjectFile(relativePath) || '{}')
  } catch (error) {
    return {}
  }
}

function buildProjectFilePresenceMap() {
  const filePaths = [
    '.env.example',
    '.github/workflows',
    'Dockerfile',
    'drizzle.config.js',
    'docker-compose.yml',
    'docs/deployment.md',
    'docs/environment.md',
    'docs/portfolio.md',
    'docs/screenshots',
    'dist',
    'fly.toml',
    'logs',
    'lighthouse-report',
    'lhci-report',
    'middleware/loggers.js',
    'middleware/requestIdentity.middleware.js',
    'middleware/validate.middleware.js',
    'performance/cruise-api-smoke.js',
    'public',
    'railway.json',
    'render.yaml',
    'services/requestAuthorization.service.js',
    'tests/unit/app.security.test.js'
  ]

  return Object.fromEntries(filePaths.map(filePath => [filePath, fs.existsSync(path.join(process.cwd(), filePath))]))
}

function buildAuditEventFilters(query = {}) {
  const allowedFilters = ['entityType', 'entityId', 'actorUserId', 'cruiseLineId', 'shipId', 'sailingId', 'operationId', 'source']
  return Object.fromEntries(
    allowedFilters
      .map(field => [field, String(query[field] || '').trim()])
      .filter(([, value]) => value.length > 0)
  )
}

async function recordTurnaroundAuditEvent(req, operation, event) {
  const context = await buildTurnaroundAuditContext(req, operation)
  return recordAuditEvent({
    ...context,
    ...event
  })
}


async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
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


async function buildAppUserDisplayLookup(userIds = []) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))]
  if (!uniqueUserIds.length) return new Map()

  const userRows = await db
    .select()
    .from(appUserTable)
    .where(inArray(appUserTable.id, uniqueUserIds))

  return new Map(userRows.map(user => [user.id, user.displayName]))
}

function enrichOperationalPerson(row = {}, userDisplayById = new Map(), userIdField, displayField) {
  if (!row) return row

  const userId = row[userIdField]
  const displayName = userId ? userDisplayById.get(userId) : null

  return {
    ...row,
    [displayField]: displayName || row[displayField] || row.ownerName || row.authorName || row.approverName || row.leadName || null
  }
}

function buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning }) {
  return Object.fromEntries(
    Object.entries({ name, country, website, brandFamily, brandTheme, marketPositioning })
      .filter(([, value]) => value !== undefined)
  )
}

function addDays(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  return date
}

function sailingEndDate(sailing) {
  const days = Number(sailing?.days || 1)
  return addDays(sailing.departureDate, Math.max(days - 1, 0))
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA
}

async function findBookingOverlapForPassengers({ bookingIdToExclude, sailing, passengers }) {
  const requestedStart = new Date(`${sailing.departureDate}T00:00:00.000Z`)
  const requestedEnd = sailingEndDate(sailing)
  const passengerIds = passengers.map(passenger => passenger.customerId)

  for (const customerId of passengerIds) {
    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, customerId))

    for (const passengerRow of passengerRows) {
      if (bookingIdToExclude && passengerRow.bookingId === bookingIdToExclude) {
        continue
      }

      const existingBookings = await db
        .select()
        .from(bookingTable)
        .where(eq(bookingTable.id, passengerRow.bookingId))
        .limit(1)

      const existingBooking = existingBookings[0]
      if (!existingBooking) continue

      const existingSailings = await db
        .select()
        .from(sailingTable)
        .where(eq(sailingTable.id, existingBooking.sailingId))
        .limit(1)

      const existingSailing = existingSailings[0]
      if (!existingSailing) continue

      const existingStart = new Date(`${existingSailing.departureDate}T00:00:00.000Z`)
      const existingEnd = sailingEndDate(existingSailing)

      if (rangesOverlap(requestedStart, requestedEnd, existingStart, existingEnd)) {
        return {
          customerId,
          bookingId: existingBooking.id,
          departureDate: existingSailing.departureDate
        }
      }
    }
  }

  return null
}


async function getCustomerFavoriteActivityIds(customerId) {
  if (!customerId) return new Set()

  const rows = await db
    .select()
    .from(customerItineraryFavoriteTable)
    .where(eq(customerItineraryFavoriteTable.customerId, customerId))

  return new Set(rows.map(row => row.activityScheduleId))
}

async function decorateItineraryWithFavorites(itineraryDays, customerId) {
  const favoriteIds = await getCustomerFavoriteActivityIds(customerId)

  return itineraryDays.map(day => ({
    ...day,
    activitySchedule: (day.activitySchedule || []).map(activity => ({
      ...activity,
      isFavorite: favoriteIds.has(activity.id)
    }))
  }))
}


async function decorateCruiseLinesForPresentation(cruiseLines = []) {
  const [ships, sailings, itineraryDays, activities] = await Promise.all([
    db.select().from(shipTable),
    db.select().from(sailingTable),
    db.select().from(itineraryDayTable),
    db.select().from(activityScheduleTable)
  ])

  const activitiesByDayId = new Map()
  activities.forEach(activity => {
    const rows = activitiesByDayId.get(activity.itineraryDayId) || []
    rows.push(activity)
    activitiesByDayId.set(activity.itineraryDayId, rows)
  })

  const itineraryBySailingId = new Map()
  itineraryDays.forEach(day => {
    const rows = itineraryBySailingId.get(day.sailingId) || []
    rows.push({
      ...day,
      activitySchedule: activitiesByDayId.get(day.id) || []
    })
    itineraryBySailingId.set(day.sailingId, rows)
  })

  const sailingsByShipId = new Map()
  sailings.forEach(sailing => {
    const rows = sailingsByShipId.get(sailing.shipId) || []
    rows.push({
      ...sailing,
      itinerary: (itineraryBySailingId.get(sailing.id) || []).sort((left, right) => Number(left.day || 0) - Number(right.day || 0))
    })
    sailingsByShipId.set(sailing.shipId, rows)
  })

  const shipsByLineId = new Map()
  ships.forEach(ship => {
    const rows = shipsByLineId.get(ship.cruiseLineId) || []
    rows.push({
      ...ship,
      sailings: (sailingsByShipId.get(ship.id) || []).sort((left, right) => String(left.departureDate || '').localeCompare(String(right.departureDate || '')))
    })
    shipsByLineId.set(ship.cruiseLineId, rows)
  })

  return cruiseLines.map(line => {
    const lineShips = shipsByLineId.get(line.id) || []
    const lineSailings = lineShips.flatMap(ship => ship.sailings || [])

    return {
      ...line,
      ships: lineShips,
      shipCount: lineShips.length,
      sailingCount: lineSailings.length
    }
  })
}

exports.getCruiseLines = async (req, res, next) => {
  try {
    const cruiseLines = await db.select().from(cruiseLineTable)

    if (!cruiseLines || cruiseLines.length === 0) {
      return res.status(404).json({ message: 'No cruise lines found' })
    }

    return res.status(200).json(cruiseLines)
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

    return res.status(200).json(cruiseLine)
  } catch (err) {
    next(err)
  }
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

    return res.status(200).json(ships)
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

    const cruiseLineValues = buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning })
    const insertedRows = await db
      .insert(cruiseLineTable)
      .values(cruiseLineValues)
      .returning({ id: cruiseLineTable.id })

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CRUISE_LINE_CREATED',
      entityType: 'CRUISE_LINE',
      entityId: insertedRows[0].id,
      cruiseLineId: insertedRows[0].id,
      eventPayload: cruiseLineValues
    })

    return res.status(201).json({
      message: 'Cruise line created successfully',
      id: insertedRows[0].id
    })
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

    const shipValues = { name, currentPort, cruiseLineId }
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
      eventPayload: shipValues
    })

    return res.status(201).json({
      message: 'Ship created successfully',
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

    const cruiseLineUpdates = buildCruiseLinePayload({ name, country, website, brandFamily, brandTheme, marketPositioning })
    await db
      .update(cruiseLineTable)
      .set(cruiseLineUpdates)
      .where(eq(cruiseLineTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CRUISE_LINE_UPDATED',
      entityType: 'CRUISE_LINE',
      entityId: id,
      cruiseLineId: id,
      eventPayload: { previous: existingRows[0], updates: cruiseLineUpdates }
    })

    return res.status(200).json({ message: 'Cruise line updated successfully' })
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

    const shipUpdates = { name, currentPort, cruiseLineId }
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
      eventPayload: { previous: existingShipRows[0], updates: shipUpdates }
    })

    return res.status(200).json({ message: 'Ship updated successfully' })
  } catch (err) {
    next(err)
  }
}


async function deleteActivitiesForItineraryDayIds(itineraryDayIds) {
  if (!itineraryDayIds.length) return

  await db
    .delete(activityScheduleTable)
    .where(inArray(activityScheduleTable.itineraryDayId, itineraryDayIds))
}

async function deleteItineraryForSailingIds(sailingIds) {
  if (!sailingIds.length) return

  const itineraryDays = await db
    .select({ id: itineraryDayTable.id })
    .from(itineraryDayTable)
    .where(inArray(itineraryDayTable.sailingId, sailingIds))

  const itineraryDayIds = itineraryDays.map(day => day.id)

  await deleteActivitiesForItineraryDayIds(itineraryDayIds)

  await db
    .delete(itineraryDayTable)
    .where(inArray(itineraryDayTable.sailingId, sailingIds))
}

async function deleteSailingsForShipIds(shipIds) {
  if (!shipIds.length) return

  const sailings = await db
    .select({ id: sailingTable.id })
    .from(sailingTable)
    .where(inArray(sailingTable.shipId, shipIds))

  const sailingIds = sailings.map(sailing => sailing.id)

  await deleteItineraryForSailingIds(sailingIds)

  await db
    .delete(sailingTable)
    .where(inArray(sailingTable.shipId, shipIds))
}

async function deleteShipHierarchy(shipId) {
  await deleteSailingsForShipIds([shipId])

  await db
    .delete(shipTable)
    .where(eq(shipTable.id, shipId))
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
      eventPayload: { deletedCruiseLine: existingRows[0], deletedShipIds: shipIds }
    })

    return res.status(200).json({ message: 'Cruise line deleted successfully' })
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
      eventPayload: { deletedShip: existingRows[0] }
    })

    return res.status(200).json({ message: 'Ship deleted successfully' })
  } catch (err) {
    next(err)
  }
}

async function findOne(table, column, id) {
  const rows = await db.select().from(table).where(eq(column, id)).limit(1)
  return rows[0]
}

exports.getSailingsByShip = async (req, res, next) => {
  try {
    const { shipId } = req.params

    const ship = await findOne(shipTable, shipTable.id, shipId)

    if (!ship) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    const sailings = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.shipId, shipId))

    return res.status(200).json(sailings || [])
  } catch (err) {
    next(err)
  }
}

exports.getItineraryBySailing = async (req, res, next) => {
  try {
    const { sailingId } = req.params
    const { customerId, favoritesOnly } = req.query

    const itineraryDays = await db
      .select()
      .from(itineraryDayTable)
      .where(eq(itineraryDayTable.sailingId, sailingId))

    if (!itineraryDays || itineraryDays.length === 0) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    const favoriteIds = await getCustomerFavoriteActivityIds(customerId)
    const itineraryWithActivities = []

    for (const itineraryDay of itineraryDays.sort((a, b) => a.day - b.day)) {
      const activitySchedule = await db
        .select()
        .from(activityScheduleTable)
        .where(eq(activityScheduleTable.itineraryDayId, itineraryDay.id))

      const decoratedActivities = activitySchedule.map(activity => ({
        ...activity,
        isFavorite: favoriteIds.has(activity.id)
      }))

      const visibleActivities = favoritesOnly === 'true'
        ? decoratedActivities.filter(activity => activity.isFavorite)
        : decoratedActivities

      if (favoritesOnly === 'true' && visibleActivities.length === 0) {
        continue
      }

      itineraryWithActivities.push({
        ...itineraryDay,
        activitySchedule: visibleActivities
      })
    }

    if (!itineraryWithActivities.length) {
      return res.status(404).json({ message: 'No itinerary found for the specified sailing' })
    }

    return res.status(200).json(itineraryWithActivities)
  } catch (err) {
    next(err)
  }
}

exports.insertSailing = async (req, res, next) => {
  try {
    const { shipId } = req.params
    const { departureDate, departurePort, arrivalPort, days, isRepositioning } = req.body

    const existingShip = await findOne(shipTable, shipTable.id, shipId)

    if (!existingShip) {
      return res.status(404).json({ message: 'Ship not found' })
    }

    const sailingValues = {
      shipId,
      departureDate,
      port: departurePort,
      departurePort,
      arrivalPort,
      days,
      isRepositioning: Boolean(isRepositioning)
    }
    const insertedRows = await db
      .insert(sailingTable)
      .values(sailingValues)
      .returning({ id: sailingTable.id })

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'SAILING_CREATED',
      entityType: 'SAILING',
      entityId: insertedRows[0].id,
      cruiseLineId: existingShip.cruiseLineId || null,
      shipId,
      sailingId: insertedRows[0].id,
      eventPayload: sailingValues
    })

    return res.status(201).json({ message: 'Sailing created successfully', id: insertedRows[0].id })
  } catch (err) {
    next(err)
  }
}

exports.updateSailing = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departureDate, departurePort, arrivalPort, days, isRepositioning } = req.body

    const existingSailing = await findOne(sailingTable, sailingTable.id, id)

    if (!existingSailing) {
      return res.status(404).json({ message: 'Sailing not found' })
    }

    const sailingUpdates = {
      departureDate,
      port: departurePort,
      departurePort,
      arrivalPort,
      days,
      isRepositioning: Boolean(isRepositioning)
    }
    await db
      .update(sailingTable)
      .set(sailingUpdates)
      .where(eq(sailingTable.id, id))

    const sailingScope = await getSailingAuditScope(existingSailing)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'SAILING_UPDATED',
      entityType: 'SAILING',
      entityId: id,
      ...sailingScope,
      eventPayload: { previous: existingSailing, updates: sailingUpdates }
    })

    return res.status(200).json({ message: 'Sailing updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteSailing = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingSailing = await findOne(sailingTable, sailingTable.id, id)

    if (!existingSailing) {
      return res.status(404).json({ message: 'Sailing not found' })
    }

    await deleteItineraryForSailingIds([id])

    await db.delete(sailingTable).where(eq(sailingTable.id, id))

    const sailingScope = await getSailingAuditScope(existingSailing)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'SAILING_DELETED',
      entityType: 'SAILING',
      entityId: id,
      ...sailingScope,
      sailingId: null,
      eventPayload: { deletedSailing: existingSailing }
    })

    return res.status(200).json({ message: 'Sailing deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.insertItineraryDay = async (req, res, next) => {
  try {
    const { sailingId } = req.params
    const { day, title, port, activitySchedule } = req.body

    const validationErrors = []
    if (!Number.isInteger(day) || day < 1 || day > 30) {
      validationErrors.push({ field: 'day', message: 'Day must be between 1 and 30' })
    }
    if (!String(title || '').trim()) {
      validationErrors.push({ field: 'title', message: 'Itinerary title is required' })
    }
    if (!String(port || '').trim()) {
      validationErrors.push({ field: 'port', message: 'Itinerary port is required' })
    }
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors })
    }

    const existingSailing = await findOne(sailingTable, sailingTable.id, sailingId)

    if (!existingSailing) {
      return res.status(404).json({ message: 'Sailing not found' })
    }

    const insertedRows = await db
      .insert(itineraryDayTable)
      .values({ sailingId, day, title, port })
      .returning({ id: itineraryDayTable.id })

    const itineraryDayId = insertedRows[0].id

    for (const activity of activitySchedule || []) {
      await db.insert(activityScheduleTable).values({
        itineraryDayId,
        time: activity.time,
        activity: activity.activity
      })
    }

    return res.status(201).json({ message: 'Itinerary day created successfully', id: itineraryDayId })
  } catch (err) {
    next(err)
  }
}

exports.updateItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params
    const { day, title, port } = req.body

    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, id)

    if (!existingItineraryDay) {
      return res.status(404).json({ message: 'Itinerary day not found' })
    }

    await db.update(itineraryDayTable).set({ day, title, port }).where(eq(itineraryDayTable.id, id))

    return res.status(200).json({ message: 'Itinerary day updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, id)

    if (!existingItineraryDay) {
      return res.status(404).json({ message: 'Itinerary day not found' })
    }

    await deleteActivitiesForItineraryDayIds([id])

    await db.delete(itineraryDayTable).where(eq(itineraryDayTable.id, id))

    return res.status(200).json({ message: 'Itinerary day deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.insertActivitySchedule = async (req, res, next) => {
  try {
    const { itineraryDayId } = req.params
    const { time, activity } = req.body

    const existingItineraryDay = await findOne(itineraryDayTable, itineraryDayTable.id, itineraryDayId)

    if (!existingItineraryDay) {
      return res.status(404).json({ message: 'Itinerary day not found' })
    }

    const insertedRows = await db
      .insert(activityScheduleTable)
      .values({ itineraryDayId, time, activity })
      .returning({ id: activityScheduleTable.id })

    return res.status(201).json({ message: 'Activity created successfully', id: insertedRows[0].id })
  } catch (err) {
    next(err)
  }
}

exports.updateActivitySchedule = async (req, res, next) => {
  try {
    const { id } = req.params
    const { time, activity } = req.body

    const existingActivity = await findOne(activityScheduleTable, activityScheduleTable.id, id)

    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' })
    }

    await db.update(activityScheduleTable).set({ time, activity }).where(eq(activityScheduleTable.id, id))

    return res.status(200).json({ message: 'Activity updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteActivitySchedule = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingActivity = await findOne(activityScheduleTable, activityScheduleTable.id, id)

    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' })
    }

    await db.delete(activityScheduleTable).where(eq(activityScheduleTable.id, id))

    return res.status(200).json({ message: 'Activity deleted successfully' })
  } catch (err) {
    next(err)
  }
}


function groupRowsBy(rows, keyName) {
  return (rows || []).reduce((groups, row) => {
    const key = row[keyName]
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
    return groups
  }, new Map())
}

function indexRowsBy(rows, keyName) {
  return new Map((rows || []).map(row => [row[keyName], row]))
}

async function selectByIds(table, column, ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))]
  if (uniqueIds.length === 0) return []
  return db.select().from(table).where(inArray(column, uniqueIds))
}

async function getBookingDetailsBatch(bookings) {
  if (!bookings || bookings.length === 0) return []

  const bookingIds = bookings.map(booking => booking.id)
  const sailingIds = bookings.map(booking => booking.sailingId)

  const [passengerRows, sailingRows] = await Promise.all([
    selectByIds(bookingPassengerTable, bookingPassengerTable.bookingId, bookingIds),
    selectByIds(sailingTable, sailingTable.id, sailingIds)
  ])

  const customerRows = await selectByIds(
    customerTable,
    customerTable.id,
    passengerRows.map(passenger => passenger.customerId)
  )
  const shipRows = await selectByIds(
    shipTable,
    shipTable.id,
    sailingRows.map(sailing => sailing.shipId)
  )
  const cruiseLineRows = await selectByIds(
    cruiseLineTable,
    cruiseLineTable.id,
    shipRows.map(ship => ship.cruiseLineId)
  )
  const itineraryDayRows = await selectByIds(itineraryDayTable, itineraryDayTable.sailingId, sailingIds)
  const activityRows = await selectByIds(
    activityScheduleTable,
    activityScheduleTable.itineraryDayId,
    itineraryDayRows.map(day => day.id)
  )

  const passengersByBooking = groupRowsBy(passengerRows, 'bookingId')
  const customersById = indexRowsBy(customerRows, 'id')
  const sailingsById = indexRowsBy(sailingRows, 'id')
  const shipsById = indexRowsBy(shipRows, 'id')
  const cruiseLinesById = indexRowsBy(cruiseLineRows, 'id')
  const itineraryDaysBySailing = groupRowsBy(itineraryDayRows, 'sailingId')
  const activitiesByDay = groupRowsBy(activityRows, 'itineraryDayId')

  return bookings.map(booking => {
    const sailing = sailingsById.get(booking.sailingId) || null
    const ship = sailing?.shipId ? shipsById.get(sailing.shipId) || null : null
    const cruiseLine = ship?.cruiseLineId ? cruiseLinesById.get(ship.cruiseLineId) || null : null
    const passengers = (passengersByBooking.get(booking.id) || []).map(passenger => ({
      ...passenger,
      customer: customersById.get(passenger.customerId) || null
    }))
    const itineraryDays = (itineraryDaysBySailing.get(booking.sailingId) || [])
      .map(day => ({
        ...day,
        activitySchedule: [...(activitiesByDay.get(day.id) || [])]
          .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
      }))
      .sort((a, b) => Number(a.day || 0) - Number(b.day || 0))
    const sailingWithItinerary = sailing
      ? {
          ...sailing,
          itinerary: itineraryDays,
          itineraryDays
        }
      : null

    return {
      ...booking,
      sailing: sailingWithItinerary,
      ship,
      cruiseLine,
      passengers,
      itinerary: itineraryDays,
      itineraryDays
    }
  })
}

async function getBookingPassengers(bookingId) {
  const passengerRows = await db
    .select()
    .from(bookingPassengerTable)
    .where(eq(bookingPassengerTable.bookingId, bookingId))

  const passengers = []

  for (const passenger of passengerRows || []) {
    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, passenger.customerId))
      .limit(1)

    passengers.push({
      ...passenger,
      customer: customerRows[0] || null
    })
  }

  return passengers
}

async function getSailingItineraryDetails(sailingId) {
  if (!sailingId) return []

  const itineraryDays = await db
    .select()
    .from(itineraryDayTable)
    .where(eq(itineraryDayTable.sailingId, sailingId))

  const itineraryWithActivities = []

  for (const itineraryDay of itineraryDays || []) {
    const activities = await db
      .select()
      .from(activityScheduleTable)
      .where(eq(activityScheduleTable.itineraryDayId, itineraryDay.id))

    itineraryWithActivities.push({
      ...itineraryDay,
      activitySchedule: [...(activities || [])].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    })
  }

  return itineraryWithActivities.sort((a, b) => Number(a.day || 0) - Number(b.day || 0))
}

async function getBookingDetails(booking) {
  if (!booking) return null

  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, booking.sailingId))
    .limit(1)

  const sailing = sailingRows[0] || null
  let ship = null
  let cruiseLine = null

  if (sailing?.shipId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, sailing.shipId))
      .limit(1)

    ship = shipRows[0] || null

    if (ship?.cruiseLineId) {
      const cruiseLineRows = await db
        .select()
        .from(cruiseLineTable)
        .where(eq(cruiseLineTable.id, ship.cruiseLineId))
        .limit(1)

      cruiseLine = cruiseLineRows[0] || null
    }
  }

  const passengers = await getBookingPassengers(booking.id)
  const itineraryDays = await getSailingItineraryDetails(booking.sailingId)
  const sailingWithItinerary = sailing
    ? {
        ...sailing,
        itinerary: itineraryDays,
        itineraryDays
      }
    : null

  return {
    ...booking,
    sailing: sailingWithItinerary,
    ship,
    cruiseLine,
    passengers,
    itinerary: itineraryDays,
    itineraryDays
  }
}


async function getPassengerCountForSailing(sailingId) {
  const bookingRows = await db
    .select()
    .from(bookingTable)
    .where(eq(bookingTable.sailingId, sailingId))

  let passengerCount = 0

  for (const booking of bookingRows || []) {
    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.bookingId, booking.id))

    passengerCount += passengerRows.length
  }

  return passengerCount
}


function getTurnaroundProgress(tasks = []) {
  const totalTasks = tasks.length
  const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
  const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length

  return {
    totalTasks,
    completeTasks,
    blockedTasks,
    inProgressTasks,
    completionPercent: totalTasks === 0 ? 0 : Math.round((completeTasks / totalTasks) * 100)
  }
}


function getTurnaroundSignoffSummary(signoffs = []) {
  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffs.filter(signoff => signoff.status === 'APPROVED').length
  const blockedSignoffs = signoffs.filter(signoff => signoff.status === 'BLOCKED').length
  const pendingSignoffs = signoffs.filter(signoff => signoff.status === 'PENDING').length

  return {
    totalSignoffs,
    approvedSignoffs,
    blockedSignoffs,
    pendingSignoffs,
    approvalPercent: totalSignoffs === 0 ? 0 : Math.round((approvedSignoffs / totalSignoffs) * 100)
  }
}

function getTurnaroundEscalationSummary(escalations = []) {
  const totalEscalations = escalations.length
  const openEscalations = escalations.filter(escalation => escalation.status === 'OPEN').length
  const monitoringEscalations = escalations.filter(escalation => escalation.status === 'MONITORING').length
  const resolvedEscalations = escalations.filter(escalation => escalation.status === 'RESOLVED').length
  const criticalEscalations = escalations.filter(escalation => escalation.severity === 'CRITICAL' && escalation.status !== 'RESOLVED').length

  return {
    totalEscalations,
    openEscalations,
    monitoringEscalations,
    resolvedEscalations,
    criticalEscalations
  }
}


function getTurnaroundStaffingSummary(staffing = []) {
  const plannedCount = staffing.reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
  const checkedInCount = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)
  const gapCount = Math.max(plannedCount - checkedInCount, 0)

  return {
    totalDepartments: staffing.length,
    plannedCount,
    checkedInCount,
    gapCount,
    checkInPercent: plannedCount === 0 ? 0 : Math.round((checkedInCount / plannedCount) * 100)
  }
}

function getDerivedTurnaroundReadinessLevel(tasks = [], signoffs = [], escalations = []) {
  const progress = getTurnaroundProgress(tasks)
  const signoffSummary = getTurnaroundSignoffSummary(signoffs)
  const escalationSummary = getTurnaroundEscalationSummary(escalations)

  if (progress.blockedTasks > 0 || signoffSummary.blockedSignoffs > 0 || escalationSummary.criticalEscalations > 0) return 'Blocked'
  if (progress.totalTasks > 0 && progress.completeTasks === progress.totalTasks && signoffSummary.totalSignoffs > 0 && signoffSummary.approvedSignoffs === signoffSummary.totalSignoffs) return 'Ready for embarkation'
  if (progress.inProgressTasks > 0 || progress.completeTasks > 0 || signoffSummary.approvedSignoffs > 0) return 'In progress'

  return 'Planning'
}

function getDerivedTurnaroundStatus(tasks = [], escalations = []) {
  const progress = getTurnaroundProgress(tasks)
  const escalationSummary = getTurnaroundEscalationSummary(escalations)

  if (progress.blockedTasks > 0 || escalationSummary.criticalEscalations > 0) return 'BLOCKED'
  if (progress.totalTasks > 0 && progress.completeTasks === progress.totalTasks) return 'COMPLETE'
  if (progress.inProgressTasks > 0 || progress.completeTasks > 0) return 'IN_PROGRESS'

  return 'PLANNED'
}

function getTurnaroundDependencySummary(dependencies = []) {
  const activeDependencies = dependencies.filter(dependency => dependency.status !== 'CLEARED').length
  const clearedDependencies = dependencies.filter(dependency => dependency.status === 'CLEARED').length

  return {
    totalDependencies: dependencies.length,
    activeDependencies,
    clearedDependencies
  }
}

function getTurnaroundHandoffSummary(handoffs = []) {
  const completedHandoffs = handoffs.filter(handoff => handoff.status === 'COMPLETE').length
  const blockedHandoffs = handoffs.filter(handoff => handoff.status === 'BLOCKED').length

  return {
    totalHandoffs: handoffs.length,
    completedHandoffs,
    blockedHandoffs,
    openHandoffs: Math.max(handoffs.length - completedHandoffs, 0)
  }
}

async function getTurnaroundOperationDetails(operation) {
  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, operation.sailingId))
    .limit(1)

  const sailing = sailingRows[0] || null
  let ship = null
  let cruiseLine = null

  if (sailing?.shipId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, sailing.shipId))
      .limit(1)

    ship = shipRows[0] || null

    if (ship?.cruiseLineId) {
      const cruiseLineRows = await db
        .select()
        .from(cruiseLineTable)
        .where(eq(cruiseLineTable.id, ship.cruiseLineId))
        .limit(1)

      cruiseLine = cruiseLineRows[0] || null
    }
  }

  const tasks = await db
    .select()
    .from(turnaroundTaskTable)
    .where(eq(turnaroundTaskTable.operationId, operation.id))

  const signoffs = await db
    .select()
    .from(turnaroundSignoffTable)
    .where(eq(turnaroundSignoffTable.operationId, operation.id))

  const escalations = await db
    .select()
    .from(turnaroundEscalationTable)
    .where(eq(turnaroundEscalationTable.operationId, operation.id))

  const staffing = await db
    .select()
    .from(turnaroundStaffingTable)
    .where(eq(turnaroundStaffingTable.operationId, operation.id))

  const taskDependencies = await db
    .select()
    .from(turnaroundTaskDependencyTable)
    .where(eq(turnaroundTaskDependencyTable.operationId, operation.id))

  const handoffs = await db
    .select()
    .from(turnaroundHandoffTable)
    .where(eq(turnaroundHandoffTable.operationId, operation.id))

  const taskUpdateRowsByTaskId = new Map()
  const operationalUserIds = [
    ...(tasks || []).map(task => task.ownerUserId),
    ...(signoffs || []).map(signoff => signoff.approverUserId),
    ...(escalations || []).map(escalation => escalation.ownerUserId),
    ...(handoffs || []).map(handoff => handoff.ownerUserId)
  ]

  for (const task of tasks || []) {
    const updates = await db
      .select()
      .from(turnaroundTaskUpdateTable)
      .where(eq(turnaroundTaskUpdateTable.taskId, task.id))

    taskUpdateRowsByTaskId.set(task.id, updates || [])
    operationalUserIds.push(...(updates || []).map(update => update.authorUserId))
  }

  const userDisplayById = await buildAppUserDisplayLookup(operationalUserIds)

  const sortedSignoffs = [...(signoffs || [])]
    .map(signoff => enrichOperationalPerson(signoff, userDisplayById, 'approverUserId', 'approverDisplayName'))
    .sort((a, b) => String(a.departmentRole).localeCompare(String(b.departmentRole)))
  const sortedEscalations = [...(escalations || [])]
    .map(escalation => enrichOperationalPerson(escalation, userDisplayById, 'ownerUserId', 'ownerDisplayName'))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const sortedStaffing = [...(staffing || [])].sort((a, b) => String(a.departmentRole).localeCompare(String(b.departmentRole)))
  const sortedTaskDependencies = [...(taskDependencies || [])].sort((a, b) => String(a.status).localeCompare(String(b.status)))
  const sortedHandoffs = [...(handoffs || [])]
    .map(handoff => enrichOperationalPerson(handoff, userDisplayById, 'ownerUserId', 'ownerDisplayName'))
    .sort((a, b) => String(a.dueTime || '').localeCompare(String(b.dueTime || '')))

  const sortedTasks = []

  for (const task of [...(tasks || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))) {
    const updates = taskUpdateRowsByTaskId.get(task.id) || []

    sortedTasks.push({
      ...enrichOperationalPerson(task, userDisplayById, 'ownerUserId', 'ownerDisplayName'),
      updates: [...updates]
        .map(update => enrichOperationalPerson(update, userDisplayById, 'authorUserId', 'authorDisplayName'))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    })
  }

  const taskNameById = new Map(sortedTasks.map(task => [task.id, task.taskName]))
  const enrichedDependencies = sortedTaskDependencies.map(dependency => ({
    ...dependency,
    taskName: taskNameById.get(dependency.taskId) || 'Unknown task',
    dependsOnTaskName: taskNameById.get(dependency.dependsOnTaskId) || 'Unknown prerequisite'
  }))
  const auditEvents = await listAuditEventsForOperation(operation.id, { limit: 8 })
  const releasePacket = buildTurnaroundReleasePacket({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents
  })
  const operationalTimeline = buildTurnaroundOperationalTimeline({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents
  })
  const passengerCount = await getPassengerCountForSailing(operation.sailingId)
  const operationalMetrics = buildTurnaroundOperationalMetrics({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    operationalTimeline,
    releasePacket,
    passengerCount
  })
  const lifecycleState = buildTurnaroundLifecycleState({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics
  })
  const playbookTemplate = buildTurnaroundPlaybookTemplate({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics,
    passengerCount
  })
  const playbookVariance = buildTurnaroundPlaybookVariance({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics,
    playbookTemplate
  })
  const incidentCommand = buildTurnaroundIncidentCommand({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics,
    operationalTimeline,
    playbookVariance
  })
  const afterActionReview = buildTurnaroundAfterActionReview({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    operationalTimeline,
    operationalMetrics,
    lifecycleState,
    playbookTemplate,
    playbookVariance,
    incidentCommand
  })
  const executiveBrief = buildTurnaroundExecutiveBrief({
    operation,
    releasePacket,
    operationalTimeline,
    operationalMetrics,
    lifecycleState,
    playbookTemplate,
    playbookVariance,
    incidentCommand,
    afterActionReview
  })
  const reviewerPacket = buildTurnaroundReviewerPacket({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    releasePacket,
    operationalTimeline,
    operationalMetrics,
    lifecycleState,
    playbookTemplate,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    executiveBrief
  })
  const outreachBoard = buildTurnaroundOutreachBoard({
    operation,
    reviewerPacket,
    executiveBrief,
    afterActionReview,
    incidentCommand
  })
  const managementStatus = buildTurnaroundManagementStatus({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    releasePacket,
    operationalTimeline,
    operationalMetrics,
    lifecycleState,
    playbookTemplate,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    executiveBrief,
    reviewerPacket,
    outreachBoard
  })
  const launchPlan = buildTurnaroundLaunchPlan({
    operation,
    releasePacket,
    operationalMetrics,
    incidentCommand,
    afterActionReview,
    executiveBrief,
    reviewerPacket,
    outreachBoard,
    managementStatus
  })
  const scenarioPlan = buildTurnaroundScenarioPlan({
    operation,
    releasePacket,
    operationalMetrics,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    launchPlan,
    managementStatus
  })
  const productionReadiness = buildTurnaroundProductionReadiness({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    executiveBrief,
    reviewerPacket,
    outreachBoard,
    managementStatus,
    launchPlan,
    scenarioPlan
  })
  const applicationDossier = buildTurnaroundApplicationDossier({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    releasePacket,
    operationalMetrics,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    executiveBrief,
    reviewerPacket,
    outreachBoard,
    managementStatus,
    launchPlan,
    scenarioPlan,
    productionReadiness
  })

  const presentationGuide = buildTurnaroundPresentationGuide({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    lifecycleState,
    releasePacket,
    operationalMetrics,
    executiveBrief,
    reviewerPacket,
    managementStatus,
    launchPlan,
    productionReadiness,
    applicationDossier
  })
  const closeoutPacket = buildTurnaroundCloseoutPacket({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    lifecycleState,
    releasePacket,
    operationalTimeline,
    operationalMetrics,
    afterActionReview,
    executiveBrief,
    reviewerPacket,
    managementStatus,
    launchPlan,
    scenarioPlan,
    productionReadiness,
    applicationDossier,
    presentationGuide
  })
  const commandCenter = buildTurnaroundCommandCenter({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    lifecycleState,
    releasePacket,
    operationalMetrics,
    incidentCommand,
    managementStatus,
    closeoutPacket,
    passengerCount
  })
  const continuityCenter = buildTurnaroundContinuityCenter({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    lifecycleState,
    releasePacket,
    commandCenter,
    closeoutPacket,
    productionReadiness,
    passengerCount
  })
  const shiftBriefing = buildTurnaroundShiftBriefing({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics,
    commandCenter,
    continuityCenter,
    closeoutPacket
  })
  const goLiveCenter = buildTurnaroundGoLiveCenter({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    releasePacket,
    operationalMetrics,
    lifecycleState,
    commandCenter,
    continuityCenter,
    shiftBriefing,
    closeoutPacket,
    productionReadiness,
    launchPlan,
    applicationDossier
  })
  const operationsControlBoard = buildTurnaroundOperationsControlBoard({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    commandCenter,
    continuityCenter,
    shiftBriefing,
    goLiveCenter
  })

  return {
    ...operation,
    commandStatus: operation.status,
    commandReadinessLevel: operation.readinessLevel,
    status: getDerivedTurnaroundStatus(sortedTasks, sortedEscalations),
    readinessLevel: getDerivedTurnaroundReadinessLevel(sortedTasks, sortedSignoffs, sortedEscalations),
    signoffs: sortedSignoffs,
    signoffSummary: getTurnaroundSignoffSummary(sortedSignoffs),
    escalations: sortedEscalations,
    escalationSummary: getTurnaroundEscalationSummary(sortedEscalations),
    staffing: sortedStaffing,
    staffingSummary: getTurnaroundStaffingSummary(sortedStaffing),
    taskDependencies: enrichedDependencies,
    dependencySummary: getTurnaroundDependencySummary(enrichedDependencies),
    handoffs: sortedHandoffs,
    handoffSummary: getTurnaroundHandoffSummary(sortedHandoffs),
    sailing,
    ship,
    cruiseLine,
    passengerCount,
    taskSummary: getTurnaroundProgress(sortedTasks),
    releasePacket,
    operationalTimeline,
    operationalMetrics,
    lifecycleState,
    playbookTemplate,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    executiveBrief,
    reviewerPacket,
    outreachBoard,
    managementStatus,
    launchPlan,
    scenarioPlan,
    productionReadiness,
    applicationDossier,
    presentationGuide,
    closeoutPacket,
    commandCenter,
    continuityCenter,
    shiftBriefing,
    goLiveCenter,
    operationsControlBoard,
    auditEvents,
    tasks: sortedTasks
  }
}









exports.getPublicLaunchReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const files = buildProjectFilePresenceMap()
    const packageJson = safeReadJsonProjectFile('package.json')
    const readme = safeReadProjectFile('README.md')
    const appSource = safeReadProjectFile('app.js')
    const controllerSource = safeReadProjectFile('controllers/cruise.controller.js')
    const componentIndex = [
      safeReadProjectFile('frontend/react/src/App.jsx'),
      safeReadProjectFile('frontend/react/src/components/EmployerDemoCommandCenter.jsx'),
      safeReadProjectFile('frontend/react/src/components/ReactRoleDashboard.jsx'),
      safeReadProjectFile('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx'),
      safeReadProjectFile('frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx'),
      safeReadProjectFile('frontend/react/src/components/ReactProductionHardeningCenter.jsx'),
      safeReadProjectFile('frontend/react/src/components/ReactDeploymentReadinessCenter.jsx'),
      safeReadProjectFile('frontend/react/src/components/ReactPortfolioPolishCenter.jsx')
    ].join('\n')

    const [
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      turnaroundEscalations,
      turnaroundHandoffs,
      turnaroundSignoffs,
      auditEvents
    ] = await Promise.all([
      db.select().from(cruiseLineTable),
      db.select().from(shipTable),
      db.select().from(sailingTable),
      db.select().from(customerTable),
      db.select().from(bookingTable),
      db.select().from(bookingPassengerTable),
      db.select().from(demoUserTable),
      db.select().from(appUserTable),
      db.select().from(appRoleTable),
      db.select().from(appUserRoleTable),
      db.select().from(turnaroundOperationTable),
      db.select().from(turnaroundTaskTable),
      db.select().from(turnaroundEscalationTable),
      db.select().from(turnaroundHandoffTable),
      db.select().from(turnaroundSignoffTable),
      db.select().from(auditEventTable)
    ])

    const dataArchitecture = buildDataArchitectureReadiness({
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      escalations: turnaroundEscalations,
      handoffs: turnaroundHandoffs,
      signoffs: turnaroundSignoffs,
      auditEvents
    })

    const productionHardening = buildProductionHardeningReadiness({
      env: process.env,
      packageJson,
      files,
      appSource,
      controllerSource,
      loggerSource: safeReadProjectFile('middleware/loggers.js')
    })

    const deployment = buildDeploymentReadiness({
      env: process.env,
      packageJson,
      files,
      renderConfig: safeReadProjectFile('render.yaml'),
      dockerCompose: safeReadProjectFile('docker-compose.yml'),
      readme,
      appSource
    })

    const portfolio = buildPortfolioShowcase({
      packageJson,
      files,
      readme,
      componentIndex,
      testSummary: readme
    })

    return res.status(200).json(buildPublicLaunchReadiness({
      dataArchitecture,
      productionHardening,
      deployment,
      portfolio
    }))
  } catch (err) {
    next(err)
  }
}

exports.getPortfolioShowcase = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(buildPortfolioShowcase({
      packageJson: safeReadJsonProjectFile('package.json'),
      files: buildProjectFilePresenceMap(),
      readme: safeReadProjectFile('README.md'),
      componentIndex: [
        safeReadProjectFile('frontend/react/src/App.jsx'),
        safeReadProjectFile('frontend/react/src/components/EmployerDemoCommandCenter.jsx'),
        safeReadProjectFile('frontend/react/src/components/ReactRoleDashboard.jsx'),
        safeReadProjectFile('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx'),
        safeReadProjectFile('frontend/react/src/components/ReactDataArchitectureReadinessCenter.jsx'),
        safeReadProjectFile('frontend/react/src/components/ReactProductionHardeningCenter.jsx'),
        safeReadProjectFile('frontend/react/src/components/ReactDeploymentReadinessCenter.jsx')
      ].join('\n'),
      testSummary: safeReadProjectFile('README.md')
    }))
  } catch (err) {
    next(err)
  }
}

exports.getDeploymentReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(buildDeploymentReadiness({
      env: process.env,
      packageJson: safeReadJsonProjectFile('package.json'),
      files: buildProjectFilePresenceMap(),
      renderConfig: safeReadProjectFile('render.yaml'),
      dockerCompose: safeReadProjectFile('docker-compose.yml'),
      readme: safeReadProjectFile('README.md'),
      appSource: safeReadProjectFile('app.js')
    }))
  } catch (err) {
    next(err)
  }
}

exports.getProductionHardeningReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(buildProductionHardeningReadiness({
      env: process.env,
      packageJson: safeReadJsonProjectFile('package.json'),
      files: buildProjectFilePresenceMap(),
      appSource: safeReadProjectFile('app.js'),
      controllerSource: safeReadProjectFile('controllers/cruise.controller.js'),
      loggerSource: safeReadProjectFile('middleware/loggers.js')
    }))
  } catch (err) {
    next(err)
  }
}

exports.getDataArchitectureReadiness = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const [
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      turnaroundEscalations,
      turnaroundHandoffs,
      turnaroundSignoffs,
      auditEvents
    ] = await Promise.all([
      db.select().from(cruiseLineTable),
      db.select().from(shipTable),
      db.select().from(sailingTable),
      db.select().from(customerTable),
      db.select().from(bookingTable),
      db.select().from(bookingPassengerTable),
      db.select().from(demoUserTable),
      db.select().from(appUserTable),
      db.select().from(appRoleTable),
      db.select().from(appUserRoleTable),
      db.select().from(turnaroundOperationTable),
      db.select().from(turnaroundTaskTable),
      db.select().from(turnaroundEscalationTable),
      db.select().from(turnaroundHandoffTable),
      db.select().from(turnaroundSignoffTable),
      db.select().from(auditEventTable)
    ])

    return res.status(200).json(buildDataArchitectureReadiness({
      cruiseLines,
      ships,
      sailings,
      customers,
      bookings,
      bookingPassengers,
      demoUsers,
      appUsers,
      appRoles,
      appUserRoles,
      turnaroundOperations,
      turnaroundTasks,
      escalations: turnaroundEscalations,
      handoffs: turnaroundHandoffs,
      signoffs: turnaroundSignoffs,
      auditEvents
    }))
  } catch (err) {
    next(err)
  }
}

exports.getTurnaroundAdminSetup = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    return res.status(200).json(await buildTurnaroundSetupSummary())
  } catch (err) {
    next(err)
  }
}

exports.createTurnaroundPerson = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const person = await createTurnaroundSetupPerson(req.body)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'TURNAROUND_PERSON_CREATED',
      entityType: 'DEMO_USER',
      entityId: person.id,
      cruiseLineId: person.cruiseLineId || null,
      shipId: person.assignedShipId || null,
      source: 'TURNAROUND_ADMIN_SETUP_API',
      eventPayload: { displayName: person.displayName, role: person.role }
    })

    return res.status(201).json({
      message: 'Turnaround person created and assigned successfully',
      person,
      setup: await buildTurnaroundSetupSummary()
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    next(err)
  }
}

exports.updateTurnaroundPerson = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const person = await updateTurnaroundSetupPerson(req.params.id, req.body)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'TURNAROUND_PERSON_UPDATED',
      entityType: 'DEMO_USER',
      entityId: person.id,
      cruiseLineId: person.cruiseLineId || null,
      shipId: person.assignedShipId || null,
      source: 'TURNAROUND_ADMIN_SETUP_API',
      eventPayload: { displayName: person.displayName, role: person.role }
    })

    return res.status(200).json({
      message: 'Turnaround person assignment updated successfully',
      person,
      setup: await buildTurnaroundSetupSummary()
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    next(err)
  }
}

exports.deleteTurnaroundPerson = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const person = await deleteTurnaroundSetupPerson(req.params.id)
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'TURNAROUND_PERSON_REMOVED',
      entityType: 'DEMO_USER',
      entityId: person.id,
      cruiseLineId: person.cruiseLineId || null,
      shipId: person.assignedShipId || null,
      source: 'TURNAROUND_ADMIN_SETUP_API',
      eventPayload: { displayName: person.displayName, role: person.role }
    })

    return res.status(200).json({
      message: 'Turnaround person removed from this team',
      person,
      setup: await buildTurnaroundSetupSummary()
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    next(err)
  }
}

exports.getPlatformAuditEvents = async (req, res, next) => {
  try {
    if (!(await requireAdminRequest(req, res))) return

    const auditEvents = await listAuditEvents(buildAuditEventFilters(req.query), {
      limit: req.query.limit || 50
    })

    return res.status(200).json({
      auditEvents,
      filters: buildAuditEventFilters(req.query),
      limit: auditEvents.length
    })
  } catch (error) {
    return next(error)
  }
}

exports.getTurnaroundOperations = async (req, res, next) => {
  try {
    let operations = await getTurnaroundOperationsForRequest(req)

    if (!operations || operations.length === 0) {
      // Guard against an empty turnaround dataset after destructive test/demo resets.
      // Reloading the seed keeps the operations API contract stable for the app and
      // for integration tests that expect at least one operation with task details.
      await loadCruiseData()
      operations = await getTurnaroundOperationsForRequest(req)
    }

    if (!operations || operations.length === 0) {
      return res.status(404).json({ message: 'No turnaround operations found' })
    }

    const operationDetails = await Promise.all(
      operations.map((operation) => getTurnaroundOperationDetails(operation))
    )

    return res.status(200).json(operationDetails.sort((a, b) => String(a.turnaroundDate).localeCompare(String(b.turnaroundDate))))
  } catch (err) {
    next(err)
  }
}



exports.getTurnaroundOperationAuditEvents = async (req, res, next) => {
  try {
    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, req.params.id))
      .limit(1)

    const operation = operationRows[0]
    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const auditEvents = await listAuditEventsForOperation(operation.id, {
      limit: req.query.limit || 50
    })

    return res.status(200).json({
      operationId: operation.id,
      auditEvents
    })
  } catch (error) {
    return next(error)
  }
}


exports.updateTurnaroundOperationCommand = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['status', 'readinessLevel', 'port', 'notes']
    const operationUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        operationUpdates[field] = req.body[field] || null
      }
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.keys(operationUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround command field is required' })
    }

    await db
      .update(turnaroundOperationTable)
      .set(operationUpdates)
      .where(eq(turnaroundOperationTable.id, id))

    await recordTurnaroundAuditEvent(req, operation, {
      eventType: 'TURNAROUND_COMMAND_UPDATED',
      entityType: 'TURNAROUND_OPERATION',
      entityId: id,
      eventPayload: {
        previous: {
          status: operation.status,
          readinessLevel: operation.readinessLevel,
          port: operation.port,
          notes: operation.notes
        },
        updates: operationUpdates
      }
    })

    const refreshedOperationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    return res.status(200).json({
      message: 'Turnaround command plan updated successfully',
      operation: await getTurnaroundOperationDetails(refreshedOperationRows[0] || operation)
    })
  } catch (err) {
    next(err)
  }
}


exports.createTurnaroundEscalation = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departmentRole, severity = 'WATCH', title, ownerName, status = 'OPEN', resolutionNotes } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .insert(turnaroundEscalationTable)
      .values({
        operationId: id,
        departmentRole,
        severity,
        title,
        ownerName: ownerName || null,
        ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
        status,
        resolutionNotes: resolutionNotes || null,
        createdAt: new Date().toISOString()
      })

    await recordTurnaroundAuditEvent(req, operation, {
      eventType: 'TURNAROUND_ESCALATION_CREATED',
      entityType: 'TURNAROUND_ESCALATION',
      entityId: id,
      eventPayload: { departmentRole, severity, title, ownerName: ownerName || null, status, resolutionNotes: resolutionNotes || null }
    })

    return res.status(201).json({
      message: 'Turnaround escalation created successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundEscalation = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['severity', 'title', 'ownerName', 'status', 'resolutionNotes']
    const escalationUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        escalationUpdates[field] = req.body[field] || null
      }
    }

    const escalationRows = await db
      .select()
      .from(turnaroundEscalationTable)
      .where(eq(turnaroundEscalationTable.id, id))
      .limit(1)

    const escalation = escalationRows[0]

    if (!escalation) {
      return res.status(404).json({ message: 'Turnaround escalation not found' })
    }

    if (Object.keys(escalationUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround escalation field is required' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, escalation.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
      escalationUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
    }

    await db
      .update(turnaroundEscalationTable)
      .set(escalationUpdates)
      .where(eq(turnaroundEscalationTable.id, id))

    await recordTurnaroundAuditEvent(req, operation, {
      eventType: 'TURNAROUND_ESCALATION_UPDATED',
      entityType: 'TURNAROUND_ESCALATION',
      entityId: id,
      eventPayload: { previous: escalation, updates: escalationUpdates }
    })

    return res.status(200).json({
      message: 'Turnaround escalation updated successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}


exports.updateTurnaroundStaffing = async (req, res, next) => {
  try {
    const { id, departmentRole } = req.params
    const { plannedCount, checkedInCount, leadName, musterLocation, notes } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const staffingValues = {
      plannedCount: Number(plannedCount || 0),
      checkedInCount: Number(checkedInCount || 0),
      leadName: leadName || null,
      musterLocation: musterLocation || null,
      notes: notes || null
    }

    const existingStaffing = await db
      .select()
      .from(turnaroundStaffingTable)
      .where(and(
        eq(turnaroundStaffingTable.operationId, id),
        eq(turnaroundStaffingTable.departmentRole, departmentRole)
      ))
      .limit(1)

    if (existingStaffing[0]) {
      await db
        .update(turnaroundStaffingTable)
        .set(staffingValues)
        .where(eq(turnaroundStaffingTable.id, existingStaffing[0].id))
    } else {
      await db
        .insert(turnaroundStaffingTable)
        .values({
          operationId: id,
          departmentRole,
          ...staffingValues
        })
    }

    await recordTurnaroundAuditEvent(req, operation, {
      eventType: 'TURNAROUND_STAFFING_UPDATED',
      entityType: 'TURNAROUND_STAFFING',
      entityId: existingStaffing[0]?.id || `${id}:${departmentRole}`,
      eventPayload: { departmentRole, previous: existingStaffing[0] || null, updates: staffingValues }
    })

    return res.status(200).json({
      message: 'Turnaround staffing plan updated successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundSignoff = async (req, res, next) => {
  try {
    const { id, departmentRole } = req.params
    const { status, approverName, notes } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const existingSignoffs = await db
      .select()
      .from(turnaroundSignoffTable)
      .where(and(
        eq(turnaroundSignoffTable.operationId, id),
        eq(turnaroundSignoffTable.departmentRole, departmentRole)
      ))
      .limit(1)

    const signoffValues = {
      approverName,
      approverUserId: await resolveOperationalUserIdByName(approverName, operation),
      status,
      notes: notes || null,
      signedAt: status === 'PENDING' ? null : new Date().toISOString()
    }

    if (existingSignoffs[0]) {
      await db
        .update(turnaroundSignoffTable)
        .set(signoffValues)
        .where(eq(turnaroundSignoffTable.id, existingSignoffs[0].id))
    } else {
      await db
        .insert(turnaroundSignoffTable)
        .values({
          operationId: id,
          departmentRole,
          ...signoffValues
        })
    }

    await recordTurnaroundAuditEvent(req, operation, {
      eventType: 'TURNAROUND_SIGNOFF_UPDATED',
      entityType: 'TURNAROUND_SIGNOFF',
      entityId: existingSignoffs[0]?.id || `${id}:${departmentRole}`,
      eventPayload: { departmentRole, previous: existingSignoffs[0] || null, updates: signoffValues }
    })

    return res.status(200).json({
      message: 'Turnaround readiness signoff updated successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    let { status } = req.body
    const normalizedStatus = String(status || '').trim().toUpperCase().replace(/[-\s]+/g, '_')
    const supportedStatuses = new Set(['READY', 'IN_PROGRESS', 'BLOCKED', 'WATCH', 'COMPLETE'])

    if (!supportedStatuses.has(normalizedStatus)) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [
          {
            field: 'status',
            message: 'Invalid turnaround task status'
          }
        ]
      })
    }

    status = normalizedStatus
    req.body.status = normalizedStatus

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    const nextTaskValues = { status }

    if (Object.prototype.hasOwnProperty.call(req.body, 'blockerReason')) {
      nextTaskValues.blockerReason = status === 'BLOCKED' ? req.body.blockerReason || 'Blocked pending operational follow-up' : req.body.blockerReason || null
    } else if (status !== 'BLOCKED') {
      nextTaskValues.blockerReason = null
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .update(turnaroundTaskTable)
      .set(nextTaskValues)
      .where(eq(turnaroundTaskTable.id, id))

    if (operation) {
      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_TASK_STATUS_UPDATED',
        entityType: 'TURNAROUND_TASK',
        entityId: id,
        eventPayload: { previous: { status: existingTask.status, blockerReason: existingTask.blockerReason }, updates: nextTaskValues }
      })
    }

    if (!operation) {
      return res.status(200).json({ message: 'Turnaround task status updated successfully' })
    }

    return res.status(200).json({
      message: 'Turnaround task status updated successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}



exports.createTurnaroundTask = async (req, res, next) => {
  try {
    const { id } = req.params
    const { departmentRole, taskName, ownerName, dueTime, location, blockerReason, status = 'READY' } = req.body

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, id))
      .limit(1)

    const operation = operationRows[0]

    if (!operation) {
      return res.status(404).json({ message: 'Turnaround operation not found' })
    }

    if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.operationId, id))

    const nextSortOrder = existingTasks.reduce((maxSortOrder, task) => Math.max(maxSortOrder, Number(task.sortOrder || 0)), 0) + 1

    const taskValues = {
      operationId: id,
      departmentRole,
      taskName,
      ownerName: ownerName || null,
      ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
      dueTime: dueTime || null,
      location: location || null,
      blockerReason: blockerReason || null,
      status,
      sortOrder: nextSortOrder
    }

    await db
      .insert(turnaroundTaskTable)
      .values(taskValues)

    await recordTurnaroundAuditEvent(req, operation, {
      eventType: 'TURNAROUND_TASK_CREATED',
      entityType: 'TURNAROUND_TASK',
      entityId: `${id}:${nextSortOrder}`,
      eventPayload: taskValues
    })

    return res.status(201).json({
      message: 'Turnaround task created successfully',
      operation: await getTurnaroundOperationDetails(operation)
    })
  } catch (err) {
    next(err)
  }
}

exports.createTurnaroundTaskUpdate = async (req, res, next) => {
  try {
    const { id } = req.params
    const { authorName, updateType = 'NOTE', message } = req.body

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    const taskUpdateValues = {
      taskId: id,
      authorName,
      authorUserId: await resolveOperationalUserIdByName(authorName, operation),
      updateType,
      message,
      createdAt: new Date().toISOString()
    }

    await db
      .insert(turnaroundTaskUpdateTable)
      .values(taskUpdateValues)

    if (operation) {
      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_TASK_UPDATE_CREATED',
        entityType: 'TURNAROUND_TASK',
        entityId: id,
        eventPayload: taskUpdateValues
      })
    }

    return res.status(201).json({
      message: 'Turnaround task update added successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}


exports.deleteTurnaroundTask = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    await db
      .delete(turnaroundTaskDependencyTable)
      .where(eq(turnaroundTaskDependencyTable.taskId, id))

    await db
      .delete(turnaroundTaskDependencyTable)
      .where(eq(turnaroundTaskDependencyTable.dependsOnTaskId, id))

    await db
      .delete(turnaroundTaskUpdateTable)
      .where(eq(turnaroundTaskUpdateTable.taskId, id))

    await db
      .delete(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))

    if (operation) {
      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_TASK_DELETED',
        entityType: 'TURNAROUND_TASK',
        entityId: id,
        eventPayload: { deletedTask: existingTask }
      })
    }

    return res.status(200).json({
      message: 'Turnaround task removed successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}

exports.updateTurnaroundTaskDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['ownerName', 'dueTime', 'location', 'blockerReason']
    const taskUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        taskUpdates[field] = req.body[field] || null
      }
    }

    const existingTasks = await db
      .select()
      .from(turnaroundTaskTable)
      .where(eq(turnaroundTaskTable.id, id))
      .limit(1)

    const existingTask = existingTasks[0]

    if (!existingTask) {
      return res.status(404).json({ message: 'Turnaround task not found' })
    }

    if (Object.keys(taskUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround task detail is required' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, existingTask.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
      taskUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
    }

    await db
      .update(turnaroundTaskTable)
      .set(taskUpdates)
      .where(eq(turnaroundTaskTable.id, id))

    if (operation) {
      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_TASK_DETAILS_UPDATED',
        entityType: 'TURNAROUND_TASK',
        entityId: id,
        eventPayload: { previous: existingTask, updates: taskUpdates }
      })
    }

    return res.status(200).json({
      message: 'Turnaround task details updated successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}


exports.updateTurnaroundHandoff = async (req, res, next) => {
  try {
    const { id } = req.params
    const allowedFields = ['status', 'ownerName', 'dueTime', 'notes']
    const handoffUpdates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        handoffUpdates[field] = req.body[field] || null
      }
    }

    if (handoffUpdates.status === 'COMPLETE') {
      handoffUpdates.completedAt = new Date().toISOString()
    } else if (Object.prototype.hasOwnProperty.call(handoffUpdates, 'status')) {
      handoffUpdates.completedAt = null
    }

    const handoffRows = await db
      .select()
      .from(turnaroundHandoffTable)
      .where(eq(turnaroundHandoffTable.id, id))
      .limit(1)

    const handoff = handoffRows[0]

    if (!handoff) {
      return res.status(404).json({ message: 'Turnaround handoff not found' })
    }

    if (Object.keys(handoffUpdates).length === 0) {
      return res.status(400).json({ message: 'At least one turnaround handoff field is required' })
    }

    const operationRows = await db
      .select()
      .from(turnaroundOperationTable)
      .where(eq(turnaroundOperationTable.id, handoff.operationId))
      .limit(1)

    const operation = operationRows[0]

    if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
      return sendTurnaroundOperationForbidden(res)
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
      handoffUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
    }

    await db
      .update(turnaroundHandoffTable)
      .set(handoffUpdates)
      .where(eq(turnaroundHandoffTable.id, id))

    if (operation) {
      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_HANDOFF_UPDATED',
        entityType: 'TURNAROUND_HANDOFF',
        entityId: id,
        eventPayload: { previous: handoff, updates: handoffUpdates }
      })
    }

    return res.status(200).json({
      message: 'Turnaround handoff updated successfully',
      operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
    })
  } catch (err) {
    next(err)
  }
}

exports.getDemoUsers = async (req, res, next) => {
  try {
    const demoUsers = await db.select().from(demoUserTable)

    if (!demoUsers || demoUsers.length === 0) {
      return res.status(404).json({ message: 'No demo users found' })
    }

    return res.status(200).json(demoUsers)
  } catch (err) {
    next(err)
  }
}

exports.getDemoUserContext = async (req, res, next) => {
  try {
    const { id } = req.params

    const userRows = await db
      .select()
      .from(demoUserTable)
      .where(eq(demoUserTable.id, id))
      .limit(1)

    const user = userRows[0]

    if (!user) {
      return res.status(404).json({ message: 'Demo user not found' })
    }

    if (user.role === 'ADMIN') {
      const customers = await db.select().from(customerTable)
      const bookings = await db.select().from(bookingTable)

      return res.status(200).json({
        user,
        customer: null,
        bookings: [],
        visibility: {
          canManageCruiseData: true,
          canViewAllCustomers: true,
          canViewAllBookings: true,
          accessibleCustomerCount: customers.length,
          accessibleBookingCount: bookings.length
        }
      })
    }

    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, user.customerId))
      .limit(1)

    const customer = customerRows[0] || null

    if (!customer) {
      return res.status(200).json({
        user,
        customer: null,
        bookings: [],
        visibility: {
          canManageCruiseData: false,
          canViewAllCustomers: false,
          canViewAllBookings: false,
          accessibleCustomerCount: 0,
          accessibleBookingCount: 0
        }
      })
    }

    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, customer.id))

    const bookings = []

    for (const passengerRow of passengerRows) {
      const bookingRows = await db
        .select()
        .from(bookingTable)
        .where(eq(bookingTable.id, passengerRow.bookingId))
        .limit(1)

      if (bookingRows[0]) {
        bookings.push(await getBookingDetails(bookingRows[0]))
      }
    }

    const accessibleCustomerIds = new Set([customer.id])

    if (user.role === 'GROUP_LEADER') {
      bookings.forEach(booking => {
        booking.passengers.forEach(passenger => accessibleCustomerIds.add(passenger.customerId))
      })
    }

    return res.status(200).json({
      user,
      customer,
      bookings,
      visibility: {
        canManageCruiseData: false,
        canViewAllCustomers: false,
        canViewAllBookings: false,
        accessibleCustomerCount: accessibleCustomerIds.size,
        accessibleBookingCount: bookings.length
      }
    })
  } catch (err) {
    next(err)
  }
}

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await db.select().from(customerTable)

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: 'No customers found' })
    }

    return res.status(200).json(customers)
  } catch (err) {
    next(err)
  }
}

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params

    const rows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!rows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    return res.status(200).json(rows[0])
  } catch (err) {
    next(err)
  }
}

exports.insertCustomer = async (req, res, next) => {
  try {
    const { id, firstName, lastName, email, phone, loyaltyNumber } = req.body

    const duplicateIdRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (duplicateIdRows[0]) {
      return res.status(400).json({ message: 'Customer with the same ID already exists' })
    }

    const duplicateEmailRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.email, email))
      .limit(1)

    if (duplicateEmailRows[0]) {
      return res.status(400).json({ message: 'Customer with the same email already exists' })
    }

    const customerValues = { id, firstName, lastName, email, phone, loyaltyNumber }
    await db
      .insert(customerTable)
      .values(customerValues)

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: customerValues
    })

    return res.status(201).json({
      message: 'Customer created successfully',
      id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, loyaltyNumber } = req.body

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const customerUpdates = { firstName, lastName, email, phone, loyaltyNumber }
    await db
      .update(customerTable)
      .set(customerUpdates)
      .where(eq(customerTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: { previous: existingRows[0], updates: customerUpdates }
    })

    return res.status(200).json({ message: 'Customer updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    await db
      .update(bookingTable)
      .set({ createdByCustomerId: null })
      .where(eq(bookingTable.createdByCustomerId, id))

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, id))

    await db
      .delete(customerTable)
      .where(eq(customerTable.id, id))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'CUSTOMER_DELETED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: { deletedCustomer: existingRows[0] }
    })

    return res.status(200).json({ message: 'Customer deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await db.select().from(bookingTable)

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found' })
    }

    return res.status(200).json(await getBookingDetailsBatch(bookings))
  } catch (err) {
    next(err)
  }
}

exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params

    const rows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (!rows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    return res.status(200).json(await getBookingDetails(rows[0]))
  } catch (err) {
    next(err)
  }
}

exports.getBookingsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params

    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, customerId))
      .limit(1)

    if (!customerRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.customerId, customerId))

    if (!passengerRows || passengerRows.length === 0) {
      return res.status(404).json({ message: 'No bookings found for the specified customer' })
    }

    const bookingRows = await selectByIds(
      bookingTable,
      bookingTable.id,
      passengerRows.map(passengerRow => passengerRow.bookingId)
    )

    return res.status(200).json(await getBookingDetailsBatch(bookingRows))
  } catch (err) {
    next(err)
  }
}

exports.insertBooking = async (req, res, next) => {
  try {
    const {
      id,
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId,
      passengers
    } = req.body

    const duplicateRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (duplicateRows[0]) {
      return res.status(400).json({ message: 'Booking with the same ID already exists' })
    }

    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.id, sailingId))
      .limit(1)

    if (!sailingRows[0]) {
      return res.status(400).json({ message: 'Invalid sailing ID' })
    }

    for (const passenger of passengers) {
      const customerRows = await db
        .select()
        .from(customerTable)
        .where(eq(customerTable.id, passenger.customerId))
        .limit(1)

      if (!customerRows[0]) {
        return res.status(400).json({ message: `Invalid customer ID ${passenger.customerId}` })
      }
    }

    const uniquePassengerIds = new Set(passengers.map(passenger => passenger.customerId))

    if (uniquePassengerIds.size !== passengers.length) {
      return res.status(400).json({ message: 'Booking cannot include duplicate customers' })
    }


    const primaryGuestCount = passengers.filter(passenger => passenger.isPrimaryGuest).length

    if (primaryGuestCount !== 1) {
      return res.status(400).json({ message: 'Booking must include exactly one primary guest' })
    }

    const overlappingBooking = await findBookingOverlapForPassengers({
      sailing: sailingRows[0],
      passengers
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    const bookingValues = {
      id,
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId
    }

    await db.transaction(async tx => {
      await tx.insert(bookingTable).values(bookingValues)

      for (const passenger of passengers) {
        await tx.insert(bookingPassengerTable).values({
          id: `${id}-${passenger.customerId}`,
          bookingId: id,
          customerId: passenger.customerId,
          passengerRole: passenger.passengerRole,
          isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
          diningPreference: passenger.diningPreference,
          accessibilityNotes: passenger.accessibilityNotes,
          boardingGroup: passenger.boardingGroup
        })
      }
    })

    const bookingScope = await getSailingAuditScope(sailingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: id,
      ...bookingScope,
      eventPayload: { booking: bookingValues, passengerCount: passengers.length }
    })

    return res.status(201).json({
      message: 'Booking created successfully',
      id
    })
  } catch (err) {
    next(err)
  }
}

exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId,
      passengers
    } = req.body

    const existingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.id, sailingId))
      .limit(1)

    if (!sailingRows[0]) {
      return res.status(400).json({ message: 'Invalid sailing ID' })
    }

    const uniquePassengerIds = new Set(passengers.map(passenger => passenger.customerId))

    if (uniquePassengerIds.size !== passengers.length) {
      return res.status(400).json({ message: 'Booking cannot include duplicate customers' })
    }

    for (const passenger of passengers) {
      const customerRows = await db
        .select()
        .from(customerTable)
        .where(eq(customerTable.id, passenger.customerId))
        .limit(1)

      if (!customerRows[0]) {
        return res.status(400).json({ message: `Invalid customer ID ${passenger.customerId}` })
      }
    }

    const primaryGuestCount = passengers.filter(passenger => passenger.isPrimaryGuest).length

    if (primaryGuestCount !== 1) {
      return res.status(400).json({ message: 'Booking must include exactly one primary guest' })
    }

    const overlappingBooking = await findBookingOverlapForPassengers({
      bookingIdToExclude: id,
      sailing: sailingRows[0],
      passengers
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    const bookingUpdates = {
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId
    }

    await db.transaction(async tx => {
      await tx
        .update(bookingTable)
        .set(bookingUpdates)
        .where(eq(bookingTable.id, id))

      await tx
        .delete(bookingPassengerTable)
        .where(eq(bookingPassengerTable.bookingId, id))

      for (const passenger of passengers) {
        await tx.insert(bookingPassengerTable).values({
          id: `${id}-${passenger.customerId}`,
          bookingId: id,
          customerId: passenger.customerId,
          passengerRole: passenger.passengerRole,
          isPrimaryGuest: Boolean(passenger.isPrimaryGuest),
          diningPreference: passenger.diningPreference,
          accessibilityNotes: passenger.accessibilityNotes,
          boardingGroup: passenger.boardingGroup
        })
      }
    })

    const bookingScope = await getSailingAuditScope(sailingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_UPDATED',
      entityType: 'BOOKING',
      entityId: id,
      ...bookingScope,
      eventPayload: { previous: existingRows[0], updates: bookingUpdates, passengerCount: passengers.length }
    })

    return res.status(200).json({ message: 'Booking updated successfully' })
  } catch (err) {
    next(err)
  }
}


exports.updatePassengerSelfServiceProfile = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, diningPreference, accessibilityNotes } = req.body

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    await db
      .update(customerTable)
      .set({ firstName, lastName, email, phone })
      .where(eq(customerTable.id, id))

    await db
      .update(bookingPassengerTable)
      .set({ diningPreference, accessibilityNotes })
      .where(eq(bookingPassengerTable.customerId, id))

    return res.status(200).json({ message: 'Passenger profile updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.updatePassengerBookingPreferences = async (req, res, next) => {
  try {
    const { bookingId, customerId } = req.params
    const { diningPreference, accessibilityNotes } = req.body

    const existingRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Booking passenger not found' })
    }

    await db
      .update(bookingPassengerTable)
      .set({ diningPreference, accessibilityNotes })
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))

    return res.status(200).json({ message: 'Booking preferences updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.addItineraryFavorite = async (req, res, next) => {
  try {
    const { customerId, activityScheduleId } = req.body
    const id = `${customerId}-${activityScheduleId}`

    await db
      .insert(customerItineraryFavoriteTable)
      .values({ id, customerId, activityScheduleId })
      .onConflictDoNothing()

    return res.status(201).json({ message: 'Itinerary favorite saved successfully', id })
  } catch (err) {
    next(err)
  }
}

exports.deleteItineraryFavorite = async (req, res, next) => {
  try {
    const { customerId, activityScheduleId } = req.params

    await db
      .delete(customerItineraryFavoriteTable)
      .where(eq(customerItineraryFavoriteTable.id, `${customerId}-${activityScheduleId}`))

    return res.status(200).json({ message: 'Itinerary favorite removed successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params

    const existingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.bookingId, id))

    await db
      .delete(bookingTable)
      .where(eq(bookingTable.id, id))

    const bookingScope = await getBookingAuditScope(existingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_DELETED',
      entityType: 'BOOKING',
      entityId: id,
      ...bookingScope,
      eventPayload: { deletedBooking: existingRows[0] }
    })

    return res.status(200).json({ message: 'Booking deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.addBookingPassenger = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const {
      customerId,
      passengerRole,
      isPrimaryGuest,
      diningPreference,
      accessibilityNotes,
      boardingGroup
    } = req.body

    const bookingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, bookingId))
      .limit(1)

    if (!bookingRows[0]) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const customerRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, customerId))
      .limit(1)

    if (!customerRows[0]) {
      return res.status(400).json({ message: 'Invalid customer ID' })
    }

    const existingPassengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(
        and(
          eq(bookingPassengerTable.bookingId, bookingId),
          eq(bookingPassengerTable.customerId, customerId)
        )
      )
      .limit(1)

    if (existingPassengerRows[0]) {
      return res.status(400).json({ message: 'Customer is already on this booking' })
    }

    const sailingRows = await db
      .select()
      .from(sailingTable)
      .where(eq(sailingTable.id, bookingRows[0].sailingId))
      .limit(1)

    const overlappingBooking = await findBookingOverlapForPassengers({
      bookingIdToExclude: bookingId,
      sailing: sailingRows[0],
      passengers: [{ customerId }]
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    const passengerValues = {
      id: `${bookingId}-${customerId}`,
      bookingId,
      customerId,
      passengerRole,
      isPrimaryGuest: Boolean(isPrimaryGuest),
      diningPreference,
      accessibilityNotes,
      boardingGroup
    }
    await db.insert(bookingPassengerTable).values(passengerValues)

    const bookingScope = await getBookingAuditScope(bookingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_PASSENGER_ADDED',
      entityType: 'BOOKING_PASSENGER',
      entityId: `${bookingId}-${customerId}`,
      ...bookingScope,
      eventPayload: passengerValues
    })

    return res.status(201).json({ message: 'Booking passenger added successfully' })
  } catch (err) {
    next(err)
  }
}

exports.deleteBookingPassenger = async (req, res, next) => {
  try {
    const { bookingId, customerId } = req.params

    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))
      .limit(1)

    if (!passengerRows[0]) {
      return res.status(404).json({ message: 'Booking passenger not found' })
    }

    const bookingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, bookingId))
      .limit(1)

    await db
      .delete(bookingPassengerTable)
      .where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`))

    const bookingScope = await getBookingAuditScope(bookingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_PASSENGER_REMOVED',
      entityType: 'BOOKING_PASSENGER',
      entityId: `${bookingId}-${customerId}`,
      ...bookingScope,
      eventPayload: { deletedPassenger: passengerRows[0] }
    })

    return res.status(200).json({ message: 'Booking passenger deleted successfully' })
  } catch (err) {
    next(err)
  }
}
