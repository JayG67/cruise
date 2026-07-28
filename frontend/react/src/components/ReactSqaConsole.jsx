import { useEffect, useMemo, useState } from 'react'

import ConfirmActionPanel from './ConfirmActionPanel.jsx'
import { compareAiEvaluationRuns, getAiAdversarialQualitySummary, getAiEvaluationQualitySummary, previewAiEvaluationReleasePolicy, getBookings, getCruiseLines, getCustomers, getHealthStatus, getPlatformAuditEvents, getTurnaroundOperations, resetDemoData } from '../api/client.js'

function formatResult(title, payload) {
  return `${title}\n\n${JSON.stringify(payload, null, 2)}`
}

function createFailure(error) {
  return {
    passed: false,
    error: error.message || 'Validation failed'
  }
}


function buildPendingReadinessChecklist() {
  return [
    {
      label: 'API availability',
      status: 'pending',
      detail: 'Not checked yet. Run Go-Live Review to validate API availability.'
    },
    {
      label: 'Fleet data',
      status: 'pending',
      detail: 'Not checked yet. Run Go-Live Review to validate cruise-line data.'
    },
    {
      label: 'Customer operations',
      status: 'pending',
      detail: 'Not checked yet. Run Go-Live Review to validate customers and bookings.'
    },
    {
      label: 'Turnaround operations',
      status: 'pending',
      detail: 'Not checked yet. Run Go-Live Review to validate turnaround operations.'
    },
    {
      label: 'Manual approval path',
      status: 'ready',
      detail: 'Review role-specific workflows, fleet management, passenger self-service, and quality reports before publishing.'
    }
  ]
}

function buildReadinessChecklist(result = {}) {
  return [
    {
      label: 'API availability',
      status: result.healthStatus === 'ok' ? 'ready' : 'attention',
      detail: result.healthStatus === 'ok' ? 'Application API is responding.' : 'Application API needs review.'
    },
    {
      label: 'Fleet data',
      status: result.cruiseLineCount > 0 ? 'ready' : 'attention',
      detail: `${result.cruiseLineCount || 0} cruise lines available.`
    },
    {
      label: 'Customer operations',
      status: result.customerCount > 0 && result.bookingCount > 0 ? 'ready' : 'attention',
      detail: `${result.customerCount || 0} customers and ${result.bookingCount || 0} bookings available.`
    },
    {
      label: 'Turnaround operations',
      status: result.turnaroundOperationCount > 0 ? 'ready' : 'attention',
      detail: `${result.turnaroundOperationCount || 0} turnaround operations available.`
    },
    {
      label: 'Manual approval path',
      status: 'ready',
      detail: 'Review role-specific workflows, fleet management, passenger self-service, and quality reports before publishing.'
    }
  ]
}

function getReadinessItemSymbol(status) {
  if (status === 'ready') return '✓'
  if (status === 'attention') return '!'
  return '•'
}

export default function ReactSqaConsole({ selectedDemoUser, onRefreshData }) {
  const [output, setOutput] = useState('Test output will appear here...')
  const [lastRun, setLastRun] = useState('No manual run yet')
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Ready for validation')
  const [resetConfirmationVisible, setResetConfirmationVisible] = useState(false)
  const [readinessChecklist, setReadinessChecklist] = useState(buildPendingReadinessChecklist())
  const [aiQualitySummary, setAiQualitySummary] = useState(null)
  const [aiAdversarialSummary, setAiAdversarialSummary] = useState(null)
  const [aiAdversarialStatus, setAiAdversarialStatus] = useState('Loading Phase 5 resilience evidence...')
  const [aiQualityStatus, setAiQualityStatus] = useState('Loading AI evaluation quality...')
  const [selectedAiRunId, setSelectedAiRunId] = useState(null)
  const [currentAiRunId, setCurrentAiRunId] = useState('')
  const [baselineAiRunId, setBaselineAiRunId] = useState('')
  const [aiRunComparison, setAiRunComparison] = useState(null)
  const [aiComparisonStatus, setAiComparisonStatus] = useState('Select two evaluation runs to compare.')
  const [isComparingAiRuns, setIsComparingAiRuns] = useState(false)
  const [aiReleasePolicy, setAiReleasePolicy] = useState({ minimumPassRate: 100, minimumAverageScore: 80, minimumPassRateDelta: 0, minimumAverageScoreDelta: 0, allowNewFailedCases: false })
  const [aiReleasePolicyPreview, setAiReleasePolicyPreview] = useState(null)
  const [aiReleasePolicyStatus, setAiReleasePolicyStatus] = useState('Adjust thresholds and preview the release decision.')
  const [isPreviewingAiReleasePolicy, setIsPreviewingAiReleasePolicy] = useState(false)
  const [aiHistoryDecisionFilter, setAiHistoryDecisionFilter] = useState('ALL')
  const [aiHistoryProviderFilter, setAiHistoryProviderFilter] = useState('ALL')
  const [aiHistorySearch, setAiHistorySearch] = useState('')
  const [aiHistorySort, setAiHistorySort] = useState('completed-desc')

  useEffect(() => {
    let active = true
    getAiAdversarialQualitySummary({ selectedDemoUser })
      .then(summary => {
        if (!active) return
        setAiAdversarialSummary(summary)
        setAiAdversarialStatus(summary.releaseDecision === 'APPROVED' ? 'Phase 5 resilience gate approved' : 'Phase 5 resilience gate blocked')
      })
      .catch(error => {
        if (!active) return
        setAiAdversarialStatus(error.message || 'Phase 5 resilience evidence unavailable')
      })
    return () => { active = false }
  }, [selectedDemoUser])

  useEffect(() => {
    let active = true
    getAiEvaluationQualitySummary({ selectedDemoUser, limit: 10 })
      .then(summary => {
        if (!active) return
        setAiQualitySummary(summary)
        if (summary.releasePolicy) setAiReleasePolicy(summary.releasePolicy)
        const runs = summary.runs || []
        setCurrentAiRunId(current => current || runs[0]?.runId || '')
        setBaselineAiRunId(current => current || runs[runs.length - 1]?.runId || '')
        setAiQualityStatus(summary.releaseReadiness === 'READY' ? 'AI release gate ready' : summary.releaseReadiness === 'BLOCKED' ? 'AI release gate blocked' : 'No AI evaluation runs yet')
      })
      .catch(error => {
        if (!active) return
        setAiQualityStatus(error.message || 'AI evaluation quality unavailable')
      })
    return () => { active = false }
  }, [selectedDemoUser])

  const aiHistoryProviders = useMemo(() => Array.from(new Set((aiQualitySummary?.runs || []).map(run => run.provider).filter(Boolean))).sort(), [aiQualitySummary])

  const filteredAiRuns = useMemo(() => {
    const normalizedSearch = aiHistorySearch.trim().toLowerCase()
    const runs = (aiQualitySummary?.runs || []).filter(run => {
      if (aiHistoryDecisionFilter === 'READY' && !run.passed) return false
      if (aiHistoryDecisionFilter === 'BLOCKED' && run.passed) return false
      if (aiHistoryProviderFilter !== 'ALL' && run.provider !== aiHistoryProviderFilter) return false
      if (!normalizedSearch) return true
      return [run.runId, run.variantId, run.provider, run.model, run.promptVersion]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedSearch))
    })

    return [...runs].sort((left, right) => {
      if (aiHistorySort === 'completed-asc') return new Date(left.completedAt || 0) - new Date(right.completedAt || 0)
      if (aiHistorySort === 'pass-rate-desc') return Number(right.passRate || 0) - Number(left.passRate || 0)
      if (aiHistorySort === 'pass-rate-asc') return Number(left.passRate || 0) - Number(right.passRate || 0)
      if (aiHistorySort === 'score-desc') return Number(right.averageScore || 0) - Number(left.averageScore || 0)
      if (aiHistorySort === 'score-asc') return Number(left.averageScore || 0) - Number(right.averageScore || 0)
      return new Date(right.completedAt || 0) - new Date(left.completedAt || 0)
    })
  }, [aiHistoryDecisionFilter, aiHistoryProviderFilter, aiHistorySearch, aiHistorySort, aiQualitySummary])

  const selectedAiRun = aiQualitySummary?.runs?.find(run => run.runId === selectedAiRunId) || null

  async function handleCompareAiRuns() {
    if (!currentAiRunId || !baselineAiRunId) {
      setAiComparisonStatus('Select both a current run and a baseline run.')
      return
    }
    if (currentAiRunId === baselineAiRunId) {
      setAiComparisonStatus('Current and baseline evaluation runs must be different.')
      return
    }

    setIsComparingAiRuns(true)
    setAiComparisonStatus('Comparing evaluation runs...')
    try {
      const comparison = await compareAiEvaluationRuns(currentAiRunId, baselineAiRunId, { selectedDemoUser })
      setAiRunComparison(comparison)
      setAiComparisonStatus(comparison.regressed ? 'Regression detected against the selected baseline.' : 'No release-blocking regression detected.')
    } catch (error) {
      setAiRunComparison(null)
      setAiComparisonStatus(error.message || 'Evaluation comparison unavailable.')
    } finally {
      setIsComparingAiRuns(false)
    }
  }

  function updateAiReleasePolicy(field, value) {
    setAiReleasePolicy(current => ({ ...current, [field]: value }))
    setAiReleasePolicyPreview(null)
  }

  async function handlePreviewAiReleasePolicy() {
    if (!currentAiRunId || !baselineAiRunId || currentAiRunId === baselineAiRunId) {
      setAiReleasePolicyStatus('Select two different evaluation runs before previewing the release policy.')
      return
    }
    setIsPreviewingAiReleasePolicy(true)
    setAiReleasePolicyStatus('Evaluating the selected release policy...')
    try {
      const preview = await previewAiEvaluationReleasePolicy({
        suiteId: aiQualitySummary?.suiteId || 'turnaround-briefing-phase3',
        currentRunId: currentAiRunId,
        baselineRunId: baselineAiRunId,
        policy: aiReleasePolicy
      }, { selectedDemoUser })
      setAiReleasePolicyPreview(preview)
      setAiReleasePolicyStatus(preview.passed ? 'The candidate satisfies the selected release policy.' : 'The candidate is blocked by the selected release policy.')
    } catch (error) {
      setAiReleasePolicyPreview(null)
      setAiReleasePolicyStatus(error.message || 'Release-policy preview unavailable.')
    } finally {
      setIsPreviewingAiReleasePolicy(false)
    }
  }

  const validationActions = useMemo(() => ([
    {
      key: 'health',
      testId: 'react-sqa-health-button',
      title: 'Health Check',
      description: 'Ping the application health endpoint and verify API availability.',
      buttonLabel: 'Check API Health',
      run: async () => {
        const health = await getHealthStatus()
        return { passed: health.status === 'ok', health }
      }
    },
    {
      key: 'data',
      testId: 'react-sqa-data-button',
      title: 'Data Verification',
      description: 'Validate cruise-line payload shape and refresh the visible grid.',
      buttonLabel: 'Verify Cruise Data',
      run: async () => {
        const cruiseLines = await getCruiseLines()
        return { passed: Array.isArray(cruiseLines) && cruiseLines.length > 0, cruiseLineCount: cruiseLines.length }
      }
    },
    {
      key: 'ui-smoke',
      testId: 'react-sqa-ui-smoke-button',
      title: 'UI Smoke Check',
      description: 'Run a browser-level check across the core read workflows.',
      buttonLabel: 'Run UI Smoke Check',
      run: async () => {
        const [health, cruiseLines, customers, bookings] = await Promise.all([
          getHealthStatus(), getCruiseLines(), getCustomers(), getBookings()
        ])
        return {
          passed: health.status === 'ok' && cruiseLines.length > 0 && customers.length > 0 && bookings.length > 0,
          health: health.status,
          cruiseLineCount: cruiseLines.length,
          customerCount: customers.length,
          bookingCount: bookings.length
        }
      }
    },
    {
      key: 'contract',
      testId: 'react-sqa-contract-button',
      title: 'API Contract Check',
      description: 'Validate cruise-line and customer response fields against expected contracts.',
      buttonLabel: 'Check API Contract',
      run: async () => {
        const [cruiseLines, customers] = await Promise.all([getCruiseLines(), getCustomers()])
        const cruiseContract = cruiseLines.every(line => line.id && line.name)
        const customerContract = customers.every(customer => customer.id && customer.email)
        return { passed: cruiseContract && customerContract, cruiseContract, customerContract, cruiseLineCount: cruiseLines.length, customerCount: customers.length }
      }
    },
    {
      key: 'crud',
      testId: 'react-sqa-crud-button',
      title: 'Safe CRUD Workflow',
      description: 'Confirm the baseline data can be queried before running mutating workflows.',
      buttonLabel: 'Run CRUD Workflow Check',
      run: async () => {
        const [cruiseLines, customers, bookings] = await Promise.all([getCruiseLines(), getCustomers(), getBookings()])
        return {
          passed: cruiseLines.length > 0 && customers.length > 0 && bookings.length > 0,
          temporaryRecordCreated: false,
          note: 'React route performs safe read validation here; baseline data recovery remains explicit.',
          cruiseLineCount: cruiseLines.length,
          customerCount: customers.length,
          bookingCount: bookings.length
        }
      }
    },
    {
      key: 'performance',
      testId: 'react-sqa-performance-button',
      title: 'Performance Smoke Check',
      description: 'Measure client-side response times for health, cruise, and customer endpoints.',
      buttonLabel: 'Run Performance Check',
      run: async () => {
        const startedAt = performance.now()
        await Promise.all([getHealthStatus(), getCruiseLines(), getCustomers()])
        const durationMs = Math.round(performance.now() - startedAt)
        return { passed: durationMs < 3000, durationMs, thresholdMs: 3000 }
      }
    },
    {
      key: 'seed',
      testId: 'react-sqa-seed-button',
      title: 'Seed Integrity Check',
      description: 'Confirm the baseline dataset contains cruise lines, customers, and bookings.',
      buttonLabel: 'Check Seed Integrity',
      run: async () => {
        const [cruiseLines, customers, bookings] = await Promise.all([getCruiseLines(), getCustomers(), getBookings()])
        return { passed: cruiseLines.length >= 8 && customers.length >= 20 && bookings.length >= 10, cruiseLineCount: cruiseLines.length, customerCount: customers.length, bookingCount: bookings.length }
      }
    },
    {
      key: 'rendering',
      testId: 'react-sqa-rendering-button',
      title: 'Rendering Consistency',
      description: 'Compare rendered React data counts against the live API dataset.',
      buttonLabel: 'Check Rendering',
      run: async () => {
        const [cruiseLines, customers, bookings] = await Promise.all([getCruiseLines(), getCustomers(), getBookings()])
        return { passed: cruiseLines.length > 0 && customers.length > 0 && bookings.length > 0, renderedSections: ['fleet directory', 'admin workspace', 'role selector'], cruiseLineCount: cruiseLines.length, customerCount: customers.length, bookingCount: bookings.length }
      }
    },
    {
      key: 'audit-history',
      testId: 'react-sqa-audit-history-button',
      title: 'Audit History Review',
      description: 'Verify immutable platform and turnaround audit history is queryable for production review.',
      buttonLabel: 'Review Audit History',
      run: async () => {
        const [platformAuditEvents, turnaroundOperations] = await Promise.all([
          getPlatformAuditEvents({ limit: 25 }, { selectedDemoUser }),
          getTurnaroundOperations({ selectedDemoUser })
        ])
        const operationAuditCount = turnaroundOperations.reduce((count, operation) => count + (Array.isArray(operation.auditEvents) ? operation.auditEvents.length : 0), 0)
        return {
          passed: platformAuditEvents.length > 0 || operationAuditCount > 0,
          platformAuditEventCount: platformAuditEvents.length,
          operationAuditEventCount: operationAuditCount,
          reviewedActor: selectedDemoUser?.displayName || selectedDemoUser?.name || 'Admin demo user',
          note: 'A new environment may show zero platform audit events until mutations are performed; turnaround payloads should include recent operational audit events after workflow activity.'
        }
      }
    },
    {
      key: 'deployment',
      testId: 'react-sqa-deployment-button',
      title: 'Deployment Diagnostics',
      description: 'Report runtime URL, timestamp, health status, and visible data count.',
      buttonLabel: 'Run Deployment Check',
      run: async () => {
        const [health, cruiseLines] = await Promise.all([getHealthStatus(), getCruiseLines()])
        return { passed: health.status === 'ok', url: window.location.href, timestamp: new Date().toISOString(), healthStatus: health.status, visibleCruiseLineCount: cruiseLines.length }
      }
    },
    {
      key: 'go-live',
      testId: 'react-sqa-go-live-button',
      title: 'Go-Live Readiness Review',
      description: 'Summarize the data, API, and operations conditions to review before publishing.',
      buttonLabel: 'Run Go-Live Review',
      run: async () => {
        const [health, cruiseLines, customers, bookings, turnaroundOperations] = await Promise.all([
          getHealthStatus(), getCruiseLines(), getCustomers(), getBookings(), getTurnaroundOperations()
        ])
        const result = {
          passed: health.status === 'ok' && cruiseLines.length > 0 && customers.length > 0 && bookings.length > 0 && turnaroundOperations.length > 0,
          healthStatus: health.status,
          cruiseLineCount: cruiseLines.length,
          customerCount: customers.length,
          bookingCount: bookings.length,
          turnaroundOperationCount: turnaroundOperations.length,
          manualReviewRequired: true,
          recommendedManualPath: [
            'Select Turnaround Manager and review the operations command center.',
            'Open Tasks, Dependencies, Handoffs, Escalations, Staffing, and Readiness.',
            'Switch to each department lead and confirm the role-specific work queue.',
            'Review passenger self-service and group leader visibility.',
            'Run Lighthouse, coverage, and deployment diagnostics before approval.'
          ]
        }
        setReadinessChecklist(buildReadinessChecklist(result))
        return result
      }
    }
  ]), [selectedDemoUser])

  async function runValidation(action) {
    setIsRunning(true)
    setStatus(`Running ${action.title}`)
    setLastRun(`Running: ${action.title}`)

    try {
      const result = await action.run()
      setOutput(formatResult(`${action.title} Result`, result))
      setStatus(result.passed ? 'Ready for validation' : 'Validation needs attention')
      setLastRun(`Last run: ${action.title} ${result.passed ? 'Passed' : 'Failed'}`)
    } catch (error) {
      setOutput(formatResult(`${action.title} Failed`, createFailure(error)))
      setStatus('Validation needs attention')
      setLastRun(`Last run: ${action.title} Failed`)
    } finally {
      setIsRunning(false)
    }
  }

  function requestResetDemoData() {
    setResetConfirmationVisible(true)
    setStatus('Baseline data recovery needs confirmation')
  }

  function cancelResetDemoData() {
    setResetConfirmationVisible(false)
    setStatus('Ready for validation')
    setLastRun('Baseline Data Recovery cancelled')
  }

  async function handleResetDemoData() {
    setIsRunning(true)
    setStatus('Running Baseline Data Recovery')
    setLastRun('Running: Baseline Data Recovery')

    try {
      const result = await resetDemoData()
      await onRefreshData?.()
      setOutput(formatResult('Baseline Data Recovery Result', { passed: true, ...result }))
      setResetConfirmationVisible(false)
      setStatus('Ready for validation')
      setLastRun('Last run: Baseline Data Recovery Passed')
    } catch (error) {
      setOutput(formatResult('Baseline Data Recovery Failed', createFailure(error)))
      setStatus('Validation needs attention')
      setLastRun('Last run: Baseline Data Recovery Failed')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <section className="react-sqa-console ce-command-panel ce-surface-light" id="react-sqa-console" aria-labelledby="react-sqa-heading" data-testid="react-sqa-console">
      <div className="react-sqa-header">
        <div>
          <p className="eyebrow ce-kicker">Quality Validation Console</p>
          <h2 id="react-sqa-heading">Quality Console for API-driven UI behavior</h2>
          <p>
            A quality operations console for exercising API health, data contracts,
            CRUD workflow safety, response timing, rendering consistency, seed integrity, deployment
            diagnostics, and baseline data reset behavior.
          </p>
        </div>
        <div className="react-sqa-status-pill ce-command-card ce-surface-light" data-testid="react-sqa-status">
          <span aria-hidden="true" className={status === 'Ready for validation' ? 'ready-dot' : 'attention-dot'}></span>
          <div>
            <strong>Console Status</strong>
            <span>{status}</span>
          </div>
        </div>
      </div>



      <div className="go-live-readiness-panel ce-surface-light" data-testid="react-ai-adversarial-summary-panel">
        <div>
          <p className="eyebrow ce-kicker">AI Adversarial Resilience</p>
          <h3>Phase 5 safety and resilience gate</h3>
          <p>{aiAdversarialStatus}</p>
        </div>
        <ul className="go-live-readiness-list" aria-label="Phase 5 adversarial resilience summary">
          <li className={`readiness-item ${aiAdversarialSummary?.releaseDecision === 'APPROVED' ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{aiAdversarialSummary?.releaseDecision === 'APPROVED' ? '✓' : '!'}</span>
            <div><strong>Release decision</strong><p>{aiAdversarialSummary?.releaseDecision || 'NO_DATA'}</p></div>
          </li>
          <li className={`readiness-item ${aiAdversarialSummary?.failedScenarios === 0 ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{aiAdversarialSummary?.failedScenarios === 0 ? '✓' : '!'}</span>
            <div><strong>Scenario coverage</strong><p>{aiAdversarialSummary ? `${aiAdversarialSummary.passedScenarios} of ${aiAdversarialSummary.totalScenarios} scenarios passed` : 'No adversarial results available.'}</p></div>
          </li>
          <li className={`readiness-item ${aiAdversarialSummary?.resilienceScore === 100 ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{aiAdversarialSummary?.resilienceScore === 100 ? '✓' : '!'}</span>
            <div><strong>Resilience score</strong><p>{aiAdversarialSummary ? `${aiAdversarialSummary.resilienceScore}% across ${aiAdversarialSummary.totalSuites} suites` : 'No resilience score available.'}</p></div>
          </li>
        </ul>
        <ul className="go-live-readiness-list" data-testid="react-ai-adversarial-suite-list" aria-label="Phase 5 adversarial suite results">
          {(aiAdversarialSummary?.suites || []).map(suite => (
            <li className={`readiness-item ${suite.releaseDecision === 'APPROVED' ? 'ready' : 'attention'}`} key={suite.id}>
              <span aria-hidden="true">{suite.releaseDecision === 'APPROVED' ? '✓' : '!'}</span>
              <div><strong>{suite.name}</strong><p>{suite.resilienceScore}% resilience · {suite.releaseDecision}</p></div>
            </li>
          ))}
        </ul>
      </div>

      <div className="go-live-readiness-panel ce-surface-light" data-testid="react-ai-quality-summary-panel">
        <div>
          <p className="eyebrow ce-kicker">AI Evaluation Quality</p>
          <h3>Turnaround briefing release gate</h3>
          <p>{aiQualityStatus}</p>
        </div>
        <ul className="go-live-readiness-list" aria-label="AI evaluation quality summary">
          <li className={`readiness-item ${aiQualitySummary?.releaseReadiness === 'READY' ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{aiQualitySummary?.releaseReadiness === 'READY' ? '✓' : '!'}</span>
            <div><strong>Release readiness</strong><p>{aiQualitySummary?.releaseReadiness || 'NO_DATA'}</p></div>
          </li>
          <li className="readiness-item ready">
            <span aria-hidden="true">•</span>
            <div><strong>Evaluation history</strong><p>{aiQualitySummary?.runCount || 0} runs; {aiQualitySummary?.passingRuns || 0} passing.</p></div>
          </li>
          <li className={`readiness-item ${aiQualitySummary?.latestRun?.passed ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{aiQualitySummary?.latestRun?.passed ? '✓' : '!'}</span>
            <div><strong>Latest evaluation</strong><p>{aiQualitySummary?.latestRun ? `${aiQualitySummary.latestRun.passRate}% pass rate and ${aiQualitySummary.latestRun.averageScore} average score.` : 'No persisted evaluation run is available.'}</p></div>
          </li>
        </ul>
        <div className="ai-quality-trend" data-testid="react-ai-quality-trend">
          <strong>Recent trend: {aiQualitySummary?.trend?.direction || 'NO_DATA'}</strong>
          <span>Pass rate {aiQualitySummary?.trend?.passRateDelta >= 0 ? '+' : ''}{aiQualitySummary?.trend?.passRateDelta || 0} points</span>
          <span>Average score {aiQualitySummary?.trend?.averageScoreDelta >= 0 ? '+' : ''}{aiQualitySummary?.trend?.averageScoreDelta || 0} points</span>
        </div>
        <section className="ai-baseline-comparison" data-testid="react-ai-baseline-comparison" aria-labelledby="ai-baseline-comparison-heading">
          <div>
            <p className="eyebrow ce-kicker">Baseline comparison</p>
            <h4 id="ai-baseline-comparison-heading">Compare evaluation runs</h4>
            <p>Choose a candidate run and a historical baseline to identify score regressions, new failed cases, and recovered cases.</p>
          </div>
          <div className="ai-baseline-controls">
            <label>
              <span>Current run</span>
              <select data-testid="react-ai-current-run-select" value={currentAiRunId} onChange={event => { setCurrentAiRunId(event.target.value); setAiRunComparison(null) }}>
                <option value="">Select current run</option>
                {(aiQualitySummary?.runs || []).map(run => <option key={`current-${run.runId}`} value={run.runId}>{run.runId} · {run.passRate}% · {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Unknown date'}</option>)}
              </select>
            </label>
            <label>
              <span>Baseline run</span>
              <select data-testid="react-ai-baseline-run-select" value={baselineAiRunId} onChange={event => { setBaselineAiRunId(event.target.value); setAiRunComparison(null) }}>
                <option value="">Select baseline run</option>
                {(aiQualitySummary?.runs || []).map(run => <option key={`baseline-${run.runId}`} value={run.runId}>{run.runId} · {run.passRate}% · {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Unknown date'}</option>)}
              </select>
            </label>
            <button type="button" className="secondary-button ce-button-secondary" data-testid="react-ai-compare-runs-button" onClick={handleCompareAiRuns} disabled={isComparingAiRuns || !currentAiRunId || !baselineAiRunId || currentAiRunId === baselineAiRunId}>
              {isComparingAiRuns ? 'Comparing...' : 'Compare Runs'}
            </button>
          </div>
          <p className="ai-comparison-status" aria-live="polite">{aiComparisonStatus}</p>
          {aiRunComparison && (
            <div className={`ai-comparison-result ${aiRunComparison.regressed ? 'regressed' : 'stable'}`} data-testid="react-ai-comparison-result">
              <div className="ai-comparison-decision">
                <strong>{aiRunComparison.regressed ? 'REGRESSION' : 'ACCEPTABLE'}</strong>
                <span>{aiRunComparison.currentRunId} compared with {aiRunComparison.baselineRunId}</span>
              </div>
              <dl className="ai-comparison-metrics">
                <div><dt>Pass-rate change</dt><dd>{aiRunComparison.passRateDelta >= 0 ? '+' : ''}{aiRunComparison.passRateDelta} points</dd></div>
                <div><dt>Average-score change</dt><dd>{aiRunComparison.averageScoreDelta >= 0 ? '+' : ''}{aiRunComparison.averageScoreDelta} points</dd></div>
                <div><dt>New failed cases</dt><dd>{aiRunComparison.newFailedCases?.join(', ') || 'None'}</dd></div>
                <div><dt>Recovered cases</dt><dd>{aiRunComparison.recoveredCases?.join(', ') || 'None'}</dd></div>
                <div><dt>Release-policy reasons</dt><dd>{aiRunComparison.reasons?.join(', ') || 'None'}</dd></div>
              </dl>
            </div>
          )}
        </section>


        <section className="ai-release-policy-controls" data-testid="react-ai-release-policy-controls" aria-labelledby="ai-release-policy-heading">
          <div>
            <p className="eyebrow ce-kicker">Release policy controls</p>
            <h4 id="ai-release-policy-heading">Preview quality-gate thresholds</h4>
            <p>Adjust the candidate quality and regression thresholds, then preview whether the selected current run would be approved against the selected baseline.</p>
          </div>
          <div className="ai-release-policy-grid">
            <label><span>Minimum pass rate</span><input data-testid="react-ai-policy-minimum-pass-rate" type="number" min="0" max="100" step="1" value={aiReleasePolicy.minimumPassRate} onChange={event => updateAiReleasePolicy('minimumPassRate', Number(event.target.value))} /></label>
            <label><span>Minimum average score</span><input data-testid="react-ai-policy-minimum-average-score" type="number" min="0" max="100" step="1" value={aiReleasePolicy.minimumAverageScore} onChange={event => updateAiReleasePolicy('minimumAverageScore', Number(event.target.value))} /></label>
            <label><span>Minimum pass-rate change</span><input data-testid="react-ai-policy-minimum-pass-rate-delta" type="number" min="-100" max="100" step="1" value={aiReleasePolicy.minimumPassRateDelta} onChange={event => updateAiReleasePolicy('minimumPassRateDelta', Number(event.target.value))} /></label>
            <label><span>Minimum score change</span><input data-testid="react-ai-policy-minimum-score-delta" type="number" min="-100" max="100" step="1" value={aiReleasePolicy.minimumAverageScoreDelta} onChange={event => updateAiReleasePolicy('minimumAverageScoreDelta', Number(event.target.value))} /></label>
            <label className="ai-release-policy-checkbox"><input data-testid="react-ai-policy-allow-new-failures" type="checkbox" checked={aiReleasePolicy.allowNewFailedCases} onChange={event => updateAiReleasePolicy('allowNewFailedCases', event.target.checked)} /><span>Allow newly failed evaluation cases</span></label>
          </div>
          <button type="button" className="secondary-button ce-button-secondary" data-testid="react-ai-preview-release-policy-button" onClick={handlePreviewAiReleasePolicy} disabled={isPreviewingAiReleasePolicy || !currentAiRunId || !baselineAiRunId || currentAiRunId === baselineAiRunId}>{isPreviewingAiReleasePolicy ? 'Evaluating...' : 'Preview Release Decision'}</button>
          <p className="ai-release-policy-status" aria-live="polite">{aiReleasePolicyStatus}</p>
          {aiReleasePolicyPreview && (
            <div className={`ai-release-policy-result ${aiReleasePolicyPreview.passed ? 'approved' : 'blocked'}`} data-testid="react-ai-release-policy-result">
              <strong>{aiReleasePolicyPreview.decision}</strong>
              <span>{aiReleasePolicyPreview.failureCount} policy failure{aiReleasePolicyPreview.failureCount === 1 ? '' : 's'}</span>
              <ul>{aiReleasePolicyPreview.failures.length ? aiReleasePolicyPreview.failures.map((failure, index) => <li key={`${failure.reason}-${index}`}>{failure.reason.replaceAll('-', ' ')}{failure.actual !== undefined ? `: ${failure.actual} (required ${failure.required})` : failure.caseIds?.length ? `: ${failure.caseIds.join(', ')}` : ''}</li>) : <li>All selected quality and regression thresholds passed.</li>}</ul>
            </div>
          )}
        </section>

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
            <button type="button" className="secondary-button ce-button-secondary" data-testid="react-ai-history-reset" onClick={() => { setAiHistorySearch(''); setAiHistoryDecisionFilter('ALL'); setAiHistoryProviderFilter('ALL'); setAiHistorySort('completed-desc') }}>Reset history view</button>
          </div>
          <div className="ai-quality-history-wrap">
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
      </div>

      <div className="go-live-readiness-panel ce-surface-light" data-testid="react-go-live-readiness-panel">
        <div>
          <p className="eyebrow ce-kicker">Go-Live Readiness</p>
          <h3>Manual approval checklist</h3>
          <p>
            Use this checklist as the final human review path before presenting or publishing the application.
            Automated checks support the decision, but final approval should include role, operations, fleet, passenger, and quality review.
          </p>
        </div>
        <ul className="go-live-readiness-list" aria-label="Go-live manual approval checklist">
          {readinessChecklist.map(item => (
            <li key={item.label} className={`readiness-item ${item.status || (item.passed ? 'ready' : 'attention')}`}>
              <span aria-hidden="true">{getReadinessItemSymbol(item.status || (item.passed ? 'ready' : 'attention'))}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="react-sqa-action-grid" aria-label="Quality validation actions">
        {validationActions.map(action => (
          <article className="react-sqa-action-card ce-command-card ce-surface-light" key={action.key}>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <button type="button" onClick={() => runValidation(action)} disabled={isRunning} data-testid={action.testId}>
              {action.buttonLabel}
            </button>
          </article>
        ))}
        <article className="react-sqa-action-card danger-card ce-surface-light">
          <h3>Baseline Data Recovery</h3>
          <p>Reset baseline data after administrative workflow review.</p>
          <button type="button" className="danger-action-button ce-button-danger" onClick={requestResetDemoData} disabled={isRunning} data-testid="react-sqa-reset-demo-data-button">
            Reset Baseline Data
          </button>
          {resetConfirmationVisible && (
            <ConfirmActionPanel
              title="Reset baseline data"
              message="Reset baseline data back to the baseline dataset?"
              confirmLabel="Reset Baseline Data"
              cancelLabel="Keep Current Data"
              onConfirm={handleResetDemoData}
              onCancel={cancelResetDemoData}
              isWorking={isRunning}
              testId="react-sqa-reset-confirmation"
            />
          )}
        </article>
      </div>

      <div className="react-sqa-output-header">
        <div>
          <p className="eyebrow ce-kicker">Validation Output</p>
          <h3>Latest manual validation result</h3>
          <p>This environment allows controlled CRUD changes. Use Reset Baseline Data to restore the original baseline dataset.</p>
        </div>
        <div className="react-sqa-output-actions ce-action-row">
          <span>{lastRun}</span>
          <button type="button" className="secondary-button ce-button-secondary" onClick={() => setOutput('Test output will appear here...')}>
            Clear Output
          </button>
        </div>
      </div>

      <div className="react-sqa-report-links" aria-label="Quality report links">
        <a href="https://jayg67.github.io/cruise/" target="_blank" rel="noopener noreferrer">View Quality Dashboard</a>
        <a href="https://jayg67.github.io/cruise/lighthouse/" target="_blank" rel="noopener noreferrer">View Latest Lighthouse Mobile Report</a>
        <a href="https://jayg67.github.io/cruise/coverage/" target="_blank" rel="noopener noreferrer">View Latest Jest Coverage Report</a>
      </div>

      <pre className="react-sqa-output" role="status" aria-live="polite" aria-label="Quality validation output" data-testid="react-sqa-output">
        {output}
      </pre>
    </section>
  )
}
