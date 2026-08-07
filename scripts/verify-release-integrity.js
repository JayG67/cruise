const { execFileSync } = require('child_process')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const allowDirty = process.env.RELEASE_INTEGRITY_ALLOW_DIRTY === 'true'

function git(args) {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim()
}

function fail(message, details = []) {
  console.error(message)
  details.forEach(detail => console.error(`- ${detail}`))
  process.exitCode = 1
}

function main() {
  let repositoryRoot
  try {
    repositoryRoot = git(['rev-parse', '--show-toplevel'])
  } catch (error) {
    fail('Release integrity check requires a Git working tree.', [error.message])
    return
  }

  if (path.resolve(repositoryRoot) !== projectRoot) {
    fail('Release integrity check must run from the repository root.', [repositoryRoot])
    return
  }

  const branch = git(['branch', '--show-current']) || '(detached HEAD)'
  const commit = git(['rev-parse', '--short=12', 'HEAD'])
  const statusLines = git(['status', '--porcelain=v1', '--untracked-files=all'])
    .split(/\r?\n/)
    .filter(Boolean)

  if (statusLines.length > 0 && !allowDirty) {
    fail('Release integrity check failed: the working tree is not clean.', statusLines)
    console.error('Commit or intentionally discard every change before creating a release tag or deploying this revision.')
    return
  }

  const trackedGeneratedFiles = git(['ls-files'])
    .split(/\r?\n/)
    .filter(filePath => /^(dist|coverage|build|playwright-report|test-results|lhci-report|github-pages|logs)\//.test(filePath))

  if (trackedGeneratedFiles.length > 0) {
    fail('Release integrity check failed: generated artifacts are tracked.', trackedGeneratedFiles)
    return
  }

  console.log('Release integrity check passed.')
  console.log(`Branch: ${branch}`)
  console.log(`Commit: ${commit}`)
  console.log(`Working tree: ${statusLines.length === 0 ? 'clean' : 'dirty override enabled for local validation'}`)
}

main()
