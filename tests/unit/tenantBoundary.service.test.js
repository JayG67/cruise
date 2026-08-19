const {
  assertTenantBoundary,
  buildTenantBoundary,
  buildTenantBoundaryReport,
  filterRowsByTenantBoundary,
  hasTenantBoundary,
  isTenantBoundaryCompatible,
  normalizeTenantId,
  tenantBoundaryFromEntity,
  tenantBoundaryFromRequest
} = require('../../services/tenantBoundary.service')

describe('tenantBoundary.service', () => {
  it('normalizes tenant boundary fields without inventing missing scope', () => {
    expect(normalizeTenantId('  royal-caribbean  ')).toBe('royal-caribbean')
    expect(normalizeTenantId('')).toBeNull()
    expect(buildTenantBoundary({ cruiseLineId: 'line-1', shipId: '', sailingId: null })).toEqual({ cruiseLineId: 'line-1' })
    expect(hasTenantBoundary({})).toBe(false)
    expect(hasTenantBoundary({ cruiseLineId: 'line-1' })).toBe(true)
  })

  it('derives boundaries from entity fields, API identity tenant scope, and relationship metadata', () => {
    const entity = {
      id: 'B000000001',
      sailingId: 'sailing-1',
      apiIdentity: {
        tenantScope: {
          cruiseLineId: 'line-1',
          shipId: 'ship-1'
        },
        relationships: {
          bookingId: 'B000000001',
          createdByCustomerId: 'C000000001'
        }
      }
    }

    expect(tenantBoundaryFromEntity(entity)).toEqual({
      cruiseLineId: 'line-1',
      shipId: 'ship-1',
      sailingId: 'sailing-1',
      customerId: 'C000000001',
      bookingId: 'B000000001'
    })
  })

  it('derives request boundaries from params, query values, and the future production tenant header', () => {
    expect(tenantBoundaryFromRequest({
      params: { shipId: 'ship-1', operationId: 'operation-1' },
      query: { sailingId: 'sailing-1' },
      headers: { 'x-cruise-tenant-id': 'line-1' }
    })).toEqual({
      cruiseLineId: 'line-1',
      shipId: 'ship-1',
      sailingId: 'sailing-1',
      operationId: 'operation-1'
    })
  })

  it('does not misclassify a generic route id as a customer tenant boundary', () => {
    expect(tenantBoundaryFromRequest({
      params: { id: 'ship-or-booking-id' },
      query: {},
      headers: {}
    })).toEqual({})

    expect(tenantBoundaryFromRequest({
      params: { customerId: 'customer-1' },
      query: {},
      headers: { 'X-Cruise-Tenant-Id': 'line-1' }
    })).toEqual({ cruiseLineId: 'line-1', customerId: 'customer-1' })
  })

  it('fails closed when candidate tenant scope is missing or conflicting', () => {
    expect(isTenantBoundaryCompatible({ cruiseLineId: 'line-1' }, { cruiseLineId: 'line-1' })).toBe(true)
    expect(isTenantBoundaryCompatible({}, { cruiseLineId: 'line-1' })).toBe(false)
    expect(isTenantBoundaryCompatible({ cruiseLineId: 'line-2' }, { cruiseLineId: 'line-1' })).toBe(false)
  })

  it('filters scoped rows and drops legacy rows that lack required tenant metadata', () => {
    const rows = [
      { id: 'ship-1', cruiseLineId: 'line-1' },
      { id: 'ship-2', cruiseLineId: 'line-2' },
      { id: 'legacy-row-without-scope' }
    ]

    expect(filterRowsByTenantBoundary(rows, { cruiseLineId: 'line-1' }).map(row => row.id)).toEqual([
      'ship-1'
    ])
    expect(filterRowsByTenantBoundary(rows, {}).map(row => row.id)).toEqual(['ship-1', 'ship-2', 'legacy-row-without-scope'])
  })

  it('reports and throws tenant boundary mismatches with enough detail for API callers', () => {
    const report = buildTenantBoundaryReport({ cruiseLineId: 'line-2', shipId: 'ship-9' }, { cruiseLineId: 'line-1', shipId: 'ship-9' })

    expect(report.compatible).toBe(false)
    expect(report.mismatchedKeys).toEqual(['cruiseLineId'])
    expect(() => assertTenantBoundary({ cruiseLineId: 'line-2' }, { cruiseLineId: 'line-1' })).toThrow('Tenant boundary mismatch')
    expect(assertTenantBoundary({ cruiseLineId: 'line-1' }, { cruiseLineId: 'line-1' })).toEqual(expect.objectContaining({ compatible: true }))
  })
})

describe('tenant boundary precedence hardening', () => {
  it('skips blank higher-priority entity ids instead of suppressing authoritative relationship scope', () => {
    expect(tenantBoundaryFromEntity({
      cruiseLineId: '   ',
      shipId: '\t',
      sailingId: '',
      operationId: ' ',
      customerId: '\n',
      bookingId: ' ',
      apiIdentity: {
        tenantScope: { cruiseLineId: 'line-scope', shipId: 'ship-scope', bookingId: 'booking-scope' },
        relationships: { sailingId: 'sailing-rel', operationId: 'operation-rel', customerId: 'customer-rel' }
      }
    })).toEqual({
      cruiseLineId: 'line-scope',
      shipId: 'ship-scope',
      sailingId: 'sailing-rel',
      operationId: 'operation-rel',
      customerId: 'customer-rel',
      bookingId: 'booking-scope'
    })
  })

  it('skips blank params and falls back to query or tenant headers', () => {
    expect(tenantBoundaryFromRequest({
      params: { cruiseLineId: ' ', shipId: '\t', sailingId: '', operationId: ' ', customerId: '', bookingId: '\n' },
      query: { cruiseLineId: 'query-line', shipId: 'query-ship', sailingId: 'query-sailing', operationId: 'query-operation', customerId: 'query-customer', bookingId: 'query-booking' },
      headers: { 'x-cruise-tenant-id': 'header-line' }
    })).toEqual({
      cruiseLineId: 'query-line',
      shipId: 'query-ship',
      sailingId: 'query-sailing',
      operationId: 'query-operation',
      customerId: 'query-customer',
      bookingId: 'query-booking'
    })
  })

  it('covers empty/default boundary inputs without manufacturing scope', () => {
    expect(buildTenantBoundary()).toEqual({})
    expect(tenantBoundaryFromEntity()).toEqual({})
    expect(tenantBoundaryFromEntity(null)).toEqual({})
    expect(tenantBoundaryFromRequest()).toEqual({})
    expect(filterRowsByTenantBoundary('not-an-array', { cruiseLineId: 'line-1' })).toEqual([])
    expect(buildTenantBoundaryReport()).toEqual(expect.objectContaining({ compatible: true, checkedKeys: [] }))
  })

  it('rejects malformed object and array tenant identifiers instead of manufacturing string scope', () => {
    expect(normalizeTenantId({ id: 'line-1' })).toBeNull()
    expect(normalizeTenantId(['line-1'])).toBeNull()
    expect(normalizeTenantId(Infinity)).toBeNull()
    expect(normalizeTenantId(42)).toBe('42')

    expect(tenantBoundaryFromRequest({
      params: { cruiseLineId: { id: 'bad' } },
      query: { cruiseLineId: 'line-1' },
      headers: {}
    })).toEqual({ cruiseLineId: 'line-1' })

    expect(hasTenantBoundary(['line-1'])).toBe(false)
  })

})
