const fs = require('fs')
const path = require('path')

describe('React migration readiness guardrails', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  it('keeps React as a real application workspace with a consolidated readiness audit', () => {
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/App.jsx'))).toBe(true)
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/vite.config.js'))).toBe(true)
    expect(packageJson.scripts['react:dev']).toContain('vite --config frontend/react/vite.config.js')
    expect(packageJson.scripts['react:build']).toContain('vite build --config frontend/react/vite.config.js')
    expect(packageJson.scripts['react:readiness:audit']).toBe('node scripts/verify-react-readiness.js')
    expect(packageJson.scripts['react:migration:audit']).toBe('npm run react:readiness:audit')
  })

  it('removes numbered migration-stage scripts from the permanent npm workflow', () => {
    const scriptNames = Object.keys(packageJson.scripts)

    expect(scriptNames.some(scriptName => /^react:stage\d+:audit$/.test(scriptName))).toBe(false)
    expect(scriptNames).not.toContain('react:scaffold:audit')
    expect(scriptNames).not.toContain('react:cleanup:audit')
  })

  it('keeps the React preview architecture focused on the current app instead of historical stage checks', () => {
    const app = read('frontend/react/src/App.jsx')
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
    const viewStateHook = read('frontend/react/src/hooks/useAdminHierarchyViewState.js')
    const customerWorkflow = read('frontend/react/src/hooks/useCustomerDraftWorkflow.js')
    const bookingWorkflow = read('frontend/react/src/hooks/useBookingDraftWorkflow.js')

    expect(app).toContain('useAdminHierarchySnapshot')
    expect(app).toContain('ReactMigrationRouteNav')
    expect(hierarchy).toContain('useAdminHierarchyViewState')
    expect(viewStateHook).toContain('createBookingExpansionKey')
    expect(customerWorkflow).toContain('saveCustomerDraftFor')
    expect(bookingWorkflow).toContain('saveBookingDraftFor')
    expect(app).not.toContain('document.querySelector')
    expect(hierarchy).not.toContain('document.querySelector')
  })

  it('keeps reviewer-facing documentation focused on cutover readiness instead of endless stages', () => {
    const plan = read('docs/react-migration-plan.md')
    const summary = read('docs/react-migration-review-summary.md')

    expect(plan).toContain('React Cutover Plan')
    expect(plan).toContain('Legacy DOM retirement')
    expect(summary).toContain('No Stage 23 is planned by default')
    expect(summary).toContain('Recommended next work')
  })
  it('keeps React local preview API calls wired through the Vite proxy', () => {
    const viteConfig = read('frontend/react/vite.config.js')
    const client = read('frontend/react/src/api/client.js')

    expect(packageJson.scripts['react:dev:local']).toContain('start-server-and-test start http://localhost:8000 react:dev')
    expect(packageJson.scripts['react:preview:local']).toContain('start-server-and-test start http://localhost:8000 react:preview')
    expect(viteConfig).toContain("'/cruise'")
    expect(viteConfig).toContain("'/health'")
    expect(viteConfig).toContain("'/admin'")
    expect(viteConfig).toContain('REACT_API_PROXY_TARGET')
    expect(viteConfig).toContain('preview:')
    expect(client).toContain('VITE_API_BASE_URL')
    expect(client).toContain('Make sure the Express API is running on port 8000')
  })


})
