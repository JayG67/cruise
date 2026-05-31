export default function ConfirmActionPanel({
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isWorking = false,
  testId = 'react-confirm-action-panel'
}) {
  if (!message) return null

  return (
    <section className="react-confirm-action-panel" role="alertdialog" aria-labelledby={`${testId}-title`} aria-describedby={`${testId}-message`} data-testid={testId}>
      <div>
        <p className="eyebrow">Confirmation required</p>
        <h4 id={`${testId}-title`}>{title}</h4>
        <p id={`${testId}-message`}>{message}</p>
      </div>
      <div className="react-confirm-action-row">
        <button type="button" className="fleet-danger-action" onClick={onConfirm} disabled={isWorking} data-testid={`${testId}-confirm`}>
          {isWorking ? 'Working…' : confirmLabel}
        </button>
        <button type="button" className="fleet-secondary-action" onClick={onCancel} disabled={isWorking} data-testid={`${testId}-cancel`}>
          {cancelLabel}
        </button>
      </div>
    </section>
  )
}
