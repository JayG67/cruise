import {
  currentReactMigrationStage,
  getReactMigrationStageLabel,
  migrationReadinessPoints
} from '../domain/reactMigrationRoadmap.js'
import { getReactMigrationRouteKeys } from '../domain/reactMigrationRoutes.js'

export default function MigrationRoadmapPanel() {
  const routeKeys = getReactMigrationRouteKeys()

  return (
    <section className="roadmap-card" aria-labelledby="react-roadmap-heading" data-testid="react-migration-roadmap-panel">
      <p className="eyebrow">Migration roadmap</p>
      <h2 id="react-roadmap-heading">{getReactMigrationStageLabel(currentReactMigrationStage)}</h2>
      <p className="section-summary">{currentReactMigrationStage.summary}</p>

      <div className="roadmap-grid">
        <article className="roadmap-tile">
          <h3>Preview route coverage</h3>
          <p>
            The React shell now exposes {routeKeys.length} route-level preview sections so reviewers can
            inspect hierarchy behavior, readiness rationale, and migration status without touching the
            production DOM application.
          </p>
        </article>

        <article className="roadmap-tile">
          <h3>Next cutover gate</h3>
          <p>
            The next major milestone is route-level parity coverage: React browser tests should prove this
            shell can replace the matching legacy workflow before the production route changes.
          </p>
        </article>
      </div>

      <ul className="roadmap-list" aria-label="React migration readiness checkpoints">
        {migrationReadinessPoints.map(point => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  )
}
