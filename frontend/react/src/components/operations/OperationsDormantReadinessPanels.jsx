export function OperationsDormantReadinessPanels({ selectedOperation }) {
  return (
    <>
      {false && selectedOperation?.productionReadiness && (
        <section className="operations-production-readiness" aria-labelledby="operations-production-readiness-heading" data-testid="react-operations-production-readiness">
          <div className="operations-production-readiness-header">
            <div>
              <p className="eyebrow ce-kicker">Production readiness cockpit</p>
              <h4 id="operations-production-readiness-heading">Reviewer demo readiness and test ownership</h4>
              <p>{selectedOperation.productionReadiness.summary}</p>
            </div>
            <div className={`operations-production-readiness-score ${String(selectedOperation.productionReadiness.productionStatus || '').toLowerCase()}`} aria-label={`Production readiness score ${selectedOperation.productionReadiness.productionScore || 0}%`}>
              <span>{selectedOperation.productionReadiness.productionScore || 0}%</span>
              <small>{String(selectedOperation.productionReadiness.productionStatus || 'NEEDS_HARDENING').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-production-readiness-summary" data-testid="react-operations-production-readiness-summary">
            <strong>{selectedOperation.productionReadiness.headline}</strong>
            <p>{selectedOperation.productionReadiness.nextAction}</p>
          </div>
          <div className="operations-production-readiness-grid" data-testid="react-operations-production-readiness-gates">
            {(selectedOperation.productionReadiness.gates || []).slice(0, 8).map(gate => (
              <article className={`operations-production-readiness-card ${String(gate.status || '').toLowerCase()}`} key={gate.id}>
                <span>{gate.readinessScore}% · {String(gate.status || 'REVIEW').replace(/_/g, ' ')}</span>
                <strong>{gate.label}</strong>
                <p>{gate.detail}</p>
              </article>
            ))}
          </div>
          <div className="operations-production-readiness-details">
            <div data-testid="react-operations-production-readiness-blockers">
              <strong>Production-demo blockers</strong>
              <ul>
                {(selectedOperation.productionReadiness.blockers || []).slice(0, 8).map(blocker => (
                  <li key={blocker.id}><span>{blocker.severity}</span> {blocker.owner}: {blocker.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-production-readiness-testing-contract">
              <strong>Testing ownership contract</strong>
              <ul>
                {(selectedOperation.productionReadiness.testingContract || []).slice(0, 4).map(item => (
                  <li key={item.id}><span>{item.layer}</span> {item.status}: {item.coverage}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="operations-production-readiness-runbook" data-testid="react-operations-production-readiness-runbook">
            <strong>Production-demo runbook</strong>
            <ol>
              {(selectedOperation.productionReadiness.runbook || []).slice(0, 8).map(step => (
                <li key={step.id}><span>{step.label}</span> {step.owner}: {step.detail}</li>
              ))}
            </ol>
          </div>
        </section>
      )}


      {false && selectedOperation?.applicationDossier && (
        <section className="operations-application-dossier" aria-labelledby="operations-application-dossier-heading" data-testid="react-operations-application-dossier">
          <div className="operations-application-dossier-header">
            <div>
              <p className="eyebrow ce-kicker">Application dossier</p>
              <h4 id="operations-application-dossier-heading">Cruise-line application proof package</h4>
              <p>{selectedOperation.applicationDossier.summary}</p>
            </div>
            <div className={`operations-application-dossier-score ${String(selectedOperation.applicationDossier.dossierStatus || '').toLowerCase()}`} aria-label={`Application dossier score ${selectedOperation.applicationDossier.dossierScore || 0}%`}>
              <span>{selectedOperation.applicationDossier.dossierScore || 0}%</span>
              <small>{String(selectedOperation.applicationDossier.dossierStatus || 'NEEDS_PROOF_HARDENING').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-application-dossier-summary" data-testid="react-operations-application-dossier-summary">
            <strong>{selectedOperation.applicationDossier.reviewerNarrative?.headline}</strong>
            <p>{selectedOperation.applicationDossier.nextAction}</p>
            <p>{selectedOperation.applicationDossier.reviewerNarrative?.opener}</p>
          </div>
          <div className="operations-application-dossier-grid" data-testid="react-operations-application-dossier-evidence">
            {(selectedOperation.applicationDossier.evidenceSections || []).slice(0, 5).map(section => (
              <article className={`operations-application-dossier-card ${String(section.readiness || '').toLowerCase()}`} key={section.id}>
                <span>{section.score}% · {String(section.readiness || 'REVIEW').replace(/_/g, ' ')}</span>
                <strong>{section.label}</strong>
                <p>{section.detail}</p>
                <small>{section.status}</small>
              </article>
            ))}
          </div>
          <div className="operations-application-dossier-details">
            <div data-testid="react-operations-application-dossier-checklist">
              <strong>Application checklist</strong>
              <ul>
                {(selectedOperation.applicationDossier.checklist || []).slice(0, 8).map(item => (
                  <li key={item.id}><span>{item.status}</span> {item.label}: {item.detail}</li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-application-dossier-narrative">
              <strong>Reviewer narrative</strong>
              <ul>
                <li>{selectedOperation.applicationDossier.reviewerNarrative?.strongestProof}</li>
                <li>{selectedOperation.applicationDossier.reviewerNarrative?.weakestProof}</li>
                <li>{selectedOperation.applicationDossier.reviewerNarrative?.close}</li>
              </ul>
            </div>
          </div>
          <div className="operations-application-dossier-steps" data-testid="react-operations-application-dossier-next-steps">
            <strong>Next application steps</strong>
            <ol>
              {(selectedOperation.applicationDossier.nextApplicationSteps || []).slice(0, 5).map(step => (
                <li key={step.id}><span>{step.priority}</span> {step.owner}: {step.detail}</li>
              ))}
            </ol>
          </div>
        </section>
      )}


    </>
  )
}
