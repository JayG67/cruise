const { assessAiFoundationReadiness } = require('../services/aiFoundationReadiness.service')

const readiness = assessAiFoundationReadiness()
console.log(JSON.stringify(readiness, null, 2))

if (!readiness.deploymentSafe) process.exitCode = 1
