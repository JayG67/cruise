const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  const fullPath = path.join(projectRoot, relativePath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Expected file to exist: ${relativePath}`)
  }

  return fs.readFileSync(fullPath, 'utf8')
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'coverage') {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }

  return files
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function countMatches(content, pattern) {
  const matches = content.match(pattern)
  return matches ? matches.length : 0
}

const appCss = read('frontend/react/src/styles/app.css')
const designSystemCss = read('frontend/react/src/styles/design-system.css')
const main = read('frontend/react/src/main.jsx')
const packageJson = JSON.parse(read('package.json'))

// Do not remove `frontend/react/src/styles/app.css` yet; this script inventories runtime CSS references until the compatibility layer is retired.

const projectFiles = walk(projectRoot)
  .filter((filePath) => /\.(js|jsx|css)$/.test(filePath))
  .filter((filePath) => !filePath.endsWith(path.join('scripts', 'verify-css-legacy-retirement.js')))

const appCssReferenceFiles = projectFiles.filter((filePath) => {
  const relativePath = path.relative(projectRoot, filePath)
  const content = fs.readFileSync(filePath, 'utf8')
  return relativePath !== 'frontend/react/src/styles/app.css' && content.includes('app.css')
})

const testReferences = appCssReferenceFiles.filter((filePath) => path.relative(projectRoot, filePath).startsWith('tests/'))
const scriptReferences = appCssReferenceFiles.filter((filePath) => path.relative(projectRoot, filePath).startsWith('scripts/'))
const appCssLineCount = appCss.split(/\r?\n/).length
const appCssImportantCount = countMatches(appCss, /!important/g)
const designSystemLineCount = designSystemCss.split(/\r?\n/).length
const designSystemImportantCount = countMatches(designSystemCss, /!important/g)

assert(
  main.includes("import './styles/index.css'"),
  'main.jsx must load the CSS architecture entrypoint while legacy stylesheets remain compatibility layers'
)

const cssIndex = read('frontend/react/src/styles/index.css')

assert(
  cssIndex.indexOf("@import './app.css';") < cssIndex.indexOf("@import './design-system.css';"),
  'index.css must load app.css before design-system.css while the legacy compatibility layer remains in use'
)

assert(
  appCss.includes('LEGACY STYLESHEET - Cruise Explorer CSS Foundation Refactor'),
  'app.css must remain explicitly labeled as the legacy stylesheet until it is removed'
)

assert(
  designSystemCss.includes('CSS Foundation Refactor - Phase 23'),
  'design-system.css must include the Phase 23 production hero retirement marker'
)

assert(
  packageJson.scripts['css:legacy:audit'] === 'node scripts/verify-css-legacy-retirement.js',
  'package.json must expose css:legacy:audit'
)

assert(
  packageJson.scripts['css:foundation:audit'].includes('css:legacy:audit'),
  'css:foundation:audit must include the legacy retirement audit'
)

assert(
  appCssReferenceFiles.length > 0,
  'legacy app.css reference inventory should remain visible until retirement is complete'
)

assert(
  testReferences.length > 0,
  'tests still reference app.css, so the retirement audit should continue reporting test dependencies'
)

assert(
  designSystemLineCount < appCssLineCount,
  'design-system.css should shrink below app.css as mature primitives move into layered architecture files'
)

assert(
  appCssLineCount < 10000,
  'app.css should stay under 10,000 lines after Phase 25 retired the main React compatibility layer'
)

console.log('CSS legacy retirement audit passed.')
console.log(JSON.stringify({
  appCssLineCount,
  designSystemLineCount,
  appCssImportantCount,
  designSystemImportantCount,
  appCssReferenceFileCount: appCssReferenceFiles.length,
  appCssTestReferenceFileCount: testReferences.length,
  appCssScriptReferenceFileCount: scriptReferences.length,
}, null, 2))
