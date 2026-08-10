const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..', '..')
const routes = fs.readFileSync(path.join(projectRoot, 'routes', 'cruise.routes.js'), 'utf8')

const protectedAdminMutations = [
  ['post', '/turnaround-admin/people'],
  ['patch', '/turnaround-admin/people/:id'],
  ['delete', '/turnaround-admin/people/:id'],
  ['post', '/cruise-line'],
  ['patch', '/cruise-line/:id'],
  ['delete', '/cruise-line/:id'],
  ['post', '/ship'],
  ['patch', '/ship/:id'],
  ['delete', '/ship/:id'],
  ['post', '/ship/:shipId/sailings'],
  ['patch', '/sailings/:id'],
  ['delete', '/sailings/:id'],
  ['post', '/sailings/:sailingId/itinerary'],
  ['patch', '/itinerary-days/:id'],
  ['delete', '/itinerary-days/:id'],
  ['post', '/itinerary-days/:itineraryDayId/activities'],
  ['patch', '/activities/:id'],
  ['delete', '/activities/:id']
]

describe('administrator mutation authorization contracts', () => {
  it('routes fleet, sailing, itinerary, and turnaround-team writes through the admin mutation boundary', () => {
    expect(routes).toMatch(/const\s*\{[\s\S]*?\brequireAdminMutation\b[\s\S]*?\}\s*=\s*require\('\.\.\/middleware\/authorization\.middleware'\)/)

    for (const [method, routePath] of protectedAdminMutations) {
      const routeSignature = `router.${method}(\n  '${routePath}'`
      const routeIndex = routes.indexOf(routeSignature)
      expect(routeIndex).toBeGreaterThanOrEqual(0)

      const routeWindow = routes.slice(routeIndex, routeIndex + 260)
      expect(routeWindow).toContain('requireAdminMutation')
    }
  })
})
