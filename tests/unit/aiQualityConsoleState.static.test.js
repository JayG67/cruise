const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('AI quality console state ownership', () => {
  it('keeps AI evidence orchestration in a dedicated hook', () => {
    const consoleShell = read('frontend/react/src/components/ReactSqaConsole.jsx')
    const stateHook = read('frontend/react/src/components/useAiQualityConsoleState.js')

    expect(consoleShell).toContain("import useAiQualityConsoleState from './useAiQualityConsoleState.js'")
    expect(consoleShell).toContain('const aiQualityConsoleState = useAiQualityConsoleState(selectedDemoUser)')
    expect(consoleShell).toContain('<AiQualityEvidenceWorkspace {...aiQualityConsoleState} />')
    expect(consoleShell).not.toContain('getAiEvaluationQualitySummary')
    expect(consoleShell).not.toContain('compareAiEvaluationRuns')
    expect(consoleShell).not.toContain('previewAiEvaluationReleasePolicy')

    expect(stateHook).toContain('getAiCiEvidenceSummary({ selectedDemoUser })')
    expect(stateHook).toContain('getAiAdversarialQualitySummary({ selectedDemoUser })')
    expect(stateHook).toContain('getAiEvaluationQualitySummary({ selectedDemoUser, limit: 10 })')
    expect(stateHook).toContain('filterAndSortAiRuns(aiQualitySummary?.runs')
    expect(stateHook).toContain('compareAiEvaluationRuns(currentAiRunId, baselineAiRunId, { selectedDemoUser })')
    expect(stateHook).toContain('previewAiEvaluationReleasePolicy({')
  })
})
