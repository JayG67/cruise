const cruiseSeedData = require('../../../data/cruise.json')

function getCruiseLines() {
  return cruiseSeedData.cruiseLines || []
}

function getShips() {
  return getCruiseLines().flatMap(cruiseLine =>
    (cruiseLine.ships || []).map(ship => ({
      cruiseLine,
      ship
    }))
  )
}

function getSailings() {
  return getShips().flatMap(({ cruiseLine, ship }) =>
    (ship.sailings || []).map(sailing => ({
      cruiseLine,
      ship,
      sailing
    }))
  )
}

function getItineraryDays() {
  return getSailings().flatMap(({ cruiseLine, ship, sailing }) =>
    (sailing.itinerary || []).map(itineraryDay => ({
      cruiseLine,
      ship,
      sailing,
      itineraryDay
    }))
  )
}

function getActivities() {
  return getItineraryDays().flatMap(({ cruiseLine, ship, sailing, itineraryDay }) =>
    (itineraryDay.activitySchedule || []).map(activity => ({
      cruiseLine,
      ship,
      sailing,
      itineraryDay,
      activity
    }))
  )
}

describe('cruise seed data model integrity', () => {
  it('contains cruise lines with required public-facing metadata', () => {
    const cruiseLines = getCruiseLines()

    expect(cruiseLines.length).toBeGreaterThan(0)

    cruiseLines.forEach(cruiseLine => {
      expect(cruiseLine).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          country: expect.any(String),
          website: expect.stringMatching(/^https?:\/\//)
        })
      )

      expect(cruiseLine.name.trim()).not.toBe('')
      expect(cruiseLine.country.trim()).not.toBe('')
      expect(cruiseLine.ships.length).toBeGreaterThan(0)
    })
  })

  it('contains ships with a current working port and exactly five sailings', () => {
    const ships = getShips()

    expect(ships.length).toBeGreaterThan(0)

    ships.forEach(({ ship }) => {
      expect(ship.name).toEqual(expect.any(String))
      expect(ship.name.trim()).not.toBe('')
      expect(ship.currentPort).toEqual(expect.any(String))
      expect(ship.currentPort.trim()).not.toBe('')
      expect(ship.sailings).toHaveLength(5)
    })
  })

  it('contains exactly one repositioning sailing per ship', () => {
    getShips().forEach(({ ship }) => {
      const repositioningSailings = ship.sailings.filter(sailing => sailing.isRepositioning === true)

      expect(repositioningSailings).toHaveLength(1)

      const repositioningSailing = repositioningSailings[0]

      expect(repositioningSailing.days).toBeGreaterThanOrEqual(10)
      expect(repositioningSailing.departurePort).toEqual(expect.any(String))
      expect(repositioningSailing.arrivalPort).toEqual(expect.any(String))
      expect(repositioningSailing.departurePort).not.toBe(repositioningSailing.arrivalPort)
    })
  })

  it('keeps non-repositioning sailings marked as regional or round-trip sailings', () => {
    getSailings()
      .filter(({ sailing }) => sailing.isRepositioning === false)
      .forEach(({ sailing }) => {
        expect(sailing.days).toBeGreaterThanOrEqual(3)
        expect(sailing.days).toBeLessThanOrEqual(9)
        expect(sailing.departurePort).toEqual(expect.any(String))
        expect(sailing.arrivalPort).toEqual(expect.any(String))
      })
  })

  it('contains valid sailing-level route metadata', () => {
    getSailings().forEach(({ ship, sailing }) => {
      expect(sailing.departureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(`${sailing.departureDate}T00:00:00Z`).toString()).not.toBe('Invalid Date')

      expect(sailing.port).toEqual(expect.any(String))
      expect(sailing.departurePort).toEqual(expect.any(String))
      expect(sailing.arrivalPort).toEqual(expect.any(String))
      expect(sailing.days).toEqual(expect.any(Number))
      expect(typeof sailing.isRepositioning).toBe('boolean')

      expect(sailing.port.trim()).not.toBe('')
      expect(sailing.departurePort.trim()).not.toBe('')
      expect(sailing.arrivalPort.trim()).not.toBe('')
      expect(sailing.days).toBeGreaterThan(0)

      expect(sailing.departurePort).toBe(sailing.port)
      expect(sailing.departurePort).toBe(ship.currentPort)
    })
  })

  it('keeps every sailing itinerary length aligned to the sailing day count', () => {
    getSailings().forEach(({ sailing }) => {
      expect(Array.isArray(sailing.itinerary)).toBe(true)
      expect(sailing.itinerary).toHaveLength(sailing.days)
    })
  })

  it('numbers itinerary days sequentially from day one through the sailing length', () => {
    getSailings().forEach(({ sailing }) => {
      sailing.itinerary.forEach((itineraryDay, index) => {
        expect(itineraryDay.day).toBe(index + 1)
      })
    })
  })

  it('requires each itinerary day to identify either a port or sea-day status', () => {
    getItineraryDays().forEach(({ itineraryDay }) => {
      expect(itineraryDay.title).toEqual(expect.any(String))
      expect(itineraryDay.title.trim()).not.toBe('')
      expect(itineraryDay.port).toEqual(expect.any(String))
      expect(itineraryDay.port.trim()).not.toBe('')
    })
  })

  it('keeps embarkation and arrival itinerary ports aligned to sailing route ports', () => {
    getSailings().forEach(({ sailing }) => {
      const embarkationDay = sailing.itinerary[0]
      const arrivalDay = sailing.itinerary[sailing.itinerary.length - 1]

      expect(embarkationDay.port).toBe(sailing.departurePort)
      expect(arrivalDay.port).toBe(sailing.arrivalPort)
      expect(embarkationDay.title).toContain(sailing.departurePort)
      expect(arrivalDay.title).toContain(sailing.arrivalPort)
    })
  })

  it('includes realistic route variation with sea days and port days', () => {
    const itineraryDays = getItineraryDays()
    const seaDays = itineraryDays.filter(({ itineraryDay }) => itineraryDay.port === 'At Sea')
    const portDays = itineraryDays.filter(({ itineraryDay }) => itineraryDay.port !== 'At Sea')

    expect(seaDays.length).toBeGreaterThan(0)
    expect(portDays.length).toBeGreaterThan(0)
  })

  it('requires activity schedules on every itinerary day', () => {
    getItineraryDays().forEach(({ itineraryDay }) => {
      expect(Array.isArray(itineraryDay.activitySchedule)).toBe(true)
      expect(itineraryDay.activitySchedule.length).toBeGreaterThan(0)
    })
  })

  it('requires every scheduled activity to include display-ready time and activity text', () => {
    getActivities().forEach(({ activity }) => {
      expect(activity.time).toEqual(expect.any(String))
      expect(activity.activity).toEqual(expect.any(String))
      expect(activity.time.trim()).not.toBe('')
      expect(activity.activity.trim()).not.toBe('')
    })
  })

  it('contains enough realistic data volume to support future booking and passenger workflows', () => {
    expect(getCruiseLines().length).toBeGreaterThanOrEqual(4)
    expect(getShips().length).toBeGreaterThanOrEqual(100)
    expect(getSailings().length).toBeGreaterThanOrEqual(500)
    expect(getItineraryDays().length).toBeGreaterThanOrEqual(3000)
    expect(getActivities().length).toBeGreaterThanOrEqual(9000)
  })
})


describe('customer and booking seed data integrity', () => {
  function getCustomers() {
    return cruiseSeedData.customers || []
  }

  function getBookings() {
    return cruiseSeedData.bookings || []
  }

  function getSailingSeedKeys() {
    return new Set(
      getSailings().map(({ ship, sailing }) => `${ship.name}|${sailing.departureDate}`)
    )
  }

  it('contains customer IDs using the C-prefixed ten-character portfolio format', () => {
    const customers = getCustomers()

    expect(customers.length).toBeGreaterThanOrEqual(8)

    customers.forEach(customer => {
      expect(customer.id).toMatch(/^C[A-Z0-9]{9}$/)
      expect(customer.firstName.trim()).not.toBe('')
      expect(customer.lastName.trim()).not.toBe('')
      expect(customer.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    })
  })

  it('contains booking IDs using the B-prefixed ten-character portfolio format', () => {
    const bookings = getBookings()

    expect(bookings.length).toBeGreaterThanOrEqual(6)

    bookings.forEach(booking => {
      expect(booking.id).toMatch(/^B[A-Z0-9]{9}$/)
      expect(booking.bookingStatus.trim()).not.toBe('')
      expect(booking.passengers.length).toBeGreaterThan(0)
    })
  })

  it('allows customers to appear across multiple bookings and cruise lines', () => {
    const bookings = getBookings()
    const jayBookings = bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === 'C000000001')
    )
    const graceBookings = bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === 'C000000010')
    )

    expect(jayBookings.length).toBeGreaterThanOrEqual(2)
    expect(new Set(jayBookings.map(booking => booking.shipName)).size).toBeGreaterThanOrEqual(2)
    expect(graceBookings.length).toBeGreaterThanOrEqual(2)
  })

  it('contains a realistic variety of solo, couple, and family/group bookings', () => {
    const passengerCounts = getBookings().map(booking => booking.passengers.length)

    expect(passengerCounts).toContain(1)
    expect(passengerCounts).toContain(2)
    expect(passengerCounts.some(count => count >= 3)).toBe(true)
  })

  it('resolves every seeded booking to a seeded ship sailing', () => {
    const sailingSeedKeys = getSailingSeedKeys()

    getBookings().forEach(booking => {
      expect(sailingSeedKeys.has(`${booking.shipName}|${booking.departureDate}`)).toBe(true)
    })
  })

  it('keeps every booking passenger linked to a seeded customer and exactly one primary guest per booking', () => {
    const customerIds = new Set(getCustomers().map(customer => customer.id))

    getBookings().forEach(booking => {
      const primaryGuests = booking.passengers.filter(passenger => passenger.isPrimaryGuest)

      expect(primaryGuests).toHaveLength(1)

      booking.passengers.forEach(passenger => {
        expect(customerIds.has(passenger.customerId)).toBe(true)
        expect(passenger.passengerRole.trim()).not.toBe('')
      })
    })
  })
})


describe('customer and booking seed data role-selection readiness', () => {
  function getCustomers() {
    return cruiseSeedData.customers || []
  }

  function getBookings() {
    return cruiseSeedData.bookings || []
  }

  function getCustomerBookingCounts() {
    return getBookings().reduce((counts, booking) => {
      booking.passengers.forEach(passenger => {
        counts[passenger.customerId] = (counts[passenger.customerId] || 0) + 1
      })

      return counts
    }, {})
  }

  it('keeps customer IDs and emails unique for future login/role selector scenarios', () => {
    const customers = getCustomers()
    const ids = customers.map(customer => customer.id)
    const emails = customers.map(customer => customer.email.toLowerCase())

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(emails).size).toBe(emails.length)
  })

  it('keeps booking IDs unique and linked to one seeded sailing route', () => {
    const bookings = getBookings()
    const ids = bookings.map(booking => booking.id)
    const sailingKeys = new Set(
      getSailings().map(({ ship, sailing }) => `${ship.name}|${sailing.departureDate}`)
    )

    expect(new Set(ids).size).toBe(ids.length)

    bookings.forEach(booking => {
      expect(sailingKeys.has(`${booking.shipName}|${booking.departureDate}`)).toBe(true)
    })
  })

  it('includes at least one customer with multiple bookings for the future passenger role switcher', () => {
    const counts = getCustomerBookingCounts()

    expect(Object.values(counts).some(count => count >= 2)).toBe(true)
  })

  it('includes bookings across multiple cruise lines for customers who sail with different brands', () => {
    const bookingsByCustomer = getBookings().reduce((map, booking) => {
      booking.passengers.forEach(passenger => {
        if (!map[passenger.customerId]) {
          map[passenger.customerId] = []
        }

        map[passenger.customerId].push(booking)
      })

      return map
    }, {})

    const hasMultiBrandCustomer = Object.values(bookingsByCustomer).some(bookings => {
      const cruiseLineNames = new Set(
        bookings.map(booking => {
          const sailingRecord = getSailings().find(({ ship, sailing }) =>
            ship.name === booking.shipName && sailing.departureDate === booking.departureDate
          )

          return sailingRecord?.cruiseLine.name
        }).filter(Boolean)
      )

      return cruiseLineNames.size >= 2
    })

    expect(hasMultiBrandCustomer).toBe(true)
  })

  it('includes primary and guest passenger roles without exposing authentication concerns in seed data', () => {
    const passengerRoles = new Set(
      getBookings().flatMap(booking => booking.passengers.map(passenger => passenger.passengerRole))
    )

    expect(passengerRoles.has('PRIMARY')).toBe(true)
    expect(passengerRoles.has('GUEST')).toBe(true)

    getCustomers().forEach(customer => {
      expect(customer.password).toBeUndefined()
      expect(customer.role).toBeUndefined()
    })
  })

  it('keeps every booking aligned to exactly one primary guest', () => {
    getBookings().forEach(booking => {
      expect(booking.passengers.filter(passenger => passenger.isPrimaryGuest)).toHaveLength(1)
    })
  })

  it('includes bookings with solo, couple, and larger group passenger counts', () => {
    const passengerCounts = getBookings().map(booking => booking.passengers.length)

    expect(passengerCounts).toContain(1)
    expect(passengerCounts).toContain(2)
    expect(passengerCounts.some(count => count >= 3)).toBe(true)
  })
})


describe('demo user seed data integrity', () => {
  function getDemoUsers() {
    return cruiseSeedData.demoUsers || []
  }

  function getCustomers() {
    return cruiseSeedData.customers || []
  }

  it('contains demo users for admin, passenger, and group leader role previews', () => {
    const demoUsers = getDemoUsers()
    const roles = new Set(demoUsers.map(user => user.role))

    expect(demoUsers.length).toBeGreaterThanOrEqual(3)
    expect(roles.has('ADMIN')).toBe(true)
    expect(roles.has('PASSENGER')).toBe(true)
    expect(roles.has('GROUP_LEADER')).toBe(true)
  })

  it('links passenger and group leader demo users to seeded customers', () => {
    const customerIds = new Set(getCustomers().map(customer => customer.id))

    getDemoUsers()
      .filter(user => user.role !== 'ADMIN')
      .forEach(user => {
        expect(user.customerId).toMatch(/^C[A-Z0-9]{9}$/)
        expect(customerIds.has(user.customerId)).toBe(true)
      })
  })

  it('contains at least ten demo role selections for portfolio role diversity', () => {
    const demoUsers = getDemoUsers()
    const displayNames = demoUsers.map(user => user.displayName).join(' ')

    expect(demoUsers).toHaveLength(10)
    expect(displayNames).toContain('Alisa Gallagher')
    expect(displayNames).toContain('Parker Family')
    expect(displayNames).toContain('Kim Couple')
    expect(displayNames).toContain('Grace Thompson')
  })

  it('keeps Jay Gallagher bookings paired only with Alisa Gallagher', () => {
    const jayId = 'C000000001'
    const alisaId = 'C000000002'

    const jayBookings = cruiseSeedData.bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === jayId)
    )

    expect(jayBookings.length).toBeGreaterThan(0)

    jayBookings.forEach(booking => {
      const passengerIds = booking.passengers.map(passenger => passenger.customerId)

      expect(passengerIds).toContain(jayId)
      expect(passengerIds).toContain(alisaId)
      expect(passengerIds).toHaveLength(2)
    })
  })

  it('does not store authentication secrets in demo role seed data', () => {
    getDemoUsers().forEach(user => {
      expect(user.password).toBeUndefined()
      expect(user.passwordHash).toBeUndefined()
      expect(user.token).toBeUndefined()
    })
  })
})
