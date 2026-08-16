const db = require('../../db')

jest.mock('../../db', () => ({ select: jest.fn() }))

const {
  buildBookingPassengerStorageValues,
  findBookingOverlapForPassengers,
  getBookingDetails,
  getBookingDetailsBatch,
  indexRowsBy,
  selectByIds
} = require('../../services/bookingDomain.service')

function queueSelectResults(...results) {
  for (const result of results) {
    db.select.mockImplementationOnce(() => ({
      from: () => ({
        where: () => {
          const promise = Promise.resolve(result)
          promise.limit = () => Promise.resolve(result)
          return promise
        }
      })
    }))
  }
}

describe('booking domain behavior and relational resilience', () => {
  beforeEach(() => jest.clearAllMocks())

  test('preserves an existing passenger UUID while normalizing boolean storage values', () => {
    expect(buildBookingPassengerStorageValues('B1', {
      customerId: 'C1', passengerRole: 'GUEST', isPrimaryGuest: 1,
      diningPreference: 'Late', accessibilityNotes: null, boardingGroup: 'A'
    }, { bookingPassengerUuid: 'uuid-1' })).toEqual(expect.objectContaining({
      id: 'B1-C1', bookingPassengerUuid: 'uuid-1', isPrimaryGuest: true
    }))

    expect(buildBookingPassengerStorageValues('B1', {
      customerId: 'C2', passengerRole: 'GUEST', isPrimaryGuest: 0
    })).not.toHaveProperty('bookingPassengerUuid')
  })

  test('indexes rows by the requested key and tolerates missing collections', () => {
    expect(indexRowsBy(null, 'id').size).toBe(0)
    expect(indexRowsBy([{ id: 'a' }, { id: 'b' }], 'id').get('b')).toEqual({ id: 'b' })
  })

  test('selectByIds skips empty input, de-duplicates ids, and chunks large bulk reads', async () => {
    expect(await selectByIds({}, {}, [])).toEqual([])
    expect(db.select).not.toHaveBeenCalled()

    const ids = Array.from({ length: 502 }, (_, i) => `id-${i}`)
    queueSelectResults([{ id: 'first' }], [{ id: 'second' }])
    await expect(selectByIds({}, {}, [...ids, 'id-1', null, ''])).resolves.toEqual([{ id: 'first' }, { id: 'second' }])
    expect(db.select).toHaveBeenCalledTimes(2)
  })

  test('detects inclusive sailing overlap and returns the conflicting passenger and booking', async () => {
    queueSelectResults(
      [{ bookingId: 'OLD1', customerId: 'C1' }],
      [{ id: 'OLD1', sailingId: 'S-OLD' }],
      [{ id: 'S-OLD', departureDate: '2026-08-17', days: 4 }]
    )

    await expect(findBookingOverlapForPassengers({
      sailing: { departureDate: '2026-08-14', days: 4 },
      passengers: [{ customerId: 'C1' }]
    })).resolves.toEqual({ customerId: 'C1', bookingId: 'OLD1', departureDate: '2026-08-17' })
  })

  test('skips the booking being updated and ignores missing booking or sailing relationships', async () => {
    queueSelectResults(
      [{ bookingId: 'SELF', customerId: 'C1' }, { bookingId: 'MISSING', customerId: 'C1' }, { bookingId: 'NO-SAIL', customerId: 'C1' }],
      [{ id: 'NO-SAIL', sailingId: 'S404' }],
      []
    )

    await expect(findBookingOverlapForPassengers({
      bookingIdToExclude: 'SELF',
      sailing: { departureDate: '2026-08-14', days: 7 },
      passengers: [{ customerId: 'C1' }]
    })).resolves.toBeNull()
  })

  test('does not report non-overlapping adjacent voyage history', async () => {
    queueSelectResults(
      [{ bookingId: 'OLD1', customerId: 'C1' }],
      [{ id: 'OLD1', sailingId: 'S-OLD' }],
      [{ id: 'S-OLD', departureDate: '2026-08-01', days: 7 }]
    )
    await expect(findBookingOverlapForPassengers({
      sailing: { departureDate: '2026-08-14', days: 7 }, passengers: [{ customerId: 'C1' }]
    })).resolves.toBeNull()
  })


  test('bulk overlap detection de-duplicates passenger ids and skips database work for empty passenger sets', async () => {
    await expect(findBookingOverlapForPassengers({
      sailing: { departureDate: '2026-08-14', days: 7 },
      passengers: []
    })).resolves.toBeNull()
    expect(db.select).not.toHaveBeenCalled()

    queueSelectResults(
      [{ bookingId: 'OLD1', customerId: 'C1' }],
      [{ id: 'OLD1', sailingId: 'S-OLD' }],
      [{ id: 'S-OLD', departureDate: '2026-08-14', days: 7 }]
    )

    await expect(findBookingOverlapForPassengers({
      sailing: { departureDate: '2026-08-14', days: 7 },
      passengers: [{ customerId: 'C1' }, { customerId: 'C1' }, { customerId: null }]
    })).resolves.toEqual({ customerId: 'C1', bookingId: 'OLD1', departureDate: '2026-08-14' })
    expect(db.select).toHaveBeenCalledTimes(3)
  })

  test('batch hydration keeps missing relationships null while hydrating available passenger/customer data', async () => {
    queueSelectResults(
      [{ bookingId: 'B1', customerId: 'C1', passengerRole: 'PRIMARY' }],
      [{ id: 'S1', shipId: 'SHIP1', departureDate: '2026-08-14' }],
      [{ id: 'C1', firstName: 'Ada' }],
      [{ id: 'SHIP1', cruiseLineId: 'CL1', name: 'Explorer' }],
      [{ id: 'CL1', name: 'Line One' }]
    )
    const result = await getBookingDetailsBatch([
      { id: 'B1', sailingId: 'S1' },
      { id: 'B2', sailingId: 'S404' }
    ])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(expect.objectContaining({ id: 'B1', passengers: [expect.objectContaining({ customer: expect.objectContaining({ firstName: 'Ada' }) })] }))
    expect(result[1]).toEqual(expect.objectContaining({ id: 'B2', sailing: null, ship: null, cruiseLine: null, passengers: [] }))
  })

  test('batch hydration returns empty for empty input without querying the database', async () => {
    await expect(getBookingDetailsBatch([])).resolves.toEqual([])
    await expect(getBookingDetailsBatch(null)).resolves.toEqual([])
    expect(db.select).not.toHaveBeenCalled()
  })

  test('single booking hydration returns null for missing booking and tolerates missing sailing', async () => {
    await expect(getBookingDetails(null)).resolves.toBeNull()
    expect(db.select).not.toHaveBeenCalled()

    queueSelectResults([], [], [])
    const result = await getBookingDetails({ id: 'B1', sailingId: 'S404' })
    expect(result).toEqual(expect.objectContaining({ id: 'B1', sailing: null, ship: null, cruiseLine: null, itinerary: [], passengers: [] }))
  })

  test('single booking hydration sorts itinerary days and activities and resolves the fleet hierarchy', async () => {
    queueSelectResults(
      [{ id: 'S1', shipId: 'SHIP1', departureDate: '2026-08-14' }],
      [{ id: 'SHIP1', cruiseLineId: 'CL1' }],
      [{ id: 'CL1', name: 'Line One' }],
      [{ bookingId: 'B1', customerId: 'C1', passengerRole: 'PRIMARY' }],
      [{ id: 'C1', firstName: 'Ada' }],
      [{ id: 'D2', sailingId: 'S1', day: 2 }, { id: 'D1', sailingId: 'S1', day: 1 }],
      [{ itineraryDayId: 'D2', time: '18:00', name: 'Dinner' }, { itineraryDayId: 'D2', time: '08:00', name: 'Breakfast' }],
      [{ itineraryDayId: 'D1', time: null, name: 'Embarkation' }]
    )
    const result = await getBookingDetails({ id: 'B1', sailingId: 'S1' })
    expect(result.ship).toEqual(expect.objectContaining({ id: 'SHIP1' }))
    expect(result.cruiseLine).toEqual(expect.objectContaining({ id: 'CL1' }))
    expect(result.passengers[0].customer).toEqual(expect.objectContaining({ firstName: 'Ada' }))
    expect(result.itineraryDays.map(day => day.id)).toEqual(['D1', 'D2'])
    expect(result.itineraryDays[1].activitySchedule.map(item => item.name)).toEqual(['Breakfast', 'Dinner'])
  })
})
