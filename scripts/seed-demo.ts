#!/usr/bin/env tsx
/**
 * Demo seed script.
 * Requires dev server running: npm run dev
 * Usage: npx tsx scripts/seed-demo.ts
 *
 * Creates: company · admin user · questionnaire · 7 survey responses · 3 personas (via Groq)
 */

// dotenv.config runs BEFORE any connection is made — postgres.js only connects on first query
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'
import { computePersonalityVector } from '../lib/vcpq/vector'
import { kmeanspp, type Cluster } from '../lib/clustering/kmeans'
import { DIMENSIONS } from '../lib/vcpq/vector'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const DATABASE_URL = process.env.DATABASE_URL!

const ADMIN_EMAIL = 'admin@acme-demo.com'
const ADMIN_PASSWORD = 'AcmeDemo123!'
const ADMIN_NAME = 'Demo Admin'

const DEMO_EMPLOYEES = [
  {
    name: 'Alice Chen',
    email: 'alice@acme-demo.com',
    // Conservative analyst: low innovation, high diligence, formal, data-driven, autonomous
    answers: {
      A1: 1, A2: 5, A3: 5, A4: 1, A5: 2, A6: 4, A7: 3, A8: 3,
      B1: 4, B2: 2, B3: 2, B4: 4, B5: 5, B6: 1, B7: 4, B8: 2,
      C1: 2, C2: 4, C3: 1, C4: 5, C5: 1, C6: 4,
      D1: 3, D2: 3, D3: 5, D4: 1, D5: 5, D6: 1,
    },
  },
  {
    name: "Dave O'Brien",
    email: 'dave@acme-demo.com',
    // Decisive executor: blunt, autonomous, conflict-forward, terse
    answers: {
      A1: 2, A2: 4, A3: 4, A4: 2, A5: 2, A6: 4, A7: 2, A8: 4,
      B1: 5, B2: 1, B3: 1, B4: 5, B5: 4, B6: 2, B7: 3, B8: 3,
      C1: 1, C2: 5, C3: 1, C4: 5, C5: 1, C6: 5,
      D1: 5, D2: 1, D3: 4, D4: 2, D5: 5, D6: 1,
    },
  },
  {
    name: 'Grace Park',
    email: 'grace@acme-demo.com',
    // Process optimizer: systematic, diligent, data-driven, moderate social
    answers: {
      A1: 2, A2: 4, A3: 5, A4: 1, A5: 3, A6: 3, A7: 3, A8: 3,
      B1: 3, B2: 3, B3: 4, B4: 2, B5: 4, B6: 2, B7: 3, B8: 3,
      C1: 4, C2: 2, C3: 2, C4: 4, C5: 3, C6: 3,
      D1: 2, D2: 4, D3: 5, D4: 1, D5: 4, D6: 2,
    },
  },
  {
    name: 'Carol Singh',
    email: 'carol@acme-demo.com',
    // Diplomatic facilitator: agreeable, social, deferential, verbose, sycophantic
    answers: {
      A1: 3, A2: 3, A3: 3, A4: 3, A5: 5, A6: 1, A7: 5, A8: 1,
      B1: 1, B2: 5, B3: 5, B4: 1, B5: 3, B6: 3, B7: 2, B8: 4,
      C1: 5, C2: 1, C3: 4, C4: 2, C5: 5, C6: 1,
      D1: 1, D2: 5, D3: 3, D4: 3, D5: 3, D6: 3,
    },
  },
  {
    name: 'Emma Wilson',
    email: 'emma@acme-demo.com',
    // Social harmonizer: high social energy, agreeable, consensus-seeking
    answers: {
      A1: 3, A2: 3, A3: 2, A4: 3, A5: 5, A6: 1, A7: 5, A8: 1,
      B1: 2, B2: 4, B3: 4, B4: 2, B5: 2, B6: 4, B7: 2, B8: 4,
      C1: 4, C2: 2, C3: 4, C4: 2, C5: 4, C6: 2,
      D1: 1, D2: 5, D3: 3, D4: 3, D5: 3, D6: 4,
    },
  },
  {
    name: 'Bob Martinez',
    email: 'bob@acme-demo.com',
    // Creative catalyst: innovative, casual, intuitive, moderately social
    answers: {
      A1: 5, A2: 1, A3: 2, A4: 4, A5: 4, A6: 2, A7: 4, A8: 2,
      B1: 3, B2: 3, B3: 3, B4: 3, B5: 1, B6: 5, B7: 2, B8: 4,
      C1: 3, C2: 3, C3: 3, C4: 3, C5: 3, C6: 3,
      D1: 2, D2: 4, D3: 2, D4: 4, D5: 3, D6: 3,
    },
  },
  {
    name: 'Frank Liu',
    email: 'frank@acme-demo.com',
    // Technical expert: innovative, jargon-heavy, autonomous, skeptical of authority
    answers: {
      A1: 5, A2: 1, A3: 4, A4: 2, A5: 2, A6: 4, A7: 2, A8: 4,
      B1: 4, B2: 2, B3: 2, B4: 4, B5: 3, B6: 3, B7: 5, B8: 1,
      C1: 1, C2: 5, C3: 1, C4: 5, C5: 1, C6: 5,
      D1: 4, D2: 2, D3: 5, D4: 1, D5: 4, D6: 2,
    },
  },
]

interface PersonaProfile {
  name: string
  tagline: string
  summary: { overview: string; strengths: string[]; growthAreas: string[] }
  systemPrompt: string
}

async function generatePersonaProfile(cluster: Cluster, index: number, total: number): Promise<PersonaProfile> {
  const dimensionLines = DIMENSIONS.map((d, i) => `  ${d}: ${cluster.centroid[i].toFixed(2)}`).join('\n')
  const prompt = `You are building personality personas for a workplace tool. Based on this cluster data, generate a professional persona profile.

Cluster ${index + 1} of ${total}: ${cluster.memberIndices.length} employees
Centroid personality dimensions (scale -1 to 1):
${dimensionLines}

Respond with ONLY valid JSON (no markdown):
{
  "name": "A descriptive persona name (e.g. 'The Analytical Architect')",
  "tagline": "One sentence describing this persona type (max 100 chars)",
  "summary": {
    "overview": "2-3 sentence overview of this persona",
    "strengths": ["strength1", "strength2", "strength3"],
    "growthAreas": ["area1", "area2"]
  },
  "systemPrompt": "You are [persona name]. [2-3 sentences of in-character behavioral guidance for an AI to embody this persona in workplace conversations. Focus on communication style, decision-making approach, and interpersonal tendencies.]"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq API error ${res.status}: ${body}`)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices[0].message.content.trim()

  // Strip markdown code fences if model wraps in ```json
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned) as PersonaProfile
}

async function checkServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    // Any response (even 400) means server is up
    return res.status !== 0
  } catch {
    return false
  }
}

async function main() {
  console.log('🌱 Persona Platform — Demo Seed')
  console.log(`   Server: ${BASE_URL}`)
  console.log('')

  // Verify server is running
  const serverUp = await checkServerRunning()
  if (!serverUp) {
    console.error('✗ Dev server not running. Start it first: npm run dev')
    process.exit(1)
  }
  console.log('✓ Dev server reachable')

  if (!DATABASE_URL) { console.error('✗ DATABASE_URL not set'); process.exit(1) }
  if (!GROQ_API_KEY) { console.error('✗ GROQ_API_KEY not set'); process.exit(1) }

  const sql = postgres(DATABASE_URL, { prepare: false })

  try {
    // ── 1. Create or retrieve admin user via Better Auth HTTP API ──────────────
    console.log('\n── Step 1: Admin user')
    let adminUserId: string | null = null

    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    })
    const signUpBody = await signUpRes.json() as { user?: { id: string }; code?: string; message?: string }

    if (signUpRes.ok && signUpBody.user?.id) {
      adminUserId = signUpBody.user.id
      console.log(`   Created admin: ${ADMIN_EMAIL} (id: ${adminUserId})`)
    } else if (signUpBody.code === 'USER_ALREADY_EXISTS' || signUpBody.message?.includes('already exists')) {
      // Look up existing user
      const rows = await sql`SELECT id FROM "user" WHERE email = ${ADMIN_EMAIL} LIMIT 1`
      adminUserId = rows[0]?.id ?? null
      console.log(`   Admin exists: ${ADMIN_EMAIL} (id: ${adminUserId})`)
    } else {
      throw new Error(`Sign-up failed: ${JSON.stringify(signUpBody)}`)
    }

    if (!adminUserId) throw new Error('Could not resolve admin user ID')

    // ── 2. Create company ──────────────────────────────────────────────────────
    console.log('\n── Step 2: Company')
    const existingCompany = await sql`SELECT id FROM companies WHERE slug = 'acme-demo' LIMIT 1`
    let companyId: string

    if (existingCompany.length > 0) {
      companyId = existingCompany[0].id as string
      console.log(`   Exists: Acme Technology (id: ${companyId})`)
    } else {
      const [company] = await sql`
        INSERT INTO companies (name, slug, industry, company_size, subscription_status, license_count, created_by)
        VALUES ('Acme Technology', 'acme-demo', 'Technology', '50-200', 'active', 50, ${adminUserId})
        RETURNING id
      `
      companyId = company.id as string
      console.log(`   Created: Acme Technology (id: ${companyId})`)
    }

    // ── 3. Assign admin role + company to user ─────────────────────────────────
    await sql`
      UPDATE "user"
      SET role = 'company_admin', company_id = ${companyId}
      WHERE id = ${adminUserId}
    `
    console.log(`   Assigned company_admin role → user ${adminUserId}`)

    // ── 4. Create questionnaire ────────────────────────────────────────────────
    console.log('\n── Step 3: Questionnaire')
    const existingQ = await sql`SELECT id FROM questionnaires WHERE access_code = 'ACME2026' LIMIT 1`
    let questionnaireId: string

    if (existingQ.length > 0) {
      questionnaireId = existingQ[0].id as string
      console.log(`   Exists: ACME2026 (id: ${questionnaireId})`)
    } else {
      const [q] = await sql`
        INSERT INTO questionnaires (company_id, name, description, status, access_code, is_anonymous, domain_context, created_by)
        VALUES (
          ${companyId},
          'Acme Team Assessment Q1 2026',
          'Baseline personality assessment for all Acme Technology employees.',
          'active',
          'ACME2026',
          false,
          'Technology',
          ${adminUserId}
        )
        RETURNING id
      `
      questionnaireId = q.id as string
      console.log(`   Created: ACME2026 (id: ${questionnaireId})`)
    }

    // ── 5. Insert demo responses ───────────────────────────────────────────────
    console.log('\n── Step 4: Survey responses')
    const vectors: number[][] = []
    const responseIds: string[] = []

    for (const emp of DEMO_EMPLOYEES) {
      // Check if response already exists
      const existing = await sql`
        SELECT id FROM questionnaire_responses
        WHERE questionnaire_id = ${questionnaireId} AND respondent_email = ${emp.email}
        LIMIT 1
      `
      if (existing.length > 0) {
        console.log(`   Skip (exists): ${emp.name}`)
        const vecRow = await sql`SELECT personality_vector FROM questionnaire_responses WHERE id = ${existing[0].id}`
        const vecStr = vecRow[0]?.personality_vector as string
        if (vecStr) {
          vectors.push(vecStr.slice(1, -1).split(',').map(Number))
          responseIds.push(existing[0].id as string)
        }
        continue
      }

      const vector = computePersonalityVector(emp.answers as Record<string, number>)
      const vecLiteral = `[${vector.join(',')}]`

      const [row] = await sql`
        INSERT INTO questionnaire_responses
          (questionnaire_id, respondent_name, respondent_email, status, answers, personality_vector, completed_at)
        VALUES (
          ${questionnaireId},
          ${emp.name},
          ${emp.email},
          'completed',
          ${JSON.stringify(emp.answers)},
          ${vecLiteral}::vector(14),
          NOW()
        )
        RETURNING id
      `
      vectors.push(vector)
      responseIds.push(row.id as string)
      console.log(`   Inserted: ${emp.name} (${vector.map((v) => v.toFixed(2)).join(', ')})`)
    }

    // Update response count on questionnaire
    await sql`
      UPDATE questionnaires SET total_responses = ${responseIds.length} WHERE id = ${questionnaireId}
    `

    if (vectors.length < 3) {
      console.error('\n✗ Need at least 3 responses for clustering')
      process.exit(1)
    }

    // ── 6. Create job record ───────────────────────────────────────────────────
    console.log('\n── Step 5: Clustering')
    const [job] = await sql`
      INSERT INTO jobs (type, status, company_id, entity_id, entity_type, metadata)
      VALUES ('cluster', 'running', ${companyId}, ${questionnaireId}, 'questionnaire', '{}')
      RETURNING id
    `
    const jobId = job.id as string

    // Run k-means++ with k=3
    const k = 3
    const clusters = kmeanspp(vectors, k)
    console.log(`   k-means++ complete: ${clusters.map((c, i) => `cluster${i}=${c.memberIndices.length}`).join(', ')}`)

    // ── 7. Generate personas via Groq ──────────────────────────────────────────
    console.log('\n── Step 6: Generating personas (Groq)')

    // Remove any existing personas for this questionnaire first
    await sql`DELETE FROM personas WHERE questionnaire_id = ${questionnaireId}`

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i]
      process.stdout.write(`   Persona ${i + 1}/${clusters.length}... `)

      const profile = await generatePersonaProfile(cluster, i, clusters.length)
      const vecLiteral = `[${cluster.centroid.join(',')}]`

      await sql`
        INSERT INTO personas
          (company_id, questionnaire_id, name, tagline, status, summary, system_prompt,
           personality_vector, cluster_id, cluster_size, generated_at, updated_at)
        VALUES (
          ${companyId},
          ${questionnaireId},
          ${profile.name},
          ${profile.tagline},
          'active',
          ${JSON.stringify(profile.summary)},
          ${profile.systemPrompt},
          ${vecLiteral}::vector(14),
          ${i},
          ${cluster.memberIndices.length},
          NOW(),
          NOW()
        )
      `
      console.log(profile.name)
    }

    // Mark job complete
    await sql`
      UPDATE jobs SET status = 'complete', completed_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────')
    console.log('✓ Seed complete')
    console.log('')
    console.log('  Login:       ' + BASE_URL + '/login')
    console.log('  Email:       ' + ADMIN_EMAIL)
    console.log('  Password:    ' + ADMIN_PASSWORD)
    console.log('  Survey URL:  ' + BASE_URL + '/survey/ACME2026')
    console.log('  Admin:       ' + BASE_URL + '/admin/personas')
    console.log('  Match:       ' + BASE_URL + '/match')
    console.log('')
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
