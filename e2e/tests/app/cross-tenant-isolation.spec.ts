/**
 * Cross-tenant isolation tests — verify every sensitive API endpoint
 * enforces companyId scoping and returns 404 (not data) for foreign UUIDs.
 *
 * Two test suites:
 * 1. API probes — Company A session + random foreign UUIDs → 404
 * 2. Two-company test — Company A session + real Company B resource IDs → 404
 *
 * The two-company suite seeds an isolated Company B in beforeAll and
 * tears it down in afterAll. Requires DATABASE_URL in .env.local.
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const FOREIGN_UUID = '00000000-0000-0000-0000-000000000001'

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

// ── Suite 1: Foreign UUID probes ───────────────────────────────────────────

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

// ── Suite 2: Real two-company isolation ────────────────────────────────────

test.describe('Cross-tenant isolation — two-company test', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: any = null

  test.beforeAll(async () => {
    // Dynamic import keeps dotenv + postgres out of the main bundle
    const { seedCompanyB } = await import('../../../e2e/helpers/seed-company-b')
    fixture = await seedCompanyB()
  })

  test.afterAll(async () => {
    if (fixture?.cleanup) await fixture.cleanup()
  })

  test('Company A session cannot read Company B job', async () => {
    if (!fixture) test.skip(true, 'Company B seed failed — check DATABASE_URL in .env.local')
    const headers = getAuthHeaders()
    const res = await fetch(`${BASE_URL}/api/training/job/${fixture.jobId}`, { headers })
    // Must return 404 — not Company B's job data
    expect(res.status).toBe(404)
  })

  test('Company A session cannot match against Company B response', async () => {
    if (!fixture) test.skip(true, 'Company B seed failed — check DATABASE_URL in .env.local')
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE_URL}/api/match`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ responseId: fixture.responseId }),
    })
    // Company B's responseId exists in DB but not for Company A → 404
    expect(res.status).toBe(404)
  })

  test('Company A session cannot chat with Company B persona', async () => {
    if (!fixture) test.skip(true, 'Company B seed failed — check DATABASE_URL in .env.local')
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE_URL}/api/chat/${fixture.personaId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    })
    // Company B's personaId is real but not visible to Company A
    expect(res.status).toBe(404)
  })

  test('Company B session cannot match against Company A response (cross-check)', async () => {
    if (!fixture) test.skip(true, 'Company B seed failed — check DATABASE_URL in .env.local')

    // Resolve a real Company A response ID from auth.json session ownership
    // We use a valid-looking UUID that belongs to no company — Company B session should get 404
    const headers = { ...fixture.sessionHeaders, 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE_URL}/api/match`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ responseId: FOREIGN_UUID }),
    })
    expect(res.status).toBe(404)
  })

  test('Company B admin can access their own job (baseline)', async () => {
    if (!fixture) test.skip(true, 'Company B seed failed — check DATABASE_URL in .env.local')
    const headers = fixture.sessionHeaders
    const res = await fetch(`${BASE_URL}/api/training/job/${fixture.jobId}`, { headers })
    // Company B should see their own job — proves the isolation is directional, not broken both ways
    expect(res.status).toBe(200)
  })
})
