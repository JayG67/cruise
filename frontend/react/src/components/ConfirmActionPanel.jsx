import { createPortal } from 'react-dom'

export default function ConfirmActionPanel({
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isWorking = false,
  testId = 'react-confirm-action-panel',
  variant = 'inline'
}) {
  if (!message) return null

  const isModal = variant === 'modal'
  const panel = (
    <section className={`react-confirm-action-panel ce-editor-card ${isModal ? 'react-confirm-action-panel--modal' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby={`${testId}-title`} aria-describedby={`${testId}-message`} data-testid={testId}>
      <div>
        <p className="eyebrow ce-kicker">Confirmation required</p>
        <h4 id={`${testId}-title`}>{title}</h4>
        <p id={`${testId}-message`}>{message}</p>
      </div>
      <div className="react-confirm-action-row ce-action-row">
        <button type="button" className="fleet-danger-action ce-button-danger" onClick={onConfirm} disabled={isWorking} data-testid={`${testId}-confirm`}>
          {isWorking ? 'Working…' : confirmLabel}
        </button>
        <button type="button" className="fleet-secondary-action ce-button-secondary" onClick={onCancel} disabled={isWorking} data-testid={`${testId}-cancel`}>
          {cancelLabel}
        </button>
      </div>
    </section>
  )

  if (!isModal) {
    return panel
  }

  return createPortal(
    <div className="react-confirm-action-overlay" data-testid={`${testId}-overlay`}>
      {panel}
    </div>,
    document.body
  )
}

