jest.mock('../../db', () => ({ select: jest.fn() }))
jest.mock('../../middleware/requestIdentity.middleware', () => ({ getScopedDemoUserId: jest.fn(() => null) }))
jest.mock('../../services/requestAuthorization.service', () => ({ resolveRequestAuditActor: jest.fn() }))
jest.mock('../../services/authentication.service', () => ({
  AUTH_MODES: { DEMO: 'demo', JWT: 'jwt' },
  getAuthenticationMode: jest.fn(() => 'jwt')
}))
jest.mock('../../services/turnaroundAccess.service', () => ({
  canAccessOperationScope: jest.fn(),
  resolvePrincipalOperationalScope: jest.fn()
}))

const db = require('../../db')
const { canAccessOperationScope, resolvePrincipalOperationalScope } = require('../../services/turnaroundAccess.service')
const service = require('../../services/turnaroundScope.service')

function query(rows = []) {
  const chain = {
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject)
  }
  return chain
}

function queueRows(...sets) {
  sets.forEach(rows => db.select.mockReturnValueOnce(query(rows)))
}

describe('turnaroundScope JWT branch coverage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns no operations when the authenticated principal has no operational scope', async () => {
    resolvePrincipalOperationalScope.mockResolvedValue(null)
    await expect(service.getTurnaroundOperationsForRequest({ requestIdentity: { principal: { userId: 'u1' } } })).resolves.toEqual([])
    expect(db.select).not.toHaveBeenCalled()
  })

  it('returns all operations for a global administrator', async () => {
    resolvePrincipalOperationalScope.mockResolvedValue({ isGlobalAdmin: true })
    queueRows([{ id: 'op-1' }])
    await expect(service.getTurnaroundOperationsForRequest({})).resolves.toEqual([{ id: 'op-1' }])
  })

  it('filters JWT operations by assigned ship and by cruise line', async () => {
    resolvePrincipalOperationalScope.mockResolvedValueOnce({ isGlobalAdmin: false, assignedShipId: 'ship-1', cruiseLineId: null })
    queueRows([{ id: 's1' }], [{ id: 'op-1', sailingId: 's1' }])
    await expect(service.getTurnaroundOperationsForRequest({})).resolves.toEqual([{ id: 'op-1', sailingId: 's1' }])

    resolvePrincipalOperationalScope.mockResolvedValueOnce({ isGlobalAdmin: false, assignedShipId: null, cruiseLineId: 'line-1' })
    queueRows([{ id: 'ship-2' }], [{ id: 's2' }], [{ id: 'op-2', sailingId: 's2' }])
    await expect(service.getTurnaroundOperationsForRequest({})).resolves.toEqual([{ id: 'op-2', sailingId: 's2' }])
  })

  it('returns no JWT operations when a scoped principal resolves no sailings', async () => {
    resolvePrincipalOperationalScope.mockResolvedValue({ isGlobalAdmin: false, assignedShipId: 'ship-empty' })
    queueRows([])
    await expect(service.getTurnaroundOperationsForRequest({})).resolves.toEqual([])
  })

  it('delegates JWT operation access decisions to authoritative operation scope authorization', async () => {
    canAccessOperationScope.mockResolvedValue(true)
    const req = { requestIdentity: { principal: { userId: 'u1' } } }
    await expect(service.canAccessTurnaroundOperationForRequest(req, { id: 'op-1', sailingId: 's1' })).resolves.toBe(true)
    expect(canAccessOperationScope).toHaveBeenCalledWith(req, 'op-1')
  })
})
