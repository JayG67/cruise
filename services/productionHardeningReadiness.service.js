const DEFAULT_REQUIRED_ENV = [
  'DATABASE_URL',
  'NODE_ENV',
  'PORT'
]

const DEFAULT_RECOMMENDED_ENV = [
  'SUPPRESS_DB_LOGS',
  'VITE_API_BASE_URL',
  'LHCI_GITHUB_APP_TOKEN'
]

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

function buildGate({ id, label, score, status, summary, evidence = [], recommendations = [] }) {
  return {
    id,
    label,
    score,
    status,
    summary,
    evidence,
    recommendations
  }
}

function getStatusForScore(score, readyThreshold = 85, watchThreshold = 60) {
  if (score >= readyThreshold) return 'ready'
  if (score >= watchThreshold) return 'watch'
  return 'needs-hardening'
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

function buildEnvironmentGate({ env = {}, requiredEnv = DEFAULT_REQUIRED_ENV, recommendedEnv = DEFAULT_RECOMMENDED_ENV, files = {} }) {
  const presentRequired = requiredEnv.filter(name => Boolean(env[name]))
  const presentRecommended = recommendedEnv.filter(name => Boolean(env[name]))
  const envExampleCoverage = hasFile(files, '.env.example')
  const totalChecks = requiredEnv.length + recommendedEnv.length + 1
  const passedChecks = presentRequired.length + presentRecommended.length + (envExampleCoverage ? 1 : 0)
  const score = asPercent(passedChecks, totalChecks)

  return buildGate({
    id: 'environment',
    label: 'Environment configuration',
    score,
    status: getStatusForScore(score, 85, 55),
    summary: `${presentRequired.length} of ${requiredEnv.length} required environment values are present in this runtime snapshot.`,
    evidence: [
      `${presentRequired.length} required variables present: ${presentRequired.join(', ') || 'none'}`,
      `${presentRecommended.length} recommended variables present: ${presentRecommended.join(', ') || 'none'}`,
      envExampleCoverage ? 'Environment example file is available.' : 'No .env.example detected.'
    ],
    recommendations: envExampleCoverage
      ? ['Keep deployment-specific secrets out of source and document required variables for each target platform.']
      : ['Add .env.example before public deployment so setup is reproducible.']
  })
}

function buildErrorHandlingGate({ packageJson = {}, files = {}, appSource = '', controllerSource = '' }) {
  const hasExpress = hasDependency(packageJson, 'express')
  const hasErrorMiddleware = /err\s*,\s*req\s*,\s*res\s*,\s*next/.test(appSource) || /errorHandler/.test(appSource)
  const hasAsyncNext = /catch\s*\([^)]*\)\s*{\s*next\(/.test(controllerSource) || /next\(err\)/.test(controllerSource)
  const hasValidationMiddleware = hasFile(files, 'middleware/validate.middleware.js')
  const hasSecurityTests = hasFile(files, 'tests/unit/app.security.test.js')
  const checks = [hasExpress, hasErrorMiddleware, hasAsyncNext, hasValidationMiddleware, hasSecurityTests]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'error-handling',
    label: 'Error handling and validation',
    score,
    status: getStatusForScore(score, 85, 60),
    summary: `${checks.filter(Boolean).length} of ${checks.length} error-handling safeguards are visible in the project surface.`,
    evidence: [
      hasErrorMiddleware ? 'Express error middleware is detected.' : 'Central Express error middleware is not detected.',
      hasAsyncNext ? 'Controller async paths forward errors to next().' : 'Controller async paths need consistent next(err) handling.',
      hasValidationMiddleware ? 'Request validation middleware exists.' : 'Request validation middleware is missing.',
      hasSecurityTests ? 'Security-focused app tests exist.' : 'Security-focused app tests are not detected.'
    ],
    recommendations: score >= 85
      ? ['Keep adding validation schemas for every write endpoint as production APIs expand.']
      : ['Centralize async error handling, request validation, and security regression coverage before deployment.']
  })
}

function buildLoggingGate({ packageJson = {}, files = {}, appSource = '', loggerSource = '' }) {
  const hasLoggerMiddleware = hasFile(files, 'middleware/loggers.js')
  const appUsesLogger = /loggers|requestLogger|errorLogger/.test(appSource)
  const suppressDbLogs = /SUPPRESS_DB_LOGS/.test(appSource + loggerSource)
  const hasCompression = hasDependency(packageJson, 'compression')
  const hasLogDirectory = hasFile(files, 'logs')
  const checks = [hasLoggerMiddleware, appUsesLogger, suppressDbLogs, hasCompression, hasLogDirectory]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'logging',
    label: 'Logging and runtime hygiene',
    score,
    status: getStatusForScore(score, 80, 55),
    summary: `${checks.filter(Boolean).length} of ${checks.length} runtime logging and hygiene checks are in place.`,
    evidence: [
      hasLoggerMiddleware ? 'Logger middleware exists.' : 'Logger middleware is missing.',
      appUsesLogger ? 'Application shell wires logging middleware.' : 'Application shell does not appear to wire logger middleware.',
      suppressDbLogs ? 'Database log suppression control is present.' : 'Database log suppression control is not detected.',
      hasCompression ? 'Compression dependency is available.' : 'Compression dependency is missing.'
    ],
    recommendations: ['Add structured request IDs and machine-readable production logs when moving from portfolio hosting to live operations.']
  })
}

function buildObservabilityGate({ packageJson = {}, files = {} }) {
  const checks = [
    hasFile(files, 'performance/cruise-api-smoke.js'),
    hasScript(packageJson, 'perf:smoke:local') || hasScript(packageJson, 'perf:smoke:ci'),
    hasScript(packageJson, 'lighthouse:ci:local') || hasScript(packageJson, 'lighthouse:ci:ci'),
    hasScript(packageJson, 'coverage:ci') || hasScript(packageJson, 'jest:coverage:all'),
    hasFile(files, '.github/workflows')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'observability',
    label: 'Observability and quality signals',
    score,
    status: getStatusForScore(score, 80, 60),
    summary: `${checks.filter(Boolean).length} of ${checks.length} observability signals are represented in scripts or project files.`,
    evidence: [
      checks[0] ? 'k6 smoke coverage is available.' : 'k6 smoke coverage is not detected.',
      checks[1] ? 'Performance smoke script is wired.' : 'Performance smoke script is missing.',
      checks[2] ? 'Lighthouse CI script is wired.' : 'Lighthouse CI script is missing.',
      checks[3] ? 'Coverage reporting script is wired.' : 'Coverage reporting script is missing.',
      checks[4] ? 'CI workflow directory exists.' : 'CI workflow directory is not detected.'
    ],
    recommendations: score >= 80
      ? ['Add uptime, error-rate, and latency monitors after choosing the public hosting target.']
      : ['Wire smoke, coverage, Lighthouse, and CI checks into a repeatable release gate.']
  })
}

function buildDeploymentGate({ packageJson = {}, files = {} }) {
  const checks = [
    hasScript(packageJson, 'start:prod'),
    hasScript(packageJson, 'react:build'),
    hasFile(files, 'Dockerfile') || hasFile(files, 'docker-compose.yml'),
    hasFile(files, 'public') || hasFile(files, 'dist'),
    hasFile(files, 'render.yaml') || hasFile(files, 'railway.json') || hasFile(files, 'fly.toml')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'deployment',
    label: 'Deployment readiness',
    score,
    status: getStatusForScore(score, 80, 55),
    summary: `${checks.filter(Boolean).length} of ${checks.length} deployment-readiness checks are currently represented.`,
    evidence: [
      checks[0] ? 'Production start script exists.' : 'Production start script is missing.',
      checks[1] ? 'React build script exists.' : 'React build script is missing.',
      checks[2] ? 'Container or compose configuration exists.' : 'Container configuration is missing.',
      checks[4] ? 'Deployment target platform config exists.' : 'Deployment target platform config is not detected.'
    ],
    recommendations: checks[4]
      ? ['Keep platform config synchronized with required environment variables.']
      : ['Add a deployment platform config before the public portfolio launch.']
  })
}

function buildSecurityGate({ packageJson = {}, files = {}, appSource = '' }) {
  const checks = [
    hasFile(files, 'tests/unit/app.security.test.js'),
    /trust proxy|helmet|cors|express\.json\(/.test(appSource),
    hasDependency(packageJson, 'zod'),
    hasFile(files, 'services/requestAuthorization.service.js'),
    hasFile(files, 'middleware/requestIdentity.middleware.js')
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildGate({
    id: 'security',
    label: 'Security and access controls',
    score,
    status: getStatusForScore(score, 85, 60),
    summary: `${checks.filter(Boolean).length} of ${checks.length} security-readiness controls are visible.`,
    evidence: [
      checks[0] ? 'Security regression tests exist.' : 'Security regression tests are missing.',
      checks[1] ? 'Application security middleware or JSON parsing controls are detected.' : 'Application security middleware is not detected.',
      checks[2] ? 'Zod validation dependency exists.' : 'Validation dependency is missing.',
      checks[3] ? 'Request authorization service exists.' : 'Request authorization service is missing.',
      checks[4] ? 'Request identity middleware exists.' : 'Request identity middleware is missing.'
    ],
    recommendations: score >= 85
      ? ['Add platform-specific secret rotation and rate-limit controls before accepting live users.']
      : ['Harden request identity, authorization, and security middleware before public deployment.']
  })
}

function buildProductionHardeningReadiness(input = {}) {
  const packageJson = asObject(input.packageJson)
  const files = asObject(input.files)
  const env = asObject(input.env)
  const appSource = String(input.appSource || '')
  const controllerSource = String(input.controllerSource || '')
  const loggerSource = String(input.loggerSource || '')

  const gates = [
    buildEnvironmentGate({ env, files, requiredEnv: input.requiredEnv, recommendedEnv: input.recommendedEnv }),
    buildErrorHandlingGate({ packageJson, files, appSource, controllerSource }),
    buildLoggingGate({ packageJson, files, appSource, loggerSource }),
    buildObservabilityGate({ packageJson, files }),
    buildDeploymentGate({ packageJson, files }),
    buildSecurityGate({ packageJson, files, appSource })
  ]

  const overallScore = asPercent(gates.reduce((sum, gate) => sum + gate.score, 0), gates.length * 100)
  const blockers = gates.filter(gate => gate.status === 'needs-hardening')
  const watchItems = gates.filter(gate => gate.status === 'watch')
  const status = blockers.length ? 'needs-hardening' : watchItems.length ? 'watch' : 'ready'

  return {
    title: 'Production Hardening Center',
    overallScore,
    status,
    summary: blockers.length
      ? `${blockers.length} production-hardening gates need attention before public deployment.`
      : watchItems.length
        ? `${watchItems.length} production-hardening gates should stay on the launch watchlist.`
        : 'Production hardening gates are ready for portfolio deployment planning.',
    gates,
    launchSequence: [
      'Document required environment variables and deployment target assumptions.',
      'Keep all write endpoints behind validation, identity, and authorization controls.',
      'Run Jest, Cypress, Playwright mobile/responsive, k6 smoke, and Lighthouse CI before release.',
      'Choose a deployment target and add target-specific healthcheck and rollback notes.',
      'Add production observability for uptime, latency, error rate, and failed mutation alerts.'
    ]
  }
}

module.exports = {
  buildProductionHardeningReadiness,
  buildEnvironmentGate,
  buildErrorHandlingGate,
  buildLoggingGate,
  buildObservabilityGate,
  buildDeploymentGate,
  buildSecurityGate
}
