const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('Operational dashboard draft ownership', () => {
  it('centralizes keyed draft state without hiding operation-specific payload behavior', () => {
    const coordinator = read('frontend/react/src/components/operations/useOperationalDashboardDrafts.js')
    const keyedDrafts = read('frontend/react/src/components/operations/useKeyedDrafts.js')

    expect(coordinator).toContain("import { useKeyedDrafts } from './useKeyedDrafts.js'")
    expect(coordinator).toContain('const operationCommands = useKeyedDrafts(buildOperationCommandDraft)')
    expect(coordinator).toContain('const taskDetails = useKeyedDrafts(buildTaskDetailDraft)')
    expect(coordinator).toContain('async function saveAndClear')
    expect(coordinator).toContain('plannedCount: Number(draft.plannedCount || 0)')
    expect(coordinator).toContain("status: 'READY'")
    expect(coordinator).not.toContain('useState(')

    expect(keyedDrafts).toContain('export function useKeyedDrafts(buildDraft)')
    expect(keyedDrafts).toContain('function getDraft(key, ...builderArguments)')
    expect(keyedDrafts).toContain('function updateDraft(key, fieldName, value, ...builderArguments)')
    expect(keyedDrafts).toContain('function clearDraft(key)')
    expect((keyedDrafts.match(/useState\(/g) || [])).toHaveLength(1)
  })
})
