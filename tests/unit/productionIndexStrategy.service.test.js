const {
  DEFAULT_INDEX_STRATEGY,
  normalizeIndexPhase,
  normalizeIndexDefinition,
  buildProductionIndexStrategy,
  groupIndexesByPhase,
  findIndexesForTable,
  assertProductionIndexStrategy,
  describeProductionIndexStrategy
} = require('../../services/productionIndexStrategy.service')

describe('productionIndexStrategy service', () => {
  it('documents implemented and planned indexes as a production strategy', () => {
    const strategy = buildProductionIndexStrategy()

    expect(strategy).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'idx_bookings_sailing_status',
        table: 'bookings',
        columns: ['sailingId', 'bookingStatus'],
        phase: 'implemented'
      }),
      expect.objectContaining({
        name: 'idx_audit_events_entity_created_at',
        table: 'audit_events',
        columns: ['entityType', 'entityId', 'createdAtTimestamp'],
        phase: 'planned'
      })
    ]))
  })

  it('normalizes messy index metadata without changing existing index names', () => {
    expect(normalizeIndexPhase(' Final Review ')).toBe('final-review')
    expect(normalizeIndexDefinition({
      name: ' idx_customers_email ',
      table: ' customers ',
      columns: [' email ', '', null],
      queryPath: ' customer lookup ',
      phase: ' Implemented '
    })).toEqual({
      name: 'idx_customers_email',
      table: 'customers',
      columns: ['email', 'null'],
      queryPath: 'customer lookup',
      phase: 'implemented'
    })
  })

  it('groups indexes by implementation phase for the remaining roadmap', () => {
    const grouped = groupIndexesByPhase()

    expect(grouped.implemented.length).toBeGreaterThan(0)
    expect(grouped.planned.length).toBeGreaterThan(0)
    expect(grouped.planned.map((indexDefinition) => indexDefinition.name)).toContain('idx_audit_events_tenant_created_at')
  })

  it('finds table-specific index coverage for high-volume query paths', () => {
    expect(findIndexesForTable('turnaround_tasks')).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'idx_turnaround_tasks_operation_role_status',
        queryPath: 'turnaround task boards by operation, role, and status'
      })
    ]))
  })

  it('rejects duplicate or incomplete strategy entries before production indexing finalization', () => {
    expect(assertProductionIndexStrategy()).toHaveLength(DEFAULT_INDEX_STRATEGY.length)

    expect(() => assertProductionIndexStrategy([
      { name: 'idx_duplicate', table: 'bookings', columns: ['id'], queryPath: 'one' },
      { name: 'idx_duplicate', table: 'bookings', columns: ['status'], queryPath: 'two' }
    ])).toThrow('Duplicate production index strategy entry')

    expect(() => assertProductionIndexStrategy([
      { name: 'idx_missing_columns', table: 'bookings', columns: [], queryPath: 'booking lookup' }
    ])).toThrow('Production index columns are required')
  })

  it('summarizes implemented and planned production index work for release readiness', () => {
    const summary = describeProductionIndexStrategy()

    expect(summary.guardrail).toBe('production-index-strategy-finalization')
    expect(summary.totalIndexes).toBe(DEFAULT_INDEX_STRATEGY.length)
    expect(summary.implementedIndexes.length).toBeGreaterThan(0)
    expect(summary.plannedIndexes.length).toBeGreaterThan(0)
  })
})
