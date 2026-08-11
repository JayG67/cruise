const { and, eq } = require('drizzle-orm')

const db = require('../db')
const appUserTable = require('../models/appUser.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const demoUserTable = require('../models/demoUser.model')
const { getAuthenticationMode, AUTH_MODES } = require('./authentication.service')
const { isAdminRole } = require('./requestAuthorization.service')
const { canAdminAccessBookingTenant, canAdminAccessCustomerTenant } = require('./customerTenantAccess.service')

const CUSTOMER_ACCESS_FORBIDDEN_MESSAGE = 'You do not have access to this customer record.'
const BOOKING_ACCESS_FORBIDDEN_MESSAGE = 'You do not have access to this booking record.'
const BOOKING_CREATE_FORBIDDEN_MESSAGE = 'Bookings must be created for the authenticated customer.'

async function selectFirst(table, predicate) {
  const rows = await db.select().from(table).where(predicate).limit(1)
  return rows[0] || null
}

async function resolveRequestCustomerScope(req = {}) {
  const principal = req?.requestIdentity?.principal || null
  if (principal?.userId) {
    if (isAdminRole(principal.role)) {
      return {
        authMode: AUTH_MODES.JWT,
        isAdmin: true,
        userId: principal.userId,
        customerId: null,
        role: principal.role || null
      }
    }

    const appUser = await selectFirst(appUserTable, eq(appUserTable.id, principal.userId))
    return {
      authMode: AUTH_MODES.JWT,
      isAdmin: false,
      userId: principal.userId,
      customerId: appUser?.primaryCustomerId || null,
      role: principal.role || appUser?.userType || null
    }
  }

  if (getAuthenticationMode() === AUTH_MODES.DEMO) {
    const demoUserId = String(req?.requestIdentity?.demoUserId || '').trim()
    if (!demoUserId) {
      return { authMode: AUTH_MODES.DEMO, isAdmin: false, userId: null, customerId: null, role: null }
    }

    const demoUser = await selectFirst(demoUserTable, eq(demoUserTable.id, demoUserId))
    return {
      authMode: AUTH_MODES.DEMO,
      isAdmin: isAdminRole(demoUser?.role),
      userId: demoUser?.normalizedUserId || demoUser?.id || null,
      customerId: demoUser?.customerId || null,
      role: demoUser?.role || null
    }
  }

  return { authMode: AUTH_MODES.JWT, isAdmin: false, userId: null, customerId: null, role: null }
}

async function canAccessCustomer(req, customerId) {
  const scope = await resolveRequestCustomerScope(req)
  if (scope.isAdmin) return canAdminAccessCustomerTenant(req, customerId)
  return Boolean(scope.customerId && scope.customerId === String(customerId || '').trim())
}

async function canAccessBooking(req, bookingId) {
  const scope = await resolveRequestCustomerScope(req)
  if (scope.isAdmin) return canAdminAccessBookingTenant(req, bookingId)
  if (!scope.customerId || !bookingId) return false

  const booking = await selectFirst(bookingTable, eq(bookingTable.id, bookingId))
  if (!booking) return false
  if (booking.createdByCustomerId === scope.customerId || booking.createdByUserId === scope.userId) return true

  const passenger = await selectFirst(
    bookingPassengerTable,
    and(
      eq(bookingPassengerTable.bookingId, bookingId),
      eq(bookingPassengerTable.customerId, scope.customerId)
    )
  )
  return Boolean(passenger)
}

async function canCreateBooking(req, payload = {}) {
  const scope = await resolveRequestCustomerScope(req)
  if (scope.isAdmin) return true
  if (!scope.customerId) return false
  if (String(payload.createdByCustomerId || '').trim() !== scope.customerId) return false

  const passengers = Array.isArray(payload.passengers) ? payload.passengers : []
  if (passengers.length === 0) return false

  return passengers.every(passenger => String(passenger?.customerId || '').trim() === scope.customerId)
}

module.exports = {
  BOOKING_ACCESS_FORBIDDEN_MESSAGE,
  BOOKING_CREATE_FORBIDDEN_MESSAGE,
  CUSTOMER_ACCESS_FORBIDDEN_MESSAGE,
  canAccessBooking,
  canAccessCustomer,
  canCreateBooking,
  resolveRequestCustomerScope
}
