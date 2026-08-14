jest.mock('../../services/turnaroundRelease.service', () => ({ buildTurnaroundReleasePacket: jest.fn(input => ({ artifact: 'buildTurnaroundReleasePacket', input })) }))
jest.mock('../../services/turnaroundTimeline.service', () => ({ buildTurnaroundOperationalTimeline: jest.fn(input => ({ artifact: 'buildTurnaroundOperationalTimeline', input })) }))
jest.mock('../../services/turnaroundMetrics.service', () => ({ buildTurnaroundOperationalMetrics: jest.fn(input => ({ artifact: 'buildTurnaroundOperationalMetrics', input })) }))
jest.mock('../../services/turnaroundPlaybook.service', () => ({ buildTurnaroundPlaybookTemplate: jest.fn(input => ({ artifact: 'buildTurnaroundPlaybookTemplate', input })) }))
jest.mock('../../services/turnaroundVariance.service', () => ({ buildTurnaroundPlaybookVariance: jest.fn(input => ({ artifact: 'buildTurnaroundPlaybookVariance', input })) }))
jest.mock('../../services/turnaroundIncident.service', () => ({ buildTurnaroundIncidentCommand: jest.fn(input => ({ artifact: 'buildTurnaroundIncidentCommand', input })) }))
jest.mock('../../services/turnaroundAfterAction.service', () => ({ buildTurnaroundAfterActionReview: jest.fn(input => ({ artifact: 'buildTurnaroundAfterActionReview', input })) }))
jest.mock('../../services/turnaroundExecutiveBrief.service', () => ({ buildTurnaroundExecutiveBrief: jest.fn(input => ({ artifact: 'buildTurnaroundExecutiveBrief', input })) }))
jest.mock('../../services/turnaroundOperationalAssurance.service', () => ({ buildTurnaroundOperationalAssurance: jest.fn(input => ({ artifact: 'buildTurnaroundOperationalAssurance', input })) }))
jest.mock('../../services/turnaroundOperationalBriefingBoard.service', () => ({ buildTurnaroundOperationalBriefingBoard: jest.fn(input => ({ artifact: 'buildTurnaroundOperationalBriefingBoard', input })) }))
jest.mock('../../services/turnaroundCompletion.service', () => ({ buildTurnaroundManagementStatus: jest.fn(input => ({ artifact: 'buildTurnaroundManagementStatus', input })) }))
jest.mock('../../services/turnaroundLifecycle.service', () => ({ buildTurnaroundLifecycleState: jest.fn(input => ({ artifact: 'buildTurnaroundLifecycleState', input })) }))
jest.mock('../../services/turnaroundLaunchPlan.service', () => ({ buildTurnaroundLaunchPlan: jest.fn(input => ({ artifact: 'buildTurnaroundLaunchPlan', input })) }))
jest.mock('../../services/turnaroundScenarioPlan.service', () => ({ buildTurnaroundScenarioPlan: jest.fn(input => ({ artifact: 'buildTurnaroundScenarioPlan', input })) }))
jest.mock('../../services/turnaroundProductionReadiness.service', () => ({ buildTurnaroundProductionReadiness: jest.fn(input => ({ artifact: 'buildTurnaroundProductionReadiness', input })) }))
jest.mock('../../services/turnaroundOperationalReleaseDossier.service', () => ({ buildTurnaroundOperationalReleaseDossier: jest.fn(input => ({ artifact: 'buildTurnaroundOperationalReleaseDossier', input })) }))
jest.mock('../../services/turnaroundOperationalReview.service', () => ({ buildTurnaroundOperationalReview: jest.fn(input => ({ artifact: 'buildTurnaroundOperationalReview', input })) }))
jest.mock('../../services/turnaroundCloseout.service', () => ({ buildTurnaroundCloseoutPacket: jest.fn(input => ({ artifact: 'buildTurnaroundCloseoutPacket', input })) }))
jest.mock('../../services/turnaroundCommandCenter.service', () => ({ buildTurnaroundCommandCenter: jest.fn(input => ({ artifact: 'buildTurnaroundCommandCenter', input })) }))
jest.mock('../../services/turnaroundContinuity.service', () => ({ buildTurnaroundContinuityCenter: jest.fn(input => ({ artifact: 'buildTurnaroundContinuityCenter', input })) }))
jest.mock('../../services/turnaroundShiftBriefing.service', () => ({ buildTurnaroundShiftBriefing: jest.fn(input => ({ artifact: 'buildTurnaroundShiftBriefing', input })) }))
jest.mock('../../services/turnaroundGoLive.service', () => ({ buildTurnaroundGoLiveCenter: jest.fn(input => ({ artifact: 'buildTurnaroundGoLiveCenter', input })) }))
jest.mock('../../services/turnaroundOperationsControlBoard.service', () => ({ buildTurnaroundOperationsControlBoard: jest.fn(input => ({ artifact: 'buildTurnaroundOperationsControlBoard', input })) }))

const { buildTurnaroundOperationalArtifacts } = require('../../services/turnaroundOperationalArtifacts.service')

describe('turnaround operational artifact orchestration branch coverage', () => {
  test('uses safe defaults when optional operational collections are omitted', () => {
    const result = buildTurnaroundOperationalArtifacts({ operation: { id: 'OP-1' } })

    expect(result.releasePacket).toEqual(expect.objectContaining({ artifact: 'buildTurnaroundReleasePacket' }))
    expect(result.operationalMetrics.input).toEqual(expect.objectContaining({
      tasks: [], staffing: [], signoffs: [], escalations: [], dependencies: [], handoffs: [], auditEvents: [], passengerCount: 0
    }))
  })

  test('propagates explicitly supplied operational evidence through the artifact chain', () => {
    const input = {
      operation: { id: 'OP-2' },
      tasks: [{ id: 'T1' }],
      staffing: [{ id: 'S1' }],
      signoffs: [{ id: 'SO1' }],
      escalations: [{ id: 'E1' }],
      dependencies: [{ id: 'D1' }],
      handoffs: [{ id: 'H1' }],
      auditEvents: [{ id: 'A1' }],
      passengerCount: 42
    }
    const result = buildTurnaroundOperationalArtifacts(input)

    expect(result.releasePacket.input).toEqual(expect.objectContaining({
      operation: input.operation,
      tasks: input.tasks,
      staffing: input.staffing,
      signoffs: input.signoffs,
      escalations: input.escalations,
      dependencies: input.dependencies,
      handoffs: input.handoffs,
      auditEvents: input.auditEvents
    }))
    expect(result.releasePacket.input).not.toHaveProperty('passengerCount')
    expect(result.operationalMetrics.input.passengerCount).toBe(42)
    expect(result.commandCenter.input.passengerCount).toBe(42)
    expect(result.continuityCenter.input.passengerCount).toBe(42)
    expect(result.operationsControlBoard).toEqual(expect.objectContaining({ artifact: 'buildTurnaroundOperationsControlBoard' }))
  })
})
