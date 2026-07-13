export function OperationsLaunchCloseoutPanels({ selectedOperation }) {
  return (
    <>
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


    </>
  )
}
