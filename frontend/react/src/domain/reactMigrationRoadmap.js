export const currentReactMigrationStage = {
  number: 17,
  title: 'Route-level preview shell',
  summary: 'The React shell now has route-level preview navigation so hierarchy functionality, readiness rationale, and roadmap status can mature as separate screens before any production cutover.'
}

export const migrationReadinessPoints = [
  'The production DOM app stays untouched while React matures behind guardrails.',
  'The customer → booking hierarchy exercises real state, filtering, expansion, draft editing, mutation, and accessibility behavior.',
  'The React preview consumes the same API contract validated by integration and browser tests.',
  'Each migration stage adds explicit audit coverage before any production cutover.',
  'Reviewer-facing migration messaging is now sourced from shared roadmap metadata instead of stale hard-coded copy.',
  'Route-level React preview navigation now separates functional workflow review from migration status review.'
]

export function getReactMigrationStageLabel(stage = currentReactMigrationStage) {
  return `Stage ${stage.number}: ${stage.title}`
}
