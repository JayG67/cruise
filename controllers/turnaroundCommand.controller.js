const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const db = require('../db')
const { canAccessTurnaroundOperationForRequest, sendTurnaroundOperationForbidden } = require('../services/turnaroundScope.service')
const { buildTurnaroundHistoryPayload, mergeTurnaroundEntity, recordTurnaroundAuditEvent } = require('../services/turnaroundMutationSupport.service')
const { eq } = require('drizzle-orm')

function createTurnaroundCommandController({ getTurnaroundOperationDetails }) {
  if (typeof getTurnaroundOperationDetails !== 'function') {
    throw new TypeError('getTurnaroundOperationDetails is required')
  }

  const controller = {}

  controller.updateTurnaroundOperationCommand = async (req, res, next) => {
    try {
      const { id } = req.params
      const allowedFields = ['status', 'readinessLevel', 'port', 'notes']
      const operationUpdates = {}

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          operationUpdates[field] = req.body[field] || null
        }
      }

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

      if (Object.keys(operationUpdates).length === 0) {
        return res.status(400).json({ message: 'At least one turnaround command field is required' })
      }

      await db
        .update(turnaroundOperationTable)
        .set(operationUpdates)
        .where(eq(turnaroundOperationTable.id, id))

      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_COMMAND_UPDATED',
        entityType: 'TURNAROUND_OPERATION',
        entityId: id,
        eventPayload: buildTurnaroundHistoryPayload({
          operation,
          previous: {
            status: operation.status,
            readinessLevel: operation.readinessLevel,
            port: operation.port,
            notes: operation.notes
          },
          next: mergeTurnaroundEntity({
            status: operation.status,
            readinessLevel: operation.readinessLevel,
            port: operation.port,
            notes: operation.notes
          }, operationUpdates),
          entityRefs: { turnaroundOperationId: id },
          metadata: { action: 'update-command-plan' }
        })
      })

      const refreshedOperationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, id))
        .limit(1)

      return res.status(200).json({
        message: 'Turnaround command plan updated successfully',
        operation: await getTurnaroundOperationDetails(refreshedOperationRows[0] || operation)
      })
    } catch (err) {
      next(err)
    }
  }

  return controller
}

module.exports = { createTurnaroundCommandController }
