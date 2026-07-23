export function OperationsLifecyclePanel({ selectedOperation, focusOperationsWorkspace, getLifecycleTargetWorkspace, getPhaseTargetWorkspace }) {
  if (!selectedOperation?.lifecycleState) return null

  return (
    <section className={`operations-lifecycle ${String(selectedOperation.lifecycleState.status || '').toLowerCase()}`} aria-labelledby="operations-lifecycle-heading" data-testid="react-operations-lifecycle-state">
          <div className="operations-lifecycle-header" data-testid="react-operations-lifecycle-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround lifecycle</p>
              <h4 id="operations-lifecycle-heading">{selectedOperation.lifecycleState.currentPhaseLabel} command path</h4>
              <p>{selectedOperation.lifecycleState.completionLanguage}</p>
            </div>
            <div className="operations-lifecycle-score ce-surface-light" aria-label={`Lifecycle completion ${selectedOperation.lifecycleState.completionPercent || 0}%`}>
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
                  className={`operations-lifecycle-phase ce-command-card ${['setup', 'complete', 'completed'].includes(String(phase.status || '').toLowerCase()) ? 'ce-surface-light' : 'ce-surface-dark'} ${String(phase.status || '').toLowerCase()}`}
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
  )
}
