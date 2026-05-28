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
    expect(app).toContain('react-workspace-card-grid')
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
    expect(viteConfig).toContain("base: '/app-next/'")
    expect(client).toContain('VITE_API_BASE_URL')
    expect(client).toContain('Make sure the Express API is running on port 8000')
  })



  it('serves the React build from Express at /app-next before legacy DOM retirement', () => {
    const app = read('app.js')
    const integration = read('tests/integration/reactPreview.integration.test.js')

    expect(app).toContain("const reactBuildDir = path.join(__dirname, 'dist', 'react')")
    expect(app).toContain("app.use('/app-next', express.static(reactBuildDir, { redirect: false }))")
    expect(app).toContain("app.get(/^\\/app-next(?:\\/.*)?$/, sendReactPreview)")
    expect(app).toContain('Run npm run react:build before opening /app-next')
    expect(integration).toContain('GET /app-next should serve the built React preview shell from Express')
    expect(integration).toContain('GET /app-next nested routes should fall back to the React shell')
  })


  it('keeps the Express-hosted React route visually aligned with the production DOM shell', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')
    const routes = read('frontend/react/src/domain/reactMigrationRoutes.js')

    expect(app).toContain('production-parity-shell')
    expect(app).toContain('react-top-navigation')
    expect(app).toContain('Manage cruise line and fleet operations')
    expect(app).toContain('Open Current DOM App')
    expect(app).toContain('Operations console')
    expect(styles).toContain("url('/images/cruise-background.png')")
    expect(styles).toContain('.production-hero')
    expect(styles).toContain('.react-top-nav')
    expect(styles).toContain('min-height: 82vh')
    expect(routes).toContain("label: 'Operations'")
    expect(routes).toContain('Search and manage customer and booking workflows with progressive disclosure.')
  })


  it('keeps the React workspace aligned with the DOM operations console pattern', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')
    const routeNav = read('frontend/react/src/components/ReactMigrationRouteNav.jsx')
    const routes = read('frontend/react/src/domain/reactMigrationRoutes.js')

    expect(app).toContain('operations-console-panel')
    expect(app).toContain('Choose a workspace')
    expect(app).toContain('Role Simulation')
    expect(app).toContain('Admin Operations')
    expect(app).toContain('Fleet Directory')
    expect(app).toContain('Quality Console')
    expect(app).toContain('react-recommended-workflow')
    expect(styles).toContain('.react-workspace-card-grid')
    expect(styles).toContain('.recommended-workflow-panel')
    expect(styles).toContain('.workflow-step-list')
    expect(routeNav).toContain('React app workspace sections')
    expect(routes).toContain("label: 'Operations'")
  })


  it('keeps React guardrails focused on durable behavior instead of stale migration copy', () => {
    const app = read('frontend/react/src/App.jsx')
    const routes = read('frontend/react/src/domain/reactMigrationRoutes.js')

    expect(app).toContain('react-workspace-card-grid')
    expect(app).toContain('react-recommended-workflow')
    expect(routes).toContain("label: 'Operations'")
    expect(routes).toContain("label: 'Quality'")
    expect(routes).not.toContain('Manage the highest-risk admin customer')
  })


  it('keeps the React route focused on production replacement sections', () => {
    const app = read('frontend/react/src/App.jsx')
    const client = read('frontend/react/src/api/client.js')
    const roleSelector = read('frontend/react/src/components/ReactRoleSelector.jsx')
    const fleetDirectory = read('frontend/react/src/components/ReactFleetDirectory.jsx')
    const fleetHook = read('frontend/react/src/hooks/useCruiseLines.js')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).toContain('ReactRoleSelector')
    expect(app).toContain('ReactFleetDirectory')
    expect(app).toContain('Manage cruise line and fleet operations')
    expect(app).toContain('Full React Route')
    expect(client).toContain('getCruiseLines')
    expect(roleSelector).toContain('View application as')
    expect(roleSelector).toContain('Admin Demo User')
    expect(fleetDirectory).toContain('Cruise Line Directory')
    expect(fleetDirectory).toContain('View Ships')
    expect(fleetHook).toContain('useCruiseLines')
    expect(styles).toContain('.react-app-section')
    expect(styles).toContain('.fleet-card-grid')
  })


  it('keeps the React hero replacement-focused instead of migration-focused', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('Manage cruise line and fleet operations')
    expect(app).toContain('A production-style React operations console')
    expect(app).toContain('Full React Route')
    expect(app).not.toContain('React migration preview')
  })


  it('keeps workspace cards as clickable replacement-app controls', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')
    const roleSelector = read('frontend/react/src/components/ReactRoleSelector.jsx')

    expect(app).toContain('function scrollToSection')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-quality-button"')
    expect(app).not.toContain('<ReactMigrationRouteNav')
    expect(app).not.toContain('<MigrationReadiness')
    expect(app).not.toContain('<ReactPilotLaunchPanel')
    expect(roleSelector).toContain('id="react-role-selector"')
    expect(styles).toContain('React replacement app workspace controls')
    expect(styles).toContain('.operations-console-panel .react-route-nav')
  })


  it('keeps recommended workflow steps clickable like the DOM app', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(app).toContain('data-testid="react-workflow-role-button"')
    expect(app).toContain('data-testid="react-workflow-operations-button"')
    expect(app).toContain('data-testid="react-workflow-fleet-button"')
    expect(app).toContain('data-testid="react-workflow-quality-button"')
    expect(app).toContain('aria-label="Recommended workflow controls"')
    expect(styles).toContain('.workflow-step-button')
  })

  it('keeps the React admin workspace functional behind an explicit workflow toggle', () => {
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(hierarchy).toContain('useState(false)')
    expect(hierarchy).toContain('Show Customer Workflows')
    expect(hierarchy).toContain('Hide Customer Workflows')
    expect(hierarchy).toContain('data-testid="react-toggle-customer-workflows"')
    expect(hierarchy).toContain('data-testid="react-customer-workflow-table"')
    expect(hierarchy).toContain('Customer-centered operations')
    expect(hierarchy).not.toContain('Stage 17 migration slice')
    expect(styles).toContain('.admin-workflow-summary-card')
    expect(styles).toContain('.primary-action-button')
  })


  it('keeps React admin workspace visually and behaviorally aligned with the DOM admin workspace', () => {
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
    const row = read('frontend/react/src/components/CustomerHierarchyRow.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    expect(hierarchy).toContain('react-admin-workspace')
    expect(hierarchy).toContain('Role-aware view')
    expect(hierarchy).toContain('Admin Data Management')
    expect(hierarchy).toContain('react-admin-stat-pills')
    expect(hierarchy).toContain('Customer records with linked bookings')
    expect(hierarchy).toContain('<th scope="col">Loyalty</th>')
    expect(hierarchy).toContain('<th scope="col">Actions</th>')
    expect(row).toContain('customer-disclosure-button')
    expect(row).toContain('linked-booking-pill')
    expect(row).toContain('compact-action-button')
    expect(styles).toContain('React admin workspace parity pass')
    expect(styles).toContain('.react-admin-management-card')
    expect(styles).toContain('.react-admin-table-scroll')
  })


  it('keeps React application sections in the same operational order as the DOM app', () => {
    const app = read('frontend/react/src/App.jsx')
    const styles = read('frontend/react/src/styles/app.css')

    const roleIndex = app.indexOf('<ReactRoleSelector')
    const adminIndex = app.indexOf('<CustomerBookingHierarchy')
    const fleetIndex = app.indexOf('<ReactFleetDirectory')
    const qualityIndex = app.indexOf('<ReactQueryStatusPanel')

    expect(roleIndex).toBeGreaterThan(-1)
    expect(adminIndex).toBeGreaterThan(roleIndex)
    expect(fleetIndex).toBeGreaterThan(adminIndex)
    expect(qualityIndex).toBeGreaterThan(fleetIndex)
    expect(app).toContain('className="react-quality-section"')
    expect(styles).toContain('DOM flow alignment pass')
    expect(styles).toContain('.fleet-directory-section')
  })

})
