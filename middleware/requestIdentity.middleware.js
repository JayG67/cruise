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

function buildRequestIdentity(req = {}) {
  const headerDemoUserId = String(readHeader(req, 'X-Cruise-Demo-User-Id') || '').trim()
  const queryDemoUserId = String(req?.query?.demoUserId || '').trim()
  const demoUserId = headerDemoUserId || queryDemoUserId || null

  return {
    demoUserId,
    identitySource: headerDemoUserId ? 'header' : queryDemoUserId ? 'query' : 'anonymous',
    isDemoIdentity: Boolean(demoUserId)
  }
}

function attachRequestIdentity(req, res, next) {
  req.requestIdentity = buildRequestIdentity(req)
  next()
}

module.exports = {
  attachRequestIdentity,
  buildRequestIdentity,
  getScopedDemoUserId
}
