export default function MigrationReadiness() {
  return (
    <section className="readiness-card" aria-labelledby="migration-readiness-heading">
      <p className="eyebrow">Migration readiness</p>
      <h2 id="migration-readiness-heading">Why this slice moves first</h2>
      <ul>
        <li>The production DOM app stays untouched while React matures behind guardrails.</li>
        <li>The customer → booking hierarchy exercises real state, filtering, and expansion behavior.</li>
        <li>The React preview consumes the same API contract validated by integration and browser tests.</li>
        <li>Each migration stage adds explicit audit coverage before any production cutover.</li>
      </ul>
    </section>
  )
}
