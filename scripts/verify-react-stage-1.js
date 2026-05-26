const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const requiredFiles = [
  'frontend/react/src/domain/adminHierarchy.js',
  'frontend/react/src/components/CustomerBookingHierarchy.jsx',
  'frontend/react/src/styles/app.css',
  'docs/react-migration-plan.md'
]

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(projectRoot, file)))

if (missingFiles.length > 0) {
  console.error(`Missing React Stage 1 files:
${missingFiles.join('\n')}`)
  process.exit(1)
}

const domain = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/adminHierarchy.js'), 'utf8')
const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
const viewStateHook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useAdminHierarchyViewState.js'), 'utf8')

const requiredDomainExports = [
  'export function buildCustomerBookingRows',
  'export function filterCustomerBookingRows',
  'export function summarizeHierarchyRows',
  'export function bookingMatchesCustomer',
  'export function getBookingRoute'
]

const missingExports = requiredDomainExports.filter(exportName => !domain.includes(exportName))

if (missingExports.length > 0) {
  console.error(`React Stage 1 domain module is missing exports:
${missingExports.join('\n')}`)
  process.exit(1)
}

if (!viewStateHook.includes('buildCustomerBookingRows') || !viewStateHook.includes('filterCustomerBookingRows')) {
  console.error('React hierarchy view-state hook must consume the extracted domain module.')
  process.exit(1)
}

if (!component.includes('useAdminHierarchyViewState')) {
  console.error('React hierarchy component must consume the extracted view-state hook.')
  process.exit(1)
}

if (component.includes('document.querySelector') || component.includes('getElementById')) {
  console.error('React hierarchy component must not use direct DOM selectors.')
  process.exit(1)
}

console.log('React Stage 1 hierarchy migration guardrails verified.')
