export function OperationsIncidentBriefingScenarioPanels({ incidentCommand, operationalBriefingBoard, scenarioPlan }) {
  return (
    <>
      {incidentCommand && (
        <section className="operations-incident-command" aria-labelledby="operations-incident-command-heading" data-testid="react-operations-incident-command">
          <div className="operations-incident-command-header">
            <div>
              <p className="eyebrow ce-kicker">Incident command</p>
              <h4 id="operations-incident-command-heading">Release-day exception bridge</h4>
              <p>Incident command converts blockers, staffing gaps, signoffs, handoffs, dependencies, escalations, and timeline risk into one commander-facing action bridge.</p>
            </div>
            <div className={`operations-incident-command-score ce-surface-light ${String(incidentCommand.incidentSeverity || '').toLowerCase()}`}>
              <span>{incidentCommand.incidentScore || 0}%</span>
              <small>{String(incidentCommand.incidentStatus || 'STABLE').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-incident-command-grid" data-testid="react-operations-incident-signals">
            {(incidentCommand.incidentSignals || []).slice(0, 4).map(signal => (
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
                {(incidentCommand.incidentDepartments || []).slice(0, 3).map(department => (
                  <li key={department.departmentRole}>{department.departmentRole}: risk {department.riskScore}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-incident-actions">
              <strong>Command actions</strong>
              <ul>
                {(incidentCommand.commandActions || []).slice(0, 4).map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {operationalBriefingBoard && (
        <section className="operations-operational-briefing-board" aria-labelledby="operations-operational-briefing-board-heading" data-testid="react-operations-operational-briefing-board">
          <div className="operations-operational-briefing-board-header">
            <div>
              <p className="eyebrow ce-kicker">Operational briefing board</p>
              <h4 id="operations-operational-briefing-board-heading">Leadership-ready operational briefing</h4>
              <p>{operationalBriefingBoard.narrative?.positioning}</p>
            </div>
            <div className={`operations-operational-briefing-board-score ce-surface-light ${String(operationalBriefingBoard.readiness?.readinessStatus || '').toLowerCase()}`} aria-label={`Operational briefing readiness score ${operationalBriefingBoard.readiness?.readinessScore || 0}%`}>
              <span>{operationalBriefingBoard.readiness?.readinessScore || 0}%</span>
              <small>{String(operationalBriefingBoard.readiness?.readinessStatus || 'REVIEW_BEFORE_BRIEFING').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-operational-briefing-board-narrative" data-testid="react-operations-operational-briefing-board-narrative">
            <strong>{operationalBriefingBoard.narrative?.headline}</strong>
            <p>{operationalBriefingBoard.narrative?.statusLine}</p>
            <p>{operationalBriefingBoard.narrative?.recommendedAction}</p>
          </div>
          <div className="operations-operational-briefing-board-grid" data-testid="react-operations-operational-briefing-checklist">
            {(operationalBriefingBoard.checklist || []).slice(0, 5).map(item => (
              <article className={`operations-operational-briefing-board-card ${String(item.status || '').toLowerCase()}`} key={item.id}>
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-operational-briefing-board-details">
            <div data-testid="react-operations-operational-briefing-assets">
              <strong>Briefing evidence</strong>
              <ul>
                {(operationalBriefingBoard.assets || []).slice(0, 4).map(asset => (
                  <li key={asset.id}><span>{asset.status}</span> {asset.label}: {asset.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-operational-briefing-targets">
              <strong>Command audiences</strong>
              <ul>
                {(operationalBriefingBoard.audienceRecommendations || []).slice(0, 4).map(target => (
                  <li key={target.id}><span>{target.status}</span> {target.label}: {target.detail}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-operational-briefing-board-actions" data-testid="react-operations-operational-briefing-actions">
            <strong>Briefing action plan</strong>
            <ol>
              {(operationalBriefingBoard.actionPlan || []).slice(0, 4).map(action => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {scenarioPlan && (
        <section className="operations-scenario-plan" aria-labelledby="operations-scenario-plan-heading" data-testid="react-operations-scenario-plan">
          <div className="operations-scenario-plan-header">
            <div>
              <p className="eyebrow ce-kicker">Turnaround scenario plan</p>
              <h4 id="operations-scenario-plan-heading">Operational resilience drills and contingencies</h4>
              <p>{scenarioPlan.summary}</p>
            </div>
            <div className={`operations-scenario-plan-score ce-surface-light ${String(scenarioPlan.scenarioStatus || '').toLowerCase()}`} aria-label={`Scenario resilience score ${scenarioPlan.resilienceScore || 0}%`}>
              <span>{scenarioPlan.resilienceScore || 0}%</span>
              <small>{String(scenarioPlan.scenarioStatus || 'WATCH_ITEMS_PRESENT').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-scenario-plan-summary" data-testid="react-operations-scenario-plan-summary">
            <strong>{scenarioPlan.headline}</strong>
            <p>Evidence: release {scenarioPlan.evidence?.releaseStatus}, incident {scenarioPlan.evidence?.incidentSeverity}, launch {scenarioPlan.evidence?.launchStatus}, management {scenarioPlan.evidence?.managementStatus}.</p>
          </div>
          <div className="operations-scenario-plan-grid" data-testid="react-operations-scenario-stress-cases">
            {(scenarioPlan.stressCases || []).slice(0, 5).map(stressCase => (
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
                {(scenarioPlan.triggerMatrix || []).slice(0, 5).map(trigger => (
                  <li key={trigger.id}><span>{trigger.severity}</span> {trigger.owner}: {trigger.trigger}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-scenario-actions">
              <strong>Contingency actions</strong>
              <ul>
                {(scenarioPlan.contingencyActions || []).slice(0, 6).map(action => (
                  <li key={action.id}><span>{action.priority}</span> {action.owner}: {action.label} — {action.detail}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-scenario-plan-runbook ce-surface-dark" data-testid="react-operations-scenario-runbook">
            <strong>Operational resilience drill runbook</strong>
            <ol>
              {(scenarioPlan.drillRunbook || []).slice(0, 6).map(step => (
                <li key={step.id}><span>{step.label}</span> {step.detail}</li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </>
  )
}
