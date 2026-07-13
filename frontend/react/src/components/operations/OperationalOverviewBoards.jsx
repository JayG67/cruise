import {
  getOperationPortfolioStatus,
  getOperationPortfolioTone
} from './operationalDashboardUtils.js'

export function OperationalTurnaroundHero({ focusLine, selectedDemoUser, readinessCount, passengerTotal, highCoordinationCount }) {
  return (
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
          <dd>{readinessCount}</dd>
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
  )
}

export function OperationsPortfolioBoard({
  portfolioOperationItems,
  selectedOperation,
  portfolioAverageReadiness,
  portfolioNeedsAttention,
  portfolioWatchCount,
  portfolioOpenEscalations,
  onSelectTurnaround
}) {
  if (portfolioOperationItems.length === 0) return null

  return (
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
              onClick={() => onSelectTurnaround(operation.id)}
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
  )
}

export function TurnaroundSelectorPanel({ readinessOperations, selectedOperation, onSelectTurnaround }) {
  if (readinessOperations.length <= 1 || !selectedOperation) return null

  return (
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
          onChange={event => onSelectTurnaround(event.target.value)}
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
  )
}

export function OperationsReleaseBoard({ selectedOperation, operationReleaseScore, releaseBoardItems, onFocusWorkspace }) {
  if (!selectedOperation) return null

  return (
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
            onClick={() => onFocusWorkspace(item.id)}
            data-testid="react-operations-release-card"
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.detail}</em>
          </button>
        ))}
      </div>
    </section>
  )
}
