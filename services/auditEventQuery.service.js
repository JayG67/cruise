const AUDIT_EVENT_FILTER_FIELDS = Object.freeze([
  'eventType',
  'entityType',
  'entityId',
  'actorUserId',
  'cruiseLineId',
  'shipId',
  'sailingId',
  'operationId',
  'source'
])

function normalizeAuditEventFilters(query = {}) {
  query = query || {}
  return Object.fromEntries(
    AUDIT_EVENT_FILTER_FIELDS
      .map(field => [field, String(query[field] || '').trim()])
      .filter(([, value]) => value.length > 0)
  )
}

function normalizeAuditEventLimit(limit, defaultLimit = 50) {
  const parsedDefault = Number(defaultLimit)
  const boundedDefault = Number.isFinite(parsedDefault)
    ? Math.max(1, Math.min(100, Math.trunc(parsedDefault)))
    : 50
  const parsedLimit = Number(limit)
  if (!Number.isFinite(parsedLimit)) return boundedDefault
  return Math.max(1, Math.min(100, Math.trunc(parsedLimit)))
}

function buildAuditEventQueryContract(query = {}, { defaultLimit = 50 } = {}) {
  query = query || {}
  return {
    filters: normalizeAuditEventFilters(query),
    limit: normalizeAuditEventLimit(query.limit, defaultLimit)
  }
}

function buildAuditEventListResponse(auditEvents = [], contract = {}) {
  auditEvents = Array.isArray(auditEvents) ? auditEvents : []
  contract = contract || {}
  return {
    auditEvents,
    filters: contract.filters || {},
    limit: auditEvents.length,
    queryLimit: contract.limit ?? auditEvents.length
  }
}

module.exports = {
  AUDIT_EVENT_FILTER_FIELDS,
  buildAuditEventListResponse,
  buildAuditEventQueryContract,
  normalizeAuditEventFilters,
  normalizeAuditEventLimit
}
