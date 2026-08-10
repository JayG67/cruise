const { AUTH_MODES, getAuthenticationMode } = require('../services/authentication.service')
const { requireAdminRequest } = require('../services/requestAuthorization.service')

/**
 * Transitional administrator-write boundary.
 *
 * Demo mode intentionally preserves the portfolio application's existing
 * identity-switching workflow and must never be used with production data.
 * Production is forced into JWT mode by authentication.service, where every
 * protected mutation must resolve to a verified ADMIN principal.
 */
async function requireAdminMutation(req, res, next) {
  if (getAuthenticationMode() === AUTH_MODES.DEMO) {
    return next()
  }

  if (!(await requireAdminRequest(req, res))) return undefined
  return next()
}

module.exports = {
  requireAdminMutation
}
