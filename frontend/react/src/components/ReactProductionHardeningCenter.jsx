import { useEffect, useMemo, useState } from 'react'

import { getProductionHardeningReadiness } from '../api/client.js'

const STATUS_LABELS = {
  ready: 'Ready',
  watch: 'Watch',
  'needs-hardening': 'Needs hardening'
}

function getProductionHardeningStatusLabel(status = '') {
  return STATUS_LABELS[status] || status || 'Unknown'
}

function buildLaunchBlockers(gates = []) {
  return gates.filter(gate => gate.status === 'needs-hardening')
}

function buildLaunchWatchlist(gates = []) {
  return gates.filter(gate => gate.status === 'watch')
}

function buildHardeningPriorityPlan(gates = []) {
  return [...gates]
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((gate, index) => ({
      ...gate,
      sequence: index + 1,
      action: gate.recommendations?.[0] || 'Review this production-hardening gate before deployment.'
    }))
}

export default function ReactProductionHardeningCenter({ selectedDemoUser }) {
  const [readiness, setReadiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const blockers = useMemo(() => buildLaunchBlockers(readiness?.gates || []), [readiness])
  const watchlist = useMemo(() => buildLaunchWatchlist(readiness?.gates || []), [readiness])
  const priorityPlan = useMemo(() => buildHardeningPriorityPlan(readiness?.gates || []), [readiness])

  async function loadReadiness() {
    setIsLoading(true)
    setError('')

    try {
      setReadiness(await getProductionHardeningReadiness({ selectedDemoUser }))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load production hardening readiness.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReadiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDemoUser?.id])

  return (
    <section className="react-app-section production-hardening-center" id="react-production-hardening" aria-labelledby="react-production-hardening-heading" data-testid="react-production-hardening-center">
      <div className="section-heading-row production-hardening-heading">
        <div>
          <p className="eyebrow">Production readiness</p>
          <h2 id="react-production-hardening-heading">Production Hardening Center</h2>
          <p>
            Convert the portfolio application into a deployable operations product by tracking environment,
            error handling, logging, observability, deployment, and security readiness gates.
          </p>
        </div>
        <button type="button" className="secondary-action-button" onClick={loadReadiness} disabled={isLoading} data-testid="react-production-hardening-refresh-button">
          {isLoading ? 'Refreshing...' : 'Refresh hardening score'}
        </button>
      </div>

      {error ? <p className="draft-message error" role="alert" data-testid="react-production-hardening-error">{error}</p> : null}

      <div className="production-hardening-scoreboard" data-testid="react-production-hardening-scoreboard">
        <article className={`production-hardening-score-card ${readiness?.status || 'loading'}`}>
          <span>Overall hardening</span>
          <strong>{isLoading && !readiness ? 'Loading' : `${readiness?.overallScore ?? 0}%`}</strong>
          <p>{readiness?.summary || 'Checking production hardening gates against the current project baseline.'}</p>
        </article>
        <article className="production-hardening-score-card">
          <span>Launch blockers</span>
          <strong>{blockers.length}</strong>
          <p>{blockers.length ? 'Resolve these before deployment.' : 'No production blockers detected.'}</p>
        </article>
        <article className="production-hardening-score-card">
          <span>Watchlist</span>
          <strong>{watchlist.length}</strong>
          <p>{watchlist.length ? 'Track during platform selection.' : 'No hardening watch items detected.'}</p>
        </article>
      </div>

      <div className="production-hardening-gate-grid" data-testid="react-production-hardening-gates">
        {(readiness?.gates || []).map(gate => (
          <article key={gate.id} className={`production-hardening-gate-card ${gate.status}`} data-testid="react-production-hardening-gate-card">
            <div className="production-hardening-gate-header">
              <div>
                <span>{getProductionHardeningStatusLabel(gate.status)}</span>
                <h3>{gate.label}</h3>
              </div>
              <strong>{gate.score}%</strong>
            </div>
            <p>{gate.summary}</p>
            <ul aria-label={`${gate.label} evidence`}>
              {(gate.evidence || []).slice(0, 5).map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="production-hardening-recommendation">
              <span>Recommended hardening move</span>
              <p>{gate.recommendations?.[0] || 'Review this gate before deployment.'}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="production-hardening-priority-plan" data-testid="react-production-hardening-priority-plan">
        <div>
          <p className="eyebrow">Launch sequence</p>
          <h3>Next hardening moves</h3>
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
          <p className="empty-state compact">Production hardening readiness will appear after the first live check completes.</p>
        )}
      </div>

      <details className="production-hardening-launch-sequence" data-testid="react-production-hardening-launch-sequence">
        <summary>Show launch hardening sequence</summary>
        <ul>
          {(readiness?.launchSequence || []).map(item => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  )
}

export {
  buildHardeningPriorityPlan,
  buildLaunchBlockers,
  buildLaunchWatchlist,
  getProductionHardeningStatusLabel
}
