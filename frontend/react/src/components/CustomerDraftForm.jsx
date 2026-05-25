import { customerDraftFields } from '../domain/customerDraftFormFields.js'

export default function CustomerDraftForm({ draft, message, onUpdate, onValidate, onSave, isSaving, onCancel }) {
  return (
    <form className="draft-editor" aria-label={`Edit draft for ${draft.firstName} ${draft.lastName}`} data-testid="react-customer-draft-form" onSubmit={event => event.preventDefault()}>
      <div className="draft-grid">
        {customerDraftFields.map(field => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input
              value={draft[field.name] || ''}
              autoComplete={field.autoComplete}
              onChange={event => onUpdate(field.name, event.target.value)}
              data-testid={`react-customer-draft-${field.name}`}
            />
          </label>
        ))}
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onValidate} data-testid="react-validate-customer-draft">
          Validate draft
        </button>
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving} data-testid="react-save-customer-draft">
          {isSaving ? 'Saving draft…' : 'Save draft'}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel} data-testid="react-cancel-customer-draft">
          Cancel
        </button>
      </div>
      {message && <p className="draft-message" role="status">{message}</p>}
    </form>
  )
}
