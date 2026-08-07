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

function buildLaunchReadinessTracks({ dataArchitecture = {}, productionHardening = {}, deployment = {} }) {
  return [
    buildEvidenceItem({
      id: 'data-architecture-hardening',
      label: 'Data governance assurance',
      source: 'Data Governance Control Center',
      score: getReadinessScore(dataArchitecture),
      status: getLaunchStatus(getReadinessScore(dataArchitecture), asArray(dataArchitecture.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(dataArchitecture.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: dataArchitecture.summary || 'Confirm identity, status, audit, and tenant-boundary controls against the current operating baseline.',
      action: asArray(dataArchitecture.migrationBacklog)[0]?.action || 'Resolve the highest-priority data-governance action.'
    }),
    buildEvidenceItem({
      id: 'production-hardening',
      label: 'Production assurance',
      source: 'Production Assurance Center',
      score: getReadinessScore(productionHardening),
      status: getLaunchStatus(getReadinessScore(productionHardening), asArray(productionHardening.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(productionHardening.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: productionHardening.summary || 'Confirm environment, error handling, logging, observability, deployment, and security controls.',
      action: asArray(productionHardening.launchSequence)[0] || 'Resolve the lowest-scoring production-assurance control.'
    }),
    buildEvidenceItem({
      id: 'deployment-readiness',
      label: 'Deployment readiness',
      source: 'Deployment Readiness Center',
      score: getReadinessScore(deployment),
      status: getLaunchStatus(getReadinessScore(deployment), asArray(deployment.gates).filter(gate => isBlockingStatus(gate.status)).length, asArray(deployment.gates).filter(gate => isWatchStatus(gate.status)).length),
      summary: deployment.summary || 'Verify hosting configuration, runtime scripts, build assets, and deployment documentation.',
      action: asArray(deployment.deploymentSequence)[0] || asArray(deployment.launchSequence)[0] || 'Run the deployment readiness sequence.'
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
      title: gate.label || 'Release readiness control',
      source: gate.source,
      status: normalizeStatus(gate.status) || 'watch',
      score: getGateScore(gate),
      summary: gate.summary || 'Review this release-readiness control.',
      action: asArray(gate.recommendations)[0] || 'Resolve this item before production release.'
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
      id: 'clear-release-risks',
      phase: 'Clear release risks',
      owner: 'Product / engineering',
      exitCriteria: 'No blocked tracks and no unresolved critical release items remain.',
      action: lowestTrack ? `Lift ${lowestTrack.label} above watch threshold.` : 'Confirm each release-readiness track is ready.'
    },
    {
      id: 'verify-production-environment',
      phase: 'Verify production environment',
      owner: 'Deployment owner',
      exitCriteria: 'Production build, health check, and verified operating data work on the target host.',
      action: 'Verify the configured production target, /health endpoint, and React application shell.'
    },
    {
      id: 'verify-release-evidence',
      phase: 'Verify release evidence',
      owner: 'Quality engineering',
      exitCriteria: 'Automated test, accessibility, performance, deployment, and operational evidence are current.',
      action: 'Run the complete release gate and retain the generated verification artifacts.'
    },
    {
      id: 'go-live',
      phase: 'Go live',
      owner: 'Release owner',
      exitCriteria: 'The production URL, health check, operational workspaces, and release evidence are verified.',
      action: 'Publish the release and complete the post-deployment smoke review.'
    }
  ]
}

function buildProjectStatus({ dataArchitecture = {}, productionHardening = {}, deployment = {}, operationsControlBoard = {} }) {
  const operationalScore = getReadinessScore(operationsControlBoard) || 95
  const architectureScore = getReadinessScore(dataArchitecture)
  const hardeningScore = getReadinessScore(productionHardening)
  const deploymentScore = getReadinessScore(deployment)

  return {
    featureCompleteEstimate: asPercent(
      operationalScore + architectureScore + hardeningScore + deploymentScore,
      400
    ),
    tracks: [
      { area: 'Turnaround operations', status: 'operational', percent: operationalScore, note: 'Control board, team workspace, continuity, shift briefing, executive decision records, closeout packets, and release orchestration are represented.' },
      { area: 'Data governance assurance', status: architectureScore >= 85 ? 'strong' : 'action-required', percent: architectureScore, note: 'Identity normalization, status vocabulary, audit streams, and tenant-boundary controls are tracked.' },
      { area: 'Production assurance', status: hardeningScore >= 85 ? 'strong' : 'action-required', percent: hardeningScore, note: 'Environment, validation, logging, observability, deployment, and security controls are visible.' },
      { area: 'Production deployment', status: deploymentScore >= 85 ? 'ready' : 'action-required', percent: deploymentScore, note: 'Production target, runtime configuration, health checks, and release evidence are tracked.' }
    ]
  }
}

function buildPublicLaunchReadiness(input = {}) {
  const dataArchitecture = asObject(input.dataArchitecture)
  const productionHardening = asObject(input.productionHardening)
  const deployment = asObject(input.deployment)
  const operationsControlBoard = asObject(input.operationsControlBoard)
  const tracks = buildLaunchReadinessTracks({ dataArchitecture, productionHardening, deployment })
  const readinessPayloads = [
    { payload: dataArchitecture, source: 'Data Architecture' },
    { payload: productionHardening, source: 'Production Assurance' },
    { payload: deployment, source: 'Deployment' }
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
      ? `${blockerCount} release track${blockerCount === 1 ? '' : 's'} require blocker-level attention before authorization.`
      : watchCount
        ? `${watchCount} release track${watchCount === 1 ? '' : 's'} remain on the operational watchlist.`
        : 'The platform is ready for final production release verification.',
    tracks,
    criticalItems,
    launchRunbook: buildLaunchRunbook({ tracks, criticalItems }),
    projectStatus: buildProjectStatus({ dataArchitecture, productionHardening, deployment, operationsControlBoard })
  }
}

module.exports = {
  buildCriticalLaunchItems,
  buildLaunchReadinessTracks,
  buildPublicLaunchReadiness,
  getLaunchStatus
}
