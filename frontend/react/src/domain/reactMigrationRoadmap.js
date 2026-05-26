export const currentReactMigrationStage = {
  number: 22,
  title: 'Final migration handoff',
  summary: 'The staged React migration is capped at Stage 22. Remaining work moves to PR review, route-level smoke coverage, and a deliberate pilot cutover decision rather than more micro-stages.'
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
  'The remaining migration is now managed as a dev-branch pilot launch checklist with explicit fallback and parity expectations.',
  'React pilot parity evidence is now consolidated into a route-level panel before the final pilot cutover decision.',
  'The staged migration now ends with a final handoff summary so reviewers can see the cutover decision path without reading every stage commit.'
]

export function getReactMigrationStageLabel(stage = currentReactMigrationStage) {
  return `Stage ${stage.number}: ${stage.title}`
}


export const reactMigrationStageHistory = [
  {
    number: 22,
    title: 'Final migration handoff',
    summary: 'The migration sequence was capped with a handoff route that turns the remaining work into PR review, smoke coverage, and pilot cutover decision-making.'
  },
  {
    number: 21,
    title: 'Pilot parity evidence',
    summary: 'Browser parity and regression evidence were consolidated so the migration can finish with one final React route smoke gate instead of many small stages.'
  },
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
  {
    number: 20,
    title: 'Pilot launch checklist',
    summary: 'The remaining migration work was compressed into a dev-branch pilot launch checklist with explicit fallback and browser parity expectations.'
  },
  currentReactMigrationStage
]
