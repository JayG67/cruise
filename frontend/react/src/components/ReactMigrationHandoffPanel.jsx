import {
  getReactMigrationHandoffRecommendation,
  reactMigrationHandoffItems,
  summarizeReactMigrationHandoff
} from '../domain/reactMigrationHandoff.js'

const statusLabels = {
  complete: 'Complete',
  watch: 'Watch',
  blocked: 'Blocked'
}

export default function ReactMigrationHandoffPanel({
  items = reactMigrationHandoffItems
}) {
  const summary = summarizeReactMigrationHandoff(items)
  const recommendation = getReactMigrationHandoffRecommendation(items)

  return (
    <section className="handoff-card" aria-labelledby="react-handoff-heading" data-testid="react-migration-handoff-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Stage 22 final migration-prep handoff</p>
          <h2 id="react-handoff-heading">React migration handoff summary</h2>
          <p className="section-summary">
            This closes the staged migration sequence. The next work should be PR review,
            route-level smoke coverage, and a deliberate pilot cutover decision instead of more micro-stages.
          </p>
        </div>
        <div className="handoff-summary" aria-label="React migration handoff summary" data-testid="react-handoff-summary">
          <span>{summary.complete} complete</span>
          <span>{summary.watch} watch</span>
          <span>{summary.blocked} blocked</span>
        </div>
      </div>

      <p className="status-card compact" role="status" data-testid="react-handoff-recommendation">
        {recommendation}
      </p>

      <ul className="handoff-item-list" data-testid="react-handoff-items">
        {items.map(item => (
          <li className={`handoff-item ${item.status}`} key={item.id} data-testid={`react-handoff-item-${item.id}`}>
            <p className="gate-status">{statusLabels[item.status] || item.status}</p>
            <h3>{item.label}</h3>
            <p>{item.evidence}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
