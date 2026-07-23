const CONTINUITY_STATUS_LABELS = {
  AT_RISK: 'At risk',
  WATCH: 'Watch',
  READY: 'Ready',
  STABLE: 'Stable',
  BLOCKED: 'Blocked',
  CRITICAL: 'Critical',
}

function formatContinuityStatus(value) {
  const normalized = String(value || 'WATCH').trim().toUpperCase()
  return CONTINUITY_STATUS_LABELS[normalized] || normalized
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function formatDepartmentRole(value) {
  return String(value || 'Department')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

export function OperationsCommandContinuityPanels({ selectedOperation }) {
  return (
    <>
      {selectedOperation?.commandCenter && (
        <section className="operations-command-center" aria-labelledby="operations-command-center-heading" data-testid="react-operations-command-center">
          <div className="operations-command-center-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround command center</p>
              <h4 id="operations-command-center-heading">Live management board from assignment through closeout</h4>
              <p>{selectedOperation.commandCenter.commanderBrief?.summary}</p>
            </div>
            <div className={`operations-command-center-score ce-surface-light ${String(selectedOperation.commandCenter.commandStatus || '').toLowerCase()}`} aria-label={`Command center score ${selectedOperation.commandCenter.commandScore || 0}%`}>
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
                <article key={department.departmentRole} className="operations-command-center-department-card">
                  <div className="operations-command-center-department-heading">
                    <span className="operations-command-center-department-score">{department.readinessScore}%</span>
                    <span className="operations-command-center-department-status">{formatContinuityStatus(department.status)}</span>
                    <strong className="operations-command-center-department-role">{formatDepartmentRole(department.departmentRole)}</strong>
                  </div>
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
            <div className={`operations-control-board-score ce-surface-light ${String(selectedOperation.operationsControlBoard.summary?.goNoGoStatus || '').toLowerCase().replace(/_/g, '-')}`} aria-label={`Operations control board score ${selectedOperation.operationsControlBoard.summary?.controlScore || 0}%`}>
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
            <div className={`operations-continuity-center-score ce-surface-light ${String(selectedOperation.continuityCenter.commandStatus || '').toLowerCase()}`} aria-label={`Continuity score ${selectedOperation.continuityCenter.continuityScore || 0}%`}>
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
                <article key={department.departmentRole} className="operations-continuity-department-card">
                  <div className="operations-continuity-department-heading">
                    <span className="operations-continuity-department-score">{department.score}%</span>
                    <span className="operations-continuity-department-status">{formatContinuityStatus(department.status)}</span>
                    <strong className="operations-continuity-department-role">{formatDepartmentRole(department.departmentRole)}</strong>
                  </div>
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


    </>
  )
}
