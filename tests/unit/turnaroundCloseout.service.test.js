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

  it('builds a final closeout packet from workflow, release, debrief, and governance evidence', () => {
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
      managementStatus: { maturityScore: 91, maturityStatus: 'REFERENCE_BASELINE_READY', remainingWork: [] },
      launchPlan: { launchScore: 89, launchStatus: 'READY' },
      scenarioPlan: { resilienceScore: 86 },
      productionReadiness: { productionScore: 91, productionStatus: 'OPERATIONALLY_READY', blockers: [] },
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
      'production-readiness',
      'governance-evidence-ready',
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
      expect.objectContaining({ id: 'governance-evidence' })
    ]))

    const userVisibleText = JSON.stringify({
      narrative: packet.narrative,
      gates: packet.gates,
      blockers: packet.blockers,
      checklist: packet.checklist,
      evidenceArchive: packet.evidenceArchive
    }).toLowerCase()
    for (const retiredPhrase of ['production demo', 'reviewer proof', 'reviewer closeout', 'flagship', 'application collateral', 'needs hardening']) {
      expect(userVisibleText).not.toContain(retiredPhrase)
    }
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
      productionStatus: 'ACTION REQUIRED',
      dossierStatus: 'EVIDENCE REQUIRED'
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

describe('turnaroundCloseout authoritative evidence hardening', () => {
  it('preserves explicit zero scores instead of replacing them with healthier fallback evidence', () => {
    const packet = buildTurnaroundCloseoutPacket({
      operation: { id: 'turnaround-zero', shipName: 'Zero Ship' },
      tasks: [], signoffs: [], staffing: [], escalations: [], dependencies: [], handoffs: [], auditEvents: [],
      lifecycleState: { completionPercent: 0 },
      releasePacket: { readinessScore: 0, releaseScore: 94 },
      operationalMetrics: { summary: { releaseConfidence: 96 } },
      afterActionReview: { summary: { reviewScore: 0 }, followUpActions: [] },
      executiveBrief: { summary: { reviewScore: 90 } },
      operationalTimeline: { summary: { totalEvents: 0 }, items: [{ id: 'stale-event' }] }
    })

    expect(packet.evidence.releaseScore).toBe(0)
    expect(packet.evidence.afterActionScore).toBe(0)
    expect(packet.evidence.timelineEvents).toBe(0)
    expect(packet.closeoutStatus).toBe('NOT_READY_TO_CLOSE')
  })

  it('uses fallback evidence only when the authoritative value is absent', () => {
    const packet = buildTurnaroundCloseoutPacket({
      operation: { id: 'turnaround-fallback' },
      releasePacket: { releaseScore: 83 },
      operationalMetrics: { summary: { releaseConfidence: 91 } },
      executiveBrief: { summary: { reviewScore: 79 } },
      operationalTimeline: { items: [{ id: 'event-1' }, { id: 'event-2' }] }
    })

    expect(packet.evidence.releaseScore).toBe(83)
    expect(packet.evidence.afterActionScore).toBe(79)
    expect(packet.evidence.timelineEvents).toBe(2)
  })

  it('degrades safely for explicit null operation and collection inputs', () => {
    const packet = buildTurnaroundCloseoutPacket({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })

    expect(packet.operationId).toBeNull()
    expect(packet.evidence.totalTasks).toBe(0)
    expect(packet.evidence.totalSignoffs).toBe(0)
    expect(packet.evidence.auditEventCount).toBe(0)
    expect(packet.closeoutStatus).toBe('NOT_READY_TO_CLOSE')
  })
})

describe('turnaroundCloseout decision branches', () => {
  it('returns READY_TO_CLOSE when all gates are strong and no high blocker remains', () => {
    const packet = buildTurnaroundCloseoutPacket({
      operation: { id: 'ready', shipName: 'Ready Ship' },
      tasks: [{ status: 'COMPLETE' }],
      signoffs: [{ status: 'APPROVED' }],
      lifecycleState: { completionPercent: 100 },
      releasePacket: { readinessScore: 100 },
      managementStatus: { maturityScore: 100, remainingWork: [] },
      productionReadiness: { productionScore: 100 },
      applicationDossier: { dossierScore: 100 },
      reviewerPacket: { readiness: { readinessScore: 100 } },
      presentationGuide: { averageScore: 100 },
      afterActionReview: { summary: { reviewScore: 100 }, followUpActions: [] },
      operationalTimeline: { summary: { totalEvents: 1 } }
    })
    expect(packet.closeoutStatus).toBe('READY_TO_CLOSE')
    expect(packet.blockers).toEqual([expect.objectContaining({ id: 'closeout-ready', severity: 'INFO' })])
  })

  it('returns CLOSE_WITH_WATCH_ITEMS for a watch-range packet without high blockers', () => {
    const packet = buildTurnaroundCloseoutPacket({
      operation: { id: 'watch' },
      tasks: [{ status: 'COMPLETE' }],
      signoffs: [{ status: 'APPROVED' }],
      lifecycleState: { completionPercent: 82 },
      releasePacket: { readinessScore: 82 },
      productionReadiness: { productionScore: 82 },
      applicationDossier: { dossierScore: 82 },
      reviewerPacket: { readiness: { readinessScore: 82 } },
      presentationGuide: { averageScore: 82 },
      afterActionReview: { summary: { reviewScore: 82 }, followUpActions: [] }
    })
    expect(packet.closeoutStatus).toBe('CLOSE_WITH_WATCH_ITEMS')
    expect(packet.gates.every(gate => gate.status !== 'BLOCKED')).toBe(true)
  })
})
