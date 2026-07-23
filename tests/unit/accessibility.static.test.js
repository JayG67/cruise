const fs = require('fs')
const path = require('path')

describe('static ADA and WCAG-oriented React accessibility safeguards', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'frontend/react/index.html'), 'utf8')
  const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
  const readCssBundle = (entrypoint, seen = new Set()) => {
    const absolutePath = path.resolve(entrypoint)

    if (seen.has(absolutePath)) {
      return ''
    }

    seen.add(absolutePath)

    const source = fs.readFileSync(absolutePath, 'utf8')
    const directory = path.dirname(absolutePath)
    const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"];?/g)]

    return [
      source,
      ...imports.map(([, importPath]) => readCssBundle(path.join(directory, importPath), seen))
    ].join('\n')
  }

  const styles = readCssBundle(path.join(projectRoot, 'frontend/react/src/styles/index.css'))
  const roleSelector = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactRoleSelector.jsx'), 'utf8')
  const fleetDirectory = [
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactFleetDirectory.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/ReactFleetCruiseLineGrid.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/ReactFleetShipPanel.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/ReactFleetSailingPanel.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/ReactFleetItineraryPanel.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/fleetDirectoryUtils.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/useFleetDirectoryState.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/useFleetCruiseLineActions.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/useFleetShipActions.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/useFleetSailingActions.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/fleet/useFleetItineraryActions.js'), 'utf8')
  ].join('\n')
  const adminHierarchy = [
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/admin/useCustomerBookingHierarchyState.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx'), 'utf8')
  ].join('\n')
  const confirmActionPanel = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ConfirmActionPanel.jsx'), 'utf8')

  it('declares the page language, title, and mobile viewport', () => {
    expect(indexHtml).toContain('<html lang="en">')
    expect(indexHtml).toContain('<title>Cruise Fleet Operations Platform</title>')
    expect(indexHtml).toContain('name="description"')
    expect(indexHtml).toContain('Cruise Fleet Operations Platform is a React operations application')
    expect(indexHtml).toContain('rel="canonical"')
    expect(indexHtml).toContain('name="viewport"')
    expect(indexHtml).not.toContain(['Mig', 'ration'].join(''))
  })

  it('labels primary navigation and workspace controls for assistive technology', () => {
    expect(app).toContain('aria-label="Cruise application primary navigation"')
    expect(app).toContain('aria-label="React application workspaces"')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-quality-button"')
  })

  it('keeps workspace navigation accessible and connected to major application regions', () => {
    expect(roleSelector).toContain('id="react-role-selector"')
    expect(app).toContain('id="react-hierarchy"')
    expect(fleetDirectory).toContain('id="react-fleet"')
    expect(app).toContain('id="react-quality"')
    expect(styles).toContain('.react-workspace-card-grid')
    expect(styles).toContain('.recommended-workflow-panel')
  })

  it('keeps customer and booking workflow controls exposed with testable landmarks', () => {
    expect(app).toContain('CustomerBookingHierarchy')
    expect(styles).toContain('.react-admin-table')
    expect(styles).toContain('.react-admin-mutation-panel')
    expect(styles).toContain('.react-row-action-cluster')
  })

  it('keeps passenger self-service fields and feedback accessible', () => {
    const roleDashboard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactRoleDashboard.jsx'), 'utf8')
    const passengerSurface = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/passenger/RolePassengerSurface.jsx'), 'utf8')

    expect(roleDashboard).toContain("from './passenger/RolePassengerSurface.jsx'")
    expect(passengerSurface).toContain('My travel profile')
    expect(passengerSurface).toContain('Save profile')
    expect(passengerSurface).toContain('aria-live="polite"')
    expect(styles).toContain('.passenger-profile-form')
    expect(styles).toContain('.role-profile-grid')
  })

  it('keeps quality output announced as a live region', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')

    expect(sqaConsole).toContain('aria-live="polite"')
    expect(sqaConsole).toContain('data-testid="react-sqa-output"')
    expect(sqaConsole).toContain('aria-label="Quality validation output"')
  })

  it('keeps native React confirmation panels using alertdialog semantics', () => {
    const componentText = [
      adminHierarchy,
      fleetDirectory,
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8'),
      confirmActionPanel
    ].join('\n')

    expect(componentText).toContain('role="alertdialog"')
    expect(componentText).toContain('aria-modal="true"')
    expect(confirmActionPanel).toContain("import { createPortal } from 'react-dom'")
    expect(confirmActionPanel).toContain('createPortal(')
    expect(confirmActionPanel).toContain('document.body')
  })
})
