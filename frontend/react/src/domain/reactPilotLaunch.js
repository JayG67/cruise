export const reactPilotLaunchSteps = [
  {
    id: 'build-artifact',
    label: 'Build React artifact',
    owner: 'Engineering',
    status: 'ready',
    evidence: 'Vite build remains isolated under frontend/react and is validated by the migration audit before any route cutover.'
  },
  {
    id: 'api-contract',
    label: 'Reuse existing API contract',
    owner: 'Quality',
    status: 'ready',
    evidence: 'React uses the same admin hierarchy snapshot and mutation boundaries covered by Jest, Cypress, and Playwright.'
  },
  {
    id: 'pilot-route',
    label: 'Enable pilot route only on dev',
    owner: 'Release',
    status: 'ready',
    evidence: 'Pilot launch is framed as a dev-branch route review, not a production replacement of the legacy DOM app.'
  },
  {
    id: 'browser-parity',
    label: 'Add browser parity checks',
    owner: 'Quality',
    status: 'watch',
    evidence: 'The next cutover increment should add React route-level browser checks before the legacy workflow is retired.'
  }
]

export function summarizeReactPilotLaunch(steps = reactPilotLaunchSteps) {
  return steps.reduce((summary, step) => ({
    ...summary,
    [step.status]: (summary[step.status] || 0) + 1,
    total: summary.total + 1
  }), { ready: 0, watch: 0, blocked: 0, total: 0 })
}

export function getReactPilotLaunchRecommendation(steps = reactPilotLaunchSteps) {
  const summary = summarizeReactPilotLaunch(steps)

  if (summary.blocked > 0) {
    return 'Do not pilot the React route yet. Resolve blocked launch steps first.'
  }

  if (summary.watch > 0) {
    return 'Ready for dev-branch pilot review with legacy DOM fallback still available.'
  }

  return 'Ready for a controlled pilot launch proposal.'
}
