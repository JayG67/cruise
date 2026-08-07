export const COMMAND_READINESS_OPTIONS = [
  'Standard coordination',
  'High coordination',
  'Boarding ready',
  'Department handoff watch',
  'Blocked by dependency',
  'Final inspection required'
]

export const OPERATIONAL_DIRECTORY_ROLES = [
  { role: 'turnaround-manager', label: 'Turnaround Manager' },
  { role: 'housekeeping-lead', label: 'Housekeeping Lead' },
  { role: 'guest-services-lead', label: 'Guest Services Lead' },
  { role: 'food-beverage-lead', label: 'Food & Beverage Lead' },
  { role: 'engineering-lead', label: 'Engineering Lead' },
  { role: 'security-lead', label: 'Security Lead' },
  { role: 'port-operations-lead', label: 'Port Operations Lead' }
]

export function normalizeOperationalRoleName(role = '') {
  return String(role).toLowerCase().replaceAll('_', '-')
}

export function getOperationalRoleLabel(role = '') {
  const normalizedRole = normalizeOperationalRoleName(role)
  return OPERATIONAL_DIRECTORY_ROLES.find(item => item.role === normalizedRole)?.label || role
}

export function getOperationalOwnerDisplay(item = {}) {
  return item.ownerDisplayName || item.ownerName || 'Owner pending'
}

export function getOperationalAuthorDisplay(item = {}) {
  return item.authorDisplayName || item.authorName || 'Operational update'
}

export function getOperationalApproverDisplay(item = {}) {
  return item.approverDisplayName || item.approverName || 'Approver pending'
}

export function formatReleaseStatusLabel(status = '') {
  return String(status || 'REVIEW')
    .toLowerCase()
    .split(/[_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Review'
}

export function getReleasePacketStatusLabel(status = '') {
  const normalizedStatus = String(status || '').toUpperCase()

  if (normalizedStatus === 'APPROVED_FOR_RELEASE') return 'Approved for release'
  if (normalizedStatus === 'READY_TO_RELEASE') return 'Ready to release'
  if (normalizedStatus === 'RELEASE_READY') return 'Release ready'
  if (normalizedStatus === 'HOLD_FOR_REVIEW') return 'Hold for review'
  if (normalizedStatus === 'BLOCKED') return 'Blocked'

  return formatReleaseStatusLabel(status || 'REVIEW')
}

export function getReleaseChecklistStatusLabel(status = '') {
  const normalizedStatus = String(status || '').toUpperCase()

  if (normalizedStatus === 'COMPLETE') return 'Complete'
  if (normalizedStatus === 'APPROVED') return 'Approved'
  if (normalizedStatus === 'READY') return 'Ready'
  if (normalizedStatus === 'WATCH') return 'Watch'
  if (normalizedStatus === 'BLOCKED') return 'Blocked'
  if (normalizedStatus === 'PENDING') return 'Pending'

  return formatReleaseStatusLabel(status || 'Review')
}

export const formatOperationalRoleLabel = getOperationalRoleLabel
