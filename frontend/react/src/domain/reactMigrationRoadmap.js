export const currentReactMigrationStage = {
  number: 20,
  title: 'Pilot launch checklist',
  summary: 'The React migration is now framed around a dev-branch pilot launch path instead of many small open-ended stages, with the legacy DOM app preserved as the fallback until browser parity is proven.'
}

export const migrationReadinessPoints = [
  'The production DOM app stays untouched while React matures behind guardrails.',
  'The customer → booking hierarchy exercises real state, filtering, expansion, draft editing, mutation, and accessibility behavior.',
  'The React preview consumes the same API contract validated by integration and browser tests.',
  'Each migration stage adds explicit audit coverage before any production cutover.',
  'Reviewer-facing migration messaging is now sourced from shared roadmap metadata instead of stale hard-coded copy.',
  'Route-level React preview navigation now separates functional workflow review from migration status review.',
  'The React shell now exposes live query status, refresh behavior, and request metadata before production cutover.',
  'React cutover readiness is now tracked as explicit release gates instead of an open-ended list of micro-stages.',
  'The remaining migration is now managed as a dev-branch pilot launch checklist with explicit fallback and parity expectations.'
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
  {
    number: 19,
    title: 'Cutover readiness gates',
    summary: 'The React shell added production-style cutover readiness gates so the remaining migration work could be managed as release criteria.'
  },
  currentReactMigrationStage
]
