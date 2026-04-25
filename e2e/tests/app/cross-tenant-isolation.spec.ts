/**
 * Cross-tenant isolation tests — verify every sensitive API endpoint
 * enforces companyId scoping and returns 404 (not data) for foreign UUIDs.
 *
 * These are API-level probes: authenticated as Company A admin, sending
 * UUIDs that don't exist in Company A. If tenant isolation works, we get 404.
 * If broken, we'd get 200 with another company's data.
 *
 * A full two-company test (seed Company B, verify A can't read B) is marked
 * test.fixme() below — implement when the seed helper supports multi-tenant.
 */

import { test, expect, request } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const FOREIGN_UUID = '00000000-0000-0000-0000-000000000001'

// Load auth cookies set by global-setup
function getAuthHeaders(): { Cookie: string } {
  const authPath = path.join(process.cwd(), 'e2e/auth.json')
  if (!fs.existsSync(authPath)) {
    throw new Error('e2e/auth.json not found — run global-setup first')
  }
  const { cookies } = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
  const cookieStr = (cookies as { name: string; value: string }[])
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')
  return { Cookie: cookieStr }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

test.describe('Cross-tenant isolation — API probes', () => {
  test('GET /api/training/job/[foreignId] returns 404, not data', async () => {
    const headers = getAuthHeaders()
    const res = await fetch(`${BASE_URL}/api/training/job/${FOREIGN_UUID}`, { headers })
    expect(res.status).toBe(404)
  })

  test('POST /api/match with foreign responseId returns 404, not vector data', async () => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE_URL}/api/match`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ responseId: FOREIGN_UUID }),
    })
    // Should be 404 (response not found in this company), not 200 with vector
    expect(res.status).toBe(404)
  })

  test('POST /api/training/grade with foreign personaId returns 404, not session', async () => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE_URL}/api/training/grade`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        personaId: FOREIGN_UUID,
        messages: [{ role: 'user', content: 'hello' }],
      }),
    })
    // 404 = persona not found in this company
    expect([404, 400]).toContain(res.status)
  })

  test('GET /api/chat/[foreignPersonaId] POST returns 404, not stream', async () => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE_URL}/api/chat/${FOREIGN_UUID}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    })
    expect(res.status).toBe(404)
  })

  test('unauthenticated request to /api/training/job/[id] returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/training/job/${FOREIGN_UUID}`)
    expect(res.status).toBe(401)
  })

  test('unauthenticated request to /api/match returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId: FOREIGN_UUID }),
    })
    expect(res.status).toBe(401)
  })
})

test.describe('Cross-tenant isolation — full two-company test', () => {
  test.fixme(
    true,
    'Implement when seed helper supports creating two separate companies with users. ' +
    'Required: seed Company B, get Company B session, verify Company A session ' +
    'cannot read Company B jobs/personas/trainingSessions/responses via any API.'
  )

  test('company A cannot read company B training sessions', async () => {
    // TODO: seed two companies
    // const companyBSessionId = await seedCompanyB()
    // const res = await fetch('/api/training/job/<company-b-job-id>', { headers: companyAHeaders })
    // expect(res.status).toBe(404)
  })
})
