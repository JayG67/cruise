const { AUTH_MODES, getAuthenticationMode } = require('../services/authentication.service')
const { isAdminRole, requireAdminRequest } = require('../services/requestAuthorization.service')
const {
  BOOKING_ACCESS_FORBIDDEN_MESSAGE,
  BOOKING_CREATE_FORBIDDEN_MESSAGE,
  CUSTOMER_ACCESS_FORBIDDEN_MESSAGE,
  canAccessBooking,
  canAccessCustomer,
  canAccessCustomerActivity,
  canCreateBooking
} = require('../services/customerAccess.service')
const {
  canAdminAccessBookingTenant,
  canAdminAccessCustomerTenant
} = require('../services/customerTenantAccess.service')
const {
  GLOBAL_ADMIN_REQUIRED_MESSAGE,
  TENANT_ACCESS_FORBIDDEN_MESSAGE,
  canAccessActivityTenant,
  canAccessCruiseLineTenant,
  canAccessItineraryDayTenant,
  canAccessSailingTenant,
  canAccessShipTenant,
  canCreateCruiseLineTenant,
  constrainAuditFiltersToTenant,
  resolvePrincipalTenantScope
} = require('../services/tenantAccess.service')
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
  const activityScheduleId = req.params?.activityScheduleId || req.body?.activityScheduleId
  if (!(await canAccessCustomer(req, customerId))) {
    return res.status(403).json({ message: CUSTOMER_ACCESS_FORBIDDEN_MESSAGE })
  }
  if (activityScheduleId && !(await canAccessCustomerActivity(req, customerId, activityScheduleId))) {
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




async function requireDemoReadAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  return res.status(404).json({ message: 'Not found' })
}

async function requireBookingCreationTenantAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  const principal = req?.requestIdentity?.principal || null
  if (!isAdminRole(principal?.role)) return next()
  if (!req.body?.sailingId) return next()
  if (!(await canAccessSailingTenant(req, req.body.sailingId))) {
    return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
  }
  return next()
}


async function requireBookingDestinationTenantAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!req.body?.sailingId) return next()
  if (!(await canAccessSailingTenant(req, req.body.sailingId))) {
    return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
  }
  return next()
}

function requireCustomerTenantAdminAccess(paramName = 'id') {
  return async function customerTenantAdminAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAdminAccessCustomerTenant(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

function requireBookingTenantAdminAccess(paramName = 'id') {
  return async function bookingTenantAdminAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAdminAccessBookingTenant(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
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

async function requireTenantAuditAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  const tenantScope = await resolvePrincipalTenantScope(req)
  const auditFilters = constrainAuditFiltersToTenant(req.query || {}, tenantScope)
  if (!auditFilters) {
    return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
  }
  req.tenantAuditFilters = auditFilters
  return next()
}

async function requireGlobalAdminAccess(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
  if (!(await requireAdminRequest(req, res))) return undefined
  if (!(await canCreateCruiseLineTenant(req))) {
    return res.status(403).json({ message: GLOBAL_ADMIN_REQUIRED_MESSAGE })
  }
  return next()
}

async function requireGlobalAdminMutation(req, res, next) {
  return requireGlobalAdminAccess(req, res, next)
}

function requireCruiseLineTenantAccess(paramName = 'id') {
  return async function cruiseLineTenantAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    const cruiseLineId = req.params?.[paramName] || req.body?.[paramName]
    if (!(await canAccessCruiseLineTenant(req, cruiseLineId))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

function requireShipTenantAccess(paramName = 'id') {
  return async function shipTenantAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessShipTenant(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

function requireSailingTenantAccess(paramName = 'id') {
  return async function sailingTenantAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessSailingTenant(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

function requireItineraryDayTenantAccess(paramName = 'id') {
  return async function itineraryDayTenantAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessItineraryDayTenant(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

function requireActivityTenantAccess(paramName = 'id') {
  return async function activityTenantAccessMiddleware(req, res, next) {
    if (getAuthenticationMode() === AUTH_MODES.DEMO) return next()
    if (!(await canAccessActivityTenant(req, req.params?.[paramName]))) {
      return res.status(403).json({ message: TENANT_ACCESS_FORBIDDEN_MESSAGE })
    }
    return next()
  }
}

module.exports = {
  requireActivityTenantAccess,
  requireAdminAccess,
  requireAdminMutation,
  requireBookingAccess,
  requireBookingCreationAccess,
  requireBookingCreationTenantAccess,
  requireBookingDestinationTenantAccess,
  requireBookingPassengerAccess,
  requireBookingTenantAdminAccess,
  requireCustomerAccess,
  requireCustomerTenantAdminAccess,
  requireDemoReadAccess,
  requireFavoriteCustomerAccess,
  requireGlobalAdminAccess,
  requireGlobalAdminMutation,
  requireCruiseLineTenantAccess,
  requireItineraryDayTenantAccess,
  requireSailingTenantAccess,
  requireShipTenantAccess,
  requireTenantAuditAccess,
  requireTurnaroundCommandAccess,
  requireTurnaroundDepartmentAccess,
  requireTurnaroundEscalationAccess,
  requireTurnaroundHandoffAccess,
  requireTurnaroundOperationReadAccess,
  requireTurnaroundReadAccess,
  requireTurnaroundTaskAccess
}
