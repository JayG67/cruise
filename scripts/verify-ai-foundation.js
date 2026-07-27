const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const requiredFiles = [
  'ai/contracts/turnaroundBriefing.contract.js',
  'ai/contracts/turnaroundBriefing.jsonSchema.js',
  'ai/prompts/turnaroundBriefing.prompt.js',
  'services/aiProvider.service.js',
  'services/openAiResponsesProvider.service.js',
  'services/aiProviderExecution.service.js',
  'services/aiRuntimeConfig.service.js',
  'services/aiCostEstimation.service.js',
  'services/aiTelemetry.service.js',
  'services/aiFoundationReadiness.service.js',
  'services/aiFoundationCompletion.service.js',
  'services/aiTurnaroundBriefing.service.js',
  'services/aiProgramStatus.service.js',
  'controllers/ai.controller.js',
  'routes/ai.routes.js',
  'validation/ai.validation.js'
]

requiredFiles.forEach(relativePath => {
  assert(fs.existsSync(path.join(root, relativePath)), `Missing AI foundation file: ${relativePath}`)
})

const envExample = read('.env.example')
;[
  'AI_PROVIDER=',
  'AI_TIMEOUT_MS=',
  'AI_MAX_ATTEMPTS=',
  'AI_RETRY_DELAY_MS=',
  'AI_MAX_CONTEXT_CHARS=',
  'OPENAI_API_KEY=',
  'OPENAI_MODEL=',
  'OPENAI_INPUT_USD_PER_MILLION_TOKENS=',
  'OPENAI_OUTPUT_USD_PER_MILLION_TOKENS='
].forEach(marker => assert(envExample.includes(marker), `.env.example must include ${marker}`))

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts['ai:foundation:test'], 'Missing ai:foundation:test script.')
assert(packageJson.scripts['ai:foundation:audit'], 'Missing ai:foundation:audit script.')
assert(packageJson.scripts['ai:foundation:readiness'], 'Missing ai:foundation:readiness script.')
assert(packageJson.scripts['ai:foundation:complete'], 'Missing ai:foundation:complete script.')
assert(packageJson.scripts['test:all'].includes('ai:foundation:audit'), 'test:all must run ai:foundation:audit.')
assert(packageJson.scripts['release:preflight'].includes('ai:foundation:audit'), 'release:preflight must run ai:foundation:audit.')

const statusSource = read('services/aiProgramStatus.service.js')
assert(statusSource.includes("{ phase: 1, name: 'AI foundation', status: 'COMPLETE' }"), 'Phase 1 must remain complete after later phases start.')
assert(statusSource.includes("status: 'COMPLETE'"), 'Phase 1 must be marked complete.')
assert(statusSource.includes('phaseOneComplete: true'), 'Phase 1 capability status must remain complete.')
assert(statusSource.includes("{ phase: 3, name: 'Evaluation harness', status: 'NOT_STARTED' }"), 'Phase 3 must remain not started.')
assert(statusSource.includes("currentPhase: 2"), 'Phase 2 must be the current phase after Phase 1 completion.')

console.log('AI foundation architecture audit passed.')
console.log(`Required foundation files: ${requiredFiles.length}`)
