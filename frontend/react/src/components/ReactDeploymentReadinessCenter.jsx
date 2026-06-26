import { useEffect, useMemo, useState } from 'react'

import { getDeploymentReadiness } from '../api/client.js'

const STATUS_LABELS = {
  ready: 'Ready',
  watch: 'Watch',
  'needs-work': 'Needs work',
  configured: 'Configured',
  candidate: 'Candidate'
}

function getDeploymentStatusLabel(status = '') {
  return STATUS_LABELS[status] || status || 'Unknown'
}

function buildDeploymentBlockers(gates = []) {
  return gates.filter(gate => gate.status === 'needs-work')
}

function buildDeploymentWatchlist(gates = []) {
  return gates.filter(gate => gate.status === 'watch')
}

function buildDeploymentActionPlan(launchPlan = [], gates = []) {
  if (Array.isArray(launchPlan) && launchPlan.length) {
    return launchPlan.slice(0, 5)
  }

  return [...gates]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((gate, index) => ({
      sequence: index + 1,
      gateId: gate.id,
      title: gate.label,
      status: gate.status,
      action: gate.recommendations?.[0] || 'Review this deployment gate before launch.'
    }))
}

export default function ReactDeploymentReadinessCenter({ selectedDemoUser }) {
  const [readiness, setReadiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const gates = readiness?.gates || []
  const blockers = useMemo(() => buildDeploymentBlockers(gates), [gates])
  const watchlist = useMemo(() => buildDeploymentWatchlist(gates), [gates])
  const actionPlan = useMemo(() => buildDeploymentActionPlan(readiness?.launchPlan || [], gates), [readiness?.launchPlan, gates])

  async function loadReadiness() {
    setIsLoading(true)
    setError('')

    try {
      setReadiness(await getDeploymentReadiness({ selectedDemoUser }))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load deployment readiness.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReadiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDemoUser?.id])

  return (
    <section className="react-app-section deployment-readiness-center ce-command-panel" id="react-deployment-readiness" aria-labelledby="react-deployment-readiness-heading" data-testid="react-deployment-readiness-center">
      <div className="section-heading-row ce-section-heading deployment-readiness-heading">
        <div>
          <p className="eyebrow ce-kicker">Portfolio deployment</p>
          <h2 id="react-deployment-readiness-heading">Deployment Readiness Center</h2>
          <p>
            Convert the hardened Cruise Explorer application into a public portfolio launch by tracking
            hosting target, environment variables, database continuity, release evidence, and recruiter-ready packaging.
          </p>
        </div>
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={loadReadiness} disabled={isLoading} data-testid="react-deployment-readiness-refresh-button">
          {isLoading ? 'Refreshing...' : 'Refresh deployment score'}
        </button>
      </div>

      {error ? <p className="draft-message error ce-feedback-message ce-editor-card" role="alert" data-testid="react-deployment-readiness-error">{error}</p> : null}

      <div className="deployment-readiness-scoreboard" data-testid="react-deployment-readiness-scoreboard">
        <article className={`deployment-readiness-score-card ce-command-card ${readiness?.status || 'loading'}`}>
          <span>Deployment readiness</span>
          <strong>{isLoading && !readiness ? 'Loading' : `${readiness?.overallScore ?? 0}%`}</strong>
          <p>{readiness?.summary || 'Checking deployment gates against the current project baseline.'}</p>
        </article>
        <article className="deployment-readiness-score-card ce-command-card">
          <span>Launch blockers</span>
          <strong>{blockers.length}</strong>
          <p>{blockers.length ? 'Resolve before publishing the public URL.' : 'No deployment blockers detected.'}</p>
        </article>
        <article className="deployment-readiness-score-card ce-command-card">
          <span>Launch watchlist</span>
          <strong>{watchlist.length}</strong>
          <p>{watchlist.length ? 'Track during platform setup.' : 'No deployment watch items detected.'}</p>
        </article>
      </div>

      <div className="deployment-readiness-gate-grid" data-testid="react-deployment-readiness-gates">
        {gates.map(gate => (
          <article key={gate.id} className={`deployment-readiness-gate-card ce-command-card ${gate.status}`} data-testid="react-deployment-readiness-gate-card">
            <div className="deployment-readiness-gate-header">
              <div>
                <span>{getDeploymentStatusLabel(gate.status)}</span>
                <h3>{gate.label}</h3>
              </div>
              <strong>{gate.score}%</strong>
            </div>
            <p>{gate.summary}</p>
            <ul aria-label={`${gate.label} evidence`}>
              {(gate.evidence || []).slice(0, 5).map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="deployment-readiness-recommendation ce-editor-card">
              <span>Launch recommendation</span>
              <p>{gate.recommendations?.[0] || 'Review this deployment gate before launch.'}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="deployment-readiness-action-plan ce-command-card" data-testid="react-deployment-readiness-action-plan">
        <div>
          <p className="eyebrow ce-kicker">Launch runbook</p>
          <h3>Deployment action sequence</h3>
        </div>
        {actionPlan.length ? (
          <ol>
            {actionPlan.map(item => (
              <li key={`${item.sequence}-${item.gateId || item.title}`}>
                <span>{item.sequence}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.action}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state compact ce-empty-state ce-editor-card">Deployment launch actions will appear after the first readiness check completes.</p>
        )}
      </div>

      <div className="deployment-readiness-target-grid" data-testid="react-deployment-readiness-targets">
        {(readiness?.deploymentTargets || []).map(target => (
          <article key={target.id} className={`deployment-readiness-target-card ${target.status}`}>
            <span>{getDeploymentStatusLabel(target.status)}</span>
            <h3>{target.label}</h3>
            <p>{target.evidence}</p>
            <strong>{target.nextStep}</strong>
          </article>
        ))}
      </div>

      <details className="deployment-readiness-release-evidence" data-testid="react-deployment-readiness-release-evidence">
        <summary>Show release evidence checklist</summary>
        <ul>
          {(readiness?.releaseEvidence || []).map(item => <li key={item.label}><strong>{item.label}:</strong> {item.value}</li>)}
        </ul>
      </details>
    </section>
  )
}

export {
  buildDeploymentActionPlan,
  buildDeploymentBlockers,
  buildDeploymentWatchlist,
  getDeploymentStatusLabel
}
