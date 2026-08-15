const {
  buildDataArchitectureReadiness,
  buildMigrationBacklog,
  buildMigrationTimeline,
  looksLikeDateOnly,
  looksTimezoneAware,
  normalizeStatus
} = require('../../services/dataArchitectureReadiness.service')

describe('dataArchitectureReadiness service', () => {
  it('scores identity, roles, statuses, audit, dates, and tenant boundaries as production gates', () => {
    const readiness = buildDataArchitectureReadiness({
      cruiseLines: [{ id: 'cl-royal', name: 'Royal Caribbean' }],
      ships: [{ id: 'ship-1', cruiseLineId: 'cl-royal' }],
      sailings: [{ id: 'sailing-1', shipId: 'ship-1', departureDate: '2026-08-01' }],
      customers: [{ id: 'cust-1' }],
      bookings: [{ id: 'booking-1', customerId: 'cust-1', bookingStatus: 'CONFIRMED' }],
      bookingPassengers: [{ bookingId: 'booking-1', customerId: 'cust-1' }],
      demoUsers: [{ id: 'user-1', customerId: 'cust-1', normalizedUserId: 'app-user-1', normalizedRoleId: 'turnaround-manager', role: 'TURNAROUND_MANAGER', cruiseLineId: 'cl-royal' }],
      appUsers: [{ id: 'app-user-1', primaryCustomerId: 'cust-1' }],
      appRoles: [{ id: 'turnaround-manager', name: 'Turnaround Manager' }],
      appUserRoles: [{ userId: 'app-user-1', roleId: 'turnaround-manager' }],
      turnaroundOperations: [{ id: 'operation-1', sailingId: 'sailing-1', turnaroundDate: '2026-08-01', status: 'READY' }],
      turnaroundTasks: [{ id: 'task-1', operationId: 'operation-1', status: 'IN_PROGRESS' }],
      escalations: [{ id: 'esc-1', status: 'OPEN' }],
      handoffs: [{ id: 'handoff-1', status: 'COMPLETE' }],
      signoffs: [{ id: 'signoff-1', status: 'APPROVED' }],
      auditEvents: [{ id: 'audit-1', entityType: 'TURNAROUND_OPERATION', entityId: 'operation-1', operationId: 'operation-1', createdAt: '2026-08-01T10:00:00Z' }]
    })

    expect(readiness.title).toBe('Data Architecture Hardening Center')
    expect(readiness.gates.map(gate => gate.id)).toEqual([
      'identity',
      'dates',
      'roles',
      'statuses',
      'audit',
      'tenant-boundaries'
    ])
    expect(readiness.overallScore).toBeGreaterThanOrEqual(60)
    expect(readiness.migrationBacklog[0]).toEqual(expect.objectContaining({ title: expect.any(String), migration: expect.any(String), acceptance: expect.any(String) }))
    expect(readiness.migrationTimeline.map(phase => phase.phase)).toContain('Foundation')
    expect(readiness.schemaContract).toHaveLength(6)
    expect(readiness.riskRegister.length).toBeGreaterThan(0)
    expect(readiness.roadmap).toContain('Move operational dates to timezone-aware timestamp fields.')
    expect(readiness.migrationBacklog.find(item => item.gateId === 'audit').acceptance).toContain('governance reviews and closeout records')
  })

  it('identifies string-date hardening work and status enum drift', () => {
    const readiness = buildDataArchitectureReadiness({
      sailings: [{ id: 'sailing-1', shipId: 'ship-1', departureDate: '2026-08-01' }],
      turnaroundOperations: [{ id: 'operation-1', sailingId: 'sailing-1', turnaroundDate: '2026-08-01', status: 'almost ready' }],
      turnaroundTasks: [{ id: 'task-1', status: 'custom status' }],
      auditEvents: []
    })

    const dateGate = readiness.gates.find(gate => gate.id === 'dates')
    const statusGate = readiness.gates.find(gate => gate.id === 'statuses')

    expect(dateGate.status).toBe('needs-hardening')
    expect(dateGate.summary).toContain('date-only strings')
    expect(statusGate.status).toBe('needs-hardening')
  })


  it('builds an implementation-ready migration backlog and timeline from gate scores', () => {
    const gates = [
      { id: 'statuses', label: 'Constrained status values', score: 35, status: 'needs-hardening', summary: 'Status drift detected.', evidence: ['2 bad statuses'], recommendations: ['Replace free-form status strings.'] },
      { id: 'dates', label: 'Date and time hardening', score: 20, status: 'needs-hardening', summary: 'Date-only fields detected.', evidence: ['1 date-only value'], recommendations: ['Move operational dates to timezone-aware timestamp fields.'] },
      { id: 'roles', label: 'Role normalization', score: 95, status: 'ready', summary: 'Roles are normalized.', evidence: ['Roles detected'], recommendations: ['Keep role IDs.'] }
    ]

    const backlog = buildMigrationBacklog(gates)
    const timeline = buildMigrationTimeline(backlog)

    expect(backlog[0]).toEqual(expect.objectContaining({ gateId: 'dates', phase: 'Foundation', risk: 'high' }))
    expect(backlog.find(item => item.gateId === 'statuses')).toEqual(expect.objectContaining({ phase: 'Domain model', owner: 'Workflow systems' }))
    expect(timeline.find(phase => phase.phase === 'Foundation')).toEqual(expect.objectContaining({ status: 'needs-hardening', risk: 'high' }))
  })

  it('normalizes status and recognizes date formats for migration planning', () => {
    expect(normalizeStatus('in-progress')).toBe('IN_PROGRESS')
    expect(looksLikeDateOnly('2026-08-01')).toBe(true)
    expect(looksTimezoneAware('2026-08-01T10:00:00Z')).toBe(true)
    expect(looksTimezoneAware('2026-08-01')).toBe(false)
  })
})

it('fails safely on null readiness input and still returns a complete hardening plan', () => {
  const readiness = buildDataArchitectureReadiness(null)

  expect(readiness.gates).toHaveLength(6)
  expect(readiness.status).toBe('needs-hardening')
  expect(readiness.overallScore).toBeGreaterThanOrEqual(0)
  expect(readiness.migrationBacklog).toHaveLength(6)
  expect(readiness.migrationTimeline).toHaveLength(5)
  expect(readiness.schemaContract).toHaveLength(6)
  expect(readiness.riskRegister.length).toBeGreaterThan(0)
})

it('treats explicit null migration collections as empty instead of throwing', () => {
  expect(buildMigrationBacklog(null)).toEqual([])

  const timeline = buildMigrationTimeline(null)
  expect(timeline).toHaveLength(5)
  expect(timeline.every(phase => phase.status === 'ready')).toBe(true)
  expect(timeline.every(phase => phase.risk === 'low')).toBe(true)
  expect(timeline.every(phase => phase.items.length === 0)).toBe(true)
})

it('covers ready, watch, and needs-hardening architecture summaries', () => {
  const ready = buildDataArchitectureReadiness({
    ships: [{ cruiseLineId: 'cl-1' }],
    sailings: [{ shipId: 'ship-1', departureDate: '2026-08-01T10:00:00Z' }],
    bookings: [{ customerId: 'cust-1', status: 'CONFIRMED' }],
    bookingPassengers: [{ customerId: 'cust-1' }],
    demoUsers: [{ normalizedUserId: 'user-1', normalizedRoleId: 'turnaround-manager', role: 'TURNAROUND_MANAGER', cruiseLineId: 'cl-1' }],
    appUsers: [{ id: 'user-1' }],
    appRoles: [{ id: 'turnaround-manager', name: 'Turnaround Manager' }],
    appUserRoles: [{ userId: 'user-1', roleId: 'turnaround-manager' }],
    turnaroundOperations: [{ sailingId: 'sailing-1', turnaroundDate: '2026-08-01T12:00:00Z', status: 'READY' }],
    turnaroundTasks: [{ status: 'COMPLETE' }],
    auditEvents: [
      { entityType: 'TURNAROUND_OPERATION', entityId: 'op-1', operationId: 'op-1', createdAt: '2026-08-01T10:00:00+00:00' },
      { entityType: 'TURNAROUND_TASK', entityId: 'task-1', operationId: 'op-1', occurredAt: '2026-08-01T10:05:00Z' }
    ]
  })

  expect(ready.gates.find(gate => gate.id === 'dates').status).toBe('ready')
  expect(ready.gates.find(gate => gate.id === 'identity').status).toBe('ready')
  expect(ready.summary).toMatch(/ready|watched/i)

  const watch = buildDataArchitectureReadiness({
    demoUsers: [
      { normalizedUserId: 'u1', normalizedRoleId: 'turnaround-manager', cruiseLineId: 'cl-1' },
      { role: 'TURNAROUND_MANAGER', cruiseLineId: 'cl-1' }
    ],
    appRoles: [{ id: 'turnaround-manager', name: 'Turnaround Manager' }],
    appUserRoles: [{ userId: 'u1', roleId: 'turnaround-manager' }],
    auditEvents: [{ entityType: 'A', entityId: '1', createdAt: '2026-08-01T10:00:00Z' }]
  })

  expect(['watch', 'needs-hardening']).toContain(watch.status)
})

it('uses fallback migration metadata for unknown gates and limits the risk register', () => {
  const gates = Array.from({ length: 8 }, (_, index) => ({
    id: `custom-${index}`,
    label: `Custom Gate ${index}`,
    score: 20 + index,
    status: index === 7 ? 'ready' : 'needs-hardening',
    summary: `Summary ${index}`,
    evidence: [],
    recommendations: index % 2 === 0 ? [`Recommendation ${index}`] : []
  }))

  const backlog = buildMigrationBacklog(gates)
  expect(backlog[0]).toEqual(expect.objectContaining({
    phase: 'Hardening',
    owner: 'Platform',
    migration: expect.any(String)
  }))

  const { buildSchemaContract, buildHardeningRiskRegister } = require('../../services/dataArchitectureReadiness.service')
  const schema = buildSchemaContract(gates)
  const risks = buildHardeningRiskRegister(backlog)

  expect(schema.find(item => item.gateId === 'custom-7').targetState).toContain('Preserve current production-ready contract')
  expect(schema.find(item => item.gateId === 'custom-1').targetState).toContain('Define and enforce')
  expect(risks).toHaveLength(6)
  expect(risks.every(item => ['medium', 'watch', 'high'].includes(item.severity))).toBe(true)
})
