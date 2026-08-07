const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundEscalationTable = require('../models/turnaroundEscalation.model')
const db = require('../db')
const { canAccessTurnaroundOperationForRequest, sendTurnaroundOperationForbidden } = require('../services/turnaroundScope.service')
const { buildTurnaroundHistoryPayload, mergeTurnaroundEntity, recordTurnaroundAuditEvent, resolveOperationalUserIdByName } = require('../services/turnaroundMutationSupport.service')
const { eq } = require('drizzle-orm')

function createTurnaroundEscalationController({ getTurnaroundOperationDetails }) {
  if (typeof getTurnaroundOperationDetails !== 'function') {
    throw new TypeError('getTurnaroundOperationDetails is required')
  }

  const controller = {}

  controller.createTurnaroundEscalation = async (req, res, next) => {
    try {
      const { id } = req.params
      const { departmentRole, severity = 'WATCH', title, ownerName, status = 'OPEN', resolutionNotes } = req.body

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, id))
        .limit(1)

      const operation = operationRows[0]

      if (!operation) {
        return res.status(404).json({ message: 'Turnaround operation not found' })
      }

      if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      await db
        .insert(turnaroundEscalationTable)
        .values({
          operationId: id,
          departmentRole,
          severity,
          title,
          ownerName: ownerName || null,
          ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
          status,
          resolutionNotes: resolutionNotes || null,
          createdAt: new Date().toISOString()
        })

      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_ESCALATION_CREATED',
        entityType: 'TURNAROUND_ESCALATION',
        entityId: id,
        eventPayload: buildTurnaroundHistoryPayload({
          operation,
          previous: null,
          next: {
            operationId: id,
            departmentRole,
            severity,
            title,
            ownerName: ownerName || null,
            ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
            status,
            resolutionNotes: resolutionNotes || null
          },
          entityRefs: { departmentRole },
          metadata: { action: 'create-escalation' }
        })
      })

      return res.status(201).json({
        message: 'Turnaround escalation created successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.updateTurnaroundEscalation = async (req, res, next) => {
    try {
      const { id } = req.params
      const allowedFields = ['severity', 'title', 'ownerName', 'status', 'resolutionNotes']
      const escalationUpdates = {}

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          escalationUpdates[field] = req.body[field] || null
        }
      }

      const escalationRows = await db
        .select()
        .from(turnaroundEscalationTable)
        .where(eq(turnaroundEscalationTable.id, id))
        .limit(1)

      const escalation = escalationRows[0]

      if (!escalation) {
        return res.status(404).json({ message: 'Turnaround escalation not found' })
      }

      if (Object.keys(escalationUpdates).length === 0) {
        return res.status(400).json({ message: 'At least one turnaround escalation field is required' })
      }

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, escalation.operationId))
        .limit(1)

      const operation = operationRows[0]

      if (operation && !(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
        escalationUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
      }

      await db
        .update(turnaroundEscalationTable)
        .set(escalationUpdates)
        .where(eq(turnaroundEscalationTable.id, id))

      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_ESCALATION_UPDATED',
        entityType: 'TURNAROUND_ESCALATION',
        entityId: id,
        eventPayload: buildTurnaroundHistoryPayload({
          operation,
          previous: escalation,
          next: mergeTurnaroundEntity(escalation, escalationUpdates),
          entityRefs: { escalationId: id, departmentRole: escalation.departmentRole },
          metadata: { action: 'update-escalation' }
        })
      })

      return res.status(200).json({
        message: 'Turnaround escalation updated successfully',
        operation: operation ? await getTurnaroundOperationDetails(operation) : undefined
      })
    } catch (err) {
      next(err)
    }
  }

  return controller
}

module.exports = { createTurnaroundEscalationController }
