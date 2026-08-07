export default function AiEvaluationHistoryWorkspace({
  aiHistoryDecisionFilter,
  aiHistoryProviderFilter,
  aiHistoryProviders,
  aiHistorySearch,
  aiHistorySort,
  aiQualitySummary,
  filteredAiRuns,
  selectedAiRun,
  selectedAiRunId,
  setAiHistoryDecisionFilter,
  setAiHistoryProviderFilter,
  setAiHistorySearch,
  setAiHistorySort,
  setSelectedAiRunId
}) {
  function resetHistoryView() {
    setAiHistorySearch('')
    setAiHistoryDecisionFilter('ALL')
    setAiHistoryProviderFilter('ALL')
    setAiHistorySort('completed-desc')
  }

  return (
    <>
      <section className="ai-quality-history-section" aria-labelledby="ai-quality-history-heading">
        <div className="ai-quality-history-heading">
          <div>
            <p className="eyebrow ce-kicker">Evaluation history</p>
            <h4 id="ai-quality-history-heading">Filter and sort persisted runs</h4>
          </div>
          <span data-testid="react-ai-history-result-count">{filteredAiRuns.length} of {aiQualitySummary?.runs?.length || 0} runs shown</span>
        </div>
        <div className="ai-quality-history-controls" data-testid="react-ai-quality-history-controls">
          <label><span>Search runs</span><input data-testid="react-ai-history-search" type="search" value={aiHistorySearch} onChange={event => setAiHistorySearch(event.target.value)} placeholder="Run, variant, provider, model, or prompt" /></label>
          <label><span>Decision</span><select data-testid="react-ai-history-decision-filter" value={aiHistoryDecisionFilter} onChange={event => setAiHistoryDecisionFilter(event.target.value)}><option value="ALL">All decisions</option><option value="READY">Ready</option><option value="BLOCKED">Blocked</option></select></label>
          <label><span>Provider</span><select data-testid="react-ai-history-provider-filter" value={aiHistoryProviderFilter} onChange={event => setAiHistoryProviderFilter(event.target.value)}><option value="ALL">All providers</option>{aiHistoryProviders.map(provider => <option key={provider} value={provider}>{provider}</option>)}</select></label>
          <label><span>Sort by</span><select data-testid="react-ai-history-sort" value={aiHistorySort} onChange={event => setAiHistorySort(event.target.value)}><option value="completed-desc">Newest first</option><option value="completed-asc">Oldest first</option><option value="pass-rate-desc">Pass rate: high to low</option><option value="pass-rate-asc">Pass rate: low to high</option><option value="score-desc">Score: high to low</option><option value="score-asc">Score: low to high</option></select></label>
          <button type="button" className="secondary-button ce-button-secondary" data-testid="react-ai-history-reset" onClick={resetHistoryView}>Reset history view</button>
        </div>
        <div className="ai-quality-history-wrap" role="region" aria-labelledby="ai-quality-history-heading" tabIndex="0">
          <table className="ai-quality-history" data-testid="react-ai-quality-history-table">
            <caption className="sr-only">Recent AI evaluation runs</caption>
            <thead><tr><th>Completed</th><th>Variant</th><th>Provider / model</th><th>Prompt</th><th>Pass rate</th><th>Score</th><th>Decision</th><th>Diagnostics</th></tr></thead>
            <tbody>
              {filteredAiRuns.map(run => (
                <tr key={run.runId} className={selectedAiRunId === run.runId ? 'selected' : undefined}>
                  <td>{run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Unknown'}</td>
                  <td>{run.variantId || 'default'}</td>
                  <td>{run.provider} / {run.model}</td>
                  <td>{run.promptVersion}</td>
                  <td>{run.passRate}%</td>
                  <td>{run.averageScore}</td>
                  <td><span className={`ai-release-badge ${run.passed ? 'ready' : 'blocked'}`}>{run.passed ? 'READY' : 'BLOCKED'}</span></td>
                  <td>
                    {run.failedCases?.length ? (
                      <button
                        type="button"
                        className="ai-diagnostics-button"
                        data-testid={`react-ai-run-diagnostics-${run.runId}`}
                        aria-expanded={selectedAiRunId === run.runId}
                        onClick={() => setSelectedAiRunId(current => current === run.runId ? null : run.runId)}
                      >
                        {selectedAiRunId === run.runId ? 'Hide failures' : `Review ${run.failedCases.length} failure${run.failedCases.length === 1 ? '' : 's'}`}
                      </button>
                    ) : <span className="ai-no-failures">No failures</span>}
                  </td>
                </tr>
              ))}
              {!filteredAiRuns.length && <tr><td colSpan="8">{aiQualitySummary?.runs?.length ? 'No evaluation runs match the selected history filters.' : 'No persisted AI evaluation runs are available.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selectedAiRun && (
        <section className="ai-failure-drilldown" data-testid="react-ai-failure-drilldown" aria-live="polite">
          <div className="ai-failure-drilldown-header">
            <div>
              <p className="eyebrow ce-kicker">Failed-case diagnostics</p>
              <h4>{selectedAiRun.failedCases.length} failed case{selectedAiRun.failedCases.length === 1 ? '' : 's'} in run {selectedAiRun.runId}</h4>
            </div>
            <button type="button" className="secondary-button ce-button-secondary" onClick={() => setSelectedAiRunId(null)}>Close diagnostics</button>
          </div>
          <div className="ai-failure-card-grid">
            {selectedAiRun.failedCases.map(failedCase => (
              <article className="ai-failure-card" key={failedCase.evaluationCaseId}>
                <div className="ai-failure-card-heading">
                  <div><strong>{failedCase.evaluationCaseName}</strong><span>{failedCase.evaluationCaseId}</span></div>
                  <span className="ai-release-badge blocked">Score {failedCase.score}</span>
                </div>
                <dl className="ai-diagnostic-list">
                  <div><dt>Weak dimensions</dt><dd>{failedCase.weakestDimensions.length ? failedCase.weakestDimensions.map(item => `${item.dimension} (${item.score})`).join(', ') : 'None reported'}</dd></div>
                  <div><dt>Missing evidence</dt><dd>{failedCase.diagnostics.missingRequiredEvidence.join(', ') || 'None'}</dd></div>
                  <div><dt>Unsupported evidence</dt><dd>{failedCase.diagnostics.unsupportedEvidence.join(', ') || 'None'}</dd></div>
                  <div><dt>Missing categories</dt><dd>{failedCase.diagnostics.missingFindingCategories.join(', ') || 'None'}</dd></div>
                  <div><dt>Actionable findings</dt><dd>{failedCase.diagnostics.actionableFindingCount}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
      {!!aiQualitySummary?.failureSummary?.length && (
        <div className="ai-recurring-failures" data-testid="react-ai-recurring-failures">
          <strong>Recurring failed cases</strong>
          <span>{aiQualitySummary.failureSummary.map(item => `${item.evaluationCaseName}: ${item.failureCount}`).join(' • ')}</span>
        </div>
      )}
    </>
  )
}
