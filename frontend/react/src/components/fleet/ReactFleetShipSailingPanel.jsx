function getCurrentPortLabel(ship) {
  return ship.currentPort || ship.current_port || ship.homePort || ship.home_port || 'Not currently listed'
}

function getSailingDateLabel(sailing) {
  if (!sailing?.departureDate) {
    return 'Departure date unavailable'
  }

  return sailing.departureDate
}

function getSailingTypeLabel(sailing) {
  return sailing?.isRepositioning ? 'Repositioning Sailing' : 'Round-Trip / Regional Sailing'
}

export default function ReactFleetShipSailingPanel({
  selectedCruiseLine,
  selectedShips,
  shipDraft,
  setShipDraft,
  shipActionId,
  shipsLoading,
  shipsError,
  shipActionMessage,
  activeShipEditId,
  shipEditDraft,
  setShipEditDraft,
  selectedShipForSailings,
  sailings,
  sailingsLoading,
  sailingsError,
  sailingDraft,
  setSailingDraft,
  sailingActionMessage,
  sailingActionId,
  activeSailingEditId,
  sailingEditDraft,
  setSailingEditDraft,
  onCreateShip,
  onViewSailings,
  onOpenShipEdit,
  onRequestDeleteShip,
  onUpdateShip,
  onCancelShipEdit,
  onCreateSailing,
  onViewItinerary,
  onOpenSailingEdit,
  onRequestDeleteSailing,
  onUpdateSailing,
  onCancelSailingEdit
}) {
  return (
    <>
<section
  className="react-selected-ships-panel ce-command-card"
  aria-labelledby="react-selected-ships-heading"
  data-testid="react-selected-ships-panel"
>
  <div className="selected-ships-heading-row">
    <div>
      <p className="eyebrow ce-kicker">Selected fleet</p>
      <h3 id="react-selected-ships-heading">
        {selectedCruiseLine ? `${selectedCruiseLine.name} ships` : 'Select a cruise line to view ships'}
      </h3>
    </div>
    {selectedCruiseLine && (
      <span className="selected-ships-count" data-testid="react-selected-ships-count">
        {selectedShips.length} ships
      </span>
    )}
  </div>

  {!selectedCruiseLine && (
    <p className="muted-status ce-muted">Use View Ships on a cruise line card to load its current fleet.</p>
  )}

  {selectedCruiseLine && (
    <form className="react-ship-create-form ce-editor-card" onSubmit={onCreateShip} data-testid="react-create-ship-form">
      <h4>Add Ship</h4>
      <div className="react-ship-form-grid">
        <label>
          <span>Ship name</span>
          <input
            value={shipDraft.name}
            onChange={event => setShipDraft(current => ({ ...current, name: event.target.value }))}
            placeholder="Example: Rotterdam"
            data-testid="react-create-ship-name-input"
          />
        </label>
        <label>
          <span>Current port</span>
          <input
            value={shipDraft.currentPort}
            onChange={event => setShipDraft(current => ({ ...current, currentPort: event.target.value }))}
            placeholder="Miami, Florida"
            data-testid="react-create-ship-current-port-input"
          />
        </label>
      </div>
      <button type="submit" className="fleet-primary-action ce-button-primary" disabled={shipActionId === 'create'} data-testid="react-create-ship-submit-button">
        {shipActionId === 'create' ? 'Creating…' : 'Create Ship'}
      </button>
    </form>
  )}

  {shipsLoading && <p className="muted-status ce-muted">Loading ships…</p>}
  {shipsError && <p className="error" role="alert">{shipsError}</p>}
  {shipActionMessage && <p className="muted-status ce-muted" role="status" data-testid="react-ship-action-message">{shipActionMessage}</p>}

  {selectedCruiseLine && !shipsLoading && !shipsError && selectedShips.length === 0 && (
    <p className="muted-status ce-muted">No ships are currently listed for this cruise line.</p>
  )}

  {selectedShips.length > 0 && (
    <div className="react-ship-card-grid" data-testid="react-ship-card-grid">
      {selectedShips.map(ship => (
        <article className="react-ship-card" key={ship.id || ship.name} data-testid="react-ship-card">
          <h4>{ship.name}</h4>
          <p><strong>Current port:</strong> {getCurrentPortLabel(ship)}</p>
          <div className="react-ship-card-actions">
            <button type="button" className="fleet-primary-action ce-button-primary" onClick={() => onViewSailings(ship)} data-testid="react-view-sailings-button">
              View Sailings
            </button>
            <button type="button" className="fleet-primary-action ce-button-primary" onClick={() => onOpenShipEdit(ship)} disabled={shipActionId === ship.id} data-testid="react-update-ship-button">
              Update Ship
            </button>
            <button type="button" className="fleet-danger-action ce-button-danger" onClick={() => onRequestDeleteShip(ship)} disabled={shipActionId === ship.id} data-testid="react-delete-ship-button">
              Delete Ship
            </button>
          </div>
          {activeShipEditId === ship.id && (
            <form className="react-inline-edit-form ce-editor-card" onSubmit={event => onUpdateShip(event, ship)} data-testid="react-ship-edit-form">
              <h5>Edit ship</h5>
              <div className="react-inline-edit-grid react-ship-edit-grid">
                <label>
                  <span>Ship name</span>
                  <input
                    value={shipEditDraft.name}
                    onChange={event => setShipEditDraft(current => ({ ...current, name: event.target.value }))}
                    data-testid="react-edit-ship-name"
                  />
                </label>
                <label>
                  <span>Current port</span>
                  <input
                    value={shipEditDraft.currentPort}
                    onChange={event => setShipEditDraft(current => ({ ...current, currentPort: event.target.value }))}
                    data-testid="react-edit-ship-current-port"
                  />
                </label>
              </div>
              <div className="react-inline-edit-actions ce-action-row">
                <button type="submit" className="fleet-primary-action ce-button-primary" disabled={shipActionId === ship.id} data-testid="react-save-ship-edit">
                  {shipActionId === ship.id ? 'Saving…' : 'Save Ship'}
                </button>
                <button type="button" className="fleet-secondary-action ce-button-secondary" onClick={onCancelShipEdit} data-testid="react-cancel-ship-edit">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </article>
      ))}
    </div>
  )}
</section>

{selectedShipForSailings && (
  <section className="react-sailings-panel" aria-labelledby="react-sailings-heading" data-testid="react-sailings-panel">
    <div className="selected-ships-heading-row">
      <div>
        <p className="eyebrow ce-kicker">Selected ship</p>
        <h3 id="react-sailings-heading">{selectedShipForSailings.name} Sailings</h3>
      </div>
      <span className="selected-ships-count" data-testid="react-sailings-count">{sailings.length} sailings</span>
    </div>

    <form className="react-sailing-create-form ce-editor-card" onSubmit={onCreateSailing} data-testid="react-create-sailing-form">
      <h4>Create Sailing</h4>
      <div className="react-sailing-form-grid">
        <label>
          <span>Departure date</span>
          <input
            value={sailingDraft.departureDate}
            onChange={event => setSailingDraft(current => ({ ...current, departureDate: event.target.value }))}
            placeholder="2026-10-01"
            data-testid="react-create-sailing-departure-date"
          />
        </label>
        <label>
          <span>Departure port</span>
          <input
            value={sailingDraft.departurePort}
            onChange={event => setSailingDraft(current => ({ ...current, departurePort: event.target.value }))}
            placeholder="Miami, Florida"
            data-testid="react-create-sailing-departure-port"
          />
        </label>
        <label>
          <span>Arrival port</span>
          <input
            value={sailingDraft.arrivalPort}
            onChange={event => setSailingDraft(current => ({ ...current, arrivalPort: event.target.value }))}
            placeholder="Nassau, Bahamas"
            data-testid="react-create-sailing-arrival-port"
          />
        </label>
        <label>
          <span>Days</span>
          <input
            value={sailingDraft.days}
            onChange={event => setSailingDraft(current => ({ ...current, days: event.target.value }))}
            placeholder="4"
            data-testid="react-create-sailing-days"
          />
        </label>
        <label className="react-checkbox-label">
          <input
            type="checkbox"
            checked={sailingDraft.isRepositioning}
            onChange={event => setSailingDraft(current => ({ ...current, isRepositioning: event.target.checked }))}
            data-testid="react-create-sailing-repositioning"
          />
          <span>Repositioning sailing</span>
        </label>
      </div>
      <button type="submit" className="fleet-primary-action ce-button-primary" disabled={sailingActionId === 'create'} data-testid="react-create-sailing-submit-button">
        {sailingActionId === 'create' ? 'Creating…' : 'Create Sailing'}
      </button>
    </form>

    {sailingActionMessage && <p className="muted-status ce-muted" role="status" data-testid="react-sailing-action-message">{sailingActionMessage}</p>}

    {sailingsLoading && <p className="muted-status ce-muted">Loading sailings…</p>}
    {sailingsError && <p className="error" role="alert">{sailingsError}</p>}

    {!sailingsLoading && !sailingsError && sailings.length === 0 && (
      <p className="muted-status ce-muted">No sailings found for this ship yet.</p>
    )}

    {sailings.length > 0 && (
      <div className="react-sailing-card-grid" data-testid="react-sailing-card-grid">
        {sailings.map(sailing => (
          <article className="react-sailing-card" key={sailing.id || sailing.departureDate} data-testid="react-sailing-card">
            <h4>{getSailingDateLabel(sailing)}</h4>
            <p><strong>Type:</strong> {getSailingTypeLabel(sailing)}</p>
            <p><strong>Departure Port:</strong> {sailing.departurePort || sailing.port || 'Unavailable'}</p>
            <p><strong>Arrival Port:</strong> {sailing.arrivalPort || sailing.port || 'Unavailable'}</p>
            <p><strong>Length:</strong> {sailing.days || 'Unavailable'} days</p>
            <div className="react-sailing-card-actions">
              <button
                type="button"
                className="fleet-primary-action ce-button-primary"
                onClick={() => onViewItinerary(sailing)}
                data-testid="react-view-itinerary-button"
              >
                View Itinerary
              </button>
              <button
                type="button"
                className="fleet-primary-action ce-button-primary"
                onClick={() => onOpenSailingEdit(sailing)}
                disabled={sailingActionId === sailing.id}
                data-testid="react-update-sailing-button"
              >
                Update Sailing
              </button>
              <button
                type="button"
                className="fleet-danger-action ce-button-danger"
                onClick={() => onRequestDeleteSailing(sailing)}
                disabled={sailingActionId === sailing.id}
                data-testid="react-delete-sailing-button"
              >
                Delete Sailing
              </button>
            </div>
            {activeSailingEditId === sailing.id && (
              <form className="react-inline-edit-form ce-editor-card" onSubmit={event => onUpdateSailing(event, sailing)} data-testid="react-sailing-edit-form">
                <h5>Edit sailing</h5>
                <div className="react-inline-edit-grid four-column-edit-grid">
                  <label>
                    <span>Departure date</span>
                    <input value={sailingEditDraft.departureDate} onChange={event => setSailingEditDraft(current => ({ ...current, departureDate: event.target.value }))} data-testid="react-edit-sailing-departure-date" />
                  </label>
                  <label>
                    <span>Departure port</span>
                    <input value={sailingEditDraft.departurePort} onChange={event => setSailingEditDraft(current => ({ ...current, departurePort: event.target.value }))} data-testid="react-edit-sailing-departure-port" />
                  </label>
                  <label>
                    <span>Arrival port</span>
                    <input value={sailingEditDraft.arrivalPort} onChange={event => setSailingEditDraft(current => ({ ...current, arrivalPort: event.target.value }))} data-testid="react-edit-sailing-arrival-port" />
                  </label>
                  <label>
                    <span>Days</span>
                    <input value={sailingEditDraft.days} onChange={event => setSailingEditDraft(current => ({ ...current, days: event.target.value }))} data-testid="react-edit-sailing-days" />
                  </label>
                  <label className="react-checkbox-label inline-edit-checkbox">
                    <input type="checkbox" checked={sailingEditDraft.isRepositioning} onChange={event => setSailingEditDraft(current => ({ ...current, isRepositioning: event.target.checked }))} data-testid="react-edit-sailing-repositioning" />
                    <span>Repositioning sailing</span>
                  </label>
                </div>
                <div className="react-inline-edit-actions ce-action-row">
                  <button type="submit" className="fleet-primary-action ce-button-primary" disabled={sailingActionId === sailing.id} data-testid="react-save-sailing-edit">
                    {sailingActionId === sailing.id ? 'Saving…' : 'Save Sailing'}
                  </button>
                  <button type="button" className="fleet-secondary-action ce-button-secondary" onClick={onCancelSailingEdit} data-testid="react-cancel-sailing-edit">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>
    )}
  </section>
)}
    </>
  )
}

