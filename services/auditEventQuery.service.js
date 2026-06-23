const AUDIT_EVENT_FILTER_FIELDS = Object.freeze([
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
  return Object.fromEntries(
    AUDIT_EVENT_FILTER_FIELDS
      .map(field => [field, String(query[field] || '').trim()])
      .filter(([, value]) => value.length > 0)
  )
}

function normalizeAuditEventLimit(limit, defaultLimit = 50) {
  const parsedLimit = Number(limit)
  if (!Number.isFinite(parsedLimit)) return defaultLimit
  return Math.max(1, Math.min(100, Math.trunc(parsedLimit)))
}

function buildAuditEventQueryContract(query = {}, { defaultLimit = 50 } = {}) {
  return {
    filters: normalizeAuditEventFilters(query),
    limit: normalizeAuditEventLimit(query.limit, defaultLimit)
  }
}

function buildAuditEventListResponse(auditEvents = [], contract = {}) {
  return {
    auditEvents,
    filters: contract.filters || {},
    limit: auditEvents.length,
    queryLimit: contract.limit || auditEvents.length
  }
}

module.exports = {
  AUDIT_EVENT_FILTER_FIELDS,
  buildAuditEventListResponse,
  buildAuditEventQueryContract,
  normalizeAuditEventFilters,
  normalizeAuditEventLimit
}
