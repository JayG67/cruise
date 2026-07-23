import { useEffect, useMemo, useState } from 'react'

import { getPortfolioShowcase } from '../api/client.js'

const STATUS_LABELS = {
  strong: 'Strong',
  watch: 'Watch',
  'needs-polish': 'Needs polish',
  draft: 'Draft'
}

function getPortfolioStatusLabel(status = '') {
  return STATUS_LABELS[status] || status || 'Unknown'
}

function buildPortfolioPriorities(gates = []) {
  return [...gates]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
}

function buildPortfolioEvidenceSummary(showcase = {}) {
  const gates = Array.isArray(showcase.gates) ? showcase.gates : []
  const strongCount = gates.filter(gate => gate.status === 'strong').length
  const watchCount = gates.filter(gate => gate.status === 'watch').length
  const polishCount = gates.filter(gate => gate.status === 'needs-polish').length

  return [
    { label: 'Strong areas', value: strongCount },
    { label: 'Watch items', value: watchCount },
    { label: 'Polish gaps', value: polishCount }
  ]
}

export default function ReactPortfolioPolishCenter({ selectedDemoUser }) {
  const [showcase, setShowcase] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const gates = showcase?.gates || []
  const priorities = useMemo(() => buildPortfolioPriorities(gates), [gates])
  const evidenceSummary = useMemo(() => buildPortfolioEvidenceSummary(showcase || {}), [showcase])

  async function loadShowcase() {
    setIsLoading(true)
    setError('')

    try {
      setShowcase(await getPortfolioShowcase({ selectedDemoUser }))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load portfolio polish readiness.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadShowcase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDemoUser?.id])

  return (
    <section className="react-app-section portfolio-polish-center ce-command-panel" id="react-portfolio-polish" aria-labelledby="react-portfolio-polish-heading" data-testid="react-portfolio-polish-center">
      <div className="section-heading-row ce-section-heading portfolio-polish-heading">
        <div>
          <p className="eyebrow ce-kicker">Portfolio packaging</p>
          <h2 id="react-portfolio-polish-heading">Portfolio Polish Center</h2>
          <p>
            Package Cruise Explorer for recruiters by turning the operational platform into a concise
            story with screenshots, architecture talking points, resume bullets, and launch-ready evidence.
          </p>
        </div>
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={loadShowcase} disabled={isLoading} data-testid="react-portfolio-polish-refresh-button">
          {isLoading ? 'Refreshing...' : 'Refresh portfolio score'}
        </button>
      </div>

      {error ? <p className="draft-message error ce-feedback-message ce-editor-card" role="alert" data-testid="react-portfolio-polish-error">{error}</p> : null}

      <div className="portfolio-polish-scoreboard" data-testid="react-portfolio-polish-scoreboard">
        <article className={`portfolio-polish-score-card ${showcase?.status || 'loading'}`}>
          <span>Portfolio polish</span>
          <strong>{isLoading && !showcase ? 'Loading' : `${showcase?.overallScore ?? 0}%`}</strong>
          <p>{showcase?.summary || 'Checking the portfolio launch story and recruiter package.'}</p>
        </article>
        {evidenceSummary.map(item => (
          <article key={item.label} className="portfolio-polish-score-card ce-command-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.value ? 'Represented in the current package.' : 'No matching items detected yet.'}</p>
          </article>
        ))}
      </div>

      <div className="portfolio-polish-gate-grid" data-testid="react-portfolio-polish-gates">
        {gates.map(gate => (
          <article key={gate.id} className={`portfolio-polish-gate-card ${gate.status}`} data-testid="react-portfolio-polish-gate-card">
            <div className="portfolio-polish-gate-header">
              <div>
                <span>{getPortfolioStatusLabel(gate.status)}</span>
                <h3>{gate.label}</h3>
              </div>
              <strong>{gate.score}%</strong>
            </div>
            <p>{gate.summary}</p>
            <ul aria-label={`${gate.label} evidence`}>
              {(gate.evidence || []).slice(0, 5).map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="portfolio-polish-recommendation">
              <span>Polish recommendation</span>
              <p>{gate.recommendations?.[0] || 'Review this portfolio gate before public launch.'}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="portfolio-polish-priority-panel ce-command-card" data-testid="react-portfolio-polish-priorities">
        <div>
          <p className="eyebrow ce-kicker">Next actions</p>
          <h3>Highest-impact polish priorities</h3>
        </div>
        {priorities.length ? (
          <ol>
            {priorities.map((gate, index) => (
              <li key={gate.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{gate.label}</strong>
                  <p>{gate.recommendations?.[0] || gate.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state compact ce-empty-state ce-editor-card">Portfolio priorities will appear after the first polish check completes.</p>
        )}
      </div>

      <div className="portfolio-polish-showcase-grid">
        <section className="portfolio-polish-list-panel ce-command-card" aria-labelledby="portfolio-screenshot-plan-heading" data-testid="react-portfolio-screenshot-plan">
          <p className="eyebrow ce-kicker">Screenshot plan</p>
          <h3 id="portfolio-screenshot-plan-heading">Recruiter screenshot sequence</h3>
          <ol>
            {(showcase?.screenshotPlan || []).map(item => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.purpose}</p>
                <span>{item.capture}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="portfolio-polish-list-panel ce-command-card" aria-labelledby="portfolio-resume-bullets-heading" data-testid="react-portfolio-resume-bullets">
          <p className="eyebrow ce-kicker">Resume bullets</p>
          <h3 id="portfolio-resume-bullets-heading">Draft resume-ready impact statements</h3>
          <ul>
            {(showcase?.resumeBullets || []).map(item => (
              <li key={item.id}>
                <strong>{getPortfolioStatusLabel(item.confidence)}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="portfolio-polish-showcase-grid">
        <section className="portfolio-polish-list-panel ce-command-card" aria-labelledby="portfolio-interview-points-heading" data-testid="react-portfolio-interview-talking-points">
          <p className="eyebrow ce-kicker">Interview prep</p>
          <h3 id="portfolio-interview-points-heading">Talking points</h3>
          <ul>
            {(showcase?.interviewTalkingPoints || []).map(item => (
              <li key={item.id}>
                <strong>{item.prompt}</strong>
                <p>{item.talkingPoint}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="portfolio-polish-list-panel ce-command-card" aria-labelledby="portfolio-launch-checklist-heading" data-testid="react-portfolio-launch-checklist">
          <p className="eyebrow ce-kicker">Launch checklist</p>
          <h3 id="portfolio-launch-checklist-heading">Portfolio launch sequence</h3>
          <ol>
            {(showcase?.launchChecklist || []).map(item => (
              <li key={`${item.sequence}-${item.gateId}`}>
                <strong>{item.sequence}. {item.title}</strong>
                <p>{item.action}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}

export {
  buildPortfolioEvidenceSummary,
  buildPortfolioPriorities,
  getPortfolioStatusLabel
}
