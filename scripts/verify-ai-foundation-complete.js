const fs = require('fs')
const path = require('path')
const { assertAiFoundationComplete } = require('../services/aiFoundationCompletion.service')

const root = path.join(__dirname, '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const completion = assertAiFoundationComplete({ env: { ...process.env, AI_PROVIDER: process.env.AI_PROVIDER || 'disabled' } })
const statusSource = read('services/aiProgramStatus.service.js')
const packageJson = JSON.parse(read('package.json'))

assert(completion.status === 'COMPLETE', 'Phase 1 completion status must be COMPLETE.')
assert(completion.percentComplete === 100, 'Phase 1 completion must be exactly 100%.')
assert(completion.phaseTwoStarted === false, 'Phase 2 must remain unstarted during Phase 1 closeout.')
assert(statusSource.includes("{ phase: 1, name: 'AI foundation', status: 'COMPLETE' }"), 'Program status must mark Phase 1 complete.')
assert(statusSource.includes("{ phase: 2, name: 'Turnaround briefing', status: 'NOT_STARTED' }"), 'Program status must keep Phase 2 not started.')
assert(statusSource.includes('currentPhasePercentComplete: 100'), 'Program status must report Phase 1 at 100%.')
assert(packageJson.scripts['ai:foundation:complete'], 'Missing ai:foundation:complete script.')
assert(packageJson.scripts['test:all'].includes('ai:foundation:complete'), 'test:all must run ai:foundation:complete.')
assert(packageJson.scripts['release:preflight'].includes('ai:foundation:complete'), 'release:preflight must run ai:foundation:complete.')

console.log('AI Phase 1 foundation completion audit passed.')
console.log(`Completion criteria: ${completion.completionCriteria.length}`)
console.log('Phase 1: 100% COMPLETE')
console.log('Phase 2: NOT_STARTED')
