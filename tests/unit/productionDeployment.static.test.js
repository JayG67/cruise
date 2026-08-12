const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

describe('production deployment static contracts', () => {
  it('pins the application, lockfile, CI, and deployment platform to Node.js 22', () => {
    const packageJson = readJson('package.json')
    const packageLock = readJson('package-lock.json')
    const workflow = read('.github/workflows/ci.yml')

    expect(packageJson.engines).toEqual({ node: '>=22 <23' })
    expect(packageLock.packages[''].engines).toEqual({ node: '>=22 <23' })
    expect(workflow).toContain('node-version: 22')
  })

  it('uses the ECR Public mirror for every PostgreSQL CI service container', () => {
    const workflow = read('.github/workflows/ci.yml')
    const resilientPostgresImage = 'image: public.ecr.aws/docker/library/postgres:17.4'

    expect(workflow.match(new RegExp(resilientPostgresImage.replaceAll('.', '\\.'), 'g'))).toHaveLength(6)
    expect(workflow).not.toContain('image: postgres:17.4')
  })

  it('uses deterministic Render builds and the production-only start path', () => {
    const packageJson = readJson('package.json')
    const renderConfig = read('render.yaml')

    expect(packageJson.scripts['start:prod']).toBe('npm run react:build && node index.js')
    expect(renderConfig).toContain('buildCommand: npm ci --include=dev && npm run react:build')
    expect(renderConfig).toContain('startCommand: npm run start:prod')
    expect(renderConfig).toContain('numInstances: 1')
    expect(renderConfig).toContain('healthCheckPath: /health')
    expect(renderConfig).toContain('autoDeployTrigger: checksPass')
  })

  it('runs the deployment contract audit locally, in the complete suite, and in CI', () => {
    const packageJson = readJson('package.json')
    const workflow = read('.github/workflows/ci.yml')
    const audit = read('scripts/verify-production-deployment.js')

    expect(packageJson.scripts['production:deployment:audit']).toBe('node scripts/verify-production-deployment.js')
    expect(packageJson.scripts['test:all']).toContain('npm run production:deployment:audit')
    expect(workflow).toContain('run: npm run production:deployment:audit')
    expect(audit).toContain('Production deployment audit passed.')
  })

  it('keeps the production health check and generated artifact exclusions explicit', () => {
    const app = read('app.js')
    const gitignore = read('.gitignore')

    expect(app).toContain("app.get('/health'")
    expect(app).toContain("res.status(200).json({ status: 'ok' })")

    const healthRouteIndex = app.indexOf("app.get('/health'")
    const reactStaticIndex = app.indexOf('app.use(express.static(reactBuildDir')
    const reactFallbackIndex = app.indexOf('app.get(/^\\/(?!')

    expect(healthRouteIndex).toBeGreaterThan(-1)
    expect(reactStaticIndex).toBeGreaterThan(-1)
    expect(reactFallbackIndex).toBeGreaterThan(-1)
    expect(app.slice(reactFallbackIndex, reactFallbackIndex + 250)).toContain('sendReactApp')
    expect(healthRouteIndex).toBeLessThan(reactStaticIndex)
    expect(healthRouteIndex).toBeLessThan(reactFallbackIndex)

    for (const ignoredPath of ['dist/', 'coverage/', 'lhci-report/', '.lighthouseci/', 'playwright-report/', 'test-results/']) {
      expect(gitignore).toContain(ignoredPath)
    }
  })
})
