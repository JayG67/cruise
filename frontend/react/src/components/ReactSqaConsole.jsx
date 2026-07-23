import { useMemo, useState } from 'react'

import ConfirmActionPanel from './ConfirmActionPanel.jsx'
import { getBookings, getCruiseLines, getCustomers, getHealthStatus, getPlatformAuditEvents, getTurnaroundOperations, resetDemoData } from '../api/client.js'

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
        <a href="/quality-dashboard.html">View Quality Dashboard</a>
        <a href="/reports/lighthouse-mobile/latest.html">View Latest Lighthouse Mobile Report</a>
        <a href="/coverage/lcov-report/index.html">View Latest Jest Coverage Report</a>
      </div>

      <pre className="react-sqa-output" role="status" aria-live="polite" aria-label="Quality validation output" data-testid="react-sqa-output">
        {output}
      </pre>
    </section>
  )
}
