import {
  formatAuditEventPayload,
  formatAuditEventType,
  formatOperationalTimelineSource,
  formatOperationalTimelineTime,
  getOperationalTimelineTone
} from './operationalDashboardUtils.js'

export function OperationsTimelineAuditPanels({ selectedOperation }) {
  return (
    <>
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

    </>
  )
}
