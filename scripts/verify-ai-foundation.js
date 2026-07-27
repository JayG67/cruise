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

const { getAiProgramStatus } = require(path.join(root, 'services/aiProgramStatus.service.js'))
const programStatus = getAiProgramStatus()
const phaseOneStatus = programStatus.phases.find(phase => phase.phase === 1)
const phaseThreeStatus = programStatus.phases.find(phase => phase.phase === 3)

assert(phaseOneStatus?.status === 'COMPLETE', 'Phase 1 must remain complete after later phases start.')
assert(programStatus.phaseOneCapabilities?.phaseOneComplete === true, 'Phase 1 capability status must remain complete.')
assert(phaseThreeStatus?.status === 'COMPLETE', 'Phase 3 must remain complete while Phase 1 remains complete.')
assert(programStatus.currentPhase >= 4, 'Phase 4 or a later phase must be current.')
assert(programStatus.completedPhases >= 3, 'At least the first three AI phases must remain complete.')

console.log('AI foundation architecture audit passed.')
console.log(`Required foundation files: ${requiredFiles.length}`)
