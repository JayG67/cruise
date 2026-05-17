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
