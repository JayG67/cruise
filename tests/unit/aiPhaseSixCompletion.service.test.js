const { buildAiPhaseSixCompletion } = require('../../services/aiPhaseSixCompletion.service')
test('marks Phase 6 complete after CI evidence reaches the Quality Console', () => {
  expect(buildAiPhaseSixCompletion()).toEqual(expect.objectContaining({ phase: 6, status: 'COMPLETE', percentComplete: 100 }))
})
