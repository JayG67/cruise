const { buildSeedRows } = require('../../services/cruiseSeedRows.service')

function buildMinimalData(overrides = {}) {
  return {
    cruiseLines: [
      {
        name: 'Line A',
        country: 'US',
        website: 'https://a.example',
        ships: [{
          name: 'Ship A',
          currentPort: 'Miami',
          sailings: [{ departureDate: '2026-09-01', port: 'Miami', days: 1, itinerary: [] }]
        }]
      },
      {
        name: 'Line B',
        country: 'US',
        website: 'https://b.example',
        ships: [{
          name: 'Ship B',
          currentPort: 'Port Canaveral',
          sailings: [{ departureDate: '2026-09-02', port: 'Port Canaveral', days: 1, itinerary: [] }]
        }]
      }
    ],
    customers: [],
    bookings: [],
    demoUsers: [],
    turnaroundOperations: [],
    ...overrides
  }
}

describe('cruiseSeedRows service', () => {
  it('resolves duplicate operational names within the assigned ship before using a global exact-name fallback', () => {
    const rows = buildSeedRows(buildMinimalData({
      demoUsers: [
        { id: 'ops-a', displayName: 'Alex Morgan', role: 'ENGINEERING_LEAD', shipName: 'Ship A' },
        { id: 'ops-b', displayName: 'Alex Morgan', role: 'ENGINEERING_LEAD', shipName: 'Ship B' }
      ],
      turnaroundOperations: [{
        title: 'Ship B turnaround',
        shipName: 'Ship B',
        departureDate: '2026-09-02',
        signoffs: [{ departmentRole: 'ENGINEERING_LEAD', approverName: 'Alex Morgan', status: 'APPROVED' }]
      }]
    }))

    expect(rows.turnaroundSignoffRows).toHaveLength(1)
    expect(rows.turnaroundSignoffRows[0].approverUserId).toBe('ops-b')
  })

  it('normalizes malformed, negative, and fractional staffing counts before persistence', () => {
    const rows = buildSeedRows(buildMinimalData({
      turnaroundOperations: [{
        title: 'Staffing normalization',
        shipName: 'Ship A',
        departureDate: '2026-09-01',
        staffing: [
          { departmentRole: 'HOUSEKEEPING_LEAD', plannedCount: 'not-a-number', checkedInCount: Infinity },
          { departmentRole: 'ENGINEERING_LEAD', plannedCount: -3, checkedInCount: 2.9 }
        ]
      }]
    }))

    expect(rows.turnaroundStaffingRows.map(row => [row.plannedCount, row.checkedInCount])).toEqual([
      [0, 0],
      [0, 2]
    ])
  })

  it('normalizes roles and non-operational assignment scope without inventing ship ownership', () => {
    const rows = buildSeedRows(buildMinimalData({
      customers: [{ id: 'C1', firstName: 'Pat', lastName: 'Guest', email: 'pat@example.com' }],
      demoUsers: [
        { id: 'admin-1', displayName: 'Admin', role: 'admin' },
        { id: 'guest-1', displayName: 'Guest', role: 'group leader', customerId: 'C1' },
        { id: 'ops-1', displayName: 'Taylor — Ship A', role: 'guest-services-lead' }
      ]
    }))

    expect(rows.appRoleRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'admin', roleType: 'ADMIN' }),
      expect.objectContaining({ id: 'group-leader', roleType: 'GROUP_LEADER' }),
      expect.objectContaining({ id: 'guest-services-lead', roleType: 'OPERATIONS' })
    ]))
    expect(rows.appUserRoleRows.find(row => row.userId === 'guest-1')).toMatchObject({ assignmentScope: 'CUSTOMER', assignedShipId: null })
    expect(rows.demoUserRows.find(row => row.id === 'ops-1')).toEqual(expect.objectContaining({ assignedShipName: 'Ship A' }))
  })

  it('fails closed when bookings or task dependencies cannot resolve their authoritative relationships', () => {
    expect(() => buildSeedRows(buildMinimalData({
      bookings: [{ id: 'B-missing', shipName: 'Unknown', departureDate: '2026-09-09' }]
    }))).toThrow('Unable to resolve sailing for booking B-missing')

    expect(() => buildSeedRows(buildMinimalData({
      turnaroundOperations: [{
        title: 'Dependency mismatch', shipName: 'Ship A', departureDate: '2026-09-01',
        tasks: [{ taskName: 'Known task', status: 'PENDING' }],
        taskDependencies: [{ taskName: 'Known task', dependsOnTaskName: 'Missing task' }]
      }]
    }))).toThrow('Unable to resolve turnaround task dependency')
  })

  it('seeds itinerary activities, booking passengers, and task updates through resolved relationships', () => {
    const data = buildMinimalData({
      customers: [{ id: 'C1', firstName: 'Pat', lastName: 'Guest', email: 'pat@example.com' }],
      bookings: [{ id: 'B1', shipName: 'Ship A', departureDate: '2026-09-01', passengers: [{ customerId: 'C1', isPrimaryGuest: true }] }],
      turnaroundOperations: [{
        title: 'Resolved operation', shipName: 'Ship A', departureDate: '2026-09-01',
        tasks: [{ taskName: 'Boarding prep', ownerName: 'Unknown owner', updates: [{ authorName: 'Unknown author', message: 'Ready' }] }]
      }]
    })
    data.cruiseLines[0].ships[0].sailings[0].itinerary = [{
      day: 1, title: 'Embarkation', port: 'Miami',
      activitySchedule: [{ time: '10:00', activity: 'Boarding' }]
    }]

    const rows = buildSeedRows(data)

    expect(rows.activityRows).toHaveLength(1)
    expect(rows.bookingRows[0].sailingId).toBe(rows.sailingRows[0].id)
    expect(rows.bookingPassengerRows[0]).toEqual(expect.objectContaining({ bookingId: 'B1', customerId: 'C1', isPrimaryGuest: true }))
    expect(rows.turnaroundTaskUpdateRows[0]).toEqual(expect.objectContaining({ authorUserId: null, updateType: 'NOTE', message: 'Ready' }))
  })
})
