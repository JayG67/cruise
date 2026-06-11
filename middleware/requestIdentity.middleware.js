function readHeader(req, name) {
  if (!req || !req.headers) return ''
  if (typeof req.get === 'function') return req.get(name) || ''
  return req.headers[String(name).toLowerCase()] || ''
}

function getScopedDemoUserId(req) {
  const attachedDemoUserId = String(req?.requestIdentity?.demoUserId || '').trim()
  const headerDemoUserId = String(readHeader(req, 'X-Cruise-Demo-User-Id') || '').trim()
  const queryDemoUserId = String(req?.query?.demoUserId || '').trim()

  return attachedDemoUserId || headerDemoUserId || queryDemoUserId || ''
}

function buildProductionPrincipal(req = {}) {
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
    identitySource: 'principal-header'
  }
}

function buildRequestIdentity(req = {}) {
  const headerDemoUserId = String(readHeader(req, 'X-Cruise-Demo-User-Id') || '').trim()
  const queryDemoUserId = String(req?.query?.demoUserId || '').trim()
  const demoUserId = headerDemoUserId || queryDemoUserId || null
  const principal = buildProductionPrincipal(req)

  return {
    demoUserId,
    principal,
    identitySource: principal ? 'principal-header' : headerDemoUserId ? 'header' : queryDemoUserId ? 'query' : 'anonymous',
    isDemoIdentity: Boolean(demoUserId),
    isAuthenticated: Boolean(principal || demoUserId)
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
  getScopedDemoUserId
}
