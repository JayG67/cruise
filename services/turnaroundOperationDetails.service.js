const cruiseLineTable = require('../models/cruiseline.model')
const shipTable = require('../models/ship.model')
const sailingTable = require('../models/sailing.model')
const bookingTable = require('../models/booking.model')
const bookingPassengerTable = require('../models/bookingPassenger.model')
const appUserTable = require('../models/appUser.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundTaskUpdateTable = require('../models/turnaroundTaskUpdate.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const turnaroundStaffingTable = require('../models/turnaroundStaffing.model')
const turnaroundTaskDependencyTable = require('../models/turnaroundTaskDependency.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')
const db = require('../db')
const { listAuditEventsForOperation } = require('./auditEvent.service')
const { buildTurnaroundOperationalArtifacts } = require('./turnaroundOperationalArtifacts.service')
const { eq, inArray } = require('drizzle-orm')

async function buildAppUserDisplayLookup(userIds = []) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))]
  if (!uniqueUserIds.length) return new Map()

  const userRows = await db
    .select()
    .from(appUserTable)
    .where(inArray(appUserTable.id, uniqueUserIds))

  return new Map(userRows.map(user => [user.id, user.displayName]))
}

function enrichOperationalPerson(row = {}, userDisplayById = new Map(), userIdField, displayField) {
  if (!row) return row

  const userId = row[userIdField]
  const displayName = userId ? userDisplayById.get(userId) : null

  return {
    ...row,
    [displayField]: displayName || row[displayField] || row.ownerName || row.authorName || row.approverName || row.leadName || null
  }
}

async function getPassengerCountForSailing(sailingId) {
  const bookingRows = await db
    .select()
    .from(bookingTable)
    .where(eq(bookingTable.sailingId, sailingId))

  let passengerCount = 0

  for (const booking of bookingRows || []) {
    const passengerRows = await db
      .select()
      .from(bookingPassengerTable)
      .where(eq(bookingPassengerTable.bookingId, booking.id))

    passengerCount += passengerRows.length
  }

  return passengerCount
}


function getTurnaroundProgress(tasks = []) {
  const totalTasks = tasks.length
  const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
  const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length

  return {
    totalTasks,
    completeTasks,
    blockedTasks,
    inProgressTasks,
    completionPercent: totalTasks === 0 ? 0 : Math.round((completeTasks / totalTasks) * 100)
  }
}


function getTurnaroundSignoffSummary(signoffs = []) {
  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffs.filter(signoff => signoff.status === 'APPROVED').length
  const blockedSignoffs = signoffs.filter(signoff => signoff.status === 'BLOCKED').length
  const pendingSignoffs = signoffs.filter(signoff => signoff.status === 'PENDING').length

  return {
    totalSignoffs,
    approvedSignoffs,
    blockedSignoffs,
    pendingSignoffs,
    approvalPercent: totalSignoffs === 0 ? 0 : Math.round((approvedSignoffs / totalSignoffs) * 100)
  }
}

function getTurnaroundEscalationSummary(escalations = []) {
  const totalEscalations = escalations.length
  const openEscalations = escalations.filter(escalation => escalation.status === 'OPEN').length
  const monitoringEscalations = escalations.filter(escalation => escalation.status === 'MONITORING').length
  const resolvedEscalations = escalations.filter(escalation => escalation.status === 'RESOLVED').length
  const criticalEscalations = escalations.filter(escalation => escalation.severity === 'CRITICAL' && escalation.status !== 'RESOLVED').length

  return {
    totalEscalations,
    openEscalations,
    monitoringEscalations,
    resolvedEscalations,
    criticalEscalations
  }
}


function getTurnaroundStaffingSummary(staffing = []) {
  const plannedCount = staffing.reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
  const checkedInCount = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)
  const gapCount = Math.max(plannedCount - checkedInCount, 0)

  return {
    totalDepartments: staffing.length,
    plannedCount,
    checkedInCount,
    gapCount,
    checkInPercent: plannedCount === 0 ? 0 : Math.round((checkedInCount / plannedCount) * 100)
  }
}

function getDerivedTurnaroundReadinessLevel(tasks = [], signoffs = [], escalations = []) {
  const progress = getTurnaroundProgress(tasks)
  const signoffSummary = getTurnaroundSignoffSummary(signoffs)
  const escalationSummary = getTurnaroundEscalationSummary(escalations)

  if (progress.blockedTasks > 0 || signoffSummary.blockedSignoffs > 0 || escalationSummary.criticalEscalations > 0) return 'Blocked'
  if (progress.totalTasks > 0 && progress.completeTasks === progress.totalTasks && signoffSummary.totalSignoffs > 0 && signoffSummary.approvedSignoffs === signoffSummary.totalSignoffs) return 'Ready for embarkation'
  if (progress.inProgressTasks > 0 || progress.completeTasks > 0 || signoffSummary.approvedSignoffs > 0) return 'In progress'

  return 'Planning'
}

function getDerivedTurnaroundStatus(tasks = [], escalations = []) {
  const progress = getTurnaroundProgress(tasks)
  const escalationSummary = getTurnaroundEscalationSummary(escalations)

  if (progress.blockedTasks > 0 || escalationSummary.criticalEscalations > 0) return 'BLOCKED'
  if (progress.totalTasks > 0 && progress.completeTasks === progress.totalTasks) return 'COMPLETE'
  if (progress.inProgressTasks > 0 || progress.completeTasks > 0) return 'IN_PROGRESS'

  return 'PLANNED'
}

function getTurnaroundDependencySummary(dependencies = []) {
  const activeDependencies = dependencies.filter(dependency => dependency.status !== 'CLEARED').length
  const clearedDependencies = dependencies.filter(dependency => dependency.status === 'CLEARED').length

  return {
    totalDependencies: dependencies.length,
    activeDependencies,
    clearedDependencies
  }
}

function getTurnaroundHandoffSummary(handoffs = []) {
  const completedHandoffs = handoffs.filter(handoff => handoff.status === 'COMPLETE').length
  const blockedHandoffs = handoffs.filter(handoff => handoff.status === 'BLOCKED').length

  return {
    totalHandoffs: handoffs.length,
    completedHandoffs,
    blockedHandoffs,
    openHandoffs: Math.max(handoffs.length - completedHandoffs, 0)
  }
}

async function getTurnaroundOperationDetails(operation) {
  const sailingRows = await db
    .select()
    .from(sailingTable)
    .where(eq(sailingTable.id, operation.sailingId))
    .limit(1)

  const sailing = sailingRows[0] || null
  let ship = null
  let cruiseLine = null

  if (sailing?.shipId) {
    const shipRows = await db
      .select()
      .from(shipTable)
      .where(eq(shipTable.id, sailing.shipId))
      .limit(1)

    ship = shipRows[0] || null

    if (ship?.cruiseLineId) {
      const cruiseLineRows = await db
        .select()
        .from(cruiseLineTable)
        .where(eq(cruiseLineTable.id, ship.cruiseLineId))
        .limit(1)

      cruiseLine = cruiseLineRows[0] || null
    }
  }

  const tasks = await db
    .select()
    .from(turnaroundTaskTable)
    .where(eq(turnaroundTaskTable.operationId, operation.id))

  const signoffs = await db
    .select()
    .from(turnaroundSignoffTable)
    .where(eq(turnaroundSignoffTable.operationId, operation.id))

  const escalations = await db
    .select()
    .from(turnaroundEscalationTable)
    .where(eq(turnaroundEscalationTable.operationId, operation.id))

  const staffing = await db
    .select()
    .from(turnaroundStaffingTable)
    .where(eq(turnaroundStaffingTable.operationId, operation.id))

  const taskDependencies = await db
    .select()
    .from(turnaroundTaskDependencyTable)
    .where(eq(turnaroundTaskDependencyTable.operationId, operation.id))

  const handoffs = await db
    .select()
    .from(turnaroundHandoffTable)
    .where(eq(turnaroundHandoffTable.operationId, operation.id))

  const taskUpdateRowsByTaskId = new Map()
  const operationalUserIds = [
    ...(tasks || []).map(task => task.ownerUserId),
    ...(signoffs || []).map(signoff => signoff.approverUserId),
    ...(escalations || []).map(escalation => escalation.ownerUserId),
    ...(handoffs || []).map(handoff => handoff.ownerUserId)
  ]

  for (const task of tasks || []) {
    const updates = await db
      .select()
      .from(turnaroundTaskUpdateTable)
      .where(eq(turnaroundTaskUpdateTable.taskId, task.id))

    taskUpdateRowsByTaskId.set(task.id, updates || [])
    operationalUserIds.push(...(updates || []).map(update => update.authorUserId))
  }

  const userDisplayById = await buildAppUserDisplayLookup(operationalUserIds)

  const sortedSignoffs = [...(signoffs || [])]
    .map(signoff => enrichOperationalPerson(signoff, userDisplayById, 'approverUserId', 'approverDisplayName'))
    .sort((a, b) => String(a.departmentRole).localeCompare(String(b.departmentRole)))
  const sortedEscalations = [...(escalations || [])]
    .map(escalation => enrichOperationalPerson(escalation, userDisplayById, 'ownerUserId', 'ownerDisplayName'))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const sortedStaffing = [...(staffing || [])].sort((a, b) => String(a.departmentRole).localeCompare(String(b.departmentRole)))
  const sortedTaskDependencies = [...(taskDependencies || [])].sort((a, b) => String(a.status).localeCompare(String(b.status)))
  const sortedHandoffs = [...(handoffs || [])]
    .map(handoff => enrichOperationalPerson(handoff, userDisplayById, 'ownerUserId', 'ownerDisplayName'))
    .sort((a, b) => String(a.dueTime || '').localeCompare(String(b.dueTime || '')))

  const sortedTasks = []

  for (const task of [...(tasks || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))) {
    const updates = taskUpdateRowsByTaskId.get(task.id) || []

    sortedTasks.push({
      ...enrichOperationalPerson(task, userDisplayById, 'ownerUserId', 'ownerDisplayName'),
      updates: [...updates]
        .map(update => enrichOperationalPerson(update, userDisplayById, 'authorUserId', 'authorDisplayName'))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    })
  }

  const taskNameById = new Map(sortedTasks.map(task => [task.id, task.taskName]))
  const enrichedDependencies = sortedTaskDependencies.map(dependency => ({
    ...dependency,
    taskName: taskNameById.get(dependency.taskId) || 'Unknown task',
    dependsOnTaskName: taskNameById.get(dependency.dependsOnTaskId) || 'Unknown prerequisite'
  }))
  const auditEvents = await listAuditEventsForOperation(operation.id, { limit: 8 })
  const passengerCount = await getPassengerCountForSailing(operation.sailingId)
  const operationalArtifacts = buildTurnaroundOperationalArtifacts({
    operation,
    tasks: sortedTasks,
    staffing: sortedStaffing,
    signoffs: sortedSignoffs,
    escalations: sortedEscalations,
    dependencies: enrichedDependencies,
    handoffs: sortedHandoffs,
    auditEvents,
    passengerCount
  })

  const {
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
  } = operationalArtifacts

  return {
    ...operation,
    commandStatus: operation.status,
    commandReadinessLevel: operation.readinessLevel,
    status: getDerivedTurnaroundStatus(sortedTasks, sortedEscalations),
    readinessLevel: getDerivedTurnaroundReadinessLevel(sortedTasks, sortedSignoffs, sortedEscalations),
    signoffs: sortedSignoffs,
    signoffSummary: getTurnaroundSignoffSummary(sortedSignoffs),
    escalations: sortedEscalations,
    escalationSummary: getTurnaroundEscalationSummary(sortedEscalations),
    staffing: sortedStaffing,
    staffingSummary: getTurnaroundStaffingSummary(sortedStaffing),
    taskDependencies: enrichedDependencies,
    dependencySummary: getTurnaroundDependencySummary(enrichedDependencies),
    handoffs: sortedHandoffs,
    handoffSummary: getTurnaroundHandoffSummary(sortedHandoffs),
    sailing,
    ship,
    cruiseLine,
    passengerCount,
    taskSummary: getTurnaroundProgress(sortedTasks),
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
    outreachBoard: operationalBriefingBoard,
    managementStatus,
    launchPlan,
    scenarioPlan,
    productionReadiness,
    applicationDossier: operationalReleaseDossier,
    presentationGuide: operationalReviewGuide,
    closeoutPacket,
    commandCenter,
    continuityCenter,
    shiftBriefing,
    goLiveCenter,
    operationsControlBoard,
    auditEvents,
    tasks: sortedTasks
  }
}

module.exports = { getTurnaroundOperationDetails }
