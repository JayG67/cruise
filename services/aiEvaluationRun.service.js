const { listAuditEvents, recordAuditEvent } = require('./auditEvent.service')

const EVALUATION_RUN_EVENT = 'AI_EVALUATION_RUN_RECORDED'
const EVALUATION_ENTITY_TYPE = 'AI_EVALUATION_SUITE'

function mapEvaluationRunEvent(event = {}) {
  const payload = event.eventPayload || {}
  return {
    ...payload,
    auditEventId: event.id || null,
    recordedAt: event.createdAt || payload.completedAt || null
  }
}

async function recordEvaluationRun({ run, actor, auditRecorder = recordAuditEvent } = {}) {
  if (!run?.runId || !run?.suiteId) throw new TypeError('A completed evaluation run is required.')
  await auditRecorder({
    eventType: EVALUATION_RUN_EVENT,
    entityType: EVALUATION_ENTITY_TYPE,
    entityId: run.suiteId,
    actorUserId: actor?.actorUserId || null,
    actorDisplayName: actor?.actorDisplayName || null,
    source: 'AI',
    eventPayload: run
  })
  return run
}

async function listEvaluationRuns({ suiteId = 'turnaround-briefing-phase3', limit = 20, auditEventLister = listAuditEvents } = {}) {
  const events = await auditEventLister({
    eventType: EVALUATION_RUN_EVENT,
    entityType: EVALUATION_ENTITY_TYPE,
    entityId: suiteId,
    source: 'AI'
  }, { limit })
  const runs = events.map(mapEvaluationRunEvent)
  return { suiteId, count: runs.length, runs }
}

async function getEvaluationRun(runId, options = {}) {
  if (!runId) return null
  const { runs } = await listEvaluationRuns({ ...options, limit: 100 })
  return runs.find(run => run.runId === runId) || null
}

module.exports = {
  EVALUATION_ENTITY_TYPE,
  EVALUATION_RUN_EVENT,
  getEvaluationRun,
  listEvaluationRuns,
  mapEvaluationRunEvent,
  recordEvaluationRun
}
