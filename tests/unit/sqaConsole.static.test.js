const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')

describe('SQA console static safeguards', () => {
  it('keeps safe CRUD ship payloads aligned with the API validation contract', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')
    const cypressSpec = fs.readFileSync(path.join(projectRoot, 'cypress/e2e/home.cy.js'), 'utf8')

    expect(app).toContain("currentPort: 'SQA Test Port'")
    expect(app).toContain("currentPort: 'SQA Updated Test Port'")
    expect(cypressSpec).toContain("currentPort: 'SQA Test Port'")
    expect(cypressSpec).toContain("currentPort: 'SQA Updated Test Port'")
    expect(cypressSpec).toContain('expect(req.body.name).to.match(/^SQA Temporary Ship')
  })

  it('keeps the safe CRUD workflow cleanup result visible to manual SQA users', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')

    expect(app).toContain('Safe CRUD Workflow Check Result')
    expect(app).toContain('temporaryRecordCleanedUp: true')
    expect(app).toContain('Safe CRUD Workflow Check Failed')
  })
})


describe('integration test fixture stability', () => {
  it('uses dynamic seeded booking lookup instead of hard-coded booking IDs for passenger overlap tests', () => {
    const factory = fs.readFileSync(path.join(projectRoot, 'tests/integration/helpers/testDataFactory.js'), 'utf8')
    const customersBookingsSpec = fs.readFileSync(path.join(projectRoot, 'tests/integration/customersBookings.integration.test.js'), 'utf8')

    expect(factory).toContain('getSeededBookingWithPassengers')
    expect(customersBookingsSpec).toContain('getSeededBookingWithPassengers')
  })
})

describe('integration seed-data lookup resilience', () => {
  it('uses resilient seeded ship and booking lookup helpers instead of first-record assumptions', () => {
    const sailingsSpec = fs.readFileSync(path.join(projectRoot, 'tests/integration/sailings.integration.test.js'), 'utf8')
    const factory = fs.readFileSync(path.join(projectRoot, 'tests/integration/helpers/testDataFactory.js'), 'utf8')

    expect(sailingsSpec).toContain('Expected seeded cruise data to include at least one ship with a sailing')
    expect(factory).toContain('getSeededBookingWithPassengers,')
  })
})


describe('SQA console Cypress contract stability', () => {
  it('uses executable digit regexes for dynamic SQA ship names', () => {
    const cypressSpec = fs.readFileSync(path.join(projectRoot, 'cypress/e2e/home.cy.js'), 'utf8')

    expect(cypressSpec).toContain('/^SQA Temporary Ship \\d+$/')
    expect(cypressSpec).toContain('/^SQA Temporary Ship \\d+ Updated$/')
    expect(cypressSpec).not.toContain('/^SQA Temporary Ship \\\\d+$/')
  })
})
