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
  assert(packageJson.scripts?.['start:prod'] === 'npm run react:build && node index.js', 'start:prod must build the React client and start index.js without local Docker dependencies.')
  assert(packageJson.scripts?.['production:deployment:audit'] === 'node scripts/verify-production-deployment.js', 'package.json must expose production:deployment:audit.')
  assert(packageJson.scripts?.['test:all']?.includes('npm run production:deployment:audit'), 'test:all must run the production deployment audit.')

  for (const expected of [
    'runtime: node',
    'buildCommand: npm ci --include=dev && npm run react:build',
    'startCommand: npm run start:prod',
    'healthCheckPath: /health',
    'autoDeployTrigger: checksPass',
    'key: NODE_ENV',
    'value: production',
    'key: DATABASE_URL',
    'key: CRUISE_DEMO_DATA_MODE',
    'value: disabled'
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
