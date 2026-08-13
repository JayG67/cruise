const { eq } = require('drizzle-orm')

const db = require('../db')
const bookingTable = require('../models/booking.model')
const sailingTable = require('../models/sailing.model')
const shipTable = require('../models/ship.model')
const appUserTable = require('../models/appUser.model')
const { resolveRequestAuditActor } = require('./requestAuthorization.service')
const { recordAuditEvent } = require('./auditEvent.service')

const PLATFORM_AUDIT_SOURCE = 'PLATFORM_ADMIN_API'

async function ensurePlatformAuditActor(actor) {
  if (!actor?.actorUserId) return actor

  const existingRows = await db
    .select({ id: appUserTable.id })
    .from(appUserTable)
    .where(eq(appUserTable.id, actor.actorUserId))
    .limit(1)

  if (existingRows[0]) return actor

  await db
    .insert(appUserTable)
    .values({
      id: actor.actorUserId,
      displayName: actor.actorDisplayName || actor.actorUserId,
      email: `${actor.actorUserId}@cruise-explorer.local`,
      userType: 'SYSTEM',
      primaryCustomerId: null,
      cruiseLineId: null,
      assignedShipId: null,
      status: 'ACTIVE'
    })
    .onConflictDoNothing()

  return actor
}

async function resolvePlatformAuditActor(req) {
  const actor = await resolveRequestAuditActor(req)
  const ensuredActor = await ensurePlatformAuditActor(actor)

  return {
    actorUserId: ensuredActor.actorUserId || null,
    actorDisplayName: ensuredActor.actorDisplayName || null
  }
}


async function getShipAuditScope(shipId) {
  if (!shipId) {
    return {
      cruiseLineId: null,
      shipId: null,
      sailingId: null,
      operationId: null
    }
  }

  const shipRows = await db
    .select()
    .from(shipTable)
    .where(eq(shipTable.id, shipId))
    .limit(1)

  const ship = shipRows[0]
  return {
    cruiseLineId: ship?.cruiseLineId || null,
    shipId: ship?.id || shipId,
    sailingId: null,
    operationId: null
  }
}

async function getSailingAuditScope(sailingOrId) {
  const sailingId = typeof sailingOrId === 'string' ? sailingOrId : sailingOrId?.id
  const providedSailing = typeof sailingOrId === 'object' ? sailingOrId : null

  if (!sailingId && !providedSailing?.shipId) {
    return {
      cruiseLineId: null,
      shipId: null,
      sailingId: null,
      operationId: null
    }
  }

  const sailing = providedSailing || (await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, sailingId))
    .limit(1))[0]

  const shipScope = await getShipAuditScope(sailing?.shipId)
  return {
    ...shipScope,
    sailingId: sailing?.id || sailingId || null
  }
}

async function getBookingAuditScope(bookingOrId) {
  const bookingId = typeof bookingOrId === 'string' ? bookingOrId : bookingOrId?.id
  const providedBooking = typeof bookingOrId === 'object' ? bookingOrId : null

  if (!bookingId && !providedBooking?.sailingId) {
    return {
      cruiseLineId: null,
      shipId: null,
      sailingId: null,
      operationId: null
    }
  }

  const booking = providedBooking || (await db
    .select()
    .from(bookingTable)
    .where(eq(bookingTable.id, bookingId))
    .limit(1))[0]

  return getSailingAuditScope(booking?.sailingId)
}

async function recordPlatformAuditEvent(req, event) {
  const actor = await resolvePlatformAuditActor(req)

  return recordAuditEvent({
    ...actor,
    source: PLATFORM_AUDIT_SOURCE,
    ...event
  })
}

module.exports = {
  PLATFORM_AUDIT_SOURCE,
  getBookingAuditScope,
  getSailingAuditScope,
  getShipAuditScope,
  ensurePlatformAuditActor,
  recordPlatformAuditEvent,
  resolvePlatformAuditActor
}
