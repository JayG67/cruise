import { useEffect, useMemo, useState } from 'react'
import { buildFleetIntelligence, buildOperationsIntelligence } from '../domain/operationsIntelligence.js'

export default function OperationsIntelligenceCenter({
  turnaroundOperations = [],
  isLoading = false,
  error = '',
  onRetry,
  onOpenWorkspace
}) {
  const [selectedOperationId, setSelectedOperationId] = useState('')
  const fleetIntelligence = useMemo(() => buildFleetIntelligence(turnaroundOperations), [turnaroundOperations])
  const selectedOperation = turnaroundOperations.find(operation => operation.id === selectedOperationId) || turnaroundOperations[0] || null
  const intelligence = useMemo(() => buildOperationsIntelligence(selectedOperation || {}), [selectedOperation])

  useEffect(() => {
    if (!turnaroundOperations.length) {
      setSelectedOperationId('')
      return
    }
    if (!turnaroundOperations.some(operation => operation.id === selectedOperationId)) {
      setSelectedOperationId(turnaroundOperations[0].id)
    }
  }, [turnaroundOperations, selectedOperationId])

  function openWorkspace(sectionId, label) {
    onOpenWorkspace?.(sectionId, label, 'admin')
  }

  return (
    <section className="operations-intelligence-center ce-command-panel" id="react-operations-intelligence" aria-labelledby="operations-intelligence-heading" data-testid="react-operations-intelligence-center">
      <header className="operations-intelligence-header">
        <div>
          <p className="eyebrow ce-kicker">Operations intelligence</p>
          <h2 id="operations-intelligence-heading">Prioritize the turnarounds that need action</h2>
          <p>Review live staffing gaps, task blockers, escalations, dependencies, handoffs, and readiness approvals before they affect departure.</p>
        </div>
        <div className="operations-intelligence-fleet-status ce-command-card" aria-label="Fleet turnaround status">
          <strong>{fleetIntelligence.operationCount} active turnarounds</strong>
          <span>{fleetIntelligence.attentionCount} need immediate attention</span>
          <span>{fleetIntelligence.watchCount} require monitoring</span>
        </div>
      </header>

      {isLoading && <p className="operations-intelligence-message" role="status">Loading turnaround intelligence...</p>}
      {error && (
        <div className="operations-intelligence-message is-error" role="alert">
          <p>{error}</p>
          <button type="button" className="secondary-action-button ce-button-secondary" onClick={onRetry}>Retry turnaround data</button>
        </div>
      )}
      {!isLoading && !error && turnaroundOperations.length === 0 && (
        <div className="operations-intelligence-empty ce-command-card">
          <h3>No turnaround operations are available</h3>
          <p>Create or assign a turnaround before reviewing operational intelligence.</p>
          <button type="button" className="primary-action-button ce-button-primary" onClick={() => openWorkspace('react-turnaround-admin-setup', 'Turnaround Admin Setup')}>Open turnaround setup</button>
        </div>
      )}

      {!isLoading && !error && selectedOperation && (
        <>
          <div className="operations-intelligence-selector ce-command-card">
            <label htmlFor="operations-intelligence-operation-select">Turnaround operation</label>
            <select id="operations-intelligence-operation-select" value={selectedOperation.id} onChange={event => setSelectedOperationId(event.target.value)} data-testid="react-operations-intelligence-select">
              {turnaroundOperations.map(operation => (
                <option key={operation.id} value={operation.id}>{operation.title} · {operation.turnaroundDate || operation.sailing?.departureDate}</option>
              ))}
            </select>
          </div>

          <article className={`operations-intelligence-detail is-${intelligence.risk.toLowerCase().replace('_', '-')}`} aria-live="polite" data-testid="react-operations-intelligence-detail">
            <div className="operations-intelligence-detail-heading">
              <div>
                <p className="eyebrow ce-kicker">Selected turnaround</p>
                <h3>{intelligence.shipName} · {intelligence.departureDate}</h3>
                <p>{intelligence.cruiseLineName} · {intelligence.port}</p>
              </div>
              <span className="operations-intelligence-risk" data-testid="react-operations-intelligence-risk">{intelligence.riskLabel}</span>
            </div>

            <dl className="operations-intelligence-metrics" aria-label="Selected turnaround operational metrics">
              {intelligence.metrics.map(metric => (
                <div key={metric.id} data-testid={`react-operations-intelligence-metric-${metric.id}`}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                  <span>{metric.detail}</span>
                </div>
              ))}
            </dl>

            <section className="operations-intelligence-priorities" aria-labelledby="operations-intelligence-priorities-heading">
              <h4 id="operations-intelligence-priorities-heading">Priority actions</h4>
              <ul data-testid="react-operations-intelligence-priority-list">
                {intelligence.actions.map(action => (
                  <li className={`is-${action.tone}`} key={action.id}>
                    <strong>{action.label}</strong>
                    <span>{action.detail}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="operations-intelligence-actions ce-action-row">
              <button type="button" className="primary-action-button ce-button-primary" onClick={() => openWorkspace('react-turnaround-admin-setup', 'Turnaround Admin Setup')} data-testid="react-operations-intelligence-setup-button">Review team setup</button>
              <button type="button" className="secondary-action-button ce-button-secondary" onClick={() => onOpenWorkspace?.('react-role-selector', 'Role-aware Views')} data-testid="react-operations-intelligence-role-button">Open operational role workspace</button>
              <button type="button" className="secondary-action-button ce-button-secondary" onClick={onRetry} data-testid="react-operations-intelligence-refresh-button">Refresh operational data</button>
            </div>
          </article>
        </>
      )}
    </section>
  )
}
