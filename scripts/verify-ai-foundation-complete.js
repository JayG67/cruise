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
assert(completion.phaseTwoStarted === true, 'Phase 2 should be allowed to proceed after Phase 1 completion.')
assert(statusSource.includes("{ phase: 1, name: 'AI foundation', status: 'COMPLETE' }"), 'Program status must mark Phase 1 complete.')
assert(statusSource.includes("{ phase: 2, name: 'Turnaround briefing', status: 'COMPLETE' }"), 'Program status must mark Phase 2 complete.')
assert(statusSource.includes('phaseOneComplete: true'), 'Program status must preserve Phase 1 completion.')
assert(packageJson.scripts['ai:foundation:complete'], 'Missing ai:foundation:complete script.')
assert(packageJson.scripts['test:all'].includes('ai:foundation:complete'), 'test:all must run ai:foundation:complete.')
assert(packageJson.scripts['release:preflight'].includes('ai:foundation:complete'), 'release:preflight must run ai:foundation:complete.')

console.log('AI Phase 1 foundation completion audit passed.')
console.log(`Completion criteria: ${completion.completionCriteria.length}`)
console.log('Phase 1: 100% COMPLETE')
console.log('Phase 2: COMPLETE')
