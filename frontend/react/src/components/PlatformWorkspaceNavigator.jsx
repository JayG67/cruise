function formatCount(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function getRoleCount(demoUsers = []) {
  return new Set(demoUsers.map(user => user.role || user.userType || '').filter(Boolean)).size
}

function getTurnaroundPersonCount(demoUsers = []) {
  return demoUsers.filter(user => {
    const role = String(user.role || user.userType || '').toLowerCase()
    return role.includes('turnaround') || role.includes('lead') || role.includes('engineering') || role.includes('housekeeping') || role.includes('guest services') || role.includes('food')
  }).length
}

function buildPlatformMetrics({ customerCount = 0, bookingCount = 0, cruiseLineCount = 0, demoUsers = [] } = {}) {
  const roleCount = getRoleCount(demoUsers)
  const turnaroundPersonCount = getTurnaroundPersonCount(demoUsers)

  return [
    {
      id: 'business',
      label: 'Operational scope',
      value: `${formatCount(customerCount)} customers`,
      detail: `${formatCount(bookingCount)} bookings plus fleet, passenger, and itinerary workflows.`
    },
    {
      id: 'roles',
      label: 'Role model',
      value: `${formatCount(roleCount)} views`,
      detail: 'Admin, passenger, group leader, manager, and department leads see different work.'
    },
    {
      id: 'turnaround',
      label: 'Turnaround depth',
      value: `${formatCount(turnaroundPersonCount)} operators`,
      detail: 'Command, lifecycle, closeout, continuity, staffing, blockers, and signoff evidence.'
    },
    {
      id: 'intelligence',
      label: 'Operations intelligence',
      value: `${formatCount(cruiseLineCount)} lines`,
      detail: 'Turnaround risks, staffing gaps, escalations, and readiness actions are visible from one operational view.'
    }
  ]
}

function buildWorkspaceLinks() {
  return [
    {
      id: 'presentation',
      title: 'Cruise line operations',
      detail: 'Open the line operations workspace for brand, fleet, sailing, guest, and turnaround context.',
      targetSectionId: 'react-cruise-line-presentation',
      requiredRole: 'admin',
      buttonLabel: 'Open line ops'
    },
    {
      id: 'roles',
      title: 'Role-aware Views',
      detail: 'Switch between admin, passenger, group leader, and operational lead views.',
      targetSectionId: 'react-role-selector',
      buttonLabel: 'Open roles'
    },
    {
      id: 'operations',
      title: 'Admin Operations',
      detail: 'Search and manage customer and booking datasets.',
      targetSectionId: 'react-hierarchy',
      requiredRole: 'admin',
      buttonLabel: 'Open operations'
    },
    {
      id: 'fleet',
      title: 'Fleet Directory',
      detail: 'Search cruise lines, manage fleets, ships, and sailings.',
      targetSectionId: 'react-fleet',
      requiredRole: 'admin',
      buttonLabel: 'Open fleet'
    },
    {
      id: 'intelligence',
      title: 'Operations Intelligence',
      detail: 'Review turnaround risks, staffing gaps, escalations, dependencies, handoffs, and readiness actions.',
      targetSectionId: 'react-operations-intelligence',
      requiredRole: 'admin',
      buttonLabel: 'Open intelligence'
    }
  ]
}

export default function PlatformWorkspaceNavigator({
  customerCount = 0,
  bookingCount = 0,
  cruiseLineCount = 0,
  demoUsers = [],
  onOpenWorkspace
}) {
  const platformMetrics = buildPlatformMetrics({ customerCount, bookingCount, cruiseLineCount, demoUsers })
  const workspaceLinks = buildWorkspaceLinks()

  function openStep(step) {
    onOpenWorkspace?.(step.targetSectionId, step.title, step.requiredRole || null)
  }

  function getWorkspaceTestId(step) {
    const map = {
      presentation: 'react-workspace-presentation-button',
      roles: 'react-workspace-role-button',
      operations: 'react-workspace-operations-button',
      fleet: 'react-workspace-fleet-button',
      intelligence: 'react-workspace-intelligence-button'
    }

    return map[step.id] || `react-platform-overview-${step.id}-button`
  }

  function getWorkspaceActionTestId(step) {
    const map = {
      roles: 'react-platform-overview-roles-button',
      fleet: 'react-platform-overview-fleet-button',
      intelligence: 'react-platform-overview-intelligence-button'
    }

    return map[step.id] || `react-platform-overview-${step.id}-button`
  }

  return (
    <section className="platform-workspace-navigator self-guided-overview ce-command-panel" id="react-platform-overview" aria-labelledby="react-platform-overview-heading" data-testid="react-platform-overview-command-center">
      <div className="platform-workspace-heading self-guided-overview-heading">
        <div>
          <p className="eyebrow ce-kicker">Platform workspaces</p>
          <h2 id="react-platform-overview-heading">Operational workspaces and platform capabilities</h2>
          <p>
            Open the workspace needed to manage cruise lines, fleets, guests, bookings, turnaround execution, and operational risk.
          </p>
        </div>
      </div>

      <div className="platform-workspace-proof-grid self-guided-proof-grid" aria-label="Platform operating metrics" data-testid="react-platform-overview-proof-grid">
        {platformMetrics.map(point => (
          <article className="platform-workspace-proof-card self-guided-proof-card ce-command-card" key={point.id} data-testid={`react-platform-overview-metric-${point.id}`}>
            <span>{point.label}</span>
            <strong>{point.value}</strong>
            <p>{point.detail}</p>
          </article>
        ))}
      </div>

      <div className="self-guided-tour-runway" id="react-workspaces" aria-label="React application workspaces" data-testid="react-platform-overview-runway">
        <div className="self-guided-tour-list" data-testid="react-workspace-card-grid">
        {workspaceLinks.map(step => (
          <article
            className="self-guided-tour-card react-workspace-card ce-command-card"
            key={step.id}
            onClick={() => openStep(step)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openStep(step)
              }
            }}
            role="button"
            tabIndex={0}
            data-testid={getWorkspaceTestId(step)}
          >
            <div data-testid="react-platform-overview-step">
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
              <span className="visually-hidden">{step.buttonLabel}</span>
            </div>
            <button type="button" className="platform-workspace-step-button secondary-action-button ce-button-secondary" onClick={event => { event.stopPropagation(); openStep(step) }} data-testid={getWorkspaceActionTestId(step)}>
              {step.buttonLabel}
            </button>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}

export { buildPlatformMetrics, buildWorkspaceLinks, getRoleCount, getTurnaroundPersonCount }
