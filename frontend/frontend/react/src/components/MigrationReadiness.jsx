export default function MigrationReadiness() {
  const readinessItems = [
    'Existing Express/Postgres API remains the source of truth.',
    'Production DOM app stays intact while React workflows mature behind a separate Vite shell.',
    'Customer and booking hierarchy state is being migrated first because it has the highest UI-state complexity.',
    'Cypress, Playwright, Jest, and integration coverage continue to protect the working application.'
  ]

  return (
    <section className="readiness-card" aria-labelledby="migration-readiness-heading">
      <p className="eyebrow">Migration guardrails</p>
      <h2 id="migration-readiness-heading">React migration readiness</h2>
      <ul>
        {readinessItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
