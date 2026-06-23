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

  it('treats missing candidate scope as backward-compatible but rejects conflicting known tenant values', () => {
    expect(isTenantBoundaryCompatible({ cruiseLineId: 'line-1' }, { cruiseLineId: 'line-1' })).toBe(true)
    expect(isTenantBoundaryCompatible({}, { cruiseLineId: 'line-1' })).toBe(true)
    expect(isTenantBoundaryCompatible({ cruiseLineId: 'line-2' }, { cruiseLineId: 'line-1' })).toBe(false)
  })

  it('filters scoped rows without dropping legacy rows that have not yet gained tenant metadata', () => {
    const rows = [
      { id: 'ship-1', cruiseLineId: 'line-1' },
      { id: 'ship-2', cruiseLineId: 'line-2' },
      { id: 'legacy-row-without-scope' }
    ]

    expect(filterRowsByTenantBoundary(rows, { cruiseLineId: 'line-1' }).map(row => row.id)).toEqual([
      'ship-1',
      'legacy-row-without-scope'
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
