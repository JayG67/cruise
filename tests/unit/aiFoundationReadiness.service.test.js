const {
  PHASE_ONE_FOUNDATION_CHECKS,
  assessAiFoundationReadiness,
  assertAiFoundationDeploymentSafe
} = require('../../services/aiFoundationReadiness.service')

describe('AI Phase 1 foundation readiness', () => {
  it('is deployment-safe with generation disabled by default', () => {
    const readiness = assessAiFoundationReadiness({ env: {} })

    expect(readiness).toEqual(expect.objectContaining({
      phase: 1,
      foundationReady: true,
      deploymentSafe: true,
      generationReady: false,
      runtimeConfigValid: true,
      pricingConfigValid: true
    }))
    expect(readiness.provider).toEqual(expect.objectContaining({
      name: 'disabled',
      generationEnabled: false
    }))
    expect(readiness.completedChecks).toEqual(PHASE_ONE_FOUNDATION_CHECKS)
    expect(readiness.guidance).toContain('safe to deploy')
  })

  it('reports deterministic generation as ready without external credentials', () => {
    const readiness = assessAiFoundationReadiness({ env: { AI_PROVIDER: 'deterministic' } })

    expect(readiness.deploymentSafe).toBe(true)
    expect(readiness.generationReady).toBe(true)
    expect(readiness.provider).toEqual(expect.objectContaining({
      name: 'deterministic',
      generationEnabled: true,
      credentialConfigured: true
    }))
  })

  it('keeps OpenAI deployment-safe but identifies missing generation credentials', () => {
    const readiness = assessAiFoundationReadiness({ env: { AI_PROVIDER: 'openai' } })

    expect(readiness.deploymentSafe).toBe(true)
    expect(readiness.generationReady).toBe(false)
    expect(readiness.issues).toContainEqual(expect.objectContaining({
      code: 'AI_PROVIDER_CREDENTIALS_MISSING',
      severity: 'configuration'
    }))
  })

  it('blocks deployment for invalid runtime configuration', () => {
    const readiness = assessAiFoundationReadiness({
      env: { AI_TIMEOUT_MS: 'not-a-number' }
    })

    expect(readiness.deploymentSafe).toBe(false)
    expect(readiness.issues).toContainEqual(expect.objectContaining({
      code: 'AI_RUNTIME_CONFIG_INVALID',
      severity: 'blocking'
    }))
    expect(() => assertAiFoundationDeploymentSafe({ env: { AI_TIMEOUT_MS: 'invalid' } }))
      .toThrow(expect.objectContaining({ code: 'AI_FOUNDATION_NOT_READY' }))
  })

  it('blocks deployment for an unsupported provider', () => {
    const readiness = assessAiFoundationReadiness({ env: { AI_PROVIDER: 'unknown-provider' } })

    expect(readiness.deploymentSafe).toBe(false)
    expect(readiness.issues).toContainEqual(expect.objectContaining({
      code: 'AI_PROVIDER_UNSUPPORTED'
    }))
  })

  it('reports invalid pricing as a blocking deployment issue', () => {
    const readiness = assessAiFoundationReadiness({
      env: { OPENAI_OUTPUT_USD_PER_MILLION_TOKENS: 'Infinity' }
    })

    expect(readiness.foundationReady).toBe(false)
    expect(readiness.deploymentSafe).toBe(false)
    expect(readiness.pricingConfigValid).toBe(false)
    expect(readiness.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AI_RUNTIME_CONFIG_INVALID', severity: 'blocking' })
    ]))
  })

  it('returns a successful deployment assertion for the default disabled provider', () => {
    expect(assertAiFoundationDeploymentSafe({ env: {} })).toEqual(expect.objectContaining({
      deploymentSafe: true,
      generationReady: false
    }))
  })

  it('reports configured OpenAI generation as ready when credentials are present', () => {
    const readiness = assessAiFoundationReadiness({
      env: { AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key' },
      fetchImpl: jest.fn()
    })

    expect(readiness.deploymentSafe).toBe(true)
    expect(readiness.generationReady).toBe(true)
    expect(readiness.provider).toEqual(expect.objectContaining({
      name: 'openai',
      generationEnabled: true,
      credentialConfigured: true
    }))
    expect(readiness.guidance).toContain('ready for provider calls')
  })

})
