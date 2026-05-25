export default function BookingDraftForm({ draft, message, onUpdate, onValidate, onSave, isSaving, onCancel }) {
  return (
    <form className="draft-editor booking-draft-editor" aria-label={`Edit booking draft for ${draft.id}`} data-testid="react-booking-draft-form" onSubmit={event => event.preventDefault()}>
      <div className="draft-grid">
        <label>
          <span>Status</span>
          <input value={draft.bookingStatus} onChange={event => onUpdate('bookingStatus', event.target.value)} />
        </label>
        <label>
          <span>Cabin</span>
          <input value={draft.cabinNumber} onChange={event => onUpdate('cabinNumber', event.target.value)} />
        </label>
        <label>
          <span>Fare code</span>
          <input value={draft.fareCode} onChange={event => onUpdate('fareCode', event.target.value)} />
        </label>
        <label>
          <span>Embarkation port</span>
          <input value={draft.embarkationPort} onChange={event => onUpdate('embarkationPort', event.target.value)} />
        </label>
        <label>
          <span>Debarkation port</span>
          <input value={draft.debarkationPort} onChange={event => onUpdate('debarkationPort', event.target.value)} />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onValidate} data-testid="react-validate-booking-draft">
          Validate booking draft
        </button>
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving} data-testid="react-save-booking-draft">
          {isSaving ? 'Saving booking draft…' : 'Save booking draft'}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {message && <p className="draft-message" role="status">{message}</p>}
    </form>
  )
}
