const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Turnaround operations API integration tests', () => {
  it('GET /cruise/turnaround-operations returns database-backed plans with sailing context and role tasks', async () => {
    const res = await request(app).get('/cruise/turnaround-operations')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)

    const firstOperation = res.body[0]
    expect(firstOperation).toEqual(expect.objectContaining({
      title: expect.any(String),
      turnaroundDate: expect.any(String),
      port: expect.any(String),
      status: expect.any(String),
      readinessLevel: expect.any(String),
      passengerCount: expect.any(Number)
    }))
    expect(firstOperation.sailing).toEqual(expect.objectContaining({ id: firstOperation.sailingId }))
    expect(firstOperation.ship).toEqual(expect.objectContaining({ id: firstOperation.sailing.shipId }))
    expect(firstOperation.cruiseLine).toEqual(expect.objectContaining({ id: firstOperation.ship.cruiseLineId }))
    expect(firstOperation.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ departmentRole: 'turnaround-manager', taskName: expect.any(String), ownerName: expect.any(String), dueTime: expect.any(String), location: expect.any(String) })
      ])
    )
    expect(firstOperation.signoffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ departmentRole: 'turnaround-manager', status: expect.any(String) })
      ])
    )
    expect(firstOperation.signoffSummary).toEqual(expect.objectContaining({
      totalSignoffs: expect.any(Number),
      approvedSignoffs: expect.any(Number),
      approvalPercent: expect.any(Number)
    }))
  })



  it('PATCH /cruise/turnaround-operations/:id/signoffs/:departmentRole updates department readiness signoff state', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const operation = operationsRes.body[0]

    const res = await request(app)
      .patch(`/cruise/turnaround-operations/${operation.id}/signoffs/engineering-lead`)
      .send({
        approverName: 'David Torres',
        status: 'approved',
        notes: 'Engineering systems are cleared for embarkation.'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Turnaround readiness signoff updated successfully')
    expect(res.body.operation.signoffs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        departmentRole: 'engineering-lead',
        approverName: 'David Torres',
        status: 'APPROVED',
        notes: 'Engineering systems are cleared for embarkation.',
        signedAt: expect.any(String)
      })
    ]))
    expect(res.body.operation.signoffSummary.approvedSignoffs).toBeGreaterThanOrEqual(1)
  })

  it('rejects unsupported turnaround signoff states before updating readiness', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const operation = operationsRes.body[0]

    const res = await request(app)
      .patch(`/cruise/turnaround-operations/${operation.id}/signoffs/engineering-lead`)
      .send({ approverName: 'David Torres', status: 'almost ready' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Validation failed')
  })

  it('PATCH /cruise/turnaround-tasks/:id/status updates a role task and returns refreshed operation progress', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const task = operationsRes.body[0].tasks.find(candidate => candidate.status !== 'COMPLETE')

    const res = await request(app)
      .patch(`/cruise/turnaround-tasks/${task.id}/status`)
      .send({ status: 'complete' })

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Turnaround task status updated successfully')
    expect(res.body.operation.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: task.id, status: 'COMPLETE' })
    ]))
    expect(res.body.operation.taskSummary).toEqual(expect.objectContaining({
      totalTasks: expect.any(Number),
      completeTasks: expect.any(Number),
      completionPercent: expect.any(Number)
    }))
  })

  it('PATCH /cruise/turnaround-tasks/:id/details updates task ownership, timing, location, and blocker metadata', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const task = operationsRes.body[0].tasks[0]

    const res = await request(app)
      .patch(`/cruise/turnaround-tasks/${task.id}/details`)
      .send({
        ownerName: 'Jordan Pierce',
        dueTime: '09:45',
        location: 'Pier 4 command desk',
        blockerReason: 'Waiting for terminal headcount reconciliation'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Turnaround task details updated successfully')
    expect(res.body.operation.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: task.id,
        ownerName: 'Jordan Pierce',
        dueTime: '09:45',
        location: 'Pier 4 command desk',
        blockerReason: 'Waiting for terminal headcount reconciliation'
      })
    ]))
  })

  it('PATCH /cruise/turnaround-tasks/:id/status can save a blocker reason with a blocked status', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const task = operationsRes.body[0].tasks.find(candidate => candidate.status !== 'COMPLETE')

    const res = await request(app)
      .patch(`/cruise/turnaround-tasks/${task.id}/status`)
      .send({ status: 'blocked', blockerReason: 'Waiting for luggage hall clearance' })

    expect(res.statusCode).toBe(200)
    expect(res.body.operation.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: task.id, status: 'BLOCKED', blockerReason: 'Waiting for luggage hall clearance' })
    ]))
    expect(res.body.operation.taskSummary.blockedTasks).toBeGreaterThanOrEqual(1)
  })

  it('POST /cruise/turnaround-tasks/:id/updates adds a database-backed shift update', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const task = operationsRes.body[0].tasks[0]

    const res = await request(app)
      .post(`/cruise/turnaround-tasks/${task.id}/updates`)
      .send({
        authorName: 'Alex Turner',
        updateType: 'NOTE',
        message: 'Pier agent confirmed luggage hall release window.'
      })

    expect(res.statusCode).toBe(201)
    expect(res.body.message).toBe('Turnaround task update added successfully')
    expect(res.body.operation.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: task.id,
        updates: expect.arrayContaining([
          expect.objectContaining({
            authorName: 'Alex Turner',
            updateType: 'NOTE',
            message: 'Pier agent confirmed luggage hall release window.',
            createdAt: expect.any(String)
          })
        ])
      })
    ]))
  })

  it('rejects empty turnaround task update messages before writing the update log', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const task = operationsRes.body[0].tasks[0]

    const res = await request(app)
      .post(`/cruise/turnaround-tasks/${task.id}/updates`)
      .send({ authorName: 'Alex Turner', updateType: 'NOTE', message: '' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Validation failed')
  })

  it('rejects unsupported turnaround task statuses before updating the database', async () => {
    const operationsRes = await request(app).get('/cruise/turnaround-operations')
    const task = operationsRes.body[0].tasks[0]

    const res = await request(app)
      .patch(`/cruise/turnaround-tasks/${task.id}/status`)
      .send({ status: 'maybe later' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Validation failed')
  })

})
