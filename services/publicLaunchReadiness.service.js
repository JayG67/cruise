function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asPercent(passed, total) {
  if (!total) return 100
  return Math.max(0, Math.min(100, Math.round((passed / total) * 100)))
}

function normalizeStatus(value = '') {
  return String(value || '').trim().toLowerCase()
}

function getGateScore(gate = {}) {
  const score = Number(gate.score)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
}

function getReadinessScore(readiness = {}) {
  const score = Number(readiness.overallScore ?? readiness.score)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
}

function isBlockingStatus(status = '') {
  return ['needs-hardening', 'needs-polish', 'blocked', 'critical'].includes(normalizeStatus(status))
}

function isWatchStatus(status = '') {
  return ['watch', 'at-risk', 'warning'].includes(normalizeStatus(status))
}

function getLaunchStatus(score, blockerCount = 0, watchCount = 0) {
  if (blockerCount > 0 || score < 70) return 'blocked'
  if (watchCount > 0 || score < 88) return 'watch'
  return 'ready'
}

function buildEvidenceItem({ id, label, source, score, status, summary, action }) {
  return {
    id,
    label,
    source,
    score: getGateScore({ score }),
    status: status || getLaunchStatus(score),
    summary,
    action
  }
}

function collectGates(readiness = {}, source = '') {
  return asArray(readiness.gates).map(gate => ({ ...gate, source }))
}

function buildLaunchReadinessTracks({ dataArchitecture = {}, productionHardening = {}, deployment = {}, portfolio = {} }) {
  return [
    buildEvidenceItem({
      id: 'data-architecture-hardening',
      label: 'Data architecture hardening',
      source: 'Data Architecture Hardening Center',
      score: getReadinessScore(dataArchitecture),
      status: getLaunchStatus(getReadinessScore(dataArchitecture), asArray(dataArchitecture.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(dataArchitecture.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: dataArchitecture.summary || 'Normalize IDs, status values, audit streams, and tenant boundaries before public production use.',
      action: asArray(dataArchitecture.migrationBacklog)[0]?.action || 'Clear the highest-priority migration backlog item.'
    }),
    buildEvidenceItem({
      id: 'production-hardening',
      label: 'Production hardening',
      source: 'Production Hardening Center',
      score: getReadinessScore(productionHardening),
      status: getLaunchStatus(getReadinessScore(productionHardening), asArray(productionHardening.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(productionHardening.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: productionHardening.summary || 'Confirm environment, error handling, logging, observability, deployment, and security gates.',
      action: asArray(productionHardening.launchSequence)[0] || 'Close the lowest-scoring production hardening gate.'
    }),
    buildEvidenceItem({
      id: 'deployment-readiness',
      label: 'Deployment readiness',
      source: 'Deployment Readiness Center',
      score: getReadinessScore(deployment),
      status: getLaunchStatus(getReadinessScore(deployment), asArray(deployment.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(deployment.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: deployment.summary || 'Verify hosting configuration, runtime scripts, build assets, and deployment documentation.',
      action: asArray(deployment.deploymentSequence)[0] || asArray(deployment.launchSequence)[0] || 'Run the deployment readiness sequence.'
    }),
    buildEvidenceItem({
      id: 'portfolio-packaging',
      label: 'Portfolio packaging',
      source: 'Portfolio Polish Center',
      score: getReadinessScore(portfolio),
      status: getLaunchStatus(getReadinessScore(portfolio), asArray(portfolio.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(portfolio.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: portfolio.summary || 'Package screenshots, architecture story, recruiter walkthrough, resume bullets, and launch assets.',
      action: asArray(portfolio.launchChecklist)[0]?.action || 'Complete the next portfolio launch checklist item.'
    })
  ]
}

function buildCriticalLaunchItems(tracks = [], readinessPayloads = []) {
  const gateItems = readinessPayloads
    .flatMap(({ payload, source }) => collectGates(payload, source))
    .filter(gate => isBlockingStatus(gate.status) || isWatchStatus(gate.status))
    .sort((a, b) => getGateScore(a) - getGateScore(b))
    .slice(0, 6)
    .map((gate, index) => ({
      id: `${gate.source}-${gate.id || index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sequence: index + 1,
      title: gate.label || 'Launch readiness gate',
      source: gate.source,
      status: normalizeStatus(gate.status) || 'watch',
      score: getGateScore(gate),
      summary: gate.summary || 'Review this launch-readiness gate.',
      action: asArray(gate.recommendations)[0] || 'Resolve this item before portfolio launch.'
    }))

  if (gateItems.length) return gateItems

  return tracks
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((track, index) => ({
      id: track.id,
      sequence: index + 1,
      title: track.label,
      source: track.source,
      status: track.status,
      score: track.score,
      summary: track.summary,
      action: track.action
    }))
}

function buildLaunchRunbook({ tracks = [], criticalItems = [] }) {
  const lowestTrack = [...tracks].sort((a, b) => a.score - b.score)[0]
  const firstCriticalItem = criticalItems[0]

  return [
    {
      id: 'freeze-baseline',
      phase: 'Freeze baseline',
      owner: 'Engineering lead',
      exitCriteria: 'Build passes the full regression gate and the updated-files archive is applied cleanly.',
      action: firstCriticalItem?.action || 'Run the complete test, browser, performance, and Lighthouse gate.'
    },
    {
      id: 'clear-launch-risks',
      phase: 'Clear launch risks',
      owner: 'Product / engineering',
      exitCriteria: 'No blocked tracks and no unresolved critical launch items remain.',
      action: lowestTrack ? `Lift ${lowestTrack.label} above watch threshold.` : 'Confirm each launch-readiness track is ready.'
    },
    {
      id: 'stage-public-build',
      phase: 'Stage public build',
      owner: 'Deployment owner',
      exitCriteria: 'Production build, health check, and seeded demo data work on the target host.',
      action: 'Deploy to the selected public hosting target and verify /health plus the React shell.'
    },
    {
      id: 'package-portfolio',
      phase: 'Package portfolio evidence',
      owner: 'Portfolio owner',
      exitCriteria: 'Screenshots, architecture notes, recruiter walkthrough, and resume bullets are captured.',
      action: 'Capture the final screenshot sequence and copy the launch narrative into the README.'
    },
    {
      id: 'go-live',
      phase: 'Go live',
      owner: 'Jay Gallagher',
      exitCriteria: 'Live URL, repo, walkthrough, and test evidence are ready for recruiter review.',
      action: 'Publish the live URL and include it in the portfolio package.'
    }
  ]
}

function buildProjectStatus({ dataArchitecture = {}, productionHardening = {}, deployment = {}, portfolio = {}, operationsControlBoard = {} }) {
  const operationalScore = getReadinessScore(operationsControlBoard) || 95
  const architectureScore = getReadinessScore(dataArchitecture)
  const hardeningScore = getReadinessScore(productionHardening)
  const deploymentScore = getReadinessScore(deployment)
  const portfolioScore = getReadinessScore(portfolio)

  return {
    featureCompleteEstimate: asPercent(
      operationalScore + architectureScore + hardeningScore + deploymentScore + portfolioScore,
      500
    ),
    tracks: [
      { area: 'Turnaround operations UX', status: 'near-complete', percent: operationalScore, note: 'Control board, team workspace, continuity, shift briefing, executive/reviewer/closeout packets, and go/no-go orchestration are represented.' },
      { area: 'Data architecture hardening', status: architectureScore >= 85 ? 'strong' : 'active-hardening', percent: architectureScore, note: 'Normalization, status vocabulary, audit stream, and tenant-boundary readiness are now tracked.' },
      { area: 'Production hardening', status: hardeningScore >= 85 ? 'strong' : 'active-hardening', percent: hardeningScore, note: 'Environment, validation, logging, observability, deployment, and security gates are visible.' },
      { area: 'Public deployment', status: deploymentScore >= 85 ? 'readying' : 'needs-final-target', percent: deploymentScore, note: 'The app has deployment readiness checks; final public host and live URL are still the major remaining proof point.' },
      { area: 'Portfolio packaging', status: portfolioScore >= 85 ? 'readying' : 'needs-polish', percent: portfolioScore, note: 'Recruiter walkthrough, screenshots, architecture diagram, and resume integration remain the highest-value polish items.' }
    ]
  }
}

function buildPublicLaunchReadiness(input = {}) {
  const dataArchitecture = asObject(input.dataArchitecture)
  const productionHardening = asObject(input.productionHardening)
  const deployment = asObject(input.deployment)
  const portfolio = asObject(input.portfolio)
  const operationsControlBoard = asObject(input.operationsControlBoard)
  const tracks = buildLaunchReadinessTracks({ dataArchitecture, productionHardening, deployment, portfolio })
  const readinessPayloads = [
    { payload: dataArchitecture, source: 'Data Architecture' },
    { payload: productionHardening, source: 'Production Hardening' },
    { payload: deployment, source: 'Deployment' },
    { payload: portfolio, source: 'Portfolio' }
  ]
  const blockerCount = tracks.filter(track => track.status === 'blocked').length
  const watchCount = tracks.filter(track => track.status === 'watch').length
  const overallScore = asPercent(tracks.reduce((sum, track) => sum + track.score, 0), tracks.length * 100)
  const criticalItems = buildCriticalLaunchItems(tracks, readinessPayloads)

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    status: getLaunchStatus(overallScore, blockerCount, watchCount),
    summary: blockerCount
      ? `${blockerCount} launch track${blockerCount === 1 ? '' : 's'} still need blocker-level attention before public release.`
      : watchCount
        ? `${watchCount} launch track${watchCount === 1 ? '' : 's'} remain on the watchlist before public release.`
        : 'The project is ready for final public launch packaging.',
    tracks,
    criticalItems,
    launchRunbook: buildLaunchRunbook({ tracks, criticalItems }),
    projectStatus: buildProjectStatus({ dataArchitecture, productionHardening, deployment, portfolio, operationsControlBoard })
  }
}

module.exports = {
  buildCriticalLaunchItems,
  buildLaunchReadinessTracks,
  buildPublicLaunchReadiness,
  getLaunchStatus
}
