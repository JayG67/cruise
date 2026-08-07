const { buildTurnaroundReleasePacket } = require('./turnaroundRelease.service')
const { buildTurnaroundOperationalTimeline } = require('./turnaroundTimeline.service')
const { buildTurnaroundOperationalMetrics } = require('./turnaroundMetrics.service')
const { buildTurnaroundPlaybookTemplate } = require('./turnaroundPlaybook.service')
const { buildTurnaroundPlaybookVariance } = require('./turnaroundVariance.service')
const { buildTurnaroundIncidentCommand } = require('./turnaroundIncident.service')
const { buildTurnaroundAfterActionReview } = require('./turnaroundAfterAction.service')
const { buildTurnaroundExecutiveBrief } = require('./turnaroundExecutiveBrief.service')
const { buildTurnaroundOperationalAssurance } = require('./turnaroundOperationalAssurance.service')
const { buildTurnaroundOperationalBriefingBoard } = require('./turnaroundOperationalBriefingBoard.service')
const { buildTurnaroundManagementStatus } = require('./turnaroundCompletion.service')
const { buildTurnaroundLifecycleState } = require('./turnaroundLifecycle.service')
const { buildTurnaroundLaunchPlan } = require('./turnaroundLaunchPlan.service')
const { buildTurnaroundScenarioPlan } = require('./turnaroundScenarioPlan.service')
const { buildTurnaroundProductionReadiness } = require('./turnaroundProductionReadiness.service')
const { buildTurnaroundOperationalReleaseDossier } = require('./turnaroundOperationalReleaseDossier.service')
const { buildTurnaroundOperationalReview } = require('./turnaroundOperationalReview.service')
const { buildTurnaroundCloseoutPacket } = require('./turnaroundCloseout.service')
const { buildTurnaroundCommandCenter } = require('./turnaroundCommandCenter.service')
const { buildTurnaroundContinuityCenter } = require('./turnaroundContinuity.service')
const { buildTurnaroundShiftBriefing } = require('./turnaroundShiftBriefing.service')
const { buildTurnaroundGoLiveCenter } = require('./turnaroundGoLive.service')
const { buildTurnaroundOperationsControlBoard } = require('./turnaroundOperationsControlBoard.service')

function buildTurnaroundOperationalArtifacts({
  operation,
  tasks = [],
  staffing = [],
  signoffs = [],
  escalations = [],
  dependencies = [],
  handoffs = [],
  auditEvents = [],
  passengerCount = 0
}) {
const releasePacket = buildTurnaroundReleasePacket({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents
})
const operationalTimeline = buildTurnaroundOperationalTimeline({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents
})
const operationalMetrics = buildTurnaroundOperationalMetrics({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  operationalTimeline,
  releasePacket,
  passengerCount
})
const lifecycleState = buildTurnaroundLifecycleState({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics
})
const playbookTemplate = buildTurnaroundPlaybookTemplate({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics,
  passengerCount
})
const playbookVariance = buildTurnaroundPlaybookVariance({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics,
  playbookTemplate
})
const incidentCommand = buildTurnaroundIncidentCommand({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics,
  operationalTimeline,
  playbookVariance
})
const afterActionReview = buildTurnaroundAfterActionReview({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  operationalTimeline,
  operationalMetrics,
  lifecycleState,
  playbookTemplate,
  playbookVariance,
  incidentCommand
})
const executiveBrief = buildTurnaroundExecutiveBrief({
  operation,
  releasePacket,
  operationalTimeline,
  operationalMetrics,
  lifecycleState,
  playbookTemplate,
  playbookVariance,
  incidentCommand,
  afterActionReview
})
const operationalAssurancePacket = buildTurnaroundOperationalAssurance({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  releasePacket,
  operationalTimeline,
  operationalMetrics,
  lifecycleState,
  playbookTemplate,
  playbookVariance,
  incidentCommand,
  afterActionReview,
  executiveBrief
})
const operationalBriefingBoard = buildTurnaroundOperationalBriefingBoard({
  operation,
  operationalAssurancePacket,
  executiveBrief,
  afterActionReview,
  incidentCommand
})
const managementStatus = buildTurnaroundManagementStatus({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  releasePacket,
  operationalTimeline,
  operationalMetrics,
  lifecycleState,
  playbookTemplate,
  playbookVariance,
  incidentCommand,
  afterActionReview,
  executiveBrief,
  reviewerPacket: operationalAssurancePacket,
  outreachBoard: operationalBriefingBoard
})
const launchPlan = buildTurnaroundLaunchPlan({
  operation,
  releasePacket,
  operationalMetrics,
  incidentCommand,
  afterActionReview,
  executiveBrief,
  reviewerPacket: operationalAssurancePacket,
  outreachBoard: operationalBriefingBoard,
  managementStatus
})
const scenarioPlan = buildTurnaroundScenarioPlan({
  operation,
  releasePacket,
  operationalMetrics,
  playbookVariance,
  incidentCommand,
  afterActionReview,
  launchPlan,
  managementStatus
})
const productionReadiness = buildTurnaroundProductionReadiness({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics,
  playbookVariance,
  incidentCommand,
  afterActionReview,
  executiveBrief,
  reviewerPacket: operationalAssurancePacket,
  outreachBoard: operationalBriefingBoard,
  managementStatus,
  launchPlan,
  scenarioPlan
})
const operationalReleaseDossier = buildTurnaroundOperationalReleaseDossier({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  releasePacket,
  operationalMetrics,
  playbookVariance,
  incidentCommand,
  afterActionReview,
  executiveBrief,
  operationalAssurancePacket,
  operationalBriefingBoard,
  managementStatus,
  launchPlan,
  scenarioPlan,
  productionReadiness
})

const operationalReviewGuide = buildTurnaroundOperationalReview({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  lifecycleState,
  releasePacket,
  operationalMetrics,
  executiveBrief,
  operationalAssurancePacket,
  managementStatus,
  launchPlan,
  productionReadiness,
  operationalReleaseDossier
})
const closeoutPacket = buildTurnaroundCloseoutPacket({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  lifecycleState,
  releasePacket,
  operationalTimeline,
  operationalMetrics,
  afterActionReview,
  executiveBrief,
  reviewerPacket: operationalAssurancePacket,
  managementStatus,
  launchPlan,
  scenarioPlan,
  productionReadiness,
  applicationDossier: operationalReleaseDossier,
  presentationGuide: operationalReviewGuide
})
const commandCenter = buildTurnaroundCommandCenter({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  auditEvents,
  lifecycleState,
  releasePacket,
  operationalMetrics,
  incidentCommand,
  managementStatus,
  closeoutPacket,
  passengerCount
})
const continuityCenter = buildTurnaroundContinuityCenter({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  lifecycleState,
  releasePacket,
  commandCenter,
  closeoutPacket,
  productionReadiness,
  passengerCount
})
const shiftBriefing = buildTurnaroundShiftBriefing({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics,
  commandCenter,
  continuityCenter,
  closeoutPacket
})
const goLiveCenter = buildTurnaroundGoLiveCenter({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  releasePacket,
  operationalMetrics,
  lifecycleState,
  commandCenter,
  continuityCenter,
  shiftBriefing,
  closeoutPacket,
  productionReadiness,
  launchPlan,
  applicationDossier: operationalReleaseDossier
})
const operationsControlBoard = buildTurnaroundOperationsControlBoard({
  operation,
  tasks: tasks,
  staffing: staffing,
  signoffs: signoffs,
  escalations: escalations,
  dependencies: dependencies,
  handoffs: handoffs,
  commandCenter,
  continuityCenter,
  shiftBriefing,
  goLiveCenter
})


  return {
    releasePacket,
    operationalTimeline,
    operationalMetrics,
    lifecycleState,
    playbookTemplate,
    playbookVariance,
    incidentCommand,
    afterActionReview,
    executiveBrief,
    operationalAssurancePacket,
    operationalBriefingBoard,
    managementStatus,
    launchPlan,
    scenarioPlan,
    productionReadiness,
    operationalReleaseDossier,
    operationalReviewGuide,
    closeoutPacket,
    commandCenter,
    continuityCenter,
    shiftBriefing,
    goLiveCenter,
    operationsControlBoard
  }
}

module.exports = { buildTurnaroundOperationalArtifacts }
