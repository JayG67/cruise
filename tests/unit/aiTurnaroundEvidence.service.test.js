const {
  AiTurnaroundEvidenceError,
  buildTurnaroundEvidence,
  loadTurnaroundEvidence
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
})
