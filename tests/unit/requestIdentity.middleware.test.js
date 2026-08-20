const identity = require('../../middleware/requestIdentity.middleware')

describe('request identity public demo read boundary', () => {
  let previousNodeEnv
  let previousPublicReadMode

  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV
    previousPublicReadMode = process.env.CRUISE_PUBLIC_DEMO_READ_MODE
  })

  afterEach(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    if (previousPublicReadMode === undefined) delete process.env.CRUISE_PUBLIC_DEMO_READ_MODE
    else process.env.CRUISE_PUBLIC_DEMO_READ_MODE = previousPublicReadMode
  })

  it('accepts demo scope only for explicitly enabled production read requests', () => {
    process.env.NODE_ENV = 'production'
    process.env.CRUISE_PUBLIC_DEMO_READ_MODE = 'enabled'

    const readReq = {
      method: 'GET',
      headers: { 'x-cruise-demo-user-id': 'UPASS00001' }
    }
    const writeReq = {
      method: 'POST',
      headers: { 'x-cruise-demo-user-id': 'UPASS00001' }
    }

    expect(identity.buildRequestIdentity(readReq)).toMatchObject({
      authMode: 'jwt',
      demoUserId: 'UPASS00001',
      isDemoIdentity: true,
      isAuthenticated: true
    })
    expect(identity.buildRequestIdentity(writeReq)).toMatchObject({
      authMode: 'jwt',
      demoUserId: null,
      isDemoIdentity: false,
      isAuthenticated: false
    })
  })
})
