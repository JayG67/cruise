const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundStaffingTable = require('../models/turnaroundStaffing.model')
const turnaroundSignoffTable = require('../models/turnaroundSignoff.model')
const turnaroundHandoffTable = require('../models/turnaroundHandoff.model')
const db = require('../db')
const { canAccessTurnaroundOperationForRequest, sendTurnaroundOperationForbidden } = require('../services/turnaroundScope.service')
const { buildTurnaroundHistoryPayload, mergeTurnaroundEntity, recordTurnaroundAuditEvent, resolveOperationalUserIdByName } = require('../services/turnaroundMutationSupport.service')
const { and, eq } = require('drizzle-orm')
const normalizeCount = value => { const number = Number(value); return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0 }

function createTurnaroundWorkforceController({ getTurnaroundOperationDetails }) {
  if (typeof getTurnaroundOperationDetails !== 'function') {
    throw new TypeError('getTurnaroundOperationDetails is required')
  }

  const controller = {}

  controller.updateTurnaroundStaffing = async (req, res, next) => {
    try {
      const { id, departmentRole } = req.params
      const { plannedCount, checkedInCount, leadName, musterLocation, notes } = req.body

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

      const staffingValues = {
        plannedCount: normalizeCount(plannedCount),
        checkedInCount: normalizeCount(checkedInCount),
        leadName: leadName || null,
        musterLocation: musterLocation || null,
        notes: notes || null
      }

      const existingStaffing = await db
        .select()
        .from(turnaroundStaffingTable)
        .where(and(
          eq(turnaroundStaffingTable.operationId, id),
          eq(turnaroundStaffingTable.departmentRole, departmentRole)
        ))
        .limit(1)

      let staffingId = existingStaffing[0]?.id || null
      if (existingStaffing[0]) {
        const updatedStaffing = await db.update(turnaroundStaffingTable).set(staffingValues).where(eq(turnaroundStaffingTable.id, staffingId)).returning({ id: turnaroundStaffingTable.id })
        if (!updatedStaffing[0]) return res.status(404).json({ message: 'Turnaround staffing plan not found' })
      } else {
        const createdStaffing = await db.insert(turnaroundStaffingTable).values({ operationId: id, departmentRole, ...staffingValues }).returning({ id: turnaroundStaffingTable.id })
        if (!createdStaffing[0]) return res.status(500).json({ message: 'Turnaround staffing plan could not be created' })
        staffingId = createdStaffing[0].id
      }

      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_STAFFING_UPDATED',
        entityType: 'TURNAROUND_STAFFING',
        entityId: staffingId,
        eventPayload: buildTurnaroundHistoryPayload({
          operation,
          previous: existingStaffing[0] || null,
          next: mergeTurnaroundEntity(existingStaffing[0] || { operationId: id, departmentRole }, staffingValues),
          entityRefs: { staffingId, departmentRole },
          metadata: { action: existingStaffing[0] ? 'update-staffing' : 'create-staffing' }
        })
      })

      return res.status(200).json({
        message: 'Turnaround staffing plan updated successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.updateTurnaroundSignoff = async (req, res, next) => {
    try {
      const { id, departmentRole } = req.params
      const { status, approverName, notes } = req.body

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

      const existingSignoffs = await db
        .select()
        .from(turnaroundSignoffTable)
        .where(and(
          eq(turnaroundSignoffTable.operationId, id),
          eq(turnaroundSignoffTable.departmentRole, departmentRole)
        ))
        .limit(1)

      const signoffValues = {
        approverName,
        approverUserId: await resolveOperationalUserIdByName(approverName, operation),
        status,
        notes: notes || null,
        signedAt: status === 'PENDING' ? null : new Date().toISOString()
      }

      let signoffId = existingSignoffs[0]?.id || null
      if (existingSignoffs[0]) {
        const updatedSignoffs = await db.update(turnaroundSignoffTable).set(signoffValues).where(eq(turnaroundSignoffTable.id, signoffId)).returning({ id: turnaroundSignoffTable.id })
        if (!updatedSignoffs[0]) return res.status(404).json({ message: 'Turnaround signoff not found' })
      } else {
        const createdSignoffs = await db.insert(turnaroundSignoffTable).values({ operationId: id, departmentRole, ...signoffValues }).returning({ id: turnaroundSignoffTable.id })
        if (!createdSignoffs[0]) return res.status(500).json({ message: 'Turnaround signoff could not be created' })
        signoffId = createdSignoffs[0].id
      }

      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_SIGNOFF_UPDATED',
        entityType: 'TURNAROUND_SIGNOFF',
        entityId: signoffId,
        eventPayload: buildTurnaroundHistoryPayload({
          operation,
          previous: existingSignoffs[0] || null,
          next: mergeTurnaroundEntity(existingSignoffs[0] || { operationId: id, departmentRole }, signoffValues),
          entityRefs: { signoffId, departmentRole },
          metadata: { action: existingSignoffs[0] ? 'update-signoff' : 'create-signoff' }
        })
      })

      return res.status(200).json({
        message: 'Turnaround readiness signoff updated successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.updateTurnaroundHandoff = async (req, res, next) => {
    try {
      const { id } = req.params
      const allowedFields = ['status', 'ownerName', 'dueTime', 'notes']
      const handoffUpdates = {}

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          handoffUpdates[field] = req.body[field] || null
        }
      }

      if (handoffUpdates.status === 'COMPLETE') {
        handoffUpdates.completedAt = new Date().toISOString()
      } else if (Object.prototype.hasOwnProperty.call(handoffUpdates, 'status')) {
        handoffUpdates.completedAt = null
      }

      const handoffRows = await db
        .select()
        .from(turnaroundHandoffTable)
        .where(eq(turnaroundHandoffTable.id, id))
        .limit(1)

      const handoff = handoffRows[0]

      if (!handoff) {
        return res.status(404).json({ message: 'Turnaround handoff not found' })
      }

      if (Object.keys(handoffUpdates).length === 0) {
        return res.status(400).json({ message: 'At least one turnaround handoff field is required' })
      }

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, handoff.operationId))
        .limit(1)

      const operation = operationRows[0]

      if (!operation) return res.status(404).json({ message: 'Turnaround operation not found' })
      if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
        handoffUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
      }

      const updatedHandoffs = await db.update(turnaroundHandoffTable).set(handoffUpdates).where(eq(turnaroundHandoffTable.id, id)).returning({ id: turnaroundHandoffTable.id })
      if (!updatedHandoffs[0]) return res.status(404).json({ message: 'Turnaround handoff not found' })

      await recordTurnaroundAuditEvent(req, operation, {
          eventType: 'TURNAROUND_HANDOFF_UPDATED',
          entityType: 'TURNAROUND_HANDOFF',
          entityId: id,
          eventPayload: buildTurnaroundHistoryPayload({
            operation,
            previous: handoff,
            next: mergeTurnaroundEntity(handoff, handoffUpdates),
            entityRefs: { handoffId: id, fromDepartmentRole: handoff.fromDepartmentRole, toDepartmentRole: handoff.toDepartmentRole },
            metadata: { action: 'update-handoff' }
          })
        })

      return res.status(200).json({
        message: 'Turnaround handoff updated successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  return controller
}

module.exports = { createTurnaroundWorkforceController }
