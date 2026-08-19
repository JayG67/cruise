const {
  AUDIT_EVENT_FILTER_FIELDS,
  buildAuditEventListResponse,
  buildAuditEventQueryContract,
  normalizeAuditEventFilters,
  normalizeAuditEventLimit
} = require('../../services/auditEventQuery.service')

describe('audit event query contract bridge', () => {
  it('keeps the production audit filter allowlist centralized and stable', () => {
    expect(AUDIT_EVENT_FILTER_FIELDS).toEqual([
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
  })

  it('normalizes audit event filters without passing unknown query values to the data layer', () => {
    expect(normalizeAuditEventFilters({
      entityType: ' CUSTOMER ',
      source: ' PASSENGER_SELF_SERVICE ',
      unexpectedTenantBypass: 'nope',
      operationId: ''
    })).toEqual({
      entityType: 'CUSTOMER',
      source: 'PASSENGER_SELF_SERVICE'
    })
  })

  it('bounds audit event query limits before controller and service usage', () => {
    expect(normalizeAuditEventLimit('abc', 50)).toBe(50)
    expect(normalizeAuditEventLimit('-20', 50)).toBe(1)
    expect(normalizeAuditEventLimit('500', 50)).toBe(100)
    expect(normalizeAuditEventLimit('12.9', 50)).toBe(12)
  })

  it('builds one reusable audit event query contract for platform history endpoints', () => {
    expect(buildAuditEventQueryContract({ entityId: ' B0001 ', limit: '25' })).toEqual({
      filters: { entityId: 'B0001' },
      limit: 25
    })
  })

  it('keeps response metadata backward compatible while exposing the requested limit', () => {
    const auditEvents = [{ id: 'audit-1' }, { id: 'audit-2' }]
    expect(buildAuditEventListResponse(auditEvents, { filters: { entityType: 'BOOKING' }, limit: 50 })).toEqual({
      auditEvents,
      filters: { entityType: 'BOOKING' },
      limit: 2,
      queryLimit: 50
    })
  })
})

describe('audit event query malformed input hardening', () => {
  it('treats explicit null query input as an empty bounded query contract', () => {
    expect(normalizeAuditEventFilters(null)).toEqual({})
    expect(buildAuditEventQueryContract(null)).toEqual({ filters: {}, limit: 50 })
  })

  it('bounds custom defaults and falls back safely when the custom default is malformed', () => {
    expect(normalizeAuditEventLimit(undefined, 0)).toBe(1)
    expect(normalizeAuditEventLimit(undefined, 500)).toBe(100)
    expect(normalizeAuditEventLimit(undefined, 'invalid')).toBe(50)
  })

  it('builds a safe empty response for null audit collections and preserves explicit query metadata', () => {
    expect(buildAuditEventListResponse(null, { filters: { entityType: 'BOOKING' }, limit: 0 })).toEqual({
      auditEvents: [],
      filters: { entityType: 'BOOKING' },
      limit: 0,
      queryLimit: 0
    })

    expect(buildAuditEventListResponse(undefined, null)).toEqual({
      auditEvents: [],
      filters: {},
      limit: 0,
      queryLimit: 0
    })
  })
})
