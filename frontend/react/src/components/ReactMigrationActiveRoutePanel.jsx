const ACTIVE_ROUTE_COPY = {
  hierarchy: {
    eyebrow: 'Active migration workspace',
    title: 'Operations workflow is the current React focus',
    summary: 'Customer and booking hierarchy workflows are already running through the React route with role-aware visibility, inline edits, contextual deletes, and API-backed refresh behavior.',
    evidence: [
      'Customer-centered admin workflow is rendered by React instead of DOM string templates.',
      'Passenger and group-leader users see scoped booking dashboards from the same data snapshot.',
      'Contextual edit, delete, and progressive-disclosure controls stay inside React state.'
    ],
    nextStep: 'Use the Operations route to review admin behavior before marking this workflow ready for DOM cutover.'
  },
  readiness: {
    eyebrow: 'Active migration workspace',
    title: 'Role simulation is the current React focus',
    summary: 'The React app now uses the demo-user selector as the front door for Admin, Passenger, and Group Leader experiences before users reach workflow-specific panels.',
    evidence: [
      'Role changes hide admin-only workflows for passenger-facing contexts.',
      'Passenger dashboards show limited profile and booking preference controls.',
      'Group leader views expose grouped passenger visibility without admin mutation tools.'
    ],
    nextStep: 'Use the Roles route to verify that each seeded persona lands on the correct React experience.'
  }
}

export default function ReactMigrationActiveRoutePanel({ routeKey = 'hierarchy' }) {
  const copy = ACTIVE_ROUTE_COPY[routeKey] || ACTIVE_ROUTE_COPY.hierarchy

  return (
    <article className="active-route-evidence-card" data-testid="react-active-route-evidence-panel">
      <div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.summary}</p>
      </div>
      <ul className="active-route-evidence-list" aria-label={`${copy.title} evidence`} data-testid="react-active-route-evidence-list">
        {copy.evidence.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="active-route-next-step" data-testid="react-active-route-next-step">{copy.nextStep}</p>
    </article>
  )
}
