const sailingTable = require('../models/sailing.model')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const db = require('../db')
const { AUTH_MODES, getAuthenticationMode } = require('../services/authentication.service')
const { isPublicDemoReadRequest } = require('../services/publicDemoReadPolicy.service')
const { eq } = require('drizzle-orm')
const {
  getBookingAuditScope,
  getSailingAuditScope,
  recordPlatformAuditEvent,
  resolvePlatformAuditActor
} = require('../services/platformAudit.service')
const {
  buildEntityHistoryPayload,
  buildEntityLifecycleTimestamps,
  buildEntityUpdateTimestamp
} = require('../services/entityHistory.service')
const { applyBookingPayloadProfile, getRequestedPayloadProfile } = require('../services/apiPayloadProfile.service')
const {
  buildBookingPassengerStorageValues,
  findBookingOverlapForPassengers,
  getBookingDetails,
  getBookingDetailsBatch,
  indexRowsBy,
  selectByIds
} = require('../services/bookingDomain.service')
const { validateBookingPassengerSet } = require('../services/bookingPassengerValidation.service')
const { filterBookingsForAdminTenant } = require('../services/customerTenantAccess.service')

async function recordCruiseManagementAuditEvent(req, event) {
  return recordPlatformAuditEvent(req, event)
}

exports.getBookings = async (req, res, next) => {
  try {
    const allBookings = await db.select().from(bookingTable)
    const bookings = getAuthenticationMode() === AUTH_MODES.DEMO || isPublicDemoReadRequest(req)
      ? allBookings
      : await filterBookingsForAdminTenant(req, allBookings)

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found' })
    }

    const bookingDetails = await getBookingDetailsBatch(bookings)
    return res.status(200).json(applyBookingPayloadProfile(bookingDetails, getRequestedPayloadProfile(req)))
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

    const principalRole = String(req?.requestIdentity?.principal?.role || '').trim().toUpperCase()
    const visibleBookingRows = getAuthenticationMode() === AUTH_MODES.JWT && principalRole === 'ADMIN'
      ? await filterBookingsForAdminTenant(req, bookingRows)
      : bookingRows

    if (visibleBookingRows.length === 0) {
      return res.status(404).json({ message: 'No bookings found for the specified customer' })
    }

    const bookingDetails = await getBookingDetailsBatch(visibleBookingRows)
    return res.status(200).json(applyBookingPayloadProfile(bookingDetails, getRequestedPayloadProfile(req)))
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

    const passengerSetError = validateBookingPassengerSet(passengers)

    if (passengerSetError) {
      return res.status(400).json({ message: passengerSetError })
    }

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

    const overlappingBooking = await findBookingOverlapForPassengers({
      sailing: sailingRows[0],
      passengers
    })

    if (overlappingBooking) {
      return res.status(400).json({
        message: `Passenger ${overlappingBooking.customerId} already has booking ${overlappingBooking.bookingId} overlapping this sailing`
      })
    }

    const platformActor = await resolvePlatformAuditActor(req)
    const bookingValues = {
      id,
      sailingId,
      bookingStatus,
      cabinNumber,
      fareCode,
      embarkationPort,
      debarkationPort,
      createdByCustomerId,
      createdByUserId: platformActor.actorUserId,
      ...buildEntityLifecycleTimestamps()
    }

    await db.transaction(async tx => {
      await tx.insert(bookingTable).values(bookingValues)

      for (const passenger of passengers) {
        await tx.insert(bookingPassengerTable).values(buildBookingPassengerStorageValues(id, passenger))
      }
    })

    const bookingScope = await getSailingAuditScope(sailingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: id,
      ...bookingScope,
      eventPayload: buildEntityHistoryPayload({
        next: bookingValues,
        entityRefs: { bookingId: id, sailingId, passengerCustomerIds: passengers.map(passenger => passenger.customerId) },
        metadata: { operation: 'create', passengerCount: passengers.length }
      })
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

    const passengerSetError = validateBookingPassengerSet(passengers)

    if (passengerSetError) {
      return res.status(400).json({ message: passengerSetError })
    }

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
      createdByCustomerId,
      ...buildEntityUpdateTimestamp()
    }

    const existingPassengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.bookingId, id))
    const existingPassengersById = indexRowsBy(existingPassengerRows, 'id')

    const updatedRows = await db.transaction(async tx => {
      const rows = await tx.update(bookingTable).set(bookingUpdates).where(eq(bookingTable.id, id)).returning()
      if (!rows[0]) return rows
      await tx.delete(bookingPassengerTable).where(eq(bookingPassengerTable.bookingId, id))
      for (const passenger of passengers) {
        const passengerId = `${id}-${passenger.customerId}`
        await tx.insert(bookingPassengerTable).values(
          buildBookingPassengerStorageValues(id, passenger, existingPassengersById.get(passengerId))
        )
      }
      return rows
    })
    if (!updatedRows[0]) return res.status(404).json({ message: 'Booking not found' })

    const bookingScope = await getSailingAuditScope(sailingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_UPDATED',
      entityType: 'BOOKING',
      entityId: id,
      ...bookingScope,
      eventPayload: buildEntityHistoryPayload({
        previous: existingRows[0],
        next: { ...existingRows[0], ...bookingUpdates },
        entityRefs: { bookingId: id, sailingId, passengerCustomerIds: passengers.map(passenger => passenger.customerId) },
        metadata: { operation: 'update', passengerCount: passengers.length }
      })
    })

    return res.status(200).json({ message: 'Booking updated successfully' })
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

    const deletedRows = await db.transaction(async tx => {
      await tx.delete(bookingPassengerTable).where(eq(bookingPassengerTable.bookingId, id))
      return tx.delete(bookingTable).where(eq(bookingTable.id, id)).returning()
    })
    if (!deletedRows[0]) return res.status(404).json({ message: 'Booking not found' })

    const bookingScope = await getBookingAuditScope(existingRows[0])
    await recordCruiseManagementAuditEvent(req, {
      eventType: 'BOOKING_DELETED',
      entityType: 'BOOKING',
      entityId: id,
      ...bookingScope,
      eventPayload: buildEntityHistoryPayload({ previous: existingRows[0], entityRefs: { bookingId: id }, metadata: { operation: 'delete' } })
    })

    return res.status(200).json({ message: 'Booking deleted successfully' })
  } catch (err) {
    next(err)
  }
}
