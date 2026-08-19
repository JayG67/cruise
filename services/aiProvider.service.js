const AI_PROVIDER_NAMES = Object.freeze({
  DISABLED: 'disabled',
  DETERMINISTIC: 'deterministic',
  OPENAI: 'openai'
})

class AiProviderError extends Error {
  constructor(message, code = 'AI_PROVIDER_ERROR', details = {}) {
    super(message)
    this.name = 'AiProviderError'
    this.code = code
    this.details = details
  }
}

function severityForEvidence(record = {}) {
  const status = String(record.status || '').toUpperCase()
  const descriptiveText = `${record.title || ''} ${record.details || ''}`.toUpperCase()
  const terminalPattern = /\b(?:RESOLVED|CLOSED|COMPLETE|COMPLETED|APPROVED)\b/
  const statusHasActiveRisk = /CRITICAL|EMERGENCY|BLOCKED|FAILED|OVERDUE|MISSING|PENDING|AT_RISK|NOT_STARTED|SHORTFALL/.test(status)

  if (terminalPattern.test(status)) return 'low'
  if (/CRITICAL|EMERGENCY/.test(status)) return 'critical'
  if (/BLOCKED|FAILED|OVERDUE|MISSING/.test(status)) return 'high'
  if (/PENDING|AT_RISK|NOT_STARTED|SHORTFALL/.test(status)) return 'medium'
  if (!statusHasActiveRisk && terminalPattern.test(descriptiveText)) return 'low'
  if (/CRITICAL|EMERGENCY/.test(descriptiveText)) return 'critical'
  if (/BLOCKED|FAILED|OVERDUE|MISSING/.test(descriptiveText)) return 'high'
  if (/PENDING|AT_RISK|NOT_STARTED|SHORTFALL/.test(descriptiveText)) return 'medium'
  return 'low'
}

function categoryForEvidence(record = {}) {
  const type = String(record.type || '').toLowerCase()
  const allowed = ['task', 'dependency', 'handoff', 'staffing', 'signoff', 'escalation']
  return allowed.includes(type) ? type : 'data-quality'
}

function riskRank(level) {
  return { low: 0, medium: 1, high: 2, critical: 3 }[level] ?? 0
}

function createDeterministicAiProvider({ now = () => new Date() } = {}) {
  return {
    name: AI_PROVIDER_NAMES.DETERMINISTIC,
    model: 'deterministic-rule-engine-v1',
    async generateStructured({ prompt }) {
      const evidence = Array.isArray(prompt?.user?.evidence) ? prompt.user.evidence : []
      const actionable = evidence
        .map(record => ({ record, severity: severityForEvidence(record) }))
        .filter(item => item.severity !== 'low')
        .sort((left, right) => riskRank(right.severity) - riskRank(left.severity))

      const findings = actionable.slice(0, 12).map(({ record, severity }) => ({
        category: categoryForEvidence(record),
        severity,
        title: record.title,
        explanation: record.details || `${record.title} is currently ${record.status || 'not fully resolved'}.`,
        evidenceIds: [record.id],
        recommendedAction: `Review ${record.id} with ${record.owner || record.departmentRole || 'the assigned operational owner'} before release.`
      }))

      const highestRisk = findings.reduce(
        (current, finding) => riskRank(finding.severity) > riskRank(current) ? finding.severity : current,
        'low'
      )

      return {
        output: {
          summary: findings.length
            ? `${findings.length} evidence-backed operational item${findings.length === 1 ? '' : 's'} require review.`
            : 'No active blockers were identified in the supplied evidence.',
          riskLevel: highestRisk,
          findings,
          unknowns: evidence.length ? [] : ['No operational evidence was supplied.'],
          generatedAt: now().toISOString()
        },
        usage: {
          inputTokens: JSON.stringify(prompt).length,
          outputTokens: JSON.stringify(findings).length
        }
      }
    }
  }
}

function createDisabledAiProvider() {
  return {
    name: AI_PROVIDER_NAMES.DISABLED,
    model: 'not-configured',
    async generateStructured() {
      throw new AiProviderError(
        'AI generation is not configured. Set AI_PROVIDER=deterministic for controlled local evaluation or configure an approved production provider.',
        'AI_PROVIDER_NOT_CONFIGURED'
      )
    }
  }
}

function createAiProvider({ providerName = process.env.AI_PROVIDER, now, env = process.env, fetchImpl } = {}) {
  const normalizedName = String(providerName || AI_PROVIDER_NAMES.DISABLED).trim().toLowerCase()
  if (normalizedName === AI_PROVIDER_NAMES.DETERMINISTIC) return createDeterministicAiProvider({ now })
  if (normalizedName === AI_PROVIDER_NAMES.OPENAI) {
    const { createOpenAiResponsesProvider } = require('./openAiResponsesProvider.service')
    return createOpenAiResponsesProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      baseUrl: env.OPENAI_BASE_URL,
      fetchImpl,
      pricing: require('./aiCostEstimation.service').getAiPricingConfig(env)
    })
  }
  if (normalizedName === AI_PROVIDER_NAMES.DISABLED) return createDisabledAiProvider()
  throw new AiProviderError(`Unsupported AI provider: ${normalizedName}`, 'AI_PROVIDER_UNSUPPORTED', { providerName: normalizedName })
}

module.exports = {
  AI_PROVIDER_NAMES,
  AiProviderError,
  categoryForEvidence,
  createAiProvider,
  createDeterministicAiProvider,
  createDisabledAiProvider,
  riskRank,
  severityForEvidence
}
