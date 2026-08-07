import { useMemo, useState } from 'react'
import {
  buildLineMetrics,
  buildSelectedOperatingScope,
  formatCount,
  getLineId,
  getOperationalShips,
  getSailingDestination,
  getShipSailings
} from '../domain/cruiseLineOperations.js'
import useAuthoritativeSailingItinerary from '../hooks/useAuthoritativeSailingItinerary.js'
export default function ReactCruiseLineOperationsWorkspace({ cruiseLines = [], bookings = [], onOpenWorkspace }) {
  const [selectedLineId, setSelectedLineId] = useState(() => getLineId(cruiseLines[0] || {}))
  const [selectedShipName, setSelectedShipName] = useState('')
  const [selectedSailingId, setSelectedSailingId] = useState('')
  const selectedLine = useMemo(() => {
    return cruiseLines.find(line => getLineId(line) === selectedLineId) || cruiseLines[0] || null
  }, [cruiseLines, selectedLineId])
  const metrics = useMemo(() => selectedLine ? buildLineMetrics(selectedLine, bookings) : buildLineMetrics({}, []), [selectedLine, bookings])
  const ships = useMemo(() => selectedLine ? getOperationalShips(selectedLine, bookings) : [], [selectedLine, bookings])
  const featuredShip = ships.find(ship => ship.name === selectedShipName) || ships[0] || {}
  const shipSailings = getShipSailings(featuredShip)
  const featuredSailing = shipSailings.find(sailing => sailing.id === selectedSailingId || sailing.departureDate === selectedSailingId) || shipSailings[0] || {}
  const authoritativeItinerary = useAuthoritativeSailingItinerary({ cruiseLineId: getLineId(selectedLine || {}), shipId: featuredShip.id || '',
    shipName: featuredShip.name || '', sailingId: featuredSailing.id || '', departureDate: featuredSailing.departureDate || '' })
  const selectedScope = useMemo(
    () => buildSelectedOperatingScope(selectedLine, featuredShip, featuredSailing, bookings, authoritativeItinerary),
    [selectedLine, featuredShip, featuredSailing, bookings, authoritativeItinerary]
  )
  function openSelectedSailingWorkspace() {
    onOpenWorkspace?.('react-fleet', 'Fleet Directory', 'admin', {
      fleetScope: {
        ...selectedScope,
        requestId: `${selectedScope.lineId}:${selectedScope.shipId || selectedScope.shipName}:${selectedScope.sailingId}:${Date.now()}`
      }
    })
  }
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
      <section className="cruise-line-selected-scope ce-command-card ce-surface-light" aria-labelledby="cruise-line-selected-scope-heading" aria-live="polite" data-testid="react-cruise-line-selected-scope">
        <div className="cruise-line-selected-scope-heading">
          <div>
            <p className="eyebrow ce-kicker">Selected sailing workspace</p>
            <h3 id="cruise-line-selected-scope-heading">{selectedScope.shipName} · {selectedScope.departureDate}</h3>
            <p>{selectedScope.departurePort} to {selectedScope.destination}. The information below is now scoped to this sailing.</p>
          </div>
          <span className="cruise-line-selected-scope-status">Scope active</span>
        </div>
        <dl className="cruise-line-selected-scope-metrics" aria-label="Selected sailing operating summary">
          <div><dt>Cruise line</dt><dd>{selectedScope.lineName}</dd></div>
          <div><dt>Voyage length</dt><dd>{selectedScope.days || 'Pending'} day{selectedScope.days === 1 ? '' : 's'}</dd></div>
          <div><dt>Bookings</dt><dd>{formatCount(selectedScope.bookingCount)}</dd></div>
          <div><dt>Passengers</dt><dd>{formatCount(selectedScope.passengerCount)}</dd></div>
          <div><dt>Itinerary days</dt><dd>{formatCount(selectedScope.itineraryDayCount)}</dd></div>
        </dl>
        <div className="ce-action-row cruise-line-selected-scope-actions">
          <button type="button" className="primary-action-button ce-button-primary" onClick={openSelectedSailingWorkspace} data-testid="react-presentation-open-selected-sailing">
            Open selected sailing workspace
          </button>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-turnaround-admin-setup', 'Turnaround Setup', 'admin')} data-testid="react-presentation-open-selected-turnaround">
            Open turnaround setup
          </button>
        </div>
      </section>

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
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={openSelectedSailingWorkspace}>Open selected sailing</button>
        </article>
        <article className="presentation-flow-card ce-command-card" data-testid="react-presentation-flow-card">
          <strong>Turnaround</strong>
          <p>Move from voyage data to assigned operational execution.</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-turnaround-admin-setup', 'Turnaround Setup', 'admin')}>Open operations</button>
        </article>
      </div>

      <div className="presentation-action-row ce-action-row">
        <button type="button" className="primary-action-button ce-button-primary" onClick={openSelectedSailingWorkspace} data-testid="react-presentation-open-fleet">
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

export { buildCommercialNarrative, buildCruiseLineClosePlan, buildGuestExperienceRows, buildLineOperationsFlow, buildLineMetrics, buildPortOperationsPlan, buildOperationsAgenda, buildRevenueMix, buildSailingCalendar, buildSailingRevenueBoard, getActivityHighlights, getPortsForLine } from '../domain/cruiseLineOperations.js'
