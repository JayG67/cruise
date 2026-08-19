jest.mock('../../db', () => ({ select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() }))
jest.mock('drizzle-orm', () => ({ eq: jest.fn((field, value) => ({ field, value })) }), { virtual: true })
jest.mock('../../services/turnaroundScope.service', () => ({
  canAccessTurnaroundOperationForRequest: jest.fn(),
  sendTurnaroundOperationForbidden: jest.fn((res) => res.status(403).json({ message: 'Forbidden' }))
}))
jest.mock('../../services/turnaroundMutationSupport.service', () => ({
  buildTurnaroundHistoryPayload: jest.fn((value) => value),
  mergeTurnaroundEntity: jest.fn((previous, updates) => ({ ...previous, ...updates })),
  recordTurnaroundAuditEvent: jest.fn(),
  resolveOperationalUserIdByName: jest.fn()
}))

const db = require('../../db')
const scope = require('../../services/turnaroundScope.service')
const mutationSupport = require('../../services/turnaroundMutationSupport.service')
const { createTurnaroundTaskController } = require('../../controllers/turnaroundTask.controller')
const mockResponse = require('./helpers/mockResponse')

const getTurnaroundOperationDetails = jest.fn()
const controller = createTurnaroundTaskController({ getTurnaroundOperationDetails })

function selectLimit(result) {
  const limit = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ limit })
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}

function selectWhere(result) {
  const where = jest.fn().mockResolvedValue(result)
  db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where }) })
}

function mockUpdate(result = [{ id: 'TASK-1' }]) {
  const returning = jest.fn().mockResolvedValue(result)
  const where = jest.fn().mockReturnValue({ returning })
  const set = jest.fn().mockReturnValue({ where })
  db.update.mockReturnValueOnce({ set })
  return set
}

function mockDelete(count = 1, finalResult = [{ id: 'TASK-1' }]) {
  for (let i = 0; i < count; i += 1) {
    if (i === count - 1) {
      const returning = jest.fn().mockResolvedValue(finalResult)
      db.delete.mockReturnValueOnce({ where: jest.fn().mockReturnValue({ returning }) })
    } else {
      db.delete.mockReturnValueOnce({ where: jest.fn().mockResolvedValue() })
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
  mutationSupport.resolveOperationalUserIdByName.mockResolvedValue('USR-1')
  getTurnaroundOperationDetails.mockResolvedValue({ id: 'OP-1', decorated: true })
})

describe('turnaround task controller defect-discovery coverage', () => {
  it('requires the operation detail resolver', () => {
    expect(() => createTurnaroundTaskController({})).toThrow('getTurnaroundOperationDetails is required')
  })

  it('normalizes a blocked status and supplies the default blocker reason', async () => {
    const res = mockResponse()
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING', status: 'READY' }
    const operation = { id: 'OP-1' }
    selectLimit([task]); selectLimit([operation])
    const set = mockUpdate()

    await controller.updateTurnaroundTaskStatus({ params: { id: task.id }, body: { status: ' blocked ', blockerReason: '' } }, res, jest.fn())

    expect(set).toHaveBeenCalledWith({ status: 'BLOCKED', blockerReason: 'Blocked pending operational follow-up' })
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalledWith(expect.anything(), operation, expect.objectContaining({ eventType: 'TURNAROUND_TASK_STATUS_UPDATED' }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('rejects unsupported status before touching persistence', async () => {
    const res = mockResponse()
    await controller.updateTurnaroundTaskStatus({ params: { id: 'TASK-1' }, body: { status: 'unknown' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(400)
    expect(db.select).not.toHaveBeenCalled()
  })

  it.each(['updateTurnaroundTaskStatus', 'createTurnaroundTaskUpdate', 'deleteTurnaroundTask', 'updateTurnaroundTaskDetails'])('%s fails closed when an existing task has lost its parent operation', async (method) => {
    const res = mockResponse()
    const task = { id: 'TASK-1', operationId: 'MISSING', departmentRole: 'ENGINEERING' }
    selectLimit([task]); selectLimit([])
    const body = method === 'updateTurnaroundTaskStatus' ? { status: 'READY' } : method === 'createTurnaroundTaskUpdate' ? { authorName: 'Alex', message: 'note' } : method === 'updateTurnaroundTaskDetails' ? { ownerName: 'Alex' } : {}

    await controller[method]({ params: { id: task.id }, body }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(scope.canAccessTurnaroundOperationForRequest).not.toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
    expect(db.delete).not.toHaveBeenCalled()
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
  })

  it('denies task detail mutation outside the operation scope', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'TASK-1', operationId: 'OP-1' }]); selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)

    await controller.updateTurnaroundTaskDetails({ params: { id: 'TASK-1' }, body: { dueTime: '10:30' } }, res, jest.fn())

    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('creates a task with the next sort order and server-resolved owner identity', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1' }
    selectLimit([operation]); selectWhere([{ sortOrder: 2 }, { sortOrder: 7 }])
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValueOnce({ values })

    await controller.createTurnaroundTask({ params: { id: operation.id }, body: { departmentRole: 'ENGINEERING', taskName: 'Inspect', ownerName: 'Alex' } }, res, jest.fn())

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 8, ownerUserId: 'USR-1', status: 'READY' }))
    expect(mutationSupport.resolveOperationalUserIdByName).toHaveBeenCalledWith('Alex', operation)
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('deletes dependencies, updates, and task only after scope authorization', async () => {
    const res = mockResponse()
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }
    const operation = { id: 'OP-1' }
    selectLimit([task]); selectLimit([operation]); mockDelete(4)

    await controller.deleteTurnaroundTask({ params: { id: task.id }, body: {} }, res, jest.fn())

    expect(db.delete).toHaveBeenCalledTimes(4)
    expect(mutationSupport.recordTurnaroundAuditEvent).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })


  it.each(['updateTurnaroundTaskStatus', 'updateTurnaroundTaskDetails'])('%s fails closed when the authorized task disappears before update', async (method) => {
    const res = mockResponse()
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING', status: 'READY' }
    const operation = { id: 'OP-1' }
    selectLimit([task]); selectLimit([operation]); mockUpdate([])
    const body = method === 'updateTurnaroundTaskStatus' ? { status: 'WATCH' } : { location: 'Pier 2' }

    await controller[method]({ params: { id: task.id }, body }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
    expect(getTurnaroundOperationDetails).not.toHaveBeenCalled()
  })

  it('ignores malformed existing sort orders instead of persisting NaN for a new task', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1' }
    selectLimit([operation]); selectWhere([{ sortOrder: 'bad' }, { sortOrder: Infinity }, { sortOrder: -4 }, { sortOrder: 5.9 }])
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValueOnce({ values })

    await controller.createTurnaroundTask({ params: { id: operation.id }, body: { departmentRole: 'HOTEL', taskName: 'Stage cabins' } }, res, jest.fn())

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 6 }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('does not emit delete success or audit evidence when the authorized task disappears before final delete', async () => {
    const res = mockResponse()
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }
    const operation = { id: 'OP-1' }
    selectLimit([task]); selectLimit([operation]); mockDelete(4, [])

    await controller.deleteTurnaroundTask({ params: { id: task.id }, body: {} }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(mutationSupport.recordTurnaroundAuditEvent).not.toHaveBeenCalled()
    expect(getTurnaroundOperationDetails).not.toHaveBeenCalled()
  })

  it('forwards persistence failures without converting them to success', async () => {
    const error = new Error('database failed')
    const next = jest.fn()
    db.select.mockImplementationOnce(() => { throw error })
    await controller.deleteTurnaroundTask({ params: { id: 'TASK-1' }, body: {} }, mockResponse(), next)
    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('turnaround task controller remaining branch coverage', () => {
  it('returns not found when status update targets a missing task', async () => {
    const res = mockResponse()
    selectLimit([])
    await controller.updateTurnaroundTaskStatus({ params: { id: 'MISSING' }, body: { status: 'READY' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('clears stale blocker reason when a task leaves blocked status', async () => {
    const res = mockResponse()
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING', blockerReason: 'Old blocker' }
    const operation = { id: 'OP-1' }
    selectLimit([task]); selectLimit([operation])
    const set = mockUpdate()
    await controller.updateTurnaroundTaskStatus({ params: { id: task.id }, body: { status: ' in-progress ' } }, res, jest.fn())
    expect(set).toHaveBeenCalledWith({ status: 'IN_PROGRESS', blockerReason: null })
  })

  it('preserves an explicit blocker reason and clears an explicit blank reason after unblock', async () => {
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }
    const operation = { id: 'OP-1' }
    const blockedRes = mockResponse()
    selectLimit([task]); selectLimit([operation]); const blockedSet = mockUpdate()
    await controller.updateTurnaroundTaskStatus({ params: { id: task.id }, body: { status: 'BLOCKED', blockerReason: 'Fueling gate' } }, blockedRes, jest.fn())
    expect(blockedSet).toHaveBeenCalledWith({ status: 'BLOCKED', blockerReason: 'Fueling gate' })

    const readyRes = mockResponse()
    selectLimit([task]); selectLimit([operation]); const readySet = mockUpdate()
    await controller.updateTurnaroundTaskStatus({ params: { id: task.id }, body: { status: 'READY', blockerReason: '' } }, readyRes, jest.fn())
    expect(readySet).toHaveBeenCalledWith({ status: 'READY', blockerReason: null })
  })

  it('denies status mutation outside operation scope', async () => {
    const res = mockResponse()
    selectLimit([{ id: 'TASK-1', operationId: 'OP-1' }]); selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)
    await controller.updateTurnaroundTaskStatus({ params: { id: 'TASK-1' }, body: { status: 'WATCH' } }, res, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(res)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('returns not found and forbidden branches during task creation', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.createTurnaroundTask({ params: { id: 'OP-MISSING' }, body: { departmentRole: 'HOTEL', taskName: 'Stage' } }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const forbiddenRes = mockResponse()
    selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)
    await controller.createTurnaroundTask({ params: { id: 'OP-1' }, body: { departmentRole: 'HOTEL', taskName: 'Stage' } }, forbiddenRes, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(forbiddenRes)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('creates a sparse task with nullable optional fields and first sort order', async () => {
    const res = mockResponse()
    const operation = { id: 'OP-1' }
    selectLimit([operation]); selectWhere([])
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValueOnce({ values })
    mutationSupport.resolveOperationalUserIdByName.mockResolvedValue(null)
    await controller.createTurnaroundTask({ params: { id: 'OP-1' }, body: { departmentRole: 'HOTEL', taskName: 'Stage' } }, res, jest.fn())
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ ownerName: null, ownerUserId: null, dueTime: null, location: null, blockerReason: null, sortOrder: 1 }))
  })

  it('covers task-update missing, forbidden, and success paths', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.createTurnaroundTaskUpdate({ params: { id: 'MISSING' }, body: { authorName: 'Alex', message: 'note' } }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }
    const operation = { id: 'OP-1' }
    const forbiddenRes = mockResponse()
    selectLimit([task]); selectLimit([operation]); scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)
    await controller.createTurnaroundTaskUpdate({ params: { id: task.id }, body: { authorName: 'Alex', message: 'note' } }, forbiddenRes, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(forbiddenRes)

    jest.clearAllMocks()
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(true)
    mutationSupport.resolveOperationalUserIdByName.mockResolvedValue('USR-1')
    getTurnaroundOperationDetails.mockResolvedValue({ id: 'OP-1' })
    const successRes = mockResponse()
    selectLimit([task]); selectLimit([operation])
    const values = jest.fn().mockResolvedValue()
    db.insert.mockReturnValueOnce({ values })
    await controller.createTurnaroundTaskUpdate({ params: { id: task.id }, body: { authorName: 'Alex', updateType: 'SHIFT_NOTE', message: 'Ready' } }, successRes, jest.fn())
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ taskId: task.id, authorUserId: 'USR-1', updateType: 'SHIFT_NOTE', message: 'Ready' }))
    expect(successRes.status).toHaveBeenCalledWith(201)
  })

  it('covers delete missing-task and forbidden branches', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.deleteTurnaroundTask({ params: { id: 'MISSING' }, body: {} }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const forbiddenRes = mockResponse()
    selectLimit([{ id: 'TASK-1', operationId: 'OP-1' }]); selectLimit([{ id: 'OP-1' }])
    scope.canAccessTurnaroundOperationForRequest.mockResolvedValue(false)
    await controller.deleteTurnaroundTask({ params: { id: 'TASK-1' }, body: {} }, forbiddenRes, jest.fn())
    expect(scope.sendTurnaroundOperationForbidden).toHaveBeenCalledWith(forbiddenRes)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('covers task-detail missing, empty-update, owner-resolution, and nullable-field branches', async () => {
    const missingRes = mockResponse()
    selectLimit([])
    await controller.updateTurnaroundTaskDetails({ params: { id: 'MISSING' }, body: { location: 'Pier' } }, missingRes, jest.fn())
    expect(missingRes.status).toHaveBeenCalledWith(404)

    const emptyRes = mockResponse()
    selectLimit([{ id: 'TASK-1', operationId: 'OP-1' }])
    await controller.updateTurnaroundTaskDetails({ params: { id: 'TASK-1' }, body: { ignored: 'x' } }, emptyRes, jest.fn())
    expect(emptyRes.status).toHaveBeenCalledWith(400)

    const successRes = mockResponse()
    const task = { id: 'TASK-1', operationId: 'OP-1', departmentRole: 'ENGINEERING' }
    const operation = { id: 'OP-1' }
    selectLimit([task]); selectLimit([operation]); const set = mockUpdate()
    mutationSupport.resolveOperationalUserIdByName.mockResolvedValue(null)
    await controller.updateTurnaroundTaskDetails({ params: { id: task.id }, body: { ownerName: '', dueTime: '', location: '', blockerReason: '' } }, successRes, jest.fn())
    expect(set).toHaveBeenCalledWith({ ownerName: null, dueTime: null, location: null, blockerReason: null, ownerUserId: null })
    expect(successRes.status).toHaveBeenCalledWith(200)
  })
})
