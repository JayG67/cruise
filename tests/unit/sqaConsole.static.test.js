const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')

function readQualityConsoleBoundary() {
  return [
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/useAiQualityConsoleState.js'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiQualityEvidenceWorkspace.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/QualityValidationWorkspace.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiEvaluationHistoryWorkspace.jsx'), 'utf8'),
    fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiEvaluationReleaseWorkspace.jsx'), 'utf8')
  ].join('\n')
}

describe('quality console static safeguards', () => {

  it('keeps evaluation-history filtering and sorting controls in the AI quality console', () => {
    const sqaConsole = readQualityConsoleBoundary()
    const sqaDomain = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/sqaConsole.js'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    expect(sqaConsole).toContain('react-ai-quality-history-controls')
    expect(sqaConsole).toContain('react-ai-history-search')
    expect(sqaConsole).toContain('react-ai-history-decision-filter')
    expect(sqaConsole).toContain('react-ai-history-provider-filter')
    expect(sqaConsole).toContain('react-ai-history-sort')
    const consoleShell = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const evidenceWorkspace = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiQualityEvidenceWorkspace.jsx'), 'utf8')
    const historyWorkspace = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiEvaluationHistoryWorkspace.jsx'), 'utf8')

    expect(consoleShell).toContain("import AiQualityEvidenceWorkspace from './AiQualityEvidenceWorkspace.jsx'")
    expect(consoleShell).toContain('<AiQualityEvidenceWorkspace')
    expect(consoleShell).not.toContain("import AiEvaluationHistoryWorkspace from './AiEvaluationHistoryWorkspace.jsx'")
    expect(evidenceWorkspace).toContain("import AiEvaluationHistoryWorkspace from './AiEvaluationHistoryWorkspace.jsx'")
    expect(evidenceWorkspace).toContain('<AiEvaluationHistoryWorkspace')
    expect(evidenceWorkspace).toContain("import AiEvaluationReleaseWorkspace from './AiEvaluationReleaseWorkspace.jsx'")
    expect(evidenceWorkspace).toContain('<AiEvaluationReleaseWorkspace')
    expect(consoleShell).not.toContain('filteredAiRuns.map')
    expect(historyWorkspace).toContain('filteredAiRuns.map')
    expect(sqaConsole).toContain('filterAndSortAiRuns(aiQualitySummary?.runs')
    expect(sqaDomain).toContain('export function filterAndSortAiRuns')
    expect(sqaDomain).toContain("sort === 'pass-rate-desc'")
    expect(styles).toContain('.ai-quality-history-controls')
    expect(sqaConsole).toContain('className="ai-quality-history-wrap" role="region" aria-labelledby="ai-quality-history-heading" tabIndex="0"')
    expect(styles).toContain('.react-sqa-console .ai-quality-history-wrap:focus-visible')
  })


  it('keeps interactive release-policy controls in the AI quality console', () => {
    const sqaConsole = readQualityConsoleBoundary()
    const apiClient = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/platformClient.js'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    const consoleShell = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const releaseWorkspace = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiEvaluationReleaseWorkspace.jsx'), 'utf8')

    expect(sqaConsole).toContain('react-ai-release-policy-controls')
    expect(consoleShell).not.toContain('className="ai-release-policy-controls"')
    expect(releaseWorkspace).toContain('className="ai-release-policy-controls"')
    expect(sqaConsole).toContain('react-ai-preview-release-policy-button')
    expect(sqaConsole).toContain('react-ai-release-policy-result')
    expect(apiClient).toContain('previewAiEvaluationReleasePolicy')
    expect(styles).toContain('.ai-release-policy-grid')
  })


  it('keeps interactive baseline selection and run comparison in the AI quality console', () => {
    const sqaConsole = readQualityConsoleBoundary()
    const apiClient = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/platformClient.js'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    const consoleShell = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
    const releaseWorkspace = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/AiEvaluationReleaseWorkspace.jsx'), 'utf8')

    expect(sqaConsole).toContain('react-ai-baseline-comparison')
    expect(consoleShell).not.toContain('className="ai-baseline-comparison"')
    expect(releaseWorkspace).toContain('className="ai-baseline-comparison"')
    expect(sqaConsole).toContain('react-ai-current-run-select')
    expect(sqaConsole).toContain('react-ai-baseline-run-select')
    expect(sqaConsole).toContain('react-ai-comparison-result')
    expect(apiClient).toContain('compareAiEvaluationRuns')
    expect(apiClient).toContain('baselineRunId')
    expect(styles).toContain('.ai-baseline-controls')
  })

  it('keeps AI failed-case diagnostics available from evaluation history', () => {
    const sqaConsole = readQualityConsoleBoundary()
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/components/admin-quality.css'), 'utf8')

    expect(sqaConsole).toContain('react-ai-failure-drilldown')
    expect(sqaConsole).toContain('Review ${run.failedCases.length} failure')
    expect(sqaConsole).toContain('Recurring failed cases')
    expect(styles).toContain('.ai-failure-card-grid')
  })


  it('keeps go-live readiness review visible as a production approval aid', () => {
    const sqaConsole = readQualityConsoleBoundary()
    const cypressSpec = fs.readFileSync(path.join(projectRoot, 'cypress/react/reactOperationsIntelligence.cy.js'), 'utf8')
    const selectorMap = fs.readFileSync(path.join(projectRoot, 'cypress/react/support/reactSelectors.js'), 'utf8')

    expect(sqaConsole).toContain("title: 'Go-Live Readiness Review'")
    expect(sqaConsole).toContain('recommendedManualPath')
    expect(sqaConsole).toContain('required for release authorization')
    expect(sqaConsole).toContain('before authorizing an operational release')
    expect(sqaConsole).toContain("'Assigned administrator'")
    expect(sqaConsole).not.toContain('Admin demo user')
    expect(sqaConsole).not.toContain('before publishing')
    expect(sqaConsole).not.toContain('presenting or publishing')
    expect(sqaConsole).toContain('react-go-live-readiness-panel')
    expect(cypressSpec).toContain('shows actionable turnaround risks instead of engineering release controls')
    expect(selectorMap).toContain("sqaGoLiveButton: 'react-sqa-go-live-button'")
  })
  it('keeps safe CRUD ship payloads aligned with the React SQA fixture contract', () => {
    const sqaConsole = readQualityConsoleBoundary()
    const cypressSpec = fs.readFileSync(path.join(projectRoot, 'cypress/react/reactOperationsIntelligence.cy.js'), 'utf8')
    const selectorMap = fs.readFileSync(path.join(projectRoot, 'cypress/react/support/reactSelectors.js'), 'utf8')

    expect(sqaConsole).toContain("title: 'Safe CRUD Workflow'")
    expect(sqaConsole).toContain('temporaryRecordCreated')
    expect(cypressSpec).toContain('continues from intelligence to team setup and the full operational role workflow')
    expect(cypressSpec).toContain('rs.operationsIntelligenceRoleButton')
    expect(selectorMap).toContain("sqaCrudButton: 'react-sqa-crud-button'")
  })

  it('keeps the safe CRUD workflow cleanup result visible to manual SQA users', () => {
    const sqaConsole = readQualityConsoleBoundary()

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


  it('keeps the completed AI adversarial resilience summary visible in the Quality Console', () => {
    const sqaConsole = readQualityConsoleBoundary()

    expect(sqaConsole).toContain('react-ai-adversarial-summary-panel')
    expect(sqaConsole).toContain('AI safety and resilience validation')
    expect(sqaConsole).toContain('react-ai-adversarial-suite-list')
    expect(sqaConsole).toContain('ai-adversarial-dashboard__header')
    expect(sqaConsole).toContain('ai-adversarial-metrics')
    expect(sqaConsole).toContain('ai-adversarial-suite-table__metric')
    expect(sqaConsole).toContain('ai-adversarial-dashboard__footer')
    expect(sqaConsole).toContain('getAiAdversarialQualitySummary')
    expect(sqaConsole).toContain('Production capabilities fully integrated')
    expect(sqaConsole).not.toContain('Phase 5 safety and resilience gate')
  })
})
