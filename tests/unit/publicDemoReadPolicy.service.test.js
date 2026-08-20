const policy = require('../../services/publicDemoReadPolicy.service')

describe('public demo read policy', () => {
  it('requires an explicit production-only enablement flag', () => {
    expect(policy.getPublicDemoReadMode({ NODE_ENV: 'development', CRUISE_PUBLIC_DEMO_READ_MODE: 'enabled' })).toBe('disabled')
    expect(policy.getPublicDemoReadMode({ NODE_ENV: 'production' })).toBe('disabled')
    expect(policy.getPublicDemoReadMode({ NODE_ENV: 'production', CRUISE_PUBLIC_DEMO_READ_MODE: ' ENABLED ' })).toBe('enabled')
  })

  it('permits only GET and HEAD requests when public demo reads are enabled', () => {
    const env = { NODE_ENV: 'production', CRUISE_PUBLIC_DEMO_READ_MODE: 'enabled' }

    expect(policy.isPublicDemoReadRequest({ method: 'GET' }, env)).toBe(true)
    expect(policy.isPublicDemoReadRequest({ method: 'head' }, env)).toBe(true)
    expect(policy.isPublicDemoReadRequest({ method: 'POST' }, env)).toBe(false)
    expect(policy.isPublicDemoReadRequest({ method: 'PATCH' }, env)).toBe(false)
    expect(policy.isPublicDemoReadRequest({}, env)).toBe(false)
  })
})
