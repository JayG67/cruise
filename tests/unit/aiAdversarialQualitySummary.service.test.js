describe('AI adversarial Quality Console summary', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('aggregates all Phase 5 suites into an approved release gate', () => {
    const { buildAiAdversarialQualitySummary } = require('../../services/aiAdversarialQualitySummary.service')
    const summary = buildAiAdversarialQualitySummary()
    expect(summary).toMatchObject({ phase: 5, status: 'READY', totalSuites: 3, totalScenarios: 31, passedScenarios: 31, failedScenarios: 0, resilienceScore: 100, releaseDecision: 'APPROVED' })
    expect(summary.suites).toHaveLength(3)
    expect(summary.suites.every(suite => suite.resilienceScore === 100)).toBe(true)
  })

  test('does not treat a truthy string passed flag as an approved suite decision', () => {
    const result = { totalScenarios: 1, passedScenarios: 0, failedScenarios: 1, resilienceScore: 0, releaseDecision: { passed: 'false' }, results: [] }
    jest.doMock('../../services/aiOperationalEvidenceAdversarial.service', () => ({ runOperationalEvidenceAdversarialSuite: () => result }))
    jest.doMock('../../services/aiPromptInstructionAdversarial.service', () => ({ runPromptInstructionAdversarialSuite: () => result }))
    jest.doMock('../../services/aiProviderRuntimeAdversarial.service', () => ({ runProviderRuntimeAdversarialSuite: () => result }))

    const { buildAiAdversarialQualitySummary } = require('../../services/aiAdversarialQualitySummary.service')
    const summary = buildAiAdversarialQualitySummary()

    expect(summary.status).toBe('BLOCKED')
    expect(summary.releaseDecision).toBe('BLOCKED')
    expect(summary.suites.every(suite => suite.releaseDecision === 'BLOCKED')).toBe(true)
  })

  test('normalizes malformed suite counts and resilience values instead of emitting NaN or Infinity', () => {
    const malformed = { totalScenarios: 'bad', passedScenarios: Infinity, failedScenarios: -2, resilienceScore: 999, releaseDecision: {}, results: [{ findings: ['one'] }] }
    jest.doMock('../../services/aiOperationalEvidenceAdversarial.service', () => ({ runOperationalEvidenceAdversarialSuite: () => malformed }))
    jest.doMock('../../services/aiPromptInstructionAdversarial.service', () => ({ runPromptInstructionAdversarialSuite: () => malformed }))
    jest.doMock('../../services/aiProviderRuntimeAdversarial.service', () => ({ runProviderRuntimeAdversarialSuite: () => malformed }))

    const { buildAiAdversarialQualitySummary } = require('../../services/aiAdversarialQualitySummary.service')
    const summary = buildAiAdversarialQualitySummary()

    expect(summary).toEqual(expect.objectContaining({ totalScenarios: 0, passedScenarios: 0, failedScenarios: 0, resilienceScore: 0, status: 'BLOCKED', releaseDecision: 'BLOCKED' }))
    expect(summary.suites[0]).toEqual(expect.objectContaining({ totalScenarios: 0, passedScenarios: 0, failedScenarios: 0, resilienceScore: 0, releaseDecision: 'BLOCKED' }))
  })
})
