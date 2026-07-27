const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')

describe('quality console static safeguards', () => {

  it('keeps evaluation-history filtering and sorting controls in the AI quality console', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    expect(sqaConsole).toContain('react-ai-quality-history-controls')
    expect(sqaConsole).toContain('react-ai-history-search')
    expect(sqaConsole).toContain('react-ai-history-decision-filter')
    expect(sqaConsole).toContain('react-ai-history-provider-filter')
    expect(sqaConsole).toContain('react-ai-history-sort')
    expect(sqaConsole).toContain('filteredAiRuns.map')
    expect(styles).toContain('.ai-quality-history-controls')
  })


  it('keeps interactive release-policy controls in the AI quality console', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const apiClient = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    expect(sqaConsole).toContain('react-ai-release-policy-controls')
    expect(sqaConsole).toContain('react-ai-preview-release-policy-button')
    expect(sqaConsole).toContain('react-ai-release-policy-result')
    expect(apiClient).toContain('previewAiEvaluationReleasePolicy')
    expect(styles).toContain('.ai-release-policy-grid')
  })


  it('keeps interactive baseline selection and run comparison in the AI quality console', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const apiClient = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    expect(sqaConsole).toContain('react-ai-baseline-comparison')
    expect(sqaConsole).toContain('react-ai-current-run-select')
    expect(sqaConsole).toContain('react-ai-baseline-run-select')
    expect(sqaConsole).toContain('react-ai-comparison-result')
    expect(apiClient).toContain('compareAiEvaluationRuns')
    expect(apiClient).toContain('baselineRunId')
    expect(styles).toContain('.ai-baseline-controls')
  })

  it('keeps AI failed-case diagnostics available from evaluation history', () => {
    const sqaConsole = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    expect(sqaConsole).toContain('react-ai-failure-drilldown')
    expect(sqaConsole).toContain('Review ${run.failedCases.length} failure')
    expect(sqaConsole).toContain('Recurring failed cases')
    expect(styles).toContain('.ai-failure-card-grid')
  })


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
