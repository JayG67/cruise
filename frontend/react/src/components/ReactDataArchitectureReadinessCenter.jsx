import { useEffect, useMemo, useState } from 'react'

import { getDataArchitectureReadiness } from '../api/client.js'

const STATUS_LABELS = {
  ready: 'Ready',
  watch: 'Watch',
  'needs-hardening': 'Needs hardening'
}

function getStatusLabel(status = '') {
  return STATUS_LABELS[status] || status || 'Unknown'
}

function buildPriorityPlan(gates = []) {
  return [...gates]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((gate, index) => ({
      ...gate,
      sequence: index + 1,
      action: gate.recommendations?.[0] || 'Review this architecture gate before production hardening.'
    }))
}

export default function ReactDataArchitectureReadinessCenter({ selectedDemoUser }) {
  const [readiness, setReadiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const priorityPlan = useMemo(() => buildPriorityPlan(readiness?.gates || []), [readiness])
  const blockers = useMemo(() => (readiness?.gates || []).filter(gate => gate.status === 'needs-hardening'), [readiness])
  const watchItems = useMemo(() => (readiness?.gates || []).filter(gate => gate.status === 'watch'), [readiness])
  const migrationBacklog = readiness?.migrationBacklog || []
  const migrationTimeline = readiness?.migrationTimeline || []
  const riskRegister = readiness?.riskRegister || []

  async function loadReadiness() {
    setIsLoading(true)
    setError('')

    try {
      setReadiness(await getDataArchitectureReadiness({ selectedDemoUser }))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load data architecture readiness.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReadiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDemoUser?.id])

  return (
    <section className="react-app-section data-architecture-readiness-center ce-command-panel" id="react-data-architecture" aria-labelledby="react-data-architecture-heading" data-testid="react-data-architecture-readiness-center">
      <div className="section-heading-row ce-section-heading data-architecture-heading">
        <div>
          <p className="eyebrow ce-kicker">Production architecture</p>
          <h2 id="react-data-architecture-heading">Data Architecture Hardening Center</h2>
          <p>
            Track the migration path from portfolio data structures to production-safe identity,
            timestamp, role, status, audit, and tenant-boundary patterns.
          </p>
        </div>
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={loadReadiness} disabled={isLoading} data-testid="react-data-architecture-refresh-button">
          {isLoading ? 'Refreshing...' : 'Refresh architecture score'}
        </button>
      </div>

      {error ? <p className="draft-message error ce-feedback-message ce-editor-card" role="alert" data-testid="react-data-architecture-error">{error}</p> : null}

      <div className="data-architecture-scoreboard" data-testid="react-data-architecture-scoreboard">
        <article className={`data-architecture-score-card ce-command-card ${readiness?.status || 'loading'}`}>
          <span>Overall readiness</span>
          <strong>{isLoading && !readiness ? 'Loading' : `${readiness?.overallScore ?? 0}%`}</strong>
          <p>{readiness?.summary || 'Checking production architecture gates against the current live dataset.'}</p>
        </article>
        <article className="data-architecture-score-card ce-command-card">
          <span>Hardening blockers</span>
          <strong>{blockers.length}</strong>
          <p>{blockers.length ? 'Resolve before production deployment.' : 'No hard blockers currently detected.'}</p>
        </article>
        <article className="data-architecture-score-card ce-command-card">
          <span>Watch items</span>
          <strong>{watchItems.length}</strong>
          <p>{watchItems.length ? 'Plan these during the hardening phase.' : 'No watch items currently detected.'}</p>
        </article>
      </div>

      <div className="data-architecture-gate-grid" data-testid="react-data-architecture-gates">
        {(readiness?.gates || []).map(gate => (
          <article key={gate.id} className={`data-architecture-gate-card ce-command-card ${gate.status}`} data-testid="react-data-architecture-gate-card">
            <div className="data-architecture-gate-header">
              <div>
                <span>{getStatusLabel(gate.status)}</span>
                <h3>{gate.label}</h3>
              </div>
              <strong>{gate.score}%</strong>
            </div>
            <p>{gate.summary}</p>
            <ul aria-label={`${gate.label} evidence`}>
              {(gate.evidence || []).slice(0, 4).map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="data-architecture-recommendation ce-editor-card">
              <span>Recommended next move</span>
              <p>{gate.recommendations?.[0] || 'Review this gate during production hardening.'}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="data-architecture-priority-plan ce-command-card" data-testid="react-data-architecture-priority-plan">
        <div>
          <p className="eyebrow ce-kicker">Hardening sequence</p>
          <h3>Next three architecture moves</h3>
        </div>
        {priorityPlan.length ? (
          <ol>
            {priorityPlan.map(item => (
              <li key={item.id}>
                <span>{item.sequence}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.action}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state compact ce-empty-state ce-editor-card">Architecture readiness will appear after the first live check completes.</p>
        )}
      </div>

      <div className="data-architecture-migration-board ce-command-card" data-testid="react-data-architecture-migration-board">
        <div className="data-architecture-migration-header">
          <div>
            <p className="eyebrow ce-kicker">Migration control</p>
            <h3>Actual data hardening backlog</h3>
            <p>Translate readiness findings into implementation-ready schema, API, validation, and audit workstreams.</p>
          </div>
          <strong>{migrationBacklog.length} workstreams</strong>
        </div>
        <div className="data-architecture-migration-grid">
          {migrationBacklog.slice(0, 6).map(item => (
            <article key={item.id} className={`data-architecture-migration-card ${item.status}`} data-testid="react-data-architecture-migration-card">
              <div>
                <span>Phase {item.sequence} · {item.phase}</span>
                <h4>{item.title}</h4>
              </div>
              <dl>
                <div><dt>Owner</dt><dd>{item.owner}</dd></div>
                <div><dt>Effort</dt><dd>{item.effort}</dd></div>
                <div><dt>Risk</dt><dd>{item.risk}</dd></div>
              </dl>
              <p><strong>Migration:</strong> {item.migration}</p>
              <p><strong>Acceptance:</strong> {item.acceptance}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="data-architecture-timeline-risk">
        <section className="data-architecture-timeline ce-command-card" aria-labelledby="react-data-architecture-timeline-heading" data-testid="react-data-architecture-timeline">
          <p className="eyebrow ce-kicker">Migration phases</p>
          <h3 id="react-data-architecture-timeline-heading">Hardening timeline</h3>
          <ol>
            {migrationTimeline.map(phase => (
              <li key={phase.phase} className={phase.status}>
                <span>{phase.sequence}</span>
                <div>
                  <strong>{phase.phase}</strong>
                  <p>{phase.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="data-architecture-risk-register ce-command-card" aria-labelledby="react-data-architecture-risk-heading" data-testid="react-data-architecture-risk-register">
          <p className="eyebrow ce-kicker">Risk register</p>
          <h3 id="react-data-architecture-risk-heading">Migration risks to control</h3>
          {riskRegister.length ? (
            <ul>
              {riskRegister.map(risk => (
                <li key={risk.id} className={risk.severity}>
                  <strong>{risk.title}</strong>
                  <p>{risk.mitigation}</p>
                  <small>{risk.validation}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state compact ce-empty-state ce-editor-card">No high-risk migration issues are currently detected.</p>
          )}
        </section>
      </div>

      <details className="data-architecture-roadmap ce-command-card" data-testid="react-data-architecture-roadmap">
        <summary>Show production data hardening roadmap</summary>
        <ul>
          {(readiness?.roadmap || []).map(item => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  )
}

export { buildPriorityPlan, getStatusLabel }
