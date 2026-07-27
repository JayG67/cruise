const { runEvaluationSuite } = require('./aiEvaluationHarness.service')
const { compareEvaluationRuns } = require('./aiEvaluationBaseline.service')
const { assessEvaluationRelease, normalizeReleaseRegressionPolicy } = require('./aiEvaluationReleasePolicy.service')

function assertUniqueVariantIds(variants) {
  const ids = variants.map(variant => variant?.variantId)
  if (ids.some(id => !id)) throw new TypeError('Every evaluation matrix variant requires a variantId.')
  if (new Set(ids).size !== ids.length) throw new TypeError('Evaluation matrix variant identifiers must be unique.')
}

function runEvaluationMatrix({
  suiteId = 'turnaround-briefing-phase3',
  cases,
  variants,
  baselineVariantId,
  policy = {}
} = {}) {
  if (!Array.isArray(variants) || variants.length < 2) throw new TypeError('Evaluation matrix requires at least two variants.')
  assertUniqueVariantIds(variants)

  const baselineId = baselineVariantId || variants[0].variantId
  if (!variants.some(variant => variant.variantId === baselineId)) throw new TypeError('The baseline variant must exist in the evaluation matrix.')

  const runs = variants.map(variant => {
    if (typeof variant.generateCandidate !== 'function') throw new TypeError(`Variant ${variant.variantId} requires generateCandidate.`)
    return {
      variantId: variant.variantId,
      provider: variant.provider || 'unknown',
      model: variant.model || 'unknown',
      promptVersion: variant.promptVersion || 'unknown',
      run: runEvaluationSuite({
        suiteId,
        cases,
        generateCandidate: variant.generateCandidate,
        options: variant.options || {},
        metadata: {
          variantId: variant.variantId,
          provider: variant.provider || 'unknown',
          model: variant.model || 'unknown',
          promptVersion: variant.promptVersion || 'unknown'
        }
      })
    }
  })

  const baseline = runs.find(item => item.variantId === baselineId)
  const comparisons = runs
    .filter(item => item.variantId !== baselineId)
    .map(item => ({
      variantId: item.variantId,
      ...compareEvaluationRuns({
        currentRun: item.run,
        baselineRun: baseline.run,
        policy: normalizeReleaseRegressionPolicy(policy)
      })
    }))

  const matrix = {
    suiteId,
    baselineVariantId: baselineId,
    variantCount: runs.length,
    caseCount: cases.length,
    variants: runs.map(item => ({
      variantId: item.variantId,
      provider: item.provider,
      model: item.model,
      promptVersion: item.promptVersion,
      runId: item.run.runId,
      passed: item.run.passed,
      passRate: item.run.passRate,
      averageScore: item.run.averageScore,
      failedCases: item.run.failedCases,
      run: item.run
    })),
    comparisons
  }

  return { ...matrix, releaseDecision: assessEvaluationRelease({ matrix, policy }) }
}

module.exports = { runEvaluationMatrix }
