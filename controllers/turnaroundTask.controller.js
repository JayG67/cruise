const turnaroundOperationTable = require('../models/turnaroundOperation.model')
const turnaroundTaskTable = require('../models/turnaroundTask.model')
const turnaroundTaskUpdateTable = require('../models/turnaroundTaskUpdate.model')
const turnaroundTaskDependencyTable = require('../models/turnaroundTaskDependency.model')
const db = require('../db')
const { canAccessTurnaroundOperationForRequest, sendTurnaroundOperationForbidden } = require('../services/turnaroundScope.service')
const { buildTurnaroundHistoryPayload, mergeTurnaroundEntity, recordTurnaroundAuditEvent, resolveOperationalUserIdByName } = require('../services/turnaroundMutationSupport.service')
const { eq } = require('drizzle-orm')

function createTurnaroundTaskController({ getTurnaroundOperationDetails }) {
  if (typeof getTurnaroundOperationDetails !== 'function') {
    throw new TypeError('getTurnaroundOperationDetails is required')
  }

  const controller = {}

  controller.updateTurnaroundTaskStatus = async (req, res, next) => {
    try {
      const { id } = req.params
      let { status } = req.body
      const normalizedStatus = String(status || '').trim().toUpperCase().replace(/[-\s]+/g, '_')
      const supportedStatuses = new Set(['READY', 'IN_PROGRESS', 'BLOCKED', 'WATCH', 'COMPLETE'])

      if (!supportedStatuses.has(normalizedStatus)) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [
            {
              field: 'status',
              message: 'Invalid turnaround task status'
            }
          ]
        })
      }

      status = normalizedStatus
      req.body.status = normalizedStatus

      const existingTasks = await db
        .select()
        .from(turnaroundTaskTable)
        .where(eq(turnaroundTaskTable.id, id))
        .limit(1)

      const existingTask = existingTasks[0]

      if (!existingTask) {
        return res.status(404).json({ message: 'Turnaround task not found' })
      }

      const nextTaskValues = { status }

      if (Object.prototype.hasOwnProperty.call(req.body, 'blockerReason')) {
        nextTaskValues.blockerReason = status === 'BLOCKED' ? req.body.blockerReason || 'Blocked pending operational follow-up' : req.body.blockerReason || null
      } else if (status !== 'BLOCKED') {
        nextTaskValues.blockerReason = null
      }

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, existingTask.operationId))
        .limit(1)

      const operation = operationRows[0]

      if (!operation) return res.status(404).json({ message: 'Turnaround operation not found' })
      if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      const updatedTasks = await db.update(turnaroundTaskTable).set(nextTaskValues).where(eq(turnaroundTaskTable.id, id)).returning()
      if (!updatedTasks[0]) return res.status(404).json({ message: 'Turnaround task not found' })

      await recordTurnaroundAuditEvent(req, operation, {
          eventType: 'TURNAROUND_TASK_STATUS_UPDATED',
          entityType: 'TURNAROUND_TASK',
          entityId: id,
          eventPayload: buildTurnaroundHistoryPayload({
            operation,
            previous: existingTask,
            next: mergeTurnaroundEntity(existingTask, nextTaskValues),
            entityRefs: { taskId: id, departmentRole: existingTask.departmentRole },
            metadata: { action: 'update-task-status' }
          })
        })

      return res.status(200).json({
        message: 'Turnaround task status updated successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.createTurnaroundTask = async (req, res, next) => {
    try {
      const { id } = req.params
      const { departmentRole, taskName, ownerName, dueTime, location, blockerReason, status = 'READY' } = req.body

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

      const existingTasks = await db
        .select()
        .from(turnaroundTaskTable)
        .where(eq(turnaroundTaskTable.operationId, id))

      const nextSortOrder = existingTasks.reduce((maxSortOrder, task) => Math.max(maxSortOrder, Number(task.sortOrder || 0)), 0) + 1

      const taskValues = {
        operationId: id,
        departmentRole,
        taskName,
        ownerName: ownerName || null,
        ownerUserId: await resolveOperationalUserIdByName(ownerName, operation),
        dueTime: dueTime || null,
        location: location || null,
        blockerReason: blockerReason || null,
        status,
        sortOrder: nextSortOrder
      }

      await db
        .insert(turnaroundTaskTable)
        .values(taskValues)

      await recordTurnaroundAuditEvent(req, operation, {
        eventType: 'TURNAROUND_TASK_CREATED',
        entityType: 'TURNAROUND_TASK',
        entityId: `${id}:${nextSortOrder}`,
        eventPayload: buildTurnaroundHistoryPayload({
          operation,
          previous: null,
          next: taskValues,
          entityRefs: { departmentRole, sortOrder: nextSortOrder },
          metadata: { action: 'create-task' }
        })
      })

      return res.status(201).json({
        message: 'Turnaround task created successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.createTurnaroundTaskUpdate = async (req, res, next) => {
    try {
      const { id } = req.params
      const { authorName, updateType = 'NOTE', message } = req.body

      const existingTasks = await db
        .select()
        .from(turnaroundTaskTable)
        .where(eq(turnaroundTaskTable.id, id))
        .limit(1)

      const existingTask = existingTasks[0]

      if (!existingTask) {
        return res.status(404).json({ message: 'Turnaround task not found' })
      }

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, existingTask.operationId))
        .limit(1)

      const operation = operationRows[0]

      if (!operation) return res.status(404).json({ message: 'Turnaround operation not found' })
      if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      const taskUpdateValues = {
        taskId: id,
        authorName,
        authorUserId: await resolveOperationalUserIdByName(authorName, operation),
        updateType,
        message,
        createdAt: new Date().toISOString()
      }

      await db
        .insert(turnaroundTaskUpdateTable)
        .values(taskUpdateValues)

      await recordTurnaroundAuditEvent(req, operation, {
          eventType: 'TURNAROUND_TASK_UPDATE_CREATED',
          entityType: 'TURNAROUND_TASK',
          entityId: id,
          eventPayload: buildTurnaroundHistoryPayload({
            operation,
            previous: null,
            next: taskUpdateValues,
            entityRefs: { taskId: id, departmentRole: existingTask.departmentRole },
            metadata: { action: 'create-task-update' }
          })
        })

      return res.status(201).json({
        message: 'Turnaround task update added successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.deleteTurnaroundTask = async (req, res, next) => {
    try {
      const { id } = req.params

      const existingTasks = await db
        .select()
        .from(turnaroundTaskTable)
        .where(eq(turnaroundTaskTable.id, id))
        .limit(1)

      const existingTask = existingTasks[0]

      if (!existingTask) {
        return res.status(404).json({ message: 'Turnaround task not found' })
      }

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, existingTask.operationId))
        .limit(1)

      const operation = operationRows[0]

      if (!operation) return res.status(404).json({ message: 'Turnaround operation not found' })
      if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      await db
        .delete(turnaroundTaskDependencyTable)
        .where(eq(turnaroundTaskDependencyTable.taskId, id))

      await db
        .delete(turnaroundTaskDependencyTable)
        .where(eq(turnaroundTaskDependencyTable.dependsOnTaskId, id))

      await db
        .delete(turnaroundTaskUpdateTable)
        .where(eq(turnaroundTaskUpdateTable.taskId, id))

      await db
        .delete(turnaroundTaskTable)
        .where(eq(turnaroundTaskTable.id, id))

      await recordTurnaroundAuditEvent(req, operation, {
          eventType: 'TURNAROUND_TASK_DELETED',
          entityType: 'TURNAROUND_TASK',
          entityId: id,
          eventPayload: buildTurnaroundHistoryPayload({
            operation,
            previous: existingTask,
            next: null,
            entityRefs: { taskId: id, departmentRole: existingTask.departmentRole },
            metadata: { action: 'delete-task' }
          })
        })

      return res.status(200).json({
        message: 'Turnaround task removed successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  controller.updateTurnaroundTaskDetails = async (req, res, next) => {
    try {
      const { id } = req.params
      const allowedFields = ['ownerName', 'dueTime', 'location', 'blockerReason']
      const taskUpdates = {}

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          taskUpdates[field] = req.body[field] || null
        }
      }

      const existingTasks = await db
        .select()
        .from(turnaroundTaskTable)
        .where(eq(turnaroundTaskTable.id, id))
        .limit(1)

      const existingTask = existingTasks[0]

      if (!existingTask) {
        return res.status(404).json({ message: 'Turnaround task not found' })
      }

      if (Object.keys(taskUpdates).length === 0) {
        return res.status(400).json({ message: 'At least one turnaround task detail is required' })
      }

      const operationRows = await db
        .select()
        .from(turnaroundOperationTable)
        .where(eq(turnaroundOperationTable.id, existingTask.operationId))
        .limit(1)

      const operation = operationRows[0]

      if (!operation) return res.status(404).json({ message: 'Turnaround operation not found' })
      if (!(await canAccessTurnaroundOperationForRequest(req, operation))) {
        return sendTurnaroundOperationForbidden(res)
      }

      if (Object.prototype.hasOwnProperty.call(req.body, 'ownerName')) {
        taskUpdates.ownerUserId = await resolveOperationalUserIdByName(req.body.ownerName, operation)
      }

      const updatedTasks = await db.update(turnaroundTaskTable).set(taskUpdates).where(eq(turnaroundTaskTable.id, id)).returning()
      if (!updatedTasks[0]) return res.status(404).json({ message: 'Turnaround task not found' })

      await recordTurnaroundAuditEvent(req, operation, {
          eventType: 'TURNAROUND_TASK_DETAILS_UPDATED',
          entityType: 'TURNAROUND_TASK',
          entityId: id,
          eventPayload: buildTurnaroundHistoryPayload({
            operation,
            previous: existingTask,
            next: mergeTurnaroundEntity(existingTask, taskUpdates),
            entityRefs: { taskId: id, departmentRole: existingTask.departmentRole },
            metadata: { action: 'update-task-details' }
          })
        })

      return res.status(200).json({
        message: 'Turnaround task details updated successfully',
        operation: await getTurnaroundOperationDetails(operation)
      })
    } catch (err) {
      next(err)
    }
  }

  return controller
}

module.exports = { createTurnaroundTaskController }
