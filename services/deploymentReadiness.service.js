function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asText(value) {
  return typeof value === 'string' ? value : ''
}

function hasScript(packageJson = {}, scriptName) {
  return Boolean(asObject(packageJson.scripts)[scriptName])
}

function hasDependency(packageJson = {}, dependencyName) {
  return Boolean(asObject(packageJson.dependencies)[dependencyName] || asObject(packageJson.devDependencies)[dependencyName])
}

function hasFile(files = {}, filePath) {
  return Boolean(files[filePath])
}

function containsAny(source = '', terms = []) {
  const normalizedSource = asText(source).toLowerCase()
  return terms.some(term => normalizedSource.includes(String(term).toLowerCase()))
}

function asPercent(passed, total) {
  if (!total) return 0
  return Math.round((passed / total) * 100)
}

function getStatusForScore(score, readyThreshold = 85, watchThreshold = 60) {
  if (score >= readyThreshold) return 'ready'
  if (score >= watchThreshold) return 'watch'
  return 'needs-work'
}

function buildGate({ id, label, score, summary, evidence = [], recommendations = [], status = null }) {
  return {
    id,
    label,
    score,
    status: status || getStatusForScore(score),
    summary,
    evidence,
    recommendations
  }
}

function buildPlatformTargetGate({ files = {}, renderConfig = '', packageJson = {} }) {
  const checks = [
    hasFile(files, 'render.yaml') || hasFile(files, 'railway.json') || hasFile(files, 'fly.toml'),
    containsAny(renderConfig, ['startCommand', 'npm run start:prod', 'healthCheckPath']),
    hasScript(packageJson, 'start:prod'),
    hasScript(packageJson, 'react:build'),
    hasFile(files, 'Dockerfile') || hasFile(files, 'docker-compose.yml')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'platform-target',
    label: 'Hosting platform target',
    score,
    status: getStatusForScore(score, 80, 60),
    summary: `${checks.filter(Boolean).length} of ${checks.length} platform target signals are represented.`,
    evidence: [
      checks[0] ? 'A deployment platform config is present.' : 'No Render, Railway, or Fly platform config was detected.',
      checks[1] ? 'The platform config includes production launch details.' : 'The platform config needs explicit launch and health-check details.',
      checks[2] ? 'A production start script is available.' : 'A production start script is missing.',
      checks[3] ? 'The React production build script is available.' : 'The React production build script is missing.',
      checks[4] ? 'Container or compose configuration exists for local infrastructure parity.' : 'Container or compose configuration was not detected.'
    ],
    recommendations: score >= 80
      ? ['Keep the deployment platform config synchronized with the final public portfolio host.']
      : ['Choose one public hosting target and commit explicit build, start, and health-check configuration.']
  })
}

function buildEnvironmentGate({ files = {}, env = {}, renderConfig = '', readme = '' }) {
  const requiredNames = ['DATABASE_URL', 'PORT', 'NODE_ENV']
  const visibleRequiredNames = requiredNames.filter(name => Boolean(env[name]) || containsAny(renderConfig, [name]) || containsAny(readme, [name]))
  const checks = [
    hasFile(files, '.env.example') || containsAny(readme, requiredNames),
    visibleRequiredNames.includes('DATABASE_URL'),
    visibleRequiredNames.includes('PORT') || containsAny(renderConfig, ['PORT']),
    containsAny(renderConfig, ['NODE_ENV']) || Boolean(env.NODE_ENV),
    containsAny(readme, ['environment', 'env', 'DATABASE_URL']) || hasFile(files, '.env.example')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'environment',
    label: 'Environment and secrets plan',
    score,
    status: getStatusForScore(score, 85, 60),
    summary: `${checks.filter(Boolean).length} of ${checks.length} environment readiness expectations are documented or configured.`,
    evidence: [
      checks[0] ? 'Environment variable examples or README guidance are present.' : 'Environment variable examples are missing.',
      checks[1] ? 'DATABASE_URL is represented for database-backed deployment.' : 'DATABASE_URL needs to be documented for deployment.',
      checks[2] ? 'PORT is represented for host-managed runtime binding.' : 'PORT handling should be documented for the host runtime.',
      checks[3] ? 'NODE_ENV is represented for production runtime behavior.' : 'NODE_ENV production behavior should be explicit.',
      checks[4] ? 'Environment setup guidance is available.' : 'Environment setup guidance needs a dedicated runbook section.'
    ],
    recommendations: score >= 85
      ? ['Add secret rotation notes once the final hosting provider is selected.']
      : ['Add a deployment environment table covering DATABASE_URL, PORT, NODE_ENV, and optional CI tokens.']
  })
}

function buildDatabaseGate({ files = {}, packageJson = {}, renderConfig = '', dockerCompose = '' }) {
  const checks = [
    hasDependency(packageJson, 'pg'),
    hasDependency(packageJson, 'drizzle-orm'),
    hasFile(files, 'drizzle.config.js'),
    containsAny(dockerCompose, ['postgres', '5432']) || containsAny(renderConfig, ['postgres', 'database']),
    hasScript(packageJson, 'db:test:ready') || hasScript(packageJson, 'db:verify:test')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'database',
    label: 'Database deployment continuity',
    score,
    status: getStatusForScore(score, 85, 65),
    summary: `${checks.filter(Boolean).length} of ${checks.length} database continuity controls are present.`,
    evidence: [
      checks[0] ? 'Postgres driver dependency is available.' : 'Postgres driver dependency is missing.',
      checks[1] ? 'Drizzle ORM dependency is available.' : 'Drizzle ORM dependency is missing.',
      checks[2] ? 'Drizzle configuration is present.' : 'Drizzle configuration is missing.',
      checks[3] ? 'Database infrastructure is represented in local or platform configuration.' : 'Database infrastructure needs a deployment target representation.',
      checks[4] ? 'Database readiness verification script exists.' : 'Database readiness verification script is missing.'
    ],
    recommendations: score >= 85
      ? ['Add backup and restore verification after the deployment database is provisioned.']
      : ['Document the managed Postgres target, migration command, seed strategy, and rollback expectation.']
  })
}

function buildQualityReleaseGate({ packageJson = {}, files = {} }) {
  const checks = [
    hasScript(packageJson, 'test:all'),
    hasScript(packageJson, 'browserTests:react'),
    hasScript(packageJson, 'perf:smoke:local') || hasScript(packageJson, 'perf:smoke:ci'),
    hasScript(packageJson, 'lighthouse:ci:local') || hasScript(packageJson, 'lighthouse:ci:ci'),
    hasScript(packageJson, 'portfolio:audit') || hasFile(files, '.github/workflows')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'quality-release',
    label: 'Release quality gate',
    score,
    status: getStatusForScore(score, 90, 70),
    summary: `${checks.filter(Boolean).length} of ${checks.length} release quality gates are scripted.`,
    evidence: [
      checks[0] ? 'Full test-all gate exists.' : 'Full test-all gate is missing.',
      checks[1] ? 'React browser test gate exists.' : 'React browser test gate is missing.',
      checks[2] ? 'Performance smoke test gate exists.' : 'Performance smoke test gate is missing.',
      checks[3] ? 'Lighthouse CI gate exists.' : 'Lighthouse CI gate is missing.',
      checks[4] ? 'Portfolio audit or CI workflow exists.' : 'Portfolio audit or CI workflow is missing.'
    ],
    recommendations: score >= 90
      ? ['Capture the final passing release evidence before publishing the portfolio link.']
      : ['Wire the complete release gate into one repeatable command before public deployment.']
  })
}

function buildPortfolioLaunchGate({ files = {}, readme = '' }) {
  const checks = [
    containsAny(readme, ['Cruise', 'portfolio']),
    containsAny(readme, ['turnaround', 'operations']),
    hasFile(files, 'render.yaml') || hasFile(files, 'railway.json') || hasFile(files, 'fly.toml') || containsAny(readme, ['deployment', 'deploy']),
    hasFile(files, 'lhci-report') || hasFile(files, 'lighthouse-report') || containsAny(readme, ['lighthouse']),
    containsAny(readme, ['screenshot', 'walkthrough', 'architecture', 'recruiter'])
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'portfolio-launch',
    label: 'Portfolio launch packaging',
    score,
    status: getStatusForScore(score, 80, 55),
    summary: `${checks.filter(Boolean).length} of ${checks.length} portfolio launch packaging signals are present.`,
    evidence: [
      checks[0] ? 'README includes project/portfolio positioning.' : 'README needs stronger portfolio positioning.',
      checks[1] ? 'Turnaround operations are represented in project documentation.' : 'Turnaround operations should be highlighted in documentation.',
      checks[2] ? 'Deployment guidance is present.' : 'Deployment guidance is missing.',
      checks[3] ? 'Quality or Lighthouse evidence is represented.' : 'Quality evidence should be captured for launch.',
      checks[4] ? 'Walkthrough, architecture, or recruiter-facing notes are represented.' : 'Recruiter-facing walkthrough assets still need to be added.'
    ],
    recommendations: score >= 80
      ? ['Finalize screenshots, architecture diagrams, and resume bullets after deployment URL is live.']
      : ['Create a recruiter-facing launch packet with screenshots, architecture diagram, and deployment notes.']
  })
}

function buildDeploymentReadiness(input = {}) {
  const packageJson = asObject(input.packageJson)
  const files = asObject(input.files)
  const env = asObject(input.env)
  const renderConfig = asText(input.renderConfig)
  const dockerCompose = asText(input.dockerCompose)
  const readme = asText(input.readme)

  const gates = [
    buildPlatformTargetGate({ files, renderConfig, packageJson }),
    buildEnvironmentGate({ files, env, renderConfig, readme }),
    buildDatabaseGate({ files, packageJson, renderConfig, dockerCompose }),
    buildQualityReleaseGate({ packageJson, files }),
    buildPortfolioLaunchGate({ files, readme })
  ]

  const overallScore = asPercent(gates.reduce((sum, gate) => sum + gate.score, 0), gates.length * 100)
  const blockers = gates.filter(gate => gate.status === 'needs-work')
  const watchItems = gates.filter(gate => gate.status === 'watch')

  return {
    title: 'Deployment Readiness Center',
    overallScore,
    status: blockers.length ? 'needs-work' : watchItems.length ? 'watch' : 'ready',
    summary: blockers.length
      ? `${blockers.length} deployment launch blocker${blockers.length === 1 ? '' : 's'} should be resolved before publishing the portfolio URL.`
      : watchItems.length
        ? `${watchItems.length} deployment readiness item${watchItems.length === 1 ? '' : 's'} should remain on the launch watchlist.`
        : 'Deployment readiness is in strong shape for a portfolio launch.',
    gates,
    launchPlan: buildLaunchPlan(gates),
    deploymentTargets: buildDeploymentTargets({ files, renderConfig }),
    releaseEvidence: buildReleaseEvidence({ packageJson, files }),
    generatedAt: new Date().toISOString()
  }
}

function buildLaunchPlan(gates = []) {
  return [...gates]
    .sort((a, b) => a.score - b.score)
    .map((gate, index) => ({
      sequence: index + 1,
      gateId: gate.id,
      title: gate.label,
      status: gate.status,
      action: gate.recommendations?.[0] || 'Review this deployment gate before launch.'
    }))
}

function buildDeploymentTargets({ files = {}, renderConfig = '' }) {
  return [
    {
      id: 'render',
      label: 'Render',
      status: hasFile(files, 'render.yaml') ? 'configured' : 'candidate',
      evidence: hasFile(files, 'render.yaml') ? 'render.yaml is present.' : 'Add render.yaml if Render remains the selected host.',
      nextStep: containsAny(renderConfig, ['healthCheckPath']) ? 'Validate health checks after first deploy.' : 'Add an explicit health check path before launch.'
    },
    {
      id: 'railway',
      label: 'Railway',
      status: hasFile(files, 'railway.json') ? 'configured' : 'candidate',
      evidence: hasFile(files, 'railway.json') ? 'railway.json is present.' : 'Railway remains available as a candidate target.',
      nextStep: 'Confirm managed Postgres, build command, and public URL behavior if selected.'
    },
    {
      id: 'fly',
      label: 'Fly.io',
      status: hasFile(files, 'fly.toml') ? 'configured' : 'candidate',
      evidence: hasFile(files, 'fly.toml') ? 'fly.toml is present.' : 'Fly.io remains available as a candidate target.',
      nextStep: 'Confirm region, machine size, and Postgres attachment if selected.'
    }
  ]
}

function buildReleaseEvidence({ packageJson = {}, files = {} }) {
  return [
    { label: 'Full regression gate', value: hasScript(packageJson, 'test:all') ? 'Scripted' : 'Missing' },
    { label: 'React production build', value: hasScript(packageJson, 'react:build') ? 'Scripted' : 'Missing' },
    { label: 'Browser coverage', value: hasScript(packageJson, 'browserTests:react') ? 'Scripted' : 'Missing' },
    { label: 'Performance smoke', value: hasScript(packageJson, 'perf:smoke:local') ? 'Scripted' : 'Missing' },
    { label: 'Deployment config', value: hasFile(files, 'render.yaml') || hasFile(files, 'railway.json') || hasFile(files, 'fly.toml') ? 'Present' : 'Missing' }
  ]
}

module.exports = {
  buildDeploymentReadiness,
  buildDeploymentTargets,
  buildEnvironmentGate,
  buildPlatformTargetGate,
  buildQualityReleaseGate,
  buildReleaseEvidence,
  getStatusForScore
}
