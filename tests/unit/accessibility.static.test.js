const fs = require('fs')
const path = require('path')

describe('static ADA and WCAG-oriented React accessibility safeguards', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'frontend/react/index.html'), 'utf8')
  const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
  const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')
  const roleSelector = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactRoleSelector.jsx'), 'utf8')
  const fleetDirectory = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactFleetDirectory.jsx'), 'utf8')
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

    expect(roleDashboard).toContain('My travel profile')
    expect(roleDashboard).toContain('Save profile')
    expect(roleDashboard).toContain('aria-live="polite"')
    expect(styles).toContain('.passenger-profile-form')
    expect(styles).toContain('.role-profile-grid')
  })

  it('keeps SQA output announced as a live region', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')

    expect(sqaConsole).toContain('aria-live="polite"')
    expect(sqaConsole).toContain('data-testid="react-sqa-output"')
    expect(sqaConsole).toContain('aria-label="SQA validation output"')
  })

  it('keeps native React confirmation panels using alertdialog semantics', () => {
    const componentText = [
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactFleetDirectory.jsx'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8'),
      confirmActionPanel
    ].join('\n')

    expect(componentText).toContain('role="alertdialog"')
    expect(componentText).toContain('aria-modal="true"')
  })
})
