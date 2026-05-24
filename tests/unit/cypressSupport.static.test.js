const fs = require('fs')
const path = require('path')

describe('browser test helper inventory', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const adminWorkflowsPath = path.join(projectRoot, 'cypress/support/adminWorkflows.js')
  const demoRolesPath = path.join(projectRoot, 'cypress/e2e/demoRoles.cy.js')
  const mobileRoleDashboardPath = path.join(projectRoot, 'playwright/mobile/role-dashboard-mobile.spec.js')

  it('keeps repeated admin customer workflow actions consolidated in Cypress support helpers', () => {
    const helpers = fs.readFileSync(adminWorkflowsPath, 'utf8')

    expect(helpers).toContain('export function openAdminCustomerWorkflows')
    expect(helpers).toContain('export function openAdminCustomerWorkflowsFor')
    expect(helpers).toContain('export function expandCustomerBookings')
    expect(helpers).toContain('export function collapseCustomerBookings')
    expect(helpers).toContain('export function openFirstBookingEditor')
    expect(helpers).toContain('export function saveOpenBookingCabin')
    expect(helpers).toContain(".filter(':visible')")
    expect(helpers).toContain('admin-customer-bookings-row-${customerId}')
    expect(helpers).toContain("cy.wrap($button).should('have.attr', 'aria-expanded', 'true')")
    expect(helpers).toContain("if ($button.attr('aria-expanded') !== 'true')")
  })

  it('uses admin workflow helpers in the role dashboard Cypress suite', () => {
    const spec = fs.readFileSync(demoRolesPath, 'utf8')

    expect(spec).toContain("../support/adminWorkflows")
    expect(spec).toContain('openAdminCustomerWorkflowsFor')
    expect(spec).toContain('expandCustomerBookings')
    expect(spec).toContain('openFirstBookingEditor')
    expect(spec).toContain('saveOpenBookingCabin')
  })

  it('keeps repeated Playwright mobile role-dashboard actions consolidated in local helpers', () => {
    const spec = fs.readFileSync(mobileRoleDashboardPath, 'utf8')

    expect(spec).toContain('async function openAdminCustomerWorkflows')
    expect(spec).toContain('async function hideAdminCustomerWorkflows')
    expect(spec).toContain('async function searchAdminRecords')
    expect(spec).toContain('async function expandCustomerBookingsFor')
  })

  it('opens duplicate booking editors from the clicked row context instead of a hidden duplicate', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')
    const helpers = fs.readFileSync(adminWorkflowsPath, 'utf8')

    expect(app).toContain('showAdminBookingEditForm(button.dataset.bookingId, button)')
    expect(app).toContain(`triggerButton?.closest('[data-cy="admin-booking-row"]')`)
    expect(helpers).toContain(".filter(':visible')")
  })

  it('toggles duplicate booking detail rows from the clicked row context', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')

    expect(app).toContain('toggleAdminBookingDetails(button.dataset.bookingId, button)')
    expect(app).toContain(`button?.closest('[data-cy="admin-booking-row"]')`)
    expect(app).toContain('bookingRow?.nextElementSibling')
    expect(app).toContain(`row?.querySelector('[data-cy="admin-booking-details-panel"]')`)
  })

})
