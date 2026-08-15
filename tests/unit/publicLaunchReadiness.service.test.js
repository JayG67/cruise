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

  it('sorts fallback critical items without mutating the published launch-track order', () => {
    const tracks = buildLaunchReadinessTracks({
      dataArchitecture: { overallScore: 95, gates: [] },
      productionHardening: { overallScore: 70, gates: [] },
      deployment: { overallScore: 85, gates: [] }
    })
    const originalOrder = tracks.map(track => track.id)

    const items = buildCriticalLaunchItems(tracks, [])

    expect(items.map(item => item.id)).toEqual([
      'production-hardening',
      'deployment-readiness',
      'data-architecture-hardening'
    ])
    expect(tracks.map(track => track.id)).toEqual(originalOrder)
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

  it('preserves an explicit zero operations score instead of replacing it with the portfolio default', () => {
    const readiness = buildPublicLaunchReadiness({
      dataArchitecture: { overallScore: 100, gates: [] },
      productionHardening: { overallScore: 100, gates: [] },
      deployment: { overallScore: 100, gates: [] },
      operationsControlBoard: { overallScore: 0 }
    })

    const operationsTrack = readiness.projectStatus.tracks.find(track => track.area === 'Turnaround operations')
    expect(operationsTrack).toMatchObject({ percent: 0, status: 'operational' })
    expect(readiness.projectStatus.featureCompleteEstimate).toBe(75)
  })

  it('uses the operations portfolio default only when no operations score is supplied', () => {
    const readiness = buildPublicLaunchReadiness({
      dataArchitecture: { overallScore: 100, gates: [] },
      productionHardening: { overallScore: 100, gates: [] },
      deployment: { overallScore: 100, gates: [] },
      operationsControlBoard: {}
    })

    const operationsTrack = readiness.projectStatus.tracks.find(track => track.area === 'Turnaround operations')
    expect(operationsTrack.percent).toBe(95)
    expect(readiness.projectStatus.featureCompleteEstimate).toBe(99)
  })

  it('clamps malformed and out-of-range readiness scores without inflating launch status', () => {
    const readiness = buildPublicLaunchReadiness({
      dataArchitecture: { overallScore: -20, gates: [] },
      productionHardening: { overallScore: 160, gates: [] },
      deployment: { overallScore: 'not-a-score', gates: [] },
      operationsControlBoard: { score: 140 }
    })

    expect(readiness.tracks.map(track => track.score)).toEqual([0, 100, 0])
    expect(readiness.status).toBe('blocked')
    expect(readiness.projectStatus.tracks.find(track => track.area === 'Turnaround operations').percent).toBe(100)
  })


  it('distinguishes ready, watch, and blocked consolidated launch summaries', () => {
    const ready = buildPublicLaunchReadiness({
      dataArchitecture: { overallScore: 95, gates: [] },
      productionHardening: { overallScore: 95, gates: [] },
      deployment: { overallScore: 95, gates: [] }
    })
    expect(ready.status).toBe('ready')
    expect(ready.summary).toContain('ready for final production release verification')

    const watch = buildPublicLaunchReadiness({
      dataArchitecture: { overallScore: 90, gates: [] },
      productionHardening: { overallScore: 90, gates: [] },
      deployment: { overallScore: 82, gates: [] }
    })
    expect(watch.status).toBe('watch')
    expect(watch.summary).toContain('operational watchlist')
  })

  it('orders critical gate evidence by score and uses recommendation fallbacks', () => {
    const readiness = buildPublicLaunchReadiness({
      dataArchitecture: {
        overallScore: 80,
        gates: [
          { id: 'tenant', label: 'Tenant boundaries', score: 55, status: 'watch', recommendations: ['Tighten tenant scope.'] },
          { id: 'identity', label: 'Identity', score: 30, status: 'needs-hardening' }
        ]
      },
      productionHardening: { overallScore: 95, gates: [] },
      deployment: { overallScore: 95, gates: [] }
    })

    expect(readiness.criticalItems.map(item => item.title)).toEqual(['Identity', 'Tenant boundaries'])
    expect(readiness.criticalItems[0].action).toBe('Resolve this item before production release.')
    expect(readiness.criticalItems[1].action).toBe('Tighten tenant scope.')
  })

})
