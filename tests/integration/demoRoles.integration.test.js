const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Demo role and user context API integration tests', () => {
  it('GET /cruise/demo-users returns admin, passenger, and group leader demo users', async () => {
    const res = await request(app).get('/cruise/demo-users')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'ADMIN' }),
        expect.objectContaining({ role: 'PASSENGER' }),
        expect.objectContaining({ role: 'GROUP_LEADER' })
      ])
    )
  })

  it('GET /cruise/demo-users/:id/context returns admin visibility across all customers and bookings', async () => {
    const res = await request(app).get('/cruise/demo-users/UADMIN0001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.user).toEqual(expect.objectContaining({ role: 'ADMIN' }))
    expect(res.body.visibility).toEqual(
      expect.objectContaining({
        canManageCruiseData: true,
        canViewAllCustomers: true,
        canViewAllBookings: true
      })
    )
    expect(res.body.visibility.accessibleCustomerCount).toBeGreaterThanOrEqual(8)
    expect(res.body.visibility.accessibleBookingCount).toBeGreaterThanOrEqual(6)
  })

  it('GET /cruise/demo-users/:id/context keeps admin context separate from passenger booking cards', async () => {
    const res = await request(app).get('/cruise/demo-users/UADMIN0001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.customer).toBeNull()
    expect(res.body.bookings).toEqual([])
    expect(res.body.user.customerId).toBeNull()
    expect(res.body.visibility.canManageCruiseData).toBe(true)
  })

  it('GET /cruise/demo-users/:id/context returns only passenger booking context for passenger users', async () => {
    const res = await request(app).get('/cruise/demo-users/UPASS00001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.user).toEqual(expect.objectContaining({ role: 'PASSENGER', customerId: 'C000000001' }))
    expect(res.body.customer).toEqual(expect.objectContaining({ id: 'C000000001' }))
    expect(res.body.visibility.canManageCruiseData).toBe(false)
    expect(res.body.bookings.length).toBeGreaterThanOrEqual(2)
    res.body.bookings.forEach(booking => {
      expect(booking.passengers).toEqual(
        expect.arrayContaining([expect.objectContaining({ customerId: 'C000000001' })])
      )
    })
  })

  it('GET /cruise/demo-users/:id/context limits passenger visibility to their own bookings', async () => {
    const res = await request(app).get('/cruise/demo-users/UPASS00001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.visibility.canManageCruiseData).toBe(false)
    expect(res.body.bookings.length).toBeGreaterThan(0)

    res.body.bookings.forEach(booking => {
      expect(booking.passengers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ customerId: res.body.user.customerId })
        ])
      )
    })
  })

  it('GET /cruise/demo-users/:id/context includes ship and cruise line details for passenger booking cards', async () => {
    const res = await request(app).get('/cruise/demo-users/UPASS00001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.bookings.length).toBeGreaterThan(0)

    res.body.bookings.forEach(booking => {
      expect(booking.sailing).toEqual(expect.objectContaining({ id: booking.sailingId }))
      expect(booking.ship).toEqual(expect.objectContaining({ id: booking.sailing.shipId }))
      expect(booking.cruiseLine).toEqual(expect.objectContaining({ id: booking.ship.cruiseLineId }))
      expect(booking.passengers.length).toBeGreaterThan(0)
    })
  })

  it('GET /cruise/demo-users/:id/context returns group visibility counts for group leaders', async () => {
    const res = await request(app).get('/cruise/demo-users/UGROUP0001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.user).toEqual(expect.objectContaining({ role: 'GROUP_LEADER' }))
    expect(res.body.visibility.canManageCruiseData).toBe(false)
    expect(res.body.visibility.accessibleBookingCount).toBeGreaterThanOrEqual(2)
    expect(res.body.visibility.accessibleCustomerCount).toBeGreaterThanOrEqual(2)
  })

  it('GET /cruise/demo-users/:id/context gives group leaders multi-customer visibility without admin rights', async () => {
    const res = await request(app).get('/cruise/demo-users/UGROUP0001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.visibility.canManageCruiseData).toBe(false)
    expect(res.body.visibility.accessibleCustomerCount).toBeGreaterThanOrEqual(2)
    expect(res.body.bookings.length).toBeGreaterThan(0)
  })

  it('GET /cruise/demo-users/:id/context includes passenger customer display details for dashboard rendering', async () => {
    const res = await request(app).get('/cruise/demo-users/UGROUP0001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.bookings.length).toBeGreaterThan(0)

    const passengers = res.body.bookings.flatMap(booking => booking.passengers)

    expect(passengers.length).toBeGreaterThan(1)
    passengers.forEach(passenger => {
      expect(passenger.customer).toEqual(
        expect.objectContaining({
          id: passenger.customerId,
          firstName: expect.any(String),
          lastName: expect.any(String)
        })
      )
    })
  })

  it('GET /cruise/demo-users returns at least ten selectable demo personas', async () => {
    const res = await request(app).get('/cruise/demo-users')

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveLength(10)
    expect(res.body.map(user => user.displayName).join(' ')).toContain('Alisa Gallagher')
    expect(res.body.map(user => user.displayName).join(' ')).toContain('Parker Family')
    expect(res.body.map(user => user.displayName).join(' ')).toContain('Kim Couple')
  })

  it('GET /cruise/demo-users/:id/context keeps Jay bookings paired only with Alisa', async () => {
    const res = await request(app).get('/cruise/demo-users/UPASS00001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.bookings.length).toBeGreaterThan(0)

    res.body.bookings.forEach(booking => {
      const passengerNames = booking.passengers.map(passenger =>
        `${passenger.customer.firstName} ${passenger.customer.lastName}`
      )

      expect(passengerNames).toContain('Jay Gallagher')
      expect(passengerNames).toContain('Alisa Gallagher')
      expect(passengerNames).toHaveLength(2)
    })
  })


  it('GET /cruise/demo-users/:id/context returns 404 for an unknown demo user', async () => {
    const res = await request(app).get('/cruise/demo-users/UMISSING01/context')

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Demo user not found' })
  })
})
