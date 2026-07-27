const { buildAiPhaseThreeReadiness } = require('../../services/aiPhaseThreeReadiness.service')

describe('AI Phase 3 readiness', () => {
  it('reports the second evaluation harness slice in progress', () => {
    const readiness = buildAiPhaseThreeReadiness()
    expect(readiness).toEqual(expect.objectContaining({ phase: 3, name: 'Evaluation harness', status: 'IN_PROGRESS', percentComplete: 60 }))
    expect(readiness.completedCapabilities).toHaveLength(9)
    expect(readiness.nextCapabilities).toContain('Quality Console integration')
  })
})
