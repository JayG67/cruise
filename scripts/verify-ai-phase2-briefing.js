const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const requiredFiles = [
  'services/aiTurnaroundEvidence.service.js',
  'services/aiOperationalTurnaroundBriefing.service.js',
  'services/aiTurnaroundBriefingReview.service.js',
  'tests/unit/aiTurnaroundEvidence.service.test.js',
  'tests/unit/aiOperationalTurnaroundBriefing.service.test.js',
  'tests/unit/aiTurnaroundBriefingReview.service.test.js'
]
requiredFiles.forEach(relativePath => assert(fs.existsSync(path.join(root, relativePath)), `Missing Phase 2 file: ${relativePath}`))

const routes = read('routes/ai.routes.js')
const controller = read('controllers/ai.controller.js')
const status = read('services/aiProgramStatus.service.js')
const generation = read('services/aiTurnaroundBriefing.service.js')
const review = read('services/aiTurnaroundBriefingReview.service.js')
const packageJson = JSON.parse(read('package.json'))

assert(routes.includes("/turnaround-operations/:operationId/briefing"), 'Missing operation-scoped briefing route.')
assert(routes.includes("/turnaround-operations/:operationId/briefings"), 'Missing briefing history route.')
assert(routes.includes("/turnaround-operations/:operationId/briefings/:briefingId/review"), 'Missing briefing review route.')
assert(routes.includes('turnaroundBriefingReviewRequestSchema'), 'Briefing review route must validate its request.')
assert(controller.includes('loadTurnaroundEvidence(req.params.operationId)'), 'Controller must load evidence server-side.')
assert(controller.includes('canAccessTurnaroundOperationForRequest'), 'Controller must enforce turnaround operation scope.')
assert(generation.includes('briefingId'), 'Generated briefings must receive a stable briefing identifier.')
assert(generation.includes('briefing: response'), 'Generated briefing snapshots must be persisted in the audit event payload.')
assert(review.includes('AI_TURNAROUND_BRIEFING_REVIEWED'), 'Reviewer feedback must be persisted as an AI audit event.')
assert(status.includes("{ phase: 2, name: 'Turnaround briefing', status: 'IN_PROGRESS' }"), 'Phase 2 must be marked in progress.')
assert(status.includes('currentPhasePercentComplete: 60'), 'Phase 2 status must report 60% completion.')
assert(status.includes('briefingHistory: true'), 'Program status must expose briefing history.')
assert(status.includes('reviewerFeedback: true'), 'Program status must expose reviewer feedback.')
assert(status.includes('briefingWorkspace: false'), 'Program status must not claim the workspace is complete.')
assert(packageJson.scripts['ai:phase2:test'].includes('aiTurnaroundBriefingReview.service.test.js'), 'Phase 2 test command must include review coverage.')

console.log('AI Phase 2 turnaround briefing workflow audit passed.')
console.log(`Required Phase 2 files: ${requiredFiles.length}`)
console.log('Phase 2: IN_PROGRESS (60%)')
