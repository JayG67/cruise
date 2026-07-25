function loadServiceWithFakeDb(initial = {}) {
  jest.resetModules()

  const cruiseLineTable = {
    __table: 'cruiseLines',
    id: { key: 'id' }
  }
  const shipTable = {
    __table: 'ships',
    id: { key: 'id' },
    cruiseLineId: { key: 'cruiseLineId' }
  }
  const sailingTable = {
    __table: 'sailings',
    id: { key: 'id' },
    shipId: { key: 'shipId' }
  }
  const demoUserTable = {
    __table: 'demoUsers',
    id: { key: 'id' },
    displayName: { key: 'displayName' }
  }
  const appRoleTable = {
    __table: 'appRoles',
    id: { key: 'id' }
  }

  const state = {
    cruiseLines: initial.cruiseLines || [
      { id: 'cl-royal', name: 'Royal Caribbean International' },
      { id: 'cl-carnival', name: 'Carnival Cruise Line' }
    ],
    ships: initial.ships || [
      { id: 'ship-freedom', cruiseLineId: 'cl-royal', name: 'Freedom of the Seas' },
      { id: 'ship-wonder', cruiseLineId: 'cl-royal', name: 'Wonder of the Seas' },
      { id: 'ship-carnival', cruiseLineId: 'cl-carnival', name: 'Carnival Adventure' }
    ],
    sailings: initial.sailings || [
      { id: 'sailing-freedom', shipId: 'ship-freedom', departureDate: '2026-08-05' },
      { id: 'sailing-wonder-same-day', shipId: 'ship-wonder', departureDate: '2026-08-05' },
      { id: 'sailing-wonder-next-day', shipId: 'ship-wonder', departureDate: '2026-08-06' },
      { id: 'sailing-carnival', shipId: 'ship-carnival', departureDate: '2026-08-05' }
    ],
    appRoles: initial.appRoles || [
      { id: 'turnaround-manager', displayName: 'Turnaround Manager', roleType: 'OPERATIONS' },
      { id: 'security-lead', displayName: 'Security Lead', roleType: 'OPERATIONS' }
    ],
    demoUsers: initial.demoUsers || [
      {
        id: 'manager-1',
        displayName: 'Alex Turner',
        role: 'TURNAROUND_MANAGER',
        cruiseLineId: 'cl-royal',
        assignedShipId: 'ship-freedom',
        assignedSailingId: 'sailing-freedom',
        cruiseLineName: 'Royal Caribbean International',
        assignedShipName: 'Freedom of the Seas'
      },
      {
        id: 'passenger-1',
        displayName: 'Passenger Person',
        role: 'PASSENGER',
        cruiseLineId: null,
        assignedShipId: null
      }
    ]
  }

  const tableData = table => state[table.__table]
  const applyCondition = (rows, condition) => {
    if (!condition || !condition.type) return [...rows]
    if (condition.type === 'eq') return rows.filter(row => row[condition.key] === condition.value)
    if (condition.type === 'ne') return rows.filter(row => row[condition.key] !== condition.value)
    return [...rows]
  }

  const makeSelectChain = table => {
    const chain = {
      condition: null,
      where(condition) {
        this.condition = condition
        return this
      },
      limit(limitValue) {
        const rows = applyCondition(tableData(table), this.condition).slice(0, limitValue)
        return Promise.resolve(rows)
      },
      then(resolve, reject) {
        return Promise.resolve(applyCondition(tableData(table), this.condition)).then(resolve, reject)
      },
      catch(reject) {
        return Promise.resolve(applyCondition(tableData(table), this.condition)).catch(reject)
      }
    }
    return chain
  }

  const fakeDb = {
    select: jest.fn(() => ({
      from: jest.fn(table => makeSelectChain(table))
    })),
    insert: jest.fn(table => ({
      values: jest.fn(record => {
        const insertRecord = () => {
          const rows = tableData(table)
          const existing = rows.find(row => row.id === record.id)
          if (existing) return existing
          const inserted = { ...record }
          rows.push(inserted)
          return inserted
        }
        return {
          onConflictDoNothing: jest.fn(() => Promise.resolve(insertRecord())),
          returning: jest.fn(() => Promise.resolve([insertRecord()]))
        }
      })
    })),
    update: jest.fn(table => ({
      set: jest.fn(patch => ({
        where: jest.fn(condition => ({
          returning: jest.fn(() => {
            const rows = tableData(table)
            const index = rows.findIndex(row => row[condition.key] === condition.value)
            if (index === -1) return Promise.resolve([])
            rows[index] = { ...rows[index], ...patch }
            return Promise.resolve([rows[index]])
          })
        }))
      }))
    }))
  }

  jest.doMock('drizzle-orm', () => ({
    and: jest.fn((...conditions) => ({ type: 'and', conditions })),
    eq: jest.fn((column, value) => ({ type: 'eq', key: column.key, value })),
    ne: jest.fn((column, value) => ({ type: 'ne', key: column.key, value }))
  }))
  jest.doMock('../../db', () => fakeDb)
  jest.doMock('../../models/cruiseline.model', () => cruiseLineTable)
  jest.doMock('../../models/ship.model', () => shipTable)
  jest.doMock('../../models/sailing.model', () => sailingTable)
  jest.doMock('../../models/demoUser.model', () => demoUserTable)
  jest.doMock('../../models/appRole.model', () => appRoleTable)

  const service = require('../../services/turnaroundAdminSetup.service')
  return { service, state, fakeDb }
}

describe('turnaround admin setup service behavior', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('normalizes every supported operational role, including security and port operations', () => {
    const { service } = loadServiceWithFakeDb()

    expect(service.normalizeOperationalRole('SECURITY_LEAD')).toBe('security-lead')
    expect(service.normalizeOperationalRole('Port Operations Lead')).toBe('port operations lead')
    expect(service.isTurnaroundOperationalRole('security_lead')).toBe(true)
    expect(service.isTurnaroundOperationalRole('PORT-OPERATIONS-LEAD')).toBe(true)
    expect(service.isTurnaroundOperationalRole('passenger')).toBe(false)
    expect(service.TURNAROUND_OPERATIONAL_ROLES).toEqual(expect.arrayContaining([
      'security-lead',
      'port-operations-lead'
    ]))
  })

  it('builds a normalized setup summary with only turnaround people and setup reference data', async () => {
    const { service } = loadServiceWithFakeDb()

    const summary = await service.buildTurnaroundSetupSummary()

    expect(summary.turnaroundPeople).toHaveLength(1)
    expect(summary.turnaroundPeople[0]).toMatchObject({
      displayName: 'Alex Turner',
      role: 'turnaround-manager',
      roleView: 'turnaround-manager'
    })
    expect(summary.cruiseLines).toHaveLength(2)
    expect(summary.ships).toHaveLength(2)
    expect(summary.sailings).toHaveLength(2)
    expect(summary.supportedRoles).toContain('security-lead')
  })

  it('creates a ship-scoped security lead with demo-user role, cruise-line name, and ship name', async () => {
    const { service, state } = loadServiceWithFakeDb()

    const created = await service.createTurnaroundPerson({
      displayName: 'Jordan Miles',
      role: 'security-lead',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-freedom',
      sailingId: 'sailing-freedom'
    })

    expect(created).toMatchObject({
      displayName: 'Jordan Miles',
      role: 'SECURITY_LEAD',
      normalizedRoleId: 'security-lead',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-freedom',
      assignedSailingId: 'sailing-freedom',
      cruiseLineName: 'Royal Caribbean International',
      assignedShipName: 'Freedom of the Seas'
    })
    expect(state.demoUsers).toContainEqual(created)
  })

  it('creates a missing normalized app role before inserting a turnaround person', async () => {
    const { service, state } = loadServiceWithFakeDb({
      appRoles: [
        { id: 'turnaround-manager', displayName: 'Turnaround Manager', roleType: 'OPERATIONS' }
      ]
    })

    const created = await service.createTurnaroundPerson({
      displayName: 'Test Person',
      role: 'port-operations-lead',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-freedom',
      sailingId: 'sailing-freedom'
    })

    expect(state.appRoles).toContainEqual({
      id: 'port-operations-lead',
      displayName: 'Port Operations Lead',
      roleType: 'OPERATIONS',
      description: 'Turnaround operational role used by admin team assignments'
    })
    expect(created).toMatchObject({
      displayName: 'Test Person',
      role: 'PORT_OPERATIONS_LEAD',
      normalizedRoleId: 'port-operations-lead'
    })
  })

  it('creates a port-pool assignment when no ship is selected', async () => {
    const { service } = loadServiceWithFakeDb()

    const created = await service.createTurnaroundPerson({
      displayName: 'Port Pool Lead',
      role: 'port-operations-lead',
      cruiseLineId: 'cl-royal'
    })

    expect(created).toMatchObject({
      role: 'PORT_OPERATIONS_LEAD',
      assignedShipId: null,
      assignedShipName: null,
      cruiseLineName: 'Royal Caribbean International'
    })
  })

  it('rejects incomplete or invalid create requests before inserting records', async () => {
    const { service, fakeDb } = loadServiceWithFakeDb()

    await expect(service.createTurnaroundPerson({ role: 'security-lead', cruiseLineId: 'cl-royal' }))
      .rejects.toMatchObject({ message: 'Turnaround person display name is required.', statusCode: 400 })
    await expect(service.createTurnaroundPerson({ displayName: 'Bad Role', role: 'passenger', cruiseLineId: 'cl-royal' }))
      .rejects.toMatchObject({ message: 'A supported turnaround operational role is required.', statusCode: 400 })
    await expect(service.createTurnaroundPerson({ displayName: 'Missing Cruise', role: 'security-lead', cruiseLineId: 'missing' }))
      .rejects.toMatchObject({ message: 'A valid cruise line is required for turnaround personnel.', statusCode: 400 })
    await expect(service.createTurnaroundPerson({ displayName: 'Wrong Ship', role: 'security-lead', cruiseLineId: 'cl-royal', assignedShipId: 'ship-carnival' }))
      .rejects.toMatchObject({ message: 'Turnaround personnel can only be assigned to ships within their cruise line.', statusCode: 400 })
    await expect(service.createTurnaroundPerson({ displayName: 'Sailing Without Ship', role: 'security-lead', cruiseLineId: 'cl-royal', sailingId: 'sailing-freedom' }))
      .rejects.toMatchObject({ message: 'Select a ship before assigning a turnaround sailing.', statusCode: 400 })
    await expect(service.createTurnaroundPerson({ displayName: 'Wrong Sailing', role: 'security-lead', cruiseLineId: 'cl-royal', assignedShipId: 'ship-freedom', sailingId: 'sailing-carnival' }))
      .rejects.toMatchObject({ message: 'Turnaround assignment sailing must belong to the selected ship.', statusCode: 400 })
    expect(fakeDb.insert).not.toHaveBeenCalled()
  })

  it('prevents one operational person from being assigned across multiple cruise lines', async () => {
    const { service } = loadServiceWithFakeDb()

    await expect(service.createTurnaroundPerson({
      displayName: 'Alex Turner',
      role: 'turnaround-manager',
      cruiseLineId: 'cl-carnival',
      assignedShipId: 'ship-carnival'
    })).rejects.toMatchObject({
      message: 'Turnaround personnel can belong to exactly one cruise line. This person already has a different cruise line assignment.',
      statusCode: 400
    })
  })



  it('prevents duplicate rows for the same person on the same turnaround sailing', async () => {
    const { service } = loadServiceWithFakeDb()

    await expect(service.createTurnaroundPerson({
      displayName: 'Alex Turner',
      role: 'turnaround-manager',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-freedom',
      sailingId: 'sailing-freedom'
    })).rejects.toMatchObject({
      message: 'This turnaround person is already assigned to the selected sailing.',
      statusCode: 400
    })
  })

  it('prevents one turnaround person from covering two sailings on the same day', async () => {
    const { service } = loadServiceWithFakeDb()

    await expect(service.createTurnaroundPerson({
      displayName: 'Alex Turner',
      role: 'turnaround-manager',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-wonder',
      sailingId: 'sailing-wonder-same-day'
    })).rejects.toMatchObject({
      message: 'Turnaround personnel cannot be assigned to more than one turnaround sailing on the same date.',
      statusCode: 400
    })
  })


  it('treats ship-suffixed display names as the same operational person for same-day conflicts', async () => {
    const { service } = loadServiceWithFakeDb({
      demoUsers: [
        {
          id: 'alex-freedom-suffix',
          displayName: 'Alex Turner — Freedom of the Seas',
          role: 'TURNAROUND_MANAGER',
          cruiseLineId: 'cl-royal',
          assignedShipId: 'ship-freedom',
          assignedSailingId: 'sailing-freedom'
        }
      ]
    })

    await expect(service.createTurnaroundPerson({
      displayName: 'Alex Turner — Wonder of the Seas',
      role: 'turnaround-manager',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-wonder',
      sailingId: 'sailing-wonder-same-day'
    })).rejects.toMatchObject({
      message: 'Turnaround personnel cannot be assigned to more than one turnaround sailing on the same date.',
      statusCode: 400
    })
  })

  it('allows the same turnaround person to be scheduled for a different day inside the same cruise line', async () => {
    const { service } = loadServiceWithFakeDb()

    const created = await service.createTurnaroundPerson({
      displayName: 'Alex Turner',
      role: 'turnaround-manager',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-wonder',
      sailingId: 'sailing-wonder-next-day'
    })

    expect(created).toMatchObject({
      displayName: 'Alex Turner',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-wonder',
      assignedSailingId: 'sailing-wonder-next-day'
    })
  })

  it('updates a turnaround person while preserving single-cruise-line and ship guardrails', async () => {
    const { service, state } = loadServiceWithFakeDb()

    const updated = await service.updateTurnaroundPerson('manager-1', {
      displayName: 'Alex Turner',
      role: 'engineering-lead',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-freedom',
      sailingId: 'sailing-freedom'
    })

    expect(updated).toMatchObject({
      id: 'manager-1',
      role: 'ENGINEERING_LEAD',
      normalizedRoleId: 'engineering-lead',
      assignedShipId: 'ship-freedom',
      assignedSailingId: 'sailing-freedom',
      assignedShipName: 'Freedom of the Seas'
    })
    expect(state.demoUsers.find(user => user.id === 'manager-1')).toEqual(updated)
  })


  it('rejects updates that would put the same person on two same-day turnaround sailings', async () => {
    const { service } = loadServiceWithFakeDb({
      demoUsers: [
        {
          id: 'alex-freedom',
          displayName: 'Alex Turner',
          role: 'TURNAROUND_MANAGER',
          cruiseLineId: 'cl-royal',
          assignedShipId: 'ship-freedom',
          assignedSailingId: 'sailing-freedom'
        },
        {
          id: 'alex-next-day',
          displayName: 'Alex Turner',
          role: 'TURNAROUND_MANAGER',
          cruiseLineId: 'cl-royal',
          assignedShipId: 'ship-wonder',
          assignedSailingId: 'sailing-wonder-next-day'
        }
      ]
    })

    await expect(service.updateTurnaroundPerson('alex-next-day', {
      displayName: 'Alex Turner',
      role: 'turnaround-manager',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-wonder',
      sailingId: 'sailing-wonder-same-day'
    })).rejects.toMatchObject({
      message: 'Turnaround personnel cannot be assigned to more than one turnaround sailing on the same date.',
      statusCode: 400
    })
  })

  it('rejects updates for missing people, invalid roles, missing cruise lines, and cross-line duplicates', async () => {
    const { service } = loadServiceWithFakeDb({
      demoUsers: [
        { id: 'royal-security', displayName: 'Sam Rivera', role: 'SECURITY_LEAD', cruiseLineId: 'cl-royal', assignedShipId: 'ship-freedom' },
        { id: 'carnival-security', displayName: 'Morgan Lee', role: 'SECURITY_LEAD', cruiseLineId: 'cl-carnival', assignedShipId: 'ship-carnival' }
      ]
    })

    await expect(service.updateTurnaroundPerson('missing', { displayName: 'Nobody' }))
      .rejects.toMatchObject({ message: 'Turnaround person was not found.', statusCode: 404 })
    await expect(service.updateTurnaroundPerson('royal-security', { displayName: '', role: 'security-lead', cruiseLineId: 'cl-royal' }))
      .rejects.toMatchObject({ message: 'Turnaround person display name is required.', statusCode: 400 })
    await expect(service.updateTurnaroundPerson('royal-security', { role: 'passenger', cruiseLineId: 'cl-royal' }))
      .rejects.toMatchObject({ message: 'A supported turnaround operational role is required.', statusCode: 400 })
    await expect(service.updateTurnaroundPerson('royal-security', { role: 'security-lead', cruiseLineId: 'missing' }))
      .rejects.toMatchObject({ message: 'A valid cruise line is required for turnaround personnel.', statusCode: 400 })
    await expect(service.updateTurnaroundPerson('royal-security', {
      displayName: 'Morgan Lee',
      role: 'security-lead',
      cruiseLineId: 'cl-royal',
      assignedShipId: 'ship-freedom'
    })).rejects.toMatchObject({
      message: 'Turnaround personnel can belong to exactly one cruise line. This person already has a different cruise line assignment.',
      statusCode: 400
    })
  })
})
