const db = require('../db')
const { bootstrapProductionDemoData } = require('../services/productionDemoBootstrap.service')

async function main() {
  const confirmed = process.argv.includes('--demo-if-empty')
  const result = await bootstrapProductionDemoData({ confirmed })

  if (result.seeded) {
    console.log(result.reason === 'incomplete-demo-repair'
      ? 'Render demo bootstrap repaired an incomplete canonical portfolio dataset.'
      : 'Render demo bootstrap completed for an empty database.')
    console.log(JSON.stringify({ state: result.state, ...result.counts }, null, 2))
    return
  }

  console.log(`Render demo bootstrap skipped because the portfolio content anchors are already populated (state: ${result.state}).`)
}

main()
  .catch(error => {
    console.error('Render demo bootstrap failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.closePool()
  })
