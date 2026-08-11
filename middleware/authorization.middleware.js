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
const {
  TURNAROUND_ACCESS_FORBIDDEN_MESSAGE,
  TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE,
  canManageEscalation,
  canReadTurnaroundOperations,
  canAccessOperationScope,
  canManageHandoff,
  canManageOperation,
  canManageOperationDepartment,
  canManageTask
} = require('../services/turnaroundAccess.service')

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


async function requireTurnaroundReadAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await canReadTurnaroundOperations(req))) {
    return res.status(403).json({ message: TURNAROUND_ACCESS_FORBIDDEN_MESSAGE })
  }
  return next()
}

function requireTurnaroundOperationReadAccess(paramName = 'id') {
  return async function turnaroundOperationReadAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessOperationScope(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TURNAROUND_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

async function requireTurnaroundCommandAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await canManageOperation(req, req.params?.id))) {
    return res.status(403).json({ message: TURNAROUND_ACCESS_FORBIDDEN_MESSAGE })
  }
  return next()
}

function requireTurnaroundDepartmentAccess(operationParam = 'id', departmentSource = 'departmentRole') {
  return async function turnaroundDepartmentAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    const operationId = req.params?.[operationParam]
    const departmentRole = req.params?.[departmentSource] || req.body?.[departmentSource]
    if (!(await canManageOperationDepartment(req, operationId, departmentRole))) {
      return res.status(403).json({ message: TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

async function requireTurnaroundTaskAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await canManageTask(req, req.params?.id))) {
    return res.status(403).json({ message: TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE })
  }
  return next()
}

async function requireTurnaroundEscalationAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await canManageEscalation(req, req.params?.id))) {
    return res.status(403).json({ message: TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE })
  }
  return next()
}

async function requireTurnaroundHandoffAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await canManageHandoff(req, req.params?.id))) {
    return res.status(403).json({ message: TURNAROUND_DEPARTMENT_FORBIDDEN_MESSAGE })
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
  requireFavoriteCustomerAccess,
  requireTurnaroundCommandAccess,
  requireTurnaroundDepartmentAccess,
  requireTurnaroundEscalationAccess,
  requireTurnaroundHandoffAccess,
  requireTurnaroundOperationReadAccess,
  requireTurnaroundReadAccess,
  requireTurnaroundTaskAccess
}
