const {
  buildCriticalLaunchItems,
  buildLaunchReadinessTracks,
  buildPublicLaunchReadiness,
  getLaunchStatus
} = require('../../services/publicLaunchReadiness.service')

describe('publicLaunchReadiness service', () => {
  it('combines architecture, hardening, and deployment readiness into release tracks', () => {
    const tracks = buildLaunchReadinessTracks({
      dataArchitecture: { overallScore: 92, gates: [] },
      productionHardening: { overallScore: 88, gates: [] },
      deployment: { overallScore: 82, gates: [{ status: 'watch' }] }
    })

    expect(tracks.map(track => track.id)).toEqual([
      'data-architecture-hardening',
      'production-hardening',
      'deployment-readiness'
    ])
    expect(tracks.find(track => track.id === 'deployment-readiness').status).toBe('watch')
  })

  it('builds a blocked launch decision when any consolidated track has blocker-level gates', () => {
    const readiness = buildPublicLaunchReadiness({
      dataArchitecture: {
        overallScore: 91,
        gates: []
      },
      productionHardening: {
        overallScore: 84,
        gates: [{ id: 'logging', label: 'Logging', score: 50, status: 'needs-hardening', summary: 'Structured logging is incomplete.', recommendations: ['Add request IDs.'] }]
      },
      deployment: {
        overallScore: 90,
        gates: []
      }
    })

    expect(readiness.status).toBe('blocked')
    expect(readiness.criticalItems[0]).toMatchObject({ title: 'Logging', source: 'Production Assurance' })
    expect(readiness.launchRunbook.map(step => step.id)).toContain('go-live')
    expect(readiness.projectStatus.featureCompleteEstimate).toBeGreaterThan(80)
  })

  it('falls back to track priorities when no blocking gates are present', () => {
    const items = buildCriticalLaunchItems([
      { id: 'deployment-readiness', label: 'Deployment readiness', source: 'Deployment Readiness Center', score: 72, status: 'watch', summary: 'Needs host.', action: 'Choose host.' },
      { id: 'production-hardening', label: 'Production assurance', source: 'Production Assurance Center', score: 80, status: 'watch', summary: 'Needs observability.', action: 'Complete observability checks.' }
    ], [])

    expect(items[0]).toMatchObject({ id: 'deployment-readiness', sequence: 1, action: 'Choose host.' })
  })

  it('keeps management readiness output free of development-stage presentation language', () => {
    const readiness = buildPublicLaunchReadiness({
      dataArchitecture: { overallScore: 95, gates: [] },
      productionHardening: { overallScore: 95, gates: [] },
      deployment: { overallScore: 95, gates: [] }
    })
    const serialized = JSON.stringify(readiness).toLowerCase()

    for (const forbidden of ['production hardening center', 'public deployment', 'seeded demo data', 'reviewer', 'major remaining proof point']) {
      expect(serialized).not.toContain(forbidden)
    }
    expect(serialized).toContain('production assurance')
    expect(serialized).toContain('data governance assurance')
  })

  it('uses blockers and score to calculate launch status', () => {
    expect(getLaunchStatus(95, 0, 0)).toBe('ready')
    expect(getLaunchStatus(82, 0, 1)).toBe('watch')
    expect(getLaunchStatus(95, 1, 0)).toBe('blocked')
  })
})
