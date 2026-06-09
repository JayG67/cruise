import { useEffect, useMemo, useState } from 'react'
import PassengerCruiseBookingWorkflow from './PassengerCruiseBookingWorkflow.jsx'

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
    <section className="role-profile-card passenger-self-service" aria-labelledby="react-passenger-profile-heading" data-testid="react-passenger-self-service-panel">
      <h3 id="react-passenger-profile-heading">My travel profile</h3>
      <p>Passengers can update limited contact and cruise preference information for their booking experience.</p>

      <form className="passenger-profile-form react-passenger-profile-form" onSubmit={handleSubmit} data-testid="react-passenger-profile-form">
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

        <button type="submit" className="primary-action-button" disabled={isSaving} data-testid="react-passenger-profile-submit-button">
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </button>
        <p className="draft-message" role="status" aria-live="polite" data-testid="react-passenger-profile-message">
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
    <section className="role-booking-detail-panel" aria-label={`Details for ${getBookingCardTitle(booking)}`} data-testid="react-role-booking-details">
      <div className="role-booking-detail-grid">
        <div className="role-detail-card">
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

        <div className="role-detail-card">
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

      <div className="role-itinerary-panel">
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
          <p className="status-card compact" data-testid="react-role-no-itinerary">No itinerary details are available for this booking yet.</p>
        ) : visibleItineraryDays.length === 0 ? (
          <p className="status-card compact" data-testid="react-role-no-favorite-itinerary">No favorite itinerary activities selected yet.</p>
        ) : (
          <div className="role-itinerary-list">
            {visibleItineraryDays.map(day => {
              const dayKey = String(day.id || day.day || day.title)
              const activities = getItineraryDayActivities(day)
              const visibleActivities = favoritesOnly
                ? activities.filter(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
                : activities

              return (
                <article className="role-itinerary-day" key={`${booking.id}-${dayKey}`} data-testid="react-role-itinerary-day">
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
  { role: 'engineering-lead', label: 'Engineering Lead' }
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

      if (task.ownerName) entry.leadNames.add(task.ownerName)
      entry.taskCount += 1
      if (String(task.status || '').toUpperCase() === 'BLOCKED') entry.blockedTasks += 1
    })

    ;(operation.escalations || []).forEach(escalation => {
      const role = normalizeOperationalRoleName(escalation.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (escalation.ownerName) entry.leadNames.add(escalation.ownerName)
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

        if (handoff.ownerName) entry.leadNames.add(handoff.ownerName)
        entry.handoffCount += 1
        if (String(handoff.status || '').toUpperCase() === 'BLOCKED') entry.blockedHandoffs += 1
      })
    })

    ;(operation.signoffs || []).forEach(signoff => {
      const role = normalizeOperationalRoleName(signoff.departmentRole)
      const entry = byRole.get(role)
      if (!entry) return

      if (signoff.approverName) entry.leadNames.add(signoff.approverName)
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
    <section className="operational-turnaround-panel" aria-labelledby="operational-turnaround-heading" data-testid="react-operational-turnaround-panel">
      <div className="operational-turnaround-hero">
        <div>
          <p className="eyebrow">Turnaround readiness</p>
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
        <section className="operations-portfolio-board" aria-labelledby="operations-portfolio-board-heading" data-testid="react-operations-portfolio-board">
          <div className="operations-portfolio-heading">
            <div>
              <p className="eyebrow">Fleet operations portfolio</p>
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
            <p className="eyebrow">Selected turnaround</p>
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
        <section className="operations-release-board" aria-labelledby="operations-release-board-heading" data-testid="react-operations-release-board">
          <div className="operations-release-board-header">
            <div>
              <p className="eyebrow">Turnaround release board</p>
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
                onClick={() => setActiveOperationsWorkspace(item.id)}
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

      <section className="operations-workspace-shell" aria-labelledby="operations-workspace-heading" data-testid="react-operations-workspace-shell">
        <div className="operations-workspace-heading">
          <p className="eyebrow">Operations workspace</p>
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
              onClick={() => setActiveOperationsWorkspace(tab.id)}
              data-testid={`react-operations-workspace-${tab.id}-button`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="operations-workspace-active-summary" data-testid="react-operations-workspace-active-summary">
          <strong>{activeOperationsWorkspaceDetails.label}</strong>
          <span>{activeOperationsWorkspaceDetails.summary}</span>
        </div>
      </section>

      {selectedOperation && (
        <section className="operations-role-brief-panel" aria-labelledby="operations-role-brief-heading" data-testid="react-operations-role-brief-panel">
          <div className="operations-role-brief-heading">
            <div>
              <p className="eyebrow">Role command brief</p>
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
                className={`operations-role-brief-card ${card.priority}`}
                onClick={() => setActiveOperationsWorkspace(card.id)}
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
        <section className="operations-directory-panel" aria-labelledby="operations-directory-heading" data-testid="react-operations-directory-panel">
          <div className="operations-directory-heading">
            <div>
              <p className="eyebrow">Operations directory</p>
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
                    className={`operations-directory-card${entry.role === selectedDirectoryEntry.role ? ' active' : ''}${entry.role === normalizeOperationalRoleName(roleView) ? ' current-role' : ''}`}
                    key={entry.role}
                    aria-pressed={entry.role === selectedDirectoryEntry.role}
                    onClick={() => setSelectedDirectoryRole(entry.role)}
                    data-testid="react-operations-directory-card"
                  >
                    <span className="operations-directory-card-title">
                      <span>
                        <span className="eyebrow">{entry.role === normalizeOperationalRoleName(roleView) ? 'Current role' : 'Partner role'}</span>
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
            <article className="operations-directory-detail" aria-label={`${selectedDirectoryEntry.label} department details`} data-testid="react-operations-directory-detail">
              <div className="operations-directory-detail-header">
                <div>
                  <p className="eyebrow">Department detail</p>
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

      {mutationStatus && <p className="status-card compact" data-testid="react-operational-mutation-status">{mutationStatus}</p>}
      {mutationError && <p className="status-card compact error" data-testid="react-operational-mutation-error">{mutationError}</p>}

      {isLoading ? (
        <p className="status-card compact" data-testid="react-operational-loading-state">Loading turnaround operations from the database...</p>
      ) : error ? (
        <div className="status-card compact" data-testid="react-operational-error-state">
          <p>{error}</p>
          <button type="button" className="secondary-action-button" onClick={onRetry}>Retry turnaround data</button>
        </div>
      ) : readinessOperations.length === 0 ? (
        <p className="status-card compact" data-testid="react-operational-empty-state">No turnaround operation records are available yet.</p>
      ) : activeOperationsWorkspace === 'readiness' && selectedOperation ? (
        <section className="operations-readiness-workspace" aria-labelledby="operations-readiness-workspace-heading" data-testid="react-operations-readiness-workspace">
          <div className="operations-readiness-workspace-header">
            <div>
              <p className="eyebrow">Readiness Approvals</p>
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
            <p className="status-card compact" data-testid="react-operations-readiness-empty-state">No department readiness approvals are assigned to this turnaround yet.</p>
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
                          <span>{signoff.approverName || 'Approver pending'}</span>
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
                      <p className="eyebrow">Readiness Details</p>
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
                      <dd>{selectedReadinessSignoff.approverName || 'Approver pending'}</dd>
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
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingSignoffKey === `${selectedOperation.id}:${selectedReadinessSignoff.departmentRole}` || !getSignoffDraft(selectedOperation, selectedReadinessSignoff.departmentRole).approverName.trim()}>Save readiness approval</button>
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
              <p className="eyebrow">Staffing Coverage</p>
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
            <p className="status-card compact" data-testid="react-operations-staffing-empty-state">No staffing plans are assigned to this selected turnaround yet.</p>
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
                      <p className="eyebrow">Staffing Details</p>
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
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingStaffingKey === `${selectedOperation.id}:${selectedStaffing.departmentRole}` || !getStaffingDraft(selectedOperation, selectedStaffing.departmentRole).leadName.trim()}>Save staffing plan</button>
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
              <p className="eyebrow">Dependency Gates</p>
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
            <p className="status-card compact" data-testid="react-operations-dependency-empty-state">No dependency gates are assigned to this selected turnaround yet.</p>
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
                      <p className="eyebrow">Dependency Details</p>
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
              <p className="eyebrow">Escalation Management</p>
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
              <button type="submit" className="secondary-action-button compact-button" disabled={creatingEscalationId === selectedOperation.id || !getEscalationCreateDraft(selectedOperation).title.trim()}>Add escalation</button>
            </form>
          )}

          {selectedOperationEscalations.length === 0 ? (
            <p className="status-card compact" data-testid="react-operations-escalation-empty-state">No escalation records are active for this selected turnaround.</p>
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
                          <small>{escalation.ownerName || 'Owner pending'}</small>
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
                      <p className="eyebrow">Escalation Details</p>
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
                      <dd>{selectedEscalation.ownerName || 'Owner pending'}</dd>
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
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingEscalationId === selectedEscalation.id || !getEscalationUpdateDraft(selectedEscalation).title.trim()}>Save escalation</button>
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
              <p className="eyebrow">Department Handoffs</p>
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
            <p className="status-card compact" data-testid="react-operations-handoff-empty-state">No department handoffs are assigned to this selected turnaround yet.</p>
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
                          <small>{handoff.ownerName || 'Owner pending'} · {handoff.dueTime || 'Due pending'}</small>
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
                      <p className="eyebrow">Handoff Details</p>
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
                      <dd>{selectedHandoff.ownerName || 'Owner pending'}</dd>
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
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingHandoffId === selectedHandoff.id || !getHandoffDraft(selectedHandoff).ownerName.trim()}>Save handoff</button>
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
              <p className="eyebrow">Task Management</p>
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
                <p className="eyebrow">Add task</p>
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
              <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskId === selectedOperation.id || !getTaskCreateDraft(selectedOperation).taskName.trim()}>Add task</button>
            </form>
          )}

          {selectedOperationTasks.length === 0 ? (
            <p className="status-card compact" data-testid="react-operations-task-empty-state">No tasks are assigned to this selected turnaround yet.</p>
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
                          <span>{task.ownerName || 'Unassigned'} · {task.dueTime || 'Timing pending'}</span>
                          {task.blockerReason && <small>Blocked: {task.blockerReason}</small>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {selectedTask && (
                <article className="operations-task-detail-panel" aria-label={`Task details for ${selectedTask.taskName}`} data-testid="react-operations-task-detail-panel">
                  <div className="operations-task-detail-header">
                    <div>
                      <p className="eyebrow">Task Details</p>
                      <h5>{selectedTask.taskName}</h5>
                    </div>
                    <span className={`operations-task-status-pill ${String(selectedTask.status).toLowerCase()}`}>{selectedTask.status}</span>
                  </div>

                  <dl className="operational-task-detail-list" data-testid="react-operational-task-details">
                    <div>
                      <dt>Owner</dt>
                      <dd>{selectedTask.ownerName || 'Unassigned'}</dd>
                    </div>
                    <div>
                      <dt>Due</dt>
                      <dd>{selectedTask.dueTime || 'Timing pending'}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{selectedTask.location || 'Location pending'}</dd>
                    </div>
                  </dl>
                  {selectedTask.blockerReason && <p className="operational-blocker-note" data-testid="react-operational-blocker-note">Blocked: {selectedTask.blockerReason}</p>}

                  {selectedTask.updates?.length > 0 && (
                    <div className="operational-task-updates" data-testid="react-operational-task-updates">
                      <strong>Shift updates</strong>
                      <ul>
                        {selectedTask.updates.slice(0, 3).map(update => (
                          <li key={update.id}>
                            <span>{update.authorName}</span>
                            <span>{update.updateType || 'NOTE'}</span>
                            <span>{update.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {onCreateTaskUpdate && selectedTask.id && (
                    <form className="operational-task-update-form" onSubmit={event => { event.preventDefault(); saveTaskUpdate(selectedTask) }} data-testid="react-operational-task-update-form">
                      <label className="full-width-field">
                        <span>Shift update</span>
                        <textarea value={getTaskUpdateDraft(selectedTask)} onChange={event => updateTaskUpdateDraft(selectedTask, event.target.value)} aria-label={`${selectedTask.taskName} shift update`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskUpdateId === selectedTask.id || !getTaskUpdateDraft(selectedTask).trim()}>Add shift update</button>
                    </form>
                  )}

                  {onUpdateTaskDetails && selectedTask.id && (
                    <form className="operational-task-detail-form operations-task-detail-edit-form" onSubmit={event => { event.preventDefault(); saveTaskDetails(selectedTask) }} data-testid="react-operational-task-detail-form">
                      <label>
                        <span>Owner</span>
                        <input value={getTaskDetailDraft(selectedTask).ownerName} onChange={event => updateTaskDetailDraft(selectedTask, 'ownerName', event.target.value)} aria-label={`${selectedTask.taskName} owner`} />
                      </label>
                      <label>
                        <span>Due time</span>
                        <input value={getTaskDetailDraft(selectedTask).dueTime} onChange={event => updateTaskDetailDraft(selectedTask, 'dueTime', event.target.value)} aria-label={`${selectedTask.taskName} due time`} />
                      </label>
                      <label>
                        <span>Location</span>
                        <input value={getTaskDetailDraft(selectedTask).location} onChange={event => updateTaskDetailDraft(selectedTask, 'location', event.target.value)} aria-label={`${selectedTask.taskName} location`} />
                      </label>
                      <label className="full-width-field">
                        <span>Blocker reason</span>
                        <textarea value={getTaskDetailDraft(selectedTask).blockerReason} onChange={event => updateTaskDetailDraft(selectedTask, 'blockerReason', event.target.value)} aria-label={`${selectedTask.taskName} blocker reason`} rows="3" />
                      </label>
                      <button type="submit" className="secondary-action-button compact-button" disabled={updatingTaskDetailsId === selectedTask.id}>Save task details</button>
                    </form>
                  )}

                  {onUpdateTaskStatus && selectedTask.id && (
                    <div className="operational-task-actions" aria-label={`Update ${selectedTask.taskName} status`}>
                      <button type="button" className="secondary-action-button compact-button" disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'IN_PROGRESS'} onClick={() => updateStatus(selectedTask, 'IN_PROGRESS')}>Start</button>
                      <button type="button" className="secondary-action-button compact-button" disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'BLOCKED'} onClick={() => updateStatus(selectedTask, 'BLOCKED')}>Block</button>
                      <button type="button" className="secondary-action-button compact-button" disabled={updatingTaskId === selectedTask.id || selectedTask.status === 'COMPLETE'} onClick={() => updateStatus(selectedTask, 'COMPLETE')}>Complete</button>
                    </div>
                  )}

                  {onDeleteTask && selectedTask.id && (
                    <button type="button" className="danger-outline-button compact-button" disabled={deletingTaskId === selectedTask.id} onClick={() => removeTask(selectedTask)} data-testid="react-operational-task-remove-button">
                      {deletingTaskId === selectedTask.id ? 'Removing task...' : 'Remove task'}
                    </button>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      ) : (
        <div className="operational-readiness-list" aria-label="Selected turnaround readiness workspace">
          {visibleReadinessOperations.map(item => (
            <article className="operational-readiness-card" key={item.id} data-testid="react-operational-readiness-card">
              <div>
                <p className="eyebrow">{item.status}</p>
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
                <form className="operational-command-form" onSubmit={event => { event.preventDefault(); saveOperationCommand(item) }} data-testid="react-operational-command-form">
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
                  <button type="submit" className="secondary-action-button compact-button" disabled={updatingOperationId === item.id || !getOperationCommandDraft(item).readinessLevel.trim() || !getOperationCommandDraft(item).port.trim()}>Save command plan</button>
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
                        <p>{handoff.fromDepartmentRole} → {handoff.toDepartmentRole} · {handoff.ownerName || 'Owner pending'} · {handoff.dueTime || 'Due pending'}</p>
                        {handoff.notes && <p>{handoff.notes}</p>}
                        {onUpdateHandoff && (
                          <form className="operational-handoff-form" onSubmit={event => { event.preventDefault(); saveHandoffUpdate(handoff) }} data-testid="react-operational-handoff-form">
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
                            <button type="submit" className="secondary-action-button compact-button" disabled={updatingHandoffId === handoff.id || !getHandoffDraft(handoff).ownerName.trim()}>Save handoff</button>
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
                <form className="operational-staffing-form" onSubmit={event => { event.preventDefault(); saveStaffing(item) }} data-testid="react-operational-staffing-form">
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
                  <button type="submit" className="secondary-action-button compact-button" disabled={updatingStaffingKey === `${item.id}:${roleView}` || !getStaffingDraft(item).leadName.trim()}>Save staffing plan</button>
                </form>
              )}

              {onCreateEscalation && (
                <form className="operational-escalation-create-form" onSubmit={event => { event.preventDefault(); saveEscalationCreate(item) }} data-testid="react-operational-escalation-create-form">
                  <label>
                    <span>Escalation department</span>
                    <select value={getEscalationCreateDraft(item).departmentRole} onChange={event => updateEscalationCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} escalation department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
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
                  <button type="submit" className="secondary-action-button compact-button" disabled={creatingEscalationId === item.id || !getEscalationCreateDraft(item).title.trim()}>Add escalation</button>
                </form>
              )}

              {item.escalations?.length > 0 && (
                <div className="operational-escalation-list" data-testid="react-operational-escalation-list">
                  <strong>Active escalation log</strong>
                  <ul>
                    {item.escalations.map(escalation => (
                      <li key={escalation.id}>
                        <div><strong>{escalation.severity}</strong> — {escalation.title}</div>
                        <p>{escalation.departmentRole} · {escalation.ownerName || 'Owner pending'} · {escalation.status}</p>
                        {escalation.resolutionNotes && <p>{escalation.resolutionNotes}</p>}
                        {onUpdateEscalation && (
                          <form className="operational-escalation-update-form" onSubmit={event => { event.preventDefault(); saveEscalationUpdate(escalation) }} data-testid="react-operational-escalation-update-form">
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
                            <button type="submit" className="secondary-action-button compact-button" disabled={updatingEscalationId === escalation.id || !getEscalationUpdateDraft(escalation).title.trim()}>Save escalation</button>
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
                        <span>{signoff.approverName || 'Approver pending'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onUpdateSignoff && (
                <form className="operational-signoff-form" onSubmit={event => { event.preventDefault(); saveSignoff(item) }} data-testid="react-operational-signoff-form">
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
                  <button type="submit" className="secondary-action-button compact-button" disabled={updatingSignoffKey === `${item.id}:${roleView}` || !getSignoffDraft(item).approverName.trim()}>Save readiness signoff</button>
                </form>
              )}

              {onCreateTask && (
                <form className="operational-task-create-form" onSubmit={event => { event.preventDefault(); saveTaskCreate(item) }} data-testid="react-operational-task-create-form">
                  <label>
                    <span>New task department</span>
                    <select value={getTaskCreateDraft(item).departmentRole} onChange={event => updateTaskCreateDraft(item, 'departmentRole', event.target.value)} aria-label={`${item.title} new task department`}>
                      <option value="turnaround-manager">Turnaround Manager</option>
                      <option value="housekeeping-lead">Housekeeping Lead</option>
                      <option value="guest-services-lead">Guest Services Lead</option>
                      <option value="food-beverage-lead">Food &amp; Beverage Lead</option>
                      <option value="engineering-lead">Engineering Lead</option>
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
                  <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskId === item.id || !getTaskCreateDraft(item).taskName.trim()}>Add turnaround task</button>
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
                            <dd>{task.ownerName || 'Unassigned'}</dd>
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
                                  <span>{update.authorName}</span>
                                  <span>{update.updateType || 'NOTE'}</span>
                                  <span>{update.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {onCreateTaskUpdate && task.id && (
                          <form className="operational-task-update-form" onSubmit={event => { event.preventDefault(); saveTaskUpdate(task) }} data-testid="react-operational-task-update-form">
                            <label className="full-width-field">
                              <span>Shift update</span>
                              <input value={getTaskUpdateDraft(task)} onChange={event => updateTaskUpdateDraft(task, event.target.value)} aria-label={`${task.taskName} shift update`} />
                            </label>
                            <button type="submit" className="secondary-action-button compact-button" disabled={creatingTaskUpdateId === task.id || !getTaskUpdateDraft(task).trim()}>Add shift update</button>
                          </form>
                        )}
                        {onUpdateTaskDetails && task.id && (
                          <form className="operational-task-detail-form" onSubmit={event => { event.preventDefault(); saveTaskDetails(task) }} data-testid="react-operational-task-detail-form">
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
                            <button type="submit" className="secondary-action-button compact-button" disabled={updatingTaskDetailsId === task.id}>Save task details</button>
                          </form>
                        )}
                        {onUpdateTaskStatus && task.id && (
                          <div className="operational-task-actions" aria-label={`Update ${task.taskName} status`}>
                            <button type="button" className="secondary-action-button compact-button" disabled={isUpdating || task.status === 'IN_PROGRESS'} onClick={() => updateStatus(task, 'IN_PROGRESS')}>Start</button>
                            <button type="button" className="secondary-action-button compact-button" disabled={isUpdating || task.status === 'BLOCKED'} onClick={() => updateStatus(task, 'BLOCKED')}>Block</button>
                            <button type="button" className="secondary-action-button compact-button" disabled={isUpdating || task.status === 'COMPLETE'} onClick={() => updateStatus(task, 'COMPLETE')}>Complete</button>
                          </div>
                        )}
                        {onDeleteTask && task.id && (
                          <button type="button" className="danger-outline-button compact-button" disabled={deletingTaskId === task.id} onClick={() => removeTask(task)} data-testid="react-operational-task-remove-button">
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

function RoleBookingCard({ booking, roleView, isExpanded, favoriteActivityKeys, favoritesOnly, onToggleDetails, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)

  return (
    <article className="role-booking-card" data-testid="react-role-booking-card">
      <div className="role-booking-heading">
        <h3>{getBookingCardTitle(booking)}</h3>
        <div className="role-booking-badges">
          {roleView === 'group-leader' && <span className="status-pill">Group Leader</span>}
          <span className="status-pill">{booking.bookingStatus || 'Confirmed'}</span>
        </div>
      </div>

      <dl className="role-booking-fields">
        {getBookingCardFields(booking).map(([label, value]) => (
          <div key={`${booking.id}-${label}`}>
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

      {isExpanded && (
        <RoleBookingDetails
          booking={booking}
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
    <section className="react-role-dashboard" id="react-role-dashboard" aria-labelledby="react-role-dashboard-heading" data-testid={`react-${roleView}-dashboard`}>
      {roleView === 'group-leader' && (
        <div className="status-card compact" data-testid="react-passenger-dashboard">
          Group leader dashboard loaded with passenger-manifest visibility.
        </div>
      )}
      <p className="eyebrow">Role-aware view</p>
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
          {visibleBookings.length === 0 ? (
            <p className="status-card compact">No bookings are visible for this selected person.</p>
          ) : visibleBookings.map(booking => {
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
