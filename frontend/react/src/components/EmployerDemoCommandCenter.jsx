function formatCount(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function getDemoRoleCount(demoUsers = []) {
  return new Set(demoUsers.map(user => user.role || user.userType || '').filter(Boolean)).size
}

function getTurnaroundPersonCount(demoUsers = []) {
  return demoUsers.filter(user => {
    const role = String(user.role || user.userType || '').toLowerCase()
    return role.includes('turnaround') || role.includes('lead') || role.includes('engineering') || role.includes('housekeeping') || role.includes('guest services') || role.includes('food')
  }).length
}

function buildDemoProofPoints({ customerCount = 0, bookingCount = 0, cruiseLineCount = 0, demoUsers = [] } = {}) {
  const roleCount = getDemoRoleCount(demoUsers)
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
      id: 'quality',
      label: 'SQA coverage',
      value: `${formatCount(cruiseLineCount)} lines`,
      detail: 'The isolated SQA console keeps validation evidence available without mixing testing controls into daily operations.'
    }
  ]
}

function buildRunOfShow() {
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
      id: 'quality',
      title: 'Quality Console',
      detail: 'Run API health, data integrity, accessibility, and browser validation checks.',
      targetSectionId: 'react-quality',
      requiredRole: 'admin',
      buttonLabel: 'Open quality'
    }
  ]
}

export default function EmployerDemoCommandCenter({
  customerCount = 0,
  bookingCount = 0,
  cruiseLineCount = 0,
  demoUsers = [],
  onOpenWorkspace
}) {
  const proofPoints = buildDemoProofPoints({ customerCount, bookingCount, cruiseLineCount, demoUsers })
  const runOfShow = buildRunOfShow()

  function openStep(step) {
    onOpenWorkspace?.(step.targetSectionId, step.title, step.requiredRole || null)
  }

  function getWorkspaceTestId(step) {
    const map = {
      presentation: 'react-workspace-presentation-button',
      roles: 'react-workspace-role-button',
      operations: 'react-workspace-operations-button',
      fleet: 'react-workspace-fleet-button',
      quality: 'react-workspace-quality-button'
    }

    return map[step.id] || `react-employer-demo-${step.id}-button`
  }

  function getEmployerDemoTestId(step) {
    const map = {
      roles: 'react-employer-demo-roles-button',
      fleet: 'react-employer-demo-fleet-button',
      quality: 'react-employer-demo-quality-button'
    }

    return map[step.id] || `react-employer-demo-${step.id}-button`
  }

  return (
    <section className="employer-demo-command-center self-guided-overview ce-command-panel" id="react-employer-demo" aria-labelledby="react-employer-demo-heading" data-testid="react-employer-demo-command-center">
      <div className="employer-demo-heading self-guided-overview-heading">
        <div>
          <p className="eyebrow ce-kicker">Operations dashboard</p>
          <h2 id="react-employer-demo-heading">Cruise operations at a glance</h2>
          <p>
            Monitor passenger booking, fleet administration, role-aware workflows, turnaround management,
            and SQA validation from one operational surface.
          </p>
        </div>
      </div>

      <div className="employer-demo-proof-grid self-guided-proof-grid" aria-label="Application proof points" data-testid="react-employer-demo-proof-grid">
        {proofPoints.map(point => (
          <article className="employer-demo-proof-card self-guided-proof-card ce-command-card" key={point.id} data-testid="react-employer-demo-proof-card">
            <span>{point.label}</span>
            <strong>{point.value}</strong>
            <p>{point.detail}</p>
          </article>
        ))}
      </div>

      <div className="self-guided-tour-runway" id="react-workspaces" aria-label="React application workspaces" data-testid="react-employer-demo-runway">
        <div className="self-guided-tour-list" data-testid="react-workspace-card-grid">
        {runOfShow.map(step => (
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
            <div data-testid="react-employer-demo-step">
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
              <span className="visually-hidden">{step.buttonLabel}</span>
            </div>
            <button type="button" className="employer-demo-step-button secondary-action-button ce-button-secondary" onClick={event => { event.stopPropagation(); openStep(step) }} data-testid={getEmployerDemoTestId(step)}>
              {step.buttonLabel}
            </button>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}

export { buildDemoProofPoints, buildRunOfShow, getDemoRoleCount, getTurnaroundPersonCount }
