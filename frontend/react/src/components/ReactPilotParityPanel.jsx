import {
  getReactPilotParityRecommendation,
  reactPilotParityChecks,
  summarizeReactPilotParity
} from '../domain/reactPilotParity.js'

const statusLabels = {
  covered: 'Covered',
  watch: 'Watch',
  gap: 'Gap'
}

export default function ReactPilotParityPanel({
  checks = reactPilotParityChecks
}) {
  const summary = summarizeReactPilotParity(checks)
  const recommendation = getReactPilotParityRecommendation(checks)

  return (
    <section className="parity-card" aria-labelledby="react-parity-heading" data-testid="react-pilot-parity-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Stage 21 pilot parity evidence</p>
          <h2 id="react-parity-heading">React pilot parity evidence</h2>
          <p className="section-summary">
            This stage consolidates the migration story around evidence reviewers care about:
            browser parity, regression safety, and the remaining route-smoke gate before pilot cutover.
          </p>
        </div>
        <div className="parity-summary" aria-label="React pilot parity summary" data-testid="react-parity-summary">
          <span>{summary.covered} covered</span>
          <span>{summary.watch} watch</span>
          <span>{summary.gap} gaps</span>
        </div>
      </div>

      <p className="status-card compact" role="status" data-testid="react-parity-recommendation">
        {recommendation}
      </p>

      <ul className="parity-check-list" data-testid="react-parity-checks">
        {checks.map(check => (
          <li className={`parity-check ${check.status}`} key={check.id} data-testid={`react-parity-check-${check.id}`}>
            <p className="gate-status">{statusLabels[check.status] || check.status}</p>
            <h3>{check.label}</h3>
            <p>{check.evidence}</p>
            <small>Evidence source: {check.source}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}
