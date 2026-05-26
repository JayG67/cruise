import { currentReactMigrationStage, getReactMigrationStageLabel, migrationReadinessPoints } from '../domain/reactMigrationRoadmap.js'

export default function MigrationReadiness() {
  return (
    <section className="readiness-card" aria-labelledby="migration-readiness-heading" data-testid="react-migration-readiness">
      <p className="eyebrow">Migration readiness</p>
      <h2 id="migration-readiness-heading">Why this slice moves first</h2>
      <p className="section-summary" data-testid="react-current-migration-stage">
        {getReactMigrationStageLabel(currentReactMigrationStage)}
      </p>
      <ul>
        {migrationReadinessPoints.map(point => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  )
}
