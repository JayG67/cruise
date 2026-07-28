const { buildAiPhaseSixReadiness } = require('./aiPhaseSixReadiness.service')
const { getAiProgramStatus } = require('./aiProgramStatus.service')

function buildAiPhaseSixCompletion() {
  const readiness = buildAiPhaseSixReadiness()
  const status = getAiProgramStatus()
  const complete = readiness.status === 'COMPLETE' && readiness.percentComplete === 100 && status.phaseSixCapabilities.phaseSixComplete
  return {
    phase: 6,
    name: 'CI integration',
    status: complete ? 'COMPLETE' : 'INCOMPLETE',
    percentComplete: complete ? 100 : readiness.percentComplete,
    completionCriteria: readiness.completedCapabilities.length,
    completedCapabilities: readiness.completedCapabilities
  }
}
module.exports = { buildAiPhaseSixCompletion }
