const fs = require('fs')
const os = require('os')
const path = require('path')
const { buildAiCiEvidenceConsoleSummary } = require('../../services/aiCiEvidenceConsole.service')

describe('AI CI evidence Quality Console summary', () => {
  let evidenceDir
  beforeEach(() => { evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-ci-console-')) })
  afterEach(() => fs.rmSync(evidenceDir, { recursive: true, force: true }))

  test('reports no-data state when CI artifacts are unavailable', () => {
    expect(buildAiCiEvidenceConsoleSummary({ evidenceDir })).toEqual(expect.objectContaining({ state: 'NO_DATA', releaseDecision: 'NO_DATA' }))
  })

  test('normalizes current evidence and historical changes', () => {
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-evidence.json'), JSON.stringify({ releaseDecision: 'APPROVED', checks: [{ id: 'one', status: 'PASSED' }], totals: { checks: 1, passed: 1, failed: 0 } }))
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-comparison.json'), JSON.stringify({ outcome: 'IMPROVEMENT', newFailures: [], resolvedFailures: ['one'], unchangedFailures: [] }))
    expect(buildAiCiEvidenceConsoleSummary({ evidenceDir })).toEqual(expect.objectContaining({ state: 'AVAILABLE', releaseDecision: 'APPROVED', comparison: expect.objectContaining({ outcome: 'IMPROVEMENT', resolvedFailures: ['one'] }) }))
  })
})
