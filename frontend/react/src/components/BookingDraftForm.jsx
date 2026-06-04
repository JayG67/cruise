import DraftFeedback from './DraftFeedback.jsx'
import { bookingDraftFields } from '../domain/bookingDraftFormFields.js'

export default function BookingDraftForm({ draft, message, onUpdate, onValidate, onSave, isSaving, onCancel }) {
  return (
    <form className="draft-editor booking-draft-editor" aria-label={`Edit booking draft for ${draft.id}`} data-testid="react-booking-draft-form" onSubmit={event => event.preventDefault()}>
      <div className="draft-grid">
        {bookingDraftFields.map(field => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input
              value={draft[field.name] || ''}
              type={field.type || 'text'}
              autoComplete={field.autoComplete || 'off'}
              required={field.required}
              aria-required={field.required ? 'true' : undefined}
              onChange={event => onUpdate(field.name, event.target.value)}
              data-testid={`react-booking-draft-${field.name}`}
            />
          </label>
        ))}
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onValidate} data-testid="react-validate-booking-draft">
          Validate booking draft
        </button>
        <button type="button" className="primary-button" onClick={onSave} disabled={isSaving} data-testid="react-save-booking-draft">
          {isSaving ? 'Saving booking draft…' : 'Save booking draft'}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel} data-testid="react-cancel-booking-draft">
          Cancel
        </button>
      </div>
      <DraftFeedback feedback={message} testId="react-booking-draft-feedback" />
    </form>
  )
}
