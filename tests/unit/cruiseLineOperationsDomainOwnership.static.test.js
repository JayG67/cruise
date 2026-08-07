const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('cruise-line operations domain ownership', () => {
  test('keeps the public domain facade stable while separating data normalization from commercial planning', () => {
    const facade = read('frontend/react/src/domain/cruiseLineOperations.js')
    const operationsData = read('frontend/react/src/domain/cruiseLineOperationsData.js')
    const commercialOperations = read('frontend/react/src/domain/cruiseLineCommercialOperations.js')
    const component = read('frontend/react/src/components/ReactCruiseLineOperationsWorkspace.jsx')

    expect(component).toContain("from '../domain/cruiseLineOperations.js'")
    expect(facade).toContain("from './cruiseLineOperationsData.js'")
    expect(facade).toContain("from './cruiseLineCommercialOperations.js'")
    expect(facade).toContain('buildSailingRevenueBoard')
    expect(facade).toContain('buildPortOperationsPlan')

    expect(operationsData).toContain('function buildBookingDerivedShips')
    expect(operationsData).toContain('function buildFallbackItinerary')
    expect(operationsData).toContain('function buildLineMetrics')
    expect(operationsData).not.toContain('function buildSailingRevenueBoard')
    expect(operationsData).not.toContain('function buildPortOperationsPlan')

    expect(commercialOperations).toContain("from './cruiseLineOperationsData.js'")
    expect(commercialOperations).toContain('function buildRevenueMix')
    expect(commercialOperations).toContain('function buildSailingRevenueBoard')
    expect(commercialOperations).toContain('function buildPortOperationsPlan')
    expect(commercialOperations).not.toContain('function buildBookingDerivedShips')
  })
})
