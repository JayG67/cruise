const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const requiredFiles = [
  'frontend/react/src/api/client.js',
  'frontend/react/src/hooks/useAdminHierarchySnapshot.js',
  'frontend/react/src/App.jsx',
  'frontend/react/src/components/CustomerBookingHierarchy.jsx',
  'docs/react-migration-plan.md'
]

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(projectRoot, file)))

if (missingFiles.length > 0) {
  console.error(`Missing React Stage 2 files:
${missingFiles.join('\n')}`)
  process.exit(1)
}

const client = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
const hook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useAdminHierarchySnapshot.js'), 'utf8')
const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

const expectedClientExports = [
  'export async function requestJson',
  'export async function getCustomers',
  'export async function getBookings',
  'export async function getAdminHierarchySnapshot'
]

const missingExports = expectedClientExports.filter(exportName => !client.includes(exportName))

if (missingExports.length > 0) {
  console.error(`React Stage 2 API client is missing exports:
${missingExports.join('\n')}`)
  process.exit(1)
}

if (!hook.includes('AbortController') || !hook.includes('reload') || !hook.includes('getAdminHierarchySnapshot')) {
  console.error('React Stage 2 hook must support cancellable loading and retryable snapshot reloads.')
  process.exit(1)
}

if (!app.includes('useAdminHierarchySnapshot') || !app.includes('onRetry={reload}')) {
  console.error('React app must consume the Stage 2 loading hook and pass retry behavior to the hierarchy component.')
  process.exit(1)
}

if (!component.includes('Retry loading snapshot') || !component.includes('data-testid="react-admin-hierarchy"')) {
  console.error('React hierarchy component must expose retry UX and stable migration test ids.')
  process.exit(1)
}

console.log('React Stage 2 API boundary and retry guardrails verified.')
