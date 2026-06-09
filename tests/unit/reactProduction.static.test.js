const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('Cruise operations product presentation guardrails', () => {
  it('serves the React operations application as the default product experience', () => {
    const app = read('app.js')
    const packageJson = require('../../package.json')

    expect(app).toContain("app.get('/', sendReactApp)")
    expect(app).toContain("app.use(express.static(reactBuildDir, { redirect: false")
    expect(app).not.toContain('sendDefaultExperience')
    expect(app).not.toContain('sendRetiredApp')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
    expect(packageJson.scripts['uiTests:ci']).toBe('npm run uiTests:react:ci')
  })

  it('removes user-facing retired implementation-history calls to action from the production React shell', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('Open Quality Console')
    expect(app).toContain('data-testid="react-hero-quality-button"')
    expect(app).toContain("openWorkspace('react-quality', 'Quality Console', 'admin')")
    expect(app).not.toContain('Open Retired Pre-React App')
    expect(app).not.toContain('href="/retired"')
    expect(app).not.toMatch(new RegExp(['migr', 'at'].join(''), 'i'))
    expect(app).not.toContain(['React', 'RouteNav'].join(''))
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

  it('keeps the quality console visible as a first-class product feature', () => {
    const app = read('frontend/react/src/App.jsx')
    const sqaConsole = read('frontend/react/src/components/ReactSqaConsole.jsx')

    expect(app).toContain('<ReactSqaConsole')
    expect(app).toContain('Run quality checks')
    expect(sqaConsole).toContain('Quality Console')
    expect(sqaConsole).toContain('View Quality Dashboard')
    expect(sqaConsole).toContain('Run Performance Check')
  })

  it('keeps the live React client resilient when a static host returns HTML for API routes', () => {
    const client = read('frontend/react/src/api/client.js')
    const bundledDataPath = path.join(projectRoot, 'data/cruise.json')
    const bundledData = JSON.parse(fs.readFileSync(bundledDataPath, 'utf8'))

    expect(client).toContain('class ApiResponseFormatError extends Error')
    expect(client).toContain("const STATIC_DATA_URL = '/data/cruise.json'")
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/public/data/cruise.json'))).toBe(false)
    expect(client).toContain('requestStaticFallback(path, options)')
    expect(client).toContain("path === '/cruise/bookings'")
    expect(client).toContain('normalizeStaticBookings(seedData)')
    expect(client).toContain('normalizeStaticCruiseLines(seedData)')
    expect(client).toContain('getStaticShipsForCruiseLine(seedData')
    expect(client).not.toContain('React Vite proxy is configured for local preview')
    expect(bundledData.customers.length).toBeGreaterThan(0)
    expect(bundledData.bookings.length).toBeGreaterThan(0)
    expect(bundledData.demoUsers.length).toBeGreaterThan(0)
  })


  it('serves the single root seed data file and shared public assets to the React app', () => {
    const app = read('app.js')
    const viteConfig = read('frontend/react/vite.config.js')
    const indexHtml = read('frontend/react/index.html')
    const css = read('frontend/react/src/styles/app.css')

    expect(app).toContain("const seedDataDir = path.join(__dirname, 'data')")
    expect(app).toContain("app.use('/data', express.static(seedDataDir")
    expect(viteConfig).toContain("publicDir: path.resolve(__dirname, '../../public')")
    expect(indexHtml).not.toContain('rel="preload"')
    expect(indexHtml).toContain('class="initial-shell"')
    expect(indexHtml).toContain('Manage cruise line and fleet operations')
    expect(indexHtml).toContain('Preparing operations workspaces')
    expect(css).toContain('content-visibility: auto')
    expect(css).toContain('background: linear-gradient(135deg, #071827 0%, #0b6fa4 100%)')
    expect(css).toContain('@media (min-width: 761px)')
    expect(css).not.toContain('backdrop-filter: blur')
    expect(fs.existsSync(path.join(projectRoot, 'public/images/cruise-background-960.webp'))).toBe(true)
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/public/images/cruise-background-960.webp'))).toBe(false)
  })

})
