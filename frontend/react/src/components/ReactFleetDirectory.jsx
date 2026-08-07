import { useState } from 'react'

import ConfirmActionPanel from './ConfirmActionPanel.jsx'
import ReactFleetCruiseLineGrid from './fleet/ReactFleetCruiseLineGrid.jsx'
import ReactFleetItineraryPanel from './fleet/ReactFleetItineraryPanel.jsx'
import ReactFleetSailingPanel from './fleet/ReactFleetSailingPanel.jsx'
import ReactFleetShipPanel from './fleet/ReactFleetShipPanel.jsx'
import useFleetDirectoryState from './fleet/useFleetDirectoryState.js'

export default function ReactFleetDirectory({ cruiseLines = [], isLoading = false, isRefreshing = false, error = '', onRefresh, initialScope = null }) {
  const [refreshMessage, setRefreshMessage] = useState('')

  async function handleRefreshFleet() {
    setRefreshMessage('Refreshing fleet data…')
    const refreshedCruiseLines = await onRefresh?.()

    if (Array.isArray(refreshedCruiseLines)) {
      setRefreshMessage(`Fleet refreshed. ${refreshedCruiseLines.length} cruise lines loaded.`)
      return
    }

    setRefreshMessage('Fleet refresh could not be completed. Review the error message below and try again.')
  }

  const {
    searchTerm,
    setSearchTerm,
    selectedCruiseLine,
    selectedShips,
    shipsLoading,
    shipsError,
    fleetActionMessage,
    deletingCruiseLineId,
    pendingDelete,
    updatingCruiseLineId,
    activeCruiseLineEditId,
    cruiseLineDraft,
    setCruiseLineDraft,
    shipDraft,
    setShipDraft,
    activeShipEditId,
    shipEditDraft,
    setShipEditDraft,
    shipActionMessage,
    shipActionId,
    selectedShipForSailings,
    sailings,
    sailingsLoading,
    sailingsError,
    sailingDraft,
    setSailingDraft,
    sailingActionMessage,
    sailingActionId,
    activeSailingEditId,
    sailingEditDraft,
    setSailingEditDraft,
    selectedSailingForItinerary,
    itineraryDays,
    itineraryLoading,
    itineraryError,
    itineraryDayDraft,
    setItineraryDayDraft,
    activityDraft,
    setActivityDraft,
    itineraryActionMessage,
    itineraryActionId,
    activeItineraryDayEditId,
    itineraryDayEditDraft,
    setItineraryDayEditDraft,
    activeActivityEditId,
    activityEditDraft,
    setActivityEditDraft,
    filteredCruiseLines,
    visibleCruiseLines,
    handleViewShips,
    handleCreateShip,
    openShipEdit,
    cancelShipEdit,
    handleUpdateShip,
    requestDeleteShip,
    handleViewSailings,
    handleCreateSailing,
    openSailingEdit,
    cancelSailingEdit,
    handleUpdateSailing,
    requestDeleteSailing,
    handleViewItinerary,
    handleCreateItineraryDay,
    openItineraryDayEdit,
    cancelItineraryDayEdit,
    handleUpdateItineraryDay,
    requestDeleteItineraryDay,
    handleCreateItineraryActivity,
    openActivityEdit,
    cancelActivityEdit,
    handleUpdateItineraryActivity,
    requestDeleteItineraryActivity,
    openCruiseLineEdit,
    cancelCruiseLineEdit,
    handleUpdateCruiseLine,
    requestDeleteCruiseLine,
    confirmPendingDelete,
    cancelPendingDelete
  } = useFleetDirectoryState({ cruiseLines, onRefresh, initialScope })

  return (
    <section className="react-app-section fleet-directory-section ce-command-panel" id="react-fleet" aria-labelledby="react-fleet-heading" data-testid="react-fleet-directory">
      <div className="section-heading-row ce-section-heading fleet-heading-row">
        <div>
          <p className="eyebrow ce-kicker">Fleet dashboard</p>
          <h2 id="react-fleet-heading">Cruise Line Directory</h2>
          <p>
            Search, review, and manage the cruise lines currently available in the live application dataset.
          </p>
        </div>
      </div>

      <div className="fleet-refresh-control" data-testid="react-fleet-refresh-control">
        <div>
          <strong>Fleet data</strong>
          <span>Reload cruise lines from the live application data source.</span>
        </div>
        <button
          type="button"
          className="button-link secondary light-action ce-button-secondary"
          onClick={handleRefreshFleet}
          disabled={isRefreshing}
          aria-describedby="react-fleet-refresh-status"
          data-testid="react-fleet-refresh-button"
        >
          {isRefreshing ? 'Refreshing fleet…' : 'Refresh fleet'}
        </button>
      </div>
      <p
        id="react-fleet-refresh-status"
        className="fleet-refresh-status muted-status ce-muted"
        role="status"
        aria-live="polite"
        data-testid="react-fleet-refresh-status"
      >
        {refreshMessage}
      </p>

      <label className="search-control ce-field fleet-search-control">
        <span>Search cruise lines</span>
        <input
          type="search"
          placeholder="Search cruise lines..."
          aria-describedby="react-fleet-count"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          data-testid="react-fleet-search"
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {fleetActionMessage && <p className="muted-status ce-muted" role="status" data-testid="react-fleet-action-message">{fleetActionMessage}</p>}
      <ConfirmActionPanel
        title="Confirm fleet delete"
        message={pendingDelete?.message}
        confirmLabel={pendingDelete?.confirmLabel}
        onConfirm={confirmPendingDelete}
        onCancel={cancelPendingDelete}
        isWorking={Boolean(deletingCruiseLineId || shipActionId || sailingActionId || itineraryActionId)}
        testId="react-fleet-delete-confirmation"
      />
      {isLoading && <p className="muted-status ce-muted">Loading cruise line directory…</p>}

      <p id="react-fleet-count" className="muted-status ce-muted" data-testid="react-fleet-count">
        Showing {visibleCruiseLines.length} of {filteredCruiseLines.length} matching cruise lines.
      </p>

      <ReactFleetCruiseLineGrid
        visibleCruiseLines={visibleCruiseLines}
        isLoading={isLoading}
        activeCruiseLineEditId={activeCruiseLineEditId}
        cruiseLineDraft={cruiseLineDraft}
        setCruiseLineDraft={setCruiseLineDraft}
        updatingCruiseLineId={updatingCruiseLineId}
        deletingCruiseLineId={deletingCruiseLineId}
        onViewShips={handleViewShips}
        onOpenCruiseLineEdit={openCruiseLineEdit}
        onRequestDeleteCruiseLine={requestDeleteCruiseLine}
        onUpdateCruiseLine={handleUpdateCruiseLine}
        onCancelCruiseLineEdit={cancelCruiseLineEdit}
      />

      <ReactFleetShipPanel
        selectedCruiseLine={selectedCruiseLine}
        selectedShips={selectedShips}
        shipDraft={shipDraft}
        setShipDraft={setShipDraft}
        shipActionId={shipActionId}
        shipsLoading={shipsLoading}
        shipsError={shipsError}
        shipActionMessage={shipActionMessage}
        activeShipEditId={activeShipEditId}
        shipEditDraft={shipEditDraft}
        setShipEditDraft={setShipEditDraft}
        onCreateShip={handleCreateShip}
        onViewSailings={handleViewSailings}
        onOpenShipEdit={openShipEdit}
        onRequestDeleteShip={requestDeleteShip}
        onUpdateShip={handleUpdateShip}
        onCancelShipEdit={cancelShipEdit}
      />

      <ReactFleetSailingPanel
        selectedShipForSailings={selectedShipForSailings}
        sailings={sailings}
        sailingsLoading={sailingsLoading}
        sailingsError={sailingsError}
        sailingDraft={sailingDraft}
        setSailingDraft={setSailingDraft}
        sailingActionMessage={sailingActionMessage}
        sailingActionId={sailingActionId}
        activeSailingEditId={activeSailingEditId}
        sailingEditDraft={sailingEditDraft}
        setSailingEditDraft={setSailingEditDraft}
        onCreateSailing={handleCreateSailing}
        onViewItinerary={handleViewItinerary}
        onOpenSailingEdit={openSailingEdit}
        onRequestDeleteSailing={requestDeleteSailing}
        onUpdateSailing={handleUpdateSailing}
        onCancelSailingEdit={cancelSailingEdit}
      />

      <ReactFleetItineraryPanel
        selectedSailingForItinerary={selectedSailingForItinerary}
        itineraryDays={itineraryDays}
        itineraryDayDraft={itineraryDayDraft}
        setItineraryDayDraft={setItineraryDayDraft}
        activityDraft={activityDraft}
        setActivityDraft={setActivityDraft}
        itineraryActionId={itineraryActionId}
        itineraryActionMessage={itineraryActionMessage}
        itineraryLoading={itineraryLoading}
        itineraryError={itineraryError}
        activeItineraryDayEditId={activeItineraryDayEditId}
        itineraryDayEditDraft={itineraryDayEditDraft}
        setItineraryDayEditDraft={setItineraryDayEditDraft}
        activeActivityEditId={activeActivityEditId}
        activityEditDraft={activityEditDraft}
        setActivityEditDraft={setActivityEditDraft}
        handleCreateItineraryDay={handleCreateItineraryDay}
        handleCreateItineraryActivity={handleCreateItineraryActivity}
        openItineraryDayEdit={openItineraryDayEdit}
        requestDeleteItineraryDay={requestDeleteItineraryDay}
        handleUpdateItineraryDay={handleUpdateItineraryDay}
        cancelItineraryDayEdit={cancelItineraryDayEdit}
        openActivityEdit={openActivityEdit}
        requestDeleteItineraryActivity={requestDeleteItineraryActivity}
        handleUpdateItineraryActivity={handleUpdateItineraryActivity}
        cancelActivityEdit={cancelActivityEdit}
      />

    </section>
  )
}
