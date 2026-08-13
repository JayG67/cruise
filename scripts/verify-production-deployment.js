const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertIncludes(content, expected, sourceName) {
  assert(content.includes(expected), `${sourceName} must include: ${expected}`)
}

function main() {
  const packageJson = readJson('package.json')
  const packageLock = readJson('package-lock.json')
  const renderConfig = read('render.yaml')
  const workflow = read('.github/workflows/ci.yml')
  const app = read('app.js')
  const index = read('index.js')
  const gitignore = read('.gitignore')

  assert(packageJson.engines?.node === '>=22 <23', 'package.json must pin production to Node.js 22 with engines.node ">=22 <23".')
  assert(packageLock.packages?.['']?.engines?.node === '>=22 <23', 'package-lock.json root metadata must match the Node.js 22 production runtime.')
  assert(packageJson.scripts?.['start:prod'] === 'node index.js', 'start:prod must launch the prebuilt application without production build-tool dependencies.')
  assert(packageJson.devDependencies?.vite === '8.1.5', 'Vite must remain a development/build dependency, not a production runtime dependency.')
  assert(packageJson.devDependencies?.['@vitejs/plugin-react'], '@vitejs/plugin-react must remain a development/build dependency, not a production runtime dependency.')
  assert(!packageJson.dependencies?.vite, 'Vite must not be installed as a production runtime dependency.')
  assert(!packageJson.dependencies?.['@vitejs/plugin-react'], '@vitejs/plugin-react must not be installed as a production runtime dependency.')
  assert(packageJson.scripts?.['production:deployment:audit'] === 'node scripts/verify-production-deployment.js', 'package.json must expose production:deployment:audit.')
  assert(packageJson.scripts?.['test:all']?.includes('npm run production:deployment:audit'), 'test:all must run the production deployment audit.')

  for (const expected of [
    'runtime: node',
    'numInstances: 1',
    'buildCommand: npm ci --include=dev && npm run react:build',
    'startCommand: npm run start:prod',
    'healthCheckPath: /health',
    'autoDeployTrigger: checksPass',
    'key: NODE_ENV',
    'value: production',
    'key: CRUISE_JWT_SECRET',
    'key: CRUISE_JWT_ISSUER',
    'key: CRUISE_JWT_AUDIENCE',
    'key: DATABASE_URL',
    'key: CRUISE_DEMO_DATA_MODE',
    'value: disabled',
    'key: CRUISE_RATE_LIMIT_MODE',
    'key: CRUISE_API_RATE_LIMIT',
    'key: CRUISE_MUTATION_RATE_LIMIT',
    'key: CRUISE_AI_RATE_LIMIT'
  ]) {
    assertIncludes(renderConfig, expected, 'render.yaml')
  }

  assertIncludes(workflow, 'node-version: 22', '.github/workflows/ci.yml')
  assertIncludes(workflow, 'run: npm run production:deployment:audit', '.github/workflows/ci.yml')

  const resilientPostgresImage = 'image: public.ecr.aws/docker/library/postgres:17.4'
  const postgresServiceCount = workflow.split(resilientPostgresImage).length - 1
  assert(postgresServiceCount === 6, '.github/workflows/ci.yml must use the ECR Public PostgreSQL image for all six database-backed jobs.')
  assert(!workflow.includes('image: postgres:17.4'), '.github/workflows/ci.yml must not depend directly on Docker Hub for PostgreSQL service containers.')
  assertIncludes(app, "app.get('/health'", 'app.js')
  assertIncludes(app, "res.status(200).json({ status: 'ok' })", 'app.js')
  assertIncludes(app, "app.disable('x-powered-by')", 'app.js')
  assertIncludes(app, "app.set('trust proxy', 1)", 'app.js')
  assertIncludes(app, 'app.use(attachRequestContext)', 'app.js')
  assertIncludes(app, "express.json({ limit: '512kb' })", 'app.js')
  assertIncludes(app, 'generalApiRateLimit', 'app.js')
  assertIncludes(app, 'mutationRateLimitWhenNeeded', 'app.js')
  assertIncludes(app, 'aiRateLimitWhenNeeded', 'app.js')
  assertIncludes(app, 'app.use(errorHandler)', 'app.js')

  const authenticationService = read('services/authentication.service.js')
  assertIncludes(authenticationService, 'validateJwtConfiguration', 'services/authentication.service.js')
  assertIncludes(authenticationService, 'Production JWT authentication requires CRUISE_JWT_ISSUER.', 'services/authentication.service.js')
  assertIncludes(authenticationService, 'Production JWT authentication requires CRUISE_JWT_AUDIENCE.', 'services/authentication.service.js')
  assertIncludes(index, 'validateJwtConfiguration(process.env)', 'index.js')

  const securityMiddleware = read('middleware/security.middleware.js')
  assertIncludes(securityMiddleware, "if (isProduction()) return true", 'middleware/security.middleware.js')
  assertIncludes(securityMiddleware, "Strict-Transport-Security", 'middleware/security.middleware.js')
  assertIncludes(securityMiddleware, "message: 'Internal server error', requestId", 'middleware/security.middleware.js')
  assert(!securityMiddleware.includes('error: err.message'), 'Production security middleware must not echo raw exception messages.')

  assertIncludes(index, 'if (shouldLoadDemoDataOnStartup())', 'index.js')
  assertIncludes(index, 'await loadCruiseData()', 'index.js')
  assertIncludes(app, 'if (!canExposeSeedDataOverHttp())', 'app.js')

  for (const ignoredPath of [
    'node_modules/',
    '.env',
    'dist/',
    'coverage/',
    'cypress/screenshots/',
    'cypress/videos/',
    'lhci-report/',
    '.lighthouseci/',
    'playwright-report/',
    'test-results/',
    '**/.DS_Store'
  ]) {
    assertIncludes(gitignore, ignoredPath, '.gitignore')
  }

  console.log('Production deployment audit passed.')
  console.log('Runtime: Node.js 22')
  console.log('Deployment: Render checks-pass auto deploy')
  console.log('Health check: /health')
}

try {
  main()
} catch (error) {
  console.error(`Production deployment audit failed: ${error.message}`)
  process.exitCode = 1
}
