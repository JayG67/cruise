const { buildAiPhaseSixCompletion, normalizePercent } = require('../../services/aiPhaseSixCompletion.service')

test('marks Phase 6 complete after CI evidence reaches the Quality Console', () => {
  expect(buildAiPhaseSixCompletion()).toEqual(expect.objectContaining({ phase: 6, status: 'COMPLETE', percentComplete: 100 }))
})

test('normalizes Phase 6 completion percentages safely', () => {
  expect(normalizePercent('72.6')).toBe(73)
  expect(normalizePercent(120)).toBe(100)
  expect(normalizePercent(-4)).toBe(0)
  expect(normalizePercent('not-a-number')).toBe(0)
})

test('fails closed when Phase 6 readiness or program status evidence is malformed', () => {
  jest.resetModules()
  jest.doMock('../../services/aiPhaseSixReadiness.service', () => ({
    buildAiPhaseSixReadiness: () => ({ status: 'COMPLETE', percentComplete: 'not-a-number', completedCapabilities: null })
  }))
  jest.doMock('../../services/aiProgramStatus.service', () => ({
    getAiProgramStatus: () => ({})
  }))

  const isolated = require('../../services/aiPhaseSixCompletion.service')
  expect(isolated.buildAiPhaseSixCompletion()).toEqual({
    phase: 6,
    name: 'CI integration',
    status: 'INCOMPLETE',
    percentComplete: 0,
    completionCriteria: 0,
    completedCapabilities: []
  })

  jest.dontMock('../../services/aiPhaseSixReadiness.service')
  jest.dontMock('../../services/aiProgramStatus.service')
})
