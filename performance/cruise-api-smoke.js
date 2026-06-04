import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export const options = {
  vus: 3,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
}

function expectJson(response) {
  return check(response, {
    'response is JSON': res => String(res.headers['Content-Type'] || '').includes('application/json'),
  })
}

export default function () {
  const health = http.get(`${BASE_URL}/health`)
  check(health, {
    'status is 200': res => res.status === 200,
    'health response includes status': res => {
      try {
        return Boolean(res.json('status'))
      } catch (error) {
        return false
      }
    },
  })
  expectJson(health)

  const cruiseLines = http.get(`${BASE_URL}/cruise`)
  check(cruiseLines, {
    'status is 200': res => res.status === 200,
    'cruise line response is an array': res => {
      try {
        return Array.isArray(res.json())
      } catch (error) {
        return false
      }
    },
    'cruise line response has records': res => {
      try {
        return res.json().length > 0
      } catch (error) {
        return false
      }
    },
  })
  expectJson(cruiseLines)

  let cruiseLineId = null
  try {
    cruiseLineId = cruiseLines.json('0.id')
  } catch (error) {
    cruiseLineId = null
  }

  if (cruiseLineId) {
    const ships = http.get(`${BASE_URL}/cruise/ships/${cruiseLineId}`)
    check(ships, {
      'ships endpoint returns successful or no-ships response': res => res.status === 200 || res.status === 404,
    })
    expectJson(ships)
  }

  sleep(1)
}
