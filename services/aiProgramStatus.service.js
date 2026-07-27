const AI_PROGRAM_PHASES = Object.freeze([
  { phase: 1, name: 'AI foundation', status: 'COMPLETE' },
  { phase: 2, name: 'Turnaround briefing', status: 'IN_PROGRESS' },
  { phase: 3, name: 'Evaluation harness', status: 'NOT_STARTED' },
  { phase: 4, name: 'AI Quality Console', status: 'NOT_STARTED' },
  { phase: 5, name: 'Adversarial and resilience testing', status: 'NOT_STARTED' },
  { phase: 6, name: 'CI integration', status: 'NOT_STARTED' }
])

function getAiProgramStatus() {
  return {
    program: 'Cruise Fleet Operations AI Quality Program',
    currentPhase: 2,
    completedPhases: 1,
    currentPhasePercentComplete: 60,
    phases: AI_PROGRAM_PHASES.map(phase => ({ ...phase })),
    phaseOneCapabilities: {
      providerAbstraction: true,
      deterministicTestProvider: true,
      structuredContracts: true,
      promptVersioning: true,
      evidenceGroundingValidation: true,
      roleAuthorizationBoundary: true,
      auditMetadata: true,
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
    },
    phaseTwoCapabilities: {
      operationScopedEvidenceLoading: true,
      taskEvidenceMapping: true,
      dependencyEvidenceMapping: true,
      handoffEvidenceMapping: true,
      staffingEvidenceMapping: true,
      signoffEvidenceMapping: true,
      escalationEvidenceMapping: true,
      riskPrioritizedEvidenceSelection: true,
      tenantScopedAuthorization: true,
      operationBriefingApi: true,
      briefingWorkspace: false,
      briefingHistory: true,
      reviewerFeedback: true
    }
  }
}

module.exports = { AI_PROGRAM_PHASES, getAiProgramStatus }
