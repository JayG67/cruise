const request = require('supertest')

const app = require('../../app')
const initializeDatabase = require('../../services/initializeDatabase.service')
const loadCruiseData = require('../../services/loadCruiseData.service')

beforeAll(async () => {
  await initializeDatabase()
  await loadCruiseData()
})

describe('Accessibility-supporting API payload integration tests', () => {
  it('GET /cruise returns human-readable cruise line names for accessible card labels', async () => {
    const res = await request(app).get('/cruise')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(cruiseLine => {
      expect(cruiseLine.name).toEqual(expect.any(String))
      expect(cruiseLine.name.trim().length).toBeGreaterThan(0)
    })
  })

  it('GET /cruise/ships/:cruiseLineId returns ship names and ports for contextual accessible actions', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const cruiseLine = cruiseRes.body[0]

    const res = await request(app).get(`/cruise/ships/${cruiseLine.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(ship => {
      expect(ship.name.trim().length).toBeGreaterThan(0)
      expect(ship.currentPort.trim().length).toBeGreaterThan(0)
    })
  })

  it('GET /cruise/ship/:shipId/sailings returns route and date text for accessible sailing controls', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
    const ship = shipsRes.body[0]

    const res = await request(app).get(`/cruise/ship/${ship.id}/sailings`)

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(sailing => {
      expect(sailing.departureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(sailing.departurePort.trim().length).toBeGreaterThan(0)
      expect(sailing.arrivalPort.trim().length).toBeGreaterThan(0)
      expect(Number(sailing.days)).toBeGreaterThan(0)
    })
  })

  it('GET /cruise/sailings/:sailingId/itinerary returns titles, ports, and activity text for screen-reader-friendly itinerary details', async () => {
    const cruiseRes = await request(app).get('/cruise')
    const shipsRes = await request(app).get(`/cruise/ships/${cruiseRes.body[0].id}`)
    const sailingsRes = await request(app).get(`/cruise/ship/${shipsRes.body[0].id}/sailings`)
    const sailing = sailingsRes.body[0]

    const res = await request(app).get(`/cruise/sailings/${sailing.id}/itinerary`)

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(day => {
      expect(day.title.trim().length).toBeGreaterThan(0)
      expect(day.port.trim().length).toBeGreaterThan(0)
      expect(day.activitySchedule.length).toBeGreaterThan(0)
      day.activitySchedule.forEach(activity => {
        expect(activity.time.trim().length).toBeGreaterThan(0)
        expect(activity.activity.trim().length).toBeGreaterThan(0)
      })
    })
  })

  it('GET /cruise/demo-users returns descriptive role labels for the accessible demo selector', async () => {
    const res = await request(app).get('/cruise/demo-users')

    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(10)
    const accessibleRoleLabels = [
      'ADMIN',
      'PASSENGER',
      'GROUP_LEADER',
      'TURNAROUND_MANAGER',
      'HOUSEKEEPING_LEAD',
      'GUEST_SERVICES_LEAD',
      'FOOD_BEVERAGE_LEAD',
      'ENGINEERING_LEAD'
    ]

    res.body.forEach(user => {
      expect(user.displayName.trim().length).toBeGreaterThan(0)
      expect(accessibleRoleLabels).toContain(user.role)
    })
  })

  it('GET /cruise/demo-users/:id/context provides passenger names needed for accessible booking cards', async () => {
    const res = await request(app).get('/cruise/demo-users/UPASS00001/context')

    expect(res.statusCode).toBe(200)
    expect(res.body.bookings.length).toBeGreaterThan(0)
    res.body.bookings.forEach(booking => {
      expect(booking.id).toMatch(/^B\d{9}$/)
      expect(Array.isArray(booking.passengers)).toBe(true)
      expect(booking.passengers.length).toBeGreaterThan(0)
      booking.passengers.forEach(passenger => {
        expect(passenger.customer.firstName.trim().length).toBeGreaterThan(0)
        expect(passenger.customer.lastName.trim().length).toBeGreaterThan(0)
      })
    })
  })
})
