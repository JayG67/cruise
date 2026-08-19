const fleetController = require('./fleet.controller')
const sailingController = require('./sailing.controller')
const customerController = require('./customer.controller')
const bookingController = require('./booking.controller')
const platformAdministrationController = require('./platformAdministration.controller')
const { createTurnaroundMutationController } = require('./turnaroundMutation.controller')
const customerTable = require('../models/customer.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const demoUserTable = require('../models/demoUser.model')
const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const db = require('../db')
const loadCruiseData = require('../services/loadCruiseData.service')
const { isDemoDataEnabled } = require('../services/demoDataPolicy.service')
const { listAuditEventsForOperation } = require('../services/auditEvent.service')
const {
  canAccessTurnaroundOperationForRequest,
  getTurnaroundOperationsForRequest,
  sendTurnaroundOperationForbidden
} = require('../services/turnaroundScope.service')
const { getBookingDetails } = require('../services/bookingDomain.service')
const { getTurnaroundOperationDetails } = require('../services/turnaroundOperationDetails.service')
const { eq } = require('drizzle-orm')






exports.getTurnaroundOperations = async (req, res, next) => {
  try {
    let operations = await getTurnaroundOperationsForRequest(req)

    if ((!operations || operations.length === 0) && isDemoDataEnabled()) {
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


const turnaroundMutationController = createTurnaroundMutationController({
  getTurnaroundOperationDetails
})

exports.getDemoUsers = async (req, res, next) => {
  try {
    const demoUsers = await db.select().from(demoUserTable)

    if (!demoUsers || demoUsers.length === 0) {
      return res.status(404).json({ message: 'No assigned people found' })
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
      return res.status(404).json({ message: 'Assigned person not found' })
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
    const seenBookingIds = new Set()

    for (const passengerRow of passengerRows || []) {
      if (!passengerRow?.bookingId || seenBookingIds.has(passengerRow.bookingId)) {
        continue
      }
      seenBookingIds.add(passengerRow.bookingId)
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
        const passengers = booking?.passengers || []
        passengers.forEach(passenger => {
          if (passenger?.customerId) accessibleCustomerIds.add(passenger.customerId)
        })
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


Object.assign(exports, fleetController, sailingController, customerController, bookingController, platformAdministrationController, turnaroundMutationController)
