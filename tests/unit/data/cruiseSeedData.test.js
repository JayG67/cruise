const cruiseSeedData = require('../../../data/cruise.json')


function getPortfolioPairingBookings(bookings) {
  return bookings.filter(booking =>
    booking.passengers?.some(passenger => passenger.customerId === 'C000000001') ||
    booking.passengers?.some(passenger => passenger.customerId === 'C000000002')
  )
}

function getRealisticDemoManifestBookings(bookings) {
  return bookings.filter(booking => !getPortfolioPairingBookings([booking]).length)
}

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


function addDays(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  return date
}

function sailingEndDate(sailing) {
  return addDays(sailing.departureDate, Math.max(Number(sailing.days || 1) - 1, 0))
}

function bookingInterval(booking) {
  const sailing = getSailings().find(({ ship, sailing }) =>
    ship.name === booking.shipName && sailing.departureDate === booking.departureDate
  )?.sailing

  expect(sailing).toBeDefined()

  return {
    start: new Date(`${sailing.departureDate}T00:00:00.000Z`),
    end: sailingEndDate(sailing)
  }
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
          website: expect.stringMatching(/^https?:\/\//),
          brandFamily: expect.any(String),
          brandTheme: expect.any(String),
          marketPositioning: expect.any(String)
        })
      )

      expect(cruiseLine.name.trim()).not.toBe('')
      expect(cruiseLine.country.trim()).not.toBe('')
      expect(cruiseLine.brandFamily.trim()).not.toBe('')
      expect(cruiseLine.brandTheme.trim()).not.toBe('')
      expect(cruiseLine.marketPositioning.trim()).not.toBe('')
      expect(cruiseLine.marketPositioning).not.toMatch(/default|cruise explorer/i)
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

  it('uses disembarkation-focused itinerary details on the final day of every sailing', () => {
    getSailings().forEach(({ sailing }) => {
      const finalDay = [...sailing.itinerary].sort((a, b) => b.day - a.day)[0]
      const activities = finalDay.activitySchedule.map(activity => `${activity.time} ${activity.activity}`).join(' ')

      expect(finalDay.title).toMatch(/Disembarkation Day/)
      expect(activities).toContain('8:00 AM All guests must vacate staterooms')
      expect(activities).toContain('12:00 PM All passengers must be off the ship')
    })
  })

  it('does not seed overlapping bookings for the same passenger', () => {
    const bookingsByCustomer = new Map()

    cruiseSeedData.bookings.forEach(booking => {
      booking.passengers.forEach(passenger => {
        bookingsByCustomer.set(
          passenger.customerId,
          [...(bookingsByCustomer.get(passenger.customerId) || []), booking]
        )
      })
    })

    bookingsByCustomer.forEach(bookings => {
      const intervals = bookings
        .map(booking => ({ ...bookingInterval(booking), bookingId: booking.id }))
        .sort((a, b) => a.start - b.start)

      for (let index = 1; index < intervals.length; index += 1) {
        expect(intervals[index].start.getTime()).toBeGreaterThan(intervals[index - 1].end.getTime())
      }
    })
  })


  it('contains at least ten activity schedule items per itinerary day for richer passenger planning', () => {
    getItineraryDays().forEach(({ itineraryDay }) => {
      expect(itineraryDay.activitySchedule.length).toBeGreaterThanOrEqual(10)
    })
  })

  it('includes common cruise theme and dress-night itinerary activities', () => {
    const activities = getActivities().map(({ activity }) => activity.activity).join(' ')

    expect(activities).toMatch(/Formal Night|White Party|Tropical Night|80s Night|Pirate Night|Elegant Evening|Glow Party/)
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

  function getPassengerTotalsBySailing(bookings = getBookings()) {
    return bookings.reduce((totals, booking) => {
      const key = `${booking.shipName}|${booking.departureDate}`
      totals[key] = (totals[key] || 0) + booking.passengers.length
      return totals
    }, {})
  }

  it('contains customer IDs using the C-prefixed ten-character portfolio format', () => {
    const customers = getCustomers()

    expect(customers.length).toBeGreaterThanOrEqual(24)

    customers.forEach(customer => {
      expect(customer.id).toMatch(/^C[A-Z0-9]{9}$/)
      expect(customer.firstName.trim()).not.toBe('')
      expect(customer.lastName.trim()).not.toBe('')
      expect(customer.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    })
  })

  it('contains booking IDs using the B-prefixed ten-character portfolio format', () => {
    const bookings = getBookings()

    expect(bookings.length).toBeGreaterThanOrEqual(17)

    bookings.forEach(booking => {
      expect(booking.id).toMatch(/^B[A-Z0-9]{9}$/)
      expect(booking.bookingStatus.trim()).not.toBe('')
      expect(booking.passengers.length).toBeGreaterThan(0)
    })
  })


  it('contains a broad booking mix with realistic party sizes and waitlisted scenarios', () => {
    const bookings = getBookings()
    const passengerCounts = getRealisticDemoManifestBookings(bookings).map(booking => booking.passengers.length)
    const portfolioPairingCounts = getPortfolioPairingBookings(bookings).map(booking => booking.passengers.length)
    const statuses = new Set(bookings.map(booking => booking.bookingStatus))
    const fareCodes = new Set(bookings.map(booking => booking.fareCode))

    const singles = passengerCounts.filter(count => count === 1).length
    const couples = passengerCounts.filter(count => count === 2).length
    const fourPersonFamilies = passengerCounts.filter(count => count === 4).length
    const largerGroups = passengerCounts.filter(count => count > 4).length

    expect(portfolioPairingCounts).toEqual([2])
    expect(singles).toBeGreaterThanOrEqual(500)
    expect(couples).toBeGreaterThan(singles)
    expect(fourPersonFamilies).toBeGreaterThanOrEqual(150)
    expect(largerGroups).toBeGreaterThan(20)
    expect(largerGroups).toBeLessThan(fourPersonFamilies)
    expect(passengerCounts.every(count => count >= 1 && count <= 5)).toBe(true)
    expect([...statuses]).toEqual(expect.arrayContaining(['CONFIRMED', 'DEPOSIT_PAID', 'WAITLISTED']))
    expect(fareCodes.size).toBeGreaterThanOrEqual(8)
  })


  it('keeps selected regular passengers across multiple bookings without moving Jay and Alisa off Royal Caribbean', () => {
    const bookings = getBookings()
    const jayBookings = bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === 'C000000001')
    )
    const alisaBookings = bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === 'C000000002')
    )
    const graceBookings = bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === 'C000000010')
    )

    expect(jayBookings).toHaveLength(1)
    expect(alisaBookings).toHaveLength(1)
    expect(jayBookings[0].shipName).toBe('Adventure of the Seas')
    expect(alisaBookings[0].shipName).toBe('Adventure of the Seas')
    expect(graceBookings.length).toBeGreaterThanOrEqual(2)
  })

  it('contains a realistic variety of cruise booking party sizes', () => {
    const bookings = getBookings()
    const passengerCounts = getRealisticDemoManifestBookings(bookings).map(booking => booking.passengers.length)
    const portfolioPairingCounts = getPortfolioPairingBookings(bookings).map(booking => booking.passengers.length)

    expect(passengerCounts).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]))
    expect(passengerCounts.every(count => count >= 1 && count <= 5)).toBe(true)
    expect(portfolioPairingCounts).toEqual([2])
  })

  it('expands bookings so every sailing has a realistic demo manifest total', () => {
    const sailingSeedKeys = getSailingSeedKeys()
    const passengerTotals = getPassengerTotalsBySailing()
    const totals = Object.values(passengerTotals)

    expect(Object.keys(passengerTotals).length).toBe(sailingSeedKeys.size)
    expect(totals.every(count => count >= 5 && count <= 10)).toBe(true)
    expect(new Set(totals)).toEqual(new Set([5, 6, 7, 8, 9, 10]))
  })

  it('resolves every seeded booking to a seeded ship sailing', () => {
    const sailingSeedKeys = getSailingSeedKeys()

    getBookings().forEach(booking => {
      expect(sailingSeedKeys.has(`${booking.shipName}|${booking.departureDate}`)).toBe(true)
    })
  })

  it('keeps demo sailing dates pushed beyond the immediate July portfolio window', () => {
    getBookings().forEach(booking => {
      expect(booking.departureDate >= '2026-08-01').toBe(true)
    })

    getSailings().forEach(({ sailing }) => {
      expect(sailing.departureDate >= '2026-08-01').toBe(true)
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

  it('balances booking party sizes like a realistic cruise manifest', () => {
    const passengerCounts = getRealisticDemoManifestBookings(getBookings()).map(booking => booking.passengers.length)
    const singles = passengerCounts.filter(count => count === 1).length
    const couples = passengerCounts.filter(count => count === 2).length
    const fourPersonGroups = passengerCounts.filter(count => count === 4).length
    const largerGroups = passengerCounts.filter(count => count > 4).length

    expect(passengerCounts.every(count => count >= 1 && count <= 5)).toBe(true)
    expect(couples).toBeGreaterThan(singles)
    expect(fourPersonGroups).toBeGreaterThan(largerGroups)
    expect(largerGroups).toBeGreaterThanOrEqual(20)
    expect(largerGroups).toBeLessThan(fourPersonGroups)
  })
})


describe('demo user seed data integrity', () => {
  function getDemoUsers() {
    return cruiseSeedData.demoUsers || []
  }

  function getCustomers() {
    return cruiseSeedData.customers || []
  }

  it('contains demo users for admin, passenger, group leader, and operational role previews', () => {
    const demoUsers = getDemoUsers()
    const roles = new Set(demoUsers.map(user => user.role))

    expect(demoUsers.length).toBeGreaterThanOrEqual(8)
    expect(roles.has('ADMIN')).toBe(true)
    expect(roles.has('PASSENGER')).toBe(true)
    expect(roles.has('GROUP_LEADER')).toBe(true)
    expect(roles.has('TURNAROUND_MANAGER')).toBe(true)
    expect(roles.has('HOUSEKEEPING_LEAD')).toBe(true)
    expect(roles.has('GUEST_SERVICES_LEAD')).toBe(true)
    expect(roles.has('FOOD_BEVERAGE_LEAD')).toBe(true)
    expect(roles.has('ENGINEERING_LEAD')).toBe(true)
  })

  it('links passenger and group leader demo users to seeded customers', () => {
    const customerIds = new Set(getCustomers().map(customer => customer.id))

    getDemoUsers()
      .filter(user => ['PASSENGER', 'GROUP_LEADER'].includes(user.role))
      .forEach(user => {
        expect(user.customerId).toMatch(/^C[A-Z0-9]{9}$/)
        expect(customerIds.has(user.customerId)).toBe(true)
      })
  })

  it('contains at least ten demo role selections for portfolio role diversity', () => {
    const demoUsers = getDemoUsers()
    const displayNames = demoUsers.map(user => user.displayName).join(' ')

    expect(demoUsers.length).toBeGreaterThanOrEqual(10)
    expect(displayNames).toContain('Alisa Gallagher')
    expect(displayNames).toContain('Parker Family')
    expect(displayNames).toContain('Kim Couple')
    expect(displayNames).toContain('Grace Thompson')
  })

  it('keeps Jay and Alisa Gallagher scoped to the Royal Caribbean passenger scenario', () => {
    const jayId = 'C000000001'
    const alisaId = 'C000000002'

    const jayBookings = cruiseSeedData.bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === jayId)
    )
    const alisaBookings = cruiseSeedData.bookings.filter(booking =>
      booking.passengers.some(passenger => passenger.customerId === alisaId)
    )

    expect(jayBookings).toHaveLength(1)
    expect(alisaBookings).toHaveLength(1)
    expect(jayBookings[0].id).toBe(alisaBookings[0].id)
    expect(jayBookings[0].shipName).toBe('Adventure of the Seas')
    expect(jayBookings[0].departureDate).toBe('2026-08-05')
  })

  it('does not store authentication secrets in demo role seed data', () => {
    getDemoUsers().forEach(user => {
      expect(user.password).toBeUndefined()
      expect(user.passwordHash).toBeUndefined()
      expect(user.token).toBeUndefined()
    })
  })
})


describe('turnaround operation seed data integrity', () => {
  it('contains database-backed turnaround operation records with role-owned tasks', () => {
    const operations = cruiseSeedData.turnaroundOperations || []
    const taskRoles = new Set(operations.flatMap(operation => (operation.tasks || []).map(task => task.departmentRole)))
    const signoffRoles = new Set(operations.flatMap(operation => (operation.signoffs || []).map(signoff => signoff.departmentRole)))
    const escalationRoles = new Set(operations.flatMap(operation => (operation.escalations || []).map(escalation => escalation.departmentRole)))
    const staffingRoles = new Set(operations.flatMap(operation => (operation.staffing || []).map(staffing => staffing.departmentRole)))

    expect(operations.length).toBeGreaterThanOrEqual(2)
    operations.forEach(operation => {
      expect(operation.shipName).toEqual(expect.any(String))
      expect(operation.departureDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(operation.title).toEqual(expect.any(String))
      expect(operation.port).toEqual(expect.any(String))
      expect(operation.status).toEqual(expect.any(String))
      expect(operation.readinessLevel).toEqual(expect.any(String))
      expect(operation.tasks.length).toBeGreaterThan(0)
      expect(operation.signoffs.length).toBeGreaterThan(0)
      expect(operation.escalations.length).toBeGreaterThan(0)
      expect(operation.staffing.length).toBeGreaterThan(0)
      operation.staffing.forEach(staffing => {
        expect(staffing.departmentRole).toEqual(expect.any(String))
        expect(staffing.plannedCount).toEqual(expect.any(Number))
        expect(staffing.checkedInCount).toEqual(expect.any(Number))
        expect(staffing.plannedCount).toBeGreaterThanOrEqual(staffing.checkedInCount)
        expect(staffing.leadName).toEqual(expect.any(String))
        expect(staffing.musterLocation).toEqual(expect.any(String))
      })
      operation.escalations.forEach(escalation => {
        expect(escalation.departmentRole).toEqual(expect.any(String))
        expect(['WATCH', 'HIGH', 'CRITICAL']).toContain(escalation.severity)
        expect(['OPEN', 'MONITORING', 'RESOLVED']).toContain(escalation.status)
        expect(escalation.title).toEqual(expect.any(String))
        expect(escalation.createdAt).toEqual(expect.any(String))
      })
      operation.signoffs.forEach(signoff => {
        expect(signoff.departmentRole).toEqual(expect.any(String))
        expect(['PENDING', 'APPROVED', 'BLOCKED']).toContain(signoff.status)
        expect(signoff.notes).toEqual(expect.any(String))
      })
      operation.tasks.forEach(task => {
        expect(task.ownerName).toEqual(expect.any(String))
        expect(task.dueTime).toEqual(expect.any(String))
        expect(task.location).toEqual(expect.any(String))
        if (task.updates) {
          task.updates.forEach(update => {
            expect(update.authorName).toEqual(expect.any(String))
            expect(update.message).toEqual(expect.any(String))
            expect(update.createdAt).toEqual(expect.any(String))
          })
        }
      })
    })

    expect(operations.flatMap(operation => operation.tasks || []).some(task => (task.updates || []).length > 0)).toBe(true)

    expect([...taskRoles]).toEqual(expect.arrayContaining([
      'turnaround-manager',
      'housekeeping-lead',
      'guest-services-lead',
      'food-beverage-lead',
      'engineering-lead'
    ]))

    expect([...signoffRoles]).toEqual(expect.arrayContaining([
      'turnaround-manager',
      'housekeeping-lead',
      'guest-services-lead',
      'food-beverage-lead',
      'engineering-lead'
    ]))

    expect([...escalationRoles]).toEqual(expect.arrayContaining([
      'guest-services-lead',
      'engineering-lead',
      'housekeeping-lead'
    ]))

    expect([...staffingRoles]).toEqual(expect.arrayContaining([
      'turnaround-manager',
      'housekeeping-lead',
      'guest-services-lead',
      'food-beverage-lead',
      'engineering-lead'
    ]))
  })

  it('provides ship-level operations coverage for every seeded cruise line and ship', () => {
    const operations = cruiseSeedData.turnaroundOperations || []
    const operationKeys = new Set(operations.map(operation => `${operation.shipName}|${operation.departureDate}`))
    const firstSailingKeys = getShips().map(({ ship }) => `${ship.name}|${ship.sailings[0].departureDate}`)
    const operationCruiseLines = new Set(operations.map(operation => {
      const sailingRecord = getSailings().find(({ ship, sailing }) => ship.name === operation.shipName && sailing.departureDate === operation.departureDate)
      return sailingRecord?.cruiseLine.name
    }).filter(Boolean))

    expect(operations.length).toBeGreaterThanOrEqual(getShips().length)
    firstSailingKeys.forEach(key => expect(operationKeys.has(key)).toBe(true))
    expect(operationCruiseLines.size).toBe(getCruiseLines().length)
  })

  it('provides ship-scoped operational personas for every operations role on every seeded ship', () => {
    const demoUsers = cruiseSeedData.demoUsers || []
    const roleNames = ['TURNAROUND_MANAGER', 'HOUSEKEEPING_LEAD', 'GUEST_SERVICES_LEAD', 'FOOD_BEVERAGE_LEAD', 'ENGINEERING_LEAD']

    getShips().forEach(({ ship }) => {
      roleNames.forEach(role => {
        const matchingUser = demoUsers.find(user => user.role === role && user.displayName.includes(ship.name))
        expect(matchingUser).toBeDefined()
      })
    })
  })

  it('uses varied operational scenarios so the portfolio demonstrates real turnaround job functions', () => {
    const operations = cruiseSeedData.turnaroundOperations || []
    const statuses = new Set(operations.map(operation => operation.status))
    const readinessLevels = new Set(operations.map(operation => operation.readinessLevel))
    const handoffStatuses = new Set(operations.flatMap(operation => (operation.handoffs || []).map(handoff => handoff.status)))
    const dependencyStatuses = new Set(operations.flatMap(operation => (operation.taskDependencies || []).map(dependency => dependency.status)))
    const escalationSeverities = new Set(operations.flatMap(operation => (operation.escalations || []).map(escalation => escalation.severity)))

    expect(statuses.size).toBeGreaterThanOrEqual(4)
    expect(readinessLevels.size).toBeGreaterThanOrEqual(5)
    expect([...handoffStatuses]).toEqual(expect.arrayContaining(['PENDING', 'READY', 'COMPLETE', 'BLOCKED']))
    expect([...dependencyStatuses]).toEqual(expect.arrayContaining(['ACTIVE', 'CLEARED']))
    expect([...escalationSeverities]).toEqual(expect.arrayContaining(['WATCH', 'HIGH', 'CRITICAL']))
  })

})
