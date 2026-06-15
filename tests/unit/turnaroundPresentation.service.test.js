const {
  buildTurnaroundPresentationGuide,
  buildPresentationScores,
  buildPresentationRisks
} = require('../../services/turnaroundPresentation.service')

describe('turnaroundPresentation service', () => {
  it('builds a five-minute employer-demo guide from live turnaround state', () => {
    const guide = buildTurnaroundPresentationGuide({
      operation: { title: 'Miami same-day turnaround readiness', ship: { name: 'React Icon' } },
      tasks: [{ id: 'task-1', taskName: 'Cabin release', status: 'BLOCKED', blockerReason: 'Inspector hold' }],
      escalations: [{ id: 'esc-1', title: 'Terminal queue', status: 'OPEN' }],
      dependencies: [{ id: 'dep-1', status: 'ACTIVE' }],
      handoffs: [{ id: 'handoff-1', status: 'PENDING' }],
      signoffs: [{ id: 'signoff-1', status: 'PENDING' }],
      staffing: [{ plannedCount: 10, checkedInCount: 8 }],
      lifecycleState: {
        completionPercent: 72,
        completionLanguage: '72% complete with blockers remaining.',
        nextBestAction: 'Resolve blocked task: Cabin release.',
        finalBlockers: [{ id: 'task-task-1', type: 'Task blocker', label: 'Cabin release', detail: 'Inspector hold' }]
      },
      releasePacket: { readinessScore: 76, releaseStatus: 'WATCH' },
      executiveBrief: { readiness: { readinessScore: 72 } },
      reviewerPacket: { readiness: { readinessScore: 70 }, narrative: { summary: 'Reviewer proof is forming.' }, dataQuality: { blockerCount: 1 } },
      managementStatus: { maturityScore: 74, nextSlices: ['Freeze turnaround expansion after final workflow coverage.'], remainingWork: [] },
      launchPlan: { launchReadiness: { launchScore: 72 } },
      productionReadiness: { readiness: { readinessScore: 68 } },
      applicationDossier: { readiness: { readinessScore: 71 } }
    })

    expect(guide.status).toBe('PRESENTATION_HARDENING')
    expect(guide.storyline).toHaveLength(5)
    expect(guide.storyline.map(step => step.label)).toEqual([
      'Admin sets up operations',
      'Roles execute the turnaround',
      'Manager sees progress',
      'Readiness becomes provable',
      'Close with employer value'
    ])
    expect(guide.focus.priority).toContain('Resolve blocked task')
    expect(guide.focus.talkingPoints).toEqual(expect.arrayContaining(['1 blocked task', '1 open escalation', '2 staffing gaps']))
    expect(guide.risks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'lifecycle-blockers' }),
      expect.objectContaining({ id: 'reviewer-data-quality' })
    ]))
    expect(guide.freezeRecommendation).toContain('rerun the Cypress lifecycle workflow')
  })

  it('marks the guide demo ready when scores are high and no risks remain', () => {
    const guide = buildTurnaroundPresentationGuide({
      lifecycleState: { completionPercent: 100, finalBlockers: [], nextBestAction: 'Archive the packet.' },
      releasePacket: { readinessScore: 96, releaseStatus: 'READY' },
      executiveBrief: { readiness: { readinessScore: 94 } },
      reviewerPacket: { readiness: { readinessScore: 95 }, dataQuality: { blockerCount: 0 } },
      launchPlan: { launchReadiness: { launchScore: 92 } },
      productionReadiness: { readiness: { readinessScore: 91 }, blockers: [] },
      applicationDossier: { readiness: { readinessScore: 93 } },
      managementStatus: { maturityScore: 92, remainingWork: [] }
    })

    expect(guide.status).toBe('DEMO_READY')
    expect(guide.averageScore).toBeGreaterThanOrEqual(90)
    expect(guide.risks).toEqual([expect.objectContaining({ id: 'presentation-ready' })])
    expect(guide.freezeRecommendation).toContain('begin cross-app UX cleanup')
  })

  it('keeps presentation scoring bounded and risk-focused', () => {
    expect(buildPresentationScores({ lifecycleState: { completionPercent: 180 }, releasePacket: { readinessScore: -20 } })).toEqual(expect.objectContaining({
      lifecycleScore: 100,
      releaseScore: 0
    }))

    const risks = buildPresentationRisks({
      productionReadiness: { blockers: [{ detail: 'Add production support checklist.' }] },
      managementStatus: { remainingWork: [{ priority: 'HIGH', label: 'UX polish', detail: 'Reduce noisy panels.' }] }
    })

    expect(risks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'production-readiness' }),
      expect.objectContaining({ id: 'management-work' })
    ]))
  })
})
