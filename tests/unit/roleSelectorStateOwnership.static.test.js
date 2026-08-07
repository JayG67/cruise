const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('role selector state ownership', () => {
  test('keeps filter state and option derivation outside the rendering component', () => {
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')
    const stateHook = read('frontend/react/src/components/useRoleSelectorState.js')

    expect(selector).toContain("import useRoleSelectorState from './useRoleSelectorState.js'")
    expect(selector).toContain('} = useRoleSelectorState({')
    expect(selector).not.toContain('useState(')
    expect(selector).not.toContain('useEffect(')
    expect(selector).not.toContain('useMemo(')
    expect(selector).not.toContain('buildPassengerOption(')
    expect(selector).not.toContain('getOperationalFilterOptions(')

    expect(stateHook).toContain('const [passengerSearch, setPassengerSearch] = useState')
    expect(stateHook).toContain('const [operationalCruiseLineFilter, setOperationalCruiseLineFilter] = useState')
    expect(stateHook).toContain('buildPassengerOption(user, bookings)')
    expect(stateHook).toContain("getOperationalFilterOptions(operationalSourceOptions, 'cruiseLineName')")
    expect(stateHook).toContain('personOptionCards.slice(0, 16)')
    expect(stateHook).toContain('onSelectDemoUser?.(personOptionCards[0].user.id)')
  })
  test('uses the wide administrator rail with a compact desktop role and person composition', () => {
    const selector = read('frontend/react/src/components/ReactRoleSelector.jsx')
    const layout = read('frontend/react/src/styles/components/role-selector-layouts.css')

    expect(selector).toContain('role-selector-grid--compact-generic')
    expect(selector).toContain('role-summary-identity')
    expect(selector).toContain('role-summary-metrics')
    expect(layout).toContain('@media (min-width: 1100px)')
    expect(layout).toContain('grid-template-columns: 1fr;')
    expect(layout).toContain('grid-template-columns: auto minmax(18rem, 30rem) minmax(0, 1fr);')
    expect(layout).toContain('color: var(--ce-command-text) !important;')
    expect(layout).toContain('"selected results"')
    expect(layout).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
  })

})
