const {
  buildCriticalLaunchItems,
  buildLaunchReadinessTracks,
  buildPublicLaunchReadiness,
  getLaunchStatus
} = require('../../services/publicLaunchReadiness.service')

describe('publicLaunchReadiness service', () => {
  it('combines architecture, hardening, deployment, and portfolio readiness into launch tracks', () => {
    const tracks = buildLaunchReadinessTracks({
      dataArchitecture: { overallScore: 92, gates: [] },
      productionHardening: { overallScore: 88, gates: [] },
      deployment: { overallScore: 82, gates: [{ status: 'watch' }] },
      portfolio: { overallScore: 94, gates: [] }
    })

    expect(tracks.map(track => track.id)).toEqual([
      'data-architecture-hardening',
      'production-hardening',
      'deployment-readiness',
      'portfolio-packaging'
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
      },
      portfolio: {
        overallScore: 86,
        gates: [{ id: 'assets', label: 'Launch assets', score: 70, status: 'watch', summary: 'Screenshots remain open.', recommendations: ['Capture screenshots.'] }]
      }
    })

    expect(readiness.status).toBe('blocked')
    expect(readiness.criticalItems[0]).toMatchObject({ title: 'Logging', source: 'Production Hardening' })
    expect(readiness.launchRunbook.map(step => step.id)).toContain('go-live')
    expect(readiness.projectStatus.featureCompleteEstimate).toBeGreaterThan(80)
  })

  it('falls back to track priorities when no blocking gates are present', () => {
    const items = buildCriticalLaunchItems([
      { id: 'deployment-readiness', label: 'Deployment readiness', source: 'Deployment Readiness Center', score: 72, status: 'watch', summary: 'Needs host.', action: 'Choose host.' },
      { id: 'portfolio-packaging', label: 'Portfolio packaging', source: 'Portfolio Polish Center', score: 80, status: 'watch', summary: 'Needs screenshots.', action: 'Capture screenshots.' }
    ], [])

    expect(items[0]).toMatchObject({ id: 'deployment-readiness', sequence: 1, action: 'Choose host.' })
  })

  it('uses blockers and score to calculate launch status', () => {
    expect(getLaunchStatus(95, 0, 0)).toBe('ready')
    expect(getLaunchStatus(82, 0, 1)).toBe('watch')
    expect(getLaunchStatus(95, 1, 0)).toBe('blocked')
  })
})
