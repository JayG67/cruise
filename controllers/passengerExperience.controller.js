const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const customerItineraryFavoriteTable = require('../models/customerItineraryFavorite.model')
const customerPreCruiseChecklistTable = require('../models/customerPreCruiseChecklist.model')
const db = require('../db')
const { getBookingAuditScope, recordPlatformAuditEvent } = require('../services/platformAudit.service')
const { buildEntityHistoryPayload, buildEntityUpdateTimestamp } = require('../services/entityHistory.service')
const { withPreCruiseChecklistApiIdentity } = require('../services/apiIdentityBridge.service')
const { getActivityAuditScope } = require('../services/sailingAuditScope.service')
const { eq, sql } = require('drizzle-orm')

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
}

const DEFAULT_PRE_CRUISE_CHECKLIST = Object.freeze({
  documents: false,
  luggage: false,
  dining: false,
  excursions: false
})

function normalizePreCruiseChecklist(row = {}) {
  const checklist = {
    documents: Boolean(row.documents),
    luggage: Boolean(row.luggage),
    dining: Boolean(row.dining),
    excursions: Boolean(row.excursions),
    updatedAt: row.updatedAt || null
  }

  if (row.customerId) checklist.customerId = row.customerId
  if (row.checklistUuid) checklist.checklistUuid = row.checklistUuid

  return row.customerId || row.checklistUuid
    ? withPreCruiseChecklistApiIdentity(checklist)
    : checklist
}

function buildChecklistStorageValues(checklist, updatedAt = new Date().toISOString()) {
  return {
    documents: Boolean(checklist.documents),
    luggage: Boolean(checklist.luggage),
    dining: Boolean(checklist.dining),
    excursions: Boolean(checklist.excursions),
    updatedAt
  }
}

async function refreshPassengerPreferenceTimestamp(customerId) {
  await db.execute(sql`
    UPDATE booking_passengers
    SET "updatedAtTimestamp" = "updatedAt"::timestamptz
    WHERE "customerId" = ${customerId}
      AND "updatedAt" ~ '^\d{4}-\d{2}-\d{2}T';
  `)
}

async function refreshBookingPassengerTimestamp(bookingPassengerId) {
  await db.execute(sql`
    UPDATE booking_passengers
    SET "updatedAtTimestamp" = "updatedAt"::timestamptz
    WHERE id = ${bookingPassengerId}
      AND "updatedAt" ~ '^\d{4}-\d{2}-\d{2}T';
  `)
}

async function refreshPreCruiseChecklistTimestamp(customerId) {
  await db.execute(sql`
    UPDATE customer_pre_cruise_checklists
    SET "updatedAtTimestamp" = "updatedAt"::timestamptz
    WHERE "customerId" = ${customerId}
      AND "updatedAt" ~ '^\d{4}-\d{2}-\d{2}T';
  `)
}

async function refreshItineraryFavoriteTimestamp(favoriteId) {
  await db.execute(sql`
    UPDATE customer_itinerary_favorites
    SET "createdAtTimestamp" = "createdAt"::timestamptz
    WHERE id = ${favoriteId}
      AND "createdAt" ~ '^\d{4}-\d{2}-\d{2}T';
  `)
}

async function getCustomerPreCruiseChecklistRow(customerId) {
  const rows = await db.select().from(customerPreCruiseChecklistTable)
    .where(eq(customerPreCruiseChecklistTable.customerId, customerId)).limit(1)
  return rows[0] || null
}

async function getCustomerItineraryFavoriteRow(favoriteId) {
  const rows = await db.select().from(customerItineraryFavoriteTable)
    .where(eq(customerItineraryFavoriteTable.id, favoriteId)).limit(1)
  return rows[0] || null
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

    const updatedAt = new Date().toISOString()

    const customerUpdates = { firstName, lastName, email, phone, ...buildEntityUpdateTimestamp(updatedAt) }

    const updatedCustomers = await db.update(customerTable).set(customerUpdates).where(eq(customerTable.id, id)).returning()
    if (!updatedCustomers[0]) return res.status(404).json({ message: 'Customer not found' })

    await db
      .update(bookingPassengerTable)
      .set({ diningPreference, accessibilityNotes, updatedAt })
      .where(eq(bookingPassengerTable.customerId, id))

    await refreshPassengerPreferenceTimestamp(id)

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'PASSENGER_PROFILE_UPDATED',
      entityType: 'CUSTOMER',
      entityId: id,
      eventPayload: buildEntityHistoryPayload({
        previous: existingRows[0],
        next: { ...existingRows[0], ...customerUpdates },
        entityRefs: { customerId: id },
        metadata: { operation: 'passenger-profile-update', diningPreference, accessibilityNotes, updatedAt }
      })
    })

    return res.status(200).json({ message: 'Passenger profile updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.updatePassengerPreCruiseChecklist = async (req, res, next) => {
  try {
    const { id } = req.params
    const checklist = normalizePreCruiseChecklist(req.body)

    const existingRows = await db
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, id))
      .limit(1)

    if (!existingRows[0]) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const previousChecklistRow = await getCustomerPreCruiseChecklistRow(id)
    const updatedAt = new Date().toISOString()
    const checklistValues = buildChecklistStorageValues(checklist, updatedAt)
    const nextChecklistRow = { customerId: id, ...checklistValues }

    await db
      .insert(customerPreCruiseChecklistTable)
      .values(nextChecklistRow)
      .onConflictDoUpdate({
        target: customerPreCruiseChecklistTable.customerId,
        set: checklistValues
      })

    await refreshPreCruiseChecklistTimestamp(id)

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'PASSENGER_CHECKLIST_UPDATED',
      entityType: 'CUSTOMER_PRE_CRUISE_CHECKLIST',
      entityId: id,
      eventPayload: buildEntityHistoryPayload({
        previous: previousChecklistRow,
        next: nextChecklistRow,
        entityRefs: { customerId: id },
        metadata: {
          operation: previousChecklistRow ? 'passenger-checklist-update' : 'passenger-checklist-create',
          updatedAt
        }
      })
    })

    return res.status(200).json({
      message: 'Pre-cruise checklist updated successfully',
      preCruiseChecklist: checklistValues
    })
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

    const updatedAt = new Date().toISOString()

    const preferenceUpdates = { diningPreference, accessibilityNotes, updatedAt }
    const nextPassengerPreferences = { ...existingRows[0], ...preferenceUpdates }

    const updatedPassengers = await db.update(bookingPassengerTable).set(preferenceUpdates).where(eq(bookingPassengerTable.id, `${bookingId}-${customerId}`)).returning()
    if (!updatedPassengers[0]) return res.status(404).json({ message: 'Booking passenger not found' })

    const bookingRows = await db
      .select()
      .from(bookingTable)
      .where(eq(bookingTable.id, bookingId))
      .limit(1)

    await refreshBookingPassengerTimestamp(`${bookingId}-${customerId}`)

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'PASSENGER_BOOKING_PREFERENCES_UPDATED',
      entityType: 'BOOKING_PASSENGER',
      entityId: `${bookingId}-${customerId}`,
      ...(bookingRows[0] ? await getBookingAuditScope(bookingRows[0]) : {}),
      eventPayload: buildEntityHistoryPayload({
        previous: existingRows[0],
        next: nextPassengerPreferences,
        entityRefs: { bookingId, customerId },
        metadata: { operation: 'passenger-booking-preferences-update', updatedAt }
      })
    })

    return res.status(200).json({ message: 'Booking preferences updated successfully' })
  } catch (err) {
    next(err)
  }
}

exports.addItineraryFavorite = async (req, res, next) => {
  try {
    const { customerId, activityScheduleId } = req.body
    const id = `${customerId}-${activityScheduleId}`

    const previousFavoriteRow = await getCustomerItineraryFavoriteRow(id)
    const createdAt = previousFavoriteRow?.createdAt || new Date().toISOString()
    const nextFavoriteRow = { id, customerId, activityScheduleId, createdAt }

    await db
      .insert(customerItineraryFavoriteTable)
      .values(nextFavoriteRow)
      .onConflictDoNothing()

    await refreshItineraryFavoriteTimestamp(id)

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'PASSENGER_ITINERARY_FAVORITE_SAVED',
      entityType: 'CUSTOMER_ITINERARY_FAVORITE',
      entityId: id,
      ...(await getActivityAuditScope(activityScheduleId)),
      eventPayload: buildEntityHistoryPayload({
        previous: previousFavoriteRow,
        next: nextFavoriteRow,
        entityRefs: { customerId, activityScheduleId },
        metadata: {
          operation: previousFavoriteRow ? 'passenger-itinerary-favorite-already-saved' : 'passenger-itinerary-favorite-create',
          createdAt
        }
      })
    })

    return res.status(201).json({ message: 'Itinerary favorite saved successfully', id })
  } catch (err) {
    next(err)
  }
}

exports.deleteItineraryFavorite = async (req, res, next) => {
  try {
    const { customerId, activityScheduleId } = req.params

    const favoriteId = `${customerId}-${activityScheduleId}`

    const previousFavoriteRow = await getCustomerItineraryFavoriteRow(favoriteId)

    await db
      .delete(customerItineraryFavoriteTable)
      .where(eq(customerItineraryFavoriteTable.id, favoriteId))

    await recordCruiseManagementAuditEvent(req, {
      eventType: 'PASSENGER_ITINERARY_FAVORITE_REMOVED',
      entityType: 'CUSTOMER_ITINERARY_FAVORITE',
      entityId: favoriteId,
      ...(await getActivityAuditScope(activityScheduleId)),
      eventPayload: buildEntityHistoryPayload({
        previous: previousFavoriteRow,
        entityRefs: { customerId, activityScheduleId },
        metadata: {
          operation: previousFavoriteRow ? 'passenger-itinerary-favorite-delete' : 'passenger-itinerary-favorite-delete-missing'
        }
      })
    })

    return res.status(200).json({ message: 'Itinerary favorite removed successfully' })
  } catch (err) {
    next(err)
  }
}

