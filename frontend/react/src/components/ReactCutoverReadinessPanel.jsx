import {
  getReactCutoverRecommendation,
  reactCutoverReadinessGates,
  summarizeReactCutoverReadiness
} from '../domain/reactCutoverReadiness.js'

const statusLabels = {
  ready: 'Ready',
  watch: 'Watch',
  blocked: 'Blocked'
}

export default function ReactCutoverReadinessPanel({
  gates = reactCutoverReadinessGates
}) {
  const summary = summarizeReactCutoverReadiness(gates)
  const recommendation = getReactCutoverRecommendation(gates)

  return (
    <section className="readiness-card cutover-card" aria-labelledby="react-cutover-heading" data-testid="react-cutover-readiness-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Stage 19 cutover readiness</p>
          <h2 id="react-cutover-heading">React cutover readiness gates</h2>
          <p className="section-summary">
            This panel turns the migration from a sequence of small technical stages into a production-style release decision:
            what is ready, what needs watch coverage, and what still blocks replacing the legacy DOM workflow.
          </p>
        </div>
        <div className="cutover-summary" aria-label="React cutover gate summary" data-testid="react-cutover-summary">
          <span>{summary.ready} ready</span>
          <span>{summary.watch} watch</span>
          <span>{summary.blocked} blocked</span>
        </div>
      </div>

      <p className="status-card compact" role="status" data-testid="react-cutover-recommendation">
        {recommendation}
      </p>

      <div className="cutover-gate-grid" data-testid="react-cutover-gates">
        {gates.map(gate => (
          <article className={`cutover-gate ${gate.status}`} key={gate.id} data-testid={`react-cutover-gate-${gate.id}`}>
            <p className="gate-status">{statusLabels[gate.status] || gate.status}</p>
            <h3>{gate.label}</h3>
            <p>{gate.evidence}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
