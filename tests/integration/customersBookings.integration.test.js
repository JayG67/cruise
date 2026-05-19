const request = require('supertest')

const app = require('../../app')
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

  const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
  expect(shipsRes.statusCode).toBe(200)

  const sailingsRes = await request(app).get(`/cruise/ship/${shipsRes.body[0].id}/sailings`)
  expect(sailingsRes.statusCode).toBe(200)

  return sailingsRes.body[0]
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
    expect(res.body.length).toBeGreaterThanOrEqual(8)
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
    expect(res.body.length).toBeGreaterThanOrEqual(6)

    res.body.forEach(booking => {
      expect(booking.id).toMatch(/^B[A-Z0-9]{9}$/)
      expect(booking.sailingId).toEqual(expect.any(String))
      expect(booking.sailing).toEqual(expect.objectContaining({ id: booking.sailingId }))
      expect(Array.isArray(booking.passengers)).toBe(true)
      expect(booking.passengers.length).toBeGreaterThan(0)
      expect(booking.passengers.filter(passenger => passenger.isPrimaryGuest)).toHaveLength(1)
    })
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

  it('GET /cruise/customers/:customerId/bookings should support customers with multiple bookings', async () => {
    const res = await request(app).get('/cruise/customers/C000000001/bookings')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)

    res.body.forEach(booking => {
      expect(booking.passengers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            customerId: 'C000000001'
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
})
