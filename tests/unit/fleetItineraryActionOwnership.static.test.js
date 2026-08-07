const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('Fleet itinerary action ownership', () => {
  it('centralizes the shared mutation lifecycle while preserving explicit itinerary commands', () => {
    const actions = read('frontend/react/src/components/fleet/useFleetItineraryActions.js')
    const lifecycle = read('frontend/react/src/components/fleet/fleetItineraryActionLifecycle.js')

    expect(actions).toContain("import { createFleetItineraryActionLifecycle } from './fleetItineraryActionLifecycle.js'")
    expect(actions).toContain('const runItineraryAction = createFleetItineraryActionLifecycle({')
    expect(actions).toContain('execute: () => createItineraryDay(')
    expect(actions).toContain('execute: () => updateItineraryDay(')
    expect(actions).toContain('execute: () => deleteItineraryDay(')
    expect(actions).toContain('execute: () => createItineraryActivity(')
    expect(actions).toContain('execute: () => updateItineraryActivity(')
    expect(actions).toContain('execute: () => deleteItineraryActivity(')
    expect(actions).not.toContain('React itinerary')
    expect((actions.match(/finally \{/g) || [])).toHaveLength(1)

    expect(lifecycle).toContain('export function createFleetItineraryActionLifecycle')
    expect(lifecycle).toContain('await execute()')
    expect(lifecycle).toContain('await reloadItinerary()')
    expect(lifecycle).toContain('afterSuccess?.()')
    expect(lifecycle).toContain('setActionMessage(error.message || errorMessage)')
    expect(lifecycle).toContain("setActionId('')")
  })
})
