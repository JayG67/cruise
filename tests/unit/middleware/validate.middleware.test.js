const validate = require('../../../middleware/validate.middleware')
const {
  cruiseLineSchema,
  shipSchema
} = require('../../../validation/cruise.validation')
const mockResponse = require('../helpers/mockResponse')

describe('Validation middleware', () => {
  it('should call next and assign parsed body when request body is valid', () => {
    const req = {
      body: {
        name: '  Royal Caribbean  ',
        country: '  United States  ',
        website: '  https://www.royalcaribbean.com  '
      }
    }
    const res = mockResponse()
    const next = jest.fn()

    validate(cruiseLineSchema)(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(req.body).toEqual({
      name: 'Royal Caribbean',
      country: 'United States',
      website: 'https://www.royalcaribbean.com'
    })
  })

  it('should return 400 and not call next when request body is invalid', () => {
    const req = {
      body: {
        name: '   ',
        country: 'United States',
        website: 'https://example.com'
      }
    }
    const res = mockResponse()
    const next = jest.fn()

    validate(cruiseLineSchema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Cruise line name is required'
          })
        ])
      })
    )
  })

  it('should return normalized validation errors for invalid ship payloads', () => {
    const req = {
      body: {
        name: 'Icon of the Seas',
        cruiseLineId: 'not-a-uuid'
      }
    }
    const res = mockResponse()
    const next = jest.fn()

    validate(shipSchema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'cruiseLineId',
            message: 'Invalid UUID format'
          })
        ])
      })
    )
  })

  it('should always return a JSON validation envelope for invalid website URLs', () => {
    const req = {
      body: {
        name: 'Invalid Website Cruise Line',
        country: 'United States',
        website: 'not-a-real-url'
      }
    }
    const res = mockResponse()
    const next = jest.fn()

    validate(cruiseLineSchema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.type).toHaveBeenCalledWith('application/json')
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'website',
            message: 'Website must be a valid URL'
          })
        ])
      })
    )
  })

  it('should reject unexpected fields through strict schema validation', () => {
    const req = {
      body: {
        name: 'Royal Caribbean',
        country: 'United States',
        website: 'https://www.royalcaribbean.com',
        unsupportedField: 'not allowed'
      }
    }
    const res = mockResponse()
    const next = jest.fn()

    validate(cruiseLineSchema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'body'
          })
        ])
      })
    )
  })


  it('normalizes legacy errors arrays, empty paths, missing messages, and fallback envelopes', () => {
    const res = mockResponse()
    const next = jest.fn()
    const legacySchema = {
      safeParse: jest.fn(() => ({
        success: false,
        error: { errors: [{ path: [], message: '' }] }
      }))
    }

    validate(legacySchema, 'query')({ query: { bad: true } }, res, next)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [{ field: 'query', message: 'Invalid value' }]
    })
    expect(next).not.toHaveBeenCalled()

    const fallbackRes = mockResponse()
    validate({ safeParse: () => ({ success: false, error: {} }) }, 'params')({ params: {} }, fallbackRes, jest.fn())
    expect(fallbackRes.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [{ field: 'params', message: 'Request params did not match the expected schema' }]
    })
  })

  it('assigns parsed values back to non-body request sources', () => {
    const req = { query: { page: '1' } }
    const res = mockResponse()
    const next = jest.fn()
    const schema = { safeParse: jest.fn(() => ({ success: true, data: { page: 1 } })) }

    validate(schema, 'query')(req, res, next)

    expect(req.query).toEqual({ page: 1 })
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

})


const { buildProductionPrincipal, buildRequestIdentity, getScopedDemoUserId } = require('../../../middleware/requestIdentity.middleware')

describe('Request identity middleware', () => {
  it('prefers header-scoped demo identity over legacy query strings', () => {
    const req = {
      headers: {
        'x-cruise-demo-user-id': 'turnaround-manager-harmony'
      },
      query: {
        demoUserId: 'legacy-query-user'
      }
    }

    expect(getScopedDemoUserId(req)).toBe('turnaround-manager-harmony')
    expect(buildRequestIdentity(req)).toEqual({
      authMode: 'demo',
      demoUserId: 'turnaround-manager-harmony',
      principal: null,
      identitySource: 'demo-header',
      isDemoIdentity: true,
      isAuthenticated: true,
      authenticationError: null
    })
  })

  it('keeps legacy demoUserId query support for compatibility', () => {
    const req = {
      headers: {},
      query: {
        demoUserId: 'legacy-query-user'
      }
    }

    expect(getScopedDemoUserId(req)).toBe('legacy-query-user')
    expect(buildRequestIdentity(req)).toEqual({
      authMode: 'demo',
      demoUserId: 'legacy-query-user',
      principal: null,
      identitySource: 'demo-query',
      isDemoIdentity: true,
      isAuthenticated: true,
      authenticationError: null
    })
  })

  it('accepts future production principal headers without removing demo compatibility', () => {
    const req = {
      headers: {
        'x-cruise-user-id': 'auth0|ops-admin',
        'x-cruise-user-email': 'ops.admin@example.com',
        'x-cruise-user-name': 'Operations Admin',
        'x-cruise-user-role': 'ADMIN',
        'x-cruise-tenant-id': 'royal-caribbean'
      },
      query: {}
    }

    expect(buildProductionPrincipal(req)).toEqual({
      userId: 'auth0|ops-admin',
      email: 'ops.admin@example.com',
      displayName: 'Operations Admin',
      role: 'ADMIN',
      tenantId: 'royal-caribbean',
      identitySource: 'test-header'
    })
    expect(buildRequestIdentity(req)).toMatchObject({
      demoUserId: null,
      identitySource: 'test-header',
      isDemoIdentity: false,
      isAuthenticated: true
    })
  })

})
