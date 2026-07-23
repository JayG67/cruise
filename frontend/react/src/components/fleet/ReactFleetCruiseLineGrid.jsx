export default function ReactFleetCruiseLineGrid({
  visibleCruiseLines = [],
  isLoading = false,
  activeCruiseLineEditId = '',
  cruiseLineDraft,
  setCruiseLineDraft,
  updatingCruiseLineId = '',
  deletingCruiseLineId = '',
  onViewShips,
  onOpenCruiseLineEdit,
  onRequestDeleteCruiseLine,
  onUpdateCruiseLine,
  onCancelCruiseLineEdit
}) {
  return (
    <>
      <div className="fleet-card-grid" data-testid="react-fleet-card-grid">
        {visibleCruiseLines.map(cruiseLine => (
          <article className="fleet-card ce-command-card ce-surface-dark" key={cruiseLine.id || cruiseLine.name} data-testid="react-fleet-card">
            <h3>{cruiseLine.name}</h3>
            <p><strong>Country:</strong> {cruiseLine.country || 'Not provided'}</p>
            {cruiseLine.website && (
              <a href={cruiseLine.website} target="_blank" rel="noreferrer">Visit website</a>
            )}
            <dl className="brand-theme-summary ce-surface-dark" data-testid="react-fleet-brand-summary">
              <div>
                <dt>Brand family</dt>
                <dd>{cruiseLine.brandFamily || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Theme</dt>
                <dd>{cruiseLine.brandTheme || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Positioning</dt>
                <dd>{cruiseLine.marketPositioning || 'Not provided'}</dd>
              </div>
            </dl>
            <div className="fleet-card-actions ce-action-row" aria-label={`Actions for ${cruiseLine.name}`}>
              <button
                type="button"
                className="fleet-primary-action ce-button-primary"
                onClick={() => onViewShips(cruiseLine)}
                data-testid="react-view-ships-button"
              >
                View Ships
              </button>
              <button
                type="button"
                className="fleet-primary-action ce-button-primary"
                onClick={() => onOpenCruiseLineEdit(cruiseLine)}
                disabled={updatingCruiseLineId === cruiseLine.id}
                data-testid="react-update-cruise-line-button"
              >
                {updatingCruiseLineId === cruiseLine.id ? 'Updating…' : 'Update'}
              </button>
              <button
                type="button"
                className="fleet-danger-action ce-button-danger"
                onClick={() => onRequestDeleteCruiseLine(cruiseLine)}
                disabled={deletingCruiseLineId === cruiseLine.id}
                data-testid="react-delete-cruise-line-button"
              >
                {deletingCruiseLineId === cruiseLine.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            {activeCruiseLineEditId === cruiseLine.id && (
              <form className="react-inline-edit-form ce-editor-card" onSubmit={event => onUpdateCruiseLine(event, cruiseLine)} data-testid="react-cruise-line-edit-form">
                <h4>Edit cruise line</h4>
                <div className="react-inline-edit-grid cruise-line-brand-edit-grid">
                  <label>
                    <span>Cruise line name</span>
                    <input
                      value={cruiseLineDraft.name}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, name: event.target.value }))}
                      data-testid="react-edit-cruise-line-name"
                    />
                  </label>
                  <label>
                    <span>Country</span>
                    <input
                      value={cruiseLineDraft.country}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, country: event.target.value }))}
                      data-testid="react-edit-cruise-line-country"
                    />
                  </label>
                  <label>
                    <span>Website</span>
                    <input
                      value={cruiseLineDraft.website}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, website: event.target.value }))}
                      data-testid="react-edit-cruise-line-website"
                    />
                  </label>
                  <label>
                    <span>Brand family</span>
                    <input
                      value={cruiseLineDraft.brandFamily}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, brandFamily: event.target.value }))}
                      data-testid="react-edit-cruise-line-brand-family"
                    />
                  </label>
                  <label>
                    <span>Brand theme</span>
                    <input
                      value={cruiseLineDraft.brandTheme}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, brandTheme: event.target.value }))}
                      data-testid="react-edit-cruise-line-brand-theme"
                    />
                  </label>
                  <label className="wide-inline-field">
                    <span>Market positioning</span>
                    <input
                      value={cruiseLineDraft.marketPositioning}
                      onChange={event => setCruiseLineDraft(current => ({ ...current, marketPositioning: event.target.value }))}
                      data-testid="react-edit-cruise-line-market-positioning"
                    />
                  </label>
                </div>
                <div className="react-inline-edit-actions ce-action-row">
                  <button type="submit" className="fleet-primary-action ce-button-primary" disabled={updatingCruiseLineId === cruiseLine.id} data-testid="react-save-cruise-line-edit">
                    {updatingCruiseLineId === cruiseLine.id ? 'Saving…' : 'Save Cruise Line'}
                  </button>
                  <button type="button" className="fleet-secondary-action ce-button-secondary" onClick={onCancelCruiseLineEdit} data-testid="react-cancel-cruise-line-edit">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </div>

      {visibleCruiseLines.length === 0 && !isLoading && (
        <p className="muted-status ce-muted" data-testid="react-fleet-empty-state">No cruise lines match the current search.</p>
      )}
    </>
  )
}
