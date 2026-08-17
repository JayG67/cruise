const { buildTurnaroundOperationalReview, buildOperationalReviewScores, buildOperationalReviewRisks } = require('../../services/turnaroundOperationalReview.service')

describe('turnaroundOperationalReview service', () => {
  it('builds an operational review from live turnaround state', () => {
    const review = buildTurnaroundOperationalReview({
      operation: { title: 'Miami same-day turnaround readiness' },
      tasks: [{ taskName: 'Cabin release', status: 'BLOCKED', blockerReason: 'Inspector hold' }],
      escalations: [{ title: 'Terminal queue', status: 'OPEN' }], dependencies: [{ status: 'ACTIVE' }], handoffs: [{ status: 'PENDING' }], signoffs: [{ status: 'PENDING' }], staffing: [{ plannedCount: 10, checkedInCount: 8 }],
      lifecycleState: { completionPercent: 72, nextBestAction: 'Resolve blocked task: Cabin release.', finalBlockers: [{ type: 'Task blocker', label: 'Cabin release' }] },
      releasePacket: { readinessScore: 76, releaseStatus: 'WATCH' }, executiveBrief: { readiness: { readinessScore: 72 } },
      operationalAssurancePacket: { readiness: { readinessScore: 70 }, dataQuality: { blockerCount: 1 } }, managementStatus: { maturityScore: 74, remainingWork: [] },
      launchPlan: { launchReadiness: { launchScore: 72 } }, productionReadiness: { readiness: { readinessScore: 68 } }, operationalReleaseDossier: { readiness: { readinessScore: 71 } }
    })
    expect(review.status).toBe('REVIEW_HARDENING')
    expect(review.reviewSequence.map(step => step.label)).toEqual(['Confirm operational setup', 'Review department execution', 'Assess command readiness', 'Validate assurance evidence', 'Record the release decision'])
    expect(review.focus.reviewSignals).toEqual(expect.arrayContaining(['1 blocked task', '1 open escalation', '2 staffing gaps']))
    expect(review.risks).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'lifecycle-blockers' }), expect.objectContaining({ id: 'assurance-data-quality' })]))
  })

  it('marks a high-scoring review ready when no risks remain', () => {
    const review = buildTurnaroundOperationalReview({ lifecycleState: { completionPercent: 100, finalBlockers: [] }, releasePacket: { readinessScore: 96 }, executiveBrief: { readiness: { readinessScore: 94 } }, operationalAssurancePacket: { readiness: { readinessScore: 95 }, dataQuality: { blockerCount: 0 } }, launchPlan: { launchReadiness: { launchScore: 92 } }, productionReadiness: { readiness: { readinessScore: 91 }, blockers: [] }, operationalReleaseDossier: { readiness: { readinessScore: 93 } }, managementStatus: { remainingWork: [] } })
    expect(review.status).toBe('REVIEW_READY')
    expect(review.risks).toEqual([expect.objectContaining({ id: 'review-ready' })])
  })

  it('keeps scoring bounded and risks operational', () => {
    expect(buildOperationalReviewScores({ lifecycleState: { completionPercent: 180 }, releasePacket: { readinessScore: -20 } })).toEqual(expect.objectContaining({ lifecycleScore: 100, releaseScore: 0 }))
    expect(buildOperationalReviewRisks({ productionReadiness: { blockers: [{ detail: 'Add support checklist.' }] } })).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'production-readiness' })]))
  })
})

describe('turnaroundOperationalReview evidence hardening', () => {
  it('keeps malformed staffing counts finite instead of emitting NaN evidence', () => {
    const review = buildTurnaroundOperationalReview({
      staffing: [
        { plannedCount: 'not-a-number', checkedInCount: 2 },
        { plannedCount: 5, checkedInCount: Infinity },
        { plannedCount: -3, checkedInCount: 0 }
      ]
    })

    expect(review.focus.reviewSignals).toContain('5 staffing gaps')
    expect(review.focus.reviewSignals.join(' ')).not.toContain('NaN')
  })

  it('covers singular operational focus signals and fallback review sequence text', () => {
    const review = buildTurnaroundOperationalReview({
      operation: { ship: { name: 'Voyager' } },
      dependencies: [{ status: 'OPEN' }],
      handoffs: [{ status: 'PENDING' }],
      signoffs: [{ status: 'PENDING' }],
      staffing: [{ plannedCount: 1, checkedInCount: 0 }],
      lifecycleState: { completionPercent: 0, finalBlockers: [] },
      releasePacket: { readinessScore: 0, releaseStatus: 'HOLD' },
      operationalAssurancePacket: { readiness: { readinessScore: 0 } },
      managementStatus: { maturityScore: 0, remainingWork: [] }
    })

    expect(review.status).toBe('NEEDS_FOCUS')
    expect(review.reviewSequence[0].detail).toContain('Voyager turnaround')
    expect(review.focus.reviewSignals).toEqual(expect.arrayContaining([
      '1 open dependency', '1 open handoff', '1 pending signoff', '1 staffing gap'
    ]))
  })
})
