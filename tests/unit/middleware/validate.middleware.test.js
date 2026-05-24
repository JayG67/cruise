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
})
