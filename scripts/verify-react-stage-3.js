const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const statePath = path.join(projectRoot, 'frontend/react/src/domain/hierarchyExpansionState.js')
const componentPath = path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx')
const customerRowPath = path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx')
const planPath = path.join(projectRoot, 'docs/react-migration-plan.md')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

const requiredFiles = [
  statePath,
  componentPath,
  customerRowPath,
  planPath
]

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))

if (missingFiles.length > 0) {
  console.error(`Missing React Stage 3 files:
${missingFiles.join('\n')}`)
  process.exit(1)
}

const state = fs.readFileSync(statePath, 'utf8')
const component = fs.readFileSync(componentPath, 'utf8')
const customerRow = fs.readFileSync(customerRowPath, 'utf8')
const plan = fs.readFileSync(planPath, 'utf8')

const expectedStateExports = [
  'export function toggleExpandedId',
  'export function expandVisibleCustomers',
  'export function collapseVisibleCustomers',
  'export function createBookingExpansionKey',
  'export function collapseBookingsForVisibleCustomers'
]

const missingExports = expectedStateExports.filter(exportName => !state.includes(exportName))

if (missingExports.length > 0) {
  console.error(`React Stage 3 state module is missing exports:
${missingExports.join('\n')}`)
  process.exit(1)
}

if (!component.includes("from '../domain/hierarchyExpansionState.js'")) {
  console.error('React hierarchy component must consume the extracted Stage 3 state transition module.')
  process.exit(1)
}

if (component.includes('function toggleSetValue')) {
  console.error('React hierarchy component should not keep duplicate inline expansion state logic after Stage 3.')
  process.exit(1)
}

if (!component.includes('createBookingExpansionKey(customer.id, bookingId)') || !customerRow.includes('createBookingExpansionKey(customer.id, booking.id)')) {
  console.error('React hierarchy components must use duplicate-booking-safe expansion keys from the Stage 3 state module.')
  process.exit(1)
}

if (!plan.includes('Stage 3: Extracted state transition model')) {
  console.error('React migration plan must document Stage 3 state transition extraction.')
  process.exit(1)
}

if (packageJson.scripts['react:stage3:audit'] !== 'node scripts/verify-react-stage-3.js') {
  console.error('package.json must expose the React Stage 3 audit script.')
  process.exit(1)
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage3:audit')) {
  console.error('React migration audit must include Stage 3 guardrails.')
  process.exit(1)
}

console.log('React Stage 3 state transition guardrails verified.')
