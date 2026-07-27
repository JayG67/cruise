const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('AI Phase 1 foundation static contracts', () => {
  it('keeps Phase 1 complete while Phase 2 is in progress', () => {
    const status = read('services/aiProgramStatus.service.js')
    expect(status).toContain("{ phase: 1, name: 'AI foundation', status: 'COMPLETE' }")
    expect(status).toContain("{ phase: 2, name: 'Turnaround briefing', status: 'IN_PROGRESS' }")
    expect(status).toContain('currentPhasePercentComplete: 60')
  })

  it('keeps credentials server-only and pricing explicitly configurable', () => {
    const envExample = read('.env.example')
    expect(envExample).toContain('OPENAI_API_KEY=')
    expect(envExample).toContain('OPENAI_INPUT_USD_PER_MILLION_TOKENS=0')
    expect(envExample).toContain('OPENAI_OUTPUT_USD_PER_MILLION_TOKENS=0')
    expect(envExample).not.toContain('VITE_OPENAI_API_KEY')
  })
})
