const { runOperationalEvidenceAdversarialSuite } = require('./aiOperationalEvidenceAdversarial.service')
const { runPromptInstructionAdversarialSuite } = require('./aiPromptInstructionAdversarial.service')
const { runProviderRuntimeAdversarialSuite } = require('./aiProviderRuntimeAdversarial.service')

function toNonNegativeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

function normalizeSuite(id, name, result = {}) {
  const totalScenarios = toNonNegativeNumber(result.totalScenarios)
  const failedScenarios = toNonNegativeNumber(result.failedScenarios)
  const explicitDecision = String(result.releaseDecision?.decision || '').trim().toUpperCase()
  const releaseApproved = failedScenarios === 0 && (explicitDecision === 'APPROVED' || result.releaseDecision?.passed === true)
  return {
    id,
    name,
    totalScenarios,
    passedScenarios: toNonNegativeNumber(result.passedScenarios),
    failedScenarios,
    resilienceScore: totalScenarios > 0 ? Math.min(100, toNonNegativeNumber(result.resilienceScore)) : 0,
    releaseDecision: releaseApproved ? 'APPROVED' : 'BLOCKED',
    findings: (result.results || []).flatMap(item => item.findings || []).slice(0, 10)
  }
}

function buildAiAdversarialQualitySummary() {
  const suites = [
    normalizeSuite('operational-evidence', 'Operational evidence attacks', runOperationalEvidenceAdversarialSuite()),
    normalizeSuite('prompt-instruction', 'Prompt and instruction attacks', runPromptInstructionAdversarialSuite()),
    normalizeSuite('provider-runtime', 'Provider and runtime resilience', runProviderRuntimeAdversarialSuite({ metadata: { evaluatedAt: 'quality-console' } }))
  ]
  const totalScenarios = suites.reduce((sum, suite) => sum + suite.totalScenarios, 0)
  const passedScenarios = suites.reduce((sum, suite) => sum + suite.passedScenarios, 0)
  const failedScenarios = suites.reduce((sum, suite) => sum + suite.failedScenarios, 0)
  const resilienceScore = totalScenarios ? Math.round((passedScenarios / totalScenarios) * 100) : 0
  const releaseApproved = failedScenarios === 0 && suites.every(suite => suite.releaseDecision === 'APPROVED')
  return {
    phase: 5,
    status: releaseApproved ? 'READY' : 'BLOCKED',
    totalSuites: suites.length,
    totalScenarios,
    passedScenarios,
    failedScenarios,
    resilienceScore,
    releaseDecision: releaseApproved ? 'APPROVED' : 'BLOCKED',
    suites
  }
}

module.exports = { buildAiAdversarialQualitySummary }
