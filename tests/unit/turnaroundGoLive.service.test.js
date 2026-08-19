const fs = require('fs')
const path = require('path')
const {
  buildTurnaroundGoLiveCenter,
  buildGoLiveGates,
  buildGoLiveActions,
  buildGoLiveEvidence
} = require('../../services/turnaroundGoLive.service')

describe('turnaround go-live center service', () => {
  const reactTestHelpers = fs.readFileSync(path.join(__dirname, '../../cypress/react/support/reactTestHelpers.js'), 'utf8')

  const operation = {
    id: 'turnaround-1',
    title: 'Miami same-day turnaround',
    cruiseLineName: 'Royal Caribbean',
    shipName: 'Odyssey of the Seas',
    turnaroundDate: '2026-12-12'
  }

  it('keeps browser fallback go-live contracts production-oriented', () => {
    expect(reactTestHelpers).toContain("id: 'release-governance-ready'")
    expect(reactTestHelpers).toContain("id: 'service-assurance'")
    expect(reactTestHelpers).toContain("id: 'data-architecture-assurance'")
    expect(reactTestHelpers).not.toMatch(/reviewer-proof|Reviewer proof ready|Portfolio launch packaging|Production hardening|Data architecture hardening/)
  })

  it('builds a launch decision packet with gates, actions, evidence, and remaining scope', () => {
    const packet = buildTurnaroundGoLiveCenter({
      operation,
      tasks: [
        { id: 'task-1', status: 'COMPLETE' },
        { id: 'task-2', status: 'BLOCKED' },
        { id: 'task-3', status: 'COMPLETE' }
      ],
      signoffs: [
        { id: 'signoff-1', status: 'APPROVED' },
        { id: 'signoff-2', status: 'PENDING' }
      ],
      escalations: [{ id: 'esc-1', status: 'OPEN' }],
      dependencies: [{ id: 'dep-1', status: 'ACTIVE' }],
      handoffs: [{ id: 'handoff-1', status: 'OPEN' }],
      staffing: [{ departmentRole: 'Housekeeping Lead', plannedCount: 5, checkedInCount: 3 }],
      commandCenter: { summary: { commandScore: 82 } },
      continuityCenter: { continuityScore: 80 },
      shiftBriefing: { summary: { briefingScore: 78 } },
      closeoutPacket: { closeoutScore: 81 },
      productionReadiness: { readinessScore: 84 },
      launchPlan: { launchScore: 79 },
      applicationDossier: { dossierScore: 83 },
      releasePacket: { summary: { releaseScore: 86 } },
      lifecycleState: { completionPercent: 88 }
    })

    expect(packet.operationId).toBe('turnaround-1')
    expect(packet.headline).toContain('Odyssey of the Seas turnaround go-live')
    expect(packet.summary.goLiveScore).toBeGreaterThan(0)
    expect(packet.summary.goLiveStatus).toMatch(/NO_GO|GO_WITH_WATCH|READY_TO_LAUNCH/)
    expect(packet.gates).toHaveLength(6)
    expect(packet.actions.length).toBeGreaterThan(0)
    expect(packet.evidence).toHaveLength(5)
    expect(packet.remainingScope.map(item => item.id)).toEqual(['service-assurance', 'data-architecture-assurance', 'release-evidence'])

    expect(packet.gates.map(gate => gate.id)).toContain('release-governance-ready')
    expect(packet.evidence.map(item => item.id)).toContain('release-governance-evidence')
    expect(JSON.stringify(packet).toLowerCase()).not.toMatch(/reviewer|portfolio|hardening/)
  })

  it('promotes clean operations to launch-ready status with one freeze action', () => {
    const packet = buildTurnaroundGoLiveCenter({
      operation,
      tasks: [{ status: 'COMPLETE' }, { status: 'COMPLETE' }],
      signoffs: [{ status: 'APPROVED' }, { status: 'APPROVED' }],
      escalations: [{ status: 'RESOLVED' }],
      dependencies: [{ status: 'CLEARED' }],
      handoffs: [{ status: 'COMPLETE' }],
      staffing: [{ plannedCount: 4, checkedInCount: 4 }],
      commandCenter: { summary: { commandScore: 96 } },
      continuityCenter: { continuityScore: 95 },
      shiftBriefing: { summary: { briefingScore: 94 } },
      closeoutPacket: { closeoutScore: 96 },
      productionReadiness: { readinessScore: 97 },
      launchPlan: { launchScore: 95 },
      applicationDossier: { dossierScore: 96 },
      releasePacket: { summary: { releaseScore: 96 } },
      lifecycleState: { completionPercent: 98 }
    })

    expect(packet.summary.goLiveStatus).toBe('READY_TO_LAUNCH')
    expect(packet.summary.noGoCount).toBe(0)
    expect(packet.actions).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'launch-freeze', priority: 'LOW' })]))
  })

  it('keeps helper outputs bounded and operations-readable', () => {
    const gates = buildGoLiveGates({
      taskCompletion: 50,
      signoffCompletion: 50,
      lifecycleScore: 60,
      blockedTasks: 3,
      openEscalations: 2,
      activeDependencies: 2,
      shiftScore: 75,
      continuityScore: 75,
      productionScore: 70,
      releaseScore: 70,
      commandScore: 70,
      dossierScore: 70,
      launchScore: 70,
      closeoutScore: 70,
      completedTasks: 1,
      totalTasks: 2
    })
    const actions = buildGoLiveActions({ openHandoffs: 2, staffingGaps: 1 }, gates)
    const evidence = buildGoLiveEvidence({ taskCompletion: 50, signoffCompletion: 50, openEscalations: 2, activeDependencies: 2, shiftScore: 75, closeoutScore: 70, releaseScore: 70, productionScore: 70, commandScore: 70, dossierScore: 70, launchScore: 70 }, gates)

    expect(gates.every(gate => gate.score >= 0 && gate.score <= 100)).toBe(true)
    expect(actions.length).toBeLessThanOrEqual(8)
    expect(actions[0]).toEqual(expect.objectContaining({ owner: expect.any(String), action: expect.any(String) }))
    expect(evidence).toHaveLength(5)
  })
})

// Coverage hardening: authoritative zero evidence must never be replaced by neutral or secondary values.
describe('turnaround go-live authoritative evidence hardening', () => {
  const { buildGoLiveReadinessInputs } = require('../../services/turnaroundGoLive.service')

  it('preserves explicit zero scores across all go-live evidence sources', () => {
    const inputs = buildGoLiveReadinessInputs({
      operation: null,
      commandCenter: { summary: { commandScore: 0 }, commandScore: 95 },
      continuityCenter: { continuityScore: 0, summary: { continuityScore: 95 } },
      shiftBriefing: { summary: { briefingScore: 0 } },
      closeoutPacket: { closeoutScore: 0, summary: { closeoutScore: 95 } },
      productionReadiness: { readinessScore: 0, summary: { readinessScore: 95 } },
      launchPlan: { launchScore: 0, summary: { launchScore: 95 } },
      applicationDossier: { dossierScore: 0, summary: { dossierScore: 95 } },
      releasePacket: { summary: { releaseScore: 0 } },
      operationalMetrics: { summary: { releaseConfidence: 95 } },
      lifecycleState: { completionPercent: 0, summary: { completionPercent: 95 } }
    })

    expect(inputs).toEqual(expect.objectContaining({
      operationId: null,
      commandScore: 0,
      continuityScore: 0,
      shiftScore: 0,
      closeoutScore: 0,
      productionScore: 0,
      launchScore: 0,
      dossierScore: 0,
      releaseScore: 0,
      lifecycleScore: 0
    }))
  })

  it('uses secondary and neutral fallbacks only when primary evidence is absent', () => {
    const inputs = buildGoLiveReadinessInputs({
      commandCenter: { commandScore: 88 },
      continuityCenter: { summary: { continuityScore: 87 } },
      closeoutPacket: { summary: { closeoutScore: 86 } },
      productionReadiness: { summary: { readinessScore: 85 } },
      launchPlan: { summary: { launchScore: 84 } },
      applicationDossier: { summary: { dossierScore: 83 } },
      operationalMetrics: { summary: { releaseConfidence: 82 } },
      lifecycleState: { summary: { completionPercent: 81 } }
    })

    expect(inputs).toEqual(expect.objectContaining({
      commandScore: 88,
      continuityScore: 87,
      shiftScore: 72,
      closeoutScore: 86,
      productionScore: 85,
      launchScore: 84,
      dossierScore: 83,
      releaseScore: 82,
      lifecycleScore: 81
    }))
  })

  it('keeps an all-zero evidence packet in the no-go state instead of inflating it', () => {
    const packet = buildTurnaroundGoLiveCenter({
      operation: null,
      commandCenter: { summary: { commandScore: 0 } },
      continuityCenter: { continuityScore: 0 },
      shiftBriefing: { summary: { briefingScore: 0 } },
      closeoutPacket: { closeoutScore: 0 },
      productionReadiness: { readinessScore: 0 },
      launchPlan: { launchScore: 0 },
      applicationDossier: { dossierScore: 0 },
      releasePacket: { summary: { releaseScore: 0 } },
      lifecycleState: { completionPercent: 0 }
    })

    expect(packet.summary.goLiveStatus).toBe('NO_GO')
    expect(packet.summary.goLiveScore).toBe(17)
    expect(packet.headline).toContain('Ship pending')
  })
})

describe('turnaround go-live malformed evidence and terminal-state hardening', () => {
  const { buildGoLiveReadinessInputs } = require('../../services/turnaroundGoLive.service')

  it('treats equivalent terminal workflow statuses as closed evidence', () => {
    const inputs = buildGoLiveReadinessInputs({
      tasks: [{ status: ' completed ' }, { status: 'RESOLVED' }, { status: 'done' }],
      signoffs: [{ status: 'APPROVED' }],
      escalations: [{ status: ' closed ' }],
      dependencies: [{ status: 'completed' }, { status: 'CLEARED' }],
      handoffs: [{ status: ' resolved ' }]
    })

    expect(inputs).toMatchObject({
      completedTasks: 3,
      taskCompletion: 100,
      signoffCompletion: 100,
      openEscalations: 0,
      activeDependencies: 0,
      openHandoffs: 0
    })
  })

  it('fails non-finite scores and malformed staffing counts safe instead of inflating go-live readiness', () => {
    const inputs = buildGoLiveReadinessInputs({
      commandCenter: { summary: { commandScore: Infinity } },
      continuityCenter: { continuityScore: -Infinity },
      shiftBriefing: { summary: { briefingScore: 'bad' } },
      closeoutPacket: { closeoutScore: Infinity },
      productionReadiness: { readinessScore: Infinity },
      launchPlan: { launchScore: Infinity },
      applicationDossier: { dossierScore: Infinity },
      releasePacket: { summary: { releaseScore: Infinity } },
      lifecycleState: { completionPercent: Infinity },
      staffing: [
        { plannedCount: Infinity, checkedInCount: 1 },
        { plannedCount: 3.9, checkedInCount: -4 },
        { plannedCount: 'bad', checkedInCount: 5 }
      ]
    })

    expect(inputs).toMatchObject({
      commandScore: 0,
      continuityScore: 0,
      shiftScore: 0,
      closeoutScore: 0,
      productionScore: 0,
      launchScore: 0,
      dossierScore: 0,
      releaseScore: 0,
      lifecycleScore: 0,
      staffingGaps: 1
    })
    expect(JSON.stringify(inputs)).not.toMatch(/NaN|Infinity/)
  })

  it('keeps exported helpers and center safe for explicit null inputs', () => {
    expect(buildGoLiveGates(null)).toHaveLength(6)
    expect(buildGoLiveActions(null, null)).toEqual([
      expect.objectContaining({ id: 'launch-freeze', priority: 'LOW' })
    ])
    expect(buildGoLiveEvidence(null, null)).toHaveLength(5)

    const packet = buildTurnaroundGoLiveCenter(null)
    expect(packet.operationId).toBeNull()
    expect(packet.summary.goLiveStatus).toBe('NO_GO')
    expect(packet.headline).toContain('Ship pending')
  })
})
