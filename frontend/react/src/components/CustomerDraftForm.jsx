export default function CustomerDraftForm({ draft, message, onUpdate, onValidate, onSave, isSaving, onCancel }) {
  return (
    <form className="draft-editor" aria-label={`Edit draft for ${draft.firstName} ${draft.lastName}`} onSubmit={event => event.preventDefault()}>
      <div className="draft-grid">
        <label>
          <span>First name</span>
          <input value={draft.firstName} onChange={event => onUpdate('firstName', event.target.value)} />
        </label>
        <label>
          <span>Last name</span>
          <input value={draft.lastName} onChange={event => onUpdate('lastName', event.target.value)} />
        </label>
        <label>
          <span>Email</span>
          <input value={draft.email} onChange={event => onUpdate('email', event.target.value)} />
        </label>
        <label>
          <span>Phone</span>
          <input value={draft.phone} onChange={event => onUpdate('phone', event.target.value)} />
        </label>
        <label>
          <span>Loyalty number</span>
          <input value={draft.loyaltyNumber} onChange={event => onUpdate('loyaltyNumber', event.target.value)} />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onValidate} data-testid="react-validate-customer-draft">
          Validate draft
        </button>
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving} data-testid="react-save-customer-draft">
          {isSaving ? 'Saving draft…' : 'Save draft'}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {message && <p className="draft-message" role="status">{message}</p>}
    </form>
  )
}
