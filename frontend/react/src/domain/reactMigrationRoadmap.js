export const currentReactMigrationStage = {
  number: 22,
  title: 'Final migration handoff',
  summary: 'The staged React migration is capped at Stage 22. Remaining work moves to PR review, route-level smoke coverage, and a deliberate pilot cutover decision rather than more micro-stages.'
}

export const migrationReadinessPoints = [
  'The production DOM app stays untouched while React matures behind guardrails.',
  'The customer → booking hierarchy exercises real state, filtering, expansion, draft editing, mutation, and accessibility behavior.',
  'The React preview consumes the same API contract validated by integration and browser tests.',
  'Each migration stage added explicit audit coverage before any production cutover.',
  'Reviewer-facing migration messaging is sourced from shared roadmap metadata instead of stale hard-coded copy.',
  'Route-level React preview navigation separates functional workflow review from migration status review.',
  'The React shell exposes live query status, refresh behavior, and request metadata before production cutover.',
  'React cutover readiness is tracked as explicit release gates instead of an open-ended list of micro-stages.',
  'The remaining migration is managed as PR cleanup, browser smoke coverage, and a deliberate pilot launch decision.',
  'React pilot parity evidence is consolidated into a route-level panel before the final React pilot cutover decision.',
  'The staged migration ends with a final handoff summary so reviewers can understand the cutover decision path without reading every stage commit.'
]

export function getReactMigrationStageLabel(stage = currentReactMigrationStage) {
  return `Stage ${stage.number}: ${stage.title}`
}

export const reactMigrationStageHistory = [
  {
    number: 0,
    title: 'Safe scaffold',
    summary: 'Created an isolated Vite/React workspace while preserving the DOM production baseline.'
  },
  {
    number: 1,
    title: 'Hierarchy proof of concept',
    summary: 'Started with the highest-risk customer → booking hierarchy workflow.'
  },
  {
    number: 8,
    title: 'Draft editor extraction',
    summary: 'Extracted customer and booking draft editors into reusable components.'
  },
  {
    number: 12,
    title: 'Presentation decomposition',
    summary: 'Separated hierarchy row and booking card presentation from orchestration logic.'
  },
  {
    number: 15,
    title: 'View-state hook extraction',
    summary: 'Moved search, summary, expansion, and collapse behavior into a reusable hook.'
  },
  {
    number: 17,
    title: 'Route-level preview shell',
    summary: 'Route-level preview navigation separated hierarchy, readiness, and roadmap review panels before the live API query shell was added.'
  },
  {
    number: 18,
    title: 'Live API query shell',
    summary: 'Exposed live API query status, refresh controls, request metadata, and route-level loading/error feedback.'
  },
  {
    number: 19,
    title: 'Cutover readiness gates',
    summary: 'Added production-style cutover readiness gates so remaining work is managed as release criteria.'
  },
  {
    number: 20,
    title: 'Pilot launch checklist',
    summary: 'Compressed remaining work into a dev-branch pilot launch checklist with fallback and browser parity expectations.'
  },
  {
    number: 21,
    title: 'Pilot parity evidence',
    summary: 'Consolidated browser parity and regression evidence before the final React route smoke gate.'
  },
  currentReactMigrationStage
]
