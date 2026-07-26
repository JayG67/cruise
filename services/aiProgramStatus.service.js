const AI_PROGRAM_PHASES = Object.freeze([
  { phase: 1, name: 'AI foundation', status: 'IN_PROGRESS' },
  { phase: 2, name: 'Turnaround briefing', status: 'NOT_STARTED' },
  { phase: 3, name: 'Evaluation harness', status: 'NOT_STARTED' },
  { phase: 4, name: 'AI Quality Console', status: 'NOT_STARTED' },
  { phase: 5, name: 'Adversarial and resilience testing', status: 'NOT_STARTED' },
  { phase: 6, name: 'CI integration', status: 'NOT_STARTED' }
])

function getAiProgramStatus() {
  return {
    program: 'Cruise Fleet Operations AI Quality Program',
    currentPhase: 1,
    completedPhases: 0,
    phases: AI_PROGRAM_PHASES.map(phase => ({ ...phase })),
    phaseOneCapabilities: {
      providerAbstraction: true,
      deterministicTestProvider: true,
      structuredContracts: true,
      promptVersioning: true,
      evidenceGroundingValidation: true,
      roleAuthorizationBoundary: true,
      auditMetadata: true,
      productionModelProvider: false,
      userInterface: false
    }
  }
}

module.exports = { AI_PROGRAM_PHASES, getAiProgramStatus }
