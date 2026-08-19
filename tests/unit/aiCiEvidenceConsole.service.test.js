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

  test('normalizes current evidence and historical changes from authoritative checks', () => {
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-evidence.json'), JSON.stringify({
      releaseDecision: ' APPROVED ',
      generatedAt: '2026-08-17T20:00:00Z',
      checks: [{ id: 'one', status: 'PASSED' }, { id: 'two', status: 'FAILED' }, null, 'bad'],
      totals: { checks: 999, passed: 999, failed: 0 }
    }))
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-comparison.json'), JSON.stringify({ outcome: ' IMPROVEMENT ', newFailures: [], resolvedFailures: ['one'], unchangedFailures: [] }))

    expect(buildAiCiEvidenceConsoleSummary({ evidenceDir })).toEqual(expect.objectContaining({
      state: 'AVAILABLE',
      releaseDecision: 'APPROVED',
      generatedAt: '2026-08-17T20:00:00Z',
      totals: { checks: 2, passed: 1, failed: 1 },
      checks: [{ id: 'one', status: 'PASSED' }, { id: 'two', status: 'FAILED' }],
      comparison: expect.objectContaining({ outcome: 'IMPROVEMENT', resolvedFailures: ['one'] })
    }))
  })

  test('fails closed for malformed evidence JSON shapes and malformed comparison collections', () => {
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-evidence.json'), JSON.stringify([]))
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-comparison.json'), JSON.stringify({ outcome: 42, newFailures: 'bad', resolvedFailures: null, unchangedFailures: {} }))

    const summary = buildAiCiEvidenceConsoleSummary({ evidenceDir })

    expect(summary.state).toBe('INVALID')
    expect(summary.releaseDecision).toBe('NO_DATA')
    expect(summary.message).toContain('could not be parsed')
    expect(summary.error).toBe('Evidence JSON must contain an object.')
    expect(summary.comparison).toEqual({ state: 'AVAILABLE', outcome: 'INVALID', newFailures: [], resolvedFailures: [], unchangedFailures: [] })
  })

  test('reports invalid JSON parse errors without converting them into no-data evidence', () => {
    fs.writeFileSync(path.join(evidenceDir, 'phase6-ci-evidence.json'), '{ invalid json')

    const summary = buildAiCiEvidenceConsoleSummary({ evidenceDir })

    expect(summary.state).toBe('INVALID')
    expect(summary.releaseDecision).toBe('NO_DATA')
    expect(summary.error).toEqual(expect.any(String))
    expect(summary.comparison.outcome).toBe('NO_BASELINE')
  })
})
