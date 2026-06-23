const {
  COMPACT_PROFILE,
  FULL_PROFILE,
  applyBookingPayloadProfile,
  applyCustomerPayloadProfile,
  compactBooking,
  compactCustomer,
  normalizePayloadProfile
} = require('../../services/apiPayloadProfile.service')

describe('apiPayloadProfile.service', () => {
  it('normalizes payload profile requests to full unless compact is explicitly requested', () => {
    expect(normalizePayloadProfile('compact')).toBe(COMPACT_PROFILE)
    expect(normalizePayloadProfile('COMPACT')).toBe(COMPACT_PROFILE)
    expect(normalizePayloadProfile('full')).toBe(FULL_PROFILE)
    expect(normalizePayloadProfile('oversized')).toBe(FULL_PROFILE)
    expect(normalizePayloadProfile()).toBe(FULL_PROFILE)
  })

  it('builds compact booking payloads without nested itinerary arrays while preserving identity and passenger summary data', () => {
    const booking = {
      id: 'B000000001',
      bookingUuid: 'booking-uuid-1',
      sailingId: 'sailing-1',
      bookingStatus: 'CONFIRMED',
      cabinNumber: '1010',
      fareCode: 'BALCONY',
      embarkationPort: 'Miami',
      debarkationPort: 'Miami',
      createdByCustomerId: 'C000000001',
      apiIdentity: { entityType: 'BOOKING', durableId: 'booking-uuid-1' },
      sailing: {
        id: 'sailing-1',
        shipId: 'ship-1',
        departureDate: '2026-01-10',
        itinerary: [{ id: 'day-1' }],
        itineraryDays: [{ id: 'day-1' }],
        apiIdentity: { entityType: 'SAILING', durableId: 'sailing-1' }
      },
      ship: { id: 'ship-1', name: 'Icon', currentPort: 'Miami', apiIdentity: { entityType: 'SHIP' } },
      cruiseLine: { id: 'line-1', name: 'Royal Caribbean', website: 'https://example.com', apiIdentity: { entityType: 'CRUISE_LINE' } },
      passengers: [
        {
          id: 'B000000001-C000000001',
          bookingPassengerUuid: 'passenger-uuid-1',
          bookingId: 'B000000001',
          customerId: 'C000000001',
          passengerRole: 'PRIMARY',
          isPrimaryGuest: true,
          accessibilityNotes: 'Wheelchair access',
          apiIdentity: { entityType: 'BOOKING_PASSENGER', durableId: 'passenger-uuid-1' },
          customer: {
            id: 'C000000001',
            customerUuid: 'customer-uuid-1',
            firstName: 'Jay',
            lastName: 'Gallagher',
            email: 'jay@example.com',
            apiIdentity: { entityType: 'CUSTOMER', durableId: 'customer-uuid-1' }
          }
        }
      ],
      itinerary: [{ id: 'day-1' }],
      itineraryDays: [{ id: 'day-1' }]
    }

    const compact = compactBooking(booking)

    expect(compact).toEqual(expect.objectContaining({
      id: 'B000000001',
      bookingUuid: 'booking-uuid-1',
      passengerCount: 1,
      apiIdentity: expect.objectContaining({ entityType: 'BOOKING' })
    }))
    expect(compact.itinerary).toBeUndefined()
    expect(compact.itineraryDays).toBeUndefined()
    expect(compact.sailing.itinerary).toBeUndefined()
    expect(compact.sailing.itineraryDays).toBeUndefined()
    expect(compact.primaryPassenger).toEqual(expect.objectContaining({
      customerId: 'C000000001',
      apiIdentity: expect.objectContaining({ entityType: 'BOOKING_PASSENGER' })
    }))
    expect(compact.primaryPassenger.customer).toEqual(expect.objectContaining({
      id: 'C000000001',
      customerUuid: 'customer-uuid-1',
      apiIdentity: expect.objectContaining({ entityType: 'CUSTOMER' })
    }))
  })


  it('builds compact customer payloads with identity and checklist summary data only', () => {
    const customer = {
      id: 'C000000001',
      customerUuid: 'customer-uuid-1',
      firstName: 'Jay',
      lastName: 'Gallagher',
      email: 'jay@example.com',
      phone: '555-0101',
      loyaltyNumber: 'LOYAL-1',
      accessibilityNotes: 'Keep out of compact list payloads',
      diningPreference: 'Late seating',
      apiIdentity: { entityType: 'CUSTOMER', durableId: 'customer-uuid-1' },
      preCruiseChecklist: {
        id: 'checklist-1',
        checklistUuid: 'checklist-uuid-1',
        customerId: 'C000000001',
        completionStatus: 'IN_PROGRESS',
        passportVerified: true,
        emergencyContactName: 'Oversized nested detail',
        apiIdentity: { entityType: 'PRE_CRUISE_CHECKLIST', durableId: 'checklist-uuid-1' }
      }
    }

    const compact = compactCustomer(customer)

    expect(compact).toEqual(expect.objectContaining({
      id: 'C000000001',
      customerUuid: 'customer-uuid-1',
      firstName: 'Jay',
      lastName: 'Gallagher',
      email: 'jay@example.com',
      loyaltyNumber: 'LOYAL-1',
      apiIdentity: expect.objectContaining({ entityType: 'CUSTOMER' }),
      preCruiseChecklist: expect.objectContaining({
        checklistUuid: 'checklist-uuid-1',
        completionStatus: 'IN_PROGRESS',
        apiIdentity: expect.objectContaining({ entityType: 'PRE_CRUISE_CHECKLIST' })
      })
    }))
    expect(compact.phone).toBeUndefined()
    expect(compact.accessibilityNotes).toBeUndefined()
    expect(compact.diningPreference).toBeUndefined()
    expect(compact.preCruiseChecklist.passportVerified).toBeUndefined()
    expect(compact.preCruiseChecklist.emergencyContactName).toBeUndefined()
  })

  it('leaves full payloads unchanged unless compact is requested', () => {
    const booking = { id: 'B000000001', itineraryDays: [{ id: 'day-1' }] }

    expect(applyBookingPayloadProfile([booking], 'full')).toBeInstanceOf(Array)
    expect(applyBookingPayloadProfile([booking], 'full')[0]).toBe(booking)
    expect(applyBookingPayloadProfile([booking], 'compact')[0]).not.toBe(booking)
    expect(applyBookingPayloadProfile([booking], 'compact')[0].itineraryDays).toBeUndefined()

    const customer = { id: 'C000000001', phone: '555-0101', preCruiseChecklist: { customerId: 'C000000001', passportVerified: true } }
    expect(applyCustomerPayloadProfile([customer], 'full')[0]).toBe(customer)
    expect(applyCustomerPayloadProfile([customer], 'compact')[0]).not.toBe(customer)
    expect(applyCustomerPayloadProfile([customer], 'compact')[0].phone).toBeUndefined()
  })
})
