const { buildAiPhaseThreeReadiness } = require('../../services/aiPhaseThreeReadiness.service')

describe('AI Phase 3 readiness', () => {
  it('reports the completed evaluation harness', () => {
    const readiness = buildAiPhaseThreeReadiness()
    expect(readiness).toEqual(expect.objectContaining({ phase: 3, name: 'Evaluation harness', status: 'COMPLETE', percentComplete: 100 }))
    expect(readiness.completedCapabilities).toHaveLength(14)
    expect(readiness.nextCapabilities).toContain('Phase 4 trend visualization and filtering')
  })
})
