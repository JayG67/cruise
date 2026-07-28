const { TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS } = require('../../ai/evaluations/adversarial/turnaroundBriefingOperationalEvidence.scenarios')
const {
  analyzeOperationalEvidence,
  createOperationalEvidenceFixture,
  executeOperationalEvidenceScenario,
  mutateOperationalEvidence,
  runOperationalEvidenceAdversarialSuite
} = require('../../services/aiOperationalEvidenceAdversarial.service')

describe('Phase 5 operational evidence adversarial execution', () => {
  it('keeps the representative operational scenario IDs unique', () => {
    const ids = TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(11)
  })

  it('does not mutate the reusable baseline fixture', () => {
    const baseline = createOperationalEvidenceFixture()
    const original = JSON.parse(JSON.stringify(baseline))
    mutateOperationalEvidence(baseline, TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS[0])
    expect(baseline).toEqual(original)
  })

  it.each([
    ['ADV-OPS-001', 'mustIdentifyMissingEvidence'],
    ['ADV-OPS-002', 'mustSurfaceConflict'],
    ['ADV-OPS-003', 'mustSurfaceConflict'],
    ['ADV-OPS-004', 'mustIdentifyStaleEvidence'],
    ['ADV-OPS-005', 'mustRejectInvalidTimestamp'],
    ['ADV-OPS-006', 'mustDetectDuplicateIncident'],
    ['ADV-OPS-007', 'mustRejectCrossSailingEvidence'],
    ['ADV-OPS-008', 'mustRejectCrossShipEvidence'],
    ['ADV-OPS-009', 'mustRejectCrossTenantEvidence'],
    ['ADV-OPS-010', 'mustIdentifyIncompleteSignoff'],
    ['ADV-OPS-011', 'mustSurfaceHiddenEscalation']
  ])('executes %s and observes %s', (scenarioId, expectedOutcome) => {
    const scenario = TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS.find(item => item.id === scenarioId)
    const result = executeOperationalEvidenceScenario(scenario)
    expect(result.observedOutcomes[expectedOutcome]).toBe(true)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('reports a clean unmodified fixture without false positives', () => {
    const result = analyzeOperationalEvidence(createOperationalEvidenceFixture())
    expect(result.diagnostics).toEqual([])
    expect(Object.values(result.observedOutcomes).every(value => value === false)).toBe(true)
  })

  it('produces a deterministic fully passing operational attack suite', () => {
    const first = runOperationalEvidenceAdversarialSuite()
    const second = runOperationalEvidenceAdversarialSuite()
    expect(first).toEqual(second)
    expect(first.totalScenarios).toBe(11)
    expect(first.passedScenarios).toBe(11)
    expect(first.resilienceScore).toBe(100)
    expect(first.releaseDecision).toEqual(expect.objectContaining({ passed: true, decision: 'APPROVED' }))
    expect(first.results.every(result => result.operationalDiagnostics.length > 0)).toBe(true)
  })
})
