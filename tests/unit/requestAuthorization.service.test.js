jest.mock('../../db', () => ({
  select: jest.fn()
}))

const db = require('../../db')
const service = require('../../services/requestAuthorization.service')

function mockDemoUserRows(rows = []) {
  const limit = jest.fn().mockResolvedValue(rows)
  const where = jest.fn(() => ({ limit }))
  const from = jest.fn(() => ({ where }))

  db.select.mockReturnValue({ from })

  return { from, where, limit }
}

describe('requestAuthorization service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDemoUserRows([])
  })

  it('normalizes role names for production and demo admin checks', () => {
    expect(service.normalizeRole(' admin ')).toBe('ADMIN')
    expect(service.normalizeRole('guest-services-lead')).toBe('GUEST_SERVICES_LEAD')
    expect(service.isAdminRole('ADMIN')).toBe(true)
    expect(service.isAdminRole('admin')).toBe(true)
    expect(service.isAdminRole('turnaround-manager')).toBe(false)
  })

  it('uses a production principal when one is present on the request identity', async () => {
    const req = {
      requestIdentity: {
        principal: {
          userId: 'prod-user-1',
          email: 'prod@example.com',
          role: 'ADMIN',
          identitySource: 'jwt'
        }
      }
    }

    expect(service.getProductionPrincipal(req)).toEqual(req.requestIdentity.principal)
    await expect(service.resolveRequestActor(req)).resolves.toEqual({
      actorUserId: 'prod-user-1',
      actorDisplayName: 'prod@example.com',
      actorRole: 'ADMIN',
      identitySource: 'jwt'
    })
    await expect(service.isAdminRequest(req)).resolves.toBe(true)
    expect(db.select).not.toHaveBeenCalled()
  })

  it('falls back to demo users for the reviewable demo role-assumption flow', async () => {
    mockDemoUserRows([{
      id: 'demo-admin',
      displayName: 'Demo Admin',
      role: 'ADMIN',
      normalizedUserId: 'app-admin-1'
    }])

    const req = { requestIdentity: { demoUserId: 'demo-admin' }, query: {} }

    await expect(service.resolveDemoUserForRequest(req)).resolves.toEqual(expect.objectContaining({
      id: 'demo-admin',
      role: 'ADMIN'
    }))
    await expect(service.resolveRequestActor(req)).resolves.toEqual({
      actorUserId: 'app-admin-1',
      actorDisplayName: 'Demo Admin',
      actorRole: 'ADMIN',
      identitySource: 'demo'
    })
    await expect(service.isAdminRequest(req)).resolves.toBe(true)
  })

  it('supports legacy query-string demo user lookup while the app remains a public demo', async () => {
    mockDemoUserRows([{
      id: 'demo-ops',
      displayName: 'Ops Reviewer',
      role: 'TURNAROUND_MANAGER',
      normalizedUserId: 'ops-1'
    }])

    const req = { query: { demoUserId: 'demo-ops' } }

    await expect(service.resolveRequestActor(req)).resolves.toEqual({
      actorUserId: 'ops-1',
      actorDisplayName: 'Ops Reviewer',
      actorRole: 'TURNAROUND_MANAGER',
      identitySource: 'demo'
    })
    await expect(service.isAdminRequest(req)).resolves.toBe(false)
  })

  it('returns an anonymous actor when no principal or demo user is selected', async () => {
    const req = { requestIdentity: {}, query: {} }

    await expect(service.resolveDemoUserForRequest(req)).resolves.toBeNull()
    await expect(service.resolveRequestActor(req)).resolves.toEqual({
      actorUserId: null,
      actorDisplayName: null,
      actorRole: null,
      identitySource: 'anonymous'
    })
  })

  it('writes a structured forbidden response for non-admin audit review requests', async () => {
    const status = jest.fn(() => ({ json }))
    const json = jest.fn()
    const res = { status }

    await expect(service.requireAdminRequest({ requestIdentity: {}, query: {} }, res)).resolves.toBe(false)

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ message: service.ADMIN_FORBIDDEN_MESSAGE })
  })
})
