const { AUTH_MODES, getAuthenticationMode } = require('../services/authentication.service')
const { requireAdminRequest } = require('../services/requestAuthorization.service')
const {
  BOOKING_ACCESS_FORBIDDEN_MESSAGE,
  BOOKING_CREATE_FORBIDDEN_MESSAGE,
  CUSTOMER_ACCESS_FORBIDDEN_MESSAGE,
  canAccessBooking,
  canAccessCustomer,
  canCreateBooking
} = require('../services/customerAccess.service')

async function requireAdminAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await requireAdminRequest(req, res))) return undefined
  return next()
}

async function requireAdminMutation(req, res, next) {
  return requireAdminAccess(req, res, next)
}

function requireCustomerAccess(paramName = 'id') {
  return async function customerAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessCustomer(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: CUSTOMER_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

function requireBookingAccess(paramName = 'id') {
  return async function bookingAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessBooking(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: BOOKING_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

async function requireBookingPassengerAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  const ownsCustomer = await canAccessCustomer(req, req.params?.customerId)
  const ownsBooking = ownsCustomer && await canAccessBooking(req, req.params?.bookingId)
  if (!ownsBooking) {
    return res.status(403).json({ message: BOOKING_ACCESS_FORBIDDEN_MESSAGE })
  }
  return next()
}

async function requireFavoriteCustomerAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  const customerId = req.params?.customerId || req.body?.customerId
  if (!(await canAccessCustomer(req, customerId))) {
    return res.status(403).json({ message: CUSTOMER_ACCESS_FORBIDDEN_MESSAGE })
  }
  return next()
}

async function requireBookingCreationAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await canCreateBooking(req, req.body))) {
    return res.status(403).json({ message: BOOKING_CREATE_FORBIDDEN_MESSAGE })
  }
  return next()
}

module.exports = {
  requireAdminAccess,
  requireAdminMutation,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingPassengerAccess,
  requireCustomerAccess,
  requireFavoriteCustomerAccess
}
