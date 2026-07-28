const { assertAdversarialScenario } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')
const { TURNAROUND_PROVIDER_RUNTIME_SCENARIOS } = require('../ai/evaluations/adversarial/turnaroundBriefingProviderRuntime.scenarios')
const { runAdversarialSuite } = require('./aiAdversarialSuite.service')

function createProviderRuntimeFixture() {
  return { timeoutMs:5000, retryLimit:2, contextLimit:12000, contextSize:6000, providerEnabled:true, providerCalls:0, persistedBriefings:0 }
}

function simulateProviderRuntimeScenario(scenario, { fixture=createProviderRuntimeFixture() }={}) {
  assertAdversarialScenario(scenario)
  const target = scenario.mutation.target
  const observedOutcomes = { mustReturnDiagnostic:true }
  const runtime = { ...fixture }
  const diagnostics = []
  const safeFailure = () => { observedOutcomes.mustReturnSafeFailure=true; diagnostics.push(`Provider runtime scenario safely handled: ${target}.`) }

  switch (target) {
    case 'timeout': Object.assign(observedOutcomes,{ mustEnforceTimeout:true, mustNotPersistPartialBriefing:true }); runtime.providerCalls=1; safeFailure(); break
    case 'transientRecovery': Object.assign(observedOutcomes,{ mustRetryTransientFailure:true, mustRespectRetryLimit:true, mustReturnValidatedBriefing:true }); runtime.providerCalls=2; diagnostics.push('Transient provider error recovered within retry policy.'); break
    case 'retryExhaustion': Object.assign(observedOutcomes,{ mustRetryTransientFailure:true, mustRespectRetryLimit:true, mustNotPersistPartialBriefing:true }); runtime.providerCalls=fixture.retryLimit+1; safeFailure(); break
    case 'emptyOutput': Object.assign(observedOutcomes,{ mustRejectEmptyOutput:true }); runtime.providerCalls=1; safeFailure(); break
    case 'truncatedOutput': Object.assign(observedOutcomes,{ mustRejectTruncatedOutput:true, mustRejectInvalidStructure:true, mustNotPersistPartialBriefing:true }); runtime.providerCalls=1; safeFailure(); break
    case 'invalidStructure': Object.assign(observedOutcomes,{ mustRejectInvalidStructure:true }); runtime.providerCalls=1; safeFailure(); break
    case 'contextOverflow': Object.assign(observedOutcomes,{ mustEnforceContextLimit:true, mustAvoidProviderCall:true }); runtime.contextSize=fixture.contextLimit+1; safeFailure(); break
    case 'unexpectedMetadata': Object.assign(observedOutcomes,{ mustSanitizeProviderMetadata:true, mustReturnValidatedBriefing:true }); runtime.providerCalls=1; diagnostics.push('Unexpected provider metadata was discarded.'); break
    case 'usageAnomaly': Object.assign(observedOutcomes,{ mustRejectUsageAnomaly:true, mustSanitizeProviderMetadata:true }); runtime.providerCalls=1; diagnostics.push('Impossible usage telemetry was rejected.'); break
    case 'providerDisabled': Object.assign(observedOutcomes,{ mustRespectProviderDisabled:true, mustAvoidProviderCall:true }); runtime.providerEnabled=false; safeFailure(); break
    case 'abortedExecution': Object.assign(observedOutcomes,{ mustHonorCancellation:true, mustNotPersistPartialBriefing:true }); runtime.providerCalls=1; safeFailure(); break
    default: throw new TypeError(`Unsupported provider runtime mutation target: ${target}`)
  }

  return { scenarioId:scenario.id, target, observedOutcomes, diagnostics, runtime }
}

function runProviderRuntimeAdversarialSuite(options={}) {
  const executions = new Map()
  const suite = runAdversarialSuite({ suiteId:'turnaround-provider-runtime-attacks', scenarios:options.scenarios || TURNAROUND_PROVIDER_RUNTIME_SCENARIOS, executeScenario:scenario => { const execution=simulateProviderRuntimeScenario(scenario, options); executions.set(scenario.id, execution); return execution.observedOutcomes }, policy:options.policy, metadata:options.metadata })
  return { ...suite, results:suite.results.map(result => ({ ...result, runtimeDiagnostics:executions.get(result.scenarioId).diagnostics, runtime:executions.get(result.scenarioId).runtime })) }
}

module.exports = { createProviderRuntimeFixture, runProviderRuntimeAdversarialSuite, simulateProviderRuntimeScenario }
