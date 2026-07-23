const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')

const generatedArtifactPatterns = [
  /^dist\//,
  /^build\//,
  /^coverage\//,
  /^lhci-report\//,
  /^\.lighthouseci\//,
  /^github-pages\//,
  /^playwright-report\//,
  /^test-results\//,
  /^logs\//,
  /^cypress\/(screenshots|videos)\//,
  /^lighthouse-report\.report\.(html|json)$/,
  /(^|\/)\.DS_Store$/
]

function getTrackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean)
  } catch (err) {
    console.error('Unable to inspect tracked files with git ls-files.')
    console.error(err.message)
    process.exitCode = 1
    return []
  }
}

function isGeneratedArtifact(filePath) {
  return generatedArtifactPatterns.some(pattern => pattern.test(filePath))
}

function main() {
  const trackedArtifacts = getTrackedFiles().filter(isGeneratedArtifact)

  if (trackedArtifacts.length > 0) {
    console.error('Generated/local artifact files are tracked by Git:')
    trackedArtifacts.forEach(filePath => console.error(`- ${filePath}`))
    console.error('Remove them with git rm --cached <file> and keep them ignored.')
    process.exitCode = 1
    return
  }

  const ignoredExamples = [
    'dist/',
    'build/',
    'coverage/',
    'lhci-report/',
    '.lighthouseci/',
    'playwright-report/',
    'test-results/',
    'logs/',
    'cypress/screenshots/',
    'cypress/videos/',
    '.DS_Store'
  ]

  const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')
  const missingIgnores = ignoredExamples.filter(entry => !gitignore.includes(entry))

  if (missingIgnores.length > 0) {
    console.error('Missing expected .gitignore entries:')
    missingIgnores.forEach(entry => console.error(`- ${entry}`))
    process.exitCode = 1
    return
  }

  console.log('Repository hygiene check passed.')
}

main()
