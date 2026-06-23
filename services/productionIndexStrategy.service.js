const DEFAULT_INDEX_STRATEGY = Object.freeze([
  {
    name: 'idx_ships_cruise_line_id',
    table: 'ships',
    columns: ['cruiseLineId'],
    queryPath: 'fleet ship lookup by cruise line',
    phase: 'implemented'
  },
  {
    name: 'idx_sailings_ship_id_departure_date',
    table: 'sailings',
    columns: ['shipId', 'departureDate'],
    queryPath: 'ship sailing lookup and schedule sorting',
    phase: 'implemented'
  },
  {
    name: 'idx_bookings_sailing_status',
    table: 'bookings',
    columns: ['sailingId', 'bookingStatus'],
    queryPath: 'booking lists scoped by sailing and status',
    phase: 'implemented'
  },
  {
    name: 'idx_booking_passengers_customer_id',
    table: 'booking_passengers',
    columns: ['customerId'],
    queryPath: 'passenger booking history by customer',
    phase: 'implemented'
  },
  {
    name: 'idx_turnaround_operations_sailing_status',
    table: 'turnaround_operations',
    columns: ['sailingId', 'status'],
    queryPath: 'turnaround operation lookup by sailing and status',
    phase: 'implemented'
  },
  {
    name: 'idx_turnaround_tasks_operation_role_status',
    table: 'turnaround_tasks',
    columns: ['operationId', 'departmentRole', 'status'],
    queryPath: 'turnaround task boards by operation, role, and status',
    phase: 'implemented'
  },
  {
    name: 'idx_audit_events_entity_created_at',
    table: 'audit_events',
    columns: ['entityType', 'entityId', 'createdAtTimestamp'],
    queryPath: 'entity audit history lookup',
    phase: 'planned'
  },
  {
    name: 'idx_audit_events_tenant_created_at',
    table: 'audit_events',
    columns: ['cruiseLineId', 'shipId', 'sailingId', 'createdAtTimestamp'],
    queryPath: 'tenant-scoped audit history lookup',
    phase: 'planned'
  }
])

function normalizeIndexPhase(phase) {
  return String(phase || 'planned').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function normalizeIndexDefinition(indexDefinition = {}) {
  const columns = Array.isArray(indexDefinition.columns)
    ? indexDefinition.columns.map((column) => String(column).trim()).filter(Boolean)
    : []

  return {
    name: String(indexDefinition.name || '').trim(),
    table: String(indexDefinition.table || '').trim(),
    columns,
    queryPath: String(indexDefinition.queryPath || '').trim(),
    phase: normalizeIndexPhase(indexDefinition.phase)
  }
}

function buildProductionIndexStrategy(indexes = DEFAULT_INDEX_STRATEGY) {
  return indexes.map(normalizeIndexDefinition)
}

function groupIndexesByPhase(indexes = DEFAULT_INDEX_STRATEGY) {
  return buildProductionIndexStrategy(indexes).reduce((groups, indexDefinition) => {
    const phase = indexDefinition.phase || 'planned'
    groups[phase] = groups[phase] || []
    groups[phase].push(indexDefinition)
    return groups
  }, {})
}

function findIndexesForTable(tableName, indexes = DEFAULT_INDEX_STRATEGY) {
  const normalizedTable = String(tableName || '').trim()
  return buildProductionIndexStrategy(indexes).filter((indexDefinition) => indexDefinition.table === normalizedTable)
}

function assertProductionIndexStrategy(indexes = DEFAULT_INDEX_STRATEGY) {
  const normalizedIndexes = buildProductionIndexStrategy(indexes)
  const names = new Set()

  for (const indexDefinition of normalizedIndexes) {
    if (!indexDefinition.name) {
      throw new Error('Production index name is required.')
    }

    if (names.has(indexDefinition.name)) {
      throw new Error(`Duplicate production index strategy entry: ${indexDefinition.name}`)
    }

    if (!indexDefinition.table) {
      throw new Error(`Production index table is required for ${indexDefinition.name}.`)
    }

    if (!indexDefinition.columns.length) {
      throw new Error(`Production index columns are required for ${indexDefinition.name}.`)
    }

    if (!indexDefinition.queryPath) {
      throw new Error(`Production index query path is required for ${indexDefinition.name}.`)
    }

    names.add(indexDefinition.name)
  }

  return normalizedIndexes
}

function describeProductionIndexStrategy(indexes = DEFAULT_INDEX_STRATEGY) {
  const grouped = groupIndexesByPhase(indexes)
  return {
    totalIndexes: buildProductionIndexStrategy(indexes).length,
    implementedIndexes: grouped.implemented || [],
    plannedIndexes: grouped.planned || [],
    guardrail: 'production-index-strategy-finalization'
  }
}

module.exports = {
  DEFAULT_INDEX_STRATEGY,
  normalizeIndexPhase,
  normalizeIndexDefinition,
  buildProductionIndexStrategy,
  groupIndexesByPhase,
  findIndexesForTable,
  assertProductionIndexStrategy,
  describeProductionIndexStrategy
}
