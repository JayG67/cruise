const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('operations intelligence product boundary', () => {
  const app = read('frontend/react/src/App.jsx')
  const component = read('frontend/react/src/components/OperationsIntelligenceCenter.jsx')
  const domain = read('frontend/react/src/domain/operationsIntelligence.js')
  const css = read('frontend/react/src/styles/components/operations-intelligence.css')
  const turnaroundClient = read('frontend/react/src/api/turnaroundClient.js')

  test('replaces the engineering quality console with an operational workspace', () => {
    expect(app).toContain("import('./components/OperationsIntelligenceCenter.jsx')")
    expect(app).toContain('react-operations-intelligence')
    expect(app).not.toContain("import('./components/ReactSqaConsole.jsx')")
    expect(app).not.toContain("openWorkspace('react-quality'")
    expect(app).not.toContain('Open Quality Console')
  })

  test('presents actionable turnaround information and workflow continuation', () => {
    expect(component).toContain('Prioritize the turnarounds that need action')
    expect(component).toContain('react-operations-intelligence-select')
    expect(component).toContain('react-operations-intelligence-priority-list')
    expect(component).toContain('Review team setup')
    expect(component).toContain('Open operational role workspace')
    expect(component).toContain('Refresh operational data')
    expect(component).toContain('aria-live="polite"')
  })

  test('always reloads live turnaround data instead of reusing browser cache', () => {
    expect(turnaroundClient).toContain("cache: 'no-store'")
    expect(turnaroundClient).toContain("requestJson('/cruise/turnaround-operations'")
  })

  test('keeps operational prioritization in a pure domain module', () => {
    expect(domain).toContain('function buildOperationsIntelligence')
    expect(domain).toContain('function buildPriorityActions')
    expect(domain).toContain('function getOperationalRisk')
    expect(domain).not.toContain('useState')
    expect(domain).not.toContain('<section')
  })

  test('owns readable responsive presentation', () => {
    expect(css).toContain('.operations-intelligence-detail')
    expect(css).toContain('background: #f8fbfe')
    expect(css).toContain('color: #071827')
    expect(css).toContain('@media (max-width: 860px)')
    expect(css).toContain('grid-template-columns: minmax(0, 1fr)')
  })
})
