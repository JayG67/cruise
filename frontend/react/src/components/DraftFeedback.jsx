import { getDraftFeedbackText, getDraftFeedbackTone } from '../domain/draftFeedback.js'

export default function DraftFeedback({ feedback, testId }) {
  const text = getDraftFeedbackText(feedback)

  if (!text) return null

  const tone = getDraftFeedbackTone(feedback)
  const role = tone === 'error' ? 'alert' : 'status'

  return (
    <p className={`draft-message ${tone}`} role={role} data-testid={testId}>
      {text}
    </p>
  )
}
