const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')

describe('quality console static safeguards', () => {


  it('keeps go-live readiness review visible as a production approval aid', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const cypressSpec = fs.readFileSync(path.join(projectRoot, 'cypress/react/reactQualityConsole.cy.js'), 'utf8')
    const selectorMap = fs.readFileSync(path.join(projectRoot, 'cypress/react/support/reactSelectors.js'), 'utf8')

    expect(sqaConsole).toContain("title: 'Go-Live Readiness Review'")
    expect(sqaConsole).toContain('recommendedManualPath')
    expect(sqaConsole).toContain('react-go-live-readiness-panel')
    expect(cypressSpec).toContain('runs a go-live readiness review with operational data and manual approval guidance')
    expect(selectorMap).toContain("sqaGoLiveButton: 'react-sqa-go-live-button'")
  })
  it('keeps safe CRUD ship payloads aligned with the React SQA fixture contract', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const cypressSpec = fs.readFileSync(path.join(projectRoot, 'cypress/react/reactQualityConsole.cy.js'), 'utf8')
    const selectorMap = fs.readFileSync(path.join(projectRoot, 'cypress/react/support/reactSelectors.js'), 'utf8')

    expect(sqaConsole).toContain("title: 'Safe CRUD Workflow'")
    expect(sqaConsole).toContain('temporaryRecordCreated')
    expect(cypressSpec).toContain('runs UI smoke and safe CRUD validations without mutating data')
    expect(cypressSpec).toContain('rs.sqaCrudButton')
    expect(selectorMap).toContain("sqaCrudButton: 'react-sqa-crud-button'")
  })

  it('keeps the safe CRUD workflow cleanup result visible to manual SQA users', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')

    expect(sqaConsole).toContain("title: 'Safe CRUD Workflow'")
    expect(sqaConsole).toContain('temporaryRecordCreated: false')
    expect(sqaConsole).toContain('`${action.title} Failed`')
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
