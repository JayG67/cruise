const {
  cruiseLineSchema,
  shipSchema,
  customerSchema,
  bookingSchema,
  turnaroundTaskStatusUpdateSchema,
  turnaroundTaskDetailUpdateSchema,
  turnaroundTaskCreateSchema,
  turnaroundSignoffUpdateSchema,
  turnaroundStaffingUpdateSchema,
  turnaroundEscalationCreateSchema,
  turnaroundEscalationUpdateSchema
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
        currentPort: 'Miami, Florida',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'Icon of the Seas',
        currentPort: 'Miami, Florida',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    it('should trim the ship name', () => {
      const result = shipSchema.safeParse({
        name: '  Icon of the Seas  ',
        currentPort: '  Miami, Florida  ',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Icon of the Seas')
      expect(result.data.currentPort).toBe('Miami, Florida')
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


    it('should reject a missing currentPort', () => {
      const result = shipSchema.safeParse({
        name: 'Icon of the Seas',
        cruiseLineId: '550e8400-e29b-41d4-a716-446655440000'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['currentPort']
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

  describe('customerSchema', () => {
    it('should accept a valid C-prefixed customer payload', () => {
      const result = customerSchema.safeParse({
        id: 'C000000001',
        firstName: 'Jay',
        lastName: 'Gallagher',
        email: 'jay.demo@example.com',
        phone: '555-0101',
        loyaltyNumber: 'RC-DIAMOND-001'
      })

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('C000000001')
    })

    it('should reject customer IDs that do not start with C', () => {
      const result = customerSchema.safeParse({
        id: 'X000000001',
        firstName: 'Jay',
        lastName: 'Gallagher',
        email: 'jay.demo@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['id']
          })
        ])
      )
    })
  })

  describe('bookingSchema', () => {
    const validBookingPayload = {
      id: 'B000000001',
      sailingId: '550e8400-e29b-41d4-a716-446655440000',
      bookingStatus: 'CONFIRMED',
      cabinNumber: '10234',
      fareCode: 'BALCONY',
      embarkationPort: 'Miami, Florida',
      debarkationPort: 'Miami, Florida',
      createdByCustomerId: 'C000000001',
      passengers: [
        {
          customerId: 'C000000001',
          passengerRole: 'PRIMARY',
          isPrimaryGuest: true,
          diningPreference: 'Early seating',
          boardingGroup: 'A'
        },
        {
          customerId: 'C000000002',
          passengerRole: 'GUEST',
          isPrimaryGuest: false,
          diningPreference: 'Early seating',
          boardingGroup: 'A'
        }
      ]
    }

    it('should accept a valid B-prefixed booking payload with passengers', () => {
      const result = bookingSchema.safeParse(validBookingPayload)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('B000000001')
      expect(result.data.passengers).toHaveLength(2)
    })

    it('should reject booking IDs that do not start with B', () => {
      const result = bookingSchema.safeParse({
        ...validBookingPayload,
        id: 'C000000001'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['id']
          })
        ])
      )
    })

    it('should reject bookings without passengers', () => {
      const result = bookingSchema.safeParse({
        ...validBookingPayload,
        passengers: []
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['passengers']
          })
        ])
      )
    })
  })


  describe('customerSchema additional portfolio rules', () => {
    it('should trim optional customer fields', () => {
      const result = customerSchema.safeParse({
        id: 'C123456789',
        firstName: '  Ada  ',
        lastName: '  Lovelace  ',
        email: '  ada@example.com  ',
        phone: '  555-0100  ',
        loyaltyNumber: '  ELITE-1  '
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: 'C123456789',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '555-0100',
        loyaltyNumber: 'ELITE-1'
      })
    })

    it('should reject malformed customer email addresses', () => {
      const result = customerSchema.safeParse({
        id: 'C123456789',
        firstName: 'Invalid',
        lastName: 'Email',
        email: 'not-an-email'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['email'],
            message: 'Email must be a valid email address'
          })
        ])
      )
    })

    it('should reject lowercase customer ID prefixes and short IDs', () => {
      const lowercaseResult = customerSchema.safeParse({
        id: 'c123456789',
        firstName: 'Lower',
        lastName: 'Case',
        email: 'lower.case@example.com'
      })

      const shortResult = customerSchema.safeParse({
        id: 'C123',
        firstName: 'Too',
        lastName: 'Short',
        email: 'too.short@example.com'
      })

      expect(lowercaseResult.success).toBe(false)
      expect(shortResult.success).toBe(false)
    })

    it('should reject unsupported customer fields', () => {
      const result = customerSchema.safeParse({
        id: 'C123456789',
        firstName: 'Extra',
        lastName: 'Field',
        email: 'extra.field@example.com',
        password: 'should-not-be-in-customer-domain'
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

  describe('bookingSchema additional portfolio rules', () => {
    const baseBooking = {
      id: 'B123456789',
      sailingId: '550e8400-e29b-41d4-a716-446655440000',
      bookingStatus: 'CONFIRMED',
      cabinNumber: '10234',
      fareCode: 'BALCONY',
      embarkationPort: 'Miami, Florida',
      debarkationPort: 'Miami, Florida',
      createdByCustomerId: 'C123456789',
      passengers: [
        {
          customerId: 'C123456789',
          passengerRole: 'PRIMARY',
          isPrimaryGuest: true,
          diningPreference: '  Early seating  ',
          accessibilityNotes: '  Near elevator  ',
          boardingGroup: '  A  '
        }
      ]
    }

    it('should trim booking and passenger display fields', () => {
      const result = bookingSchema.safeParse({
        ...baseBooking,
        bookingStatus: '  CONFIRMED  ',
        cabinNumber: '  10234  ',
        fareCode: '  BALCONY  ',
        embarkationPort: '  Miami, Florida  ',
        debarkationPort: '  Miami, Florida  '
      })

      expect(result.success).toBe(true)
      expect(result.data.bookingStatus).toBe('CONFIRMED')
      expect(result.data.cabinNumber).toBe('10234')
      expect(result.data.fareCode).toBe('BALCONY')
      expect(result.data.passengers[0].diningPreference).toBe('Early seating')
      expect(result.data.passengers[0].accessibilityNotes).toBe('Near elevator')
      expect(result.data.passengers[0].boardingGroup).toBe('A')
    })

    it('should default missing isPrimaryGuest values to false on passengers', () => {
      const result = bookingSchema.safeParse({
        ...baseBooking,
        passengers: [
          {
            customerId: 'C123456789',
            passengerRole: 'GUEST'
          }
        ]
      })

      expect(result.success).toBe(true)
      expect(result.data.passengers[0].isPrimaryGuest).toBe(false)
    })

    it('should reject invalid sailing UUIDs before reaching the API', () => {
      const result = bookingSchema.safeParse({
        ...baseBooking,
        sailingId: 'not-a-uuid'
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['sailingId'],
            message: 'Invalid UUID format'
          })
        ])
      )
    })

    it('should reject passenger customer IDs that are not C-prefixed ten-character IDs', () => {
      const result = bookingSchema.safeParse({
        ...baseBooking,
        passengers: [
          {
            customerId: 'X123456789',
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

      expect(result.success).toBe(false)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['passengers', 0, 'customerId']
          })
        ])
      )
    })

    it('should reject unsupported booking fields', () => {
      const result = bookingSchema.safeParse({
        ...baseBooking,
        paymentCardNumber: '4111111111111111'
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

    it('should reject unsupported dining preference values', () => {
      const result = bookingSchema.safeParse({
        id: 'B123456789',
        sailingId: '550e8400-e29b-41d4-a716-446655440000',
        bookingStatus: 'CONFIRMED',
        createdByCustomerId: 'C123456789',
        passengers: [
          {
            customerId: 'C123456789',
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true,
            diningPreference: 'Whatever I want'
          }
        ]
      })

      expect(result.success).toBe(false)
    })


  describe('turnaroundTaskCreateSchema', () => {
    it('trims and normalizes valid turnaround task creation payloads', () => {
      const result = turnaroundTaskCreateSchema.safeParse({
        departmentRole: ' guest-services-lead ',
        taskName: ' Open late-arrival guest support desk ',
        ownerName: ' Angela Brooks ',
        dueTime: ' 11:15 ',
        location: ' Terminal help desk ',
        blockerReason: ' Awaiting pier staffing confirmation ',
        status: 'in progress'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        departmentRole: 'guest-services-lead',
        taskName: 'Open late-arrival guest support desk',
        ownerName: 'Angela Brooks',
        dueTime: '11:15',
        location: 'Terminal help desk',
        blockerReason: 'Awaiting pier staffing confirmation',
        status: 'IN_PROGRESS'
      })
    })

    it('rejects blank turnaround task names', () => {
      const result = turnaroundTaskCreateSchema.safeParse({
        departmentRole: 'guest-services-lead',
        taskName: '   '
      })

      expect(result.success).toBe(false)
    })
  })


  describe('turnaroundTaskStatusUpdateSchema', () => {
    it('normalizes supported operational task statuses', () => {
      const result = turnaroundTaskStatusUpdateSchema.safeParse({ status: 'in progress' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ status: 'IN_PROGRESS' })
    })

    it('accepts blocker notes alongside blocked status updates', () => {
      const result = turnaroundTaskStatusUpdateSchema.safeParse({
        status: 'blocked',
        blockerReason: 'Waiting for pier-side clearance'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        status: 'BLOCKED',
        blockerReason: 'Waiting for pier-side clearance'
      })
    })

    it('rejects unsupported operational task statuses', () => {
      const result = turnaroundTaskStatusUpdateSchema.safeParse({ status: 'maybe later' })

      expect(result.success).toBe(false)
    })
  })

  describe('turnaroundTaskDetailUpdateSchema', () => {
    it('accepts operational task ownership and timing details', () => {
      const result = turnaroundTaskDetailUpdateSchema.safeParse({
        ownerName: 'Jordan Pierce',
        dueTime: '09:45',
        location: 'Pier 4 command desk',
        blockerReason: 'Waiting for terminal headcount reconciliation'
      })

      expect(result.success).toBe(true)
    })

    it('rejects overly long blocker notes', () => {
      const result = turnaroundTaskDetailUpdateSchema.safeParse({
        blockerReason: 'x'.repeat(501)
      })

      expect(result.success).toBe(false)
    })
  })



  describe('turnaroundStaffingUpdateSchema', () => {
    it('accepts database-backed department staffing counts and handoff notes', () => {
      const result = turnaroundStaffingUpdateSchema.safeParse({
        plannedCount: 42,
        checkedInCount: 38,
        leadName: 'Maria Rodriguez',
        musterLocation: 'Guest decks',
        notes: 'Deck teams staged by zone.'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        plannedCount: 42,
        checkedInCount: 38,
        leadName: 'Maria Rodriguez',
        musterLocation: 'Guest decks',
        notes: 'Deck teams staged by zone.'
      })
    })

    it('rejects negative staffing counts', () => {
      const result = turnaroundStaffingUpdateSchema.safeParse({
        plannedCount: -1,
        checkedInCount: 0
      })

      expect(result.success).toBe(false)
    })
  })

  describe('turnaroundSignoffUpdateSchema', () => {
    it('normalizes supported operational signoff statuses', () => {
      const result = turnaroundSignoffUpdateSchema.safeParse({
        approverName: 'Alex Turner',
        status: 'approved',
        notes: 'Department is ready for embarkation.'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        approverName: 'Alex Turner',
        status: 'APPROVED',
        notes: 'Department is ready for embarkation.'
      })
    })

    it('rejects unsupported operational signoff statuses', () => {
      const result = turnaroundSignoffUpdateSchema.safeParse({
        approverName: 'Alex Turner',
        status: 'maybe'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('turnaroundEscalation schemas', () => {
    it('normalizes supported escalation create payloads', () => {
      const result = turnaroundEscalationCreateSchema.safeParse({
        departmentRole: ' guest-services-lead ',
        severity: 'critical',
        title: ' Terminal queue risk ',
        ownerName: ' Angela Brooks ',
        status: 'open',
        resolutionNotes: ' Auxiliary lane opening. '
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        departmentRole: 'guest-services-lead',
        severity: 'CRITICAL',
        title: 'Terminal queue risk',
        ownerName: 'Angela Brooks',
        status: 'OPEN',
        resolutionNotes: 'Auxiliary lane opening.'
      })
    })

    it('normalizes supported escalation update payloads', () => {
      const result = turnaroundEscalationUpdateSchema.safeParse({
        severity: 'watch',
        status: 'resolved',
        ownerName: 'Alex Turner',
        resolutionNotes: 'Cleared by command center.'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        severity: 'WATCH',
        status: 'RESOLVED',
        ownerName: 'Alex Turner',
        resolutionNotes: 'Cleared by command center.'
      })
    })

    it('rejects unsupported escalation severity values', () => {
      const result = turnaroundEscalationCreateSchema.safeParse({
        departmentRole: 'engineering-lead',
        severity: 'emergency-ish',
        title: 'Bad escalation'
      })

      expect(result.success).toBe(false)
    })
  })


})
