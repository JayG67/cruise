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

  it('uses a labeled server-generated audit actor for anonymous demo-mode mutations', async () => {
    const previousMode = process.env.CRUISE_AUTH_MODE
    delete process.env.CRUISE_AUTH_MODE

    try {
      await expect(service.resolveRequestAuditActor({ requestIdentity: {}, query: {} })).resolves.toEqual({
        actorUserId: null,
        actorDisplayName: service.DEMO_AUDIT_ACTOR_DISPLAY_NAME,
        actorRole: null,
        identitySource: 'demo'
      })
    } finally {
      if (previousMode === undefined) delete process.env.CRUISE_AUTH_MODE
      else process.env.CRUISE_AUTH_MODE = previousMode
    }
  })

  it('does not synthesize a demo audit actor when JWT mode is active', async () => {
    const previousMode = process.env.CRUISE_AUTH_MODE
    process.env.CRUISE_AUTH_MODE = 'jwt'

    try {
      await expect(service.resolveRequestAuditActor({ requestIdentity: {}, query: {} })).resolves.toEqual({
        actorUserId: null,
        actorDisplayName: null,
        actorRole: null,
        identitySource: 'anonymous'
      })
    } finally {
      if (previousMode === undefined) delete process.env.CRUISE_AUTH_MODE
      else process.env.CRUISE_AUTH_MODE = previousMode
    }
  })

  it('allows explicitly enabled production GET reads without treating writes as admin requests', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousPublicReadMode = process.env.CRUISE_PUBLIC_DEMO_READ_MODE
    process.env.NODE_ENV = 'production'
    process.env.CRUISE_PUBLIC_DEMO_READ_MODE = 'enabled'
    const res = { status: jest.fn(() => ({ json: jest.fn() })) }

    try {
      await expect(service.requireAdminRequest({ method: 'GET', requestIdentity: {}, query: {} }, res)).resolves.toBe(true)
      await expect(service.requireAdminRequest({ method: 'POST', requestIdentity: {}, query: {} }, res)).resolves.toBe(false)
      expect(res.status).toHaveBeenCalledWith(403)
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousNodeEnv
      if (previousPublicReadMode === undefined) delete process.env.CRUISE_PUBLIC_DEMO_READ_MODE
      else process.env.CRUISE_PUBLIC_DEMO_READ_MODE = previousPublicReadMode
    }
  })

  it('writes a structured forbidden response for non-admin audit review requests', async () => {
    const status = jest.fn(() => ({ json }))
    const json = jest.fn()
    const res = { status }

    await expect(service.requireAdminRequest({ requestIdentity: {}, query: {} }, res)).resolves.toBe(false)

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ message: service.ADMIN_FORBIDDEN_MESSAGE })
  })

  it('fails closed for incomplete non-anonymous actor identities and tolerates empty actor builders', () => {
    expect(service.buildProductionActor({})).toBeNull()
    expect(service.buildDemoActor({})).toBeNull()
    expect(service.normalizeActorRole()).toBeNull()
    expect(service.normalizeActorDisplayName()).toBeNull()

    expect(() => service.assertResolvedActor({
      actorUserId: 'user-1',
      actorDisplayName: 'User One'
    })).toThrow('Resolved actor identity source is required')
  })

  it('uses user id as the production display fallback and preserves explicit identity source', () => {
    expect(service.buildProductionActor({
      userId: 'prod-user-2',
      role: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.JWT
    })).toEqual({
      actorUserId: 'prod-user-2',
      actorDisplayName: 'prod-user-2',
      actorRole: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.JWT
    })
  })

  it('allows verified admin requests without writing a forbidden response', async () => {
    const json = jest.fn()
    const status = jest.fn(() => ({ json }))
    const res = { status }
    const req = {
      requestIdentity: {
        principal: { userId: 'admin-1', displayName: 'Admin One', role: 'ADMIN', identitySource: 'jwt' }
      }
    }

    await expect(service.requireAdminRequest(req, res)).resolves.toBe(true)
    expect(status).not.toHaveBeenCalled()
    expect(json).not.toHaveBeenCalled()
  })

  it('covers default actor builders and request shapes without weakening fail-closed identity behavior', async () => {
    expect(service.buildActorIdentity()).toEqual({
      actorUserId: null,
      actorDisplayName: null,
      actorRole: null,
      identitySource: service.ACTOR_IDENTITY_SOURCES.ANONYMOUS
    })
    expect(service.getProductionPrincipal()).toBeNull()
    await expect(service.resolveDemoUserForRequest()).resolves.toBeNull()
    await expect(service.resolveRequestActor()).resolves.toEqual(expect.objectContaining({
      identitySource: service.ACTOR_IDENTITY_SOURCES.ANONYMOUS
    }))
  })


})

describe('requestAuthorization actor identity bridge', () => {
  it('centralizes production, demo, and anonymous actor shapes without adding request-specific fields', () => {
    expect(service.buildActorIdentity({
      actorUserId: 'direct-user-1',
      actorDisplayName: 'Direct User',
      actorRole: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.PRINCIPAL
    })).toEqual({
      actorUserId: 'direct-user-1',
      actorDisplayName: 'Direct User',
      actorRole: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.PRINCIPAL
    })

    expect(service.buildProductionActor({
      userId: 'prod-user-1',
      displayName: 'Production User',
      role: 'guest-services-lead'
    })).toEqual({
      actorUserId: 'prod-user-1',
      actorDisplayName: 'Production User',
      actorRole: 'guest-services-lead',
      identitySource: service.ACTOR_IDENTITY_SOURCES.PRINCIPAL
    })

    expect(service.buildDemoActor({
      id: 'UADMIN0001',
      normalizedUserId: 'UADMIN0001',
      displayName: 'Admin Reviewer',
      role: 'ADMIN'
    })).toEqual({
      actorUserId: 'UADMIN0001',
      actorDisplayName: 'Admin Reviewer',
      actorRole: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.DEMO
    })

    expect(service.buildAnonymousActor()).toEqual({
      actorUserId: null,
      actorDisplayName: null,
      actorRole: null,
      identitySource: service.ACTOR_IDENTITY_SOURCES.ANONYMOUS
    })
  })

  it('validates non-anonymous actor identities before audit attribution uses them', () => {
    expect(service.assertResolvedActor({
      actorUserId: 'user-1',
      actorDisplayName: 'User One',
      actorRole: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.PRINCIPAL
    })).toEqual(expect.objectContaining({ actorUserId: 'user-1' }))

    expect(() => service.assertResolvedActor({
      actorUserId: 'user-1',
      actorRole: 'ADMIN',
      identitySource: service.ACTOR_IDENTITY_SOURCES.PRINCIPAL
    })).toThrow('Resolved actor display name is required')
  })

  it('keeps role normalization explicit for future user and role completion work', () => {
    expect(service.normalizeActorRole('food beverage lead')).toBe('FOOD_BEVERAGE_LEAD')
    expect(service.normalizeActorDisplayName({ email: 'leader@example.com', userId: 'user-1' })).toBe('leader@example.com')
  })
})

it('keeps demo audit actors attributable when no normalized application user id exists', () => {
  expect(service.buildDemoActor({
    id: 'demo-operator-9',
    displayName: 'Demo Operator',
    role: 'TURNAROUND_MANAGER'
  })).toEqual({
    actorUserId: 'demo-operator-9',
    actorDisplayName: 'Demo Operator',
    actorRole: 'TURNAROUND_MANAGER',
    identitySource: service.ACTOR_IDENTITY_SOURCES.DEMO
  })
})
