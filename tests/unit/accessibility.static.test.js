const fs = require('fs')
const path = require('path')

describe('static ADA and WCAG-oriented accessibility safeguards', () => {
  const indexHtml = fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8')
  const appJs = fs.readFileSync(path.resolve(__dirname, '../../public/app.js'), 'utf8')
  const styles = fs.readFileSync(path.resolve(__dirname, '../../public/styles.css'), 'utf8')

  it('provides skip navigation and a focusable main content landmark', () => {
    expect(indexHtml).toContain('data-testid="skip-link"')
    expect(indexHtml).toContain('href="#main-content"')
    expect(indexHtml).toContain('<main id="main-content" tabindex="-1">')
  })

  it('declares the page language, title, and mobile viewport', () => {
    expect(indexHtml).toContain('<html lang="en">')
    expect(indexHtml).toContain('<title>Cruise Explorer</title>')
    expect(indexHtml).toContain('name="viewport"')
  })

  it('labels critical navigation, search, status, and test-output regions for assistive technology', () => {
    expect(indexHtml).toContain('aria-label="Primary navigation"')
    expect(indexHtml).toContain('role="search"')
    expect(indexHtml).toContain('for="search-input"')
    expect(indexHtml).toContain('role="status" aria-live="polite"')
    expect(indexHtml).toContain('aria-label="SQA test output"')
  })

  it('keeps major panels associated with visible headings', () => {
    expect(indexHtml).toContain('aria-labelledby="add-cruise-line-heading"')
    expect(indexHtml).toContain('aria-labelledby="update-cruise-line-heading"')
    expect(indexHtml).toContain('aria-labelledby="ships-title"')
    expect(indexHtml).toContain('aria-labelledby="sailings-title"')
    expect(indexHtml).toContain('aria-labelledby="itinerary-title"')
    expect(indexHtml).toContain('aria-labelledby="role-booking-dashboard-heading"')
  })

  it('keeps hidden update workflow controls explicitly named', () => {
    expect(indexHtml).toContain('id="update-cruise-line-name" name="name" aria-label="Cruise line name"')
    expect(indexHtml).toContain('id="update-cruise-line-country" name="country" aria-label="Country"')
    expect(indexHtml).toContain('id="update-cruise-line-website" name="website" aria-label="Website"')
  })

  it('keeps the update workflow hidden by default at startup', () => {
    expect(indexHtml).toContain('workflow-panel-hidden')
    expect(indexHtml).toContain('id="update-cruise-line-panel"')
    expect(indexHtml).toContain('workflow-panel-hidden')
    expect(styles).toContain('.workflow-panel-hidden')
    expect(styles).toContain('display: none !important')
    expect(appJs).toContain('initializeHiddenWorkflowPanels')
    expect(appJs).toContain("updatePanel.classList.add('workflow-panel-hidden')")
    expect(appJs).toContain("panel.classList.remove('workflow-panel-hidden')")
  })

  it('keeps the update workflow cancel control testable and accessible', () => {
    expect(indexHtml).toContain('id="cancel-update-cruise-line-btn"')
    expect(indexHtml).toContain('data-testid="update-cruise-line-cancel-button"')
    expect(indexHtml).toContain('aria-label="Cancel cruise line update"')
  })


  it('keeps dynamically rendered action buttons accessible with contextual names', () => {
    expect(appJs).toContain('aria-label="View ships for')
    expect(appJs).toContain('aria-label="Update ${escapeHtml(line.name)}"')
    expect(appJs).toContain('aria-label="Delete ${escapeHtml(line.name)}"')
    expect(appJs).toContain('aria-label="View sailings for')
    expect(appJs).toContain('aria-label="View details for booking')
    expect(appJs).toContain('role="checkbox"')
    expect(appJs).toContain('aria-checked=')
  })

  it('keeps passenger self-service fields and feedback accessible', () => {
    expect(appJs).toContain('aria-label="First name"')
    expect(appJs).toContain('aria-label="Dining preference"')
    expect(appJs).toContain('data-testid="dining-preference-select"')
    expect(appJs).toContain('data-testid="passenger-profile-message" role="status" aria-live="polite"')
  })

  it('keeps itinerary filters and inline details available to assistive technology', () => {
    expect(appJs).toContain('aria-live="polite"')
    expect(appJs).toContain('aria-label="Show all itinerary items for this booking"')
    expect(appJs).toContain('aria-label="Show only my favorite itinerary items for this booking"')
  })

  it('supports visible focus, screen-reader-only text, reduced motion, and forced-colors users', () => {
    expect(styles).toContain('.skip-link')
    expect(styles).toContain('.sr-only')
    expect(styles).toContain(':focus-visible')
    expect(styles).toContain('prefers-reduced-motion')
    expect(styles).toContain('forced-colors: active')
  })

  it('keeps disabled controls visually and semantically distinguishable', () => {
    expect(styles).toContain('[aria-disabled="true"]')
    expect(styles).toContain('button:disabled')
  })

  it('hides decorative required-field asterisks from assistive technology', () => {
    expect(indexHtml).toContain('aria-hidden="true"')
  })

  it('keeps quality dashboard output as an announced status region', () => {
    expect(indexHtml).toContain('id="testOutput"')
    expect(indexHtml).toContain('aria-label="SQA test output"')
  })

  it('keeps role dashboard rendering functions available for startup demo context', () => {
    expect(appJs).toContain('function renderDemoRoleSummary')
    expect(appJs).toContain('function renderRoleBookingDashboard')
    expect(appJs).toContain('function renderAdminOperationsPanel')
    expect(appJs).toContain('initializeAdminOperationsPanel()')
  })

  it('keeps admin customer and booking management controls accessible and testable', () => {
    expect(appJs).toContain('data-testid="admin-data-management-panel"')
    expect(appJs).toContain('data-testid="admin-show-customers-button"')
    expect(appJs).toContain('data-testid="admin-show-bookings-button"')
    expect(appJs).toContain('aria-pressed')
    expect(appJs).toContain('aria-label="Admin customer and booking results"')
  })


  it('keeps admin management data in accessible scrollable tables', () => {
    expect(appJs).toContain('data-testid="admin-customer-table"')
    expect(appJs).toContain('data-testid="admin-booking-table"')
    expect(appJs).toContain('<caption>All admin-visible customers</caption>')
    expect(appJs).toContain('<caption>All admin-visible bookings</caption>')
    expect(styles).toContain('.admin-data-table-wrap')
    expect(styles).toContain('overflow: auto')
  })


})
