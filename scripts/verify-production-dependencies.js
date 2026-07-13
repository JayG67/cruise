const { spawnSync } = require('child_process')

const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: process.platform === 'win32'
})

let report
try {
  report = JSON.parse(audit.stdout || '{}')
} catch (error) {
  console.error('Production dependency audit failed: npm audit did not return valid JSON.')
  if (audit.stderr) console.error(audit.stderr.trim())
  process.exitCode = 1
  return
}

const vulnerabilities = report.metadata?.vulnerabilities || {}
const blockingCount = (vulnerabilities.moderate || 0) + (vulnerabilities.high || 0) + (vulnerabilities.critical || 0)

if (blockingCount > 0) {
  console.error('Production dependency audit failed.')
  console.error(`Moderate: ${vulnerabilities.moderate || 0}`)
  console.error(`High: ${vulnerabilities.high || 0}`)
  console.error(`Critical: ${vulnerabilities.critical || 0}`)

  const findings = Object.entries(report.vulnerabilities || {})
    .filter(([, finding]) => ['moderate', 'high', 'critical'].includes(finding.severity))
    .map(([name, finding]) => `${name} (${finding.severity})`)

  findings.forEach(finding => console.error(`- ${finding}`))
  process.exitCode = 1
  return
}

console.log('Production dependency audit passed.')
console.log(`Production vulnerabilities: ${vulnerabilities.total || 0}`)
console.log(`Low severity accepted: ${vulnerabilities.low || 0}`)
