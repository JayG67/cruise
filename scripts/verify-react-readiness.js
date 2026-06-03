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
  if (!content.includes(expected)) {
    throw new Error(`${label} must include: ${expected}`)
  }
}

function assertExcludes(content, unexpected, label) {
  if (content.includes(unexpected)) {
    throw new Error(`${label} must not include: ${unexpected}`)
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
const expressApp = readFile('app.js')
const app = readFile('frontend/react/src/App.jsx')

assertScript(packageJson, 'react:readiness:audit', 'node scripts/verify-react-readiness.js')
assertScript(packageJson, 'react:build', 'vite build --config frontend/react/vite.config.js')
assertScript(packageJson, 'react:production:complete', 'node scripts/verify-react-production-complete.js')
assertScript(packageJson, 'react:dev', 'vite --config frontend/react/vite.config.js')
assertScript(packageJson, 'react:dev:local', 'start-server-and-test start http://localhost:8000 react:dev')
assertScript(packageJson, 'react:production:audit', 'react:production:complete')
assertScript(packageJson, 'react:production:audit', 'browserTests:react')
assertScript(packageJson, 'uiTests:react', 'http://localhost:8000')
assertScript(packageJson, 'playwright:mobile:react', 'http://localhost:8000')

assertIncludes(viteConfig, "'/cruise'", 'React Vite proxy')
assertIncludes(viteConfig, "'/health'", 'React Vite proxy')
assertIncludes(viteConfig, "'/admin'", 'React Vite proxy')
assertIncludes(viteConfig, 'http://localhost:8000', 'React Vite proxy')
assertIncludes(viteConfig, 'REACT_API_PROXY_TARGET', 'React Vite proxy')
assertIncludes(expressApp, "app.get('/', sendReactApp)", 'Express React app host')
assertIncludes(expressApp, "app.use('/app-next', express.static(reactBuildDir, { redirect: false }))", 'Express React compatibility route')
assertIncludes(expressApp, "app.use('/images', express.static(publicImagesDir, { redirect: false }))", 'Express shared image asset route')
assertExcludes(expressApp, 'CRUISE_DEFAULT_EXPERIENCE', 'Express app')
assertExcludes(expressApp, "app.use('/legacy'", 'Express app')
assertIncludes(app, 'react-production-parity-shell', 'React app shell')
assertIncludes(app, 'ReactQueryStatusPanel', 'React app shell')

console.log('React readiness audit passed.')
