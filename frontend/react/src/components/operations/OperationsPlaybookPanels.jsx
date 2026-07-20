export function OperationsPlaybookPanels({ playbookTemplate, playbookVariance }) {
  return (
    <>
      {playbookTemplate && (
        <section className="operations-playbook" aria-labelledby="operations-playbook-heading" data-testid="react-operations-playbook-template">
          <div className="operations-playbook-header">
            <div>
              <p className="eyebrow ce-kicker">Reusable playbook</p>
              <h4 id="operations-playbook-heading">Turnaround template promotion plan</h4>
              <p>{playbookTemplate.templateName} can be reviewed as a repeatable operating playbook for similar ships, ports, and passenger loads.</p>
            </div>
            <div className="operations-playbook-score ce-surface-light" aria-label={`Template readiness ${playbookTemplate.summary?.templateReadinessScore || 0}%`}>
              <span>{playbookTemplate.summary?.templateReadinessScore || 0}%</span>
              <small>{String(playbookTemplate.summary?.templateReadinessStatus || 'REVIEW').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-playbook-grid" data-testid="react-operations-playbook-checks">
            {(playbookTemplate.checks || []).map(check => (
              <article className={`operations-playbook-check ${String(check.status || '').toLowerCase()}`} key={check.id}>
                <span>{check.label}</span>
                <strong>{check.status}</strong>
                <em>{check.detail}</em>
              </article>
            ))}
          </div>
          <div className="operations-playbook-details">
            <div data-testid="react-operations-playbook-departments">
              <strong>Department playbooks</strong>
              <ul>
                {(playbookTemplate.departmentPlaybooks || []).slice(0, 5).map(department => (
                  <li key={department.departmentRole}>
                    <span>{department.departmentRole}</span>
                    <em>{department.taskCount} tasks · {department.plannedStaff} planned staff · {department.recommendedCadence}</em>
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="react-operations-playbook-actions">
              <strong>Next best actions</strong>
              <ul>
                {(playbookTemplate.nextBestActions || []).slice(0, 3).map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {playbookVariance && (
        <section className="operations-playbook-variance" aria-labelledby="operations-playbook-variance-heading" data-testid="react-operations-playbook-variance">
          <div className="operations-playbook-variance-header">
            <div>
              <p className="eyebrow ce-kicker">Playbook variance</p>
              <h4 id="operations-playbook-variance-heading">Live execution versus template baseline</h4>
              <p>Rehearsal scoring compares this turnaround against the reusable playbook so operators can see whether today is tracking like a repeatable ship and port pattern.</p>
            </div>
            <div className={`operations-playbook-variance-score ce-surface-light ${String(playbookVariance.status || '').toLowerCase()}`}>
              <span>{playbookVariance.summary?.rehearsalScore || 0}%</span>
              <small>{String(playbookVariance.summary?.rehearsalStatus || 'REVIEW').replace(/_/g, ' ')}</small>
            </div>
          </div>
          <div className="operations-playbook-variance-grid" data-testid="react-operations-playbook-variance-departments">
            {(playbookVariance.departmentVariances || []).slice(0, 4).map(department => (
              <article className={`operations-playbook-variance-card ${String(department.status || '').toLowerCase()}`} key={department.departmentRole}>
                <span>{department.departmentRole}</span>
                <strong>{department.status}</strong>
                <em>{department.completeTaskCount}/{department.baselineTaskCount} tasks · {department.checkedInStaff}/{department.baselinePlannedStaff} staff · variance {department.varianceScore}</em>
              </article>
            ))}
          </div>
          <div className="operations-playbook-variance-actions" data-testid="react-operations-playbook-variance-actions">
            <strong>Rehearsal actions</strong>
            <ul>
              {(playbookVariance.rehearsalActions || []).slice(0, 3).map(action => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
