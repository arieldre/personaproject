/**
 * Seed helper for cross-tenant E2E tests.
 * Creates an isolated Company B (BetaCorp) with its own admin, persona, job, and survey response.
 * Returns resource IDs + auth session for Company B, plus a cleanup function.
 *
 * Uses direct SQL (postgres.js) + Better Auth sign-up API.
 * Idempotent: re-uses existing rows if already created.
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env.local before any DB connection — safe to call multiple times
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import postgres from 'postgres'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const DATABASE_URL = process.env.DATABASE_URL

const BETA_EMAIL = 'admin@betacorp-isolation-test.local'
const BETA_PASSWORD = 'BetaIsolation123!'
const BETA_SLUG = 'betacorp-isolation-test'
const BETA_ACCESS_CODE = 'BETA-ISO-001'

export interface CompanyBFixture {
  companyId: string
  personaId: string
  jobId: string
  responseId: string
  /** Cookie string for Company B admin session — use as { Cookie: sessionHeaders.Cookie } */
  sessionHeaders: { Cookie: string }
  cleanup: () => Promise<void>
}

export async function seedCompanyB(): Promise<CompanyBFixture> {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set — add to .env.local')
  const sql = postgres(DATABASE_URL, { prepare: false })

  try {
    // 1. Sign up Company B admin via auth API (idempotent — ignore USER_ALREADY_EXISTS)
    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
      body: JSON.stringify({ name: 'Beta Isolation Admin', email: BETA_EMAIL, password: BETA_PASSWORD }),
    })
    if (!signUpRes.ok) {
      const body = await signUpRes.json() as { code?: string; message?: string }
      if (!body.code?.includes('USER_ALREADY_EXISTS') && !body.message?.includes('already')) {
        throw new Error(`Company B sign-up failed: ${JSON.stringify(body)}`)
      }
    }

    // 2. Resolve user ID
    const [betaUser] = await sql`SELECT id FROM "user" WHERE email = ${BETA_EMAIL} LIMIT 1`
    if (!betaUser) throw new Error('Company B user not found in DB after sign-up')
    const betaUserId = betaUser.id as string

    // 3. Create or get Company B
    const existingCo = await sql`SELECT id FROM companies WHERE slug = ${BETA_SLUG} LIMIT 1`
    let companyId: string
    if (existingCo.length > 0) {
      companyId = existingCo[0].id as string
    } else {
      const [co] = await sql`
        INSERT INTO companies (name, slug, industry, subscription_status, license_count, created_by)
        VALUES ('BetaCorp (isolation test)', ${BETA_SLUG}, 'Testing', 'trial', 5, ${betaUserId})
        RETURNING id
      `
      companyId = co.id as string
    }

    // 4. Assign company B admin role to the user
    await sql`
      UPDATE "user"
      SET role = 'company_admin', company_id = ${companyId}
      WHERE id = ${betaUserId}
    `

    // 5. Create questionnaire for Company B
    const existingQ = await sql`SELECT id FROM questionnaires WHERE access_code = ${BETA_ACCESS_CODE} LIMIT 1`
    let questionnaireId: string
    if (existingQ.length > 0) {
      questionnaireId = existingQ[0].id as string
    } else {
      const [q] = await sql`
        INSERT INTO questionnaires (company_id, name, status, access_code, is_anonymous, created_by)
        VALUES (${companyId}, 'Beta Isolation Assessment', 'active', ${BETA_ACCESS_CODE}, false, ${betaUserId})
        RETURNING id
      `
      questionnaireId = q.id as string
    }

    // 6. Create a completed survey response for Company B
    const existingR = await sql`
      SELECT id FROM questionnaire_responses
      WHERE questionnaire_id = ${questionnaireId} LIMIT 1
    `
    let responseId: string
    if (existingR.length > 0) {
      responseId = existingR[0].id as string
    } else {
      const [r] = await sql`
        INSERT INTO questionnaire_responses
          (questionnaire_id, respondent_name, respondent_email, status, answers, personality_vector, completed_at)
        VALUES (
          ${questionnaireId}, 'Beta Employee', 'emp@betacorp-isolation-test.local',
          'completed', '{}',
          '[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0.1,0.2,0.3,0.4,0.5]'::vector(14),
          NOW()
        )
        RETURNING id
      `
      responseId = r.id as string
    }

    // 7. Create a persona for Company B
    const existingP = await sql`SELECT id FROM personas WHERE company_id = ${companyId} LIMIT 1`
    let personaId: string
    if (existingP.length > 0) {
      personaId = existingP[0].id as string
    } else {
      const [p] = await sql`
        INSERT INTO personas
          (company_id, questionnaire_id, name, tagline, status, summary, system_prompt, personality_vector, cluster_id, cluster_size, generated_at, updated_at)
        VALUES (
          ${companyId}, ${questionnaireId},
          'Beta Test Persona', 'Isolation test only', 'active', '{}',
          'You are a test persona for isolation testing.',
          '[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0.1,0.2,0.3,0.4,0.5]'::vector(14),
          0, 1, NOW(), NOW()
        )
        RETURNING id
      `
      personaId = p.id as string
    }

    // 8. Create a job for Company B
    const existingJ = await sql`SELECT id FROM jobs WHERE company_id = ${companyId} LIMIT 1`
    let jobId: string
    if (existingJ.length > 0) {
      jobId = existingJ[0].id as string
    } else {
      const [j] = await sql`
        INSERT INTO jobs (type, status, company_id, entity_id, entity_type)
        VALUES ('cluster', 'complete', ${companyId}, ${questionnaireId}, 'questionnaire')
        RETURNING id
      `
      jobId = j.id as string
    }

    // 9. Sign in as Company B admin to get session cookies
    const signInRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
      body: JSON.stringify({ email: BETA_EMAIL, password: BETA_PASSWORD }),
    })
    if (!signInRes.ok) throw new Error(`Company B sign-in failed: ${signInRes.status}`)

    let cookieStrings: string[] = []
    if (typeof (signInRes.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function') {
      cookieStrings = (signInRes.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
    } else {
      const raw = signInRes.headers.get('set-cookie')
      if (raw) cookieStrings = [raw]
    }
    const cookieStr = cookieStrings.map((c) => c.split(';')[0]).join('; ')

    const cleanup = async () => {
      const cleanSql = postgres(DATABASE_URL!, { prepare: false })
      try {
        await cleanSql`DELETE FROM jobs WHERE company_id = ${companyId}`
        await cleanSql`DELETE FROM personas WHERE company_id = ${companyId}`
        await cleanSql`DELETE FROM questionnaire_responses WHERE questionnaire_id = ${questionnaireId}`
        await cleanSql`DELETE FROM questionnaires WHERE company_id = ${companyId}`
        await cleanSql`UPDATE "user" SET company_id = NULL, role = 'user' WHERE email = ${BETA_EMAIL}`
        await cleanSql`DELETE FROM companies WHERE id = ${companyId}`
        await cleanSql`DELETE FROM "user" WHERE email = ${BETA_EMAIL}`
      } finally {
        await cleanSql.end()
      }
    }

    await sql.end()

    return {
      companyId,
      personaId,
      jobId,
      responseId,
      sessionHeaders: { Cookie: cookieStr },
      cleanup,
    }
  } catch (err) {
    await sql.end()
    throw err
  }
}
