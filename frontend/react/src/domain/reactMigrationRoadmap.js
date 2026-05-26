export const currentReactMigrationStage = {
  number: 16,
  title: 'Migration roadmap metadata',
  summary: 'The React shell now exposes its migration status from a shared roadmap module so reviewer-facing copy, readiness messaging, and future route-level migration decisions stay aligned.'
}

export const migrationReadinessPoints = [
  'The production DOM app stays untouched while React matures behind guardrails.',
  'The customer → booking hierarchy exercises real state, filtering, expansion, draft editing, mutation, and accessibility behavior.',
  'The React preview consumes the same API contract validated by integration and browser tests.',
  'Each migration stage adds explicit audit coverage before any production cutover.',
  'Reviewer-facing migration messaging is now sourced from shared roadmap metadata instead of stale hard-coded copy.'
]

export function getReactMigrationStageLabel(stage = currentReactMigrationStage) {
  return `Stage ${stage.number}: ${stage.title}`
}
