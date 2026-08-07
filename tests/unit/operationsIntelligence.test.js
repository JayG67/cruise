const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, '../../frontend/react/src/domain/operationsIntelligence.js'), 'utf8')

function loadModule() {
  const module = { exports: {} }
  const executableSource = source.replace(
    /export \{[^}]+\}\s*$/,
    'module.exports = { buildFleetIntelligence, buildOperationsIntelligence, buildPriorityActions, getOperationalRisk }'
  )
  new Function('module', 'exports', executableSource)(module, module.exports)
  return module.exports
}

describe('operations intelligence domain', () => {
  test('prioritizes blocked work, escalations, staffing gaps, signoffs, dependencies, and handoffs', () => {
    const { buildOperationsIntelligence } = loadModule()
    const model = buildOperationsIntelligence({
      id: 'operation-1',
      title: 'Miami turnaround',
      ship: { name: 'Ocean Star' },
      cruiseLine: { name: 'Example Cruises' },
      turnaroundDate: '2026-09-01',
      port: 'Miami, Florida',
      taskSummary: { totalTasks: 8, completeTasks: 3, blockedTasks: 1 },
      staffingSummary: { checkedInCount: 40, gapCount: 4 },
      escalationSummary: { openEscalations: 2, criticalEscalations: 1 },
      signoffSummary: { approvedSignoffs: 2, pendingSignoffs: 3, blockedSignoffs: 0 },
      dependencySummary: { activeDependencies: 2 },
      handoffSummary: { openHandoffs: 1 }
    })

    expect(model.risk).toBe('ATTENTION')
    expect(model.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'tasks', value: 5 }),
      expect.objectContaining({ id: 'staffing', value: 4 }),
      expect.objectContaining({ id: 'escalations', value: 2 }),
      expect.objectContaining({ id: 'signoffs', value: 3 })
    ]))
    expect(model.actions.map(action => action.id)).toEqual([
      'blocked-tasks', 'escalations', 'staffing', 'signoffs', 'dependencies', 'handoffs'
    ])
  })

  test('reports an on-track state when no operational exceptions remain', () => {
    const { buildOperationsIntelligence } = loadModule()
    const model = buildOperationsIntelligence({
      taskSummary: { totalTasks: 4, completeTasks: 4, blockedTasks: 0 },
      staffingSummary: { checkedInCount: 20, gapCount: 0 },
      escalationSummary: { openEscalations: 0, criticalEscalations: 0 },
      signoffSummary: { approvedSignoffs: 3, pendingSignoffs: 0, blockedSignoffs: 0 },
      dependencySummary: { activeDependencies: 0 },
      handoffSummary: { openHandoffs: 0 }
    })

    expect(model.risk).toBe('ON_TRACK')
    expect(model.actions).toEqual([
      expect.objectContaining({ id: 'on-track', tone: 'ready' })
    ])
  })
})
