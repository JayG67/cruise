const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const requiredFiles = [
  'frontend/react/index.html',
  'frontend/react/vite.config.js',
  'frontend/react/src/main.jsx',
  'frontend/react/src/App.jsx',
  'frontend/react/src/api/client.js',
  'frontend/react/src/components/CustomerBookingHierarchy.jsx',
  'frontend/react/src/components/MigrationReadiness.jsx',
  'frontend/react/src/styles/app.css',
  'docs/react-migration-plan.md',
  'docs/branching-strategy.md'
]

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(projectRoot, file)))

if (missingFiles.length > 0) {
  console.error(`Missing React migration scaffold files:
${missingFiles.join('\n')}`)
  process.exit(1)
}

console.log('React migration scaffold verified.')
