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
    expect(app).toContain("app.use('/app-next', express.static(reactBuildDir, { redirect: false }))")
    expect(app).not.toContain('sendDefaultExperience')
    expect(app).not.toContain('sendLegacyApp')
    expect(packageJson.scripts['test:all']).toContain('browserTests:react')
    expect(packageJson.scripts['uiTests:ci']).toBe('npm run uiTests:react:ci')
  })

  it('removes user-facing legacy, DOM, and migration calls to action from the production React shell', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('Open SQA Console')
    expect(app).toContain('href="#react-quality"')
    expect(app).not.toContain('Open Legacy DOM App')
    expect(app).not.toContain('href="/legacy"')
    expect(app).not.toContain('migration')
    expect(app).not.toContain('Migration')
    expect(app).not.toContain('cutover')
    expect(app).not.toContain('Cutover')
    expect(app).not.toContain('ReactMigrationRouteNav')
  })

  it('removes retired migration panel source files from the React bundle source tree', () => {
    const retiredFiles = [
      'frontend/react/src/components/MigrationReadiness.jsx',
      'frontend/react/src/components/MigrationRoadmapPanel.jsx',
      'frontend/react/src/components/ReactMigrationRouteNav.jsx',
      'frontend/react/src/components/ReactMigrationActiveRoutePanel.jsx',
      'frontend/react/src/components/ReactMigrationHandoffPanel.jsx',
      'frontend/react/src/components/ReactCutoverReadinessPanel.jsx',
      'frontend/react/src/domain/reactMigrationRoutes.js',
      'frontend/react/src/domain/reactMigrationRoadmap.js',
      'frontend/react/src/domain/reactCutoverReadiness.js',
      'frontend/react/src/hooks/useReactMigrationRoute.js'
    ]

    for (const relativePath of retiredFiles) {
      expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(false)
    }
  })

  it('keeps the SQA console visible as a first-class product feature', () => {
    const app = read('frontend/react/src/App.jsx')
    const sqaConsole = read('frontend/react/src/components/ReactSqaConsole.jsx')

    expect(app).toContain('<ReactSqaConsole')
    expect(app).toContain('Run quality checks')
    expect(sqaConsole).toContain('Quality Console')
    expect(sqaConsole).toContain('View Quality Dashboard')
    expect(sqaConsole).toContain('Run Performance Check')
  })
})
