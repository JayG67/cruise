jest.mock('../../services/auditEvent.service', () => ({ listAuditEvents: jest.fn() }))
jest.mock('../../services/auditEventQuery.service', () => ({
  buildAuditEventListResponse: jest.fn((events, contract) => ({ auditEvents: events, ...contract })),
  buildAuditEventQueryContract: jest.fn((query = {}, options = {}) => {
    query = query || {}
    const { limit, ...filters } = query
    return { filters, limit: Number.isFinite(Number(limit)) ? Number(limit) : options.defaultLimit || 50 }
  })
}))
jest.mock('../../services/platformAudit.service', () => ({ recordPlatformAuditEvent: jest.fn() }))
jest.mock('../../services/turnaroundAdminSetup.service', () => ({
  buildTurnaroundSetupSummary: jest.fn(),
  createTurnaroundPerson: jest.fn(),
  updateTurnaroundPerson: jest.fn(),
  deleteTurnaroundPerson: jest.fn()
}))
jest.mock('../../services/requestAuthorization.service', () => ({ requireAdminRequest: jest.fn() }))

const { listAuditEvents } = require('../../services/auditEvent.service')
const { buildAuditEventQueryContract } = require('../../services/auditEventQuery.service')
const { recordPlatformAuditEvent } = require('../../services/platformAudit.service')
const setup = require('../../services/turnaroundAdminSetup.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const controller = require('../../controllers/platformOperationsAdmin.controller')

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
}

describe('platformOperationsAdmin controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireAdminRequest.mockResolvedValue(true)
    setup.buildTurnaroundSetupSummary.mockResolvedValue({ people: [] })
  })

  it('short-circuits admin setup reads when authorization fails', async () => {
    requireAdminRequest.mockResolvedValue(false)
    const res = response()
    await controller.getTurnaroundAdminSetup({}, res, jest.fn())
    expect(setup.buildTurnaroundSetupSummary).not.toHaveBeenCalled()
  })

  it('returns turnaround setup and forwards unexpected read errors', async () => {
    const res = response()
    await controller.getTurnaroundAdminSetup({}, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ people: [] })

    const next = jest.fn()
    setup.buildTurnaroundSetupSummary.mockRejectedValueOnce(new Error('setup failed'))
    await controller.getTurnaroundAdminSetup({}, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'setup failed' }))
  })

  it.each([
    ['createTurnaroundPerson', 'createTurnaroundPerson', 201, 'TURNAROUND_PERSON_CREATED'],
    ['updateTurnaroundPerson', 'updateTurnaroundPerson', 200, 'TURNAROUND_PERSON_UPDATED'],
    ['deleteTurnaroundPerson', 'deleteTurnaroundPerson', 200, 'TURNAROUND_PERSON_UNASSIGNED']
  ])('executes %s with attributed audit evidence', async (handler, serviceMethod, expectedStatus, eventType) => {
    const person = { id: 'person-1', displayName: 'Ops Lead', role: 'TURNAROUND_MANAGER', cruiseLineId: 'CL-1', assignedShipId: 'SHIP-1' }
    setup[serviceMethod].mockResolvedValue(person)
    const req = { body: { displayName: 'Ops Lead' }, params: { id: 'person-1' } }
    const res = response()

    await controller[handler](req, res, jest.fn())

    expect(res.statusCode).toBe(expectedStatus)
    expect(recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      eventType,
      entityId: 'person-1',
      cruiseLineId: 'CL-1',
      shipId: 'SHIP-1'
    }))
    expect(setup.buildTurnaroundSetupSummary).toHaveBeenCalled()
  })


  it.each(['createTurnaroundPerson', 'updateTurnaroundPerson', 'deleteTurnaroundPerson'])('short-circuits %s when authorization fails', async handler => {
    requireAdminRequest.mockResolvedValue(false)
    const req = { body: {}, params: { id: 'person-1' } }
    await controller[handler](req, response(), jest.fn())
    expect(setup.createTurnaroundPerson).not.toHaveBeenCalled()
    expect(setup.updateTurnaroundPerson).not.toHaveBeenCalled()
    expect(setup.deleteTurnaroundPerson).not.toHaveBeenCalled()
    expect(recordPlatformAuditEvent).not.toHaveBeenCalled()
  })

  it('records null tenant scope when a created person has no cruise-line or ship assignment', async () => {
    setup.createTurnaroundPerson.mockResolvedValue({ id: 'person-2', displayName: 'Roster User', role: 'OPERATIONS' })
    const req = { body: { displayName: 'Roster User' } }
    await controller.createTurnaroundPerson(req, response(), jest.fn())

    expect(recordPlatformAuditEvent).toHaveBeenCalledWith(req, expect.objectContaining({
      cruiseLineId: null,
      shipId: null
    }))
  })

  it.each([
    ['updateTurnaroundPerson', 'updateTurnaroundPerson'],
    ['deleteTurnaroundPerson', 'deleteTurnaroundPerson']
  ])('returns expected domain errors from %s', async (handler, serviceMethod) => {
    setup[serviceMethod].mockRejectedValueOnce(Object.assign(new Error('not allowed'), { statusCode: 409 }))
    const res = response()
    await controller[handler]({ params: { id: 'person-1' }, body: {} }, res, jest.fn())
    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ message: 'not allowed' })
  })

  it('forwards unexpected delete errors', async () => {
    setup.deleteTurnaroundPerson.mockRejectedValueOnce(new Error('delete failed'))
    const next = jest.fn()
    await controller.deleteTurnaroundPerson({ params: { id: 'person-1' } }, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'delete failed' }))
  })

  it('returns service client errors and forwards unexpected mutation errors', async () => {
    setup.createTurnaroundPerson.mockRejectedValueOnce(Object.assign(new Error('invalid setup'), { statusCode: 422 }))
    const clientRes = response()
    await controller.createTurnaroundPerson({ body: {} }, clientRes, jest.fn())
    expect(clientRes.statusCode).toBe(422)
    expect(clientRes.body).toEqual({ message: 'invalid setup' })

    setup.updateTurnaroundPerson.mockRejectedValueOnce(new Error('database failed'))
    const next = jest.fn()
    await controller.updateTurnaroundPerson({ params: { id: 'x' }, body: {} }, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'database failed' }))
  })


  it('lists query-derived audit filters when tenant scope is absent', async () => {
    listAuditEvents.mockResolvedValue([])
    const req = { query: { entityType: 'TASK', limit: '7' } }
    const res = response()

    await controller.getPlatformAuditEvents(req, res, jest.fn())

    expect(buildAuditEventQueryContract).toHaveBeenCalledWith(req.query, { defaultLimit: 50 })
    expect(listAuditEvents).toHaveBeenCalledWith({ entityType: 'TASK' }, { limit: 7 })
    expect(res.statusCode).toBe(200)
  })

  it('short-circuits audit event reads when authorization fails', async () => {
    requireAdminRequest.mockResolvedValue(false)
    await controller.getPlatformAuditEvents({ query: {} }, response(), jest.fn())
    expect(listAuditEvents).not.toHaveBeenCalled()
  })

  it('lists tenant-constrained audit events and forwards list errors', async () => {
    listAuditEvents.mockResolvedValue([{ id: 'audit-1' }])
    const req = { query: { entityType: 'BOOKING' }, tenantAuditFilters: { cruiseLineId: 'CL-1' } }
    const res = response()
    await controller.getPlatformAuditEvents(req, res, jest.fn())
    expect(res.statusCode).toBe(200)
    expect(listAuditEvents).toHaveBeenCalledWith({ cruiseLineId: 'CL-1' }, { limit: 50 })
    expect(res.body.auditEvents).toEqual([{ id: 'audit-1' }])

    listAuditEvents.mockRejectedValueOnce(new Error('audit read failed'))
    const next = jest.fn()
    await controller.getPlatformAuditEvents({ query: {} }, response(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'audit read failed' }))
  })
})
