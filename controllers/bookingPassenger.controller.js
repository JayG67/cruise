const sailingTable = require('../models/sailing.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const db = require('../db')
const { and, eq } = require('drizzle-orm')
const {
  getBookingAuditScope,
  recordPlatformAuditEvent
} = require('../services/platformAudit.service')
const { buildEntityHistoryPayload } = require('../services/entityHistory.service')
const {
  buildBookingPassengerStorageValues,
  findBookingOverlapForPassengers
} = require('../services/bookingDomain.service')

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
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

    const passengerValues = buildBookingPassengerStorageValues(bookingId, {
      customerId,
      passengerRole,
      isPrimaryGuest,
      diningPreference,
      accessibilityNotes,
      boardingGroup
    })
    await db.insert(bookingPassengerTable).values(passengerValues)

    const bookingScope = await getBookingAuditScope(bookingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_PASSENGER_ADDED',
      entityType: 'BOOKING_PASSENGER',
      entityId: `${bookingId}-${customerId}`,
      ...bookingScope,
      eventPayload: buildEntityHistoryPayload({ next: passengerValues, entityRefs: { bookingId, customerId }, metadata: { operation: 'add-passenger' } })
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
      .where(and(
        eq(bookingPassengerTable.bookingId, bookingId),
        eq(bookingPassengerTable.customerId, customerId)
      ))
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
      .where(and(
        eq(bookingPassengerTable.bookingId, bookingId),
        eq(bookingPassengerTable.customerId, customerId)
      ))

    const bookingScope = await getBookingAuditScope(bookingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_PASSENGER_REMOVED',
      entityType: 'BOOKING_PASSENGER',
      entityId: `${bookingId}-${customerId}`,
      ...bookingScope,
      eventPayload: buildEntityHistoryPayload({ previous: passengerRows[0], entityRefs: { bookingId, customerId }, metadata: { operation: 'remove-passenger' } })
    })

    return res.status(200).json({ message: 'Booking passenger deleted successfully' })
  } catch (err) {
    next(err)
  }
}
