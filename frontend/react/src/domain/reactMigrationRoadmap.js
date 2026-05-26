export const currentReactMigrationStage = {
  number: 19,
  title: 'Cutover readiness gates',
  summary: 'The React shell now includes a production-style cutover readiness panel so the remaining migration work is managed as release gates instead of an open-ended chain of tiny stages.'
}

export const migrationReadinessPoints = [
  'The production DOM app stays untouched while React matures behind guardrails.',
  'The customer → booking hierarchy exercises real state, filtering, expansion, draft editing, mutation, and accessibility behavior.',
  'The React preview consumes the same API contract validated by integration and browser tests.',
  'Each migration stage adds explicit audit coverage before any production cutover.',
  'Reviewer-facing migration messaging is now sourced from shared roadmap metadata instead of stale hard-coded copy.',
  'Route-level React preview navigation now separates functional workflow review from migration status review.',
  'The React shell now exposes live query status, refresh behavior, and request metadata before production cutover.',
  'React cutover readiness is now tracked as explicit release gates instead of an open-ended list of micro-stages.'
]

export function getReactMigrationStageLabel(stage = currentReactMigrationStage) {
  return `Stage ${stage.number}: ${stage.title}`
}


export const reactMigrationStageHistory = [
  {
    number: 17,
    title: 'Route-level preview shell',
    summary: 'Route-level preview navigation separated hierarchy, readiness, and roadmap review panels before the live API query shell was added.'
  },
  {
    number: 18,
    title: 'Live API query shell',
    summary: 'The React shell exposed live API query status, refresh controls, request metadata, and route-level loading/error feedback.'
  },
  currentReactMigrationStage
]
