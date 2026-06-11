function normalizeTimelineDate(value, fallback = null) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toISOString()
}

function normalizeTimelineStatus(value, fallback = 'INFO') {
  return String(value || fallback).trim().toUpperCase()
}

function timelineActor(...values) {
  return values.find(value => String(value || '').trim().length > 0) || 'System actor'
}

function timelineDetail(...values) {
  return values.find(value => String(value || '').trim().length > 0) || null
}

function addTimelineItem(items, item) {
  if (!item?.id || !item?.title) return
  items.push({
    id: item.id,
    source: item.source || 'OPERATION',
    sourceId: item.sourceId || null,
    severity: normalizeTimelineStatus(item.severity, 'INFO'),
    status: normalizeTimelineStatus(item.status, 'INFO'),
    title: item.title,
    actorDisplayName: item.actorDisplayName || 'System actor',
    detail: item.detail || null,
    occurredAt: normalizeTimelineDate(item.occurredAt, null),
    dueTime: item.dueTime || null,
    departmentRole: item.departmentRole || null,
    sortWeight: Number(item.sortWeight || 0)
  })
}

function buildTurnaroundOperationalTimeline({ operation = {}, tasks = [], staffing = [], signoffs = [], escalations = [], dependencies = [], handoffs = [], auditEvents = [] } = {}) {
  const items = []
  const operationDate = operation.turnaroundDate ? `${operation.turnaroundDate}T00:00:00.000Z` : null

  addTimelineItem(items, {
    id: `operation:${operation.id || 'pending'}`,
    source: 'COMMAND',
    sourceId: operation.id || null,
    severity: operation.status === 'BLOCKED' ? 'CRITICAL' : 'INFO',
    status: operation.status || 'PLANNED',
    title: `${operation.port || 'Port'} turnaround command plan`,
    actorDisplayName: 'Command center',
    detail: operation.notes || operation.readinessLevel || 'Turnaround command plan is active.',
    occurredAt: operationDate,
    sortWeight: 10
  })

  for (const task of tasks || []) {
    addTimelineItem(items, {
      id: `task:${task.id}`,
      source: 'TASK',
      sourceId: task.id,
      severity: task.status === 'BLOCKED' ? 'CRITICAL' : task.status === 'COMPLETE' ? 'SUCCESS' : 'ACTION',
      status: task.status || 'READY',
      title: task.taskName || 'Turnaround task',
      actorDisplayName: timelineActor(task.ownerDisplayName, task.ownerName),
      detail: timelineDetail(task.blockerReason, task.location, task.dueTime ? `Due ${task.dueTime}` : null),
      occurredAt: task.updatedAt || task.createdAt || operationDate,
      dueTime: task.dueTime || null,
      departmentRole: task.departmentRole || null,
      sortWeight: task.status === 'BLOCKED' ? 90 : 40
    })

    for (const update of task.updates || []) {
      addTimelineItem(items, {
        id: `task-update:${update.id || `${task.id}:${update.createdAt}`}`,
        source: 'TASK_UPDATE',
        sourceId: task.id,
        severity: update.updateType === 'BLOCKER' ? 'CRITICAL' : 'INFO',
        status: update.updateType || 'NOTE',
        title: `${task.taskName || 'Task'} update`,
        actorDisplayName: timelineActor(update.authorDisplayName, update.authorName),
        detail: update.message || null,
        occurredAt: update.createdAt || operationDate,
        departmentRole: task.departmentRole || null,
        sortWeight: update.updateType === 'BLOCKER' ? 95 : 55
      })
    }
  }

  for (const row of staffing || []) {
    const plannedCount = Number(row.plannedCount || 0)
    const checkedInCount = Number(row.checkedInCount || 0)
    addTimelineItem(items, {
      id: `staffing:${row.id || row.departmentRole}`,
      source: 'STAFFING',
      sourceId: row.id || null,
      severity: plannedCount > checkedInCount ? 'ACTION' : 'SUCCESS',
      status: plannedCount > checkedInCount ? 'GAP' : 'COVERED',
      title: `${row.departmentRole || 'Department'} staffing coverage`,
      actorDisplayName: timelineActor(row.leadDisplayName, row.leadName),
      detail: `${checkedInCount}/${plannedCount} checked in${row.musterLocation ? ` at ${row.musterLocation}` : ''}`,
      occurredAt: row.updatedAt || operationDate,
      departmentRole: row.departmentRole || null,
      sortWeight: plannedCount > checkedInCount ? 80 : 30
    })
  }

  for (const signoff of signoffs || []) {
    addTimelineItem(items, {
      id: `signoff:${signoff.id || signoff.departmentRole}`,
      source: 'SIGNOFF',
      sourceId: signoff.id || null,
      severity: signoff.status === 'APPROVED' ? 'SUCCESS' : signoff.status === 'BLOCKED' ? 'CRITICAL' : 'ACTION',
      status: signoff.status || 'PENDING',
      title: `${signoff.departmentRole || 'Department'} readiness signoff`,
      actorDisplayName: timelineActor(signoff.approverDisplayName, signoff.approverName),
      detail: signoff.notes || null,
      occurredAt: signoff.signedAt || operationDate,
      departmentRole: signoff.departmentRole || null,
      sortWeight: signoff.status === 'APPROVED' ? 20 : 75
    })
  }

  for (const dependency of dependencies || []) {
    addTimelineItem(items, {
      id: `dependency:${dependency.id || `${dependency.taskId}:${dependency.dependsOnTaskId}`}`,
      source: 'DEPENDENCY',
      sourceId: dependency.id || null,
      severity: dependency.status === 'CLEARED' ? 'SUCCESS' : 'ACTION',
      status: dependency.status || 'ACTIVE',
      title: `${dependency.taskName || 'Task'} dependency`,
      actorDisplayName: 'Operations coordination',
      detail: `Waiting on ${dependency.dependsOnTaskName || dependency.dependsOnTaskId || 'prerequisite task'}`,
      occurredAt: dependency.updatedAt || operationDate,
      departmentRole: dependency.departmentRole || null,
      sortWeight: dependency.status === 'CLEARED' ? 15 : 70
    })
  }

  for (const escalation of escalations || []) {
    addTimelineItem(items, {
      id: `escalation:${escalation.id}`,
      source: 'ESCALATION',
      sourceId: escalation.id,
      severity: escalation.severity || 'WATCH',
      status: escalation.status || 'OPEN',
      title: escalation.title || 'Turnaround escalation',
      actorDisplayName: timelineActor(escalation.ownerDisplayName, escalation.ownerName),
      detail: escalation.resolutionNotes || `${escalation.severity || 'WATCH'} escalation is ${escalation.status || 'open'}.`,
      occurredAt: escalation.createdAt || operationDate,
      departmentRole: escalation.departmentRole || null,
      sortWeight: escalation.status === 'RESOLVED' ? 25 : 100
    })
  }

  for (const handoff of handoffs || []) {
    addTimelineItem(items, {
      id: `handoff:${handoff.id}`,
      source: 'HANDOFF',
      sourceId: handoff.id,
      severity: handoff.status === 'COMPLETE' ? 'SUCCESS' : handoff.status === 'BLOCKED' ? 'CRITICAL' : 'ACTION',
      status: handoff.status || 'PENDING',
      title: handoff.title || 'Department handoff',
      actorDisplayName: timelineActor(handoff.ownerDisplayName, handoff.ownerName),
      detail: handoff.notes || (handoff.dueTime ? `Due ${handoff.dueTime}` : null),
      occurredAt: handoff.completedAt || operationDate,
      dueTime: handoff.dueTime || null,
      departmentRole: handoff.departmentRole || null,
      sortWeight: handoff.status === 'COMPLETE' ? 20 : 65
    })
  }

  for (const event of auditEvents || []) {
    addTimelineItem(items, {
      id: `audit:${event.id || `${event.eventType}:${event.createdAt}`}`,
      source: 'AUDIT',
      sourceId: event.id || null,
      severity: 'INFO',
      status: event.eventType || 'AUDIT_EVENT',
      title: String(event.eventType || 'Audit event').replace(/_/g, ' ').toLowerCase(),
      actorDisplayName: timelineActor(event.actorDisplayName),
      detail: event.entityType ? `${event.entityType}${event.entityId ? ` ${event.entityId}` : ''}` : null,
      occurredAt: event.createdAt || operationDate,
      sortWeight: 35
    })
  }

  const sortedItems = items.sort((a, b) => {
    const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0
    const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0
    if (bTime !== aTime) return bTime - aTime
    return Number(b.sortWeight || 0) - Number(a.sortWeight || 0)
  })

  const criticalCount = sortedItems.filter(item => ['CRITICAL', 'BLOCKED'].includes(item.severity) || item.status === 'BLOCKED').length
  const actionCount = sortedItems.filter(item => ['ACTION', 'WATCH'].includes(item.severity) || ['PENDING', 'OPEN', 'GAP', 'ACTIVE'].includes(item.status)).length
  const successCount = sortedItems.filter(item => item.severity === 'SUCCESS' || ['COMPLETE', 'APPROVED', 'CLEARED', 'COVERED', 'RESOLVED'].includes(item.status)).length

  return {
    operationId: operation.id || null,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEvents: sortedItems.length,
      criticalCount,
      actionCount,
      successCount,
      latestEventAt: sortedItems.find(item => item.occurredAt)?.occurredAt || null
    },
    items: sortedItems.slice(0, 24)
  }
}

module.exports = {
  buildTurnaroundOperationalTimeline,
  normalizeTimelineDate,
  normalizeTimelineStatus
}
