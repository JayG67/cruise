const fs = require('fs')
const path = require('path')

describe('React migration scaffold', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('keeps the React migration shell separate from the production DOM app', () => {
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/App.jsx'))).toBe(true)
    expect(fs.existsSync(path.join(projectRoot, 'public/app.js'))).toBe(true)
    expect(fs.readFileSync(path.join(projectRoot, 'docs/react-migration-plan.md'), 'utf8'))
      .toContain('Do not rewrite the production UI all at once')
  })

  it('documents a long-lived dev branch strategy for staged migration work', () => {
    const strategy = fs.readFileSync(path.join(projectRoot, 'docs/branching-strategy.md'), 'utf8')

    expect(strategy).toContain('long-lived `dev` branch')
    expect(strategy).toContain('main` as the stable release branch')
    expect(strategy).toContain('feature/react-migration-stage-0')
  })

  it('adds React and Vite scripts without changing the existing production start script', () => {
    expect(packageJson.scripts.start).toContain('node --watch index.js')
    expect(packageJson.scripts['react:dev']).toContain('vite --config frontend/react/vite.config.js')
    expect(packageJson.scripts['react:build']).toContain('vite build --config frontend/react/vite.config.js')
    expect(packageJson.scripts['react:scaffold:audit']).toBe('node scripts/verify-react-migration-scaffold.js')
  })

  it('uses React state for the first migration candidate instead of direct DOM selectors', () => {
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

    expect(component).toContain('useState')
    expect(component).toContain('expandedCustomerIds')
    expect(component).toContain('expandedBookingIds')
    expect(component).toContain('buildCustomerBookingRows')
    expect(component).not.toContain('document.querySelector')
  })
  it('extracts React hierarchy domain logic away from component rendering', () => {
    const domain = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/adminHierarchy.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

    expect(domain).toContain('export function buildCustomerBookingRows')
    expect(domain).toContain('export function filterCustomerBookingRows')
    expect(domain).toContain('export function summarizeHierarchyRows')
    expect(domain).toContain('bookingMatchesCustomer')
    expect(component).toContain('buildCustomerBookingRows')
    expect(component).toContain('filterCustomerBookingRows')
    expect(component).toContain('Expand visible customers')
    expect(component).toContain('Collapse visible customers')
  })

  it('adds a Stage 1 React migration audit script for hierarchy guardrails', () => {
    expect(packageJson.scripts['react:stage1:audit']).toBe('node scripts/verify-react-stage-1.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:scaffold:audit')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage1:audit')
    expect(fs.existsSync(path.join(projectRoot, 'scripts/verify-react-stage-1.js'))).toBe(true)
  })

  it('adds a Stage 2 React API boundary with cancellable loading and retry UX', () => {
    const client = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
    const hook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useAdminHierarchySnapshot.js'), 'utf8')
    const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

    expect(client).toContain('export async function getAdminHierarchySnapshot')
    expect(client).toContain('Promise.all')
    expect(hook).toContain('AbortController')
    expect(hook).toContain('reload')
    expect(app).toContain('useAdminHierarchySnapshot')
    expect(component).toContain('Retry loading snapshot')
    expect(component).toContain('data-testid="react-admin-hierarchy"')
    expect(packageJson.scripts['react:stage2:audit']).toBe('node scripts/verify-react-stage-2.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage2:audit')
  })

})
