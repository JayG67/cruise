const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')

function readFile(relativePath) {
  const filePath = path.join(projectRoot, relativePath)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${relativePath}`)
  }

  return fs.readFileSync(filePath, 'utf8')
}

function assertIncludes(content, expected, label) {
  if (typeof content !== 'string') {
    throw new Error(`${label} could not be read before checking for: ${expected}`)
  }

  if (!content.includes(expected)) {
    throw new Error(`${label} must include: ${expected}`)
  }
}

function assertScript(packageJson, scriptName, expected) {
  const script = packageJson.scripts && packageJson.scripts[scriptName]

  if (typeof script !== 'string') {
    throw new Error(`package.json must define script: ${scriptName}`)
  }

  assertIncludes(script, expected, `${scriptName} script`)
}

const packageJson = JSON.parse(readFile('package.json'))
const viteConfig = readFile('frontend/react/vite.config.js')
const app = readFile('frontend/react/src/App.jsx')
const readinessDoc = readFile('docs/react-cutover-checklist.md')
const migrationPlan = readFile('docs/react-migration-plan.md')

assertScript(packageJson, 'react:readiness:audit', 'node scripts/verify-react-readiness.js')
assertScript(packageJson, 'react:build', 'vite build --config frontend/react/vite.config.js')
assertScript(packageJson, 'react:dev', 'vite --config frontend/react/vite.config.js')
assertScript(packageJson, 'react:dev:local', 'start-server-and-test start http://localhost:8000 react:dev')

assertIncludes(viteConfig, "'/cruise'", 'React Vite proxy')
assertIncludes(viteConfig, "'/health'", 'React Vite proxy')
assertIncludes(viteConfig, "'/admin'", 'React Vite proxy')
assertIncludes(viteConfig, 'http://localhost:8000', 'React Vite proxy')
assertIncludes(viteConfig, 'REACT_API_PROXY_TARGET', 'React Vite proxy')

assertIncludes(app, 'React migration preview', 'React preview app')
assertIncludes(app, 'ReactQueryStatusPanel', 'React preview app')
assertIncludes(readinessDoc, '/app-next', 'React cutover checklist')
assertIncludes(migrationPlan, 'React Cutover Plan', 'React migration plan')
assertIncludes(migrationPlan, 'react:readiness:audit', 'React migration plan')

console.log('React readiness audit passed.')
