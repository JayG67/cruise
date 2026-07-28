const { AI_PROGRAM_PHASES, getAiProgramStatus } = require('../../services/aiProgramStatus.service')

describe('AI program status', () => {
  it('reports all six phases in stable order on every development step', () => {
    const status = getAiProgramStatus()
    expect(status.phases).toHaveLength(6)
    expect(status.phases.map(phase => phase.phase)).toEqual([1, 2, 3, 4, 5, 6])
    expect(status.currentPhase).toBe(6)
    expect(status.completedPhases).toBe(5)
    expect(status.currentPhasePercentComplete).toBe(25)
    expect(status.phases[0]).toEqual({ phase: 1, name: 'AI foundation', status: 'COMPLETE' })
    expect(status.phases[1]).toEqual({ phase: 2, name: 'Turnaround briefing', status: 'COMPLETE' })
    expect(status.phases[2]).toEqual({ phase: 3, name: 'Evaluation harness', status: 'COMPLETE' })
    expect(status.phases[3]).toEqual({ phase: 4, name: 'AI Quality Console', status: 'COMPLETE' })
    expect(status.phases[4]).toEqual({ phase: 5, name: 'Adversarial and resilience testing', status: 'COMPLETE' })
    expect(status.phases[5]).toEqual({ phase: 6, name: 'CI integration', status: 'IN_PROGRESS' })
  })

  it('returns defensive phase copies and explicit Phase 1 and Phase 2 capability status', () => {
    const first = getAiProgramStatus()
    first.phases[0].status = 'BROKEN'
    const second = getAiProgramStatus()

    expect(second.phases).toEqual(AI_PROGRAM_PHASES)
    expect(second.phaseOneCapabilities).toEqual(expect.objectContaining({
      providerAbstraction: true,
      structuredContracts: true,
      evidenceGroundingValidation: true,
      persistentAuditEvents: true,
      timeoutEnforcement: true,
      transientRetryPolicy: true,
      validatedRuntimeConfiguration: true,
      productionModelProvider: true,
      providerCredentialValidation: true,
      strictStructuredOutputTranslation: true,
      normalizedUsageTelemetry: true,
      configurableCostEstimation: true,
      correlatedTelemetryLogging: true,
      productionConfigurationDocumentation: true,
      foundationArchitectureAudit: true,
      deploymentReadinessAssessment: true,
      completionAudit: true,
      phaseOneComplete: true,
      contextSizeLimit: true,
      userInterface: false
    }))
    expect(second.phaseTwoCapabilities).toEqual(expect.objectContaining({
      operationScopedEvidenceLoading: true,
      riskPrioritizedEvidenceSelection: true,
      tenantScopedAuthorization: true,
      operationBriefingApi: true,
      briefingHistory: true,
      reviewerFeedback: true,
      briefingWorkspace: true
    }))
    expect(second.phaseThreeCapabilities).toEqual(expect.objectContaining({
      reusableEvaluationCases: true,
      deterministicBriefingEvaluator: true,
      evaluationSuiteRunner: true,
      persistentRunStorage: true,
      baselineComparison: true,
      evaluationApi: true,
      qualityConsoleIntegration: true,
      completionAudit: true,
      phaseThreeComplete: true
    }))
    expect(second.phaseFourCapabilities).toEqual(expect.objectContaining({
      releaseReadinessSummary: true,
      evaluationHistoryTable: true,
      trendAnalysis: true,
      providerModelPromptMetadata: true,
      failedCaseDrilldown: true,
      recurringFailureSummary: true,
      baselineSelection: true,
      runComparison: true,
      releasePolicyControls: true,
      historyFiltering: true,
      historySorting: true,
      phaseFourComplete: true
    }))
    expect(second.phaseFiveCapabilities).toEqual(expect.objectContaining({
      adversarialScenarioContract: true,
      reusableScenarioCatalog: true,
      deterministicScenarioExecution: true,
      resilienceScoring: true,
      diagnosticFindings: true,
      adversarialSuiteRunner: true,
      architectureAudit: true,
      operationalEvidenceAttacks: true,
      tenantIsolationAttackCoverage: true,
      qualityConsoleIntegration: true,
      browserWorkflowCoverage: true,
      completionAudit: true,
      phaseFiveComplete: true
    }))
    expect(second.phaseSixCapabilities).toEqual(expect.objectContaining({
      ciQualityGate: true,
      phaseAuditExecution: true,
      targetedAiRegressionExecution: true,
      machineReadableEvidence: true,
      alwaysPublishEvidence: true,
      jobSummaryReporting: true,
      phaseSixComplete: false
    }))
  })
})
