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

function buildDemoProofPoints({ customerCount = 0, bookingCount = 0, cruiseLineCount = 0, demoUsers = [], selectedRoleView = 'admin' } = {}) {
  const roleCount = getDemoRoleCount(demoUsers)
  const turnaroundPersonCount = getTurnaroundPersonCount(demoUsers)

  return [
    {
      id: 'product-depth',
      label: 'Product depth',
      value: `${formatCount(customerCount)} customers / ${formatCount(bookingCount)} bookings`,
      detail: 'Customer, booking, passenger, fleet, sailing, itinerary, and operational workflows live in one coherent application.'
    },
    {
      id: 'role-model',
      label: 'Role model',
      value: `${formatCount(roleCount)} role perspectives`,
      detail: `Current view: ${selectedRoleView}. Demo users exercise admin, passenger, group leader, manager, and department lead journeys.`
    },
    {
      id: 'fleet-scope',
      label: 'Fleet scope',
      value: `${formatCount(cruiseLineCount)} cruise lines`,
      detail: 'Fleet CRUD connects cruise lines to ships, sailings, itineraries, and turnaround operating context.'
    },
    {
      id: 'turnaround-readiness',
      label: 'Turnaround readiness',
      value: `${formatCount(turnaroundPersonCount)} operational people`,
      detail: 'Scoped managers and leads can drive task, staffing, handoff, escalation, signoff, lifecycle, and reviewer workflows.'
    }
  ]
}

function buildRunOfShow() {
  return [
    {
      id: 'setup',
      time: '0:00-1:00',
      title: 'Show the operating model',
      detail: 'Open turnaround setup and explain scoped people, cruise-line boundaries, and admin-created operational assignments.',
      targetSectionId: 'react-turnaround-admin-setup',
      requiredRole: 'admin',
      buttonLabel: 'Open setup'
    },
    {
      id: 'roles',
      time: '1:00-2:00',
      title: 'Switch into real role views',
      detail: 'Use the role selector to show passenger, group leader, manager, and department lead perspectives without fake authorization friction.',
      targetSectionId: 'react-role-selector',
      buttonLabel: 'Open roles'
    },
    {
      id: 'operations',
      time: '2:00-3:30',
      title: 'Drive the turnaround workflow',
      detail: 'Complete tasks, clear blockers, update staffing, resolve escalations, approve signoffs, and watch lifecycle progress move.',
      targetSectionId: 'react-role-selector',
      buttonLabel: 'Start role workflow'
    },
    {
      id: 'fleet',
      time: '3:30-4:15',
      title: 'Connect operations to fleet data',
      detail: 'Open fleet management to prove the same product owns cruise lines, ships, sailings, and itineraries behind the operational dashboard.',
      targetSectionId: 'react-fleet',
      requiredRole: 'admin',
      buttonLabel: 'Open fleet'
    },
    {
      id: 'quality',
      time: '4:15-5:00',
      title: 'Close with quality engineering',
      detail: 'Open the Quality Console and explain that Jest owns services, Cypress owns workflows, Playwright owns responsive smoke, and audits gate release readiness.',
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
  selectedRoleView = 'admin',
  onOpenWorkspace
}) {
  const proofPoints = buildDemoProofPoints({ customerCount, bookingCount, cruiseLineCount, demoUsers, selectedRoleView })
  const runOfShow = buildRunOfShow()

  function openStep(step) {
    onOpenWorkspace?.(step.targetSectionId, step.title, step.requiredRole || null)
  }

  return (
    <section className="employer-demo-command-center" id="react-employer-demo" aria-labelledby="react-employer-demo-heading" data-testid="react-employer-demo-command-center">
      <div className="employer-demo-heading">
        <div>
          <p className="eyebrow">Employer presentation mode</p>
          <h2 id="react-employer-demo-heading">A five-minute path through the strongest engineering story</h2>
          <p>
            This command center gives reviewers a clean route through the application: business model, role-aware UX,
            operational lifecycle, fleet CRUD, and quality gates without hunting through every panel.
          </p>
        </div>
        <div className="employer-demo-badge" aria-label="Portfolio position">
          <strong>Portfolio-ready</strong>
          <span>Full-stack + SQA proof</span>
        </div>
      </div>

      <div className="employer-demo-proof-grid" aria-label="Employer demo proof points" data-testid="react-employer-demo-proof-grid">
        {proofPoints.map(point => (
          <article className="employer-demo-proof-card" key={point.id} data-testid="react-employer-demo-proof-card">
            <span>{point.label}</span>
            <strong>{point.value}</strong>
            <p>{point.detail}</p>
          </article>
        ))}
      </div>

      <div className="employer-demo-runway" data-testid="react-employer-demo-runway">
        <div className="employer-demo-talk-track">
          <h3>What to say while presenting</h3>
          <p>
            “This started as a cruise data application and evolved into an operations platform. The important part is not just CRUD;
            it is how the data model, role scoping, lifecycle state, and test strategy hold together as product complexity grows.”
          </p>
          <ul>
            <li>Lead with the business workflow instead of the technology stack.</li>
            <li>Show role switching as a demo affordance, then explain where real authorization would plug in.</li>
            <li>Close with the quality strategy so employers see release judgment, not only feature output.</li>
          </ul>
        </div>

        <ol className="employer-demo-step-list" aria-label="Five-minute employer demo run of show">
          {runOfShow.map(step => (
            <li className="employer-demo-step" key={step.id} data-testid="react-employer-demo-step">
              <span>{step.time}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
              <button type="button" className="employer-demo-step-button" onClick={() => openStep(step)} data-testid={`react-employer-demo-${step.id}-button`}>
                {step.buttonLabel}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export { buildDemoProofPoints, buildRunOfShow, getDemoRoleCount, getTurnaroundPersonCount }
