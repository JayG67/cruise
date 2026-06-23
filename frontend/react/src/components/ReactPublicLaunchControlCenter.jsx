import { useEffect, useMemo, useState } from 'react'

import { getPublicLaunchReadiness } from '../api/client.js'

const STATUS_LABELS = {
  ready: 'Ready',
  watch: 'Watch',
  blocked: 'Blocked',
  strong: 'Strong',
  'needs-polish': 'Needs polish',
  'needs-hardening': 'Needs hardening'
}

function getPublicLaunchStatusLabel(status = '') {
  return STATUS_LABELS[status] || status || 'Unknown'
}

function buildLaunchDecision(readiness = {}) {
  if (!readiness) {
    return {
      label: 'Checking launch posture',
      detail: 'Loading the consolidated launch control board.'
    }
  }

  if (readiness.status === 'ready') {
    return {
      label: 'Ready for final public packaging',
      detail: 'All launch tracks are above the readiness threshold. Capture final evidence and publish the live URL.'
    }
  }

  if (readiness.status === 'watch') {
    return {
      label: 'Proceed after watchlist review',
      detail: 'The app is close, but at least one launch track should be reviewed before public portfolio release.'
    }
  }

  return {
    label: 'Hold public launch',
    detail: 'Resolve blocker-level launch items before treating this as a public production portfolio artifact.'
  }
}

function buildStatusRows(projectStatus = {}) {
  return [...(projectStatus.tracks || [])].sort((a, b) => b.percent - a.percent)
}

export default function ReactPublicLaunchControlCenter({ selectedDemoUser }) {
  const [readiness, setReadiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const launchDecision = useMemo(() => buildLaunchDecision(readiness), [readiness])
  const statusRows = useMemo(() => buildStatusRows(readiness?.projectStatus), [readiness])

  async function loadReadiness() {
    setIsLoading(true)
    setError('')

    try {
      setReadiness(await getPublicLaunchReadiness({ selectedDemoUser }))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load public launch readiness.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReadiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDemoUser?.id])

  return (
    <section className="react-app-section public-launch-control-center" id="react-public-launch" aria-labelledby="react-public-launch-heading" data-testid="react-public-launch-control-center">
      <div className="section-heading-row public-launch-heading">
        <div>
          <p className="eyebrow">Public launch</p>
          <h2 id="react-public-launch-heading">Public Launch Control Center</h2>
          <p>
            Consolidate data architecture, production hardening, deployment readiness, and portfolio packaging into one launch decision board.
          </p>
        </div>
        <button type="button" className="secondary-action-button" onClick={loadReadiness} disabled={isLoading} data-testid="react-public-launch-refresh-button">
          {isLoading ? 'Refreshing...' : 'Refresh launch board'}
        </button>
      </div>

      {error ? <p className="draft-message error" role="alert" data-testid="react-public-launch-error">{error}</p> : null}

      <div className="public-launch-decision-grid" data-testid="react-public-launch-scoreboard">
        <article className={`public-launch-decision-card ${readiness?.status || 'loading'}`}>
          <span>Launch decision</span>
          <strong>{launchDecision.label}</strong>
          <p>{launchDecision.detail}</p>
        </article>
        <article className="public-launch-score-card">
          <span>Overall launch score</span>
          <strong>{isLoading && !readiness ? 'Loading' : `${readiness?.overallScore ?? 0}%`}</strong>
          <p>{readiness?.summary || 'Checking launch tracks across the current project baseline.'}</p>
        </article>
        <article className="public-launch-score-card">
          <span>Feature-complete estimate</span>
          <strong>{readiness?.projectStatus?.featureCompleteEstimate ?? 0}%</strong>
          <p>Based on operations UX, architecture, production hardening, deployment, and portfolio packaging readiness.</p>
        </article>
      </div>

      <div className="public-launch-track-grid" data-testid="react-public-launch-tracks">
        {(readiness?.tracks || []).map(track => (
          <article key={track.id} className={`public-launch-track-card ${track.status}`} data-testid="react-public-launch-track-card">
            <div>
              <span>{getPublicLaunchStatusLabel(track.status)}</span>
              <strong>{track.score}%</strong>
            </div>
            <h3>{track.label}</h3>
            <p>{track.summary}</p>
            <small>{track.source}</small>
            <div className="public-launch-track-action">
              <span>Next move</span>
              <p>{track.action}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="public-launch-detail-grid">
        <section className="public-launch-panel" aria-labelledby="public-launch-critical-heading" data-testid="react-public-launch-critical-items">
          <p className="eyebrow">Launch risks</p>
          <h3 id="public-launch-critical-heading">Critical launch items</h3>
          <ol>
            {(readiness?.criticalItems || []).map(item => (
              <li key={item.id}>
                <span>{item.sequence}</span>
                <div>
                  <strong>{item.title} · {item.score}%</strong>
                  <p>{item.summary}</p>
                  <small>{item.source} — {getPublicLaunchStatusLabel(item.status)}</small>
                  <em>{item.action}</em>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="public-launch-panel" aria-labelledby="public-launch-runbook-heading" data-testid="react-public-launch-runbook">
          <p className="eyebrow">Go-live runbook</p>
          <h3 id="public-launch-runbook-heading">Release sequence</h3>
          <ol>
            {(readiness?.launchRunbook || []).map(step => (
              <li key={step.id}>
                <span>{step.phase}</span>
                <div>
                  <strong>{step.owner}</strong>
                  <p>{step.action}</p>
                  <small>{step.exitCriteria}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="public-launch-panel project-status-panel" aria-labelledby="project-status-heading" data-testid="react-project-status-panel">
        <p className="eyebrow">Current project status</p>
        <h3 id="project-status-heading">Where the portfolio stands now</h3>
        <div className="project-status-grid">
          {statusRows.map(row => (
            <article key={row.area}>
              <div>
                <strong>{row.area}</strong>
                <span>{row.percent}%</span>
              </div>
              <small>{row.status}</small>
              <p>{row.note}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export {
  buildLaunchDecision,
  buildStatusRows,
  getPublicLaunchStatusLabel
}
