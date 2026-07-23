const request = require('supertest')

const app = require('../../app')
const db = require('../../db')
const { sailingTable } = require('../../models')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

const {
  uniqueCustomerId,
  uniqueBookingId,
  createCustomer,
  cleanupTestData,
  trackBooking,
  removeTrackedBooking
} = require('./helpers/testDataFactory')
const { getSeededBookingWithPassengers } = require('./helpers/testDataFactory')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

afterEach(async () => {
  await cleanupTestData()

})

async function getFirstSeededSailing() {
  const cruiseRes = await request(app).get('/cruise')
  expect(cruiseRes.statusCode).toBe(200)

  for (const cruiseLine of cruiseRes.body) {
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseLine.id}`)

    if (shipsRes.statusCode !== 200 || !Array.isArray(shipsRes.body)) {
      continue
    }

    for (const ship of shipsRes.body) {
      const sailingsRes = await request(app).get(`/cruise/ship/${ship.id}/sailings`)

      if (
        sailingsRes.statusCode === 200
        && Array.isArray(sailingsRes.body)
        && sailingsRes.body.length > 0
      ) {
        return sailingsRes.body[0]
      }
    }
  }

  throw new Error('No seeded sailings found in test data')
}


function getSailingDateRange(sailing) {
  const start = new Date(`${sailing.departureDate}T00:00:00.000Z`)
  const end = new Date(start)

  end.setUTCDate(end.getUTCDate() + Number(sailing.days || 1))

  return { start, end }
}

function sailingsDoNotOverlap(firstSailing, secondSailing) {
  const first = getSailingDateRange(firstSailing)
  const second = getSailingDateRange(secondSailing)

  return second.end <= first.start || second.start >= first.end
}

async function getNonOverlappingSeededSailing(referenceSailing) {
  // This helper prepares test data; it does not exercise the sailings API.
  // Read the seeded candidates in one database query so the overlap PATCH
  // contract remains deterministic even when the full integration suite is busy.
  const candidates = await db.select().from(sailingTable)
  const candidate = candidates.find(sailing =>
    sailing.id !== referenceSailing.id && sailingsDoNotOverlap(referenceSailing, sailing)
  )

  if (candidate) return candidate

  throw new Error('Expected a seeded sailing outside the reference sailing date range for non-overlap testing')
}


async function createBooking(overrides = {}) {
  const sailing = overrides.sailing || await getFirstSeededSailing()
  const primaryCustomer = overrides.primaryCustomer || await createCustomer({
    firstName: 'Primary',
    lastName: 'Guest'
  })
  const bookingId = overrides.id || uniqueBookingId()

  const payload = {
    id: bookingId,
    sailingId: sailing.id,
    bookingStatus: 'CONFIRMED',
    cabinNumber: `T${bookingId.slice(-5)}`,
    fareCode: 'BALCONY',
    embarkationPort: sailing.departurePort,
    debarkationPort: sailing.arrivalPort,
    createdByCustomerId: primaryCustomer.id,
    passengers: [
      {
        customerId: primaryCustomer.id,
        passengerRole: 'PRIMARY',
        isPrimaryGuest: true,
        diningPreference: 'Early seating',
        boardingGroup: 'A'
      }
    ],
    ...overrides.payload
  }

  const res = await request(app)
    .post('/cruise/bookings')
    .send(payload)

  expect(res.statusCode).toBe(201)
  trackBooking(bookingId)

  return {
    id: bookingId,
    sailing,
    primaryCustomer,
    payload
  }
}

describe('Customer and booking API integration tests', () => {
  it('GET /cruise/customers should return seeded customers with C-prefixed IDs', async () => {
    const res = await request(app).get('/cruise/customers')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(24)
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'C000000001',
          firstName: 'Jay',
          lastName: 'Gallagher'
        })
      ])
    )

    res.body.forEach(customer => {
      expect(customer.id).toMatch(/^C[A-Z0-9]{9}$/)
      expect(customer.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    })
  })

  it('GET /cruise/customers/:id should return a specific seeded customer', async () => {
    const res = await request(app).get('/cruise/customers/C000000001')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 'C000000001',
        firstName: 'Jay',
        lastName: 'Gallagher'
      })
    )
  })

  it('GET /cruise/customers/:id should return 404 for an unknown customer', async () => {
    const res = await request(app).get('/cruise/customers/C999999999')

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Customer not found' })
  })

  it('GET /cruise/bookings should return seeded bookings with sailing and passenger details', async () => {
    const res = await request(app).get('/cruise/bookings')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(17)

    res.body.forEach(booking => {
      expect(booking.id).toMatch(/^B[A-Z0-9]{9}$/)
      expect(booking.sailingId).toEqual(expect.any(String))
      expect(booking.sailing).toEqual(expect.objectContaining({ id: booking.sailingId }))
      expect(booking.apiIdentity).toEqual(expect.objectContaining({
        entityType: 'BOOKING',
        durableId: expect.any(String),
        displayId: booking.id,
        relationships: expect.objectContaining({ bookingId: booking.id, sailingId: booking.sailingId })
      }))
      expect(booking.sailing.apiIdentity).toEqual(expect.objectContaining({
        entityType: 'SAILING',
        durableId: booking.sailingId
      }))
      expect(Array.isArray(booking.passengers)).toBe(true)
      expect(booking.passengers.length).toBeGreaterThan(0)
      expect(booking.passengers.filter(passenger => passenger.isPrimaryGuest)).toHaveLength(1)
      booking.passengers.forEach(passenger => {
        expect(passenger.bookingPassengerUuid).toEqual(expect.any(String))
        expect(passenger.apiIdentity).toEqual(expect.objectContaining({
          entityType: 'BOOKING_PASSENGER',
          durableId: passenger.bookingPassengerUuid,
          displayId: passenger.id,
          relationships: expect.objectContaining({ bookingId: booking.id, customerId: passenger.customerId })
        }))
      })
    })
  })

  it('GET /cruise/customers?payload=compact should preserve identity while returning customer list summaries', async () => {
    const res = await request(app).get('/cruise/customers?payload=compact')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)

    const customer = res.body.find(candidate => candidate.id === 'C000000001') || res.body[0]
    expect(customer).toEqual(expect.objectContaining({
      id: expect.stringMatching(/^C[A-Z0-9]{9}$/),
      customerUuid: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
      email: expect.any(String),
      apiIdentity: expect.objectContaining({ entityType: 'CUSTOMER', durableId: expect.any(String) }),
      preCruiseChecklist: expect.objectContaining({
        customerId: customer.id,
        apiIdentity: expect.objectContaining({ entityType: 'PRE_CRUISE_CHECKLIST' })
      })
    }))
    expect(customer.phone).toBeUndefined()
    expect(customer.diningPreference).toBeUndefined()
    expect(customer.accessibilityNotes).toBeUndefined()
    expect(customer.preCruiseChecklist.passportVerified).toBeUndefined()
  })

  it('GET /cruise/customers/:id should preserve readable IDs while exposing durable API identity metadata', async () => {
    const res = await request(app).get('/cruise/customers/C000000001')

    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe('C000000001')
    expect(res.body.customerUuid).toEqual(expect.any(String))
    expect(res.body.apiIdentity).toEqual(expect.objectContaining({
      entityType: 'CUSTOMER',
      durableId: res.body.customerUuid,
      displayId: 'C000000001',
      relationships: expect.objectContaining({ customerId: 'C000000001' })
    }))
    expect(res.body.preCruiseChecklist.apiIdentity).toEqual(expect.objectContaining({
      entityType: 'PRE_CRUISE_CHECKLIST',
      durableId: expect.any(String),
      relationships: expect.objectContaining({ customerId: 'C000000001' })
    }))
  })

  it('GET /cruise/bookings?payload=compact should preserve identity while omitting oversized itinerary details from list responses', async () => {
    const res = await request(app).get('/cruise/bookings?payload=compact')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(17)

    const booking = res.body[0]
    expect(booking).toEqual(expect.objectContaining({
      id: expect.stringMatching(/^B[A-Z0-9]{9}$/),
      apiIdentity: expect.objectContaining({ entityType: 'BOOKING', durableId: expect.any(String) }),
      passengerCount: expect.any(Number),
      primaryPassenger: expect.objectContaining({
        id: expect.any(String),
        apiIdentity: expect.objectContaining({ entityType: 'BOOKING_PASSENGER' })
      }),
      sailing: expect.objectContaining({
        id: booking.sailingId,
        apiIdentity: expect.objectContaining({ entityType: 'SAILING' })
      })
    }))
    expect(booking.itinerary).toBeUndefined()
    expect(booking.itineraryDays).toBeUndefined()
    expect(booking.sailing.itinerary).toBeUndefined()
    expect(booking.sailing.itineraryDays).toBeUndefined()
    expect(booking.passengers.every(passenger => passenger.apiIdentity?.entityType === 'BOOKING_PASSENGER')).toBe(true)
  })

  it('GET /cruise/bookings/:id should return a specific booking with its passenger list', async () => {
    const res = await request(app).get('/cruise/bookings/B000000001')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 'B000000001',
        passengers: expect.any(Array)
      })
    )
    expect(res.body.passengers.length).toBeGreaterThan(0)
  })

  it('GET /cruise/bookings/:id should return 404 for an unknown booking', async () => {
    const res = await request(app).get('/cruise/bookings/B999999999')

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Booking not found' })
  })

  it('GET /cruise/customers/:customerId/bookings should support rare repeat customers with multiple bookings', async () => {
    const res = await request(app).get('/cruise/customers/C000005349/bookings')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)

    res.body.forEach(booking => {
      expect(booking.passengers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            customerId: 'C000005349'
          })
        ])
      )
    })
  })

  it('GET /cruise/customers/:customerId/bookings should return 404 for a real customer with no bookings', async () => {
    const customer = await createCustomer({
      firstName: 'No',
      lastName: 'Bookings'
    })

    const res = await request(app).get(`/cruise/customers/${customer.id}/bookings`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'No bookings found for the specified customer' })
  })

  it('POST /cruise/customers should create a customer with a custom C-prefixed ID', async () => {
    const id = uniqueCustomerId()

    const res = await request(app)
      .post('/cruise/customers')
      .send({
        id,
        firstName: 'Portfolio',
        lastName: 'Passenger',
        email: `${id.toLowerCase()}@example.com`,
        phone: '555-0200',
        loyaltyNumber: `LOYALTY-${id}`
      })

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({
      message: 'Customer created successfully',
      id
    })

    const getRes = await request(app).get(`/cruise/customers/${id}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body).toEqual(
      expect.objectContaining({
        id,
        firstName: 'Portfolio',
        lastName: 'Passenger',
        phone: '555-0200',
        loyaltyNumber: `LOYALTY-${id}`
      })
    )

    await request(app).delete(`/cruise/customers/${id}`)
  })

  it('POST /cruise/customers should trim customer fields before saving', async () => {
    const id = uniqueCustomerId()

    const res = await request(app)
      .post('/cruise/customers')
      .send({
        id,
        firstName: '  Trimmed  ',
        lastName: '  Customer  ',
        email: `  ${id.toLowerCase()}@example.com  `,
        phone: '  555-0300  ',
        loyaltyNumber: '  LOYALTY-TRIMMED  '
      })

    expect(res.statusCode).toBe(201)

    const getRes = await request(app).get(`/cruise/customers/${id}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body).toEqual(
      expect.objectContaining({
        firstName: 'Trimmed',
        lastName: 'Customer',
        email: `${id.toLowerCase()}@example.com`,
        phone: '555-0300',
        loyaltyNumber: 'LOYALTY-TRIMMED'
      })
    )

    await request(app).delete(`/cruise/customers/${id}`)
  })

  it('POST /cruise/customers should reject IDs that do not start with C', async () => {
    const res = await request(app)
      .post('/cruise/customers')
      .send({
        id: 'X000000001',
        firstName: 'Invalid',
        lastName: 'Customer',
        email: 'invalid.customer@example.com'
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Validation failed')
  })

  it('POST /cruise/customers should reject duplicate customer IDs', async () => {
    const customer = await createCustomer()

    const res = await request(app)
      .post('/cruise/customers')
      .send({
        id: customer.id,
        firstName: 'Duplicate',
        lastName: 'Customer',
        email: `duplicate-${customer.id.toLowerCase()}@example.com`
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Customer with the same ID already exists' })
  })

  it('POST /cruise/customers should reject duplicate customer emails', async () => {
    const customer = await createCustomer()

    const res = await request(app)
      .post('/cruise/customers')
      .send({
        id: uniqueCustomerId(),
        firstName: 'Duplicate',
        lastName: 'Email',
        email: customer.email
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Customer with the same email already exists' })
  })

  it('PATCH /cruise/customers/:id should update customer profile fields', async () => {
    const customer = await createCustomer()
    const updatedEmail = `updated-${customer.id.toLowerCase()}@example.com`

    const res = await request(app)
      .patch(`/cruise/customers/${customer.id}`)
      .send({
        firstName: 'Updated',
        lastName: 'Traveler',
        email: updatedEmail,
        phone: '555-0400',
        loyaltyNumber: 'LOYALTY-UPDATED'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ message: 'Customer updated successfully' })

    const getRes = await request(app).get(`/cruise/customers/${customer.id}`)

    expect(getRes.body).toEqual(
      expect.objectContaining({
        firstName: 'Updated',
        lastName: 'Traveler',
        email: updatedEmail,
        phone: '555-0400',
        loyaltyNumber: 'LOYALTY-UPDATED'
      })
    )
  })

  it('PATCH /cruise/customers/:id should return 404 for an unknown customer', async () => {
    const res = await request(app)
      .patch('/cruise/customers/C999999999')
      .send({
        firstName: 'Missing',
        lastName: 'Customer',
        email: 'missing.customer@example.com'
      })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Customer not found' })
  })

  it('DELETE /cruise/customers/:id should delete a customer that is not attached to a booking', async () => {
    const customer = await createCustomer()

    const deleteRes = await request(app).delete(`/cruise/customers/${customer.id}`)

    expect(deleteRes.statusCode).toBe(200)
    expect(deleteRes.body).toEqual({ message: 'Customer deleted successfully' })

    const getRes = await request(app).get(`/cruise/customers/${customer.id}`)

    expect(getRes.statusCode).toBe(404)
  })

  it('POST /cruise/bookings should create a booking with multiple passengers', async () => {
    const sailing = await getFirstSeededSailing()
    const primaryCustomer = await createCustomer({ firstName: 'Primary', lastName: 'Guest' })
    const guestCustomer = await createCustomer({ firstName: 'Second', lastName: 'Guest' })
    const bookingId = uniqueBookingId()

    const res = await request(app)
      .post('/cruise/bookings')
      .send({
        id: bookingId,
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        cabinNumber: '11220',
        fareCode: 'BALCONY',
        embarkationPort: sailing.departurePort,
        debarkationPort: sailing.arrivalPort,
        createdByCustomerId: primaryCustomer.id,
        passengers: [
          {
            customerId: primaryCustomer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true,
            diningPreference: 'Early seating',
            boardingGroup: 'A'
          },
          {
            customerId: guestCustomer.id,
            passengerRole: 'GUEST',
            isPrimaryGuest: false,
            diningPreference: 'Early seating',
            boardingGroup: 'A'
          }
        ]
      })

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({
      message: 'Booking created successfully',
      id: bookingId
    })

    trackBooking(bookingId)

    const getRes = await request(app).get(`/cruise/bookings/${bookingId}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body.passengers).toHaveLength(2)
    expect(getRes.body.passengers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: primaryCustomer.id,
          isPrimaryGuest: true
        }),
        expect.objectContaining({
          customerId: guestCustomer.id,
          isPrimaryGuest: false
        })
      ])
    )
  })

  it('POST /cruise/bookings should reject IDs that do not start with B', async () => {
    const sailing = await getFirstSeededSailing()
    const customer = await createCustomer()

    const res = await request(app)
      .post('/cruise/bookings')
      .send({
        id: 'C000000001',
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: customer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Validation failed')
  })

  it('POST /cruise/bookings should reject duplicate booking IDs', async () => {
    const booking = await createBooking()
    const secondCustomer = await createCustomer({ firstName: 'Second', lastName: 'Primary' })

    const res = await request(app)
      .post('/cruise/bookings')
      .send({
        id: booking.id,
        sailingId: booking.sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: secondCustomer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Booking with the same ID already exists' })
  })

  it('POST /cruise/bookings should reject an invalid sailing ID', async () => {
    const customer = await createCustomer()

    const res = await request(app)
      .post('/cruise/bookings')
      .send({
        id: uniqueBookingId(),
        sailingId: '550e8400-e29b-41d4-a716-446655440999',
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: customer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Invalid sailing ID' })
  })

  it('POST /cruise/bookings should reject an invalid customer ID', async () => {
    const sailing = await getFirstSeededSailing()

    const res = await request(app)
      .post('/cruise/bookings')
      .send({
        id: uniqueBookingId(),
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: 'C999999999',
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Invalid customer ID C999999999' })
  })

  it('POST /cruise/bookings should reject duplicate customers on the same booking', async () => {
    const sailing = await getFirstSeededSailing()
    const customer = await createCustomer()
    const bookingId = uniqueBookingId()

    const res = await request(app)
      .post('/cruise/bookings')
      .send({
        id: bookingId,
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: customer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          },
          {
            customerId: customer.id,
            passengerRole: 'GUEST',
            isPrimaryGuest: false
          }
        ]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      message: 'Booking cannot include duplicate customers'
    })
  })

  it('POST /cruise/bookings should require exactly one primary guest', async () => {
    const sailing = await getFirstSeededSailing()
    const firstCustomer = await createCustomer({ firstName: 'First', lastName: 'Guest' })
    const secondCustomer = await createCustomer({ firstName: 'Second', lastName: 'Guest' })

    const noPrimaryRes = await request(app)
      .post('/cruise/bookings')
      .send({
        id: uniqueBookingId(),
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: firstCustomer.id,
            passengerRole: 'GUEST',
            isPrimaryGuest: false
          }
        ]
      })

    expect(noPrimaryRes.statusCode).toBe(400)
    expect(noPrimaryRes.body).toEqual({ message: 'Booking must include exactly one primary guest' })

    const twoPrimaryRes = await request(app)
      .post('/cruise/bookings')
      .send({
        id: uniqueBookingId(),
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: firstCustomer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          },
          {
            customerId: secondCustomer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

    expect(twoPrimaryRes.statusCode).toBe(400)
    expect(twoPrimaryRes.body).toEqual({ message: 'Booking must include exactly one primary guest' })
  })

  it('PATCH /cruise/bookings/:id should update booking details and replace passengers', async () => {
    const booking = await createBooking()
    const replacementPrimary = await createCustomer({
      firstName: 'Replacement',
      lastName: 'Primary'
    })
    const replacementGuest = await createCustomer({
      firstName: 'Replacement',
      lastName: 'Guest'
    })

    const updateRes = await request(app)
      .patch(`/cruise/bookings/${booking.id}`)
      .send({
        sailingId: booking.sailing.id,
        bookingStatus: 'PAID_IN_FULL',
        cabinNumber: '12222',
        fareCode: 'SUITE',
        embarkationPort: booking.sailing.departurePort,
        debarkationPort: booking.sailing.arrivalPort,
        createdByCustomerId: replacementPrimary.id,
        passengers: [
          {
            customerId: replacementPrimary.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true,
            diningPreference: 'Late seating',
            boardingGroup: 'B'
          },
          {
            customerId: replacementGuest.id,
            passengerRole: 'GUEST',
            isPrimaryGuest: false,
            diningPreference: 'Late seating',
            boardingGroup: 'B'
          }
        ]
      })

    expect(updateRes.statusCode).toBe(200)
    expect(updateRes.body).toEqual({ message: 'Booking updated successfully' })

    const getRes = await request(app).get(`/cruise/bookings/${booking.id}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body).toEqual(
      expect.objectContaining({
        bookingStatus: 'PAID_IN_FULL',
        cabinNumber: '12222',
        fareCode: 'SUITE',
        createdByCustomerId: replacementPrimary.id
      })
    )
    expect(getRes.body.passengers).toHaveLength(2)
    expect(getRes.body.passengers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerId: replacementPrimary.id, isPrimaryGuest: true }),
        expect.objectContaining({ customerId: replacementGuest.id, isPrimaryGuest: false })
      ])
    )
    expect(getRes.body.passengers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerId: booking.primaryCustomer.id })
      ])
    )
  })

  it('PATCH /cruise/bookings/:id should preserve the booking passenger UUID bridge when a passenger remains on the booking', async () => {
    const booking = await createBooking()
    const beforeRes = await request(app).get(`/cruise/bookings/${booking.id}`)
    const stablePassenger = beforeRes.body.passengers.find(passenger => passenger.customerId === booking.primaryCustomer.id)

    expect(stablePassenger).toEqual(expect.objectContaining({ bookingPassengerUuid: expect.any(String) }))

    const updateRes = await request(app)
      .patch(`/cruise/bookings/${booking.id}`)
      .send({
        sailingId: booking.sailing.id,
        bookingStatus: 'PAID_IN_FULL',
        cabinNumber: '13000',
        fareCode: 'SUITE',
        embarkationPort: booking.sailing.departurePort,
        debarkationPort: booking.sailing.arrivalPort,
        createdByCustomerId: booking.primaryCustomer.id,
        passengers: [
          {
            customerId: booking.primaryCustomer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true,
            diningPreference: 'Late seating',
            boardingGroup: 'C'
          }
        ]
      })

    expect(updateRes.statusCode).toBe(200)

    const afterRes = await request(app).get(`/cruise/bookings/${booking.id}`)
    const updatedStablePassenger = afterRes.body.passengers.find(passenger => passenger.customerId === booking.primaryCustomer.id)

    expect(updatedStablePassenger).toEqual(
      expect.objectContaining({
        bookingPassengerUuid: stablePassenger.bookingPassengerUuid,
        diningPreference: 'Late seating',
        boardingGroup: 'C'
      })
    )
  })

  it('PATCH /cruise/bookings/:id should return 404 for an unknown booking', async () => {
    const sailing = await getFirstSeededSailing()
    const customer = await createCustomer()

    const res = await request(app)
      .patch('/cruise/bookings/B999999999')
      .send({
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: customer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          }
        ]
      })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Booking not found' })
  })

  it('PATCH /cruise/bookings/:id should reject duplicate passenger customers', async () => {
    const booking = await createBooking()

    const res = await request(app)
      .patch(`/cruise/bookings/${booking.id}`)
      .send({
        sailingId: booking.sailing.id,
        bookingStatus: 'CONFIRMED',
        passengers: [
          {
            customerId: booking.primaryCustomer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true
          },
          {
            customerId: booking.primaryCustomer.id,
            passengerRole: 'GUEST',
            isPrimaryGuest: false
          }
        ]
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Booking cannot include duplicate customers' })
  })

  it('POST /cruise/bookings/:bookingId/passengers should add a passenger to an existing booking', async () => {
    const booking = await createBooking()
    const addedCustomer = await createCustomer({
      firstName: 'Added',
      lastName: 'Passenger'
    })

    const addRes = await request(app)
      .post(`/cruise/bookings/${booking.id}/passengers`)
      .send({
        customerId: addedCustomer.id,
        passengerRole: 'GUEST',
        isPrimaryGuest: false,
        diningPreference: 'Anytime dining',
        boardingGroup: 'C'
      })

    expect(addRes.statusCode).toBe(201)
    expect(addRes.body).toEqual({ message: 'Booking passenger added successfully' })

    const getRes = await request(app).get(`/cruise/bookings/${booking.id}`)

    expect(getRes.body.passengers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: addedCustomer.id,
          passengerRole: 'GUEST',
          boardingGroup: 'C'
        })
      ])
    )
  })

  it('POST /cruise/bookings/:bookingId/passengers should reject a duplicate passenger', async () => {
    // Regression: duplicate detection uses bookingId and customerId rather than the synthetic row id.
    const booking = await createBooking()

    const res = await request(app)
      .post(`/cruise/bookings/${booking.id}/passengers`)
      .send({
        customerId: booking.primaryCustomer.id,
        passengerRole: 'GUEST',
        isPrimaryGuest: false
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ message: 'Customer is already on this booking' })
  })

  it('POST /cruise/bookings/:bookingId/passengers should reject unknown booking and customer references', async () => {
    const customer = await createCustomer()
    const booking = await createBooking()

    const missingBookingRes = await request(app)
      .post('/cruise/bookings/B999999999/passengers')
      .send({
        customerId: customer.id,
        passengerRole: 'GUEST',
        isPrimaryGuest: false
      })

    expect(missingBookingRes.statusCode).toBe(404)
    expect(missingBookingRes.body).toEqual({ message: 'Booking not found' })

    const missingCustomerRes = await request(app)
      .post(`/cruise/bookings/${booking.id}/passengers`)
      .send({
        customerId: 'C999999999',
        passengerRole: 'GUEST',
        isPrimaryGuest: false
      })

    expect(missingCustomerRes.statusCode).toBe(400)
    expect(missingCustomerRes.body).toEqual({ message: 'Invalid customer ID' })
  })

  it('DELETE /cruise/bookings/:bookingId/passengers/:customerId should remove one passenger without deleting the booking', async () => {
    const booking = await createBooking()
    const addedCustomer = await createCustomer({
      firstName: 'Remove',
      lastName: 'Passenger'
    })

    const addRes = await request(app)
      .post(`/cruise/bookings/${booking.id}/passengers`)
      .send({
        customerId: addedCustomer.id,
        passengerRole: 'GUEST',
        isPrimaryGuest: false
      })

    expect(addRes.statusCode).toBe(201)

    const deletePassengerRes = await request(app)
      .delete(`/cruise/bookings/${booking.id}/passengers/${addedCustomer.id}`)

    expect(deletePassengerRes.statusCode).toBe(200)
    expect(deletePassengerRes.body).toEqual({ message: 'Booking passenger deleted successfully' })

    const getRes = await request(app).get(`/cruise/bookings/${booking.id}`)

    expect(getRes.statusCode).toBe(200)
    expect(getRes.body.passengers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerId: booking.primaryCustomer.id })
      ])
    )
    expect(getRes.body.passengers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerId: addedCustomer.id })
      ])
    )
  })

  it('DELETE /cruise/bookings/:bookingId/passengers/:customerId should return 404 for a missing passenger link', async () => {
    const booking = await createBooking()

    const res = await request(app)
      .delete(`/cruise/bookings/${booking.id}/passengers/C999999999`)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Booking passenger not found' })
  })

  it('DELETE /cruise/bookings/:id should remove the booking and its passenger records', async () => {
    const booking = await createBooking()

    const deleteRes = await request(app).delete(`/cruise/bookings/${booking.id}`)

    expect(deleteRes.statusCode).toBe(200)
    expect(deleteRes.body).toEqual({
      message: 'Booking deleted successfully'
    })

    removeTrackedBooking(booking.id)

    const getRes = await request(app).get(`/cruise/bookings/${booking.id}`)

    expect(getRes.statusCode).toBe(404)

    const customerBookingsRes = await request(app)
      .get(`/cruise/customers/${booking.primaryCustomer.id}/bookings`)

    expect(customerBookingsRes.statusCode).toBe(404)
  })

  it('DELETE /cruise/bookings/:id should return 404 for an unknown booking', async () => {
    const res = await request(app).delete('/cruise/bookings/B999999999')

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Booking not found' })
  })

  it('PATCH /cruise/customers/:id/passenger-profile updates only passenger self-service profile fields', async () => {
    const res = await request(app)
      .patch('/cruise/customers/C000000001/passenger-profile')
      .send({
        firstName: 'Jay',
        lastName: 'Gallagher',
        email: 'jay.updated@example.com',
        phone: '555-9999',
        diningPreference: 'Late seating',
        accessibilityNotes: 'Prefers low deck elevators'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Passenger profile updated successfully')

    const customerRes = await request(app).get('/cruise/customers/C000000001')
    expect(customerRes.body).toEqual(expect.objectContaining({
      firstName: 'Jay',
      lastName: 'Gallagher',
      email: 'jay.updated@example.com',
      phone: '555-9999'
    }))
  })

  it('POST and DELETE /cruise/itinerary-favorites persists passenger itinerary interests', async () => {
    const contextRes = await request(app).get('/cruise/demo-users/UPASS00001/context')
    expect(contextRes.statusCode).toBe(200)
    expect(contextRes.body.customer.id).toEqual(expect.any(String))
    expect(contextRes.body.bookings.length).toBeGreaterThan(0)

    const customerId = contextRes.body.customer.id
    const sailingId = contextRes.body.bookings[0].sailing.id
    const itineraryRes = await request(app).get(`/cruise/sailings/${sailingId}/itinerary?customerId=${customerId}`)
    expect(itineraryRes.statusCode).toBe(200)
    expect(itineraryRes.body[0].activitySchedule.length).toBeGreaterThan(0)

    const activityScheduleId = itineraryRes.body[0].activitySchedule[0].id

    const favoriteRes = await request(app)
      .post('/cruise/itinerary-favorites')
      .send({ customerId, activityScheduleId })

    expect(favoriteRes.statusCode).toBe(201)

    const favoritesOnlyRes = await request(app).get(`/cruise/sailings/${sailingId}/itinerary?customerId=${customerId}&favoritesOnly=true`)
    expect(favoritesOnlyRes.statusCode).toBe(200)
    expect(favoritesOnlyRes.body.flatMap(day => day.activitySchedule).map(activity => activity.id)).toContain(activityScheduleId)
    expect(favoritesOnlyRes.body.flatMap(day => day.activitySchedule).every(activity => activity.isFavorite)).toBe(true)

    const deleteRes = await request(app).delete(`/cruise/itinerary-favorites/${customerId}/${activityScheduleId}`)
    expect(deleteRes.statusCode).toBe(200)
  })



  it('POST /cruise/bookings should reject a booking that overlaps an existing passenger booking', async () => {
    const customer = await createCustomer({ firstName: 'Overlap', lastName: 'Passenger' })
    const sailing = await getFirstSeededSailing()

    const firstBooking = await createBooking({
      primaryCustomer: customer,
      sailing
    })

    const overlappingRes = await request(app)
      .post('/cruise/bookings')
      .send({
        id: uniqueBookingId(),
        sailingId: sailing.id,
        bookingStatus: 'CONFIRMED',
        cabinNumber: '12222',
        fareCode: 'BALCONY',
        embarkationPort: sailing.departurePort,
        debarkationPort: sailing.arrivalPort,
        createdByCustomerId: customer.id,
        passengers: [
          {
            customerId: customer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true,
            diningPreference: 'Anytime dining'
          }
        ]
      })

    expect(overlappingRes.statusCode).toBe(400)
    expect(overlappingRes.body.message).toContain(`Passenger ${customer.id} already has booking ${firstBooking.id}`)
  })

  it('PATCH /cruise/bookings/:id should reject updates that create passenger booking overlap', async () => {
    const customer = await createCustomer({ firstName: 'Patch', lastName: 'Overlap' })
    const firstSailing = await getFirstSeededSailing()
    const laterSailing = await getNonOverlappingSeededSailing(firstSailing)

    const firstBooking = await createBooking({
      primaryCustomer: customer,
      sailing: firstSailing
    })

    const secondBooking = await createBooking({
      primaryCustomer: customer,
      sailing: laterSailing,
      payload: {
        embarkationPort: laterSailing.departurePort,
        debarkationPort: laterSailing.arrivalPort
      }
    })

    const updateRes = await request(app)
      .patch(`/cruise/bookings/${secondBooking.id}`)
      .send({
        sailingId: firstSailing.id,
        bookingStatus: 'CONFIRMED',
        cabinNumber: '14444',
        fareCode: 'BALCONY',
        embarkationPort: firstSailing.departurePort,
        debarkationPort: firstSailing.arrivalPort,
        createdByCustomerId: customer.id,
        passengers: [
          {
            customerId: customer.id,
            passengerRole: 'PRIMARY',
            isPrimaryGuest: true,
            diningPreference: 'Late seating'
          }
        ]
      })

    expect(updateRes.statusCode).toBe(400)
    expect(updateRes.body.message).toContain(`Passenger ${customer.id} already has booking ${firstBooking.id}`)
  })

  it('POST /cruise/bookings/:bookingId/passengers should reject passengers with overlapping bookings', async () => {
    const seededBooking = await getSeededBookingWithPassengers(request, app)
    const seededBookingId = seededBooking.id

    const firstCustomer = await createCustomer({ firstName: 'First', lastName: 'Guest' })
    const secondCustomer = await createCustomer({ firstName: 'Second', lastName: 'Guest' })
    const sailing = await getFirstSeededSailing()

    const existingBooking = await createBooking({
      primaryCustomer: secondCustomer,
      sailing
    })

    const targetBooking = await createBooking({
      primaryCustomer: firstCustomer,
      sailing
    })

    const res = await request(app)
      .post(`/cruise/bookings/${targetBooking.id}/passengers`)
      .send({
        customerId: secondCustomer.id,
        passengerRole: 'GUEST',
        isPrimaryGuest: false,
        diningPreference: 'Anytime dining'
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toContain(`Passenger ${secondCustomer.id} already has booking ${existingBooking.id}`)
  })


  it('PATCH /cruise/bookings/:bookingId/passengers/:customerId/preferences updates booking-specific passenger preferences', async () => {
    const res = await request(app)
      .patch('/cruise/bookings/B000000001/passengers/C000000001/preferences')
      .send({
        diningPreference: 'Late seating',
        accessibilityNotes: 'Prefers accessible theater seating'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Booking preferences updated successfully')

    const bookingRes = await request(app).get('/cruise/bookings/B000000001')
    expect(bookingRes.statusCode).toBe(200)

    const jayPassenger = bookingRes.body.passengers.find(passenger => passenger.customerId === 'C000000001')
    expect(jayPassenger).toEqual(expect.objectContaining({
      diningPreference: 'Late seating',
      accessibilityNotes: 'Prefers accessible theater seating'
    }))
  })

  it('PATCH /cruise/bookings/:bookingId/passengers/:customerId/preferences returns 404 for a missing booking passenger link', async () => {
    const res = await request(app)
      .patch('/cruise/bookings/B999999999/passengers/C999999999/preferences')
      .send({
        diningPreference: 'Anytime dining',
        accessibilityNotes: 'No preference'
      })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Booking passenger not found' })
  })

  it('GET /cruise/bookings remains stable after passenger audit and preference writes', async () => {
    const checklistRes = await request(app)
      .patch('/cruise/customers/C000000001/pre-cruise-checklist')
      .send({
        documents: true,
        luggage: true,
        dining: false,
        excursions: true
      })

    expect(checklistRes.statusCode).toBe(200)

    const preferencesRes = await request(app)
      .patch('/cruise/bookings/B000000001/passengers/C000000001/preferences')
      .send({
        diningPreference: 'Anytime dining',
        accessibilityNotes: 'No special assistance requested'
      })

    expect(preferencesRes.statusCode).toBe(200)

    const bookingsRes = await request(app).get('/cruise/bookings')

    expect(bookingsRes.statusCode).toBe(200)
    expect(bookingsRes.body.length).toBeGreaterThan(0)
    expect(bookingsRes.body[0]).toEqual(expect.objectContaining({
      passengers: expect.any(Array),
      sailing: expect.any(Object),
      ship: expect.any(Object),
      cruiseLine: expect.any(Object)
    }))
  })

  it('records passenger self-service audit events with before and after history payloads', async () => {
    const checklistRes = await request(app)
      .patch('/cruise/customers/C000000001/pre-cruise-checklist')
      .send({
        documents: true,
        luggage: false,
        dining: true,
        excursions: true
      })

    expect(checklistRes.statusCode).toBe(200)

    const preferencesRes = await request(app)
      .patch('/cruise/bookings/B000000001/passengers/C000000001/preferences')
      .send({
        diningPreference: 'Early seating',
        accessibilityNotes: 'Needs clear embarkation timing'
      })

    expect(preferencesRes.statusCode).toBe(200)

    const checklistAuditRes = await request(app)
      .get('/cruise/audit-events?demoUserId=UADMIN0001&entityType=CUSTOMER_PRE_CRUISE_CHECKLIST&entityId=C000000001')

    expect(checklistAuditRes.statusCode).toBe(200)
    expect(checklistAuditRes.body.auditEvents.length).toBeGreaterThan(0)
    expect(checklistAuditRes.body.auditEvents[0].eventPayload).toEqual(expect.objectContaining({
      next: expect.objectContaining({
        customerId: 'C000000001',
        documents: true,
        dining: true
      }),
      changedFields: expect.any(Object),
      entityRefs: { customerId: 'C000000001' },
      metadata: expect.objectContaining({ operation: expect.stringContaining('passenger-checklist') })
    }))

    const preferenceAuditRes = await request(app)
      .get('/cruise/audit-events?demoUserId=UADMIN0001&entityType=BOOKING_PASSENGER&entityId=B000000001-C000000001')

    expect(preferenceAuditRes.statusCode).toBe(200)
    const preferenceAudit = preferenceAuditRes.body.auditEvents.find(
      event => event.eventType === 'PASSENGER_BOOKING_PREFERENCES_UPDATED'
    )

    expect(preferenceAudit).toEqual(expect.objectContaining({
      eventPayload: expect.objectContaining({
        previous: expect.objectContaining({ id: 'B000000001-C000000001' }),
        next: expect.objectContaining({
          diningPreference: 'Early seating',
          accessibilityNotes: 'Needs clear embarkation timing'
        }),
        changedFields: expect.objectContaining({
          diningPreference: expect.objectContaining({ next: 'Early seating' }),
          accessibilityNotes: expect.objectContaining({ next: 'Needs clear embarkation timing' })
        }),
        entityRefs: { bookingId: 'B000000001', customerId: 'C000000001' },
        metadata: expect.objectContaining({ operation: 'passenger-booking-preferences-update' })
      })
    }))
  })

  it('GET /cruise/bookings gives admin enough details to manage booking records', async () => {
    const res = await request(app).get('/cruise/bookings')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)

    res.body.forEach(booking => {
      expect(booking).toEqual(expect.objectContaining({
        id: expect.stringMatching(/^B\d{9}$/),
        bookingStatus: expect.any(String),
        passengers: expect.any(Array),
        sailing: expect.any(Object),
        ship: expect.any(Object),
        cruiseLine: expect.any(Object)
      }))
      expect(booking.passengers.length).toBeGreaterThan(0)
    })
  })

  it('PATCH /cruise/customers/:id supports admin customer profile updates', async () => {
    const res = await request(app)
      .patch('/cruise/customers/C000000002')
      .send({
        firstName: 'Alisa',
        lastName: 'Gallagher',
        email: 'alisa.admin.updated@example.com',
        phone: '555-2222',
        loyaltyNumber: 'LOYALTY-C000000002'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Customer updated successfully')

    const customerRes = await request(app).get('/cruise/customers/C000000002')
    expect(customerRes.statusCode).toBe(200)
    expect(customerRes.body.email).toBe('alisa.admin.updated@example.com')
  })


})
