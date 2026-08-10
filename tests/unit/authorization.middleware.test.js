jest.mock('../../services/authentication.service', () => ({
  AUTH_MODES: { DEMO: 'demo', JWT: 'jwt' },
  getAuthenticationMode: jest.fn()
}))

jest.mock('../../services/requestAuthorization.service', () => ({
  requireAdminRequest: jest.fn()
}))

const { getAuthenticationMode } = require('../../services/authentication.service')
const { requireAdminRequest } = require('../../services/requestAuthorization.service')
const { requireAdminMutation } = require('../../middleware/authorization.middleware')

describe('admin mutation authorization middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('preserves demo-mode portfolio workflows without invoking production authorization', async () => {
    getAuthenticationMode.mockReturnValue('demo')
    const next = jest.fn()

    await requireAdminMutation({}, {}, next)

    expect(requireAdminRequest).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('allows a verified administrator through in JWT mode', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(true)
    const req = { requestIdentity: { principal: { userId: 'admin-1', role: 'ADMIN' } } }
    const res = {}
    const next = jest.fn()

    await requireAdminMutation(req, res, next)

    expect(requireAdminRequest).toHaveBeenCalledWith(req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('stops the request when JWT-mode administrator authorization fails', async () => {
    getAuthenticationMode.mockReturnValue('jwt')
    requireAdminRequest.mockResolvedValue(false)
    const next = jest.fn()

    await requireAdminMutation({}, {}, next)

    expect(next).not.toHaveBeenCalled()
  })
})
