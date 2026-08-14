const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readCssBundle(relativePath, seen = new Set()) {
  const absolutePath = path.join(projectRoot, relativePath)

  if (seen.has(absolutePath)) {
    return ''
  }

  seen.add(absolutePath)

  const source = fs.readFileSync(absolutePath, 'utf8')
  const directory = path.dirname(absolutePath)
  const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"];?/g)]

  return [
    source,
    ...imports.map(([, importPath]) => readCssBundle(path.relative(projectRoot, path.join(directory, importPath)), seen))
  ].join('\n')
}

describe('Cruise operations product presentation guardrails', () => {
  it('publishes a valid robots.txt through the shared Vite public directory', () => {
    const robots = read('public/robots.txt')
    const viteConfig = read('frontend/react/vite.config.js')

    expect(viteConfig).toContain("publicDir: path.resolve(__dirname, '../../public')")
    expect(robots).toBe('User-agent: *\nAllow: /\n')
    expect(robots).not.toContain('<!DOCTYPE html>')
  })

  it('serves the React operations application as the default product experience', () => {
    const app = read('app.js')
    const packageJson = require('../../package.json')

    expect(app).toContain("app.get('/', sendReactApp)")
    expect(app).toContain("app.get('/lighthouse-ci', sendLighthouseAuditPage)")
    expect(app).toContain("app.use(express.static(reactBuildDir, { redirect: false")
    expect(app).not.toContain('sendDefaultExperience')
    expect(app).not.toContain('sendRetiredApp')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
    expect(packageJson.scripts['browserTests:react']).toContain('start:test')
    expect(packageJson.scripts['uiTests:ci']).toBeUndefined()
    expect(packageJson.scripts['uiTests:react:ci']).toContain('cypress:run:react')
  })

  it('removes user-facing retired implementation-history calls to action from the production React shell', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('Explore Platform')
    expect(app).toContain('Review Operations Intelligence')
    expect(app).toContain('data-testid="react-hero-demo-button"')
    expect(app).toContain('data-testid="react-hero-intelligence-button"')
    expect(app).toContain("openWorkspace('react-platform-overview', 'Platform Overview')")
    expect(app).toContain("openWorkspace('react-operations-intelligence', 'Operations Intelligence', 'admin')")
    expect(app).not.toContain('Open Retired Pre-React App')
    expect(app).not.toContain('href="/retired"')
    expect(app).not.toMatch(new RegExp(['migr', 'at'].join(''), 'i'))
    expect(app).not.toContain(['React', 'RouteNav'].join(''))
  })

  it('keeps active operational outputs free of portfolio and reviewer presentation language', () => {
    const activeSources = [
      read('services/turnaroundLifecycle.service.js'),
      read('services/turnaroundOperationalAssurance.service.js'),
      read('services/turnaroundProductionReadiness.service.js')
    ].join('\n').toLowerCase()

    for (const forbiddenPhrase of [
      'production demo',
      'production-demo',
      'reviewer demo',
      'reviewer scenario',
      'demo path',
      'demonstration path',
      'demonstration scenario',
      'cruise-line outreach',
      'reviewer-safe'
    ]) {
      expect(activeSources).not.toContain(forbiddenPhrase)
    }
  })

  it('removes retired implementation-history panel source files from the React bundle source tree', () => {
    const oldStageTerm = ['Mig', 'ration'].join('')
    const oldReleaseTerm = ['Cut', 'over'].join('')
    const retiredFiles = [
      `frontend/react/src/components/${oldStageTerm}Readiness.jsx`,
      `frontend/react/src/components/${oldStageTerm}RoadmapPanel.jsx`,
      `frontend/react/src/components/React${oldStageTerm}RouteNav.jsx`,
      `frontend/react/src/components/React${oldStageTerm}ActiveRoutePanel.jsx`,
      `frontend/react/src/components/React${oldStageTerm}HandoffPanel.jsx`,
      `frontend/react/src/components/React${oldReleaseTerm}ReadinessPanel.jsx`,
      `frontend/react/src/domain/react${oldStageTerm}Routes.js`,
      `frontend/react/src/domain/react${oldStageTerm}Roadmap.js`,
      `frontend/react/src/domain/react${oldReleaseTerm}Readiness.js`,
      `frontend/react/src/hooks/useReact${oldStageTerm}Route.js`
    ]

    for (const relativePath of retiredFiles) {
      expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(false)
    }
  })

  it('keeps engineering quality evidence out of the product while preserving repository verification assets', () => {
    const app = read('frontend/react/src/App.jsx')
    const intelligence = read('frontend/react/src/components/OperationsIntelligenceCenter.jsx')
    const validationWorkspace = read('frontend/react/src/components/QualityValidationWorkspace.jsx')

    expect(app).toContain('<OperationsIntelligenceCenter')
    expect(app).not.toContain('<ReactSqaConsole')
    expect(app).toContain('Review Operations Intelligence')
    expect(intelligence).toContain('Prioritize the turnarounds that need action')
    expect(intelligence).toContain('Review team setup')
    expect(intelligence).toContain('Open operational role workspace')
    expect(validationWorkspace).toContain('View Quality Dashboard')
    expect(validationWorkspace).toContain('https://jayg67.github.io/cruise/')
    expect(validationWorkspace).toContain('https://jayg67.github.io/cruise/lighthouse/')
    expect(validationWorkspace).toContain('https://jayg67.github.io/cruise/coverage/')
  })

  it('keeps the live React client resilient when a static host returns HTML for API routes', () => {
    const client = [read('frontend/react/src/api/client.js'), read('frontend/react/src/api/httpClient.js')].join('\n')
    const staticFallback = read('frontend/react/src/api/staticFallback.js')
    const staticFallbackData = read('frontend/react/src/api/staticFallbackData.js')
    const staticFallbackReadiness = read('frontend/react/src/api/staticFallbackReadiness.js')
    const bundledDataPath = path.join(projectRoot, 'data/cruise.json')
    const bundledData = JSON.parse(fs.readFileSync(bundledDataPath, 'utf8'))

    expect(client).toContain('class ApiResponseFormatError extends Error')
    expect(client).toContain("import { requestStaticFallback } from './staticFallback'")
    expect(staticFallbackData).toContain("export const STATIC_DATA_URL = '/data/cruise.json'")
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/public/data/cruise.json'))).toBe(false)
    expect(client).toContain('requestStaticFallback(path, options)')
    expect(staticFallback).toContain("requestPath === '/cruise/bookings'")
    expect(staticFallbackData).toContain('export function normalizeStaticBookings(seedData)')
    expect(staticFallbackData).toContain('export function normalizeStaticCruiseLines(seedData)')
    expect(staticFallbackData).toContain('export function getStaticShipsForCruiseLine(seedData')
    expect(staticFallbackReadiness).toContain("status: 'ready'")
    expect(staticFallbackReadiness).not.toContain('before launch')
    expect(staticFallbackReadiness).not.toContain('Start the API')
    expect(client).not.toContain('React Vite proxy is configured for local preview')
    expect(bundledData.customers.length).toBeGreaterThan(0)
    expect(bundledData.bookings.length).toBeGreaterThan(0)
    expect(bundledData.demoUsers.length).toBeGreaterThan(0)
  })


  it('keeps active operational surfaces free of reviewer and pre-release project language', () => {
    const operationalSources = [
      read('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx'),
      read('services/dataArchitectureReadiness.service.js'),
      read('services/deploymentReadiness.service.js')
    ].join('\n').toLowerCase()

    expect(operationalSources).not.toContain('reviewer-ready')
    expect(operationalSources).not.toContain('reviewer and closeout')
    expect(operationalSources).not.toContain('before launch')
    expect(operationalSources).not.toContain('first deploy')
    expect(operationalSources).not.toContain('launch watchlist')
  })

  it('keeps root seed data available only through the demo-data policy while serving shared public assets', () => {
    const app = read('app.js')
    const viteConfig = read('frontend/react/vite.config.js')
    const indexHtml = read('frontend/react/index.html')
    const lighthouseHtml = read('public/lighthouse-ci.html')
    const styles = readCssBundle('frontend/react/src/styles/index.css')
    const productShellCss = readCssBundle('frontend/react/src/styles/components/product-shell.css')

    expect(app).toContain("const seedDataDir = path.join(__dirname, 'data')")
    expect(app).toContain('const seedDataStatic = express.static(seedDataDir')
    expect(app).toContain("app.use('/data', (req, res, next) => {")
    expect(app).toContain('if (!canExposeSeedDataOverHttp())')
    expect(viteConfig).toContain("publicDir: path.resolve(__dirname, '../../public')")
    expect(indexHtml).not.toContain('rel="preload"')
    expect(indexHtml).toContain('class="initial-shell"')
    expect(indexHtml).toContain('Manage cruise line and fleet operations')
    expect(indexHtml).toContain('Preparing operations workspaces')
    expect(lighthouseHtml).toContain('Cruise Fleet Operations Platform mobile quality audit')
    expect(lighthouseHtml).toContain('Audited production capabilities')
    expect(lighthouseHtml).toContain('href="/lighthouse-ci.css"')
    expect(styles).toContain('content-visibility: auto')
    expect(productShellCss).toContain('background: linear-gradient(135deg, #071827 0%, #0b6fa4 100%)')
    expect(productShellCss).toContain('.production-hero')
    expect(styles).toContain('@media (min-width: 761px)')
    expect(styles).not.toContain('backdrop-filter: blur')
    expect(fs.existsSync(path.join(projectRoot, 'public/images/cruise-background-960.webp'))).toBe(true)
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/public/images/cruise-background-960.webp'))).toBe(false)
  })

})


test('top navigation avoids duplicate current-location and workspace links', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/App.jsx'), 'utf8')

  expect(appSource).not.toContain('href="#react-dashboard">Dashboard</a>')
  expect(appSource).toContain('href="#react-platform-overview">Overview</a>')
  expect(appSource).toContain('href="#react-platform-overview">Workspaces</a>')
  expect(appSource).toContain('Cruise Fleet Operations Platform')
})
