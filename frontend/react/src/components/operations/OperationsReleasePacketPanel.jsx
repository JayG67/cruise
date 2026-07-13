import {
  getReleaseChecklistStatusLabel,
  getReleasePacketStatusLabel
} from './operationalDashboardUtils.js'

export function OperationsReleasePacketPanel({ releasePacket }) {
  if (!releasePacket) {
    return null
  }

  return (
    <section className={`operations-release-packet ${String(releasePacket.releaseStatus || '').toLowerCase()}`} aria-labelledby="operations-release-packet-heading" data-testid="react-operations-release-packet">
      <div className="operations-release-packet-header">
        <div>
          <p className="eyebrow ce-kicker">Release packet</p>
          <h4 id="operations-release-packet-heading">Final embarkation release readiness</h4>
          <p>{releasePacket.releaseRecommendation}</p>
        </div>
        <div className="operations-release-packet-score" aria-label={`Release packet score ${releasePacket.readinessScore}%`}>
          <span>{releasePacket.readinessScore}%</span>
          <small>{getReleasePacketStatusLabel(releasePacket.releaseStatus)}</small>
        </div>
      </div>
      <div className="operations-release-packet-grid ce-command-card" data-testid="react-operations-release-packet-checklist">
        {(releasePacket.checklist || []).map(item => (
          <article className={`operations-release-packet-item ${String(item.status || '').toLowerCase()}`} key={item.id}>
            <strong>{item.label}</strong>
            <span>{getReleaseChecklistStatusLabel(item.status)} · {item.percent}%</span>
          </article>
        ))}
      </div>
      {releasePacket.blockers?.length > 0 && (
        <div className="operations-release-blockers ce-command-card" data-testid="react-operations-release-blockers">
          <strong>Release blockers</strong>
          <ul>
            {releasePacket.blockers.slice(0, 5).map((blocker, index) => (
              <li key={`${blocker.type}-${blocker.label}-${index}`}>
                <span>{blocker.type}</span>
                <em>{blocker.label}</em>
                <small>{blocker.detail}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
