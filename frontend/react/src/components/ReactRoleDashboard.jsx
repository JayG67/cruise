import { useState } from 'react'
import PassengerCruiseBookingWorkflow from './PassengerCruiseBookingWorkflow.jsx'
import { PassengerProfile, PassengerVoyagePlanner } from './passenger/RolePassengerSurface.jsx'
import RoleBookingList from './passenger/RoleBookingList.jsx'

import {
  findDemoCustomer,
  getRoleDashboardTitle,
  getRoleSummaryLine,
  getSelectedRoleView,
  isOperationalRoleView
} from '../domain/roleView.js'

import OperationalTurnaroundDashboard from './operations/OperationalTurnaroundDashboard.jsx'

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
  const [favoriteItineraryActivitiesByBooking, setFavoriteItineraryActivitiesByBooking] = useState({})

  if (roleView === 'admin') return null

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
        <RoleBookingList
          roleView={roleView}
          visibleBookings={visibleBookings}
          favoriteItineraryActivitiesByBooking={favoriteItineraryActivitiesByBooking}
          onFavoriteItineraryActivitiesChange={setFavoriteItineraryActivitiesByBooking}
        />
      )}
    </section>
  )
}
