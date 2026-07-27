const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('AI Phase 1 foundation static contracts', () => {
  it('keeps completed AI phases stable while later phases progress', () => {
    const status = read('services/aiProgramStatus.service.js')
    expect(status).toContain("{ phase: 1, name: 'AI foundation', status: 'COMPLETE' }")
    expect(status).toContain("{ phase: 2, name: 'Turnaround briefing', status: 'COMPLETE' }")
    expect(status).toContain("{ phase: 3, name: 'Evaluation harness', status: 'COMPLETE' }")
    expect(status).toContain("{ phase: 4, name: 'AI Quality Console', status: 'IN_PROGRESS' }")
  })

  it('keeps credentials server-only and pricing explicitly configurable', () => {
    const envExample = read('.env.example')
    expect(envExample).toContain('OPENAI_API_KEY=')
    expect(envExample).toContain('OPENAI_INPUT_USD_PER_MILLION_TOKENS=0')
    expect(envExample).toContain('OPENAI_OUTPUT_USD_PER_MILLION_TOKENS=0')
    expect(envExample).not.toContain('VITE_OPENAI_API_KEY')
  })
})
