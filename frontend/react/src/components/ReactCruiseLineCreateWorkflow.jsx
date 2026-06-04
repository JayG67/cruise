import useCruiseLineCreateWorkflow from '../hooks/useCruiseLineCreateWorkflow.js'

export default function ReactCruiseLineCreateWorkflow({ onCreated }) {
  const {
    draft,
    isSaving,
    message,
    updateField,
    updateShip,
    addShipRow,
    removeShipRow,
    save,
    reset
  } = useCruiseLineCreateWorkflow({ onCreated })

  return (
    <section className="react-create-workflow-section" id="react-create-cruise-line" aria-labelledby="react-create-heading" data-testid="react-create-cruise-line-workflow">
      <p className="eyebrow">Create workflow</p>
      <h2 id="react-create-heading">Add New Cruise Data</h2>
      <p>Create a new cruise line and optionally add starter ships in a single workflow.</p>

      <div className="react-create-card">
        <div className="react-create-card-heading">
          <div>
            <p className="eyebrow">Create workflow</p>
            <h3>Add a Cruise Line</h3>
            <p>Create a cruise line and add starter ships in one focused workflow.</p>
          </div>
          <span className="create-workflow-pill">Create Workflow</span>
        </div>

        <div className="react-create-form-grid">
          <fieldset>
            <legend><span>1</span> Cruise Line Details</legend>
            <p>Name is required. Country, website, brand family, theme, and positioning are stored in the database and managed through this form.</p>

            <label>
              <span>Cruise line name <strong aria-hidden="true">*</strong></span>
              <input
                value={draft.name}
                onChange={event => updateField('name', event.target.value)}
                placeholder="Holland America Line"
                required
                data-testid="react-create-cruise-line-name"
              />
            </label>

            <label>
              <span>Country</span>
              <input
                value={draft.country}
                onChange={event => updateField('country', event.target.value)}
                placeholder="United States"
                data-testid="react-create-cruise-line-country"
              />
            </label>

            <label>
              <span>Website</span>
              <input
                value={draft.website}
                onChange={event => updateField('website', event.target.value)}
                placeholder="https://www.hollandamerica.com"
                data-testid="react-create-cruise-line-website"
              />
            </label>

            <label>
              <span>Brand family</span>
              <input
                value={draft.brandFamily}
                onChange={event => updateField('brandFamily', event.target.value)}
                placeholder="Carnival Corporation & plc"
                data-testid="react-create-cruise-line-brand-family"
              />
            </label>

            <label>
              <span>Brand theme</span>
              <input
                value={draft.brandTheme}
                onChange={event => updateField('brandTheme', event.target.value)}
                placeholder="Premium destination"
                data-testid="react-create-cruise-line-brand-theme"
              />
            </label>

            <label>
              <span>Market positioning</span>
              <input
                value={draft.marketPositioning}
                onChange={event => updateField('marketPositioning', event.target.value)}
                placeholder="Premium destination-led cruising with polished service"
                data-testid="react-create-cruise-line-market-positioning"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend><span>2</span> Starter Ships</legend>
            <p>Add ships now, or leave this blank and add ships later.</p>

            {draft.ships.map((ship, index) => (
              <div className="react-ship-row" key={`react-ship-row-${index}`}>
                <label>
                  <span>Ship name</span>
                  <input
                    value={ship.name}
                    onChange={event => updateShip(index, 'name', event.target.value)}
                    placeholder="Rotterdam"
                    data-testid="react-create-ship-name"
                  />
                </label>
                <label>
                  <span>Current port</span>
                  <input
                    value={ship.currentPort}
                    onChange={event => updateShip(index, 'currentPort', event.target.value)}
                    placeholder="Fort Lauderdale"
                    data-testid="react-create-ship-port"
                  />
                </label>
                <button type="button" className="secondary-button" onClick={() => removeShipRow(index)} data-testid="react-remove-ship-row">
                  Remove Ship
                </button>
              </div>
            ))}

            <button type="button" className="secondary-button add-ship-button" onClick={addShipRow} data-testid="react-add-ship-row">
              + Add Ship
            </button>
          </fieldset>
        </div>

        <div className="react-create-actions">
          <button type="button" className="primary-action-button" onClick={save} disabled={isSaving} data-testid="react-save-cruise-line">
            {isSaving ? 'Creating…' : 'Create Cruise Line'}
          </button>
          <button type="button" className="secondary-button" onClick={reset} data-testid="react-reset-cruise-line">
            Reset
          </button>
          <p className="result-summary" role="status" data-testid="react-create-cruise-line-message">
            {message || 'Ready to create cruise line data.'}
          </p>
        </div>
      </div>
    </section>
  )
}
