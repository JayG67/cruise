import { useEffect, useMemo, useState } from 'react'
import PassengerCruiseBookingWorkflow from './PassengerCruiseBookingWorkflow.jsx'
import { getBookingDetails, getItineraryForSailing, updatePassengerPreCruiseChecklist } from '../api/client.js'

import {
  buildTurnaroundOperationCards,
  findDemoCustomer,
  getBookingCardFields,
  getBookingCardTitle,
  getBookingItineraryDays,
  getItineraryDayActivities,
  getRoleDashboardTitle,
  getOperationalRoleFocus,
  getRoleSummaryLine,
  getSelectedRoleView,
  isOperationalRoleView,
  getVisiblePassengerRows
} from '../domain/roleView.js'

function getSelectedPassengerPreferences(selectedCustomer, visibleBookings) {
  const selectedCustomerId = selectedCustomer?.id

  if (!selectedCustomerId) {
    return {
      diningPreference: 'Anytime dining',
      accessibilityNotes: ''
    }
  }

  const passenger = visibleBookings
    .flatMap(booking => booking.passengers || [])
    .find(row => row.customerId === selectedCustomerId || row.customer?.id === selectedCustomerId)

  return {
    diningPreference: passenger?.diningPreference || 'Anytime dining',
    accessibilityNotes: passenger?.accessibilityNotes || ''
  }
}


function getOperationalOwnerDisplay(row = {}) {
  return row.ownerDisplayName || row.ownerName || 'Owner pending'
}

function getOperationalAuthorDisplay(row = {}) {
  return row.authorDisplayName || row.authorName || 'Operational lead'
}

function getOperationalApproverDisplay(row = {}) {
  return row.approverDisplayName || row.approverName || 'Approver pending'
}


function getReleasePacketStatusLabel(status = '') {
  if (String(status).toUpperCase() === 'READY') return 'Ready for release'
  if (String(status).toUpperCase() === 'NOT_READY') return 'Hold release'
  return 'Release review'
}

function getReleaseChecklistStatusLabel(status = '') {
  if (String(status).toUpperCase() === 'PASS') return 'Pass'
  if (String(status).toUpperCase() === 'WATCH') return 'Watch'
  return 'Action required'
}

function buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings) {
  const preferences = getSelectedPassengerPreferences(selectedCustomer, visibleBookings)

  return {
    firstName: selectedCustomer?.firstName || selectedDemoUser?.displayName?.split(' ')[0] || '',
    lastName: selectedCustomer?.lastName || selectedDemoUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: selectedCustomer?.email || selectedDemoUser?.email || '',
    phone: selectedCustomer?.phone || '',
    diningPreference: preferences.diningPreference,
    accessibilityNotes: preferences.accessibilityNotes
  }
}

function PassengerProfile({
  selectedCustomer,
  selectedDemoUser,
  visibleBookings = [],
  turnaroundOperations = [],
  isLoadingTurnaroundOperations = false,
  turnaroundOperationsError = '',
  onRetryTurnaroundOperations,
  onUpdateTurnaroundTaskStatus,
  onUpdateTurnaroundTaskDetails,
  onCreateTurnaroundTask,
  onCreateTurnaroundTaskUpdate,
  onDeleteTurnaroundTask,
  onUpdateTurnaroundStaffing,
  onUpdateTurnaroundSignoff,
  updatingTurnaroundTaskId = '',
  updatingTurnaroundTaskDetailsId = '',
  creatingTurnaroundTaskId = '',
  creatingTurnaroundTaskUpdateId = '',
  deletingTurnaroundTaskId = '',
  updatingTurnaroundStaffingKey = '',
  updatingTurnaroundSignoffKey = '',
  creatingTurnaroundEscalationId = '',
  updatingTurnaroundEscalationId = '',
  turnaroundMutationStatus = '',
  turnaroundMutationError = '',
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = '',
  cruiseLines = [],
  onBookingCreated
}) {
  const [draft, setDraft] = useState(() => buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings))
  const [message, setMessage] = useState('')
  const selectedCustomerId = selectedCustomer?.id || selectedDemoUser?.customerId || ''
  const isSaving = Boolean(selectedCustomerId && savingCustomerId === selectedCustomerId)

  useEffect(() => {
    setDraft(buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings))
    setMessage('')
  }, [selectedCustomerId, selectedDemoUser?.id])

  function updateDraft(fieldName, value) {
    setDraft(current => ({ ...current, [fieldName]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedCustomerId) {
      setMessage('A customer profile is required before saving passenger preferences.')
      return
    }

    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
      setMessage('First name, last name, and email are required before saving profile changes.')
      return
    }

    setMessage('Saving profile...')

    try {
      const response = await onSavePassengerProfile?.(selectedCustomerId, draft)
      setMessage(response?.message || 'Passenger profile updated successfully')
    } catch (error) {
      setMessage(error.message || mutationError || 'Could not save profile.')
    }
  }

  return (
    <section className="role-profile-card passenger-self-service ce-command-card" aria-labelledby="react-passenger-profile-heading" data-testid="react-passenger-self-service-panel">
      <h3 id="react-passenger-profile-heading">My travel profile</h3>
      <p>Passengers can update limited contact and cruise preference information for their booking experience.</p>

      <form className="passenger-profile-form react-passenger-profile-form ce-editor-card" onSubmit={handleSubmit} data-testid="react-passenger-profile-form">
        <label>
          <span>First name</span>
          <input name="firstName" aria-label="First name" value={draft.firstName} required onChange={event => updateDraft('firstName', event.target.value)} data-testid="react-passenger-profile-first-name" />
        </label>
        <label>
          <span>Last name</span>
          <input name="lastName" aria-label="Last name" value={draft.lastName} required onChange={event => updateDraft('lastName', event.target.value)} data-testid="react-passenger-profile-last-name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" aria-label="Email" type="email" value={draft.email} required onChange={event => updateDraft('email', event.target.value)} data-testid="react-passenger-profile-email" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" aria-label="Phone" value={draft.phone} onChange={event => updateDraft('phone', event.target.value)} data-testid="react-passenger-profile-phone" />
        </label>
        <label>
          <span>Dining preference</span>
          <select name="diningPreference" aria-label="Dining preference" value={draft.diningPreference} onChange={event => updateDraft('diningPreference', event.target.value)} data-testid="react-dining-preference-select">
            <option value="Anytime dining">Anytime dining</option>
            <option value="Early seating">Early seating</option>
            <option value="Late seating">Late seating</option>
          </select>
        </label>
        <label>
          <span>Accessibility notes</span>
          <input name="accessibilityNotes" aria-label="Accessibility notes" value={draft.accessibilityNotes} onChange={event => updateDraft('accessibilityNotes', event.target.value)} data-testid="react-passenger-profile-accessibility-notes" />
        </label>

        <button type="submit" className="primary-action-button ce-button-primary" disabled={isSaving} data-testid="react-passenger-profile-submit-button">
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </button>
        <p className="draft-message ce-feedback-message ce-editor-card" role="status" aria-live="polite" data-testid="react-passenger-profile-message">
          {message || mutationError || 'Profile changes will be announced here.'}
        </p>
      </form>
    </section>
  )
}

function getActivityFavoriteKey(dayKey, activity = {}) {
  return `${dayKey}::${activity.id || activity.time || activity.activity || activity.name || 'activity'}`
}

function RoleBookingDetails({ booking, favoriteActivityKeys, favoritesOnly, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)
  const itineraryDays = getBookingItineraryDays(booking)
  const visibleItineraryDays = favoritesOnly
    ? itineraryDays.filter(day => {
      const dayKey = String(day.id || day.day || day.title)
      return getItineraryDayActivities(day).some(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
    })
    : itineraryDays

  return (
    <section className="role-booking-detail-panel ce-command-card" aria-label={`Details for ${getBookingCardTitle(booking)}`} data-testid="react-role-booking-details">
      <div className="role-booking-detail-grid ce-detail-grid">
        <div className="role-detail-card ce-editor-card">
          <h4>Booking details</h4>
          <dl className="role-booking-fields compact-fields">
            {getBookingCardFields(booking).map(([label, value]) => (
              <div key={`${booking.id}-detail-${label}`}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="role-detail-card ce-editor-card">
          <h4>Passenger manifest</h4>
          {passengers.length === 0 ? (
            <p>No visible passengers for this booking.</p>
          ) : passengers.map(passenger => (
            <div key={`${booking.id}-detail-${passenger.id}`} className="visible-passenger-row" data-testid="react-role-detail-passenger-row">
              <span>{passenger.name}</span>
              <span>{passenger.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="role-itinerary-panel ce-command-card">
        <div className="role-itinerary-heading">
          <div>
            <h4>Cruise itinerary</h4>
            <p>Passengers can review port days, activities, and save favorite itinerary activities.</p>
          </div>
          <label className="react-checkbox-label role-favorites-filter">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={onToggleFavoritesOnly}
              data-testid="react-role-favorites-only-toggle"
            />
            <span>Show favorites only</span>
          </label>
        </div>

        {itineraryDays.length === 0 ? (
          <p className="status-card compact ce-command-card" data-testid="react-role-no-itinerary">No itinerary details are available for this booking yet.</p>
        ) : visibleItineraryDays.length === 0 ? (
          <p className="status-card compact ce-command-card" data-testid="react-role-no-favorite-itinerary">No favorite itinerary activities selected yet.</p>
        ) : (
          <div className="role-itinerary-list">
            {visibleItineraryDays.map(day => {
              const dayKey = String(day.id || day.day || day.title)
              const activities = getItineraryDayActivities(day)
              const visibleActivities = favoritesOnly
                ? activities.filter(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
                : activities

              return (
                <article className="role-itinerary-day ce-editor-card" key={`${booking.id}-${dayKey}`} data-testid="react-role-itinerary-day">
                  <div className="role-itinerary-day-heading">
                    <div>
                      <h5>Day {day.day || '?'} — {day.title || 'Itinerary day'}</h5>
                      <p>{day.port || 'Port to be announced'}</p>
                    </div>
                  </div>

                  {activities.length === 0 ? (
                    <p>No scheduled activities yet.</p>
                  ) : (
                    <ul className="role-activity-list">
                      {visibleActivities.map(activity => {
                        const activityKey = getActivityFavoriteKey(dayKey, activity)

                        return (
                          <li key={`${dayKey}-${activity.id || activity.time || activity.activity}`} data-testid="react-role-itinerary-activity">
                            <div>
                              <strong>{activity.time || 'Time TBD'}</strong>
                              <span>{activity.activity || activity.name || 'Activity to be announced'}</span>
                            </div>
                            <label className="react-checkbox-label role-favorite-activity-toggle">
                              <input
                                type="checkbox"
                                checked={favoriteActivityKeys.has(activityKey)}
                                onChange={() => onToggleFavorite(activityKey)}
                                data-testid="react-role-favorite-itinerary-toggle"
                              />
                              <span>Favorite activity</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}


const COMMAND_READINESS_OPTIONS = [
  'Standard coordination',
  'High coordination',
  'Boarding ready',
  'Department handoff watch',
  'Blocked by dependency',
  'Final inspection required'
]


const OPERATIONAL_DIRECTORY_ROLES = [
  { role: 'turnaround-manager', label: 'Turnaround Manager' },
  { role: 'housekeeping-lead', label: 'Housekeeping Lead' },
  { role: 'guest-services-lead', label: 'Guest Services Lead' },
  { role: 'food-beverage-lead', label: 'Food & Beverage Lead' },
  { role: 'engineering-lead', label: 'Engineering Lead' },
  { role: 'security-lead', label: 'Security Lead' },
  { role: 'port-operations-lead', label: 'Port Operations Lead' }
]

function normalizeOperationalRoleName(role = '') {
  return String(role).toLowerCase().replaceAll('_', '-')
}

function getOperationalRoleLabel(role = '') {
  const normalizedRole = normalizeOperationalRoleName(role)
  return OPERATIONAL_DIRECTORY_ROLES.find(item => item.role === normalizedRole)?.label || role
}

// Backward-compatible alias for operations workspaces that still refer to the
// older formatter name while the role-label helpers are being consolidated.
const formatOperationalRoleLabel = getOperationalRoleLabel

function buildOperationalDirectory(readinessOperations = []) {
  const entries = OPERATIONAL_DIRECTORY_ROLES.map(({ role, label }) => ({
    role,
    label,
    leadNames: new Set(),
    taskCount: 0,
    blockedTasks: 0,
    activeEscalations: 0,
    handoffCount: 0,
    blockedHandoffs: 0,
    plannedCount: 0,
    checkedInCount: 0,
    signoffStatuses: new Set(),
    musterLocations: new Set()
  }))

  const byRole = new Map(entries.map(entry => [entry.role, entry]))

  readinessOperations.forEach(operation => {
    ;(operation.staffing || []).forEach(staffing => {
      const role = normalizeOperationalRoleName(staffing.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (staffing.leadName) entry.leadNames.add(staffing.leadName)
      if (staffing.musterLocation) entry.musterLocations.add(staffing.musterLocation)
      entry.plannedCount += Number(staffing.plannedCount || 0)
      entry.checkedInCount += Number(staffing.checkedInCount || 0)
    })

    ;(operation.tasks || []).forEach(task => {
      const role = normalizeOperationalRoleName(task.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (task.ownerDisplayName || task.ownerName) entry.leadNames.add(task.ownerDisplayName || task.ownerName)
      entry.taskCount += 1
      if (String(task.status || '').toUpperCase() === 'BLOCKED') entry.blockedTasks += 1
    })

    ;(operation.escalations || []).forEach(escalation => {
      const role = normalizeOperationalRoleName(escalation.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (escalation.ownerDisplayName || escalation.ownerName) entry.leadNames.add(escalation.ownerDisplayName || escalation.ownerName)
      if (!['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())) {
        entry.activeEscalations += 1
      }
    })

    ;(operation.handoffs || []).forEach(handoff => {
      const roles = [
        normalizeOperationalRoleName(handoff.fromDepartmentRole),
        normalizeOperationalRoleName(handoff.toDepartmentRole)
      ]

      roles.forEach(role => {
        const entry = byRole.get(role)
        if (!entry) return

        if (handoff.ownerDisplayName || handoff.ownerName) entry.leadNames.add(handoff.ownerDisplayName || handoff.ownerName)
        entry.handoffCount += 1
        if (String(handoff.status || '').toUpperCase() === 'BLOCKED') entry.blockedHandoffs += 1
      })
    })

    ;(operation.signoffs || []).forEach(signoff => {
      const role = normalizeOperationalRoleName(signoff.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (signoff.approverDisplayName || signoff.approverName) entry.leadNames.add(signoff.approverDisplayName || signoff.approverName)
      if (signoff.status) entry.signoffStatuses.add(signoff.status)
    })
  })

  return entries.map(entry => ({
    ...entry,
    leadNames: [...entry.leadNames].slice(0, 3),
    musterLocations: [...entry.musterLocations].slice(0, 2),
    signoffStatuses: [...entry.signoffStatuses],
    staffingPercent: entry.plannedCount > 0 ? Math.round((entry.checkedInCount / entry.plannedCount) * 100) : 0
  }))
}


function getOperationReleaseMetrics(operation = {}) {
  const tasks = operation.tasks || []
  const staffing = operation.staffing || []
  const signoffs = operation.signoffs || []
  const dependencies = operation.taskDependencies || []
  const taskSummary = operation.taskSummary || {}
  const staffingSummary = operation.staffingSummary || {}

  const totalTasks = Number(taskSummary.totalTasks ?? tasks.length)
  const completeTasks = Number(taskSummary.completeTasks ?? tasks.filter(task => String(task.status || '').toUpperCase() === 'COMPLETE').length)
  const blockedTasks = Number(taskSummary.blockedTasks ?? tasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED').length)
  const taskPercent = totalTasks > 0 ? Math.round((completeTasks / totalTasks) * 100) : 0

  const plannedCount = Number(staffingSummary.plannedCount ?? staffing.reduce((sum, item) => sum + Number(item.plannedCount || 0), 0))
  const checkedInCount = Number(staffingSummary.checkedInCount ?? staffing.reduce((sum, item) => sum + Number(item.checkedInCount || 0), 0))
  const staffingPercent = plannedCount > 0 ? Math.round((checkedInCount / plannedCount) * 100) : 0

  const totalSignoffs = signoffs.length
  const approvedSignoffs = signoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length
  const readinessPercent = totalSignoffs > 0 ? Math.round((approvedSignoffs / totalSignoffs) * 100) : 0

  const totalDependencies = dependencies.length
  const clearedDependencies = dependencies.filter(dependency => String(dependency.status || '').toUpperCase() === 'CLEARED').length
  const dependencyPercent = totalDependencies > 0 ? Math.round((clearedDependencies / totalDependencies) * 100) : 100

  const openEscalations = (operation.escalations || []).filter(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())).length
  const releaseScore = Math.round((taskPercent + staffingPercent + readinessPercent + dependencyPercent) / 4)

  return {
    totalTasks,
    completeTasks,
    blockedTasks,
    plannedCount,
    checkedInCount,
    openEscalations,
    releaseScore
  }
}

function getOperationPortfolioTone(metrics = {}) {
  if (Number(metrics.blockedTasks || 0) > 0 || Number(metrics.openEscalations || 0) > 1) return 'attention'
  if (Number(metrics.releaseScore || 0) < 75 || Number(metrics.openEscalations || 0) > 0) return 'watch'
  return 'clear'
}

function getOperationPortfolioStatus(metrics = {}) {
  const tone = getOperationPortfolioTone(metrics)
  if (tone === 'attention') return 'Needs attention'
  if (tone === 'watch') return 'Operational watch'
  return 'On track'
}


function getDirectoryHealthStatus(entry = {}) {
  const blockedCount = Number(entry.blockedTasks || 0) + Number(entry.blockedHandoffs || 0)
  const escalationCount = Number(entry.activeEscalations || 0)
  const staffingPercent = Number(entry.staffingPercent || 0)

  if (escalationCount > 0 || blockedCount > 0) return { label: 'Needs attention', tone: 'attention' }
  if (staffingPercent < 90) return { label: 'Coverage watch', tone: 'watch' }
  return { label: 'On track', tone: 'clear' }
}

function buildRoleOperationsBrief({ roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff }) {
  const normalizedRole = normalizeOperationalRoleName(roleView)
  const roleTasks = (selectedOperation?.tasks || []).filter(task => normalizeOperationalRoleName(task.departmentRole) === normalizedRole)
  const roleHandoffs = (selectedOperation?.handoffs || []).filter(handoff => (
    normalizeOperationalRoleName(handoff.fromDepartmentRole) === normalizedRole ||
    normalizeOperationalRoleName(handoff.toDepartmentRole) === normalizedRole
  ))
  const roleEscalations = (selectedOperation?.escalations || []).filter(escalation => normalizeOperationalRoleName(escalation.departmentRole) === normalizedRole)
  const openEscalations = roleEscalations.filter(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase())).length
  const blockedTasks = roleTasks.filter(task => String(task.status || '').toUpperCase() === 'BLOCKED').length
  const openHandoffs = roleHandoffs.filter(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE').length
  const plannedCount = Number(selectedStaffing?.plannedCount || 0)
  const checkedInCount = Number(selectedStaffing?.checkedInCount || 0)
  const staffingGap = Math.max(plannedCount - checkedInCount, 0)
  const readinessStatus = selectedReadinessSignoff?.status || 'PENDING'
  const primaryTask = roleTasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE') || roleTasks[0]
  const primaryEscalation = roleEscalations.find(escalation => !['RESOLVED', 'CLOSED'].includes(String(escalation.status || '').toUpperCase()))
  const primaryHandoff = roleHandoffs.find(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE')

  const actionCards = [
    {
      id: 'tasks',
      label: 'Task ownership',
      value: roleTasks.length,
      status: blockedTasks > 0 ? `${blockedTasks} blocked` : 'On track',
      description: primaryTask?.taskName || 'No active task ownership for this turnaround yet.',
      priority: blockedTasks > 0 ? 'attention' : 'normal'
    },
    {
      id: 'handoffs',
      label: 'Department handoffs',
      value: roleHandoffs.length,
      status: openHandoffs > 0 ? `${openHandoffs} open` : 'Clear',
      description: primaryHandoff?.handoffName || 'No active handoff ownership for this department yet.',
      priority: openHandoffs > 0 ? 'attention' : 'normal'
    },
    {
      id: 'escalations',
      label: 'Escalations',
      value: openEscalations,
      status: openEscalations > 0 ? 'Active' : 'None open',
      description: primaryEscalation?.title || 'No open escalations assigned to this department.',
      priority: openEscalations > 0 ? 'attention' : 'normal'
    },
    {
      id: 'staffing',
      label: 'Staffing coverage',
      value: plannedCount > 0 ? `${checkedInCount}/${plannedCount}` : 'N/A',
      status: staffingGap > 0 ? `${staffingGap} gap` : 'Covered',
      description: selectedStaffing?.musterLocation || 'Muster location pending.',
      priority: staffingGap > 0 ? 'attention' : 'normal'
    },
    {
      id: 'readiness',
      label: 'Readiness approval',
      value: readinessStatus,
      status: readinessStatus === 'APPROVED' ? 'Approved' : 'Needs review',
      description: selectedReadinessSignoff?.notes || 'Review final department readiness before release.',
      priority: readinessStatus === 'APPROVED' ? 'normal' : 'attention'
    }
  ]

  return {
    roleLabel: getOperationalRoleLabel(roleView),
    actionCards,
    attentionCount: actionCards.filter(card => card.priority === 'attention').length
  }
}


function formatAuditEventType(eventType = '') {
  return String(eventType || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Audit event'
}

function formatAuditEventPayload(event = {}) {
  const payload = event.eventPayload
  if (!payload || typeof payload !== 'object') return ''

  const changedFields = Object.keys(payload.next || payload).filter(fieldName => !['id', 'operationId'].includes(fieldName))
  if (changedFields.length === 0) return ''

  return `Changed ${changedFields.slice(0, 4).join(', ')}${changedFields.length > 4 ? '…' : ''}`
}

function formatOperationalTimelineSource(source = '') {
  return String(source || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Operation'
}

function formatOperationalTimelineTime(item = {}) {
  if (item.dueTime) return `Due ${item.dueTime}`
  if (!item.occurredAt) return 'Time pending'
  const date = new Date(item.occurredAt)
  if (Number.isNaN(date.getTime())) return String(item.occurredAt)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}


function getOperationalMetricTone(status = '') {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'ACTION') return 'action'
  if (normalized === 'WATCH') return 'watch'
  return 'pass'
}

function getOperationalTimelineTone(item = {}) {
  const severity = String(item.severity || '').toLowerCase()
  const status = String(item.status || '').toLowerCase()
  if (['critical', 'blocked'].includes(severity) || status === 'blocked') return 'critical'
  if (['action', 'watch'].includes(severity) || ['pending', 'open', 'gap', 'active'].includes(status)) return 'action'
  if (severity === 'success' || ['complete', 'approved', 'cleared', 'covered', 'resolved'].includes(status)) return 'success'
  return 'info'
}



function OperationalTurnaroundDashboard({ roleView, selectedDemoUser, turnaroundOperations = [], isLoading = false, error = '', onRetry, onUpdateOperationCommand, onUpdateTaskStatus, onUpdateTaskDetails, onCreateTask, onCreateTaskUpdate, onDeleteTask, onUpdateStaffing, onUpdateSignoff, onCreateEscalation, onUpdateEscalation, onUpdateHandoff, updatingOperationId = '', updatingTaskId = '', updatingTaskDetailsId = '', creatingTaskId = '', creatingTaskUpdateId = '', deletingTaskId = '', updatingStaffingKey = '', updatingSignoffKey = '', creatingEscalationId = '', updatingEscalationId = '', updatingHandoffId = '', mutationStatus = '', mutationError = '' }) {
  const readinessOperations = useMemo(() => buildTurnaroundOperationCards(turnaroundOperations, roleView), [turnaroundOperations, roleView])
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState('')

  useEffect(() => {
    if (readinessOperations.length === 0) {
      if (selectedTurnaroundId) setSelectedTurnaroundId('')
      return
    }

    if (!readinessOperations.some(operation => operation.id === selectedTurnaroundId)) {
      setSelectedTurnaroundId(readinessOperations[0].id)
    }
  }, [readinessOperations, selectedTurnaroundId])

  const selectedOperation = readinessOperations.find(operation => operation.id === selectedTurnaroundId) || readinessOperations[0]
  const visibleReadinessOperations = selectedOperation ? [selectedOperation] : []
  const operationalDirectory = useMemo(() => buildOperationalDirectory(visibleReadinessOperations), [visibleReadinessOperations])
  const [selectedDirectoryRole, setSelectedDirectoryRole] = useState('')
  const selectedDirectoryEntry = operationalDirectory.find(entry => entry.role === selectedDirectoryRole) || operationalDirectory.find(entry => entry.role === normalizeOperationalRoleName(roleView)) || operationalDirectory[0]
  const selectedDirectoryHealth = selectedDirectoryEntry ? getDirectoryHealthStatus(selectedDirectoryEntry) : { label: 'Pending', tone: 'pending' }
  const highCoordinationCount = visibleReadinessOperations.filter(item => String(item.readinessLevel).toLowerCase().includes('high')).length
  const passengerTotal = selectedOperation?.passengerCount || 0
  const focusLine = selectedOperation?.tasks?.[0]?.taskName || getOperationalRoleFocus(roleView)
  const [activeOperationsWorkspace, setActiveOperationsWorkspace] = useState('overview')
  const operationsWorkspaceTabs = [
    { id: 'overview', label: 'Overview', summary: 'Command plan, selected sailing context, and cross-department directory.' },
    { id: 'tasks', label: 'Tasks', summary: 'Task checklist, follow-up tasks, blocker notes, and shift updates.' },
    { id: 'dependencies', label: 'Dependencies', summary: 'Gates that must clear before embarkation or department release work can continue.' },
    { id: 'handoffs', label: 'Handoffs', summary: 'Department-to-department release workflow, owners, due times, and notes.' },
    { id: 'escalations', label: 'Escalations', summary: 'Open operational risks, owners, severity, monitoring, and resolution state.' },
    { id: 'staffing', label: 'Staffing', summary: 'Crew check-in, department leads, muster locations, and coverage gaps.' },
    { id: 'readiness', label: 'Readiness', summary: 'Department signoffs and final readiness approval workflow.' }
  ]
  const activeOperationsWorkspaceDetails = operationsWorkspaceTabs.find(tab => tab.id === activeOperationsWorkspace) || operationsWorkspaceTabs[0]
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedDependencyId, setSelectedDependencyId] = useState('')
  const [selectedHandoffId, setSelectedHandoffId] = useState('')
  const [selectedEscalationId, setSelectedEscalationId] = useState('')
  const [selectedStaffingRole, setSelectedStaffingRole] = useState('')
  const [selectedReadinessRole, setSelectedReadinessRole] = useState('')
  const [operationCommandDrafts, setOperationCommandDrafts] = useState({})
  const [taskDetailDrafts, setTaskDetailDrafts] = useState({})
  const [taskCreateDrafts, setTaskCreateDrafts] = useState({})
  const [taskUpdateDrafts, setTaskUpdateDrafts] = useState({})
  const [signoffDrafts, setSignoffDrafts] = useState({})
  const [staffingDrafts, setStaffingDrafts] = useState({})
  const [escalationCreateDrafts, setEscalationCreateDrafts] = useState({})
  const [escalationUpdateDrafts, setEscalationUpdateDrafts] = useState({})
  const [handoffDrafts, setHandoffDrafts] = useState({})
  const selectedOperationTasks = selectedOperation?.tasks || []
  const selectedOperationDependencies = selectedOperation?.taskDependencies || []
  const selectedOperationHandoffs = selectedOperation?.handoffs || []
  const selectedDependency = selectedOperationDependencies.find(dependency => (dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`) === selectedDependencyId) || selectedOperationDependencies[0]
  const selectedDependencyKey = selectedDependency?.id || (selectedDependency ? `${selectedDependency.taskName}:${selectedDependency.dependsOnTaskName}` : '')
  const dependencyWorkspaceSummary = selectedOperation?.dependencySummary || {
    totalDependencies: selectedOperationDependencies.length,
    activeDependencies: selectedOperationDependencies.filter(dependency => dependency.status !== 'CLEARED').length,
    clearedDependencies: selectedOperationDependencies.filter(dependency => dependency.status === 'CLEARED').length
  }
  const selectedHandoff = selectedOperationHandoffs.find(handoff => handoff.id === selectedHandoffId) || selectedOperationHandoffs[0]
  const selectedHandoffKey = selectedHandoff?.id || ''
  const handoffWorkspaceSummary = selectedOperation?.handoffSummary || {
    totalHandoffs: selectedOperationHandoffs.length,
    completedHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status === 'COMPLETE').length,
    blockedHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status === 'BLOCKED').length,
    pendingHandoffs: selectedOperationHandoffs.filter(handoff => handoff.status !== 'COMPLETE').length
  }
  const selectedOperationStaffing = selectedOperation?.staffing || []
  const selectedStaffing = selectedOperationStaffing.find(staffing => staffing.departmentRole === selectedStaffingRole) || selectedOperationStaffing.find(staffing => staffing.departmentRole === roleView) || selectedOperationStaffing[0]
  const selectedStaffingKey = selectedStaffing?.departmentRole || ''
  const selectedOperationSignoffs = selectedOperation?.signoffs || []
  const selectedReadinessSignoff = selectedOperationSignoffs.find(signoff => signoff.departmentRole === selectedReadinessRole) || selectedOperationSignoffs.find(signoff => signoff.departmentRole === roleView) || selectedOperationSignoffs[0]
  const selectedReadinessKey = selectedReadinessSignoff?.departmentRole || ''
  const roleOperationsBrief = useMemo(() => buildRoleOperationsBrief({ roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff }), [roleView, selectedOperation, selectedStaffing, selectedReadinessSignoff])
  const readinessWorkspaceSummary = {
    totalSignoffs: selectedOperationSignoffs.length,
    approvedSignoffs: selectedOperationSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length,
    pendingSignoffs: selectedOperationSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'PENDING').length,
    blockedSignoffs: selectedOperationSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'BLOCKED').length
  }
  const staffingWorkspaceSummary = selectedOperation?.staffingSummary || {
    totalDepartments: selectedOperationStaffing.length,
    plannedCount: selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.plannedCount || 0), 0),
    checkedInCount: selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.checkedInCount || 0), 0),
    gapCount: selectedOperationStaffing.reduce((sum, staffing) => sum + Math.max(Number(staffing.plannedCount || 0) - Number(staffing.checkedInCount || 0), 0), 0),
    checkInPercent: selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.plannedCount || 0), 0) > 0
      ? Math.round((selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.checkedInCount || 0), 0) / selectedOperationStaffing.reduce((sum, staffing) => sum + Number(staffing.plannedCount || 0), 0)) * 100)
      : 0
  }
  const selectedOperationEscalations = selectedOperation?.escalations || []
  const selectedEscalation = selectedOperationEscalations.find(escalation => escalation.id === selectedEscalationId) || selectedOperationEscalations[0]
  const selectedEscalationKey = selectedEscalation?.id || ''
  const escalationWorkspaceSummary = selectedOperation?.escalationSummary || {
    totalEscalations: selectedOperationEscalations.length,
    openEscalations: selectedOperationEscalations.filter(escalation => String(escalation.status || '').toUpperCase() === 'OPEN').length,
    monitoringEscalations: selectedOperationEscalations.filter(escalation => String(escalation.status || '').toUpperCase() === 'MONITORING').length,
    criticalEscalations: selectedOperationEscalations.filter(escalation => String(escalation.severity || '').toUpperCase() === 'CRITICAL').length
  }
  const selectedTask = selectedOperationTasks.find(task => (task.id || task.taskName) === selectedTaskId) || selectedOperationTasks[0]
  const selectedTaskKey = selectedTask?.id || selectedTask?.taskName || ''
  const taskWorkspaceSummary = selectedOperation?.taskSummary || {
    totalTasks: selectedOperationTasks.length,
    completeTasks: selectedOperationTasks.filter(task => task.status === 'COMPLETE').length,
    blockedTasks: selectedOperationTasks.filter(task => task.status === 'BLOCKED').length,
    completionPercent: selectedOperationTasks.length > 0
      ? Math.round((selectedOperationTasks.filter(task => task.status === 'COMPLETE').length / selectedOperationTasks.length) * 100)
      : 0
  }
  const operationReleaseScore = Math.round((
    Number(taskWorkspaceSummary.completionPercent || 0) +
    Number(staffingWorkspaceSummary.checkInPercent || 0) +
    (readinessWorkspaceSummary.totalSignoffs > 0 ? Math.round((readinessWorkspaceSummary.approvedSignoffs / readinessWorkspaceSummary.totalSignoffs) * 100) : 0) +
    (dependencyWorkspaceSummary.totalDependencies > 0 ? Math.round((dependencyWorkspaceSummary.clearedDependencies / dependencyWorkspaceSummary.totalDependencies) * 100) : 100)
  ) / 4)
  const releaseBoardItems = [
    {
      id: 'tasks',
      label: 'Task execution',
      value: `${taskWorkspaceSummary.completeTasks || 0}/${taskWorkspaceSummary.totalTasks || 0}`,
      detail: taskWorkspaceSummary.blockedTasks > 0 ? `${taskWorkspaceSummary.blockedTasks} blocked` : 'Active workstream',
      tone: taskWorkspaceSummary.blockedTasks > 0 ? 'attention' : 'steady'
    },
    {
      id: 'dependencies',
      label: 'Dependency gates',
      value: `${dependencyWorkspaceSummary.clearedDependencies || 0}/${dependencyWorkspaceSummary.totalDependencies || 0}`,
      detail: dependencyWorkspaceSummary.activeDependencies > 0 ? `${dependencyWorkspaceSummary.activeDependencies} active` : 'Gates clear',
      tone: dependencyWorkspaceSummary.activeDependencies > 0 ? 'watch' : 'clear'
    },
    {
      id: 'staffing',
      label: 'Staffing coverage',
      value: `${staffingWorkspaceSummary.checkInPercent || 0}%`,
      detail: staffingWorkspaceSummary.gapCount > 0 ? `${staffingWorkspaceSummary.gapCount} open positions` : 'Coverage aligned',
      tone: staffingWorkspaceSummary.gapCount > 0 ? 'watch' : 'clear'
    },
    {
      id: 'readiness',
      label: 'Readiness approvals',
      value: `${readinessWorkspaceSummary.approvedSignoffs || 0}/${readinessWorkspaceSummary.totalSignoffs || 0}`,
      detail: readinessWorkspaceSummary.blockedSignoffs > 0 ? `${readinessWorkspaceSummary.blockedSignoffs} blocked` : 'Department signoffs',
      tone: readinessWorkspaceSummary.blockedSignoffs > 0 ? 'attention' : 'steady'
    }
  ]

  const portfolioOperationItems = readinessOperations.map(operation => ({
    operation,
    metrics: getOperationReleaseMetrics(operation)
  }))
  const portfolioAverageReadiness = portfolioOperationItems.length > 0
    ? Math.round(portfolioOperationItems.reduce((sum, item) => sum + item.metrics.releaseScore, 0) / portfolioOperationItems.length)
    : 0
  const portfolioNeedsAttention = portfolioOperationItems.filter(item => getOperationPortfolioTone(item.metrics) === 'attention').length
  const portfolioWatchCount = portfolioOperationItems.filter(item => getOperationPortfolioTone(item.metrics) === 'watch').length
  const portfolioOpenEscalations = portfolioOperationItems.reduce((sum, item) => sum + Number(item.metrics.openEscalations || 0), 0)

  useEffect(() => {
    setActiveOperationsWorkspace('overview')
  }, [roleView, selectedDemoUser?.id])


  useEffect(() => {
    if (operationalDirectory.length === 0) {
      if (selectedDirectoryRole) setSelectedDirectoryRole('')
      return
    }

    if (!operationalDirectory.some(entry => entry.role === selectedDirectoryRole)) {
      const roleEntry = operationalDirectory.find(entry => entry.role === normalizeOperationalRoleName(roleView))
      setSelectedDirectoryRole((roleEntry || operationalDirectory[0]).role)
    }
  }, [operationalDirectory, selectedDirectoryRole, roleView])


  useEffect(() => {
    if (selectedOperationTasks.length === 0) {
      if (selectedTaskId) setSelectedTaskId('')
      return
    }

    if (!selectedOperationTasks.some(task => (task.id || task.taskName) === selectedTaskId)) {
      setSelectedTaskId(selectedOperationTasks[0].id || selectedOperationTasks[0].taskName)
    }
  }, [selectedOperation?.id, selectedOperationTasks, selectedTaskId])

  useEffect(() => {
    if (selectedOperationDependencies.length === 0) {
      if (selectedDependencyId) setSelectedDependencyId('')
      return
    }

    if (!selectedOperationDependencies.some(dependency => (dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`) === selectedDependencyId)) {
      const firstDependency = selectedOperationDependencies[0]
      setSelectedDependencyId(firstDependency.id || `${firstDependency.taskName}:${firstDependency.dependsOnTaskName}`)
    }
  }, [selectedOperation?.id, selectedOperationDependencies, selectedDependencyId])



  useEffect(() => {
    if (selectedOperationHandoffs.length === 0) {
      if (selectedHandoffId) setSelectedHandoffId('')
      return
    }

    if (!selectedOperationHandoffs.some(handoff => handoff.id === selectedHandoffId)) {
      setSelectedHandoffId(selectedOperationHandoffs[0].id)
    }
  }, [selectedOperation?.id, selectedOperationHandoffs, selectedHandoffId])


  useEffect(() => {
    if (selectedOperationStaffing.length === 0) {
      if (selectedStaffingRole) setSelectedStaffingRole('')
      return
    }

    if (!selectedOperationStaffing.some(staffing => staffing.departmentRole === selectedStaffingRole)) {
      const roleStaffing = selectedOperationStaffing.find(staffing => staffing.departmentRole === roleView)
      setSelectedStaffingRole((roleStaffing || selectedOperationStaffing[0]).departmentRole)
    }
  }, [selectedOperation?.id, selectedOperationStaffing, selectedStaffingRole, roleView])


  useEffect(() => {
    if (selectedOperationSignoffs.length === 0) {
      if (selectedReadinessRole) setSelectedReadinessRole('')
      return
    }

    if (!selectedOperationSignoffs.some(signoff => signoff.departmentRole === selectedReadinessRole)) {
      const roleSignoff = selectedOperationSignoffs.find(signoff => signoff.departmentRole === roleView)
      setSelectedReadinessRole((roleSignoff || selectedOperationSignoffs[0]).departmentRole)
    }
  }, [selectedOperation?.id, selectedOperationSignoffs, selectedReadinessRole, roleView])


  useEffect(() => {
    if (selectedOperationEscalations.length === 0) {
      if (selectedEscalationId) setSelectedEscalationId('')
      return
    }

    if (!selectedOperationEscalations.some(escalation => escalation.id === selectedEscalationId)) {
      setSelectedEscalationId(selectedOperationEscalations[0].id)
    }
  }, [selectedOperation?.id, selectedOperationEscalations, selectedEscalationId])



  function getOperationCommandDraft(operationCard) {
    return operationCommandDrafts[operationCard.id] || {
      status: operationCard.commandStatus || operationCard.status || 'PLANNED',
      readinessLevel: operationCard.commandReadinessLevel || operationCard.readinessLevel || 'Standard coordination',
      port: operationCard.port || operationCard.arrivalPort || '',
      notes: operationCard.notes || ''
    }
  }

  function updateOperationCommandDraft(operationCard, fieldName, value) {
    setOperationCommandDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getOperationCommandDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveOperationCommand(operationCard) {
    const draft = getOperationCommandDraft(operationCard)
    const response = await onUpdateOperationCommand?.(operationCard.id, draft)

    if (response) {
      setOperationCommandDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }


  function getEscalationCreateDraft(operationCard) {
    return escalationCreateDrafts[operationCard.id] || {
      departmentRole: roleView,
      severity: 'WATCH',
      title: '',
      ownerName: selectedDemoUser?.displayName || '',
      status: 'OPEN',
      resolutionNotes: ''
    }
  }

  function updateEscalationCreateDraft(operationCard, fieldName, value) {
    setEscalationCreateDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getEscalationCreateDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveEscalationCreate(operationCard) {
    const draft = getEscalationCreateDraft(operationCard)
    const response = await onCreateEscalation?.(operationCard.id, draft)

    if (response) {
      setEscalationCreateDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getEscalationUpdateDraft(escalation) {
    return escalationUpdateDrafts[escalation.id] || {
      severity: escalation.severity || 'WATCH',
      title: escalation.title || '',
      ownerName: escalation.ownerName || '',
      status: escalation.status || 'OPEN',
      resolutionNotes: escalation.resolutionNotes || ''
    }
  }

  function updateEscalationDraft(escalation, fieldName, value) {
    setEscalationUpdateDrafts(current => ({
      ...current,
      [escalation.id]: {
        ...getEscalationUpdateDraft(escalation),
        [fieldName]: value
      }
    }))
  }

  async function saveEscalationUpdate(escalation) {
    const draft = getEscalationUpdateDraft(escalation)
    const response = await onUpdateEscalation?.(escalation.id, draft)

    if (response) {
      setEscalationUpdateDrafts(current => {
        const next = { ...current }
        delete next[escalation.id]
        return next
      })
    }
  }


  function getHandoffDraft(handoff) {
    return handoffDrafts[handoff.id] || {
      status: handoff.status || 'PENDING',
      ownerName: handoff.ownerName || selectedDemoUser?.displayName || '',
      dueTime: handoff.dueTime || '',
      notes: handoff.notes || ''
    }
  }

  function updateHandoffDraft(handoff, fieldName, value) {
    setHandoffDrafts(current => ({
      ...current,
      [handoff.id]: {
        ...getHandoffDraft(handoff),
        [fieldName]: value
      }
    }))
  }

  async function saveHandoffUpdate(handoff) {
    const response = await onUpdateHandoff?.(handoff.id, getHandoffDraft(handoff))

    if (response) {
      setHandoffDrafts(current => {
        const next = { ...current }
        delete next[handoff.id]
        return next
      })
    }
  }


  function getRoleStaffing(operationCard, departmentRole = roleView) {
    return (operationCard.staffing || []).find(staffing => staffing.departmentRole === departmentRole) || {
      departmentRole,
      plannedCount: 0,
      checkedInCount: 0,
      leadName: selectedDemoUser?.displayName || '',
      musterLocation: '',
      notes: ''
    }
  }

  function getStaffingDraft(operationCard, departmentRole = roleView) {
    const existingStaffing = getRoleStaffing(operationCard, departmentRole)
    const draftKey = `${operationCard.id}:${departmentRole}`

    return staffingDrafts[draftKey] || {
      plannedCount: String(existingStaffing.plannedCount ?? 0),
      checkedInCount: String(existingStaffing.checkedInCount ?? 0),
      leadName: existingStaffing.leadName || selectedDemoUser?.displayName || '',
      musterLocation: existingStaffing.musterLocation || '',
      notes: existingStaffing.notes || ''
    }
  }

  function updateStaffingDraft(operationCard, fieldName, value, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`

    setStaffingDrafts(current => ({
      ...current,
      [draftKey]: {
        ...getStaffingDraft(operationCard, departmentRole),
        [fieldName]: value
      }
    }))
  }

  async function saveStaffing(operationCard, departmentRole = roleView) {
    const draft = getStaffingDraft(operationCard, departmentRole)
    const payload = {
      ...draft,
      plannedCount: Number(draft.plannedCount || 0),
      checkedInCount: Number(draft.checkedInCount || 0)
    }
    const response = await onUpdateStaffing?.(operationCard.id, departmentRole, payload)

    if (response) {
      setStaffingDrafts(current => {
        const next = { ...current }
        delete next[`${operationCard.id}:${departmentRole}`]
        return next
      })
    }
  }

  function getRoleSignoff(operationCard, departmentRole = roleView) {
    return (operationCard.signoffs || []).find(signoff => signoff.departmentRole === departmentRole) || {
      departmentRole,
      approverName: selectedDemoUser?.displayName || '',
      status: 'PENDING',
      notes: ''
    }
  }

  function getSignoffDraft(operationCard, departmentRole = roleView) {
    const existingSignoff = getRoleSignoff(operationCard, departmentRole)
    const draftKey = `${operationCard.id}:${departmentRole}`

    return signoffDrafts[draftKey] || {
      approverName: existingSignoff.approverName || selectedDemoUser?.displayName || '',
      status: existingSignoff.status || 'PENDING',
      notes: existingSignoff.notes || ''
    }
  }

  function updateSignoffDraft(operationCard, fieldName, value, departmentRole = roleView) {
    const draftKey = `${operationCard.id}:${departmentRole}`

    setSignoffDrafts(current => ({
      ...current,
      [draftKey]: {
        ...getSignoffDraft(operationCard, departmentRole),
        [fieldName]: value
      }
    }))
  }

  async function saveSignoff(operationCard, departmentRole = roleView) {
    const draft = getSignoffDraft(operationCard, departmentRole)
    const response = await onUpdateSignoff?.(operationCard.id, departmentRole, draft)

    if (response) {
      setSignoffDrafts(current => {
        const next = { ...current }
        delete next[`${operationCard.id}:${departmentRole}`]
        return next
      })
    }
  }



  function focusOperationsWorkspace(workspaceId) {
    setActiveOperationsWorkspace(workspaceId)
    window.requestAnimationFrame(() => {
      document.getElementById('operations-workspace-heading')?.scrollIntoView({ block: 'start' })
    })
  }

  function getLifecycleTargetWorkspace(item = {}) {
    const typeText = String(item.type || item.label || item.detail || item.departmentRole || '').toLowerCase()
    if (typeText.includes('staff')) return 'staffing'
    if (typeText.includes('dependency')) return 'dependencies'
    if (typeText.includes('handoff')) return 'handoffs'
    if (typeText.includes('escalation')) return 'escalations'
    if (typeText.includes('signoff') || typeText.includes('department')) return 'readiness'
    return 'tasks'
  }

  function getPhaseTargetWorkspace(phase = {}) {
    const blockerText = [...(phase.blockers || []), phase.description, phase.label].filter(Boolean).join(' ').toLowerCase()
    if (blockerText.includes('staff')) return 'staffing'
    if (blockerText.includes('depend')) return 'dependencies'
    if (blockerText.includes('handoff')) return 'handoffs'
    if (blockerText.includes('escalation')) return 'escalations'
    if (blockerText.includes('signoff') || blockerText.includes('readiness')) return 'readiness'
    return 'tasks'
  }

  function getTaskCreateDraft(operationCard) {
    return taskCreateDrafts[operationCard.id] || {
      departmentRole: roleView,
      taskName: '',
      ownerName: selectedDemoUser?.displayName || '',
      dueTime: '',
      location: '',
      blockerReason: ''
    }
  }

  function updateTaskCreateDraft(operationCard, fieldName, value) {
    setTaskCreateDrafts(current => ({
      ...current,
      [operationCard.id]: {
        ...getTaskCreateDraft(operationCard),
        [fieldName]: value
      }
    }))
  }

  async function saveTaskCreate(operationCard) {
    const draft = getTaskCreateDraft(operationCard)
    const response = await onCreateTask?.(operationCard.id, {
      ...draft,
      status: 'READY'
    })

    if (response) {
      setTaskCreateDrafts(current => {
        const next = { ...current }
        delete next[operationCard.id]
        return next
      })
    }
  }

  function getTaskDetailDraft(task) {
    return taskDetailDrafts[task.id] || {
      ownerName: task.ownerName || '',
      dueTime: task.dueTime || '',
      location: task.location || '',
      blockerReason: task.blockerReason || ''
    }
  }

  function updateTaskDetailDraft(task, fieldName, value) {
    setTaskDetailDrafts(current => {
      const existingDraft = current[task.id] || {
        ownerName: task.ownerName || '',
        dueTime: task.dueTime || '',
        location: task.location || '',
        blockerReason: task.blockerReason || ''
      }

      return {
        ...current,
        [task.id]: {
          ...existingDraft,
          [fieldName]: value
        }
      }
    })
  }

  async function saveTaskDetails(task) {
    const draft = getTaskDetailDraft(task)
    const response = await onUpdateTaskDetails?.(task.id, draft)

    if (response) {
      setTaskDetailDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  function updateStatus(task, status) {
    const draft = getTaskDetailDraft(task)
    return onUpdateTaskStatus?.(task.id, status, { blockerReason: draft.blockerReason })
  }

  function getTaskUpdateDraft(task) {
    return taskUpdateDrafts[task.id] || ''
  }

  function updateTaskUpdateDraft(task, value) {
    setTaskUpdateDrafts(current => ({
      ...current,
      [task.id]: value
    }))
  }

  async function saveTaskUpdate(task) {
    const message = getTaskUpdateDraft(task).trim()
    if (!message) return

    const response = await onCreateTaskUpdate?.(task.id, {
      authorName: selectedDemoUser?.displayName || 'Operational lead',
      updateType: 'NOTE',
      message
    })

    if (response) {
      setTaskUpdateDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  async function removeTask(task) {
    const response = await onDeleteTask?.(task.id)

    if (response) {
      setTaskDetailDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
      setTaskUpdateDrafts(current => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    }
  }

  return (
    <section className="operational-turnaround-panel ce-command-panel" aria-labelledby="operational-turnaround-heading" data-testid="react-operational-turnaround-panel">
      <div className="operational-turnaround-hero">
        <div>
          <p className="eyebrow ce-kicker">Turnaround readiness</p>
          <h3 id="operational-turnaround-heading">{focusLine}</h3>
          <p>
            {selectedDemoUser?.displayName || 'This operator'} is reviewing database-backed turnaround plans, readiness tasks, and sailing context without exposing admin-only mutation controls.
          </p>
        </div>
        <dl className="operational-metric-grid" aria-label="Turnaround readiness metrics">
          <div data-testid="react-operational-readiness-bookings">
            <dt>Turnaround plans</dt>
            <dd>{readinessOperations.length}</dd>
          </div>
          <div data-testid="react-operational-readiness-passengers">
            <dt>Passengers visible</dt>
            <dd>{passengerTotal}</dd>
          </div>
          <div data-testid="react-operational-readiness-alerts">
            <dt>High coordination</dt>
            <dd>{highCoordinationCount}</dd>
          </div>
        </dl>
      </div>

      {readinessOperations.length > 0 && (
        <section className="operations-portfolio-board ce-command-panel" aria-labelledby="operations-portfolio-board-heading" data-testid="react-operations-portfolio-board">
          <div className="operations-portfolio-heading">
            <div>
              <p className="eyebrow ce-kicker">Fleet operations portfolio</p>
              <h4 id="operations-portfolio-board-heading">Turnaround command across active sailings</h4>
              <p>Review every visible turnaround by release readiness, open escalations, blockers, and passenger load before drilling into a single sailing.</p>
            </div>
            <dl className="operations-portfolio-summary" aria-label="Fleet turnaround summary" data-testid="react-operations-portfolio-summary">
              <div>
                <dt>Average readiness</dt>
                <dd>{portfolioAverageReadiness}%</dd>
              </div>
              <div>
                <dt>Needs attention</dt>
                <dd>{portfolioNeedsAttention}</dd>
              </div>
              <div>
                <dt>Watch</dt>
                <dd>{portfolioWatchCount}</dd>
              </div>
              <div>
                <dt>Open escalations</dt>
                <dd>{portfolioOpenEscalations}</dd>
              </div>
            </dl>
          </div>
          <div className="operations-portfolio-list" data-testid="react-operations-portfolio-list">
            {portfolioOperationItems.map(({ operation, metrics }) => {
              const tone = getOperationPortfolioTone(metrics)
              return (
                <button
                  type="button"
                  key={operation.id}
                  className={`operations-portfolio-card ${tone}${operation.id === selectedOperation?.id ? ' active' : ''}`}
                  aria-pressed={operation.id === selectedOperation?.id}
                  onClick={() => setSelectedTurnaroundId(operation.id)}
                  data-testid="react-operations-portfolio-card"
                >
                  <span className={`operations-portfolio-status ${tone}`}>{getOperationPortfolioStatus(metrics)}</span>
                  <strong>{operation.title}</strong>
                  <span>{operation.shipName} · {operation.port || operation.arrivalPort}</span>
                  <dl>
                    <div>
                      <dt>Ready</dt>
                      <dd>{metrics.releaseScore}%</dd>
                    </div>
                    <div>
                      <dt>Tasks</dt>
                      <dd>{metrics.completeTasks}/{metrics.totalTasks}</dd>
                    </div>
                    <div>
                      <dt>Blocked</dt>
                      <dd>{metrics.blockedTasks}</dd>
                    </div>
                    <div>
                      <dt>Escalations</dt>
                      <dd>{metrics.openEscalations}</dd>
                    </div>
                  </dl>
                </button>
              )
            })}
          </div>
        </section>
      )}


      {readinessOperations.length > 1 && selectedOperation && (
        <section className="turnaround-selector-panel" aria-labelledby="turnaround-selector-heading" data-testid="react-turnaround-selector-panel">
          <div>
            <p className="eyebrow ce-kicker">Selected turnaround</p>
            <h4 id="turnaround-selector-heading">Focus one sailing at a time</h4>
            <p>Choose a sailing to keep the command center readable. Tasks, handoffs, staffing, dependencies, and escalations below stay scoped to the selected turnaround.</p>
          </div>
          <label className="turnaround-selector-control">
            <span>Turnaround sailing</span>
            <select
              value={selectedOperation.id}
              onChange={event => setSelectedTurnaroundId(event.target.value)}
              aria-label="Select turnaround sailing"
              data-testid="react-turnaround-selector"
            >
              {readinessOperations.map(operation => (
                <option value={operation.id} key={operation.id}>
                  {operation.title} — {operation.shipName} — {operation.sailingDate}
                </option>
              ))}
            </select>
          </label>
          <dl className="turnaround-selector-summary" aria-label="Selected turnaround summary" data-testid="react-turnaround-selector-summary">
            <div>
              <dt>Status</dt>
              <dd>{selectedOperation.commandStatus || selectedOperation.status}</dd>
            </div>
            <div>
              <dt>Port</dt>
              <dd>{selectedOperation.port || selectedOperation.arrivalPort}</dd>
            </div>
            <div>
              <dt>Tasks</dt>
              <dd>{selectedOperation.taskSummary?.totalTasks || selectedOperation.tasks?.length || 0}</dd>
            </div>
            <div>
              <dt>Blockers</dt>
              <dd>{selectedOperation.taskSummary?.blockedTasks || 0}</dd>
            </div>
          </dl>
        </section>
      )}

      {selectedOperation && (
        <section className="operations-release-board ce-command-panel" aria-labelledby="operations-release-board-heading" data-testid="react-operations-release-board">
          <div className="operations-release-board-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround release board</p>
              <h4 id="operations-release-board-heading">Operational readiness at a glance</h4>
              <p>Use the release board to spot the workstream that needs attention before guests arrive at the terminal.</p>
            </div>
            <div className="operations-release-score" data-testid="react-operations-release-score" aria-label={`Overall release readiness ${operationReleaseScore}%`}>
              <span>{operationReleaseScore}%</span>
              <small>overall readiness</small>
            </div>
          </div>
          <div className="operations-release-board-grid" data-testid="react-operations-release-board-grid">
            {releaseBoardItems.map(item => (
              <button
                type="button"
                key={item.id}
                className={`operations-release-card ${item.tone}`}
                onClick={() => focusOperationsWorkspace(item.id)}
                data-testid="react-operations-release-card"
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <em>{item.detail}</em>
              </button>
            ))}
          </div>
        </section>
      )}



      {selectedOperation?.lifecycleState && (
        <section className={`operations-lifecycle ${String(selectedOperation.lifecycleState.status || '').toLowerCase()}`} aria-labelledby="operations-lifecycle-heading" data-testid="react-operations-lifecycle-state">
          <div className="operations-lifecycle-header" data-testid="react-operations-lifecycle-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround lifecycle</p>
              <h4 id="operations-lifecycle-heading">{selectedOperation.lifecycleState.currentPhaseLabel} command path</h4>
              <p>{selectedOperation.lifecycleState.completionLanguage}</p>
            </div>
            <div className="operations-lifecycle-score" aria-label={`Lifecycle completion ${selectedOperation.lifecycleState.completionPercent || 0}%`}>
              <span>{selectedOperation.lifecycleState.completionPercent || 0}%</span>
              <small>{String(selectedOperation.lifecycleState.status || 'IN_PROGRESS').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-lifecycle-story ce-command-card" data-testid="react-operations-lifecycle-story">
            {(selectedOperation.lifecycleState.storyBeats || []).map(beat => (
              <span key={beat}>{beat}</span>
            ))}
          </div>
          <div className="operations-lifecycle-phase-grid" data-testid="react-operations-lifecycle-phases">
            {(selectedOperation.lifecycleState.phases || []).map(phase => {
              const targetWorkspace = getPhaseTargetWorkspace(phase)
              return (
                <button
                  type="button"
                  className={`operations-lifecycle-phase ce-command-card ${String(phase.status || '').toLowerCase()}`}
                  key={phase.id}
                  onClick={() => focusOperationsWorkspace(targetWorkspace)}
                  data-testid="react-operations-lifecycle-phase-action"
                  aria-label={`Open ${targetWorkspace} workspace for ${phase.label}`}
                >
                  <span>{phase.sequence}. {phase.label}</span>
                  <strong>{phase.percentComplete}%</strong>
                  <p>{phase.description}</p>
                  {phase.blockers?.length > 0 && <em>{phase.blockers.join(' · ')}</em>}
                </button>
              )
            })}
          </div>
          <div className="operations-lifecycle-details">
            <div data-testid="react-operations-lifecycle-blockers">
              <strong>Completion blockers</strong>
              {selectedOperation.lifecycleState.finalBlockers?.length > 0 ? (
                <ul>
                  {selectedOperation.lifecycleState.finalBlockers.slice(0, 6).map(blocker => {
                    const targetWorkspace = getLifecycleTargetWorkspace(blocker)
                    return (
                      <li key={blocker.id}>
                        <button
                          type="button"
                          className="operations-lifecycle-detail-action"
                          onClick={() => focusOperationsWorkspace(targetWorkspace)}
                          data-testid="react-operations-lifecycle-blocker-action"
                        >
                          <span>{blocker.type}</span> {blocker.label}: {blocker.detail}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p>No lifecycle blockers remain.</p>
              )}
            </div>
            <div data-testid="react-operations-lifecycle-departments">
              <strong>Department readiness</strong>
              <ul>
                {(selectedOperation.lifecycleState.departmentReadiness || []).slice(0, 6).map(department => {
                  const targetWorkspace = department.openEscalations > 0
                    ? 'escalations'
                    : department.openDependencies > 0
                      ? 'dependencies'
                      : department.ready
                        ? 'readiness'
                        : 'tasks'
                  return (
                    <li key={department.departmentRole}>
                      <button
                        type="button"
                        className="operations-lifecycle-detail-action"
                        onClick={() => focusOperationsWorkspace(targetWorkspace)}
                        data-testid="react-operations-lifecycle-department-action"
                      >
                        <span>{department.ready ? 'Ready' : 'Open'}</span> {department.departmentRole}: {department.taskCompletionPercent}% tasks · {department.openEscalations} escalations · {department.openDependencies} dependencies
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className="operations-lifecycle-next-action ce-command-card" data-testid="react-operations-lifecycle-next-action">
            <strong>Next best action</strong>
            <button
              type="button"
              className="operations-lifecycle-next-action-button"
              onClick={() => focusOperationsWorkspace(getLifecycleTargetWorkspace({ detail: selectedOperation.lifecycleState.nextBestAction }))}
              data-testid="react-operations-lifecycle-next-action-button"
            >
              {selectedOperation.lifecycleState.nextBestAction}
            </button>
          </div>
        </section>
      )}


      {selectedOperation?.releasePacket && (
        <section className={`operations-release-packet ${String(selectedOperation.releasePacket.releaseStatus || '').toLowerCase()}`} aria-labelledby="operations-release-packet-heading" data-testid="react-operations-release-packet">
          <div className="operations-release-packet-header">
            <div>
              <p className="eyebrow ce-kicker">Release packet</p>
              <h4 id="operations-release-packet-heading">Final embarkation release readiness</h4>
              <p>{selectedOperation.releasePacket.releaseRecommendation}</p>
            </div>
            <div className="operations-release-packet-score" aria-label={`Release packet score ${selectedOperation.releasePacket.readinessScore}%`}>
              <span>{selectedOperation.releasePacket.readinessScore}%</span>
              <small>{getReleasePacketStatusLabel(selectedOperation.releasePacket.releaseStatus)}</small>
            </div>
          </div>
          <div className="operations-release-packet-grid ce-command-card" data-testid="react-operations-release-packet-checklist">
            {(selectedOperation.releasePacket.checklist || []).map(item => (
              <article className={`operations-release-packet-item ${String(item.status || '').toLowerCase()}`} key={item.id}>
                <strong>{item.label}</strong>
                <span>{getReleaseChecklistStatusLabel(item.status)} · {item.percent}%</span>
              </article>
            ))}
          </div>
          {selectedOperation.releasePacket.blockers?.length > 0 && (
            <div className="operations-release-blockers ce-command-card" data-testid="react-operations-release-blockers">
              <strong>Release blockers</strong>
              <ul>
                {selectedOperation.releasePacket.blockers.slice(0, 5).map((blocker, index) => (
                  <li key={`${blocker.type}-${blocker.label}-${index}`}>
                    <span>{blocker.type}</span>
                    <em>{blocker.label}</em>
                    <small>{blocker.detail}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}


      {selectedOperation?.operationalMetrics && (
        <section className="operations-metrics" aria-labelledby="operations-metrics-heading" data-testid="react-operations-metrics">
          <div className="operations-metrics-header">
            <div>
              <p className="eyebrow ce-kicker">Operational analytics</p>
              <h4 id="operations-metrics-heading">Turnaround performance signals</h4>
              <p>Release confidence blends readiness, risk, staffing, dependencies, handoffs, escalations, and timeline activity into a command-center view.</p>
            </div>
            <div className="operations-metrics-confidence" aria-label={`Release confidence ${selectedOperation.operationalMetrics.summary?.releaseConfidence || 0}%`}>
              <span>{selectedOperation.operationalMetrics.summary?.releaseConfidence || 0}%</span>
              <small>Release confidence</small>
            </div>
          </div>
          <div className="operations-metrics-signal-grid" data-testid="react-operations-metrics-signals">
            {(selectedOperation.operationalMetrics.signals || []).map(signal => (
              <article className={`operations-metrics-signal ${getOperationalMetricTone(signal.status)}`} key={signal.id}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <em>{signal.detail}</em>
              </article>
            ))}
          </div>
          {selectedOperation.operationalMetrics.departmentMetrics?.length > 0 && (
            <div className="operations-metrics-departments" data-testid="react-operations-metrics-departments">
              <strong>Department risk ranking</strong>
              <ol>
                {selectedOperation.operationalMetrics.departmentMetrics.slice(0, 4).map(department => (
                  <li key={department.departmentRole}>
                    <span>{department.departmentRole}</span>
                    <strong>{department.taskCompletionPercent}% tasks complete</strong>
                    <em>Risk {department.riskScore} · {department.staffingGap} staffing gap · {department.openEscalationCount} open escalations</em>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}


      {selectedOperation?.playbookTemplate && (
        <section className="operations-playbook" aria-labelledby="operations-playbook-heading" data-testid="react-operations-playbook-template">
          <div className="operations-playbook-header">
            <div>
              <p className="eyebrow ce-kicker">Reusable playbook</p>
              <h4 id="operations-playbook-heading">Turnaround template promotion plan</h4>
              <p>{selectedOperation.playbookTemplate.templateName} can be reviewed as a repeatable operating playbook for similar ships, ports, and passenger loads.</p>
            </div>
            <div className="operations-playbook-score" aria-label={`Template readiness ${selectedOperation.playbookTemplate.summary?.templateReadinessScore || 0}%`}>
              <span>{selectedOperation.playbookTemplate.summary?.templateReadinessScore || 0}%</span>
              <small>{String(selectedOperation.playbookTemplate.summary?.templateReadinessStatus || 'REVIEW').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-playbook-grid" data-testid="react-operations-playbook-checks">
            {(selectedOperation.playbookTemplate.checks || []).map(check => (
              <article className={`operations-playbook-check ${String(check.status || '').toLowerCase()}`} key={check.id}>
                <span>{check.label}</span>
                <strong>{check.status}</strong>
                <em>{check.detail}</em>
              </article>
            ))}
          </div>
          <div className="operations-playbook-details">
            <div data-testid="react-operations-playbook-departments">
              <strong>Department playbooks</strong>
              <ul>
                {(selectedOperation.playbookTemplate.departmentPlaybooks || []).slice(0, 5).map(department => (
                  <li key={department.departmentRole}>
                    <span>{department.departmentRole}</span>
                    <em>{department.taskCount} tasks · {department.plannedStaff} planned staff · {department.recommendedCadence}</em>
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-playbook-actions">
              <strong>Next best actions</strong>
              <ul>
                {(selectedOperation.playbookTemplate.nextBestActions || []).slice(0, 3).map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.playbookVariance && (
        <section className="operations-playbook-variance" aria-labelledby="operations-playbook-variance-heading" data-testid="react-operations-playbook-variance">
          <div className="operations-playbook-variance-header">
            <div>
              <p className="eyebrow ce-kicker">Playbook variance</p>
              <h4 id="operations-playbook-variance-heading">Live execution versus template baseline</h4>
              <p>Rehearsal scoring compares this turnaround against the reusable playbook so operators can see whether today is tracking like a repeatable ship and port pattern.</p>
            </div>
            <div className={`operations-playbook-variance-score ${String(selectedOperation.playbookVariance.status || '').toLowerCase()}`}>
              <span>{selectedOperation.playbookVariance.summary?.rehearsalScore || 0}%</span>
              <small>{String(selectedOperation.playbookVariance.summary?.rehearsalStatus || 'REVIEW').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-playbook-variance-grid" data-testid="react-operations-playbook-variance-departments">
            {(selectedOperation.playbookVariance.departmentVariances || []).slice(0, 4).map(department => (
              <article className={`operations-playbook-variance-card ${String(department.status || '').toLowerCase()}`} key={department.departmentRole}>
                <span>{department.departmentRole}</span>
                <strong>{department.status}</strong>
                <em>{department.completeTaskCount}/{department.baselineTaskCount} tasks · {department.checkedInStaff}/{department.baselinePlannedStaff} staff · variance {department.varianceScore}</em>
              </article>
            ))}
          </div>
          <div className="operations-playbook-variance-actions" data-testid="react-operations-playbook-variance-actions">
            <strong>Rehearsal actions</strong>
            <ul>
              {(selectedOperation.playbookVariance.rehearsalActions || []).slice(0, 3).map(action => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </section>
      )}


      {selectedOperation?.incidentCommand && (
        <section className="operations-incident-command" aria-labelledby="operations-incident-command-heading" data-testid="react-operations-incident-command">
          <div className="operations-incident-command-header">
            <div>
              <p className="eyebrow ce-kicker">Incident command</p>
              <h4 id="operations-incident-command-heading">Release-day exception bridge</h4>
              <p>Incident command converts blockers, staffing gaps, signoffs, handoffs, dependencies, escalations, and timeline risk into one commander-facing action bridge.</p>
            </div>
            <div className={`operations-incident-command-score ${String(selectedOperation.incidentCommand.incidentSeverity || '').toLowerCase()}`}>
              <span>{selectedOperation.incidentCommand.incidentScore || 0}</span>
              <small>{String(selectedOperation.incidentCommand.incidentStatus || 'STABLE').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-incident-command-grid" data-testid="react-operations-incident-signals">
            {(selectedOperation.incidentCommand.incidentSignals || []).slice(0, 4).map(signal => (
              <article className={`operations-incident-command-card ${String(signal.severity || '').toLowerCase()}`} key={signal.id || `${signal.source}-${signal.title}`}>
                <span>{signal.departmentRole}</span>
                <strong>{signal.title}</strong>
                <em>{signal.source} · {signal.ownerDisplayName}</em>
                <p>{signal.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-incident-command-footer">
            <div data-testid="react-operations-incident-departments">
              <strong>Top incident departments</strong>
              <ul>
                {(selectedOperation.incidentCommand.incidentDepartments || []).slice(0, 3).map(department => (
                  <li key={department.departmentRole}>{department.departmentRole}: risk {department.riskScore}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-incident-actions">
              <strong>Command actions</strong>
              <ul>
                {(selectedOperation.incidentCommand.commandActions || []).slice(0, 4).map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.outreachBoard && (
        <section className="operations-outreach-board" aria-labelledby="operations-outreach-board-heading" data-testid="react-operations-outreach-board">
          <div className="operations-outreach-board-header">
            <div>
              <p className="eyebrow ce-kicker">Cruise-line outreach board</p>
              <h4 id="operations-outreach-board-heading">Application-ready reviewer strategy</h4>
              <p>{selectedOperation.outreachBoard.narrative?.positioning}</p>
            </div>
            <div className={`operations-outreach-board-score ${String(selectedOperation.outreachBoard.readiness?.readinessStatus || '').toLowerCase()}`} aria-label={`Outreach readiness score ${selectedOperation.outreachBoard.readiness?.readinessScore || 0}%`}>
              <span>{selectedOperation.outreachBoard.readiness?.readinessScore || 0}%</span>
              <small>{String(selectedOperation.outreachBoard.readiness?.readinessStatus || 'REVIEW_BEFORE_SEND').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-outreach-board-narrative" data-testid="react-operations-outreach-board-narrative">
            <strong>{selectedOperation.outreachBoard.narrative?.headline}</strong>
            <p>{selectedOperation.outreachBoard.narrative?.statusLine}</p>
            <p>{selectedOperation.outreachBoard.narrative?.recommendedAction}</p>
          </div>
          <div className="operations-outreach-board-grid" data-testid="react-operations-outreach-checklist">
            {(selectedOperation.outreachBoard.checklist || []).slice(0, 5).map(item => (
              <article className={`operations-outreach-board-card ${String(item.status || '').toLowerCase()}`} key={item.id}>
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-outreach-board-details">
            <div data-testid="react-operations-outreach-assets">
              <strong>Reviewer assets</strong>
              <ul>
                {(selectedOperation.outreachBoard.assets || []).slice(0, 4).map(asset => (
                  <li key={asset.id}><span>{asset.status}</span> {asset.label}: {asset.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-outreach-targets">
              <strong>Target recommendations</strong>
              <ul>
                {(selectedOperation.outreachBoard.targetRecommendations || []).slice(0, 4).map(target => (
                  <li key={target.id}><span>{target.status}</span> {target.label}: {target.detail}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-outreach-board-actions" data-testid="react-operations-outreach-actions">
            <strong>Application action plan</strong>
            <ol>
              {(selectedOperation.outreachBoard.actionPlan || []).slice(0, 4).map(action => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </div>
        </section>
      )}


      {selectedOperation?.scenarioPlan && (
        <section className="operations-scenario-plan" aria-labelledby="operations-scenario-plan-heading" data-testid="react-operations-scenario-plan">
          <div className="operations-scenario-plan-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround scenario plan</p>
              <h4 id="operations-scenario-plan-heading">Operational resilience drills and contingencies</h4>
              <p>{selectedOperation.scenarioPlan.summary}</p>
            </div>
            <div className={`operations-scenario-plan-score ${String(selectedOperation.scenarioPlan.scenarioStatus || '').toLowerCase()}`} aria-label={`Scenario resilience score ${selectedOperation.scenarioPlan.resilienceScore || 0}%`}>
              <span>{selectedOperation.scenarioPlan.resilienceScore || 0}%</span>
              <small>{String(selectedOperation.scenarioPlan.scenarioStatus || 'WATCH_ITEMS_PRESENT').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-scenario-plan-summary" data-testid="react-operations-scenario-plan-summary">
            <strong>{selectedOperation.scenarioPlan.headline}</strong>
            <p>Evidence: release {selectedOperation.scenarioPlan.evidence?.releaseStatus}, incident {selectedOperation.scenarioPlan.evidence?.incidentSeverity}, launch {selectedOperation.scenarioPlan.evidence?.launchStatus}, management {selectedOperation.scenarioPlan.evidence?.managementStatus}.</p>
          </div>
          <div className="operations-scenario-plan-grid" data-testid="react-operations-scenario-stress-cases">
            {(selectedOperation.scenarioPlan.stressCases || []).slice(0, 5).map(stressCase => (
              <article className={`operations-scenario-plan-card ${String(stressCase.status || '').toLowerCase()}`} key={stressCase.id}>
                <span>{stressCase.resilienceScore}% · {String(stressCase.status || 'REVIEW').replace(/_/g, ' ')}</span>
                <strong>{stressCase.label}</strong>
                <p>{stressCase.trigger}</p>
                <p>{stressCase.response}</p>
              </article>
            ))}
          </div>
          <div className="operations-scenario-plan-details">
            <div data-testid="react-operations-scenario-triggers">
              <strong>Trigger matrix</strong>
              <ul>
                {(selectedOperation.scenarioPlan.triggerMatrix || []).slice(0, 5).map(trigger => (
                  <li key={trigger.id}><span>{trigger.severity}</span> {trigger.owner}: {trigger.trigger}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-scenario-actions">
              <strong>Contingency actions</strong>
              <ul>
                {(selectedOperation.scenarioPlan.contingencyActions || []).slice(0, 6).map(action => (
                  <li key={action.id}><span>{action.priority}</span> {action.owner}: {action.label} — {action.detail}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-scenario-plan-runbook" data-testid="react-operations-scenario-runbook">
            <strong>Reviewer-safe drill runbook</strong>
            <ol>
              {(selectedOperation.scenarioPlan.drillRunbook || []).slice(0, 6).map(step => (
                <li key={step.id}><span>{step.label}</span> {step.detail}</li>
              ))}
            </ol>
          </div>
        </section>
      )}


      {false && selectedOperation?.productionReadiness && (
        <section className="operations-production-readiness" aria-labelledby="operations-production-readiness-heading" data-testid="react-operations-production-readiness">
          <div className="operations-production-readiness-header">
            <div>
              <p className="eyebrow ce-kicker">Production readiness cockpit</p>
              <h4 id="operations-production-readiness-heading">Reviewer demo readiness and test ownership</h4>
              <p>{selectedOperation.productionReadiness.summary}</p>
            </div>
            <div className={`operations-production-readiness-score ${String(selectedOperation.productionReadiness.productionStatus || '').toLowerCase()}`} aria-label={`Production readiness score ${selectedOperation.productionReadiness.productionScore || 0}%`}>
              <span>{selectedOperation.productionReadiness.productionScore || 0}%</span>
              <small>{String(selectedOperation.productionReadiness.productionStatus || 'NEEDS_HARDENING').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-production-readiness-summary" data-testid="react-operations-production-readiness-summary">
            <strong>{selectedOperation.productionReadiness.headline}</strong>
            <p>{selectedOperation.productionReadiness.nextAction}</p>
          </div>
          <div className="operations-production-readiness-grid" data-testid="react-operations-production-readiness-gates">
            {(selectedOperation.productionReadiness.gates || []).slice(0, 8).map(gate => (
              <article className={`operations-production-readiness-card ${String(gate.status || '').toLowerCase()}`} key={gate.id}>
                <span>{gate.readinessScore}% · {String(gate.status || 'REVIEW').replace(/_/g, ' ')}</span>
                <strong>{gate.label}</strong>
                <p>{gate.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-production-readiness-details">
            <div data-testid="react-operations-production-readiness-blockers">
              <strong>Production-demo blockers</strong>
              <ul>
                {(selectedOperation.productionReadiness.blockers || []).slice(0, 8).map(blocker => (
                  <li key={blocker.id}><span>{blocker.severity}</span> {blocker.owner}: {blocker.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-production-readiness-testing-contract">
              <strong>Testing ownership contract</strong>
              <ul>
                {(selectedOperation.productionReadiness.testingContract || []).slice(0, 4).map(item => (
                  <li key={item.id}><span>{item.layer}</span> {item.status}: {item.coverage}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-production-readiness-runbook" data-testid="react-operations-production-readiness-runbook">
            <strong>Production-demo runbook</strong>
            <ol>
              {(selectedOperation.productionReadiness.runbook || []).slice(0, 8).map(step => (
                <li key={step.id}><span>{step.label}</span> {step.owner}: {step.detail}</li>
              ))}
            </ol>
          </div>
        </section>
      )}


      {false && selectedOperation?.applicationDossier && (
        <section className="operations-application-dossier" aria-labelledby="operations-application-dossier-heading" data-testid="react-operations-application-dossier">
          <div className="operations-application-dossier-header">
            <div>
              <p className="eyebrow ce-kicker">Application dossier</p>
              <h4 id="operations-application-dossier-heading">Cruise-line application proof package</h4>
              <p>{selectedOperation.applicationDossier.summary}</p>
            </div>
            <div className={`operations-application-dossier-score ${String(selectedOperation.applicationDossier.dossierStatus || '').toLowerCase()}`} aria-label={`Application dossier score ${selectedOperation.applicationDossier.dossierScore || 0}%`}>
              <span>{selectedOperation.applicationDossier.dossierScore || 0}%</span>
              <small>{String(selectedOperation.applicationDossier.dossierStatus || 'NEEDS_PROOF_HARDENING').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-application-dossier-summary" data-testid="react-operations-application-dossier-summary">
            <strong>{selectedOperation.applicationDossier.reviewerNarrative?.headline}</strong>
            <p>{selectedOperation.applicationDossier.nextAction}</p>
            <p>{selectedOperation.applicationDossier.reviewerNarrative?.opener}</p>
          </div>
          <div className="operations-application-dossier-grid" data-testid="react-operations-application-dossier-evidence">
            {(selectedOperation.applicationDossier.evidenceSections || []).slice(0, 5).map(section => (
              <article className={`operations-application-dossier-card ${String(section.readiness || '').toLowerCase()}`} key={section.id}>
                <span>{section.score}% · {String(section.readiness || 'REVIEW').replace(/_/g, ' ')}</span>
                <strong>{section.label}</strong>
                <p>{section.detail}</p>
                <small>{section.status}</small>
              </article>
            ))}
          </div>
          <div className="operations-application-dossier-details">
            <div data-testid="react-operations-application-dossier-checklist">
              <strong>Application checklist</strong>
              <ul>
                {(selectedOperation.applicationDossier.checklist || []).slice(0, 8).map(item => (
                  <li key={item.id}><span>{item.status}</span> {item.label}: {item.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-application-dossier-narrative">
              <strong>Reviewer narrative</strong>
              <ul>
                <li>{selectedOperation.applicationDossier.reviewerNarrative?.strongestProof}</li>
                <li>{selectedOperation.applicationDossier.reviewerNarrative?.weakestProof}</li>
                <li>{selectedOperation.applicationDossier.reviewerNarrative?.close}</li>
              </ul>
            </div>
          </div>
          <div className="operations-application-dossier-steps" data-testid="react-operations-application-dossier-next-steps">
            <strong>Next application steps</strong>
            <ol>
              {(selectedOperation.applicationDossier.nextApplicationSteps || []).slice(0, 5).map(step => (
                <li key={step.id}><span>{step.priority}</span> {step.owner}: {step.detail}</li>
              ))}
            </ol>
          </div>
        </section>
      )}


      {selectedOperation?.commandCenter && (
        <section className="operations-command-center" aria-labelledby="operations-command-center-heading" data-testid="react-operations-command-center">
          <div className="operations-command-center-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround command center</p>
              <h4 id="operations-command-center-heading">Live management board from assignment through closeout</h4>
              <p>{selectedOperation.commandCenter.commanderBrief?.summary}</p>
            </div>
            <div className={`operations-command-center-score ${String(selectedOperation.commandCenter.commandStatus || '').toLowerCase()}`} aria-label={`Command center score ${selectedOperation.commandCenter.commandScore || 0}%`}>
              <span>{selectedOperation.commandCenter.commandScore || 0}%</span>
              <small>{String(selectedOperation.commandCenter.commandStatus || 'ACTIVE_COMMAND').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-command-center-brief" data-testid="react-operations-command-center-brief">
            <strong>{selectedOperation.commandCenter.commanderBrief?.headline}</strong>
            <p>{selectedOperation.commandCenter.commanderBrief?.nextDecision}</p>
            <p>{selectedOperation.commandCenter.commanderBrief?.activePhase}</p>
          </div>
          <dl className="operations-command-center-kpis" aria-label="Turnaround command center KPIs" data-testid="react-operations-command-center-kpis">
            {(selectedOperation.commandCenter.kpis || []).slice(0, 6).map(kpi => (
              <div key={kpi.id}>
                <dt>{kpi.label}</dt>
                <dd>{kpi.value}</dd>
                <small>{kpi.detail}</small>
              </div>
            ))}
          </dl>
          <div className="operations-command-center-grid">
            <div data-testid="react-operations-command-center-decisions">
              <strong>Command decision queue</strong>
              <ol>
                {(selectedOperation.commandCenter.decisionQueue || []).slice(0, 8).map(decision => (
                  <li key={decision.id}><span>{decision.severity}</span> {decision.owner}: {decision.decision}. {decision.action}</li>
                ))}
              </ol>
            </div>
            <div data-testid="react-operations-command-center-critical-path">
              <strong>Critical path</strong>
              <ol>
                {(selectedOperation.commandCenter.criticalPath || []).slice(0, 6).map(phase => (
                  <li key={phase.id}><span>{phase.score}% · {phase.status}</span> {phase.label}: {phase.evidence}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="operations-command-center-departments" data-testid="react-operations-command-center-departments">
            <strong>Department command board</strong>
            <div className="operations-command-center-department-grid">
              {(selectedOperation.commandCenter.departmentBoard || []).slice(0, 8).map(department => (
                <article key={department.departmentRole}>
                  <span>{department.readinessScore}% · {department.status}</span>
                  <strong>{department.departmentRole}</strong>
                  <p>{department.nextAction}</p>
                  <small>{department.taskCount} tasks · {department.openEscalations} escalations · {department.signoffCompletion}% signoff</small>
                </article>
              ))}
            </div>
          </div>
          <div className="operations-command-center-handoffs" data-testid="react-operations-command-center-handoffs">
            <strong>Handoff timeline</strong>
            <ul>
              {(selectedOperation.commandCenter.handoffTimeline || []).slice(0, 8).map(handoff => (
                <li key={handoff.id}><span>{handoff.dueTime} · {handoff.status}</span> {handoff.owner}: {handoff.detail}</li>
              ))}
            </ul>
          </div>
        </section>
      )}


      {selectedOperation?.operationsControlBoard && (
        <section className={`operations-control-board ${String(selectedOperation.operationsControlBoard.summary?.goNoGoStatus || '').toLowerCase().replace(/_/g, '-')}`} aria-labelledby="operations-control-board-heading" data-testid="react-operations-control-board">
          <div className="operations-control-board-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround operations control board</p>
              <h4 id="operations-control-board-heading">Unified command view for readiness, blockers, continuity, shift priorities, and go/no-go</h4>
              <p>{selectedOperation.operationsControlBoard.summary?.headline}</p>
              <small>{selectedOperation.operationsControlBoard.summary?.nextBestAction}</small>
            </div>
            <div className={`operations-control-board-score ${String(selectedOperation.operationsControlBoard.summary?.goNoGoStatus || '').toLowerCase().replace(/_/g, '-')}`} aria-label={`Operations control board score ${selectedOperation.operationsControlBoard.summary?.controlScore || 0}%`}>
              <span>{selectedOperation.operationsControlBoard.summary?.controlScore || 0}%</span>
              <small>{String(selectedOperation.operationsControlBoard.summary?.goNoGoStatus || 'WATCH').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <dl className="operations-control-board-kpis" aria-label="Operations control board KPIs" data-testid="react-operations-control-board-kpis">
            <div>
              <dt>Blocked tasks</dt>
              <dd>{selectedOperation.operationsControlBoard.summary?.blockedTasks || 0}</dd>
            </div>
            <div>
              <dt>Open dependencies</dt>
              <dd>{selectedOperation.operationsControlBoard.summary?.openDependencies || 0}</dd>
            </div>
            <div>
              <dt>Continuity score</dt>
              <dd>{selectedOperation.operationsControlBoard.summary?.continuityScore || 0}%</dd>
            </div>
            <div>
              <dt>Go-live score</dt>
              <dd>{selectedOperation.operationsControlBoard.summary?.goLiveScore || 0}%</dd>
            </div>
          </dl>
          <div className="operations-control-board-lanes" data-testid="react-operations-control-board-lanes">
            {(selectedOperation.operationsControlBoard.lanes || []).map(lane => (
              <article key={lane.id} className={`operations-control-board-lane ${String(lane.status || '').toLowerCase().replace(/_/g, '-')}`}>
                <span>{lane.score}% · {String(lane.status || '').replace(/_/g, ' ')}</span>
                <strong>{lane.label}</strong>
                <p>{lane.evidence}</p>
              </article>
            ))}
          </div>
          <div className="operations-control-board-grid">
            <div data-testid="react-operations-control-board-priorities">
              <strong>Command priorities</strong>
              <ol>
                {(selectedOperation.operationsControlBoard.priorityActions || []).slice(0, 8).map(action => (
                  <li key={action.id}><span>{action.priority} · {action.source}</span> {action.owner}: {action.action}</li>
                ))}
              </ol>
            </div>
            <div data-testid="react-operations-control-board-rhythm">
              <strong>Control rhythm</strong>
              <ol>
                {(selectedOperation.operationsControlBoard.commandRhythm || []).map(item => <li key={item}>{item}</li>)}
              </ol>
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.continuityCenter && (
        <section className={`operations-continuity-center ${String(selectedOperation.continuityCenter.commandStatus || '').toLowerCase()}`} aria-labelledby="operations-continuity-center-heading" data-testid="react-operations-continuity-center">
          <div className="operations-continuity-center-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround continuity center</p>
              <h4 id="operations-continuity-center-heading">Exception recovery and passenger-impact control</h4>
              <p>{selectedOperation.continuityCenter.summary}</p>
            </div>
            <div className={`operations-continuity-center-score ${String(selectedOperation.continuityCenter.commandStatus || '').toLowerCase()}`} aria-label={`Continuity score ${selectedOperation.continuityCenter.continuityScore || 0}%`}>
              <span>{selectedOperation.continuityCenter.continuityScore || 0}%</span>
              <small>{String(selectedOperation.continuityCenter.commandStatus || 'CONTINUITY_WATCH').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-continuity-impact" data-testid="react-operations-continuity-impact">
            <strong>{selectedOperation.continuityCenter.headline}</strong>
            <p>{selectedOperation.continuityCenter.passengerImpact}</p>
            <p>{selectedOperation.continuityCenter.executivePrompt}</p>
          </div>
          <div className="operations-continuity-grid">
            <div data-testid="react-operations-continuity-scenarios">
              <strong>Scenario recovery plays</strong>
              <ol>
                {(selectedOperation.continuityCenter.scenarios || []).slice(0, 6).map(scenario => (
                  <li key={scenario.id}><span>{scenario.severity}</span> {scenario.label}: {scenario.trigger}. {scenario.play}</li>
                ))}
              </ol>
            </div>
            <div data-testid="react-operations-continuity-runbook">
              <strong>Continuity runbook</strong>
              <ol>
                {(selectedOperation.continuityCenter.runbook || []).slice(0, 6).map(step => (
                  <li key={step.id}><span>{step.owner}</span> {step.label}: {step.action}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="operations-continuity-departments" data-testid="react-operations-continuity-departments">
            <strong>Department continuity board</strong>
            <div className="operations-continuity-department-grid">
              {(selectedOperation.continuityCenter.departmentContinuity || []).slice(0, 8).map(department => (
                <article key={department.departmentRole}>
                  <span>{department.score}% · {department.status}</span>
                  <strong>{department.departmentRole}</strong>
                  <p>{department.nextAction}</p>
                  <small>{department.openTasks} open tasks · {department.openEscalations} escalations · {department.openDependencies} dependencies</small>
                </article>
              ))}
            </div>
          </div>
          <div className="operations-continuity-watchlist" data-testid="react-operations-continuity-watchlist">
            <strong>Continuity watchlist</strong>
            <ul>
              {(selectedOperation.continuityCenter.watchlist || []).slice(0, 8).map(item => (
                <li key={item.id}><span>{item.type}</span> {item.owner}: {item.label}. {item.detail}</li>
              ))}
            </ul>
          </div>
          <div className="operations-continuity-checklist" data-testid="react-operations-continuity-checklist">
            <strong>Evidence checklist</strong>
            <ul>
              {(selectedOperation.continuityCenter.evidenceChecklist || []).slice(0, 6).map(item => (
                <li key={item.id}><span>{item.complete ? 'Ready' : 'Open'}</span> {item.label}</li>
              ))}
            </ul>
          </div>
        </section>
      )}


      {selectedOperation?.shiftBriefing && (
        <section className="operations-shift-briefing" aria-labelledby="operations-shift-briefing-heading" data-testid="react-operations-shift-briefing">
          <div className="operations-shift-briefing-header">
            <div>
              <p className="eyebrow ce-kicker">Shift briefing</p>
              <h4 id="operations-shift-briefing-heading">Next-shift command handoff</h4>
              <p>One focused briefing translates live turnaround risk into what the next operations lead must know: critical items, department focus, and handoff checklist status.</p>
            </div>
            <div className={`operations-shift-briefing-score ${String(selectedOperation.shiftBriefing.summary?.handoffStatus || '').toLowerCase()}`} aria-label={`Shift briefing score ${selectedOperation.shiftBriefing.summary?.briefingScore || 0}%`}>
              <span>{selectedOperation.shiftBriefing.summary?.briefingScore || 0}%</span>
              <small>{String(selectedOperation.shiftBriefing.summary?.handoffStatus || 'WATCH_HANDOFF').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <dl className="operations-shift-briefing-kpis" aria-label="Shift briefing summary" data-testid="react-operations-shift-briefing-kpis">
            <div>
              <dt>Actions</dt>
              <dd>{selectedOperation.shiftBriefing.summary?.actionCount || 0}</dd>
            </div>
            <div>
              <dt>Watch</dt>
              <dd>{selectedOperation.shiftBriefing.summary?.watchCount || 0}</dd>
            </div>
            <div>
              <dt>Critical</dt>
              <dd>{selectedOperation.shiftBriefing.summary?.criticalItemCount || 0}</dd>
            </div>
            <div>
              <dt>Next focus</dt>
              <dd>{selectedOperation.shiftBriefing.summary?.nextShiftFocus || 'All departments'}</dd>
            </div>
          </dl>
          <div className="operations-shift-briefing-grid">
            <div data-testid="react-operations-shift-briefing-critical-items">
              <strong>Critical handoff items</strong>
              <ul>
                {(selectedOperation.shiftBriefing.criticalItems || []).slice(0, 8).map(item => (
                  <li key={item.id}><span>{item.type}</span> {item.departmentRole} · {item.owner}: {item.label}. {item.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-shift-briefing-checklist">
              <strong>Shift handoff checklist</strong>
              <ol>
                {(selectedOperation.shiftBriefing.checklist || []).slice(0, 6).map(item => (
                  <li key={item.id}><span>{item.status}</span> {item.label}: {item.detail}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="operations-shift-briefing-departments" data-testid="react-operations-shift-briefing-departments">
            <strong>Department briefing focus</strong>
            <div className="operations-shift-briefing-department-grid">
              {(selectedOperation.shiftBriefing.departmentBriefs || []).slice(0, 6).map(department => (
                <article key={department.departmentRole}>
                  <span>{department.completionPercent}% complete · {department.signoffStatus}</span>
                  <strong>{department.departmentRole}</strong>
                  <p>{department.briefingFocus}</p>
                  <small>{department.blockedTasks} blocked · {department.staffingGap} staffing gap · {department.openEscalations} escalations</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.goLiveCenter && (
        <section className={`operations-go-live-center ${String(selectedOperation.goLiveCenter.summary?.goLiveStatus || '').toLowerCase()}`} aria-labelledby="operations-go-live-heading" data-testid="react-operations-go-live-center">
          <div className="operations-go-live-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround go-live center</p>
              <h4 id="operations-go-live-heading">Launch decision, remaining scope, and deployment proof</h4>
              <p>{selectedOperation.goLiveCenter.summary?.launchRecommendation}</p>
              <small>{selectedOperation.goLiveCenter.context}</small>
            </div>
            <div className={`operations-go-live-score ${String(selectedOperation.goLiveCenter.summary?.goLiveStatus || '').toLowerCase()}`} aria-label={`Go-live score ${selectedOperation.goLiveCenter.summary?.goLiveScore || 0}%`}>
              <span>{selectedOperation.goLiveCenter.summary?.goLiveScore || 0}%</span>
              <small>{String(selectedOperation.goLiveCenter.summary?.goLiveStatus || 'NO_GO').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <dl className="operations-go-live-kpis" aria-label="Go-live summary" data-testid="react-operations-go-live-kpis">
            <div>
              <dt>Go gates</dt>
              <dd>{selectedOperation.goLiveCenter.summary?.goGateCount || 0}</dd>
            </div>
            <div>
              <dt>Watch</dt>
              <dd>{selectedOperation.goLiveCenter.summary?.watchCount || 0}</dd>
            </div>
            <div>
              <dt>No-go</dt>
              <dd>{selectedOperation.goLiveCenter.summary?.noGoCount || 0}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>{selectedOperation.goLiveCenter.summary?.actionCount || 0}</dd>
            </div>
          </dl>
          <div className="operations-go-live-grid">
            <div data-testid="react-operations-go-live-gates">
              <strong>Launch gates</strong>
              <ul>
                {(selectedOperation.goLiveCenter.gates || []).slice(0, 6).map(gate => (
                  <li key={gate.id}><span>{gate.status}</span> {gate.label} · {gate.score}% — {gate.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-go-live-actions">
              <strong>Remaining launch actions</strong>
              <ol>
                {(selectedOperation.goLiveCenter.actions || []).slice(0, 8).map(action => (
                  <li key={action.id}><span>{action.priority}</span> {action.owner}: {action.action}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="operations-go-live-evidence" data-testid="react-operations-go-live-evidence">
            <strong>Deployment proof checklist</strong>
            <div className="operations-go-live-evidence-grid">
              {(selectedOperation.goLiveCenter.evidence || []).slice(0, 6).map(item => (
                <article key={item.id}>
                  <span>{item.status}</span>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="operations-go-live-scope" data-testid="react-operations-go-live-scope">
            <strong>Remaining scope before public launch</strong>
            <ul>
              {(selectedOperation.goLiveCenter.remainingScope || []).map(item => (
                <li key={item.id}><span>{item.status}</span> {item.label}: {item.detail}</li>
              ))}
            </ul>
          </div>
        </section>
      )}


      {selectedOperation?.closeoutPacket && (
        <section className="operations-closeout-packet" aria-labelledby="operations-closeout-packet-heading" data-testid="react-operations-closeout-packet">
          <div className="operations-closeout-packet-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround closeout packet</p>
              <h4 id="operations-closeout-packet-heading">Final management closeout and reusable operation proof</h4>
              <p>{selectedOperation.closeoutPacket.narrative?.summary}</p>
            </div>
            <div className={`operations-closeout-packet-score ${String(selectedOperation.closeoutPacket.closeoutStatus || '').toLowerCase()}`} aria-label={`Closeout score ${selectedOperation.closeoutPacket.closeoutScore || 0}%`}>
              <span>{selectedOperation.closeoutPacket.closeoutScore || 0}%</span>
              <small>{String(selectedOperation.closeoutPacket.closeoutStatus || 'NOT_READY_TO_CLOSE').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-closeout-packet-summary" data-testid="react-operations-closeout-summary">
            <strong>{selectedOperation.closeoutPacket.narrative?.headline}</strong>
            <p>{selectedOperation.closeoutPacket.narrative?.statusLine}</p>
            <p>{selectedOperation.closeoutPacket.narrative?.recommendation}</p>
          </div>
          <div className="operations-closeout-packet-grid" data-testid="react-operations-closeout-gates">
            {(selectedOperation.closeoutPacket.gates || []).slice(0, 8).map(gate => (
              <article className={`operations-closeout-packet-card ${String(gate.status || '').toLowerCase()}`} key={gate.id}>
                <span>{gate.readinessScore}% · {String(gate.status || 'REVIEW').replace(/_/g, ' ')}</span>
                <strong>{gate.label}</strong>
                <p>{gate.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-closeout-packet-details">
            <div data-testid="react-operations-closeout-checklist">
              <strong>Final closeout checklist</strong>
              <ol>
                {(selectedOperation.closeoutPacket.checklist || []).slice(0, 8).map(item => (
                  <li key={item.id}><span>{item.status}</span> {item.label}: {item.detail}</li>
                ))}
              </ol>
            </div>
            <div data-testid="react-operations-closeout-blockers">
              <strong>Closeout blockers and watch items</strong>
              <ul>
                {(selectedOperation.closeoutPacket.blockers || []).slice(0, 8).map(blocker => (
                  <li key={blocker.id}><span>{blocker.severity}</span> {blocker.owner}: {blocker.detail}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-closeout-packet-archive" data-testid="react-operations-closeout-evidence-archive">
            <strong>Evidence archive</strong>
            <div className="operations-closeout-packet-archive-grid">
              {(selectedOperation.closeoutPacket.evidenceArchive || []).slice(0, 6).map(evidence => (
                <article key={evidence.id}>
                  <span>{evidence.status}</span>
                  <strong>{evidence.label}</strong>
                  <p>{evidence.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.executiveBrief && (
        <section className="operations-executive-brief" aria-labelledby="operations-executive-brief-heading" data-testid="react-operations-executive-brief">
          <div className="operations-executive-brief-header">
            <div>
              <p className="eyebrow ce-kicker">Executive brief</p>
              <h4 id="operations-executive-brief-heading">Cruise-line ready turnaround summary</h4>
              <p>Executive brief consolidates release confidence, incident command, playbook variance, after-action lessons, and timeline depth into one reviewer-ready decision summary.</p>
            </div>
            <div className={`operations-executive-brief-score ${String(selectedOperation.executiveBrief.summary?.decisionTone || '').toLowerCase()}`} aria-label={`Executive readiness score ${selectedOperation.executiveBrief.summary?.decisionScore || 0}%`}>
              <span>{selectedOperation.executiveBrief.summary?.decisionScore || 0}%</span>
              <small>{String(selectedOperation.executiveBrief.summary?.decisionStatus || 'NEEDS_COMMAND_REVIEW').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <dl className="operations-executive-brief-kpis" aria-label="Executive turnaround readiness inputs" data-testid="react-operations-executive-brief-kpis">
            <div>
              <dt>Release</dt>
              <dd>{selectedOperation.executiveBrief.summary?.releaseConfidence || 0}%</dd>
            </div>
            <div>
              <dt>Incident</dt>
              <dd>{selectedOperation.executiveBrief.summary?.incidentScore || 0}</dd>
            </div>
            <div>
              <dt>Debrief</dt>
              <dd>{selectedOperation.executiveBrief.summary?.reviewScore || 0}%</dd>
            </div>
            <div>
              <dt>Rehearsal</dt>
              <dd>{selectedOperation.executiveBrief.summary?.rehearsalScore || 0}%</dd>
            </div>
          </dl>
          <div className="operations-executive-brief-grid" data-testid="react-operations-executive-brief-highlights">
            {(selectedOperation.executiveBrief.highlights || []).slice(0, 4).map(highlight => (
              <article className="operations-executive-brief-card" key={highlight.id}>
                <span>{highlight.status}</span>
                <strong>{highlight.label}</strong>
                <p>{highlight.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-executive-brief-details">
            <div data-testid="react-operations-executive-brief-departments">
              <strong>Executive department focus</strong>
              <ul>
                {(selectedOperation.executiveBrief.departmentBriefs || []).slice(0, 5).map(department => (
                  <li key={department.departmentRole}>
                    <span>{department.departmentRole}</span>
                    <em>Risk {department.riskScore || 0} · {department.driver || department.recommendation || 'Operational focus'}</em>
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-executive-brief-actions">
              <strong>Executive action plan</strong>
              <ul>
                {(selectedOperation.executiveBrief.executiveActions || []).slice(0, 6).map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.afterActionReview && (
        <section className="operations-after-action" aria-labelledby="operations-after-action-heading" data-testid="react-operations-after-action-review">
          <div className="operations-after-action-header">
            <div>
              <p className="eyebrow ce-kicker">After-action review</p>
              <h4 id="operations-after-action-heading">Turnaround debrief and promotion readiness</h4>
              <p>After-action review converts release confidence, playbook variance, incident risk, timeline activity, blockers, staffing gaps, and department outcomes into follow-up actions before the operation is promoted as a reusable pattern.</p>
            </div>
            <div className={`operations-after-action-score ${String(selectedOperation.afterActionReview.summary?.reviewStatus || '').toLowerCase()}`} aria-label={`After-action review score ${selectedOperation.afterActionReview.summary?.reviewScore || 0}%`}>
              <span>{selectedOperation.afterActionReview.summary?.reviewScore || 0}%</span>
              <small>{String(selectedOperation.afterActionReview.summary?.reviewStatus || 'FOLLOW_UP').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-after-action-grid" data-testid="react-operations-after-action-findings">
            {(selectedOperation.afterActionReview.findings || []).slice(0, 6).map(finding => (
              <article className={`operations-after-action-finding ${String(finding.status || '').toLowerCase()}`} key={finding.id}>
                <span>{finding.status}</span>
                <strong>{finding.label}</strong>
                <p>{finding.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-after-action-details">
            <div data-testid="react-operations-after-action-departments">
              <strong>Department lessons</strong>
              <ul>
                {(selectedOperation.afterActionReview.departmentLessons || []).slice(0, 4).map(department => (
                  <li key={department.departmentRole}>
                    <span>{department.departmentRole}</span>
                    <em>Score {department.lessonScore} · {department.completionPercent}% complete · {department.recommendation}</em>
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-after-action-followups">
              <strong>Follow-up actions</strong>
              <ul>
                {(selectedOperation.afterActionReview.followUpActions || []).slice(0, 5).map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}


      {selectedOperation?.operationalTimeline?.items?.length > 0 && (
        <section className="operations-timeline" aria-labelledby="operations-timeline-heading" data-testid="react-operations-timeline">
          <div className="operations-timeline-header">
            <div>
              <p className="eyebrow ce-kicker">Operations timeline</p>
              <h4 id="operations-timeline-heading">Live turnaround event timeline</h4>
              <p>One operational feed combines tasks, notes, staffing, signoffs, dependencies, handoffs, escalations, release readiness, and audit events.</p>
            </div>
            <dl className="operations-timeline-summary" aria-label="Turnaround timeline summary">
              <div>
                <dt>Total</dt>
                <dd>{selectedOperation.operationalTimeline.summary?.totalEvents || selectedOperation.operationalTimeline.items.length}</dd>
              </div>
              <div>
                <dt>Critical</dt>
                <dd>{selectedOperation.operationalTimeline.summary?.criticalCount || 0}</dd>
              </div>
              <div>
                <dt>Action</dt>
                <dd>{selectedOperation.operationalTimeline.summary?.actionCount || 0}</dd>
              </div>
            </dl>
          </div>
          <ol className="operations-timeline-list" aria-label="Unified turnaround operational timeline">
            {selectedOperation.operationalTimeline.items.slice(0, 10).map(item => (
              <li className={`operations-timeline-item ${getOperationalTimelineTone(item)}`} key={item.id} data-testid="react-operations-timeline-item">
                <span className="operations-timeline-marker" aria-hidden="true" />
                <div className="operations-timeline-card">
                  <div className="operations-timeline-card-heading">
                    <strong>{item.title}</strong>
                    <small>{formatOperationalTimelineSource(item.source)} · {item.status}</small>
                  </div>
                  <p>{item.detail || `${item.actorDisplayName || 'System actor'} moved this workstream forward.`}</p>
                  <div className="operations-timeline-meta">
                    <span>{item.actorDisplayName || 'System actor'}</span>
                    {item.departmentRole && <span>{item.departmentRole}</span>}
                    <span>{formatOperationalTimelineTime(item)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {selectedOperation?.auditEvents?.length > 0 && (
        <section className="operations-audit-trail" aria-labelledby="operations-audit-trail-heading" data-testid="react-operations-audit-trail">
          <div className="operations-audit-trail-header">
            <div>
              <p className="eyebrow ce-kicker">Audit trail</p>
              <h4 id="operations-audit-trail-heading">Recent operational changes</h4>
              <p>Every listed event is scoped to this turnaround assignment and actor context.</p>
            </div>
            <span>{selectedOperation.auditEvents.length} recent events</span>
          </div>
          <ol className="operations-audit-event-list" aria-label="Recent turnaround audit events">
            {selectedOperation.auditEvents.slice(0, 6).map(event => (
              <li key={event.id || `${event.eventType}-${event.createdAt}`}>
                <strong>{formatAuditEventType(event.eventType)}</strong>
                <span>{event.actorDisplayName || 'System actor'} · {event.createdAt || 'Time pending'}</span>
                {formatAuditEventPayload(event) && <em>{formatAuditEventPayload(event)}</em>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="operations-workspace-shell ce-command-panel" aria-labelledby="operations-workspace-heading" data-testid="react-operations-workspace-shell">
        <div className="operations-workspace-heading">
          <p className="eyebrow ce-kicker">Operations workspace</p>
          <h4 id="operations-workspace-heading">Focus by operational workstream</h4>
          <p>Select a workstream to orient the command center around the job this role needs to complete.</p>
        </div>
        <nav className="operations-workspace-nav" aria-label="Turnaround operations workstreams" data-testid="react-operations-workspace-nav">
          {operationsWorkspaceTabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              className={`operations-workspace-nav-button${activeOperationsWorkspace === tab.id ? ' active' : ''}`}
              aria-pressed={activeOperationsWorkspace === tab.id}
              onClick={() => focusOperationsWorkspace(tab.id)}
              data-testid={`react-operations-workspace-${tab.id}-button`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="operations-workspace-active-summary ce-command-card" data-testid="react-operations-workspace-active-summary">
          <strong>{activeOperationsWorkspaceDetails.label}</strong>
          <span>{activeOperationsWorkspaceDetails.summary}</span>
        </div>
      </section>

      {selectedOperation && (
        <section className="operations-role-brief-panel ce-command-panel" aria-labelledby="operations-role-brief-heading" data-testid="react-operations-role-brief-panel">
          <div className="operations-role-brief-heading">
            <div>
              <p className="eyebrow ce-kicker">Role command brief</p>
              <h4 id="operations-role-brief-heading">{roleOperationsBrief.roleLabel} priorities for {selectedOperation.title}</h4>
              <p>Use this department brief to move directly into the highest-value work for the selected turnaround.</p>
            </div>
            <span className={`operations-role-brief-alert${roleOperationsBrief.attentionCount > 0 ? ' needs-attention' : ''}`} data-testid="react-operations-role-brief-attention">
              {roleOperationsBrief.attentionCount > 0 ? `${roleOperationsBrief.attentionCount} needs attention` : 'No immediate blockers'}
            </span>
          </div>
          <div className="operations-role-brief-grid" data-testid="react-operations-role-brief-grid">
            {roleOperationsBrief.actionCards.map(card => (
              <button
                type="button"
                key={card.id}
                className={`operations-role-brief-card ce-command-card ${card.priority}`}
                onClick={() => focusOperationsWorkspace(card.id)}
                data-testid="react-operations-role-brief-card"
              >
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <em>{card.status}</em>
                <small>{card.description}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {operationalDirectory.length > 0 && selectedDirectoryEntry && (
        <section className="operations-directory-panel ce-command-panel" aria-labelledby="operations-directory-heading" data-testid="react-operations-directory-panel">
          <div className="operations-directory-heading">
            <div>
              <p className="eyebrow ce-kicker">Operations directory</p>
              <h4 id="operations-directory-heading">Department command directory</h4>
              <p>Select a department to review contacts, coverage, blockers, and coordination details without scanning every department card at once.</p>
            </div>
            <span className="operations-directory-count" data-testid="react-operations-directory-count">{operationalDirectory.length} departments</span>
          </div>
          <div className="operations-directory-layout">
            <div className="operations-directory-list" aria-label="Operational department directory">
              {operationalDirectory.map(entry => {
                const health = getDirectoryHealthStatus(entry)
                return (
                  <button
                    type="button"
                    className={`operations-directory-card ce-command-card${entry.role === selectedDirectoryEntry.role ? ' active' : ''}${entry.role === normalizeOperationalRoleName(roleView) ? ' current-role' : ''}`}
                    key={entry.role}
                    aria-pressed={entry.role === selectedDirectoryEntry.role}
                    onClick={() => setSelectedDirectoryRole(entry.role)}
                    data-testid="react-operations-directory-card"
                  >
                    <span className="operations-directory-card-title">
                      <span>
                        <span className="eyebrow ce-kicker">{entry.role === normalizeOperationalRoleName(roleView) ? 'Current role' : 'Partner role'}</span>
                        <strong>{entry.label}</strong>
                      </span>
                      <em className={`operations-directory-health ${health.tone}`}>{health.label}</em>
                    </span>
                    <span className="operations-directory-card-summary">
                      <strong>{entry.staffingPercent}%</strong> staffed · {entry.taskCount} tasks · {entry.activeEscalations} escalations
                    </span>
                  </button>
                )
              })}
            </div>
            <article className="operations-directory-detail ce-command-card" aria-label={`${selectedDirectoryEntry.label} department details`} data-testid="react-operations-directory-detail">
              <div className="operations-directory-detail-header">
                <div>
                  <p className="eyebrow ce-kicker">Department detail</p>
                  <h5>{selectedDirectoryEntry.label}</h5>
                </div>
                <span className={`operations-directory-health ${selectedDirectoryHealth.tone}`}>{selectedDirectoryHealth.label}</span>
              </div>
              <dl className="operations-directory-metrics">
                <div>
                  <dt>Staffed</dt>
                  <dd>{selectedDirectoryEntry.staffingPercent}%</dd>
                </div>
                <div>
                  <dt>Tasks</dt>
                  <dd>{selectedDirectoryEntry.taskCount}</dd>
                </div>
                <div>
                  <dt>Blocked</dt>
                  <dd>{selectedDirectoryEntry.blockedTasks + selectedDirectoryEntry.blockedHandoffs}</dd>
                </div>
                <div>
                  <dt>Handoffs</dt>
                  <dd>{selectedDirectoryEntry.handoffCount}</dd>
                </div>
                <div>
                  <dt>Escalations</dt>
                  <dd>{selectedDirectoryEntry.activeEscalations}</dd>
                </div>
              </dl>
              <div className="operations-directory-detail-grid">
                <div className="operations-directory-contact">
                  <strong>Contacts</strong>
                  <p>{selectedDirectoryEntry.leadNames.length ? selectedDirectoryEntry.leadNames.join(', ') : 'Lead assignment pending'}</p>
                </div>
                <div className="operations-directory-contact">
                  <strong>Muster / coordination</strong>
                  <p>{selectedDirectoryEntry.musterLocations.length ? selectedDirectoryEntry.musterLocations.join(', ') : 'Location pending'}</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}


      {selectedOperation && (
        <section className="operational-readiness-list operational-command-compatibility-panel" aria-label="Selected turnaround command workspace">
          {[selectedOperation].map(item => (
            <article className="operational-readiness-card ce-command-card" key={`command-${item.id}`} data-testid="react-operational-command-overview-card">
              <div>
                <p className="eyebrow ce-kicker">{item.status}</p>
                <h4>{item.title}</h4>
                <p>{item.shipName} · {item.route}</p>
                {item.notes && <p>{item.notes}</p>}
              </div>
              <dl className="role-booking-fields compact-fields">
                <div>
                  <dt>Sailing date</dt>
                  <dd>{item.sailingDate}</dd>
                </div>
                <div>
                  <dt>Turnaround port</dt>
                  <dd>{item.port || item.arrivalPort}</dd>
                </div>
                <div>
                  <dt>Passenger load</dt>
                  <dd>{item.passengerCount} passenger{item.passengerCount === 1 ? '' : 's'}</dd>
                </div>
                <div>
                  <dt>Readiness level</dt>
                  <dd>{item.readinessLevel}</dd>
                </div>
                <div>
                  <dt>Command status</dt>
                  <dd>{item.commandStatus || item.status}</dd>
                </div>
                <div>
                  <dt>Command readiness</dt>
                  <dd>{item.commandReadinessLevel || item.readinessLevel}</dd>
                </div>
              </dl>

              {onUpdateOperationCommand && roleView === 'turnaround-manager' && (
                <form className="operational-command-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
                  <label>
                    <span>Command status</span>
                    <select value={getOperationCommandDraft(item).status} onChange={event => updateOperationCommandDraft(item, 'status', event.target.value)} aria-label={`${item.title} command status`}>
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="READY">Ready</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </label>
                  <label>
                    <span>Command readiness</span>
                    <select value={getOperationCommandDraft(item).readinessLevel} onChange={event => updateOperationCommandDraft(item, 'readinessLevel', event.target.value)} aria-label={`${item.title} command readiness`}>
                      {COMMAND_READINESS_OPTIONS.map(option => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Turnaround port</span>
                    <input value={getOperationCommandDraft(item).port} onChange={event => updateOperationCommandDraft(item, 'port', event.target.value)} aria-label={`${item.title} turnaround port`} />
                  </label>
                  <label className="full-width-field">
                    <span>Command notes</span>
                    <textarea value={getOperationCommandDraft(item).notes} onChange={event => updateOperationCommandDraft(item, 'notes', event.target.value)} aria-label={`${item.title} command notes`} rows="3" />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
                </form>
              )}

              {onCreateTask && (
                <form className="operational-task-create-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
                  <label>
                    <span>New task department</span>
                    <select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
                      <option value="security-lead">Security Lead</option>
                      <option value="port-operations-lead">Port Operations Lead</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    <span>New task name</span>
                    <input value={getTaskCreateDraft(item).taskName} onChange={event => updateTaskCreateDraft(item, 'taskName', event.target.value)} aria-label={`${item.title} new task name`} />
                  </label>
                  <label>
                    <span>Owner</span>
                    <input value={getTaskCreateDraft(item).ownerName} onChange={event => updateTaskCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} new task owner`} />
                  </label>
                  <label>
                    <span>Due time</span>
                    <input value={getTaskCreateDraft(item).dueTime} onChange={event => updateTaskCreateDraft(item, 'dueTime', event.target.value)} aria-label={`${item.title} new task due time`} />
                  </label>
                  <label>
                    <span>Location</span>
                    <input value={getTaskCreateDraft(item).location} onChange={event => updateTaskCreateDraft(item, 'location', event.target.value)} aria-label={`${item.title} new task location`} />
                  </label>
                  <label className="full-width-field">
                    <span>Blocker reason</span>
                    <input value={getTaskCreateDraft(item).blockerReason} onChange={event => updateTaskCreateDraft(item, 'blockerReason', event.target.value)} aria-label={`${item.title} new task blocker reason`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
                </form>
              )}

              {item.tasks.length > 0 && (
                <ul className="operational-checklist" data-testid="react-operational-role-checklist-summary">
                  {item.tasks.map(task => (
                    <li key={task.id || `${item.id}-${task.taskName}`}>
                      <div><strong>{task.status}</strong> — {task.taskName}</div>
                      {task.ownerName && <p>{task.ownerDisplayName || task.ownerName}</p>}
                      {task.blockerReason && <p>Blocked: {task.blockerReason}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}

      {mutationStatus && <p className="status-card compact ce-command-card" data-testid="react-operational-mutation-status">{mutationStatus}</p>}
      {mutationError && <p className="status-card compact error ce-feedback-message ce-editor-card" data-testid="react-operational-mutation-error">{mutationError}</p>}

      {isLoading ? (
        <p className="status-card compact ce-command-card" data-testid="react-operational-loading-state">Loading turnaround operations from the database...</p>
      ) : error ? (
        <div className="status-card compact ce-command-card" data-testid="react-operational-error-state">
          <p>{error}</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={onRetry}>Retry turnaround data</button>
        </div>
      ) : readinessOperations.length === 0 ? (
        <p className="status-card compact ce-command-card" data-testid="react-operational-empty-state">No turnaround operation records are available yet.</p>
      ) : activeOperationsWorkspace === 'readiness' && selectedOperation ? (
        <section className="operations-readiness-workspace" aria-labelledby="operations-readiness-workspace-heading" data-testid="react-operations-readiness-workspace">
          <div className="operations-readiness-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Readiness Approvals</p>
              <h4 id="operations-readiness-workspace-heading">Readiness approvals for {selectedOperation.title}</h4>
              <p>Review department release decisions in one approval queue. Select a department to confirm status, approver ownership, and signoff notes before final turnaround release.</p>
            </div>
            <dl className="operations-readiness-workspace-metrics" aria-label="Selected turnaround readiness summary" data-testid="react-operations-readiness-workspace-summary">
              <div>
                <dt>Departments</dt>
                <dd>{readinessWorkspaceSummary.totalSignoffs}</dd>
              </div>
              <div>
                <dt>Approved</dt>
                <dd>{readinessWorkspaceSummary.approvedSignoffs}</dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd>{readinessWorkspaceSummary.pendingSignoffs}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{readinessWorkspaceSummary.blockedSignoffs}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationSignoffs.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-readiness-empty-state">No department readiness approvals are assigned to this turnaround yet.</p>
          ) : (
            <div className="operations-readiness-layout">
              <div className="operations-readiness-list-panel" aria-label="Department readiness approval queue">
                <div className="operations-readiness-list-heading">
                  <h5>Department approvals</h5>
                  <span>{readinessWorkspaceSummary.approvedSignoffs} of {readinessWorkspaceSummary.totalSignoffs} approved</span>
                </div>
                <ul className="operations-readiness-list" data-testid="react-operations-readiness-list">
                  {selectedOperationSignoffs.map(signoff => {
                    const isSelected = signoff.departmentRole === selectedReadinessKey
                    const signoffStatus = String(signoff.status || 'PENDING').toUpperCase()

                    return (
                      <li key={`${selectedOperation.id}-${signoff.departmentRole}`}>
                        <button
                          type="button"
                          className={`operations-readiness-list-item${isSelected ? ' active' : ''} ${signoffStatus.toLowerCase()}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedReadinessRole(signoff.departmentRole)}
                          data-testid="react-operations-readiness-list-item"
                        >
                          <span className={`operations-readiness-status-pill ${signoffStatus.toLowerCase()}`}>{signoffStatus}</span>
                          <strong>{getOperationalRoleLabel(signoff.departmentRole)}</strong>
                          <span>{getOperationalApproverDisplay(signoff)}</span>
                          {signoff.notes && <small>{signoff.notes}</small>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedReadinessSignoff && (
                <article className="operations-readiness-detail-panel" aria-label={`Readiness approval details for ${selectedReadinessSignoff.departmentRole}`} data-testid="react-operations-readiness-detail-panel">
                  <div className="operations-readiness-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Readiness Details</p>
                      <h5>{getOperationalRoleLabel(selectedReadinessSignoff.departmentRole)}</h5>
                    </div>
                    <span className={`operations-readiness-status-pill ${String(selectedReadinessSignoff.status || 'PENDING').toLowerCase()}`}>{selectedReadinessSignoff.status || 'PENDING'}</span>
                  </div>

                  <dl className="operations-readiness-detail-list" data-testid="react-operations-readiness-detail-list">
                    <div>
                      <dt>Department</dt>
                      <dd>{getOperationalRoleLabel(selectedReadinessSignoff.departmentRole)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedReadinessSignoff.status || 'PENDING'}</dd>
                    </div>
                    <div>
                      <dt>Approver</dt>
                      <dd>{getOperationalApproverDisplay(selectedReadinessSignoff)}</dd>
                    </div>
                    <div>
                      <dt>Signed at</dt>
                      <dd>{selectedReadinessSignoff.signedAt || 'Not signed yet'}</dd>
                    </div>
                  </dl>

                  {selectedReadinessSignoff.notes && (
                    <div className="operations-readiness-note" data-testid="react-operations-readiness-note">
                      <strong>Readiness note</strong>
                      <p>{selectedReadinessSignoff.notes}</p>
                    </div>
                  )}

                  {onUpdateSignoff && (
                    <form className="operations-readiness-detail-form operational-signoff-form" onSubmit={event => { event.preventDefault(); saveSignoff(selectedOperation, selectedReadinessSignoff.departmentRole) }} data-testid="react-operational-signoff-form">
                      <label>
                        <span>Readiness status</span>
                        <select value={getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).status} onChange={event => updateSignoffDraft(selectedOperation, 'status', event.target.value, selectedReadinessSignoff.departmentRole)} aria-label={`${selectedOperation.title} ${selectedReadinessSignoff.departmentRole} readiness status`}>
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </label>
                      <label>
                        <span>Approver</span>
                        <input value={getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).approverName} onChange={event => updateSignoffDraft(selectedOperation, 'approverName', event.target.value, selectedReadinessSignoff.departmentRole)} aria-label={`${selectedOperation.title} ${selectedReadinessSignoff.departmentRole} readiness approver`} />
                      </label>
                      <label className="full-width-field">
                        <span>Signoff notes</span>
                        <textarea value={getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).notes} onChange={event => updateSignoffDraft(selectedOperation, 'notes', event.target.value, selectedReadinessSignoff.departmentRole)} aria-label={`${selectedOperation.title} ${selectedReadinessSignoff.departmentRole} readiness notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingSignoffKey === `${selectedOperation.id}:${selectedReadinessSignoff.departmentRole}` || !getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).approverName.trim()}>Save readiness approval</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'staffing' && selectedOperation ? (
        <section className="operations-staffing-workspace" aria-labelledby="operations-staffing-workspace-heading" data-testid="react-operations-staffing-workspace">
          <div className="operations-staffing-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Staffing Coverage</p>
              <h4 id="operations-staffing-workspace-heading">Staffing coverage for {selectedOperation.title}</h4>
              <p>Review crew coverage as a dedicated staffing queue. Select one department to update planned headcount, checked-in crew, lead ownership, muster location, and staffing notes without scanning every department card.</p>
            </div>
            <dl className="operations-staffing-workspace-metrics" aria-label="Selected turnaround staffing summary" data-testid="react-operations-staffing-workspace-summary">
              <div>
                <dt>Departments</dt>
                <dd>{staffingWorkspaceSummary.totalDepartments || selectedOperationStaffing.length}</dd>
              </div>
              <div>
                <dt>Planned</dt>
                <dd>{staffingWorkspaceSummary.plannedCount || 0}</dd>
              </div>
              <div>
                <dt>Checked in</dt>
                <dd>{staffingWorkspaceSummary.checkedInCount || 0}</dd>
              </div>
              <div>
                <dt>Gaps</dt>
                <dd>{staffingWorkspaceSummary.gapCount || 0}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationStaffing.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-staffing-empty-state">No staffing plans are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-staffing-layout">
              <div className="operations-staffing-list-panel" aria-label="Turnaround staffing queue">
                <div className="operations-staffing-list-heading">
                  <h5>Department staffing</h5>
                  <span>{selectedOperationStaffing.length} department{selectedOperationStaffing.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-staffing-list" data-testid="react-operations-staffing-list">
                  {selectedOperationStaffing.map(staffing => {
                    const plannedCount = Number(staffing.plannedCount || 0)
                    const checkedInCount = Number(staffing.checkedInCount || 0)
                    const gapCount = Math.max(plannedCount - checkedInCount, 0)
                    const checkInPercent = plannedCount > 0 ? Math.round((checkedInCount / plannedCount) * 100) : 0
                    const isSelected = staffing.departmentRole === selectedStaffingKey

                    return (
                      <li key={`${selectedOperation.id}-${staffing.departmentRole}`}>
                        <button
                          type="button"
                          className={`operations-staffing-list-item${isSelected ? ' active' : ''}${gapCount > 0 ? ' staffing-gap' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedStaffingRole(staffing.departmentRole)}
                          data-testid="react-operations-staffing-list-item"
                        >
                          <span className="operations-staffing-status-pill">{checkInPercent}% staffed</span>
                          <strong>{getOperationalRoleLabel(staffing.departmentRole)}</strong>
                          <span>{checkedInCount} of {plannedCount} checked in</span>
                          <small>{staffing.leadName || 'Lead pending'} · {staffing.musterLocation || 'Muster pending'}</small>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedStaffing && (
                <article className="operations-staffing-detail-panel" aria-label={`Staffing details for ${selectedStaffing.departmentRole}`} data-testid="react-operations-staffing-detail-panel">
                  <div className="operations-staffing-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Staffing Details</p>
                      <h5>{getOperationalRoleLabel(selectedStaffing.departmentRole)}</h5>
                    </div>
                    <span className="operations-staffing-status-pill">{Number(selectedStaffing.plannedCount || 0) > 0 ? Math.round((Number(selectedStaffing.checkedInCount || 0) / Number(selectedStaffing.plannedCount || 0)) * 100) : 0}% staffed</span>
                  </div>

                  <dl className="operations-staffing-detail-list" data-testid="react-operations-staffing-detail-list">
                    <div>
                      <dt>Department</dt>
                      <dd>{selectedStaffing.departmentRole}</dd>
                    </div>
                    <div>
                      <dt>Lead</dt>
                      <dd>{selectedStaffing.leadName || 'Lead pending'}</dd>
                    </div>
                    <div>
                      <dt>Coverage</dt>
                      <dd>{selectedStaffing.checkedInCount} of {selectedStaffing.plannedCount} checked in</dd>
                    </div>
                    <div>
                      <dt>Muster</dt>
                      <dd>{selectedStaffing.musterLocation || 'Muster pending'}</dd>
                    </div>
                  </dl>

                  {selectedStaffing.notes && (
                    <div className="operations-staffing-note" data-testid="react-operations-staffing-note">
                      <strong>Staffing note</strong>
                      <p>{selectedStaffing.notes}</p>
                    </div>
                  )}

                  {onUpdateStaffing && (
                    <form className="operations-staffing-detail-form operational-staffing-form" onSubmit={event => { event.preventDefault(); saveStaffing(selectedOperation, selectedStaffing.departmentRole) }} data-testid="react-operational-staffing-form">
                      <label>
                        <span>Planned staff</span>
                        <input type="number" min="0" value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).plannedCount} onChange={event => updateStaffingDraft(selectedOperation, 'plannedCount', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} planned staff`} />
                      </label>
                      <label>
                        <span>Checked in</span>
                        <input type="number" min="0" value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).checkedInCount} onChange={event => updateStaffingDraft(selectedOperation, 'checkedInCount', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} checked in staff`} />
                      </label>
                      <label>
                        <span>Staffing lead</span>
                        <input value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).leadName} onChange={event => updateStaffingDraft(selectedOperation, 'leadName', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} staffing lead`} />
                      </label>
                      <label>
                        <span>Muster location</span>
                        <input value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).musterLocation} onChange={event => updateStaffingDraft(selectedOperation, 'musterLocation', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} staffing muster location`} />
                      </label>
                      <label className="full-width-field">
                        <span>Staffing notes</span>
                        <textarea value={getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).notes} onChange={event => updateStaffingDraft(selectedOperation, 'notes', event.target.value, selectedStaffing.departmentRole)} aria-label={`${selectedOperation.title} staffing notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingStaffingKey === `${selectedOperation.id}:${selectedStaffing.departmentRole}` || !getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).leadName.trim()}>Save staffing plan</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'dependencies' && selectedOperation ? (
        <section className="operations-dependency-workspace" aria-labelledby="operations-dependency-workspace-heading" data-testid="react-operations-dependency-workspace">
          <div className="operations-dependency-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Dependency Gates</p>
              <h4 id="operations-dependency-workspace-heading">Dependency gates for {selectedOperation.title}</h4>
              <p>Review blocker gates as a dedicated release queue. Select one dependency to see the blocked task, prerequisite task, status, notes, and operational impact without crowding the main overview.</p>
            </div>
            <dl className="operations-dependency-workspace-metrics" aria-label="Selected turnaround dependency summary" data-testid="react-operations-dependency-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{dependencyWorkspaceSummary.totalDependencies || selectedOperationDependencies.length}</dd>
              </div>
              <div>
                <dt>Active</dt>
                <dd>{dependencyWorkspaceSummary.activeDependencies || 0}</dd>
              </div>
              <div>
                <dt>Cleared</dt>
                <dd>{dependencyWorkspaceSummary.clearedDependencies || 0}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationDependencies.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-dependency-empty-state">No dependency gates are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-dependency-layout">
              <div className="operations-dependency-list-panel" aria-label="Turnaround dependency gate queue">
                <div className="operations-dependency-list-heading">
                  <h5>Dependency gates</h5>
                  <span>{selectedOperationDependencies.length} gate{selectedOperationDependencies.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-dependency-list" data-testid="react-operations-dependency-list">
                  {selectedOperationDependencies.map(dependency => {
                    const dependencyKey = dependency.id || `${dependency.taskName}:${dependency.dependsOnTaskName}`
                    const isSelected = dependencyKey === selectedDependencyKey

                    return (
                      <li key={dependencyKey}>
                        <button
                          type="button"
                          className={`operations-dependency-list-item${isSelected ? ' active' : ''}${dependency.status === 'ACTIVE' ? ' active-gate' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedDependencyId(dependencyKey)}
                          data-testid="react-operations-dependency-list-item"
                        >
                          <span className={`operations-dependency-status-pill ${String(dependency.status).toLowerCase()}`}>{dependency.status}</span>
                          <strong>{dependency.taskName}</strong>
                          <span>Depends on {dependency.dependsOnTaskName}</span>
                          {dependency.notes && <small>{dependency.notes}</small>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedDependency && (
                <article className="operations-dependency-detail-panel" aria-label={`Dependency details for ${selectedDependency.taskName}`} data-testid="react-operations-dependency-detail-panel">
                  <div className="operations-dependency-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Dependency Details</p>
                      <h5>{selectedDependency.taskName}</h5>
                    </div>
                    <span className={`operations-dependency-status-pill ${String(selectedDependency.status).toLowerCase()}`}>{selectedDependency.status}</span>
                  </div>

                  <dl className="operations-dependency-detail-list" data-testid="react-operations-dependency-detail-list">
                    <div>
                      <dt>Blocked task</dt>
                      <dd>{selectedDependency.taskName}</dd>
                    </div>
                    <div>
                      <dt>Required first</dt>
                      <dd>{selectedDependency.dependsOnTaskName}</dd>
                    </div>
                    <div>
                      <dt>Gate type</dt>
                      <dd>{selectedDependency.dependencyType || 'BLOCKS'}</dd>
                    </div>
                    <div>
                      <dt>Gate status</dt>
                      <dd>{selectedDependency.status}</dd>
                    </div>
                  </dl>

                  {selectedDependency.notes && (
                    <div className="operations-dependency-note" data-testid="react-operations-dependency-note">
                      <strong>Operational note</strong>
                      <p>{selectedDependency.notes}</p>
                    </div>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'escalations' && selectedOperation ? (
        <section className="operations-escalation-workspace" aria-labelledby="operations-escalation-workspace-heading" data-testid="react-operations-escalation-workspace">
          <div className="operations-escalation-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Escalation Management</p>
              <h4 id="operations-escalation-workspace-heading">Escalation command for {selectedOperation.title}</h4>
              <p>Review one operational risk at a time. The queue separates severity, owner, status, and resolution notes so escalations are readable without opening every incident form on the page.</p>
            </div>
            <dl className="operations-escalation-workspace-metrics" aria-label="Selected turnaround escalation summary" data-testid="react-operations-escalation-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{escalationWorkspaceSummary.totalEscalations ?? selectedOperationEscalations.length}</dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{escalationWorkspaceSummary.openEscalations || 0}</dd>
              </div>
              <div>
                <dt>Monitoring</dt>
                <dd>{escalationWorkspaceSummary.monitoringEscalations || 0}</dd>
              </div>
              <div>
                <dt>Critical</dt>
                <dd>{escalationWorkspaceSummary.criticalEscalations || 0}</dd>
              </div>
            </dl>
          </div>

          {onCreateEscalation && (
            <form className="operations-escalation-quick-add operational-escalation-create-form" onSubmit={event => { event.preventDefault(); saveEscalationCreate(selectedOperation) }} data-testid="react-operational-escalation-create-form">
              <h5>Add escalation</h5>
              <label>
                <span>Department</span>
                <select value={getEscalationCreateDraft(selectedOperation).departmentRole} onChange={event => updateEscalationCreateDraft(selectedOperation, 'departmentRole', event.target.value)} aria-label={`${selectedOperation.title} escalation department`}>
                  <option value="turnaround-manager">Turnaround Manager</option>
                  <option value="housekeeping-lead">Housekeeping Lead</option>
                  <option value="guest-services-lead">Guest Services Lead</option>
                  <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                  <option value="engineering-lead">Engineering Lead</option>
                  <option value="security-lead">Security Lead</option>
                  <option value="port-operations-lead">Port Operations Lead</option>
                </select>
              </label>
              <label>
                <span>Severity</span>
                <select value={getEscalationCreateDraft(selectedOperation).severity} onChange={event => updateEscalationCreateDraft(selectedOperation, 'severity', event.target.value)} aria-label={`${selectedOperation.title} escalation severity`}>
                  <option value="WATCH">Watch</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <label>
                <span>Title</span>
                <input value={getEscalationCreateDraft(selectedOperation).title} onChange={event => updateEscalationCreateDraft(selectedOperation, 'title', event.target.value)} aria-label={`${selectedOperation.title} escalation title`} />
              </label>
              <label>
                <span>Owner</span>
                <input value={getEscalationCreateDraft(selectedOperation).ownerName} onChange={event => updateEscalationCreateDraft(selectedOperation, 'ownerName', event.target.value)} aria-label={`${selectedOperation.title} escalation owner`} />
              </label>
              <label className="full-width-field">
                <span>Escalation notes</span>
                <textarea value={getEscalationCreateDraft(selectedOperation).resolutionNotes} onChange={event => updateEscalationCreateDraft(selectedOperation, 'resolutionNotes', event.target.value)} aria-label={`${selectedOperation.title} escalation notes`} rows="3" />
              </label>
              <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingEscalationId === selectedOperation.id || !getEscalationCreateDraft(selectedOperation).title.trim()}>Add escalation</button>
            </form>
          )}

          {selectedOperationEscalations.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-escalation-empty-state">No escalation records are active for this selected turnaround.</p>
          ) : (
            <div className="operations-escalation-layout">
              <div className="operations-escalation-list-panel" aria-label="Turnaround escalation queue">
                <div className="operations-escalation-list-heading">
                  <h5>Escalation queue</h5>
                  <span>{selectedOperationEscalations.length} escalation{selectedOperationEscalations.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-escalation-list-focused" data-testid="react-operations-escalation-list">
                  {selectedOperationEscalations.map(escalation => {
                    const isSelected = escalation.id === selectedEscalationKey
                    const severity = String(escalation.severity || 'WATCH').toLowerCase()

                    return (
                      <li key={escalation.id}>
                        <button
                          type="button"
                          className={`operations-escalation-list-item${isSelected ? ' active' : ''} ${severity}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedEscalationId(escalation.id)}
                          data-testid="react-operations-escalation-list-item"
                        >
                          <span className={`operations-escalation-severity-pill ${severity}`}>{escalation.severity || 'WATCH'}</span>
                          <strong>{escalation.title}</strong>
                          <span>{escalation.departmentRole} · {escalation.status}</span>
                          <small>{getOperationalOwnerDisplay(escalation)}</small>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedEscalation && (
                <article className="operations-escalation-detail-panel" aria-label={`Escalation details for ${selectedEscalation.title}`} data-testid="react-operations-escalation-detail-panel">
                  <div className="operations-escalation-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Escalation Details</p>
                      <h5>{selectedEscalation.title}</h5>
                    </div>
                    <span className={`operations-escalation-severity-pill ${String(selectedEscalation.severity || 'WATCH').toLowerCase()}`}>{selectedEscalation.severity || 'WATCH'}</span>
                  </div>

                  <dl className="operations-escalation-detail-list" data-testid="react-operations-escalation-detail-list">
                    <div>
                      <dt>Department</dt>
                      <dd>{selectedEscalation.departmentRole}</dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>{getOperationalOwnerDisplay(selectedEscalation)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedEscalation.status}</dd>
                    </div>
                    <div>
                      <dt>Severity</dt>
                      <dd>{selectedEscalation.severity}</dd>
                    </div>
                  </dl>

                  {selectedEscalation.resolutionNotes && (
                    <div className="operations-escalation-note" data-testid="react-operations-escalation-note">
                      <strong>Resolution notes</strong>
                      <p>{selectedEscalation.resolutionNotes}</p>
                    </div>
                  )}

                  {onUpdateEscalation && (
                    <form className="operations-escalation-detail-form operational-escalation-update-form" onSubmit={event => { event.preventDefault(); saveEscalationUpdate(selectedEscalation) }} data-testid="react-operational-escalation-update-form">
                      <label>
                        <span>Status</span>
                        <select value={getEscalationUpdateDraft(selectedEscalation).status} onChange={event => updateEscalationDraft(selectedEscalation, 'status', event.target.value)} aria-label={`${selectedEscalation.title} escalation status`}>
                          <option value="OPEN">Open</option>
                          <option value="MONITORING">Monitoring</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </label>
                      <label>
                        <span>Severity</span>
                        <select value={getEscalationUpdateDraft(selectedEscalation).severity} onChange={event => updateEscalationDraft(selectedEscalation, 'severity', event.target.value)} aria-label={`${selectedEscalation.title} escalation update severity`}>
                          <option value="WATCH">Watch</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </label>
                      <label>
                        <span>Owner</span>
                        <input value={getEscalationUpdateDraft(selectedEscalation).ownerName} onChange={event => updateEscalationDraft(selectedEscalation, 'ownerName', event.target.value)} aria-label={`${selectedEscalation.title} escalation update owner`} />
                      </label>
                      <label className="full-width-field">
                        <span>Resolution notes</span>
                        <textarea value={getEscalationUpdateDraft(selectedEscalation).resolutionNotes} onChange={event => updateEscalationDraft(selectedEscalation, 'resolutionNotes', event.target.value)} aria-label={`${selectedEscalation.title} escalation resolution notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingEscalationId === selectedEscalation.id || !getEscalationUpdateDraft(selectedEscalation).title.trim()}>Save escalation</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'handoffs' && selectedOperation ? (
        <section className="operations-handoff-workspace" aria-labelledby="operations-handoff-workspace-heading" data-testid="react-operations-handoff-workspace">
          <div className="operations-handoff-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Department Handoffs</p>
              <h4 id="operations-handoff-workspace-heading">Department handoffs for {selectedOperation.title}</h4>
              <p>Work one release handoff at a time. The queue keeps ownership, due time, sender, receiver, status, and notes readable without showing every handoff form in the overview.</p>
            </div>
            <dl className="operations-handoff-workspace-metrics" aria-label="Selected turnaround handoff summary" data-testid="react-operations-handoff-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{handoffWorkspaceSummary.totalHandoffs || selectedOperationHandoffs.length}</dd>
              </div>
              <div>
                <dt>Complete</dt>
                <dd>{handoffWorkspaceSummary.completedHandoffs || 0}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{handoffWorkspaceSummary.blockedHandoffs || 0}</dd>
              </div>
              <div>
                <dt>Open</dt>
                <dd>{handoffWorkspaceSummary.pendingHandoffs ?? Math.max(0, selectedOperationHandoffs.length - (handoffWorkspaceSummary.completedHandoffs || 0))}</dd>
              </div>
            </dl>
          </div>

          {selectedOperationHandoffs.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-handoff-empty-state">No department handoffs are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-handoff-layout">
              <div className="operations-handoff-list-panel" aria-label="Turnaround department handoff queue">
                <div className="operations-handoff-list-heading">
                  <h5>Handoff queue</h5>
                  <span>{selectedOperationHandoffs.length} handoff{selectedOperationHandoffs.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-handoff-list-focused" data-testid="react-operations-handoff-list">
                  {selectedOperationHandoffs.map(handoff => {
                    const isSelected = handoff.id === selectedHandoffKey

                    return (
                      <li key={handoff.id}>
                        <button
                          type="button"
                          className={`operations-handoff-list-item${isSelected ? ' active' : ''}${handoff.status === 'BLOCKED' ? ' blocked' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedHandoffId(handoff.id)}
                          data-testid="react-operations-handoff-list-item"
                        >
                          <span className={`operations-handoff-status-pill ${String(handoff.status).toLowerCase()}`}>{handoff.status}</span>
                          <strong>{handoff.title}</strong>
                          <span>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole}</span>
                          <small>{getOperationalOwnerDisplay(handoff)} · {handoff.dueTime || 'Due pending'}</small>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedHandoff && (
                <article className="operations-handoff-detail-panel" aria-label={`Handoff details for ${selectedHandoff.title}`} data-testid="react-operations-handoff-detail-panel">
                  <div className="operations-handoff-detail-header">
                    <div>
                      <p className="eyebrow ce-kicker">Handoff Details</p>
                      <h5>{selectedHandoff.title}</h5>
                    </div>
                    <span className={`operations-handoff-status-pill ${String(selectedHandoff.status).toLowerCase()}`}>{selectedHandoff.status}</span>
                  </div>

                  <dl className="operations-handoff-detail-list" data-testid="react-operations-handoff-detail-list">
                    <div>
                      <dt>From</dt>
                      <dd>{selectedHandoff.fromDepartmentRole}</dd>
                    </div>
                    <div>
                      <dt>To</dt>
                      <dd>{selectedHandoff.toDepartmentRole}</dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>{getOperationalOwnerDisplay(selectedHandoff)}</dd>
                    </div>
                    <div>
                      <dt>Due time</dt>
                      <dd>{selectedHandoff.dueTime || 'Due pending'}</dd>
                    </div>
                  </dl>

                  {selectedHandoff.notes && (
                    <div className="operations-handoff-note" data-testid="react-operations-handoff-note">
                      <strong>Handoff note</strong>
                      <p>{selectedHandoff.notes}</p>
                    </div>
                  )}

                  {onUpdateHandoff && (
                    <form className="operations-handoff-detail-form operational-handoff-form" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(selectedHandoff) }} data-testid="react-operational-handoff-form">
                      <label>
                        <span>Status</span>
                        <select value={getHandoffDraft(selectedHandoff).status} onChange={event => updateHandoffDraft(selectedHandoff, 'status', event.target.value)} aria-label={`${selectedHandoff.title} handoff status`}>
                          <option value="PENDING">Pending</option>
                          <option value="READY">Ready</option>
                          <option value="IN_REVIEW">In review</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="COMPLETE">Complete</option>
                        </select>
                      </label>
                      <label>
                        <span>Owner</span>
                        <input value={getHandoffDraft(selectedHandoff).ownerName} onChange={event => updateHandoffDraft(selectedHandoff, 'ownerName', event.target.value)} aria-label={`${selectedHandoff.title} handoff owner`} />
                      </label>
                      <label>
                        <span>Due time</span>
                        <input value={getHandoffDraft(selectedHandoff).dueTime} onChange={event => updateHandoffDraft(selectedHandoff, 'dueTime', event.target.value)} aria-label={`${selectedHandoff.title} handoff due time`} />
                      </label>
                      <label className="full-width-field">
                        <span>Handoff notes</span>
                        <textarea value={getHandoffDraft(selectedHandoff).notes} onChange={event => updateHandoffDraft(selectedHandoff, 'notes', event.target.value)} aria-label={`${selectedHandoff.title} handoff notes`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingHandoffId === selectedHandoff.id || !getHandoffDraft(selectedHandoff).ownerName.trim()}>Save handoff</button>
                    </form>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : activeOperationsWorkspace === 'tasks' && selectedOperation ? (
        <section className="operations-task-workspace" aria-labelledby="operations-task-workspace-heading" data-testid="react-operations-task-workspace">
          <div className="operations-task-workspace-header">
            <div>
              <p className="eyebrow ce-kicker">Task Management</p>
              <h4 id="operations-task-workspace-heading">Task list for {selectedOperation.title}</h4>
              <p>Review the role checklist as a clean queue. Pick one task to update owner, timing, location, blocker notes, status, and shift updates without exposing every operational workflow at once.</p>
            </div>
            <dl className="operations-task-workspace-metrics" aria-label="Selected turnaround task summary" data-testid="react-operations-task-workspace-summary">
              <div>
                <dt>Total</dt>
                <dd>{taskWorkspaceSummary.totalTasks || selectedOperationTasks.length}</dd>
              </div>
              <div>
                <dt>Complete</dt>
                <dd>{taskWorkspaceSummary.completeTasks || 0}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd>{taskWorkspaceSummary.blockedTasks || 0}</dd>
              </div>
              <div>
                <dt>Ready</dt>
                <dd>{taskWorkspaceSummary.completionPercent || 0}%</dd>
              </div>
            </dl>
          </div>

          {onCreateTask && (
            <form className="operations-task-quick-add operational-task-create-form" onSubmit={event => { event.preventDefault(); saveTaskCreate(selectedOperation) }} data-testid="react-operational-task-create-form">
              <div>
                <p className="eyebrow ce-kicker">Add task</p>
                <h5>New turnaround task</h5>
              </div>
              <label>
                <span>Department</span>
                <select value={getTaskCreateDraft(selectedOperation).departmentRole} onChange={event => updateTaskCreateDraft(selectedOperation, 'departmentRole', event.target.value)} aria-label={`${selectedOperation.title} new task department`}>
                  <option value="turnaround-manager">Turnaround Manager</option>
                  <option value="housekeeping-lead">Housekeeping Lead</option>
                  <option value="guest-services-lead">Guest Services Lead</option>
                  <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                  <option value="engineering-lead">Engineering Lead</option>
                  <option value="security-lead">Security Lead</option>
                  <option value="port-operations-lead">Port Operations Lead</option>
                </select>
              </label>
              <label className="operations-task-quick-add-name">
                <span>Task name</span>
                <input value={getTaskCreateDraft(selectedOperation).taskName} onChange={event => updateTaskCreateDraft(selectedOperation, 'taskName', event.target.value)} aria-label={`${selectedOperation.title} new task name`} />
              </label>
              <label>
                <span>Owner</span>
                <input value={getTaskCreateDraft(selectedOperation).ownerName} onChange={event => updateTaskCreateDraft(selectedOperation, 'ownerName', event.target.value)} aria-label={`${selectedOperation.title} new task owner`} />
              </label>
              <label>
                <span>Due time</span>
                <input value={getTaskCreateDraft(selectedOperation).dueTime} onChange={event => updateTaskCreateDraft(selectedOperation, 'dueTime', event.target.value)} aria-label={`${selectedOperation.title} new task due time`} />
              </label>
              <label>
                <span>Location</span>
                <input value={getTaskCreateDraft(selectedOperation).location} onChange={event => updateTaskCreateDraft(selectedOperation, 'location', event.target.value)} aria-label={`${selectedOperation.title} new task location`} />
              </label>
              <label className="full-width-field">
                <span>Blocker reason</span>
                <input value={getTaskCreateDraft(selectedOperation).blockerReason} onChange={event => updateTaskCreateDraft(selectedOperation, 'blockerReason', event.target.value)} aria-label={`${selectedOperation.title} new task blocker reason`} />
              </label>
              <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === selectedOperation.id || !getTaskCreateDraft(selectedOperation).taskName.trim()}>Add turnaround task</button>
            </form>
          )}

          {selectedOperationTasks.length === 0 ? (
            <p className="status-card compact ce-command-card" data-testid="react-operations-task-empty-state">No tasks are assigned to this selected turnaround yet.</p>
          ) : (
            <div className="operations-task-layout">
              <div className="operations-task-list-panel" aria-label="Turnaround task queue">
                <div className="operations-task-list-heading">
                  <h5>Task queue</h5>
                  <span>{selectedOperationTasks.length} task{selectedOperationTasks.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="operations-task-list" data-testid="react-operations-task-list">
                  {selectedOperationTasks.map(task => {
                    const taskKey = task.id || task.taskName
                    const isSelected = taskKey === selectedTaskKey

                    return (
                      <li key={taskKey}>
                        <button
                          type="button"
                          className={`operations-task-list-item${isSelected ? ' active' : ''}${task.status === 'BLOCKED' ? ' blocked' : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedTaskId(taskKey)}
                          data-testid="react-operations-task-list-item"
                        >
                          <span className="operations-task-status-pill">{task.status}</span>
                          <strong>{task.taskName}</strong>
                          <span>{task.ownerDisplayName || task.ownerName || 'Unassigned'} · {task.dueTime || 'Timing pending'}</span>
                          {task.blockerReason && <small>Blocked: {task.blockerReason}</small>}
                        </button>
                        {isSelected && (
                          <article className="operations-task-detail-panel inline-task-detail-panel" aria-label={`Task details for ${task.taskName}`} data-testid="react-operations-task-detail-panel">
                            <div className="operations-task-detail-header"><p className="eyebrow ce-kicker">Selected task</p><h5>{task.taskName}</h5><span className="operations-task-status-pill">{task.status}</span></div>
                            <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                              <div><dt>Owner</dt><dd>{task.ownerDisplayName || task.ownerName || 'Unassigned'}</dd></div>
                              <div><dt>Due</dt><dd>{task.dueTime || 'Timing pending'}</dd></div>
                              <div><dt>Location</dt><dd>{task.location || 'Location pending'}</dd></div>
                            </dl>
                            {task.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {task.blockerReason}</p>}
                            {task.updates?.length > 0 && (
                              <div className="operational-task-updates" data-testid="react-operational-task-updates">
                                <strong>Shift updates</strong>
                                <ul>{task.updates.slice(0, 3).map(update => <li key={update.id}><span>{getOperationalAuthorDisplay(update)}</span><span>{update.message}</span></li>)}</ul>
                              </div>
                            )}
                            {onCreateTaskUpdate && task.id && (
                              <form className="operational-task-update-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskUpdate(task) }} data-testid="react-operational-task-update-form">
                                <label className="full-width-field"><span>Shift update</span><input value={getTaskUpdateDraft(task)} onChange={event => updateTaskUpdateDraft(task, event.target.value)} aria-label={`${task.taskName} shift update`} /></label>
                                <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskUpdateId === task.id || !getTaskUpdateDraft(task).trim()}>Add shift update</button>
                              </form>
                            )}
                            {onUpdateTaskDetails && task.id && (
                              <form className="operational-task-detail-form operations-task-detail-edit-form" onSubmit={event => { event.preventDefault(); saveTaskDetails(task) }} data-testid="react-operational-task-detail-form">
                                <label><span>Owner</span><input value={getTaskDetailDraft(task).ownerName} onChange={event => updateTaskDetailDraft(task, 'ownerName', event.target.value)} aria-label={`${task.taskName} owner`} /></label>
                                <label><span>Due time</span><input value={getTaskDetailDraft(task).dueTime} onChange={event => updateTaskDetailDraft(task, 'dueTime', event.target.value)} aria-label={`${task.taskName} due time`} /></label>
                                <label><span>Location</span><input value={getTaskDetailDraft(task).location} onChange={event => updateTaskDetailDraft(task, 'location', event.target.value)} aria-label={`${task.taskName} location`} /></label>
                                <label className="full-width-field"><span>Blocker reason</span><textarea value={getTaskDetailDraft(task).blockerReason} onChange={event => updateTaskDetailDraft(task, 'blockerReason', event.target.value)} aria-label={`${task.taskName} blocker reason`} rows="4" /></label>
                                <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskDetailsId === task.id}>Save task details</button>
                              </form>
                            )}
                            {onUpdateTaskStatus && task.id && <div className="operational-task-actions" aria-label={`Update ${task.taskName} status`}><button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskId === task.id || task.status === 'IN_PROGRESS'} onClick={() => updateStatus(task, 'IN_PROGRESS')}>Start</button><button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskId === task.id || task.status === 'BLOCKED'} onClick={() => updateStatus(task, 'BLOCKED')}>Block</button><button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskId === task.id || task.status === 'COMPLETE'} onClick={() => updateStatus(task, 'COMPLETE')}>Complete</button></div>}
                            {onDeleteTask && task.id && <button type="button" className="danger-outline-button compact-button ce-button-danger" disabled={deletingTaskId === task.id} onClick={() => removeTask(task)} data-testid="react-operational-task-remove-button">{deletingTaskId === task.id ? 'Removing task...' : 'Remove task'}</button>}
                          </article>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

            </div>
          )}
        </section>
      ) : (
        <div className="operational-readiness-list" aria-label="Selected turnaround readiness workspace">
          {visibleReadinessOperations.map(item => (
            <article className="operational-readiness-card ce-command-card" key={item.id} data-testid="react-operational-readiness-card">
              <div>
                <p className="eyebrow ce-kicker">{item.status}</p>
                <h4>{item.title}</h4>
                <p>{item.shipName} · {item.route}</p>
                {item.notes && <p>{item.notes}</p>}
              </div>
              <dl className="role-booking-fields compact-fields">
                <div>
                  <dt>Sailing date</dt>
                  <dd>{item.sailingDate}</dd>
                </div>
                <div>
                  <dt>Turnaround port</dt>
                  <dd>{item.port || item.arrivalPort}</dd>
                </div>
                <div>
                  <dt>Passenger load</dt>
                  <dd>{item.passengerCount} passenger{item.passengerCount === 1 ? '' : 's'}</dd>
                </div>
                <div>
                  <dt>Readiness level</dt>
                  <dd>{item.readinessLevel}</dd>
                </div>
                <div>
                  <dt>Command status</dt>
                  <dd>{item.commandStatus || item.status}</dd>
                </div>
                <div>
                  <dt>Command readiness</dt>
                  <dd>{item.commandReadinessLevel || item.readinessLevel}</dd>
                </div>
              </dl>

              {onUpdateOperationCommand && roleView === 'turnaround-manager' && (
                <form className="operational-command-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
                  <label>
                    <span>Command status</span>
                    <select value={getOperationCommandDraft(item).status} onChange={event => updateOperationCommandDraft(item, 'status', event.target.value)} aria-label={`${item.title} command status`}>
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="READY">Ready</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </label>
                  <label>
                    <span>Command readiness</span>
                    <select value={getOperationCommandDraft(item).readinessLevel} onChange={event => updateOperationCommandDraft(item, 'readinessLevel', event.target.value)} aria-label={`${item.title} command readiness`}>
                      {COMMAND_READINESS_OPTIONS.map(option => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Turnaround port</span>
                    <input value={getOperationCommandDraft(item).port} onChange={event => updateOperationCommandDraft(item, 'port', event.target.value)} aria-label={`${item.title} turnaround port`} />
                  </label>
                  <label className="full-width-field">
                    <span>Command notes</span>
                    <textarea value={getOperationCommandDraft(item).notes} onChange={event => updateOperationCommandDraft(item, 'notes', event.target.value)} aria-label={`${item.title} command notes`} rows="3" />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
                </form>
              )}

              {item.taskSummary && (
                <div className="operational-progress-summary" data-testid="react-operational-progress-summary">
                  <span>{item.taskSummary.completeTasks} of {item.taskSummary.totalTasks} tasks complete</span>
                  <span>{item.taskSummary.completionPercent}% task ready</span>
                  {item.signoffSummary && <span>{item.signoffSummary.approvedSignoffs} of {item.signoffSummary.totalSignoffs} signoffs approved</span>}
                  {item.taskSummary.blockedTasks > 0 && <span>{item.taskSummary.blockedTasks} blocked</span>}
                </div>
              )}

              {item.escalationSummary && (
                <div className="operational-escalation-summary" data-testid="react-operational-escalation-summary">
                  <strong>Escalation watch</strong>
                  <span>{item.escalationSummary.openEscalations} open</span>
                  <span>{item.escalationSummary.monitoringEscalations} monitoring</span>
                  <span>{item.escalationSummary.criticalEscalations} critical</span>
                </div>
              )}


              {item.dependencySummary && (
                <div className="operational-dependency-summary" data-testid="react-operational-dependency-summary">
                  <strong>Dependency gates</strong>
                  <span>{item.dependencySummary.clearedDependencies} of {item.dependencySummary.totalDependencies} clear</span>
                  {item.dependencySummary.activeDependencies > 0 && <span>{item.dependencySummary.activeDependencies} active</span>}
                </div>
              )}

              {item.taskDependencies?.length > 0 && (
                <div className="operational-dependency-list" data-testid="react-operational-dependency-list">
                  <strong>Task dependencies</strong>
                  <ul>
                    {item.taskDependencies.map(dependency => (
                      <li key={dependency.id}>
                        <span>{dependency.taskName}</span>
                        <span>depends on {dependency.dependsOnTaskName}</span>
                        <span>{dependency.status}</span>
                        {dependency.notes && <span>{dependency.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.handoffSummary && (
                <div className="operational-handoff-summary" data-testid="react-operational-handoff-summary">
                  <strong>Department handoffs</strong>
                  <span>{item.handoffSummary.completedHandoffs} of {item.handoffSummary.totalHandoffs} complete</span>
                  {item.handoffSummary.blockedHandoffs > 0 && <span>{item.handoffSummary.blockedHandoffs} blocked</span>}
                </div>
              )}

              {item.handoffs?.length > 0 && (
                <div className="operational-handoff-list" data-testid="react-operational-handoff-list">
                  <strong>Handoff workflow</strong>
                  <ul>
                    {item.handoffs.map(handoff => (
                      <li key={handoff.id}>
                        <div><strong>{handoff.status}</strong> — {handoff.title}</div>
                        <p>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole} · {getOperationalOwnerDisplay(handoff)} · {handoff.dueTime || 'Due pending'}</p>
                        {handoff.notes && <p>{handoff.notes}</p>}
                        {onUpdateHandoff && (
                          <form className="operational-handoff-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(handoff) }} data-testid="react-operational-handoff-form">
                            <label>
                              <span>Status</span>
                              <select value={getHandoffDraft(handoff).status} onChange={event => updateHandoffDraft(handoff, 'status', event.target.value)} aria-label={`${handoff.title} handoff status`}>
                                <option value="PENDING">Pending</option>
                                <option value="READY">Ready</option>
                                <option value="IN_REVIEW">In review</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="COMPLETE">Complete</option>
                              </select>
                            </label>
                            <label>
                              <span>Owner</span>
                              <input value={getHandoffDraft(handoff).ownerName} onChange={event => updateHandoffDraft(handoff, 'ownerName', event.target.value)} aria-label={`${handoff.title} handoff owner`} />
                            </label>
                            <label>
                              <span>Due time</span>
                              <input value={getHandoffDraft(handoff).dueTime} onChange={event => updateHandoffDraft(handoff, 'dueTime', event.target.value)} aria-label={`${handoff.title} handoff due time`} />
                            </label>
                            <label className="full-width-field">
                              <span>Handoff notes</span>
                              <input value={getHandoffDraft(handoff).notes} onChange={event => updateHandoffDraft(handoff, 'notes', event.target.value)} aria-label={`${handoff.title} handoff notes`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingHandoffId === handoff.id || !getHandoffDraft(handoff).ownerName.trim()}>Save handoff</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}


              {item.staffingSummary && (
                <div className="operational-staffing-summary" data-testid="react-operational-staffing-summary">
                  <strong>Staffing check-in</strong>
                  <span>{item.staffingSummary.checkedInCount} of {item.staffingSummary.plannedCount} crew checked in</span>
                  <span>{item.staffingSummary.checkInPercent}% staffed</span>
                  {item.staffingSummary.gapCount > 0 && <span>{item.staffingSummary.gapCount} gap{item.staffingSummary.gapCount === 1 ? '' : 's'}</span>}
                </div>
              )}

              {item.staffing?.length > 0 && (
                <div className="operational-staffing-list" data-testid="react-operational-staffing-list">
                  <strong>Department staffing plan</strong>
                  <ul>
                    {item.staffing.map(staffing => (
                      <li key={`${item.id}-${staffing.departmentRole}`}>
                        <span>{staffing.departmentRole}</span>
                        <span>{staffing.checkedInCount} / {staffing.plannedCount}</span>
                        <span>{staffing.leadName || 'Lead pending'}</span>
                        <span>{staffing.musterLocation || 'Muster pending'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onUpdateStaffing && (
                <form className="operational-staffing-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveStaffing(item) }} data-testid="react-operational-staffing-form">
                  <label>
                    <span>Planned staff</span>
                    <input type="number" min="0" value={getStaffingDraft(item).plannedCount} onChange={event => updateStaffingDraft(item, 'plannedCount', event.target.value)} aria-label={`${item.title} planned staff`} />
                  </label>
                  <label>
                    <span>Checked in</span>
                    <input type="number" min="0" value={getStaffingDraft(item).checkedInCount} onChange={event => updateStaffingDraft(item, 'checkedInCount', event.target.value)} aria-label={`${item.title} checked in staff`} />
                  </label>
                  <label>
                    <span>Staffing lead</span>
                    <input value={getStaffingDraft(item).leadName} onChange={event => updateStaffingDraft(item, 'leadName', event.target.value)} aria-label={`${item.title} staffing lead`} />
                  </label>
                  <label>
                    <span>Muster location</span>
                    <input value={getStaffingDraft(item).musterLocation} onChange={event => updateStaffingDraft(item, 'musterLocation', event.target.value)} aria-label={`${item.title} staffing muster location`} />
                  </label>
                  <label className="full-width-field">
                    <span>Staffing notes</span>
                    <input value={getStaffingDraft(item).notes} onChange={event => updateStaffingDraft(item, 'notes', event.target.value)} aria-label={`${item.title} staffing notes`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingStaffingKey === `${item.id}:${roleView}` || !getStaffingDraft(item).leadName.trim()}>Save staffing plan</button>
                </form>
              )}

              {onCreateEscalation && (
                <form className="operational-escalation-create-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveEscalationCreate(item) }} data-testid="react-operational-escalation-create-form">
                  <label>
                    <span>Escalation department</span>
                    <select value={getEscalationCreateDraft(item).departmentRole} onChange={event => updateEscalationCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} escalation department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
                      <option value="security-lead">Security Lead</option>
                      <option value="port-operations-lead">Port Operations Lead</option>
                    </select>
                  </label>
                  <label>
                    <span>Severity</span>
                    <select value={getEscalationCreateDraft(item).severity} onChange={event => updateEscalationCreateDraft(item, 'severity', event.target.value)} aria-label={`${item.title} escalation severity`}>
                      <option value="WATCH">Watch</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    <span>Escalation title</span>
                    <input value={getEscalationCreateDraft(item).title} onChange={event => updateEscalationCreateDraft(item, 'title', event.target.value)} aria-label={`${item.title} escalation title`} />
                  </label>
                  <label>
                    <span>Owner</span>
                    <input value={getEscalationCreateDraft(item).ownerName} onChange={event => updateEscalationCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} escalation owner`} />
                  </label>
                  <label className="full-width-field">
                    <span>Escalation notes</span>
                    <input value={getEscalationCreateDraft(item).resolutionNotes} onChange={event => updateEscalationCreateDraft(item, 'resolutionNotes', event.target.value)} aria-label={`${item.title} escalation notes`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingEscalationId === item.id || !getEscalationCreateDraft(item).title.trim()}>Add escalation</button>
                </form>
              )}

              {item.escalations?.length > 0 && (
                <div className="operational-escalation-list" data-testid="react-operational-escalation-list">
                  <strong>Active escalation log</strong>
                  <ul>
                    {item.escalations.map(escalation => (
                      <li key={escalation.id}>
                        <div><strong>{escalation.severity}</strong> — {escalation.title}</div>
                        <p>{escalation.departmentRole} · {getOperationalOwnerDisplay(escalation)} · {escalation.status}</p>
                        {escalation.resolutionNotes && <p>{escalation.resolutionNotes}</p>}
                        {onUpdateEscalation && (
                          <form className="operational-escalation-update-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveEscalationUpdate(escalation) }} data-testid="react-operational-escalation-update-form">
                            <label>
                              <span>Status</span>
                              <select value={getEscalationUpdateDraft(escalation).status} onChange={event => updateEscalationDraft(escalation, 'status', event.target.value)} aria-label={`${escalation.title} escalation status`}>
                                <option value="OPEN">Open</option>
                                <option value="MONITORING">Monitoring</option>
                                <option value="RESOLVED">Resolved</option>
                              </select>
                            </label>
                            <label>
                              <span>Severity</span>
                              <select value={getEscalationUpdateDraft(escalation).severity} onChange={event => updateEscalationDraft(escalation, 'severity', event.target.value)} aria-label={`${escalation.title} escalation update severity`}>
                                <option value="WATCH">Watch</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                              </select>
                            </label>
                            <label>
                              <span>Owner</span>
                              <input value={getEscalationUpdateDraft(escalation).ownerName} onChange={event => updateEscalationDraft(escalation, 'ownerName', event.target.value)} aria-label={`${escalation.title} escalation update owner`} />
                            </label>
                            <label className="full-width-field">
                              <span>Resolution notes</span>
                              <input value={getEscalationUpdateDraft(escalation).resolutionNotes} onChange={event => updateEscalationDraft(escalation, 'resolutionNotes', event.target.value)} aria-label={`${escalation.title} escalation resolution notes`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingEscalationId === escalation.id || !getEscalationUpdateDraft(escalation).title.trim()}>Save escalation</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.signoffs.length > 0 && (
                <div className="operational-signoff-summary" data-testid="react-operational-signoff-summary">
                  <strong>Department readiness signoffs</strong>
                  <ul>
                    {item.signoffs.map(signoff => (
                      <li key={`${item.id}-${signoff.departmentRole}`}>
                        <span>{signoff.departmentRole}</span>
                        <span>{signoff.status}</span>
                        <span>{getOperationalApproverDisplay(signoff)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onUpdateSignoff && (
                <form className="operational-signoff-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveSignoff(item) }} data-testid="react-operational-signoff-form">
                  <label>
                    <span>Readiness status</span>
                    <select value={getSignoffDraft(item).status} onChange={event => updateSignoffDraft(item, 'status', event.target.value)} aria-label={`${item.title} readiness signoff status`}>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </label>
                  <label>
                    <span>Approver</span>
                    <input value={getSignoffDraft(item).approverName} onChange={event => updateSignoffDraft(item, 'approverName', event.target.value)} aria-label={`${item.title} readiness approver`} />
                  </label>
                  <label className="full-width-field">
                    <span>Signoff notes</span>
                    <input value={getSignoffDraft(item).notes} onChange={event => updateSignoffDraft(item, 'notes', event.target.value)} aria-label={`${item.title} readiness notes`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingSignoffKey === `${item.id}:${roleView}` || !getSignoffDraft(item).approverName.trim()}>Save readiness signoff</button>
                </form>
              )}

              {onCreateTask && (
                <form className="operational-task-create-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
                  <label>
                    <span>New task department</span>
                    <select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
                      <option value="security-lead">Security Lead</option>
                      <option value="port-operations-lead">Port Operations Lead</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    <span>New task name</span>
                    <input value={getTaskCreateDraft(item).taskName} onChange={event => updateTaskCreateDraft(item, 'taskName', event.target.value)} aria-label={`${item.title} new task name`} />
                  </label>
                  <label>
                    <span>Owner</span>
                    <input value={getTaskCreateDraft(item).ownerName} onChange={event => updateTaskCreateDraft(item, 'ownerName', event.target.value)} aria-label={`${item.title} new task owner`} />
                  </label>
                  <label>
                    <span>Due time</span>
                    <input value={getTaskCreateDraft(item).dueTime} onChange={event => updateTaskCreateDraft(item, 'dueTime', event.target.value)} aria-label={`${item.title} new task due time`} />
                  </label>
                  <label>
                    <span>Location</span>
                    <input value={getTaskCreateDraft(item).location} onChange={event => updateTaskCreateDraft(item, 'location', event.target.value)} aria-label={`${item.title} new task location`} />
                  </label>
                  <label className="full-width-field">
                    <span>Blocker reason</span>
                    <input value={getTaskCreateDraft(item).blockerReason} onChange={event => updateTaskCreateDraft(item, 'blockerReason', event.target.value)} aria-label={`${item.title} new task blocker reason`} />
                  </label>
                  <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
                </form>
              )}

              {item.tasks.length > 0 && (
                <ul className="operational-checklist" data-testid="react-operational-role-checklist">
                  {item.tasks.map(task => {
                    const isUpdating = updatingTaskId === task.id

                    return (
                      <li key={task.id || `${item.id}-${task.taskName}`}>
                        <div>
                          <strong>{task.status}</strong> — {task.taskName}
                        </div>
                        <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                          <div>
                            <dt>Owner</dt>
                            <dd>{task.ownerDisplayName || task.ownerName || 'Unassigned'}</dd>
                          </div>
                          <div>
                            <dt>Due</dt>
                            <dd>{task.dueTime || 'Timing pending'}</dd>
                          </div>
                          <div>
                            <dt>Location</dt>
                            <dd>{task.location || 'Location pending'}</dd>
                          </div>
                        </dl>
                        {task.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {task.blockerReason}</p>}
                        {task.updates?.length > 0 && (
                          <div className="operational-task-updates" data-testid="react-operational-task-updates">
                            <strong>Shift updates</strong>
                            <ul>
                              {task.updates.slice(0, 3).map(update => (
                                <li key={update.id}>
                                  <span>{getOperationalAuthorDisplay(update)}</span>
                                  <span>{update.updateType || 'NOTE'}</span>
                                  <span>{update.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {onCreateTaskUpdate && task.id && (
                          <form className="operational-task-update-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskUpdate(task) }} data-testid="react-operational-task-update-form">
                            <label className="full-width-field">
                              <span>Shift update</span>
                              <input value={getTaskUpdateDraft(task)} onChange={event => updateTaskUpdateDraft(task, event.target.value)} aria-label={`${task.taskName} shift update`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={creatingTaskUpdateId === task.id || !getTaskUpdateDraft(task).trim()}>Add shift update</button>
                          </form>
                        )}
                        {onUpdateTaskDetails && task.id && (
                          <form className="operational-task-detail-form ce-editor-card" onSubmit={event => { event.preventDefault(); saveTaskDetails(task) }} data-testid="react-operational-task-detail-form">
                            <label>
                              <span>Owner</span>
                              <input value={getTaskDetailDraft(task).ownerName} onChange={event => updateTaskDetailDraft(task, 'ownerName', event.target.value)} aria-label={`${task.taskName} owner`} />
                            </label>
                            <label>
                              <span>Due time</span>
                              <input value={getTaskDetailDraft(task).dueTime} onChange={event => updateTaskDetailDraft(task, 'dueTime', event.target.value)} aria-label={`${task.taskName} due time`} />
                            </label>
                            <label>
                              <span>Location</span>
                              <input value={getTaskDetailDraft(task).location} onChange={event => updateTaskDetailDraft(task, 'location', event.target.value)} aria-label={`${task.taskName} location`} />
                            </label>
                            <label className="full-width-field">
                              <span>Blocker reason</span>
                              <input value={getTaskDetailDraft(task).blockerReason} onChange={event => updateTaskDetailDraft(task, 'blockerReason', event.target.value)} aria-label={`${task.taskName} blocker reason`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button ce-button-secondary" disabled={updatingTaskDetailsId === task.id}>Save task details</button>
                          </form>
                        )}
                        {onUpdateTaskStatus && task.id && (
                          <div className="operational-task-actions" aria-label={`Update ${task.taskName} status`}>
                            <button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={isUpdating || task.status === 'IN_PROGRESS'} onClick={() => updateStatus(task, 'IN_PROGRESS')}>Start</button>
                            <button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={isUpdating || task.status === 'BLOCKED'} onClick={() => updateStatus(task, 'BLOCKED')}>Block</button>
                            <button type="button" className="secondary-action-button compact-button ce-button-secondary" disabled={isUpdating || task.status === 'COMPLETE'} onClick={() => updateStatus(task, 'COMPLETE')}>Complete</button>
                          </div>
                        )}
                        {onDeleteTask && task.id && (
                          <button type="button" className="danger-outline-button compact-button ce-button-danger" disabled={deletingTaskId === task.id} onClick={() => removeTask(task)} data-testid="react-operational-task-remove-button">
                            {deletingTaskId === task.id ? 'Removing task...' : 'Remove task'}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function getDefaultPreCruiseChecklist() {
  return {
    documents: false,
    luggage: false,
    dining: false,
    excursions: false
  }
}

function normalizePreCruiseChecklist(checklist = {}) {
  return {
    documents: Boolean(checklist.documents),
    luggage: Boolean(checklist.luggage),
    dining: Boolean(checklist.dining),
    excursions: Boolean(checklist.excursions)
  }
}

function PassengerVoyagePlanner({ selectedCustomer, visibleBookings = [], favoriteItineraryActivitiesByBooking = {}, onChecklistSaved }) {
  const bookingPlans = visibleBookings.map(booking => {
    const bookingId = booking.id || booking.bookingId || 'booking'
    const itineraryDays = getBookingItineraryDays(booking)
    const favoriteKeys = new Set(favoriteItineraryActivitiesByBooking[bookingId] || [])
    const activityRows = itineraryDays.flatMap(day => {
      const dayKey = String(day.id || day.day || day.title)
      return getItineraryDayActivities(day).map(activity => ({
        day,
        dayKey,
        activity,
        activityKey: getActivityFavoriteKey(dayKey, activity)
      }))
    })
    const favoriteRows = activityRows.filter(row => favoriteKeys.has(row.activityKey))
    const portDays = itineraryDays.filter(day => !String(day.port || day.title || '').toLowerCase().includes('sea'))
    const firstActivity = activityRows[0]

    return {
      booking,
      bookingId,
      itineraryDays,
      activityRows,
      favoriteRows,
      portDays,
      firstActivity
    }
  })

  const totalFavorites = bookingPlans.reduce((sum, plan) => sum + plan.favoriteRows.length, 0)
  const totalPortDays = bookingPlans.reduce((sum, plan) => sum + plan.portDays.length, 0)
  const nextPlan = bookingPlans.find(plan => plan.firstActivity) || bookingPlans[0]
  const selectedCustomerId = selectedCustomer?.id || ''
  const [checklistState, setChecklistState] = useState(() => normalizePreCruiseChecklist(selectedCustomer?.preCruiseChecklist || getDefaultPreCruiseChecklist()))
  const [savingChecklistItem, setSavingChecklistItem] = useState('')
  const [checklistMessage, setChecklistMessage] = useState('')
  const completeChecklistCount = Object.values(checklistState).filter(Boolean).length

  useEffect(() => {
    setChecklistState(normalizePreCruiseChecklist(selectedCustomer?.preCruiseChecklist || getDefaultPreCruiseChecklist()))
    setSavingChecklistItem('')
  }, [selectedCustomerId, selectedCustomer?.preCruiseChecklist?.documents, selectedCustomer?.preCruiseChecklist?.luggage, selectedCustomer?.preCruiseChecklist?.dining, selectedCustomer?.preCruiseChecklist?.excursions])

  useEffect(() => {
    setChecklistMessage('')
  }, [selectedCustomerId])

  async function toggleChecklistItem(item) {
    if (!selectedCustomerId || savingChecklistItem) return

    const nextChecklist = {
      ...checklistState,
      [item]: !checklistState[item]
    }
    const previousChecklist = checklistState

    setChecklistState(nextChecklist)
    setSavingChecklistItem(item)
    setChecklistMessage('Saving pre-cruise checklist...')

    try {
      const response = await updatePassengerPreCruiseChecklist(selectedCustomerId, nextChecklist)
      const savedChecklist = normalizePreCruiseChecklist(response?.preCruiseChecklist || nextChecklist)
      setChecklistState(savedChecklist)
      setChecklistMessage(response?.message || 'Pre-cruise checklist updated successfully')
      await onChecklistSaved?.()
    } catch (error) {
      setChecklistState(previousChecklist)
      setChecklistMessage(error.message || 'Could not save pre-cruise checklist.')
    } finally {
      setSavingChecklistItem('')
    }
  }

  return (
    <section className="passenger-voyage-planner" aria-labelledby="react-passenger-voyage-planner-heading" data-testid="react-passenger-voyage-planner">
      <div className="passenger-voyage-heading">
        <div>
          <p className="eyebrow ce-kicker">Passenger cruise tools</p>
          <h3 id="react-passenger-voyage-planner-heading">My voyage planner</h3>
          <p>Review sailing context, favorite activities, port days, and pre-cruise checklist progress from one passenger workspace.</p>
        </div>
        <div className="voyage-score-card" aria-label="Voyage planning summary">
          <strong>{completeChecklistCount}/4</strong>
          <span>Pre-cruise checklist complete</span>
        </div>
      </div>

      <div className="voyage-planner-grid">
        <article className="voyage-planner-card">
          <h4>Trip snapshot</h4>
          <dl className="compact-fields">
            <div><dt>Visible bookings</dt><dd>{visibleBookings.length}</dd></div>
            <div><dt>Port days</dt><dd>{totalPortDays}</dd></div>
            <div><dt>Saved activities</dt><dd>{totalFavorites}</dd></div>
            <div><dt>Next activity</dt><dd>{nextPlan?.firstActivity?.activity?.activity || nextPlan?.firstActivity?.activity?.name || 'Open itinerary details to review activities'}</dd></div>
          </dl>
        </article>

        <article className="voyage-planner-card">
          <h4>Pre-cruise checklist</h4>
          <div className="voyage-checklist" data-testid="react-voyage-checklist">
            {[
              ['documents', 'Travel documents verified'],
              ['luggage', 'Luggage tags and cabin assignment reviewed'],
              ['dining', 'Dining preference checked'],
              ['excursions', 'Favorite excursions selected']
            ].map(([id, label]) => (
              <label key={id} className="react-checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(checklistState[id])}
                  disabled={!selectedCustomerId || Boolean(savingChecklistItem)}
                  onChange={() => toggleChecklistItem(id)}
                  data-testid={`react-voyage-checklist-${id}`}
                />
                <span>{label}{savingChecklistItem === id ? ' — saving' : ''}</span>
              </label>
            ))}
          </div>
          <p className="draft-message ce-feedback-message ce-editor-card" aria-live="polite" data-testid="react-voyage-checklist-message">
            {checklistMessage || 'Checklist progress is saved to this passenger profile.'}
          </p>
        </article>
      </div>


      <div className="voyage-booking-strip" aria-label="Voyage booking summaries">
        {bookingPlans.length === 0 ? (
          <p className="status-card compact ce-command-card">No cruise bookings are visible for this passenger yet.</p>
        ) : bookingPlans.map(plan => (
          <article key={plan.bookingId} className="voyage-booking-card" data-testid="react-voyage-booking-card">
            <h4>{getBookingCardTitle(plan.booking)}</h4>
            <p>{plan.booking.cruiseLine?.name || 'Cruise line'} aboard {plan.booking.ship?.name || 'assigned ship'}</p>
            <ul>
              <li>{plan.itineraryDays.length} itinerary day{plan.itineraryDays.length === 1 ? '' : 's'}</li>
              <li>{plan.portDays.length} port day{plan.portDays.length === 1 ? '' : 's'}</li>
              <li>{plan.favoriteRows.length} saved activit{plan.favoriteRows.length === 1 ? 'y' : 'ies'}</li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}


function RoleBookingCard({ booking, roleView, isExpanded, favoriteActivityKeys, favoritesOnly, onToggleDetails, onToggleFavorite, onToggleFavoritesOnly }) {
  const [detailedBooking, setDetailedBooking] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailLoadError, setDetailLoadError] = useState('')
  const bookingId = booking.id || booking.bookingId
  const effectiveBooking = detailedBooking || booking
  const passengers = getVisiblePassengerRows(effectiveBooking)
  const sailingId = effectiveBooking.sailingId || effectiveBooking.sailing?.id
  const needsItineraryDetails = isExpanded && bookingId && getBookingItineraryDays(effectiveBooking).length === 0
  const hasLoadedBookingDetails = Boolean(detailedBooking) || Boolean(detailLoadError)
  const isWaitingForItineraryDetails = Boolean(needsItineraryDetails && !hasLoadedBookingDetails)

  useEffect(() => {
    let isActive = true

    async function loadBookingDetails() {
      if (!needsItineraryDetails) return

      setIsLoadingDetails(true)
      setDetailLoadError('')

      try {
        const nextBooking = await getBookingDetails(bookingId)
        const nextSailingId = nextBooking?.sailingId || nextBooking?.sailing?.id || sailingId
        const nextItineraryDays = getBookingItineraryDays(nextBooking)

        if (nextItineraryDays.length > 0 || !nextSailingId) {
          if (isActive) setDetailedBooking(nextBooking)
          return
        }

        const itineraryDays = await getItineraryForSailing(nextSailingId)
        const bookingWithItinerary = {
          ...nextBooking,
          itinerary: itineraryDays,
          itineraryDays,
          sailing: nextBooking?.sailing
            ? {
                ...nextBooking.sailing,
                itinerary: itineraryDays,
                itineraryDays
              }
            : nextBooking?.sailing
        }

        if (isActive) setDetailedBooking(bookingWithItinerary)
      } catch (err) {
        if (isActive) setDetailLoadError(err.message || 'Unable to load itinerary details for this booking.')
      } finally {
        if (isActive) setIsLoadingDetails(false)
      }
    }

    loadBookingDetails()

    return () => {
      isActive = false
    }
  }, [bookingId, needsItineraryDetails, sailingId])

  useEffect(() => {
    setDetailedBooking(null)
    setDetailLoadError('')
    setIsLoadingDetails(false)
  }, [bookingId])

  return (
    <article className="role-booking-card ce-command-card" data-testid="react-role-booking-card">
      <div className="role-booking-heading">
        <h3>{getBookingCardTitle(effectiveBooking)}</h3>
        <div className="role-booking-badges">
          {roleView === 'group-leader' && <span className="status-pill ce-status-pill">Group Leader</span>}
          <span className="status-pill ce-status-pill">{booking.bookingStatus || 'Confirmed'}</span>
        </div>
      </div>

      <dl className="role-booking-fields">
        {getBookingCardFields(effectiveBooking).map(([label, value]) => (
          <div key={`${bookingId}-${label}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="visible-passenger-list">
        <strong>Visible passengers</strong>
        {passengers.length === 0 ? (
          <p>No visible passengers for this booking.</p>
        ) : passengers.map(passenger => (
          <div key={passenger.id} className="visible-passenger-row">
            <span>{passenger.name}</span>
            <span>{passenger.role}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="primary-action-button full-width-action"
        aria-expanded={isExpanded}
        onClick={onToggleDetails}
        data-testid="react-role-booking-details-toggle"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (isLoadingDetails || isWaitingForItineraryDetails) && (
        <p className="status-card compact ce-command-card" data-testid="react-role-booking-details-loading">Loading itinerary details…</p>
      )}

      {isExpanded && detailLoadError && (
        <p className="status-card compact error ce-feedback-message ce-editor-card" data-testid="react-role-booking-details-error">{detailLoadError}</p>
      )}

      {isExpanded && !isLoadingDetails && !isWaitingForItineraryDetails && (
        <RoleBookingDetails
          booking={effectiveBooking}
          favoriteActivityKeys={favoriteActivityKeys}
          favoritesOnly={favoritesOnly}
          onToggleFavorite={onToggleFavorite}
          onToggleFavoritesOnly={onToggleFavoritesOnly}
        />
      )}
    </article>
  )
}

export default function ReactRoleDashboard({
  selectedDemoUser,
  customers = [],
  bookings = [],
  visibleBookings = [],
  turnaroundOperations = [],
  isLoadingTurnaroundOperations = false,
  turnaroundOperationsError = '',
  onRetryTurnaroundOperations,
  onUpdateTurnaroundOperationCommand,
  onUpdateTurnaroundTaskStatus,
  onUpdateTurnaroundTaskDetails,
  onCreateTurnaroundTask,
  onCreateTurnaroundTaskUpdate,
  onDeleteTurnaroundTask,
  onUpdateTurnaroundStaffing,
  onUpdateTurnaroundSignoff,
  onCreateTurnaroundEscalation,
  onUpdateTurnaroundEscalation,
  onUpdateTurnaroundHandoff,
  updatingTurnaroundOperationId = '',
  updatingTurnaroundTaskId = '',
  updatingTurnaroundTaskDetailsId = '',
  creatingTurnaroundTaskId = '',
  creatingTurnaroundTaskUpdateId = '',
  deletingTurnaroundTaskId = '',
  updatingTurnaroundStaffingKey = '',
  updatingTurnaroundSignoffKey = '',
  creatingTurnaroundEscalationId = '',
  updatingTurnaroundEscalationId = '',
  updatingTurnaroundHandoffId = '',
  turnaroundMutationStatus = '',
  turnaroundMutationError = '',
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = '',
  cruiseLines = [],
  onBookingCreated
}) {
  const roleView = getSelectedRoleView(selectedDemoUser)
  const selectedCustomer = findDemoCustomer(selectedDemoUser, customers)
  const title = getRoleDashboardTitle(roleView)
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())
  const [favoriteItineraryActivitiesByBooking, setFavoriteItineraryActivitiesByBooking] = useState({})
  const [favoritesOnlyByBooking, setFavoritesOnlyByBooking] = useState({})
  const visibleBookingIds = useMemo(() => new Set(visibleBookings.map(booking => booking.id)), [visibleBookings])
  const itineraryReadyVisibleBookings = useMemo(() => {
    if (isOperationalRoleView(roleView)) return visibleBookings

    return [...visibleBookings].sort((leftBooking, rightBooking) => {
      const leftItineraryCount = getBookingItineraryDays(leftBooking).length
      const rightItineraryCount = getBookingItineraryDays(rightBooking).length

      if (leftItineraryCount !== rightItineraryCount) {
        return rightItineraryCount - leftItineraryCount
      }

      return String(leftBooking.sailing?.departureDate || leftBooking.createdAt || leftBooking.id || '')
        .localeCompare(String(rightBooking.sailing?.departureDate || rightBooking.createdAt || rightBooking.id || ''))
    })
  }, [roleView, visibleBookings])

  if (roleView === 'admin') return null

  function toggleBookingDetails(bookingId) {
    setExpandedBookingIds(current => {
      const next = new Set([...current].filter(id => visibleBookingIds.has(id)))

      if (next.has(bookingId)) next.delete(bookingId)
      else next.add(bookingId)

      return next
    })
  }

  function toggleFavoriteItineraryActivity(bookingId, activityKey) {
    setFavoriteItineraryActivitiesByBooking(current => {
      const nextFavorites = new Set(current[bookingId] || [])

      if (nextFavorites.has(activityKey)) nextFavorites.delete(activityKey)
      else nextFavorites.add(activityKey)

      return {
        ...current,
        [bookingId]: [...nextFavorites]
      }
    })
  }

  function toggleFavoritesOnly(bookingId) {
    setFavoritesOnlyByBooking(current => ({
      ...current,
      [bookingId]: !current[bookingId]
    }))
  }

  return (
    <section className="react-role-dashboard ce-command-panel" id="react-role-dashboard" aria-labelledby="react-role-dashboard-heading" data-testid={`react-${roleView}-dashboard`}>
      {roleView === 'group-leader' && (
        <div className="status-card compact ce-command-card" data-testid="react-passenger-dashboard">
          Group leader dashboard loaded with passenger-manifest visibility.
        </div>
      )}
      <p className="eyebrow ce-kicker">Role-aware view</p>
      <h2 id="react-role-dashboard-heading">{title}</h2>
      <p>
        {getRoleSummaryLine({
          selectedDemoUser,
          selectedCustomer,
          visibleBookings
        })}
      </p>

      {roleView === 'passenger' && (
        <>
          <PassengerProfile
            selectedCustomer={selectedCustomer}
            selectedDemoUser={selectedDemoUser}
            visibleBookings={visibleBookings}
            onSavePassengerProfile={onSavePassengerProfile}
            savingCustomerId={savingCustomerId}
            mutationError={mutationError}
          />
          <PassengerVoyagePlanner
            selectedCustomer={selectedCustomer}
            visibleBookings={visibleBookings}
            favoriteItineraryActivitiesByBooking={favoriteItineraryActivitiesByBooking}
            onChecklistSaved={onBookingCreated}
          />
          <PassengerCruiseBookingWorkflow
            cruiseLines={cruiseLines}
            customers={customers}
            bookings={bookings}
            selectedCustomer={selectedCustomer}
            selectedDemoUser={selectedDemoUser}
            onBookingCreated={onBookingCreated}
          />
        </>
      )}

      {isOperationalRoleView(roleView) && (
        <OperationalTurnaroundDashboard
          roleView={roleView}
          selectedDemoUser={selectedDemoUser}
          turnaroundOperations={turnaroundOperations}
          isLoading={isLoadingTurnaroundOperations}
          error={turnaroundOperationsError}
          onRetry={onRetryTurnaroundOperations}
          onUpdateOperationCommand={onUpdateTurnaroundOperationCommand}
          onUpdateTaskStatus={onUpdateTurnaroundTaskStatus}
          onUpdateTaskDetails={onUpdateTurnaroundTaskDetails}
          onCreateTask={onCreateTurnaroundTask}
          onCreateTaskUpdate={onCreateTurnaroundTaskUpdate}
          onDeleteTask={onDeleteTurnaroundTask}
          onUpdateStaffing={onUpdateTurnaroundStaffing}
          onUpdateSignoff={onUpdateTurnaroundSignoff}
          onCreateEscalation={onCreateTurnaroundEscalation}
          onUpdateEscalation={onUpdateTurnaroundEscalation}
          onUpdateHandoff={onUpdateTurnaroundHandoff}
          updatingOperationId={updatingTurnaroundOperationId}
          updatingTaskId={updatingTurnaroundTaskId}
          updatingTaskDetailsId={updatingTurnaroundTaskDetailsId}
          creatingTaskId={creatingTurnaroundTaskId}
          creatingTaskUpdateId={creatingTurnaroundTaskUpdateId}
          deletingTaskId={deletingTurnaroundTaskId}
          updatingStaffingKey={updatingTurnaroundStaffingKey}
          updatingSignoffKey={updatingTurnaroundSignoffKey}
          creatingEscalationId={creatingTurnaroundEscalationId}
          updatingEscalationId={updatingTurnaroundEscalationId}
          updatingHandoffId={updatingTurnaroundHandoffId}
          mutationStatus={turnaroundMutationStatus}
          mutationError={turnaroundMutationError}
        />
      )}

      {!isOperationalRoleView(roleView) && (
        <div className="role-booking-list">
          {itineraryReadyVisibleBookings.length === 0 ? (
            <p className="status-card compact ce-command-card">No bookings are visible for this selected person.</p>
          ) : itineraryReadyVisibleBookings.map(booking => {
            const bookingId = booking.id || booking.bookingId
            const favoriteActivityKeys = new Set(favoriteItineraryActivitiesByBooking[bookingId] || [])

            return (
              <RoleBookingCard
                key={bookingId}
                booking={booking}
                roleView={roleView}
                isExpanded={expandedBookingIds.has(bookingId)}
                favoriteActivityKeys={favoriteActivityKeys}
                favoritesOnly={Boolean(favoritesOnlyByBooking[bookingId])}
                onToggleDetails={() => toggleBookingDetails(bookingId)}
                onToggleFavorite={activityKey => toggleFavoriteItineraryActivity(bookingId, activityKey)}
                onToggleFavoritesOnly={() => toggleFavoritesOnly(bookingId)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
