const {
  buildApiIdentity,
  withApiIdentity,
  withCruiseLineApiIdentity,
  withShipApiIdentity,
  withSailingApiIdentity,
  withCustomerApiIdentity,
  withBookingApiIdentity,
  withBookingPassengerApiIdentity,
  withPreCruiseChecklistApiIdentity,
  withItineraryFavoriteApiIdentity
} = require('../../services/apiIdentityBridge.service')

describe('API identity bridge behavior', () => {
  test('falls back between durable and display identifiers and compacts optional scope data', () => {
    expect(buildApiIdentity({
      entityType: 'TEST',
      durableId: '',
      displayId: 'display-1',
      tenantScope: { cruiseLineId: 'line-1', shipId: null, empty: '' },
      relationships: { parentId: undefined, bookingId: 'booking-1' }
    })).toEqual({
      entityType: 'TEST',
      durableId: 'display-1',
      displayId: 'display-1',
      tenantScope: { cruiseLineId: 'line-1' },
      relationships: { bookingId: 'booking-1' }
    })

    expect(buildApiIdentity({ entityType: 'TEST', durableId: 'durable-1' })).toEqual({
      entityType: 'TEST',
      durableId: 'durable-1',
      displayId: 'durable-1',
      tenantScope: {},
      relationships: {}
    })
  })

  test('preserves null rows and overlays identity without mutating the source row', () => {
    expect(withApiIdentity(null, { entityType: 'TEST' })).toBeNull()
    const row = { id: 'row-1', name: 'Original' }
    const result = withApiIdentity(row, { entityType: 'TEST', durableId: 'row-1' })

    expect(result).not.toBe(row)
    expect(result).toEqual(expect.objectContaining({ id: 'row-1', name: 'Original' }))
    expect(result.apiIdentity).toEqual(expect.objectContaining({ entityType: 'TEST', durableId: 'row-1' }))
    expect(row.apiIdentity).toBeUndefined()
  })

  test('builds cruise line, ship, and sailing tenant identities', () => {
    expect(withCruiseLineApiIdentity({ id: 'line-1', name: 'Line One' }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'CRUISE_LINE',
      durableId: 'line-1',
      displayId: 'Line One',
      tenantScope: { cruiseLineId: 'line-1' }
    }))
    expect(withShipApiIdentity({ id: 'ship-1', name: 'Ship One', cruiseLineId: 'line-1' }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'SHIP',
      tenantScope: { cruiseLineId: 'line-1', shipId: 'ship-1' },
      relationships: { cruiseLineId: 'line-1' }
    }))
    expect(withSailingApiIdentity({ id: 'sailing-1', shipId: 'ship-1', departureDate: '2026-08-20' }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'SAILING',
      displayId: '2026-08-20',
      tenantScope: { shipId: 'ship-1', sailingId: 'sailing-1' }
    }))
  })

  test('builds customer and booking identities with durable UUIDs and relationship scope', () => {
    expect(withCustomerApiIdentity({ id: 'customer-1', customerUuid: 'customer-uuid' }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'CUSTOMER',
      durableId: 'customer-uuid',
      displayId: 'customer-1',
      relationships: { customerId: 'customer-1' }
    }))
    expect(withBookingApiIdentity({
      id: 'booking-1', bookingUuid: 'booking-uuid', sailingId: 'sailing-1', createdByCustomerId: 'customer-1', createdByUserId: 'user-1'
    }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'BOOKING',
      durableId: 'booking-uuid',
      tenantScope: { sailingId: 'sailing-1' },
      relationships: {
        bookingId: 'booking-1',
        sailingId: 'sailing-1',
        createdByCustomerId: 'customer-1',
        createdByUserId: 'user-1'
      }
    }))
  })

  test('builds passenger, checklist, and itinerary favorite relationship identities', () => {
    expect(withBookingPassengerApiIdentity({
      id: 'passenger-1', bookingPassengerUuid: 'passenger-uuid', bookingId: 'booking-1', customerId: 'customer-1'
    }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'BOOKING_PASSENGER',
      tenantScope: { bookingId: 'booking-1' },
      relationships: { bookingId: 'booking-1', customerId: 'customer-1' }
    }))
    expect(withPreCruiseChecklistApiIdentity({ customerId: 'customer-1', checklistUuid: 'checklist-uuid' }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'PRE_CRUISE_CHECKLIST',
      durableId: 'checklist-uuid',
      relationships: { customerId: 'customer-1' }
    }))
    expect(withItineraryFavoriteApiIdentity({
      id: 'favorite-1', favoriteUuid: 'favorite-uuid', customerId: 'customer-1', activityScheduleId: 'activity-1'
    }).apiIdentity).toEqual(expect.objectContaining({
      entityType: 'ITINERARY_FAVORITE',
      durableId: 'favorite-uuid',
      relationships: { customerId: 'customer-1', activityScheduleId: 'activity-1' }
    }))
  })
})

describe('API identity malformed metadata hardening', () => {
  test('treats null, scalar, and array scope metadata as empty objects', () => {
    expect(buildApiIdentity({ entityType: 'TEST', durableId: 'id-1', tenantScope: null, relationships: 'bad' })).toEqual({
      entityType: 'TEST', durableId: 'id-1', displayId: 'id-1', tenantScope: {}, relationships: {}
    })
    expect(buildApiIdentity({ entityType: 'TEST', displayId: 'id-2', tenantScope: [], relationships: 7 })).toEqual({
      entityType: 'TEST', durableId: 'id-2', displayId: 'id-2', tenantScope: {}, relationships: {}
    })
  })

  test('keeps falsy-but-valid scalar metadata while dropping empty optional values', () => {
    expect(buildApiIdentity({
      entityType: 'TEST', durableId: 'id-3',
      tenantScope: { zero: 0, disabled: false, blank: '', missing: null },
      relationships: { zero: 0, disabled: false, missing: undefined }
    })).toEqual(expect.objectContaining({
      tenantScope: { zero: 0, disabled: false },
      relationships: { zero: 0, disabled: false }
    }))
  })
})
