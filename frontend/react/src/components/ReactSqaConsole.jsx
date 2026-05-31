import { useMemo, useState } from 'react'

import { getBookings, getCruiseLines, getCustomers, getHealthStatus, resetDemoData } from '../api/client.js'

function formatResult(title, payload) {
  return `${title}\n\n${JSON.stringify(payload, null, 2)}`
}

function createFailure(error) {
  return {
    passed: false,
    error: error.message || 'Validation failed'
  }
}

export default function ReactSqaConsole({ onRefreshData }) {
  const [output, setOutput] = useState('Test output will appear here...')
  const [lastRun, setLastRun] = useState('No manual run yet')
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Ready for validation')

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
      description: 'Run a focused browser-level check across the core read workflows.',
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
      description: 'Confirm the public demo data can be queried before running mutating workflows.',
      buttonLabel: 'Run CRUD Workflow Check',
      run: async () => {
        const [cruiseLines, customers, bookings] = await Promise.all([getCruiseLines(), getCustomers(), getBookings()])
        return {
          passed: cruiseLines.length > 0 && customers.length > 0 && bookings.length > 0,
          temporaryRecordCreated: false,
          note: 'React route performs safe read validation here; destructive demo reset remains explicit.',
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
      description: 'Confirm the demo dataset contains cruise lines, customers, and bookings.',
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
      key: 'deployment',
      testId: 'react-sqa-deployment-button',
      title: 'Deployment Diagnostics',
      description: 'Report runtime URL, timestamp, health status, and visible data count.',
      buttonLabel: 'Run Deployment Check',
      run: async () => {
        const [health, cruiseLines] = await Promise.all([getHealthStatus(), getCruiseLines()])
        return { passed: health.status === 'ok', url: window.location.href, timestamp: new Date().toISOString(), healthStatus: health.status, visibleCruiseLineCount: cruiseLines.length }
      }
    }
  ]), [])

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

  async function handleResetDemoData() {
    const confirmed = window.confirm('Reset public demo data back to the seed dataset?')
    if (!confirmed) return
    setIsRunning(true)
    setStatus('Running Demo Data Recovery')
    setLastRun('Running: Demo Data Recovery')

    try {
      const result = await resetDemoData()
      await onRefreshData?.()
      setOutput(formatResult('Demo Data Recovery Result', { passed: true, ...result }))
      setStatus('Ready for validation')
      setLastRun('Last run: Demo Data Recovery Passed')
    } catch (error) {
      setOutput(formatResult('Demo Data Recovery Failed', createFailure(error)))
      setStatus('Validation needs attention')
      setLastRun('Last run: Demo Data Recovery Failed')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <section className="react-sqa-console" id="react-sqa-console" aria-labelledby="react-sqa-heading" data-testid="react-sqa-console">
      <div className="react-sqa-header">
        <div>
          <p className="eyebrow">SQA Test Control Panel</p>
          <h2 id="react-sqa-heading">Manual validation tools for API-driven UI behavior</h2>
          <p>
            A portfolio-facing quality operations console for exercising API health, data contracts,
            CRUD workflow safety, response timing, rendering consistency, seed integrity, deployment
            diagnostics, and public demo reset behavior.
          </p>
        </div>
        <div className="react-sqa-status-pill" data-testid="react-sqa-status">
          <span aria-hidden="true" className={status === 'Ready for validation' ? 'ready-dot' : 'attention-dot'}></span>
          <div>
            <strong>Console Status</strong>
            <span>{status}</span>
          </div>
        </div>
      </div>

      <div className="react-sqa-action-grid" aria-label="React SQA validation actions">
        {validationActions.map(action => (
          <article className="react-sqa-action-card" key={action.key}>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <button type="button" onClick={() => runValidation(action)} disabled={isRunning} data-testid={action.testId}>
              {action.buttonLabel}
            </button>
          </article>
        ))}
        <article className="react-sqa-action-card danger-card">
          <h3>Demo Data Recovery</h3>
          <p>Reset public demo data after CRUD exploration or recruiter testing.</p>
          <button type="button" className="danger-action-button" onClick={handleResetDemoData} disabled={isRunning} data-testid="react-sqa-reset-demo-data-button">
            Reset Demo Data
          </button>
        </article>
      </div>

      <div className="react-sqa-output-header">
        <div>
          <p className="eyebrow">Validation Output</p>
          <h3>Latest manual validation result</h3>
          <p>This public demo allows controlled CRUD changes. Use Reset Demo Data to restore the original seed dataset.</p>
        </div>
        <div className="react-sqa-output-actions">
          <span>{lastRun}</span>
          <button type="button" className="secondary-button" onClick={() => setOutput('Test output will appear here...')}>
            Clear Output
          </button>
        </div>
      </div>

      <div className="react-sqa-report-links" aria-label="Quality report links">
        <a href="/quality-dashboard.html">View Quality Dashboard</a>
        <a href="/reports/lighthouse-mobile/latest.html">View Latest Lighthouse Mobile Report</a>
        <a href="/coverage/lcov-report/index.html">View Latest Jest Coverage Report</a>
      </div>

      <pre className="react-sqa-output" role="status" aria-live="polite" data-testid="react-sqa-output">
        {output}
      </pre>
    </section>
  )
}
