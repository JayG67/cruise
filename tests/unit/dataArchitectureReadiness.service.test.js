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
