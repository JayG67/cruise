import { useEffect, useState } from 'react'
import useAiTurnaroundBriefing from '../../hooks/useAiTurnaroundBriefing.js'

const DEFAULT_QUESTION = 'What could delay departure, what requires immediate attention, and what should each department do next?'
const REVIEW_OPTIONS = [
  ['ACCEPTED', 'Accept'],
  ['NEEDS_REVISION', 'Needs revision'],
  ['REJECTED', 'Reject']
]

function formatDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export default function AiTurnaroundBriefingWorkspace({ selectedOperation, selectedDemoUser }) {
  const operationId = selectedOperation?.id || ''
  const [question, setQuestion] = useState(DEFAULT_QUESTION)
  const [reviewDisposition, setReviewDisposition] = useState('ACCEPTED')
  const [reviewNotes, setReviewNotes] = useState('')
  const {
    history,
    currentBriefing,
    setCurrentBriefing,
    isLoadingHistory,
    isGenerating,
    reviewingBriefingId,
    error,
    status,
    generateBriefing,
    reviewBriefing
  } = useAiTurnaroundBriefing({ operationId, selectedDemoUser, enabled: Boolean(operationId) })

  useEffect(() => {
    setReviewDisposition(currentBriefing?.review?.disposition || 'ACCEPTED')
    setReviewNotes(currentBriefing?.review?.notes || '')
  }, [currentBriefing?.briefingId])

  if (!selectedOperation) return null

  const briefing = currentBriefing?.briefing
  const findings = Array.isArray(briefing?.findings) ? briefing.findings : []
  const unknowns = Array.isArray(briefing?.unknowns) ? briefing.unknowns : []

  async function submitReview(event) {
    event.preventDefault()
    const saved = await reviewBriefing(currentBriefing.briefingId, reviewDisposition, reviewNotes)
    if (saved) setReviewNotes('')
  }

  return (
    <section className="ai-briefing-workspace ce-command-panel" aria-labelledby="ai-briefing-heading" data-testid="react-ai-briefing-workspace">
      <div className="ai-briefing-header">
        <div>
          <p className="eyebrow ce-kicker">Phase 2 AI workspace</p>
          <h3 id="ai-briefing-heading">Turnaround briefing</h3>
          <p>Generate an evidence-grounded briefing for {selectedOperation.title} without sending raw operational evidence from the browser.</p>
        </div>
        <div className="ai-briefing-operation-summary ce-command-card">
          <strong>{selectedOperation.shipName}</strong>
          <span>{selectedOperation.port || selectedOperation.arrivalPort}</span>
          <span>{selectedOperation.readinessLevel}</span>
        </div>
      </div>

      <form className="ai-briefing-generator ce-editor-card ce-surface-light" onSubmit={event => { event.preventDefault(); generateBriefing(question) }}>
        <label>
          <span>Briefing question</span>
          <textarea value={question} onChange={event => setQuestion(event.target.value)} rows="3" maxLength="500" data-testid="react-ai-briefing-question" />
        </label>
        <div className="ai-briefing-actions">
          <button type="submit" className="primary-action-button ce-button-primary" disabled={isGenerating || !question.trim()} data-testid="react-ai-briefing-generate">
            {isGenerating ? 'Generating briefing…' : currentBriefing ? 'Regenerate briefing' : 'Generate briefing'}
          </button>
          <span>{question.length}/500</span>
        </div>
      </form>

      {status && <p className="success-message" role="status">{status}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="ai-briefing-layout">
        <aside className="ai-briefing-history ce-command-card" aria-label="AI briefing history" data-testid="react-ai-briefing-history">
          <div className="ai-briefing-section-heading">
            <h4>Briefing history</h4>
            <span>{history.length}</span>
          </div>
          {isLoadingHistory && <p>Loading briefing history…</p>}
          {!isLoadingHistory && history.length === 0 && <p>No briefings have been generated for this operation.</p>}
          {history.map(item => (
            <button
              type="button"
              key={item.briefingId}
              className={item.briefingId === currentBriefing?.briefingId ? 'ai-history-item is-selected' : 'ai-history-item'}
              data-testid="react-ai-briefing-history-item"
              onClick={() => setCurrentBriefing(item)}
            >
              <strong>{item.briefing?.riskLevel || 'unknown'} risk</strong>
              <span>{formatDate(item.generatedAt)}</span>
              <span>{item.review?.disposition ? item.review.disposition.replaceAll('_', ' ') : 'Not reviewed'}</span>
            </button>
          ))}
        </aside>

        <div className="ai-briefing-result ce-command-card" data-testid="react-ai-briefing-result">
          {!briefing && <p>Generate or select a briefing to review the operational summary, findings, and evidence references.</p>}
          {briefing && (
            <>
              <div className="ai-briefing-section-heading">
                <div>
                  <p className="eyebrow ce-kicker">Generated {formatDate(currentBriefing.generatedAt || briefing.generatedAt)}</p>
                  <h4>{briefing.riskLevel || 'Unknown'} operational risk</h4>
                </div>
                <span className={`ai-risk-badge ai-risk-${String(briefing.riskLevel || 'unknown').toLowerCase()}`}>{briefing.riskLevel || 'unknown'}</span>
              </div>
              <p className="ai-briefing-summary">{briefing.summary}</p>

              <section aria-labelledby="ai-findings-heading">
                <h5 id="ai-findings-heading">Evidence-backed findings</h5>
                {findings.length === 0 && <p>No findings were returned.</p>}
                <div className="ai-finding-list">
                  {findings.map((finding, index) => (
                    <article className="ai-finding-card ce-surface-light" key={`${finding.title}-${index}`}>
                      <div className="ai-finding-title-row">
                        <strong>{finding.title}</strong>
                        <span>{finding.severity}</span>
                      </div>
                      <p>{finding.explanation}</p>
                      <p><strong>Recommended action:</strong> {finding.recommendedAction}</p>
                      <p className="ai-evidence-ids"><strong>Evidence:</strong> {(finding.evidenceIds || []).join(', ') || 'No evidence references'}</p>
                    </article>
                  ))}
                </div>
              </section>

              {unknowns.length > 0 && (
                <section>
                  <h5>Unknowns requiring confirmation</h5>
                  <ul>{unknowns.map((unknown, index) => <li key={`${unknown}-${index}`}>{unknown}</li>)}</ul>
                </section>
              )}

              {currentBriefing.evidenceSummary && (
                <dl className="ai-evidence-summary">
                  <div><dt>Evidence included</dt><dd>{currentBriefing.evidenceSummary.included || 0}</dd></div>
                  <div><dt>Evidence available</dt><dd>{currentBriefing.evidenceSummary.totalAvailable || 0}</dd></div>
                  <div><dt>Truncated</dt><dd>{currentBriefing.evidenceSummary.truncated ? 'Yes' : 'No'}</dd></div>
                </dl>
              )}

              <form className="ai-review-form ce-editor-card ce-surface-light" onSubmit={submitReview}>
                <h5>Human review</h5>
                <label>
                  <span>Disposition</span>
                  <select value={reviewDisposition} onChange={event => setReviewDisposition(event.target.value)} data-testid="react-ai-briefing-review-disposition">
                    {REVIEW_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Review notes</span>
                  <textarea value={reviewNotes} onChange={event => setReviewNotes(event.target.value)} rows="3" maxLength="1000" data-testid="react-ai-briefing-review-notes" />
                </label>
                <button type="submit" className="secondary-action-button ce-button-secondary" disabled={reviewingBriefingId === currentBriefing.briefingId} data-testid="react-ai-briefing-save-review">
                  {reviewingBriefingId === currentBriefing.briefingId ? 'Saving review…' : 'Save review'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
