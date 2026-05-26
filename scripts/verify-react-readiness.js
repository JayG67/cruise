const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertFile(relativePath) {
  const filePath = path.join(projectRoot, relativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required React readiness file: ${relativePath}`)
  }
  return read(relativePath)
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} must include: ${expected}`)
  }
}

function assertNotIncludes(content, unexpected, label) {
  if (content.includes(unexpected)) {
    throw new Error(`${label} must not include: ${unexpected}`)
  }
}

const packageJson = JSON.parse(assertFile('package.json'))
const app = assertFile('frontend/react/src/App.jsx')
const hierarchy = assertFile('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const customerRow = assertFile('frontend/react/src/components/CustomerHierarchyRow.jsx')
const bookingCard = assertFile('frontend/react/src/components/BookingCard.jsx')
const client = assertFile('frontend/react/src/api/client.js')
const snapshotHook = assertFile('frontend/react/src/hooks/useAdminHierarchySnapshot.js')
const viewStateHook = assertFile('frontend/react/src/hooks/useAdminHierarchyViewState.js')
const customerWorkflow = assertFile('frontend/react/src/hooks/useCustomerDraftWorkflow.js')
const bookingWorkflow = assertFile('frontend/react/src/hooks/useBookingDraftWorkflow.js')
const routes = assertFile('frontend/react/src/domain/reactMigrationRoutes.js')
const reviewSummary = assertFile('docs/react-migration-review-summary.md')

assertIncludes(packageJson.scripts['react:dev'], 'vite --config frontend/react/vite.config.js', 'react:dev script')
assertIncludes(packageJson.scripts['react:build'], 'vite build --config frontend/react/vite.config.js', 'react:build script')
assertIncludes(packageJson.scripts['react:migration:audit'], 'react:readiness:audit', 'react:migration:audit script')
assertIncludes(packageJson.scripts['react:readiness:audit'], 'verify-react-readiness.js', 'react:readiness:audit script')

assertIncludes(app, 'useAdminHierarchySnapshot', 'React app')
assertIncludes(app, 'ReactMigrationRouteNav', 'React app')
assertIncludes(app, 'CustomerBookingHierarchy', 'React app')
assertIncludes(client, 'getAdminHierarchySnapshot', 'React API client')
assertIncludes(client, 'updateCustomerProfile', 'React API client')
assertIncludes(client, 'updateBookingDetails', 'React API client')
assertIncludes(snapshotHook, 'AbortController', 'React snapshot hook')
assertIncludes(viewStateHook, 'useState', 'React hierarchy view-state hook')
assertIncludes(viewStateHook, 'createBookingExpansionKey', 'React hierarchy view-state hook')
assertIncludes(customerWorkflow, 'saveCustomerDraftFor', 'React customer draft workflow hook')
assertIncludes(bookingWorkflow, 'saveBookingDraftFor', 'React booking draft workflow hook')
assertIncludes(hierarchy, 'useAdminHierarchyViewState', 'React hierarchy component')
assertIncludes(customerRow, 'aria-controls={bookingsRowId}', 'React customer row')
assertIncludes(bookingCard, 'aria-controls={detailsId}', 'React booking card')
assertIncludes(routes, 'hierarchy', 'React migration routes')
assertIncludes(routes, 'handoff', 'React migration routes')
assertIncludes(reviewSummary, 'No Stage 23 is planned by default', 'React migration review summary')

assertNotIncludes(app, 'document.querySelector', 'React app')
assertNotIncludes(hierarchy, 'document.querySelector', 'React hierarchy component')

console.log('React readiness audit passed.')
