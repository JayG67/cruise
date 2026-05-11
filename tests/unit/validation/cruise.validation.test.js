const {
  cruiseLineSchema,
  shipSchema
} = require('../../../validation/cruise.validation')

describe('Cruise validation schemas', () => {
  describe('cruiseLineSchema', () => {
    it('should accept a valid cruise line payload', () => {
      const result = cruiseLineSchema.safeParse({
        name: 'Royal Caribbean',
        country: 'United States',
        website: 'https://www.royalcaribbean.com'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'Royal Caribbean',
        country: 'United States',
        website: 'https://www.royalcaribbean.com'
      })
    })

    it('should trim string fields', () => {
      const result = cruiseLineSchema.safeParse({
        name: '  Royal Caribbean  ',
        country: '  United States  ',
        website: '  https://www.royalcaribbean.com  '
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'Royal Caribbean',
        country: 'United States',
        website: 'https://www.royalcaribbean.com'
      })
    })

    it('should allow optional country and website fields', () => {
      const result = cruiseLineSchema.safeParse({
        name: 'Royal Caribbean'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'Royal Caribbean'
      })
    })

    it('should reject a blank cruise line name', () => {
      const result = cruiseLineSchema.safeParse({
        name: '   ',
        country: 'United States',
        website: 'https://example.com'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['name'],
            message: 'Cruise line name is required'
          })
        ])
      )
    })

    it('should reject an invalid website URL', () => {
      const result = cruiseLineSchema.safeParse({
        name: 'Invalid Website Cruise Line',
        country: 'United States',
        website: 'not-a-url'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['website'],
            message: 'Website must be a valid URL'
          })
        ])
      )
    })

    it('should reject unexpected fields', () => {
      const result = cruiseLineSchema.safeParse({
        name: 'Unexpected Field Cruise Line',
        country: 'United States',
        website: 'https://example.com',
        unsupportedField: 'not allowed'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'unrecognized_keys'
          })
        ])
      )
    })
  })

  describe('shipSchema', () => {
    it('should accept a valid ship payload', () => {
      const result = shipSchema.safeParse({
        name: 'Icon of the Seas',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'Icon of the Seas',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    it('should trim the ship name', () => {
      const result = shipSchema.safeParse({
        name: '  Icon of the Seas  ',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Icon of the Seas')
    })

    it('should reject a blank ship name', () => {
      const result = shipSchema.safeParse({
        name: '   ',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['name'],
            message: 'Ship name is required'
          })
        ])
      )
    })

    it('should reject an invalid cruiseLineId UUID format', () => {
      const result = shipSchema.safeParse({
        name: 'Icon of the Seas',
        cruiseLineId: 'not-a-uuid'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['cruiseLineId'],
            message: 'Invalid UUID format'
          })
        ])
      )
    })

    it('should reject unexpected fields', () => {
      const result = shipSchema.safeParse({
        name: 'Icon of the Seas',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000',
        unsupportedField: 'not allowed'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'unrecognized_keys'
          })
        ])
      )
    })
  })
})
