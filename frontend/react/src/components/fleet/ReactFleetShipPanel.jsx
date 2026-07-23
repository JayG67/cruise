import { getCurrentPortLabel } from './fleetDirectoryUtils.js'

export default function ReactFleetShipPanel({
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
  onCreateShip,
  onViewSailings,
  onOpenShipEdit,
  onRequestDeleteShip,
  onUpdateShip,
  onCancelShipEdit
}) {
  return (
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
  )
}
