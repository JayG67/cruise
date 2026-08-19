function compactObject(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== '')
  )
}

function normalizeTenantId(value) {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function firstTenantId(...values) {
  return values.map(normalizeTenantId).find(Boolean) || null
}

function buildTenantBoundary({ cruiseLineId, shipId, sailingId, operationId, customerId, bookingId } = {}) {
  return compactObject({
    cruiseLineId: normalizeTenantId(cruiseLineId),
    shipId: normalizeTenantId(shipId),
    sailingId: normalizeTenantId(sailingId),
    operationId: normalizeTenantId(operationId),
    customerId: normalizeTenantId(customerId),
    bookingId: normalizeTenantId(bookingId)
  })
}

function tenantBoundaryFromEntity(entity = {}) {
  if (!entity) return {}

  const apiTenantScope = entity.apiIdentity?.tenantScope || {}
  const apiRelationships = entity.apiIdentity?.relationships || {}

  return buildTenantBoundary({
    cruiseLineId: firstTenantId(entity.cruiseLineId, apiTenantScope.cruiseLineId, apiRelationships.cruiseLineId),
    shipId: firstTenantId(entity.shipId, apiTenantScope.shipId, apiRelationships.shipId),
    sailingId: firstTenantId(entity.sailingId, apiTenantScope.sailingId, apiRelationships.sailingId),
    operationId: firstTenantId(entity.operationId, entity.turnaroundOperationId, apiTenantScope.operationId, apiRelationships.operationId, apiRelationships.turnaroundOperationId),
    customerId: firstTenantId(entity.customerId, entity.createdByCustomerId, apiRelationships.customerId, apiRelationships.createdByCustomerId),
    bookingId: firstTenantId(entity.bookingId, apiTenantScope.bookingId, apiRelationships.bookingId)
  })
}

function tenantBoundaryFromRequest(req = {}) {
  return buildTenantBoundary({
    cruiseLineId: firstTenantId(req.params?.cruiseLineId, req.query?.cruiseLineId, req.headers?.['x-cruise-tenant-id'], req.headers?.['X-Cruise-Tenant-Id']),
    shipId: firstTenantId(req.params?.shipId, req.query?.shipId),
    sailingId: firstTenantId(req.params?.sailingId, req.query?.sailingId),
    operationId: firstTenantId(req.params?.operationId, req.query?.operationId),
    customerId: firstTenantId(req.params?.customerId, req.query?.customerId),
    bookingId: firstTenantId(req.params?.bookingId, req.query?.bookingId)
  })
}

function hasTenantBoundary(boundary = {}) {
  return Object.keys(compactObject(boundary)).length > 0
}

function isTenantBoundaryCompatible(candidate = {}, required = {}) {
  const normalizedCandidate = buildTenantBoundary(candidate)
  const normalizedRequired = buildTenantBoundary(required)

  return Object.entries(normalizedRequired).every(([key, requiredValue]) => {
    const candidateValue = normalizedCandidate[key]
    return Boolean(candidateValue && candidateValue === requiredValue)
  })
}

function filterRowsByTenantBoundary(rows = [], requiredBoundary = {}) {
  if (!Array.isArray(rows)) return []

  const normalizedRequired = buildTenantBoundary(requiredBoundary)
  if (!hasTenantBoundary(normalizedRequired)) return rows

  return rows.filter(row => isTenantBoundaryCompatible(tenantBoundaryFromEntity(row), normalizedRequired))
}

function buildTenantBoundaryReport(entity = {}, requiredBoundary = {}) {
  const actualBoundary = tenantBoundaryFromEntity(entity)
  const expectedBoundary = buildTenantBoundary(requiredBoundary)
  const compatible = isTenantBoundaryCompatible(actualBoundary, expectedBoundary)

  return {
    compatible,
    actualBoundary,
    expectedBoundary,
    checkedKeys: Object.keys(expectedBoundary),
    missingKeys: Object.keys(expectedBoundary).filter(key => !actualBoundary[key]),
    mismatchedKeys: Object.entries(expectedBoundary)
      .filter(([key, expectedValue]) => actualBoundary[key] && actualBoundary[key] !== expectedValue)
      .map(([key]) => key)
  }
}

function assertTenantBoundary(entity = {}, requiredBoundary = {}) {
  const report = buildTenantBoundaryReport(entity, requiredBoundary)

  if (!report.compatible) {
    const error = new Error('Tenant boundary mismatch')
    error.code = 'TENANT_BOUNDARY_MISMATCH'
    error.report = report
    throw error
  }

  return report
}

module.exports = {
  assertTenantBoundary,
  buildTenantBoundary,
  buildTenantBoundaryReport,
  filterRowsByTenantBoundary,
  hasTenantBoundary,
  isTenantBoundaryCompatible,
  normalizeTenantId,
  tenantBoundaryFromEntity,
  tenantBoundaryFromRequest
}
