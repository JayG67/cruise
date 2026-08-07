const fs = require('fs')
const path = require('path')

test('keeps automated CI release evidence visible in the Quality Console', () => {
  const consoleComponent = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/ReactSqaConsole.jsx'), 'utf8')
  const evidenceWorkspace = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/components/AiQualityEvidenceWorkspace.jsx'), 'utf8')
  const client = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/api/platformClient.js'), 'utf8')
  const qualityConsoleBoundary = `${consoleComponent}\n${evidenceWorkspace}`

  expect(consoleComponent).toContain("import AiQualityEvidenceWorkspace from './AiQualityEvidenceWorkspace.jsx'")
  expect(consoleComponent).toContain('<AiQualityEvidenceWorkspace')
  expect(qualityConsoleBoundary).toContain('react-ai-ci-evidence-panel')
  expect(qualityConsoleBoundary).toContain('Continuous integration quality gate')
  expect(qualityConsoleBoundary).toContain('New failures:')
  expect(qualityConsoleBoundary).toContain('Resolved failures:')
  expect(qualityConsoleBoundary).not.toContain('Phase 6 automated release gate')
  expect(client).toContain("'/ai/ci-evidence/summary'")
})
