const { eq } = require('drizzle-orm')

const MAX_OPERATION_EVIDENCE_RECORDS = 250

class AiTurnaroundEvidenceError extends Error {
  constructor(message, code, details = {}) {
    super(message)
    this.name = 'AiTurnaroundEvidenceError'
    this.code = code
    this.details = details
  }
}

function text(value, maxLength = 1200) {
  const normalized = String(value ?? '').trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function recordId(type, id) {
  return `${type}:${id}`
}

function statusPriority(status = '') {
  const normalized = String(status).toUpperCase()
  if (/RESOLVED|CLOSED|COMPLETE|COMPLETED|APPROVED/.test(normalized)) return 3
  if (/CRITICAL|EMERGENCY|FAILED|BLOCKED|OVERDUE|SHORTFALL|MISSING/.test(normalized)) return 0
  if (/AT_RISK|PENDING|NOT_STARTED|OPEN|ACTIVE/.test(normalized)) return 1
  if (/IN_PROGRESS|READY|REVIEW/.test(normalized)) return 2
  return 3
}

function buildTurnaroundEvidence(snapshot = {}, { maxRecords = MAX_OPERATION_EVIDENCE_RECORDS } = {}) {
  const operation = snapshot.operation
  if (!operation?.id) {
    throw new AiTurnaroundEvidenceError('Turnaround operation was not found.', 'AI_TURNAROUND_OPERATION_NOT_FOUND')
  }

  const records = []
  const add = record => {
    if (records.length < maxRecords) records.push(record)
  }

  add({
    id: recordId('operation', operation.id),
    type: 'data-quality',
    title: text(operation.title, 240) || 'Turnaround operation',
    status: text(operation.status, 80) || 'UNKNOWN',
    owner: null,
    details: text([
      operation.port ? `Port: ${operation.port}` : null,
      operation.turnaroundDate ? `Date: ${operation.turnaroundDate}` : null,
      operation.readinessLevel ? `Readiness: ${operation.readinessLevel}` : null,
      operation.notes
    ].filter(Boolean).join('. ')),
    departmentRole: 'TURNAROUND_MANAGER'
  })

  const candidates = [
    ...(snapshot.tasks || []).map(item => ({
      id: recordId('task', item.id), type: 'task', title: item.taskName, status: item.status,
      owner: item.ownerName, departmentRole: item.departmentRole,
      details: [item.blockerReason, item.dueTime ? `Due: ${item.dueTime}` : null, item.location ? `Location: ${item.location}` : null].filter(Boolean).join('. ')
    })),
    ...(snapshot.dependencies || []).map(item => ({
      id: recordId('dependency', item.id), type: 'dependency',
      title: `Task dependency ${item.dependencyType || 'BLOCKS'}`, status: item.status,
      owner: null, departmentRole: null,
      details: [item.notes, item.taskId ? `Task: ${item.taskId}` : null, item.dependsOnTaskId ? `Depends on: ${item.dependsOnTaskId}` : null].filter(Boolean).join('. ')
    })),
    ...(snapshot.handoffs || []).map(item => ({
      id: recordId('handoff', item.id), type: 'handoff', title: item.title, status: item.status,
      owner: item.ownerName, departmentRole: item.toDepartmentRole,
      details: [item.notes, item.fromDepartmentRole && item.toDepartmentRole ? `${item.fromDepartmentRole} to ${item.toDepartmentRole}` : null, item.dueTime ? `Due: ${item.dueTime}` : null].filter(Boolean).join('. ')
    })),
    ...(snapshot.staffing || []).map(item => {
      const shortfall = Math.max(Number(item.plannedCount || 0) - Number(item.checkedInCount || 0), 0)
      return {
        id: recordId('staffing', item.id), type: 'staffing', title: `${item.departmentRole} staffing`,
        status: shortfall > 0 ? 'SHORTFALL' : 'READY', owner: item.leadName, departmentRole: item.departmentRole,
        details: [`${item.checkedInCount || 0} of ${item.plannedCount || 0} checked in`, item.musterLocation ? `Muster: ${item.musterLocation}` : null, item.notes].filter(Boolean).join('. ')
      }
    }),
    ...(snapshot.signoffs || []).map(item => ({
      id: recordId('signoff', item.id), type: 'signoff', title: `${item.departmentRole} signoff`, status: item.status,
      owner: item.approverName, departmentRole: item.departmentRole, details: item.notes
    })),
    ...(snapshot.escalations || []).map(item => ({
      id: recordId('escalation', item.id), type: 'escalation', title: item.title,
      status: `${item.severity || ''} ${item.status || ''}`.trim() || 'UNKNOWN',
      owner: item.ownerName, departmentRole: item.departmentRole,
      details: [item.resolutionNotes, item.createdAt ? `Created: ${item.createdAt}` : null].filter(Boolean).join('. ')
    }))
  ]

  candidates
    .map(record => ({
      ...record,
      title: text(record.title, 240) || 'Operational evidence',
      status: text(record.status, 80) || 'UNKNOWN',
      owner: text(record.owner, 160),
      details: text(record.details),
      departmentRole: text(record.departmentRole, 100)
    }))
    .sort((a, b) => statusPriority(a.status) - statusPriority(b.status) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id))
    .forEach(add)

  return {
    operation,
    evidence: records,
    evidenceSummary: {
      totalAvailable: candidates.length + 1,
      included: records.length,
      truncated: candidates.length + 1 > records.length,
      countsByType: records.reduce((counts, record) => {
        counts[record.type] = (counts[record.type] || 0) + 1
        return counts
      }, {})
    }
  }
}

function createDefaultRepository() {
  const db = require('../db')
  const operationTable = require('../models/turnaroundOperation.model')
  const taskTable = require('../models/turnaroundTask.model')
  const dependencyTable = require('../models/turnaroundTaskDependency.model')
  const handoffTable = require('../models/turnaroundHandoff.model')
  const staffingTable = require('../models/turnaroundStaffing.model')
  const signoffTable = require('../models/turnaroundSignoff.model')
  const escalationTable = require('../models/turnaroundEscalation.model')

  return {
    async load(operationId) {
      const [operationRows, tasks, dependencies, handoffs, staffing, signoffs, escalations] = await Promise.all([
        db.select().from(operationTable).where(eq(operationTable.id, operationId)).limit(1),
        db.select().from(taskTable).where(eq(taskTable.operationId, operationId)),
        db.select().from(dependencyTable).where(eq(dependencyTable.operationId, operationId)),
        db.select().from(handoffTable).where(eq(handoffTable.operationId, operationId)),
        db.select().from(staffingTable).where(eq(staffingTable.operationId, operationId)),
        db.select().from(signoffTable).where(eq(signoffTable.operationId, operationId)),
        db.select().from(escalationTable).where(eq(escalationTable.operationId, operationId))
      ])
      return { operation: operationRows[0] || null, tasks, dependencies, handoffs, staffing, signoffs, escalations }
    }
  }
}

async function loadTurnaroundEvidence(operationId, { repository = createDefaultRepository(), maxRecords } = {}) {
  const normalizedId = text(operationId, 160)
  if (!normalizedId) {
    throw new AiTurnaroundEvidenceError('A turnaround operation ID is required.', 'AI_TURNAROUND_OPERATION_ID_REQUIRED')
  }
  const snapshot = await repository.load(normalizedId)
  return buildTurnaroundEvidence(snapshot, { maxRecords })
}

module.exports = {
  AiTurnaroundEvidenceError,
  MAX_OPERATION_EVIDENCE_RECORDS,
  buildTurnaroundEvidence,
  createDefaultRepository,
  loadTurnaroundEvidence,
  statusPriority
}
