const {
  buildTurnaroundCloseoutPacket,
  buildCloseoutGates,
  buildCloseoutBlockers,
  buildCloseoutChecklist
} = require('../../services/turnaroundCloseout.service')

describe('turnaroundCloseout service', () => {
  const operation = {
    id: 'turnaround-1',
    title: 'Wonder turnaround',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International',
    turnaroundDate: '2026-07-01'
  }

  it('builds a final closeout packet from workflow, release, debrief, and reviewer evidence', () => {
    const packet = buildTurnaroundCloseoutPacket({
      operation,
      tasks: [{ status: 'COMPLETE' }, { status: 'COMPLETE' }, { status: 'IN_PROGRESS' }],
      staffing: [{ requiredCount: 8, assignedCount: 8 }],
      signoffs: [{ status: 'APPROVED' }, { status: 'APPROVED' }],
      escalations: [{ status: 'RESOLVED' }],
      dependencies: [{ status: 'COMPLETE' }],
      handoffs: [{ status: 'COMPLETE' }],
      auditEvents: [{ id: 'audit-1' }, { id: 'audit-2' }],
      lifecycleState: { completionPercent: 92 },
      releasePacket: { releaseScore: 94 },
      operationalTimeline: { summary: { totalEvents: 18 } },
      afterActionReview: { summary: { reviewScore: 88 }, followUpActions: ['Promote playbook owner.'] },
      reviewerPacket: { readiness: { readinessScore: 90 } },
      managementStatus: { maturityScore: 91, maturityStatus: 'FLAGSHIP_READY', remainingWork: [] },
      launchPlan: { launchScore: 89, launchStatus: 'READY' },
      scenarioPlan: { resilienceScore: 86 },
      productionReadiness: { productionScore: 91, productionStatus: 'PRODUCTION_DEMO_READY', blockers: [] },
      applicationDossier: { dossierScore: 90, dossierStatus: 'READY' },
      presentationGuide: { averageScore: 90 }
    })

    expect(packet.closeoutScore).toBeGreaterThanOrEqual(85)
    expect(packet.narrative.headline).toContain('Wonder of the Seas turnaround closeout')
    expect(packet.gates.map(gate => gate.id)).toEqual(expect.arrayContaining([
      'lifecycle-complete',
      'release-ready',
      'workflow-closed',
      'operational-risk-clear',
      'production-demo-ready',
      'application-proof-ready',
      'post-operation-loop'
    ]))
    expect(packet.checklist.map(item => item.id)).toEqual(expect.arrayContaining([
      'confirm-scope',
      'close-workflow',
      'approve-readiness',
      'archive-audit'
    ]))
    expect(packet.evidenceArchive).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'release-evidence' }),
      expect.objectContaining({ id: 'reviewer-evidence' })
    ]))
  })

  it('flags blocked gates and blockers when the operation is not ready to close', () => {
    const gates = buildCloseoutGates({
      lifecycleScore: 42,
      releaseScore: 58,
      taskCompletion: 25,
      signoffCompletion: 0,
      productionScore: 50,
      dossierScore: 45,
      reviewerScore: 40,
      presentationScore: 55,
      afterActionScore: 35,
      blockedTasks: 2,
      openEscalations: 1,
      openDependencies: 2,
      incompleteHandoffs: 1,
      staffingGaps: 1,
      completeTasks: 1,
      totalTasks: 4,
      approvedSignoffs: 0,
      totalSignoffs: 3,
      followUpActions: ['Run debrief.'],
      shipName: 'Utopia of the Seas',
      productionStatus: 'NEEDS HARDENING',
      dossierStatus: 'NEEDS PROOF HARDENING'
    })

    const blockers = buildCloseoutBlockers({
      blockedTasks: 2,
      openEscalations: 1,
      openDependencies: 2,
      incompleteHandoffs: 1,
      staffingGaps: 1,
      remainingWork: [{ id: 'data-quality', priority: 'HIGH', detail: 'Close data quality watch items.' }]
    }, gates)

    expect(gates.some(gate => gate.status === 'BLOCKED')).toBe(true)
    expect(blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'blocked-tasks', severity: 'HIGH' }),
      expect.objectContaining({ id: 'open-escalations', severity: 'HIGH' }),
      expect.objectContaining({ id: 'management-data-quality', severity: 'HIGH' })
    ]))
  })

  it('keeps the final checklist tied to concrete closeout evidence', () => {
    const checklist = buildCloseoutChecklist({
      operationId: 'turnaround-1',
      cruiseLineName: 'Celebrity Cruises',
      shipName: 'Celebrity Beyond',
      turnaroundDate: '2026-07-09',
      blockedTasks: 0,
      openDependencies: 0,
      incompleteHandoffs: 0,
      signoffCompletion: 100,
      approvedSignoffs: 4,
      totalSignoffs: 4,
      completeTasks: 8,
      totalTasks: 8,
      afterActionScore: 90,
      dossierScore: 92,
      reviewerScore: 91,
      presentationScore: 88,
      auditEventCount: 6,
      timelineEvents: 24,
      followUpActions: []
    }, [{ id: 'workflow-closed', label: 'Workflow closed', readinessScore: 95, status: 'READY_TO_CLOSE', detail: 'Ready' }], [{ id: 'closeout-ready', severity: 'INFO', detail: 'Ready' }])

    expect(checklist).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'approve-readiness', status: 'READY' }),
      expect.objectContaining({ id: 'archive-audit', status: 'READY' })
    ]))
  })
})
