export function createDraftFeedback(type, text) {
  return {
    type,
    text
  }
}

export function createValidationFeedback(validation, successMessage) {
  if (validation?.isValid) {
    return createDraftFeedback('success', successMessage)
  }

  const text = Object.values(validation?.errors || {})
    .filter(Boolean)
    .join(' ')

  return createDraftFeedback('error', text || 'Draft validation failed.')
}

export function createNoChangesFeedback(entityLabel) {
  return createDraftFeedback('info', `No ${entityLabel} fields changed. Nothing to save.`)
}

export function createSaveUnavailableFeedback(entityLabel) {
  return createDraftFeedback('error', `${entityLabel} changes are not available in the current operating mode.`)
}

export function createSaveSuccessFeedback(fallbackMessage) {
  return createDraftFeedback('success', fallbackMessage)
}

export function createMutationErrorFeedback(error, fallbackMessage) {
  return createDraftFeedback('error', error?.message || fallbackMessage)
}

export function getDraftFeedbackText(feedback) {
  if (!feedback) return ''
  if (typeof feedback === 'string') return feedback

  return feedback.text || ''
}

export function getDraftFeedbackTone(feedback) {
  if (!feedback || typeof feedback === 'string') return 'info'

  return feedback.type || 'info'
}
