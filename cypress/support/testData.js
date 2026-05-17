export const royalCruiseLineId = '11111111-1111-1111-1111-111111111111'
export const mscCruiseLineId = '22222222-2222-2222-2222-222222222222'
export const norwegianCruiseLineId = '33333333-3333-3333-3333-333333333333'
export const disneyCruiseLineId = '44444444-4444-4444-4444-444444444444'
export const iconShipId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
export const utopiaShipId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

export const initialCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  }
]

export const homeCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: mscCruiseLineId,
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  },
  {
    id: norwegianCruiseLineId,
    name: 'No Country Cruise Line',
    country: null,
    website: null
  }
]

export const searchCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: mscCruiseLineId,
    name: 'Carnival Cruise Line',
    country: 'United States',
    website: 'https://www.carnival.com'
  },
  {
    id: norwegianCruiseLineId,
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  },
  {
    id: disneyCruiseLineId,
    name: 'Disney Cruise Line',
    country: 'United States',
    website: 'https://disneycruise.disney.go.com'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Margaritaville at Sea',
    country: 'United States',
    website: 'https://margaritavilleatsea.com'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'AIDA Cruises',
    country: 'Germany',
    website: 'https://www.aida.de'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'No Country Cruise Line',
    country: null,
    website: null
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'Test & Demo Cruises',
    country: 'Curaçao',
    website: null
  }
]

export const shipsCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: mscCruiseLineId,
    name: 'Carnival Cruise Line',
    country: 'United States',
    website: 'https://www.carnival.com'
  },
  {
    id: norwegianCruiseLineId,
    name: 'Empty Fleet Line',
    country: 'United States',
    website: null
  },
  {
    id: disneyCruiseLineId,
    name: 'Unsafe Demo Line',
    country: 'Test Country',
    website: null
  }
]

export const shipMap = {
  [shipsCruiseLines[0].id]: [
    { id: 'ship-1', name: 'Icon of the Seas', cruiseLineId: shipsCruiseLines[0].id },
    { id: 'ship-2', name: 'Wonder of the Seas', cruiseLineId: shipsCruiseLines[0].id }
  ],
  [shipsCruiseLines[1].id]: [
    { id: 'ship-3', name: 'Mardi Gras', cruiseLineId: shipsCruiseLines[1].id },
    { id: 'ship-4', name: 'Carnival Celebration', cruiseLineId: shipsCruiseLines[1].id },
    { id: 'ship-5', name: 'Carnival Jubilee', cruiseLineId: shipsCruiseLines[1].id }
  ],
  [shipsCruiseLines[2].id]: [],
  [shipsCruiseLines[3].id]: [
    { id: 'ship-6', name: '<img src=x onerror=alert(1)> Ship', cruiseLineId: shipsCruiseLines[3].id }
  ]
}

export const updateCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: mscCruiseLineId,
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  }
]

export const royalShips = [
  {
    id: iconShipId,
    name: 'Icon of the Seas',
    currentPort: 'Miami, Florida',
    cruiseLineId: royalCruiseLineId
  },
  {
    id: utopiaShipId,
    name: 'Utopia of the Seas',
    currentPort: 'Miami, Florida',
    cruiseLineId: royalCruiseLineId
  }
]

export const mscShips = [
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'MSC Seaside',
    currentPort: 'Barcelona, Spain',
    cruiseLineId: mscCruiseLineId
  }
]

export const deleteCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: mscCruiseLineId,
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  },
  {
    id: norwegianCruiseLineId,
    name: 'Norwegian Cruise Line',
    country: 'United States',
    website: 'https://www.ncl.com'
  }
]

export const afterRoyalDelete = [
  {
    id: mscCruiseLineId,
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  },
  {
    id: norwegianCruiseLineId,
    name: 'Norwegian Cruise Line',
    country: 'United States',
    website: 'https://www.ncl.com'
  }
]

export const afterMscDelete = [
  {
    id: royalCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: norwegianCruiseLineId,
    name: 'Norwegian Cruise Line',
    country: 'United States',
    website: 'https://www.ncl.com'
  }
]

export const dirtyCruiseLines = [
  {
    id: royalCruiseLineId,
    name: 'Dirty Demo Cruise Line',
    country: 'United States',
    website: 'https://example.com'
  },
  {
    id: mscCruiseLineId,
    name: 'Temporary Test Line',
    country: 'Canada',
    website: null
  }
]

export const seedCruiseLines = [
  {
    id: norwegianCruiseLineId,
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: disneyCruiseLineId,
    name: 'Carnival Cruise Line',
    country: 'United States',
    website: 'https://www.carnival.com'
  }
]

export const mockCruiseLines = [
  {
    id: '1',
    name: 'Royal Caribbean',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: '2',
    name: 'Carnival Cruise Line',
    country: 'United States',
    website: 'https://www.carnival.com'
  },
  {
    id: '3',
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  }
]
