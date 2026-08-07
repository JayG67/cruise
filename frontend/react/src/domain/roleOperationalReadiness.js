import { getBookingRoute } from './adminHierarchy.js'
import { getBookingItineraryDays } from './rolePassenger.js'
import { normalizeRole } from './roleIdentity.js'
import { getOperationalTasksForRole } from './roleOperationalAssignments.js'
import { getCommandCenterFallback, getContinuityCenterFallback } from './roleOperationalCommandCenters.js'

export function buildTurnaroundOperationCards(turnaroundOperations = [], roleView = '') {
  return turnaroundOperations.map(operation => {
    const tasks = getOperationalTasksForRole(operation, roleView)
    const shipName = operation.ship?.name || 'Ship unavailable'
    const sailingDate = operation.sailing?.departureDate || operation.turnaroundDate || 'Date unavailable'
    const departurePort = operation.sailing?.departurePort || operation.port || 'Departure port unavailable'
    const arrivalPort = operation.sailing?.arrivalPort || operation.port || 'Arrival port unavailable'

    const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
    const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
    const taskSummary = {
      totalTasks: tasks.length,
      completeTasks,
      blockedTasks,
      inProgressTasks,
      completionPercent: tasks.length === 0 ? 0 : Math.round((completeTasks / tasks.length) * 100)
    }

    return {
      id: operation.id || `${shipName}-${sailingDate}`,
      operation,
      tasks,
      taskSummary,
      passengerCount: Number(operation.passengerCount || 0),
      route: `${departurePort} → ${arrivalPort}`,
      shipName,
      sailingDate,
      turnaroundDate: operation.turnaroundDate || sailingDate,
      port: operation.port || arrivalPort,
      departurePort,
      arrivalPort,
      readinessLevel: operation.readinessLevel || 'Readiness pending',
      commandStatus: operation.commandStatus || operation.status || 'PLANNED',
      commandReadinessLevel: operation.commandReadinessLevel || operation.readinessLevel || 'Readiness pending',
      signoffs: Array.isArray(operation.signoffs) ? operation.signoffs : [],
      signoffSummary: operation.signoffSummary || { totalSignoffs: 0, approvedSignoffs: 0, blockedSignoffs: 0, pendingSignoffs: 0, approvalPercent: 0 },
      escalations: Array.isArray(operation.escalations) ? operation.escalations : [],
      staffing: Array.isArray(operation.staffing) ? operation.staffing : [],
      staffingSummary: operation.staffingSummary || { totalDepartments: 0, plannedCount: 0, checkedInCount: 0, gapCount: 0, checkInPercent: 0 },
      taskDependencies: Array.isArray(operation.taskDependencies) ? operation.taskDependencies : [],
      dependencySummary: operation.dependencySummary || { totalDependencies: 0, activeDependencies: 0, clearedDependencies: 0 },
      handoffs: Array.isArray(operation.handoffs) ? operation.handoffs : [],
      handoffSummary: operation.handoffSummary || { totalHandoffs: 0, completedHandoffs: 0, blockedHandoffs: 0, openHandoffs: 0 },
      escalationSummary: operation.escalationSummary || { totalEscalations: 0, openEscalations: 0, monitoringEscalations: 0, resolvedEscalations: 0, criticalEscalations: 0 },
      lifecycleState: operation.lifecycleState || null,
      releasePacket: operation.releasePacket || null,
      operationalMetrics: operation.operationalMetrics || null,
      playbookTemplate: operation.playbookTemplate || null,
      operationalTimeline: operation.operationalTimeline || [],
      varianceReport: operation.varianceReport || null,
      playbookVariance: operation.playbookVariance || null,
      incidentCommand: operation.incidentCommand || null,
      afterActionReview: operation.afterActionReview || null,
      executiveBrief: operation.executiveBrief || null,
      reviewerPacket: operation.reviewerPacket || null,
      outreachBoard: operation.outreachBoard || null,
      managementStatus: operation.managementStatus || null,
      launchPlan: operation.launchPlan || null,
      scenarioPlan: operation.scenarioPlan || null,
      productionReadiness: operation.productionReadiness || null,
      applicationDossier: operation.applicationDossier || null,
      closeoutPacket: operation.closeoutPacket || null,
      commandCenter: getCommandCenterFallback(operation, tasks, taskSummary),
      continuityCenter: getContinuityCenterFallback(operation, tasks, taskSummary),
      shiftBriefing: operation.shiftBriefing || null,
      goLiveCenter: operation.goLiveCenter || null,
      operationsControlBoard: operation.operationsControlBoard || null,
      status: operation.status || 'PLANNED',
      title: operation.title || 'Turnaround operation',
      notes: operation.notes || ''
    }
  }).sort((a, b) => String(a.turnaroundDate).localeCompare(String(b.turnaroundDate)))
}

export function buildTurnaroundReadinessBookings(bookings = []) {
  return bookings.map(booking => {
    const passengerCount = (booking.passengers || []).length
    const itineraryDays = getBookingItineraryDays(booking)
    const firstDay = itineraryDays[0] || {}
    const lastDay = itineraryDays[itineraryDays.length - 1] || {}
    const route = getBookingRoute(booking)
    const shipName = booking.ship?.name || 'Ship unavailable'
    const sailingDate = booking.sailing?.departureDate || booking.departureDate || 'Date unavailable'
    const departurePort = booking.embarkationPort || booking.sailing?.departurePort || firstDay.port || 'Departure port unavailable'
    const arrivalPort = booking.debarkationPort || booking.sailing?.arrivalPort || lastDay.port || 'Arrival port unavailable'
    const readinessLevel = passengerCount >= 2 || itineraryDays.length >= 3 ? 'High coordination' : 'Standard coordination'

    return {
      id: booking.id || booking.bookingId || `${shipName}-${sailingDate}`,
      booking,
      passengerCount,
      itineraryDayCount: itineraryDays.length,
      route,
      shipName,
      sailingDate,
      departurePort,
      arrivalPort,
      readinessLevel
    }
  }).sort((a, b) => String(a.sailingDate).localeCompare(String(b.sailingDate)))
}

