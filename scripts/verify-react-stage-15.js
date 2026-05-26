const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const hierarchy = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
const hook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useAdminHierarchyViewState.js'), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

const expectations = [
  [hierarchy.includes("import { useAdminHierarchyViewState } from '../hooks/useAdminHierarchyViewState.js'"), 'CustomerBookingHierarchy imports the hierarchy view-state hook'],
  [hierarchy.includes('useAdminHierarchyViewState(customers, bookings)'), 'CustomerBookingHierarchy delegates hierarchy state to the hook'],
  [hierarchy.includes('Stage 15 migration slice'), 'CustomerBookingHierarchy labels the Stage 15 slice'],
  [!hierarchy.includes('buildCustomerBookingRows(customers, bookings)'), 'CustomerBookingHierarchy no longer builds rows inline'],
  [!hierarchy.includes('setExpandedCustomerIds'), 'CustomerBookingHierarchy no longer owns expanded customer state setters'],
  [hook.includes('export function useAdminHierarchyViewState'), 'useAdminHierarchyViewState is exported'],
  [hook.includes('buildCustomerBookingRows(customers, bookings)'), 'hook builds customer-booking rows'],
  [hook.includes('filterCustomerBookingRows(allRows, searchTerm)'), 'hook filters rows from search term'],
  [hook.includes('summarizeHierarchyRows(rows)'), 'hook summarizes visible hierarchy rows'],
  [hook.includes('toggleBooking(customerId, bookingId)'), 'hook exposes duplicate-booking-safe booking toggle'],
  [hook.includes('collapseBookingsForVisibleCustomers(current, rows)'), 'hook collapses visible booking panels when visible customers collapse'],
  [packageJson.scripts['react:stage15:audit'] === 'node scripts/verify-react-stage-15.js', 'package.json exposes react:stage15:audit'],
  [packageJson.scripts['react:migration:audit'].includes('react:stage15:audit'), 'react:migration:audit includes Stage 15']
]

const failures = expectations.filter(([passed]) => !passed)

if (failures.length > 0) {
  failures.forEach(([, message]) => console.error(`React Stage 15 audit failed: ${message}`))
  process.exit(1)
}

console.log('React Stage 15 hierarchy view-state hook audit passed.')
