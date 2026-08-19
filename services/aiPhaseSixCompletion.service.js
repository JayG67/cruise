const { buildAiPhaseSixReadiness } = require('./aiPhaseSixReadiness.service')
const { getAiProgramStatus } = require('./aiProgramStatus.service')

function normalizePercent(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, Math.min(100, Math.round(numericValue))) : 0
}

function buildAiPhaseSixCompletion() {
  const readiness = buildAiPhaseSixReadiness() || {}
  const status = getAiProgramStatus() || {}
  const percentComplete = normalizePercent(readiness.percentComplete)
  const completedCapabilities = Array.isArray(readiness.completedCapabilities) ? readiness.completedCapabilities : []
  const complete = readiness.status === 'COMPLETE'
    && percentComplete === 100
    && status?.phaseSixCapabilities?.phaseSixComplete === true

  return {
    phase: 6,
    name: 'CI integration',
    status: complete ? 'COMPLETE' : 'INCOMPLETE',
    percentComplete: complete ? 100 : percentComplete,
    completionCriteria: completedCapabilities.length,
    completedCapabilities
  }
}

module.exports = { buildAiPhaseSixCompletion, normalizePercent }
