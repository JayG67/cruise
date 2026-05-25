const readinessItems = [
  'Keep the current Express/Postgres API as the stable contract.',
  'Migrate one workflow at a time behind a React development shell.',
  'Preserve Cypress, Playwright, integration, Lighthouse, and k6 gates before replacing production UI.',
  'Use component state for expanded customers, visible booking rows, details panels, and edit forms.'
]

export default function MigrationReadiness() {
  return (
    <section className="readiness-card" aria-labelledby="migration-readiness-heading">
      <p className="eyebrow">Stage 0 / 1</p>
      <h2 id="migration-readiness-heading">React migration readiness shell</h2>
      <p>
        This shell is intentionally separate from the production DOM app. It gives the project a safe
        migration branch target while the existing app and full regression suite remain untouched.
      </p>
      <ul>
        {readinessItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
