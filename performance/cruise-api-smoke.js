import http from 'k6/http'
import { check, group, sleep } from 'k6'

const baseUrl = __ENV.BASE_URL || 'http://localhost:8000'

export const options = {
  vus: 3,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99']
  }
}

function expectJsonResponse(response, expectedStatus = 200) {
  return check(response, {
    [`status is ${expectedStatus}`]: (res) => res.status === expectedStatus,
    'response is JSON': (res) =>
      String(res.headers['Content-Type'] || '').includes('application/json')
  })
}

export default function () {
  let cruiseLineId

  group('health endpoint', () => {
    const response = http.get(`${baseUrl}/health`)
    expectJsonResponse(response)
    check(response, {
      'health response includes status': (res) =>
        String(res.body || '').includes('status')
    })
  })

  group('cruise line list endpoint', () => {
    const response = http.get(`${baseUrl}/cruise`)
    expectJsonResponse(response)

    const cruiseLines = response.json()

    check(cruiseLines, {
      'cruise line response is an array': (body) => Array.isArray(body),
      'cruise line response has records': (body) => Array.isArray(body) && body.length > 0
    })

    if (Array.isArray(cruiseLines) && cruiseLines.length > 0) {
      cruiseLineId = cruiseLines[0].id
    }
  })

  group('ship lookup endpoint', () => {
    if (!cruiseLineId) {
      check(null, {
        'ship lookup skipped because no cruise line id was available': () => false
      })
      return
    }

    const response = http.get(`${baseUrl}/cruise/ships/${cruiseLineId}`)

    check(response, {
      'ships endpoint returns successful or no-ships response': (res) =>
        [200, 404].includes(res.status),
      'ships response is JSON': (res) =>
        String(res.headers['Content-Type'] || '').includes('application/json')
    })
  })

  sleep(1)
}
