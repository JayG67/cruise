const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const artifactDirectory = path.join(projectRoot, 'ai-quality-evidence')
const artifactPath = path.join(artifactDirectory, 'phase6-ci-evidence.json')

const checks = [
  { id: 'phase-1-foundation', command: 'npm', args: ['run', 'ai:foundation:complete'] },
  { id: 'phase-2-briefing', command: 'npm', args: ['run', 'ai:phase2:complete'] },
  { id: 'phase-3-evaluation', command: 'npm', args: ['run', 'ai:phase3:complete'] },
  { id: 'phase-4-quality-console', command: 'npm', args: ['run', 'ai:phase4:complete'] },
  { id: 'phase-5-adversarial-audit', command: 'npm', args: ['run', 'ai:phase5:audit'] },
  { id: 'phase-5-completion', command: 'npm', args: ['run', 'ai:phase5:complete'] },
  { id: 'ai-regression-tests', command: 'npm', args: ['run', 'ai:phase5:test'] }
]

function runCheck(check) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(check.command, check.args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1' }
  })

  return {
    id: check.id,
    command: [check.command, ...check.args].join(' '),
    status: result.status === 0 ? 'PASSED' : 'FAILED',
    exitCode: Number.isInteger(result.status) ? result.status : 1,
    startedAt,
    completedAt: new Date().toISOString(),
    stdout: String(result.stdout || '').trim().slice(-4000),
    stderr: String(result.stderr || '').trim().slice(-4000)
  }
}

fs.mkdirSync(artifactDirectory, { recursive: true })
const results = checks.map(runCheck)
const failedChecks = results.filter(result => result.status === 'FAILED')
const evidence = {
  schemaVersion: 1,
  phase: 6,
  gate: 'AI CI quality gate',
  generatedAt: new Date().toISOString(),
  git: {
    sha: process.env.GITHUB_SHA || null,
    ref: process.env.GITHUB_REF || null,
    runId: process.env.GITHUB_RUN_ID || null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT || null
  },
  status: failedChecks.length === 0 ? 'PASSED' : 'FAILED',
  releaseDecision: failedChecks.length === 0 ? 'APPROVED' : 'BLOCKED',
  totalChecks: results.length,
  passedChecks: results.length - failedChecks.length,
  failedChecks: failedChecks.length,
  checks: results
}

fs.writeFileSync(artifactPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(`AI CI quality evidence written to ${path.relative(projectRoot, artifactPath)}`)
console.log(`Release decision: ${evidence.releaseDecision}`)
console.log(`Checks passed: ${evidence.passedChecks}/${evidence.totalChecks}`)

if (failedChecks.length > 0) process.exitCode = 1
