const { runOperationalEvidenceAdversarialSuite } = require('./aiOperationalEvidenceAdversarial.service')
const { runPromptInstructionAdversarialSuite } = require('./aiPromptInstructionAdversarial.service')
const { runProviderRuntimeAdversarialSuite } = require('./aiProviderRuntimeAdversarial.service')

function normalizeSuite(id, name, result) {
  return {
    id,
    name,
    totalScenarios: result.totalScenarios,
    passedScenarios: result.passedScenarios,
    failedScenarios: result.failedScenarios,
    resilienceScore: result.resilienceScore,
    releaseDecision: result.releaseDecision?.decision || (result.releaseDecision?.passed ? 'APPROVED' : 'BLOCKED'),
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
  return {
    phase: 5,
    status: failedScenarios === 0 ? 'READY' : 'BLOCKED',
    totalSuites: suites.length,
    totalScenarios,
    passedScenarios,
    failedScenarios,
    resilienceScore,
    releaseDecision: failedScenarios === 0 ? 'APPROVED' : 'BLOCKED',
    suites
  }
}

module.exports = { buildAiAdversarialQualitySummary }
