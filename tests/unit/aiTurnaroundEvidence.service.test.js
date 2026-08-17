const {
  AiTurnaroundEvidenceError,
  buildTurnaroundEvidence,
  loadTurnaroundEvidence,
  statusPriority
} = require('../../services/aiTurnaroundEvidence.service')

describe('Phase 2 turnaround operation evidence assembly', () => {
  const snapshot = {
    operation: {
      id: 'op-1', title: 'Port turnaround', status: 'IN_PROGRESS', readinessLevel: 'AT_RISK',
      turnaroundDate: '2026-08-01', port: 'Miami', notes: 'Departure target remains 16:00.'
    },
    tasks: [
      { id: 'task-ready', taskName: 'Gangway setup', status: 'COMPLETE', departmentRole: 'GUEST_SERVICES_LEAD' },
      { id: 'task-blocked', taskName: 'Cabin release', status: 'BLOCKED', blockerReason: 'Inspection incomplete', ownerName: 'Maria', departmentRole: 'HOUSEKEEPING_LEAD' }
    ],
    dependencies: [{ id: 'dep-1', taskId: 'task-ready', dependsOnTaskId: 'task-blocked', dependencyType: 'BLOCKS', status: 'ACTIVE' }],
    handoffs: [{ id: 'handoff-1', title: 'Cabin release handoff', status: 'PENDING', fromDepartmentRole: 'HOUSEKEEPING_LEAD', toDepartmentRole: 'GUEST_SERVICES_LEAD' }],
    staffing: [{ id: 'staff-1', departmentRole: 'ENGINEERING_LEAD', plannedCount: 4, checkedInCount: 2, leadName: 'Lee' }],
    signoffs: [{ id: 'signoff-1', departmentRole: 'ENGINEERING_LEAD', status: 'PENDING' }],
    escalations: [{ id: 'esc-1', departmentRole: 'HOUSEKEEPING_LEAD', severity: 'CRITICAL', status: 'OPEN', title: 'Cabin inspection delay' }]
  }

  it('maps live operation records into grounded, stable evidence IDs', () => {
    const result = buildTurnaroundEvidence(snapshot)
    expect(result.operation.id).toBe('op-1')
    expect(result.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'task:task-blocked', type: 'task', status: 'BLOCKED' }),
      expect.objectContaining({ id: 'staffing:staff-1', type: 'staffing', status: 'SHORTFALL' }),
      expect.objectContaining({ id: 'escalation:esc-1', type: 'escalation', status: 'CRITICAL OPEN' })
    ]))
    expect(result.evidenceSummary.countsByType).toEqual(expect.objectContaining({ task: 2, staffing: 1, escalation: 1 }))
  })

  it('prioritizes active risk evidence when the context record limit is reached', () => {
    const result = buildTurnaroundEvidence(snapshot, { maxRecords: 4 })
    expect(result.evidence).toHaveLength(4)
    expect(result.evidence[0].id).toBe('operation:op-1')
    expect(result.evidence.slice(1).map(item => item.id)).toEqual(expect.arrayContaining([
      'task:task-blocked', 'escalation:esc-1', 'staffing:staff-1'
    ]))
    expect(result.evidenceSummary.truncated).toBe(true)
  })

  it('loads an operation through an injectable repository', async () => {
    const repository = { load: jest.fn().mockResolvedValue(snapshot) }
    const result = await loadTurnaroundEvidence('op-1', { repository })
    expect(repository.load).toHaveBeenCalledWith('op-1')
    expect(result.evidence.length).toBeGreaterThan(1)
  })

  it('fails closed when the operation does not exist', () => {
    expect(() => buildTurnaroundEvidence({ operation: null })).toThrow(AiTurnaroundEvidenceError)
    expect(() => buildTurnaroundEvidence({ operation: null })).toThrow(expect.objectContaining({
      code: 'AI_TURNAROUND_OPERATION_NOT_FOUND'
    }))
  })

  it('de-prioritizes resolved critical incidents so closed risk does not displace active evidence', () => {
    const result = buildTurnaroundEvidence({
      operation: { id: 'op-1', title: 'Turnaround' },
      tasks: [{ id: 'task-active', taskName: 'Gate check', status: 'PENDING' }],
      escalations: [{ id: 'esc-resolved', title: 'Closed emergency', severity: 'CRITICAL', status: 'RESOLVED' }]
    }, { maxRecords: 2 })

    expect(result.evidence.map(item => item.id)).toEqual(['operation:op-1', 'task:task-active'])
    expect(statusPriority('CRITICAL RESOLVED')).toBeGreaterThan(statusPriority('PENDING'))
  })

  it('rejects blank operation IDs before calling the evidence repository', async () => {
    const repository = { load: jest.fn() }
    await expect(loadTurnaroundEvidence('   ', { repository })).rejects.toMatchObject({
      code: 'AI_TURNAROUND_OPERATION_ID_REQUIRED'
    })
    expect(repository.load).not.toHaveBeenCalled()
  })

  it('normalizes missing optional evidence collections to an operation-only evidence packet', () => {
    const result = buildTurnaroundEvidence({ operation: { id: 'op-empty' } })
    expect(result.evidence).toEqual([expect.objectContaining({ id: 'operation:op-empty', status: 'UNKNOWN' })])
    expect(result.evidenceSummary).toMatchObject({ totalAvailable: 1, included: 1, truncated: false })
  })


  it('classifies operational evidence priorities across resolved, critical, pending, progress, and neutral states', () => {
    expect(statusPriority('RESOLVED')).toBe(3)
    expect(statusPriority('CLOSED CRITICAL')).toBe(3)
    expect(statusPriority('BLOCKED')).toBe(0)
    expect(statusPriority('OVERDUE')).toBe(0)
    expect(statusPriority('AT_RISK')).toBe(1)
    expect(statusPriority('OPEN')).toBe(1)
    expect(statusPriority('IN_PROGRESS')).toBe(2)
    expect(statusPriority('READY')).toBe(2)
    expect(statusPriority('COMPLETE')).toBe(3)
    expect(statusPriority('UNKNOWN')).toBe(3)
  })

  it('sanitizes sparse evidence fields and retains useful optional details', () => {
    const result = buildTurnaroundEvidence({
      operation: { id: 'op-2', port: 'Miami', turnaroundDate: '2026-08-17' },
      tasks: [{ id: 't1', dueTime: '13:00', location: 'Terminal A' }],
      dependencies: [{ id: 'd1', taskId: 't1', dependsOnTaskId: 't0' }],
      handoffs: [{ id: 'h1', fromDepartmentRole: 'A', toDepartmentRole: 'B', dueTime: '14:00' }],
      staffing: [{ id: 's1', departmentRole: 'Security', plannedCount: 2, checkedInCount: 2, musterLocation: 'Pier 1' }],
      signoffs: [{ id: 'g1', departmentRole: 'Security' }],
      escalations: [{ id: 'e1', createdAt: '2026-08-17T12:00:00Z' }]
    })

    expect(result.evidence.find(item => item.id === 'task:t1')).toMatchObject({ title: 'Operational evidence', status: 'UNKNOWN', details: 'Due: 13:00. Location: Terminal A' })
    expect(result.evidence.find(item => item.id === 'staffing:s1')).toMatchObject({ status: 'READY', details: '2 of 2 checked in. Muster: Pier 1' })
    expect(result.evidenceSummary.countsByType).toEqual(expect.objectContaining({ dependency: 1, handoff: 1, signoff: 1 }))
  })

  it('reports truncation accurately at zero and oversized evidence limits', () => {
    const zero = buildTurnaroundEvidence(snapshot, { maxRecords: 0 })
    expect(zero.evidence).toEqual([])
    expect(zero.evidenceSummary).toMatchObject({ included: 0, truncated: true })

    const all = buildTurnaroundEvidence(snapshot, { maxRecords: 999 })
    expect(all.evidenceSummary.included).toBe(all.evidenceSummary.totalAvailable)
    expect(all.evidenceSummary.truncated).toBe(false)
  })

})
