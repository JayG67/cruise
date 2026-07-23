import { useMemo, useState } from 'react'

function formatCount(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function getLineId(line = {}) {
  return line.id || line.name || 'cruise-line'
}

function getLineShips(line = {}) {
  return Array.isArray(line.ships) ? line.ships : []
}

function getBookingDepartureDate(booking = {}) {
  return booking.departureDate || booking.sailingDate || booking.sailing?.departureDate || ''
}

function getBookingEmbarkationPort(booking = {}) {
  return booking.embarkationPort || booking.departurePort || booking.sailing?.departurePort || ''
}

function getBookingDebarkationPort(booking = {}) {
  return booking.debarkationPort || booking.arrivalPort || booking.sailing?.arrivalPort || ''
}

function buildBookingDerivedShips(line = {}, bookings = []) {
  const lineName = line.name || ''
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === lineName || (!getBookingCruiseLineName(booking) && getBookingShipName(booking)))
  const shipMap = new Map()

  matchingBookings.forEach(booking => {
    const shipName = getBookingShipName(booking)

    if (!shipName) {
      return
    }

    const departureDate = getBookingDepartureDate(booking) || 'Date pending'
    const sailingKey = `${shipName}|${departureDate}`
    const ship = shipMap.get(shipName) || { name: shipName, sailingsByKey: new Map() }
    const sailing = ship.sailingsByKey.get(sailingKey) || {
      id: sailingKey,
      departureDate,
      departurePort: getBookingEmbarkationPort(booking),
      arrivalPort: getBookingDebarkationPort(booking),
      destination: getBookingDebarkationPort(booking) || getBookingEmbarkationPort(booking) || 'Featured voyage',
      days: 3,
      itinerary: []
    }

    if (!sailing.departurePort && getBookingEmbarkationPort(booking)) sailing.departurePort = getBookingEmbarkationPort(booking)
    if (!sailing.arrivalPort && getBookingDebarkationPort(booking)) sailing.arrivalPort = getBookingDebarkationPort(booking)
    if (!sailing.destination && getBookingDebarkationPort(booking)) sailing.destination = getBookingDebarkationPort(booking)

    ship.sailingsByKey.set(sailingKey, sailing)
    shipMap.set(shipName, ship)
  })

  return [...shipMap.values()].map(ship => ({
    name: ship.name,
    sailings: [...ship.sailingsByKey.values()].map(sailing => ({
      ...sailing,
      itinerary: sailing.itinerary.length > 0 ? sailing.itinerary : buildFallbackItinerary(sailing)
    }))
  }))
}

function buildFallbackItinerary(sailing = {}) {
  const departurePort = sailing.departurePort || 'Embarkation port'
  const arrivalPort = sailing.arrivalPort || sailing.destination || departurePort

  return [
    {
      day: 1,
      title: `Embarkation — ${departurePort}`,
      port: departurePort,
      activitySchedule: [
        { time: '12:00 PM', activity: 'Guest boarding and welcome lunch' },
        { time: '4:00 PM', activity: 'Safety briefing and sail-away' }
      ]
    },
    {
      day: 2,
      title: 'Onboard programming',
      port: 'At Sea',
      activitySchedule: [
        { time: '10:00 AM', activity: 'Pool deck and family programming' },
        { time: '7:30 PM', activity: 'Main dining and evening entertainment' }
      ]
    },
    {
      day: 3,
      title: `Return — ${arrivalPort}`,
      port: arrivalPort,
      activitySchedule: [
        { time: '8:00 AM', activity: 'Breakfast and debark preparation' },
        { time: '10:00 AM', activity: 'Guest debarkation' }
      ]
    }
  ]
}

function getPresentationShips(line = {}, bookings = []) {
  const ships = getLineShips(line)

  if (ships.length > 0) {
    return ships
  }

  return buildBookingDerivedShips(line, bookings)
}

function getShipSailings(ship = {}) {
  return Array.isArray(ship.sailings) ? ship.sailings : []
}

function getSailingItinerary(sailing = {}) {
  return Array.isArray(sailing.itinerary) ? sailing.itinerary : []
}

function getBookingShipName(booking = {}) {
  return booking.ship?.name || booking.shipName || booking.ship?.shipName || ''
}

function getBookingCruiseLineName(booking = {}) {
  return booking.cruiseLine?.name || booking.cruiseLineName || ''
}

function getPassengerRows(booking = {}) {
  return Array.isArray(booking.passengers) ? booking.passengers : []
}

function getPassengerName(passenger = {}) {
  return passenger.customer?.name || passenger.customerName || passenger.name || passenger.customerId || 'Guest'
}

function getPassengerPreference(passenger = {}) {
  return passenger.customer?.diningPreference || passenger.diningPreference || passenger.customer?.accessibilityNotes || passenger.accessibilityNotes || 'Standard guest service'
}

function getSailingDestination(sailing = {}) {
  return sailing.destination || sailing.arrivalPort || sailing.region || 'Featured itinerary'
}

function getPortsForLine(line = {}, bookings = []) {
  const ports = new Set()

  getPresentationShips(line, bookings).forEach(ship => {
    getShipSailings(ship).forEach(sailing => {
      if (sailing.departurePort || sailing.port) ports.add(sailing.departurePort || sailing.port)
      if (sailing.arrivalPort) ports.add(sailing.arrivalPort)
      getSailingItinerary(sailing).forEach(day => {
        if (day.port && day.port !== 'At Sea') ports.add(day.port)
      })
    })
  })

  return [...ports]
}

function getActivityHighlights(line = {}, bookings = []) {
  const activities = []

  getPresentationShips(line, bookings).forEach(ship => {
    getShipSailings(ship).forEach(sailing => {
      getSailingItinerary(sailing).forEach(day => {
        const schedule = Array.isArray(day.activitySchedule) ? day.activitySchedule : []
        schedule.slice(0, 2).forEach(activity => {
          activities.push({
            id: `${ship.name}-${sailing.departureDate}-${day.day}-${activity.time}-${activity.activity}`,
            shipName: ship.name,
            sailingDate: sailing.departureDate,
            dayTitle: day.title || `Day ${day.day}`,
            time: activity.time,
            activity: activity.activity
          })
        })
      })
    })
  })

  return activities.slice(0, 8)
}


function getLineSailings(line = {}, bookings = []) {
  return getPresentationShips(line, bookings).flatMap(ship => getShipSailings(ship).map(sailing => ({ ...sailing, shipName: ship.name })))
}

function buildRevenueMix(line = {}, bookings = []) {
  const ships = getPresentationShips(line, bookings)
  const shipNames = new Set(ships.map(ship => ship.name).filter(Boolean))
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === line.name || shipNames.has(getBookingShipName(booking)))
  const categoryTotals = new Map()

  matchingBookings.forEach(booking => {
    const category = booking.stateroomCategory || booking.cabinCategory || booking.fareClass || booking.roomType || 'Standard fare'
    const passengerRows = getPassengerRows(booking)
    const guestCount = Math.max(1, passengerRows.length)
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + guestCount)
  })

  if (categoryTotals.size === 0) {
    ships.slice(0, 3).forEach((ship, index) => {
      categoryTotals.set(index === 0 ? 'Balcony' : index === 1 ? 'Oceanview' : 'Interior', Math.max(1, getShipSailings(ship).length * 2))
    })
  }

  const totalGuests = [...categoryTotals.values()].reduce((total, count) => total + count, 0) || 1

  return [...categoryTotals.entries()]
    .map(([category, guests]) => ({
      category,
      guests,
      share: Math.round((guests / totalGuests) * 100)
    }))
    .sort((left, right) => right.guests - left.guests)
    .slice(0, 5)
}

function buildSailingCalendar(line = {}, bookings = []) {
  return getLineSailings(line, bookings)
    .sort((left, right) => String(left.departureDate || '').localeCompare(String(right.departureDate || '')))
    .slice(0, 6)
    .map(sailing => ({
      id: `${sailing.shipName}-${sailing.departureDate}-${sailing.destination || sailing.arrivalPort || sailing.days}`,
      shipName: sailing.shipName || 'Ship',
      departureDate: sailing.departureDate || 'Date pending',
      duration: sailing.days || getSailingItinerary(sailing).length || 0,
      destination: getSailingDestination(sailing),
      departurePort: sailing.departurePort || sailing.port || 'Home port',
      itineraryDays: getSailingItinerary(sailing).length
    }))
}

function buildGuestExperienceRows(line = {}, bookings = []) {
  const ships = getPresentationShips(line, bookings)
  const shipNames = new Set(ships.map(ship => ship.name).filter(Boolean))

  return bookings
    .filter(booking => getBookingCruiseLineName(booking) === line.name || shipNames.has(getBookingShipName(booking)))
    .flatMap(booking => getPassengerRows(booking).map(passenger => ({
      id: `${booking.id}-${getPassengerName(passenger)}`,
      passengerName: getPassengerName(passenger),
      bookingId: booking.id,
      shipName: getBookingShipName(booking) || 'Ship assignment',
      preference: getPassengerPreference(passenger),
      status: booking.status || booking.bookingStatus || 'Booked'
    })))
    .slice(0, 8)
}

function buildCommercialNarrative(line = {}, metrics = {}) {
  const ports = metrics.ports || []
  const primaryPort = ports[0] || line.country || 'home-port markets'
  const secondaryPort = ports[1] || 'destination programming'

  return [
    {
      id: 'inventory',
      label: 'Inventory visibility',
      detail: `${line.name || 'The selected cruise line'} has ships, sailings, itinerary days, and booking demand in one connected workspace.`
    },
    {
      id: 'experience',
      label: 'Guest experience continuity',
      detail: `Passenger preferences, manifest context, and itinerary activity data stay attached to the voyage instead of living in separate spreadsheets.`
    },
    {
      id: 'ports',
      label: 'Port and route story',
      detail: `The route footprint connects ${primaryPort} with ${secondaryPort}, supporting port planning, guest communication, and itinerary performance review.`
    },
    {
      id: 'handoff',
      label: 'Shipboard operations handoff',
      detail: `Turnaround teams can move from the sailing story into real operational tasks, blockers, staffing, and signoffs.`
    }
  ]
}

function buildOperationsAgenda(line = {}, metrics = {}) {
  return [
    { id: 'brand', time: '0:00', title: 'Brand and fleet status', detail: `${line.name || 'Cruise line'} footprint, ships, sailings, and passenger demand.` },
    { id: 'voyage', time: '1:30', title: 'Voyage operations review', detail: 'Review the featured sailing, itinerary strip, port footprint, and onboard programming.' },
    { id: 'guest', time: '3:00', title: 'Guest and manifest operations', detail: `${formatCount(metrics.passengerCount)} passengers surfaced through booking and manifest context.` },
    { id: 'ops', time: '4:30', title: 'Turnaround operations handoff', detail: 'Connect customer-facing voyage data to ship turnaround execution.' },
    { id: 'sqa', time: '6:00', title: 'SQA verification', detail: 'Use the isolated SQA console when validation evidence is needed.' }
  ]
}


function getFareCode(booking = {}) {
  return booking.fareCode || booking.stateroomCategory || booking.cabinCategory || booking.fareClass || booking.roomType || 'STD'
}

function normalizeFareLabel(fareCode = '') {
  const normalized = String(fareCode || '').trim().toUpperCase()

  if (normalized.startsWith('BAL')) return 'Balcony'
  if (normalized.startsWith('STE') || normalized.startsWith('SUI')) return 'Suite'
  if (normalized.startsWith('OV') || normalized.includes('OCEAN')) return 'Oceanview'
  if (normalized.startsWith('INT')) return 'Interior'

  return normalized ? normalized.charAt(0) + normalized.slice(1).toLowerCase() : 'Standard'
}

function buildSailingRevenueBoard(line = {}, bookings = []) {
  const ships = getPresentationShips(line, bookings)
  const shipNames = new Set(ships.map(ship => ship.name).filter(Boolean))
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === line.name || shipNames.has(getBookingShipName(booking)))
  const guestCountsByKey = new Map()

  matchingBookings.forEach(booking => {
    const key = `${getBookingShipName(booking) || 'Ship'}|${getBookingDepartureDate(booking) || 'Date pending'}`
    const current = guestCountsByKey.get(key) || { guests: 0, bookings: 0, fareCodes: new Map() }
    const guestCount = Math.max(1, getPassengerRows(booking).length)
    const fareLabel = normalizeFareLabel(getFareCode(booking))
    current.guests += guestCount
    current.bookings += 1
    current.fareCodes.set(fareLabel, (current.fareCodes.get(fareLabel) || 0) + guestCount)
    guestCountsByKey.set(key, current)
  })

  return buildSailingCalendar(line, bookings).map((sailing, index) => {
    const key = `${sailing.shipName}|${sailing.departureDate}`
    const visibleDemand = guestCountsByKey.get(key) || { guests: 0, bookings: 0, fareCodes: new Map() }
    const estimatedCapacity = Math.max(120, (sailing.duration || sailing.itineraryDays || 5) * 42 + (index + 1) * 18)
    const occupancy = Math.min(99, Math.max(8, Math.round((visibleDemand.guests / estimatedCapacity) * 100)))
    const topFare = [...visibleDemand.fareCodes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'Open inventory'
    const opportunity = occupancy >= 80
      ? 'Protect premium inventory and prepare upgrade offers.'
      : occupancy >= 45
        ? 'Target group bookings and onboard experience bundles.'
        : 'Open promotional demand through agents and loyalty campaigns.'

    return {
      ...sailing,
      estimatedCapacity,
      visibleGuests: visibleDemand.guests,
      visibleBookings: visibleDemand.bookings,
      occupancy,
      topFare,
      opportunity
    }
  })
}

function buildPortOperationsPlan(line = {}, bookings = []) {
  const portMap = new Map()

  getPresentationShips(line, bookings).forEach(ship => {
    getShipSailings(ship).forEach(sailing => {
      const ports = [sailing.departurePort || sailing.port, sailing.arrivalPort]
      getSailingItinerary(sailing).forEach(day => ports.push(day.port))
      ports.filter(Boolean).forEach(port => {
        const current = portMap.get(port) || { port, calls: 0, ships: new Set(), sampleSailings: [] }
        current.calls += 1
        current.ships.add(ship.name)
        if (current.sampleSailings.length < 2) {
          current.sampleSailings.push(`${ship.name} · ${sailing.departureDate || 'date pending'}`)
        }
        portMap.set(port, current)
      })
    })
  })

  return [...portMap.values()]
    .map(row => ({
      port: row.port,
      calls: row.calls,
      ships: row.ships.size,
      sampleSailings: row.sampleSailings,
      operatingFocus: row.calls >= 6 ? 'High-frequency port coordination' : row.calls >= 3 ? 'Repeat-call service planning' : 'Destination experience planning'
    }))
    .sort((left, right) => right.calls - left.calls || left.port.localeCompare(right.port))
    .slice(0, 6)
}

function buildCruiseLineClosePlan(line = {}, metrics = {}) {
  return [
    {
      id: 'pilot',
      label: 'Pilot a branded sailing workspace',
      detail: `${line.name || 'The cruise line'} can operate from one active ship, its sailings, guest bookings, itinerary program, and turnaround team.`
    },
    {
      id: 'connect',
      label: 'Connect guest and operations teams',
      detail: `The workspace links ${formatCount(metrics.bookingCount)} bookings, ${formatCount(metrics.passengerCount)} passengers, fleet records, and turnaround workstreams.`
    },
    {
      id: 'expand',
      label: 'Expand by voyage and department',
      detail: 'Additional ships, department leads, ports, and passenger groups can be layered in without changing the operations workflow.'
    }
  ]
}

function buildLineMetrics(line = {}, bookings = []) {
  const ships = getPresentationShips(line, bookings)
  const sailings = ships.flatMap(getShipSailings)
  const lineShipNames = new Set(ships.map(ship => ship.name).filter(Boolean))
  const matchingBookings = bookings.filter(booking => {
    const bookingLineName = getBookingCruiseLineName(booking)
    const bookingShipName = getBookingShipName(booking)

    return bookingLineName === line.name || lineShipNames.has(bookingShipName)
  })
  const passengerCount = matchingBookings.reduce((total, booking) => total + Math.max(1, getPassengerRows(booking).length), 0)
  const totalItineraryDays = sailings.reduce((total, sailing) => total + getSailingItinerary(sailing).length, 0)
  const ports = getPortsForLine(line, bookings)

  return {
    shipCount: ships.length,
    sailingCount: sailings.length,
    bookingCount: matchingBookings.length,
    passengerCount,
    itineraryDayCount: totalItineraryDays,
    portCount: ports.length,
    matchingBookings,
    ports
  }
}

function buildLineDemoFlow(line = {}, metrics = {}, bookings = []) {
  const primaryShip = getPresentationShips(line, bookings)[0] || {}
  const primarySailing = getShipSailings(primaryShip)[0] || {}

  return [
    {
      id: 'fleet',
      label: 'Fleet and brand story',
      detail: `${line.name || 'Cruise line'} is represented with ${formatCount(metrics.shipCount)} ships and ${formatCount(metrics.sailingCount)} sailings.`
    },
    {
      id: 'voyage',
      label: 'Sailing and itinerary experience',
      detail: `${primaryShip.name || 'A selected ship'} shows a ${primarySailing.days || 'multi'}-day itinerary with ports, activity schedule, and embark/debark flow.`
    },
    {
      id: 'passengers',
      label: 'Guest manifest and booking view',
      detail: `${formatCount(metrics.bookingCount)} bookings and ${formatCount(metrics.passengerCount)} passengers connect the cruise product to real guest operations.`
    },
    {
      id: 'operations',
      label: 'Turnaround operations handoff',
      detail: 'The same platform connects passenger-facing voyage data to operational turnaround execution.'
    }
  ]
}

export default function ReactCruiseLinePresentationSuite({ cruiseLines = [], bookings = [], onOpenWorkspace }) {
  const [selectedLineId, setSelectedLineId] = useState(() => getLineId(cruiseLines[0] || {}))
  const [selectedShipName, setSelectedShipName] = useState('')
  const [selectedSailingId, setSelectedSailingId] = useState('')
  const selectedLine = useMemo(() => {
    return cruiseLines.find(line => getLineId(line) === selectedLineId) || cruiseLines[0] || null
  }, [cruiseLines, selectedLineId])
  const metrics = useMemo(() => selectedLine ? buildLineMetrics(selectedLine, bookings) : buildLineMetrics({}, []), [selectedLine, bookings])
  const demoFlow = useMemo(() => selectedLine ? buildLineDemoFlow(selectedLine, metrics, bookings) : [], [selectedLine, metrics, bookings])
  const ships = useMemo(() => selectedLine ? getPresentationShips(selectedLine, bookings) : [], [selectedLine, bookings])
  const featuredShip = ships.find(ship => ship.name === selectedShipName) || ships[0] || {}
  const shipSailings = getShipSailings(featuredShip)
  const featuredSailing = shipSailings.find(sailing => sailing.id === selectedSailingId || sailing.departureDate === selectedSailingId) || shipSailings[0] || {}
  const manifestPreview = metrics.matchingBookings.slice(0, 4)
  const revenueMix = useMemo(() => selectedLine ? buildRevenueMix(selectedLine, bookings) : [], [selectedLine, bookings])
  const commercialNarrative = useMemo(() => selectedLine ? buildCommercialNarrative(selectedLine, metrics) : [], [selectedLine, metrics])

  if (!selectedLine) {
    return (
      <section className="cruise-line-presentation-suite ce-command-panel" id="react-cruise-line-presentation" aria-labelledby="react-cruise-line-presentation-heading">
        <p className="eyebrow ce-kicker">Cruise line operations</p>
        <h2 id="react-cruise-line-presentation-heading">Cruise-line operations workspace</h2>
        <p className="status-card compact ce-command-card">Fleet data is loading.</p>
      </section>
    )
  }

  return (
    <section className="cruise-line-presentation-suite ce-command-panel" id="react-cruise-line-presentation" aria-labelledby="react-cruise-line-presentation-heading" data-testid="react-cruise-line-presentation-suite">
      <div className="presentation-control-panel cruise-line-operations-control-panel ce-command-card ce-surface-dark">
        <div className="presentation-suite-heading cruise-line-operations-heading">
          <p className="eyebrow ce-kicker">Cruise line operations</p>
          <h2 id="react-cruise-line-presentation-heading">Cruise line operating workspace</h2>
          <p>
            Select the operating scope, then drill into fleet, guest, sailing, or turnaround workflows.
          </p>
        </div>

        <div className="presentation-scope-controls cruise-line-operations-scope-controls ce-surface-dark" aria-label="Cruise line operating scope">
          <label className="presentation-line-picker cruise-line-operations-picker ce-surface-dark">
            <span>Cruise line</span>
            <select value={getLineId(selectedLine)} onChange={event => { setSelectedLineId(event.target.value); setSelectedShipName(''); setSelectedSailingId('') }} data-testid="react-presentation-line-picker">
              {cruiseLines.map(line => (
                <option key={getLineId(line)} value={getLineId(line)}>{line.name}</option>
              ))}
            </select>
            <small>Select the cruise line to operate within.</small>
          </label>
          <label className="presentation-line-picker cruise-line-operations-picker ce-surface-dark">
            <span>Ship</span>
            <select value={featuredShip.name || ''} onChange={event => { setSelectedShipName(event.target.value); setSelectedSailingId('') }} data-testid="react-presentation-ship-picker">
              {ships.map(ship => <option key={ship.name} value={ship.name}>{ship.name}</option>)}
            </select>
            <small>Select the ship to focus on.</small>
          </label>
          <label className="presentation-line-picker cruise-line-operations-picker ce-surface-dark">
            <span>Sailing</span>
            <select value={featuredSailing.id || featuredSailing.departureDate || ''} onChange={event => setSelectedSailingId(event.target.value)} data-testid="react-presentation-sailing-picker">
              {shipSailings.map(sailing => <option key={sailing.id || sailing.departureDate} value={sailing.id || sailing.departureDate}>{sailing.departureDate || 'Date pending'} · {getSailingDestination(sailing)}</option>)}
            </select>
            <small>Select the sailing to operate.</small>
          </label>
        </div>
      </div>

      <div className="presentation-hero-card ce-command-card ce-surface-light">
        <div>
          <p className="eyebrow ce-kicker">{selectedLine.brandFamily || selectedLine.country || 'Cruise brand'}</p>
          <h3>{selectedLine.name}</h3>
          <p>{selectedLine.marketPositioning || selectedLine.brandTheme || 'Fleet, itinerary, and passenger operations in one application.'}</p>
        </div>
        <div className="presentation-metric-grid" aria-label={`${selectedLine.name} operational metrics`}>
          <article className="ce-surface-light"><span>Ships</span><strong>{formatCount(metrics.shipCount)}</strong></article>
          <article className="ce-surface-light"><span>Sailings</span><strong>{formatCount(metrics.sailingCount)}</strong></article>
          <article className="ce-surface-light"><span>Bookings</span><strong>{formatCount(metrics.bookingCount)}</strong></article>
          <article className="ce-surface-light"><span>Passengers</span><strong>{formatCount(metrics.passengerCount)}</strong></article>
          <article className="ce-surface-light"><span>Itinerary days</span><strong>{formatCount(metrics.itineraryDayCount)}</strong></article>
          <article className="ce-surface-light"><span>Ports</span><strong>{formatCount(metrics.portCount)}</strong></article>
        </div>
      </div>

      <div className="presentation-demo-flow presentation-action-grid" aria-label="Cruise line operating actions">
        <article className="presentation-flow-card ce-command-card" data-testid="react-presentation-flow-card">
          <strong>Fleet</strong>
          <p>{formatCount(metrics.shipCount)} ships and {formatCount(metrics.sailingCount)} sailings in scope.</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-fleet', 'Fleet Directory', 'admin')}>Open fleet</button>
        </article>
        <article className="presentation-flow-card ce-command-card" data-testid="react-presentation-flow-card">
          <strong>Guests</strong>
          <p>{formatCount(metrics.bookingCount)} bookings and {formatCount(metrics.passengerCount)} visible passengers.</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-role-selector', 'Role-aware Views')}>Open roles</button>
        </article>
        <article className="presentation-flow-card ce-command-card" data-testid="react-presentation-flow-card">
          <strong>Sailing plan</strong>
          <p>{featuredShip.name || 'Selected ship'} · {featuredSailing.departureDate || 'date pending'}.</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-fleet', 'Fleet Directory', 'admin')}>Open sailings</button>
        </article>
        <article className="presentation-flow-card ce-command-card" data-testid="react-presentation-flow-card">
          <strong>Turnaround</strong>
          <p>Move from voyage data to assigned operational execution.</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-turnaround-admin-setup', 'Turnaround Setup', 'admin')}>Open operations</button>
        </article>
      </div>



      <div className="presentation-action-row ce-action-row">
        <button type="button" className="primary-action-button ce-button-primary" onClick={() => onOpenWorkspace?.('react-fleet', 'Fleet Directory', 'admin')} data-testid="react-presentation-open-fleet">
          Open fleet details
        </button>
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-role-selector', 'Role-aware Views')} data-testid="react-presentation-open-roles">
          Open passenger views
        </button>
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-turnaround-admin-setup', 'Turnaround Setup', 'admin')} data-testid="react-presentation-open-turnaround">
          Open turnaround setup
        </button>
      </div>
    </section>
  )
}

export { buildCommercialNarrative, buildCruiseLineClosePlan, buildGuestExperienceRows, buildLineDemoFlow, buildLineMetrics, buildPortOperationsPlan, buildOperationsAgenda, buildRevenueMix, buildSailingCalendar, buildSailingRevenueBoard, getActivityHighlights, getPortsForLine }
