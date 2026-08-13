const {
  AUTH_MODES,
  buildJwtPrincipal,
  getAuthenticationMode,
  isDemoAuthenticationEnabled
} = require('../services/authentication.service')

function readHeader(req, name) {
  if (!req || !req.headers) return ''
  if (typeof req.get === 'function') return req.get(name) || ''
  return req.headers[String(name).toLowerCase()] || ''
}

function getScopedDemoUserId(req) {
  if (!isDemoAuthenticationEnabled()) return ''
  const attachedDemoUserId = String(req?.requestIdentity?.demoUserId || '').trim()
  const headerDemoUserId = String(readHeader(req, 'X-Cruise-Demo-User-Id') || '').trim()
  const queryDemoUserId = String(req?.query?.demoUserId || '').trim()
  return attachedDemoUserId || headerDemoUserId || queryDemoUserId || ''
}

function buildTestPrincipal(req = {}) {
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'test') return null
  const userId = String(readHeader(req, 'X-Cruise-User-Id') || '').trim()
  if (!userId) return null

  const email = String(readHeader(req, 'X-Cruise-User-Email') || '').trim()
  const displayName = String(readHeader(req, 'X-Cruise-User-Name') || '').trim()
  const role = String(readHeader(req, 'X-Cruise-User-Role') || '').trim()
  const tenantId = String(readHeader(req, 'X-Cruise-Tenant-Id') || '').trim()
  return {
    userId,
    email: email || null,
    displayName: displayName || email || userId,
    role: role || null,
    tenantId: tenantId || null,
    identitySource: 'test-header'
  }
}

function buildProductionPrincipal(req = {}) {
  return buildJwtPrincipal(req) || buildTestPrincipal(req)
}

function buildRequestIdentity(req = {}) {
  const authMode = getAuthenticationMode()
  const demoEnabled = authMode === AUTH_MODES.DEMO
  const headerDemoUserId = demoEnabled ? String(readHeader(req, 'X-Cruise-Demo-User-Id') || '').trim() : ''
  const queryDemoUserId = demoEnabled ? String(req?.query?.demoUserId || '').trim() : ''
  const demoUserId = headerDemoUserId || queryDemoUserId || null

  try {
    const principal = buildProductionPrincipal(req)
    return {
      authMode,
      demoUserId,
      principal,
      identitySource: principal?.identitySource || (headerDemoUserId ? 'demo-header' : queryDemoUserId ? 'demo-query' : 'anonymous'),
      isDemoIdentity: Boolean(demoUserId),
      isAuthenticated: Boolean(principal || demoUserId),
      authenticationError: null
    }
  } catch (error) {
    return {
      authMode,
      demoUserId: null,
      principal: null,
      identitySource: 'anonymous',
      isDemoIdentity: false,
      isAuthenticated: false,
      authenticationError: {
        code: error.code || 'AUTH_TOKEN_INVALID',
        message: 'Authentication credentials were rejected.'
      }
    }
  }
}

function attachRequestIdentity(req, res, next) {
  req.requestIdentity = buildRequestIdentity(req)
  next()
}

module.exports = {
  attachRequestIdentity,
  buildProductionPrincipal,
  buildRequestIdentity,
  buildTestPrincipal,
  getScopedDemoUserId
}
