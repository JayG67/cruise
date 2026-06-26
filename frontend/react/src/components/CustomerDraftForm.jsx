import DraftFeedback from './DraftFeedback.jsx'
import { customerDraftFields } from '../domain/customerDraftFormFields.js'

export default function CustomerDraftForm({ draft, message, onUpdate, onValidate, onSave, isSaving, onCancel }) {
  return (
    <form className="draft-editor ce-editor-card" aria-label={`Edit draft for ${draft.firstName} ${draft.lastName}`} data-testid="react-customer-draft-form" onSubmit={event => event.preventDefault()}>
      <div className="draft-grid ce-field-grid">
        {customerDraftFields.map(field => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input
              value={draft[field.name] || ''}
              type={field.type || 'text'}
              autoComplete={field.autoComplete}
              required={field.required}
              aria-required={field.required ? 'true' : undefined}
              onChange={event => onUpdate(field.name, event.target.value)}
              data-testid={`react-customer-draft-${field.name}`}
            />
          </label>
        ))}
      </div>
      <div className="button-row ce-action-row">
        <button type="button" className="secondary-button ce-button-secondary" onClick={onValidate} data-testid="react-validate-customer-draft">
          Validate draft
        </button>
        <button type="button" className="primary-button ce-button-primary" onClick={onSave} disabled={isSaving} data-testid="react-save-customer-draft">
          {isSaving ? 'Saving draft…' : 'Save draft'}
        </button>
        <button type="button" className="secondary-button ce-button-secondary" onClick={onCancel} data-testid="react-cancel-customer-draft">
          Cancel
        </button>
      </div>
      <DraftFeedback feedback={message} testId="react-customer-draft-feedback" />
    </form>
  )
}
