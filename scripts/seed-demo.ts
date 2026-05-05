#!/usr/bin/env tsx
/**
 * Demo seed script — idempotent.
 * Requires dev server running: npm run dev
 * Usage: npx tsx scripts/seed-demo.ts  OR  npm run seed
 *
 * Creates: company · admin user · questionnaire · 25 survey responses · 5 personas (Groq) · training history
 */

// dotenv.config runs BEFORE any connection is made — postgres.js only connects on first query
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'
import { computePersonalityVector } from '../lib/vcpq/vector'
import { kmeanspp, optimalK, type Cluster } from '../lib/clustering/kmeans'
import { DIMENSIONS } from '../lib/vcpq/vector'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const DATABASE_URL = process.env.DATABASE_URL!

const ADMIN_EMAIL = 'admin@acme-demo.com'
const ADMIN_PASSWORD = 'AcmeDemo123!'
const ADMIN_NAME = 'Demo Admin'

// ── 7 fully-specified employees (real answers → real vectors) ────────────────

const DETAILED_EMPLOYEES = [
  {
    name: 'Alice Chen', email: 'alice@acme-demo.com',
    answers: { A1: 1, A2: 5, A3: 5, A4: 1, A5: 2, A6: 4, A7: 3, A8: 3, B1: 4, B2: 2, B3: 2, B4: 4, B5: 5, B6: 1, B7: 4, B8: 2, C1: 2, C2: 4, C3: 1, C4: 5, C5: 1, C6: 4, D1: 3, D2: 3, D3: 5, D4: 1, D5: 5, D6: 1 },
  },
  {
    name: "Dave O'Brien", email: 'dave@acme-demo.com',
    answers: { A1: 2, A2: 4, A3: 4, A4: 2, A5: 2, A6: 4, A7: 2, A8: 4, B1: 5, B2: 1, B3: 1, B4: 5, B5: 4, B6: 2, B7: 3, B8: 3, C1: 1, C2: 5, C3: 1, C4: 5, C5: 1, C6: 5, D1: 5, D2: 1, D3: 4, D4: 2, D5: 5, D6: 1 },
  },
  {
    name: 'Grace Park', email: 'grace@acme-demo.com',
    answers: { A1: 2, A2: 4, A3: 5, A4: 1, A5: 3, A6: 3, A7: 3, A8: 3, B1: 3, B2: 3, B3: 4, B4: 2, B5: 4, B6: 2, B7: 3, B8: 3, C1: 4, C2: 2, C3: 2, C4: 4, C5: 3, C6: 3, D1: 2, D2: 4, D3: 5, D4: 1, D5: 4, D6: 2 },
  },
  {
    name: 'Carol Singh', email: 'carol@acme-demo.com',
    answers: { A1: 3, A2: 3, A3: 3, A4: 3, A5: 5, A6: 1, A7: 5, A8: 1, B1: 1, B2: 5, B3: 5, B4: 1, B5: 3, B6: 3, B7: 2, B8: 4, C1: 5, C2: 1, C3: 4, C4: 2, C5: 5, C6: 1, D1: 1, D2: 5, D3: 3, D4: 3, D5: 3, D6: 3 },
  },
  {
    name: 'Emma Wilson', email: 'emma@acme-demo.com',
    answers: { A1: 3, A2: 3, A3: 2, A4: 3, A5: 5, A6: 1, A7: 5, A8: 1, B1: 2, B2: 4, B3: 4, B4: 2, B5: 2, B6: 4, B7: 2, B8: 4, C1: 4, C2: 2, C3: 4, C4: 2, C5: 4, C6: 2, D1: 1, D2: 5, D3: 3, D4: 3, D5: 3, D6: 4 },
  },
  {
    name: 'Bob Martinez', email: 'bob@acme-demo.com',
    answers: { A1: 5, A2: 1, A3: 2, A4: 4, A5: 4, A6: 2, A7: 4, A8: 2, B1: 3, B2: 3, B3: 3, B4: 3, B5: 1, B6: 5, B7: 2, B8: 4, C1: 3, C2: 3, C3: 3, C4: 3, C5: 3, C6: 3, D1: 2, D2: 4, D3: 2, D4: 4, D5: 3, D6: 3 },
  },
  {
    name: 'Frank Liu', email: 'frank@acme-demo.com',
    answers: { A1: 5, A2: 1, A3: 4, A4: 2, A5: 2, A6: 4, A7: 2, A8: 4, B1: 4, B2: 2, B3: 2, B4: 4, B5: 3, B6: 3, B7: 5, B8: 1, C1: 1, C2: 5, C3: 1, C4: 5, C5: 1, C6: 5, D1: 4, D2: 2, D3: 5, D4: 1, D5: 4, D6: 2 },
  },
]

// ── 18 additional employees generated from 5 archetype centroids ─────────────
// Each archetype has ~3-4 employees with slight variations (±0.15 noise)

function clamp(v: number) { return Math.max(-1, Math.min(1, v)) }

// 14 dims: innovation, diligence, social_energy, agreeableness, directness, verbosity,
//          formality, jargon_density, deference, autonomy, sycophancy, conflict_mode,
//          decision_basis, stress_resilience
const ARCHETYPES: { label: string; centroid: number[]; names: string[]; emails: string[] }[] = [
  {
    label: 'Analytical Conservative',
    centroid: [-0.8, 0.9, -0.5, 0.0, 0.5, -0.5, 0.9, 0.5, -0.5, 0.9, -0.7, 0.0, 0.9, 0.9],
    names: ['Priya Nair', 'Thomas Müller', 'Sarah Kowalski'],
    emails: ['priya@acme-demo.com', 'thomas@acme-demo.com', 'sarah@acme-demo.com'],
  },
  {
    label: 'Decisive Executor',
    centroid: [-0.4, 0.5, -0.5, -0.5, 1.0, -1.0, 0.5, 0.0, -1.0, 1.0, -1.0, 1.0, 0.5, 1.0],
    names: ['James Okafor', 'Natasha Popov', 'Carlos Reyes', 'Ling Wei'],
    emails: ['james@acme-demo.com', 'natasha@acme-demo.com', 'carlos@acme-demo.com', 'ling@acme-demo.com'],
  },
  {
    label: 'Diplomatic Facilitator',
    centroid: [0.0, 0.0, 0.9, 0.9, -0.9, 0.9, 0.0, -0.5, 0.9, -0.5, 0.9, -0.9, 0.0, 0.0],
    names: ['Sophie Laurent', 'Amir Hassan', 'Yuki Tanaka', 'Fatima Al-Rashid'],
    emails: ['sophie@acme-demo.com', 'amir@acme-demo.com', 'yuki@acme-demo.com', 'fatima@acme-demo.com'],
  },
  {
    label: 'Innovative Creator',
    centroid: [0.9, -0.4, 0.5, 0.4, 0.0, 0.0, -0.9, -0.5, 0.0, 0.0, 0.0, -0.4, -0.5, 0.0],
    names: ['Maya Goldstein', 'Ravi Sharma', 'Isla McKenzie'],
    emails: ['maya@acme-demo.com', 'ravi@acme-demo.com', 'isla@acme-demo.com'],
  },
  {
    label: 'Technical Expert',
    centroid: [0.9, 0.4, -0.4, -0.4, 0.5, -0.5, 0.0, 0.9, -0.9, 0.9, -0.9, 0.5, 0.9, 0.5],
    names: ['Kai Nakamura', 'Elena Vasquez', 'Mikkel Hansen', 'Jin Park'],
    emails: ['kai@acme-demo.com', 'elena@acme-demo.com', 'mikkel@acme-demo.com', 'jin@acme-demo.com'],
  },
]

// Seeded noise so runs are deterministic
function seededNoise(seed: number, scale = 0.15): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return (x - Math.floor(x) - 0.5) * 2 * scale
}

const SYNTHETIC_EMPLOYEES = ARCHETYPES.flatMap((arch) =>
  arch.names.map((name, idx) => ({
    name,
    email: arch.emails[idx],
    vector: arch.centroid.map((v, dim) =>
      clamp(v + seededNoise(arch.names.indexOf(name) * 14 + dim))
    ),
  }))
)

interface PersonaProfile {
  name: string
  tagline: string
  summary: {
    overview: string
    strengths: string[]
    growthAreas: string[]
    demographics: {
      gender: string
      ageRange: string
      familySituation: string
      location: string
      yearsExperience: string
      seniorityLevel: string
      typicalRole: string
      background: string
    }
    personality: {
      communicationStyle: string
      workStyle: string
      decisionMaking: string
    }
    motivators: string[]
    stressors: string[]
    interactionTips: string[]
  }
  systemPrompt: string
}

async function generatePersonaProfile(cluster: Cluster, index: number, total: number): Promise<PersonaProfile> {
  const dimensionLines = DIMENSIONS.map((d, i) => `  ${d}: ${cluster.centroid[i].toFixed(2)}`).join('\n')
  const prompt = `You are building personality personas for a workplace tool. Based on this cluster data, generate a professional persona profile.

Cluster ${index + 1} of ${total}: ${cluster.memberIndices.length} employees
Centroid personality dimensions (scale -1 to 1):
  innovation: creative/experimental (+1) vs conventional/risk-averse (-1)
  diligence: thorough/detail-oriented (+1) vs fast/done-is-good (-1)
  social_energy: energized by people (+1) vs drained by people (-1)
  agreeableness: warm/cooperative (+1) vs blunt/competitive (-1)
  directness: straight-to-point (+1) vs diplomatic/indirect (-1)
  verbosity: elaborate communicator (+1) vs terse/minimal (-1)
  formality: formal/structured (+1) vs casual/informal (-1)
  jargon_density: heavy technical language (+1) vs plain language (-1)
  deference: defers to authority/consensus (+1) vs challenges authority (-1)
  autonomy: self-directed/independent (+1) vs team-dependent (-1)
  sycophancy: affirming/agreeable (+1) vs candid/challenging (-1)
  conflict_mode: addresses conflict head-on (+1) vs avoids conflict (-1)
  decision_basis: data/logic-driven (+1) vs intuition/values-driven (-1)
  stress_resilience: calm under pressure (+1) vs reactive under pressure (-1)
${dimensionLines}

Respond with ONLY valid JSON (no markdown):
{
  "name": "A descriptive persona name (e.g. 'The Analytical Architect')",
  "tagline": "One sentence describing this persona type (max 100 chars)",
  "summary": {
    "overview": "2-3 sentence overview of this persona",
    "strengths": ["strength1", "strength2", "strength3"],
    "growthAreas": ["area1", "area2"],
    "demographics": {
      "gender": "male or female",
      "ageRange": "e.g. 32-42",
      "familySituation": "e.g. married with 2 kids / single / in a relationship",
      "location": "e.g. Tel Aviv, Israel",
      "yearsExperience": "e.g. 8-15 years",
      "seniorityLevel": "e.g. Senior IC / Team Lead",
      "typicalRole": "e.g. Engineering Manager, Product Lead",
      "background": "1 sentence on typical education/career background"
    },
    "personality": {
      "communicationStyle": "1 sentence",
      "workStyle": "1 sentence",
      "decisionMaking": "1 sentence"
    },
    "motivators": ["motivator1", "motivator2", "motivator3"],
    "stressors": ["stressor1", "stressor2"],
    "interactionTips": ["tip1", "tip2", "tip3"]
  },
  "systemPrompt": "You are [persona name]. [2-3 sentences of in-character behavioral guidance for an AI to embody this persona in workplace conversations. Focus on communication style, decision-making approach, and interpersonal tendencies.]"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 1000, temperature: 0.7 }),
  })

  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${await res.text()}`)

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const cleaned = data.choices[0].message.content.trim()
    .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned) as PersonaProfile
}

async function checkServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    return res.status !== 0
  } catch { return false }
}

async function main() {
  console.log('🌱 Persona Platform — Demo Seed (25 employees, 5 personas)')
  console.log(`   Server: ${BASE_URL}\n`)

  const serverUp = await checkServerRunning()
  if (!serverUp) { console.error('✗ Dev server not running. Start it first: npm run dev'); process.exit(1) }
  console.log('✓ Dev server reachable')

  if (!DATABASE_URL) { console.error('✗ DATABASE_URL not set'); process.exit(1) }
  if (!GROQ_API_KEY) { console.error('✗ GROQ_API_KEY not set'); process.exit(1) }

  const sql = postgres(DATABASE_URL, { prepare: false })

  try {
    // ── 1. Admin user ────────────────────────────────────────────────────────
    console.log('\n── Step 1: Admin user')
    let adminUserId: string | null = null

    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
      body: JSON.stringify({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    })
    const signUpBody = await signUpRes.json() as { user?: { id: string }; code?: string; message?: string }

    if (signUpRes.ok && signUpBody.user?.id) {
      adminUserId = signUpBody.user.id
      console.log(`   Created: ${ADMIN_EMAIL}`)
    } else if (signUpBody.code === 'USER_ALREADY_EXISTS' || signUpBody.message?.includes('already exists')) {
      const rows = await sql`SELECT id FROM "user" WHERE email = ${ADMIN_EMAIL} LIMIT 1`
      adminUserId = rows[0]?.id ?? null
      console.log(`   Exists: ${ADMIN_EMAIL}`)
    } else {
      throw new Error(`Sign-up failed: ${JSON.stringify(signUpBody)}`)
    }
    if (!adminUserId) throw new Error('Could not resolve admin user ID')

    // ── 2. Company ───────────────────────────────────────────────────────────
    console.log('\n── Step 2: Company')
    const existingCo = await sql`SELECT id FROM companies WHERE slug = 'acme-demo' LIMIT 1`
    let companyId: string

    if (existingCo.length > 0) {
      companyId = existingCo[0].id as string
      console.log(`   Exists: Acme Technology`)
    } else {
      const [co] = await sql`
        INSERT INTO companies (name, slug, industry, company_size, subscription_status, license_count, created_by)
        VALUES ('Acme Technology', 'acme-demo', 'Technology', '50-200', 'active', 50, ${adminUserId})
        RETURNING id
      `
      companyId = co.id as string
      console.log(`   Created: Acme Technology`)
    }

    await sql`UPDATE "user" SET role = 'company_admin', company_id = ${companyId} WHERE id = ${adminUserId}`
    console.log(`   Admin role assigned`)

    // ── 3. Questionnaire ─────────────────────────────────────────────────────
    console.log('\n── Step 3: Questionnaire')
    const existingQ = await sql`SELECT id FROM questionnaires WHERE access_code = 'ACME2026' LIMIT 1`
    let questionnaireId: string

    if (existingQ.length > 0) {
      questionnaireId = existingQ[0].id as string
      console.log(`   Exists: ACME2026`)
    } else {
      const [q] = await sql`
        INSERT INTO questionnaires (company_id, name, description, status, access_code, is_anonymous, domain_context, created_by)
        VALUES (${companyId}, 'Acme Team Assessment Q1 2026', 'Baseline personality assessment.', 'active', 'ACME2026', false, 'Technology', ${adminUserId})
        RETURNING id
      `
      questionnaireId = q.id as string
      console.log(`   Created: ACME2026`)
    }

    // ── 4. Survey responses ──────────────────────────────────────────────────
    console.log('\n── Step 4: Survey responses (25 employees)')
    const allVectors: number[][] = []
    const allResponseIds: string[] = []

    // 4a. Detailed employees (computed from answers)
    for (const emp of DETAILED_EMPLOYEES) {
      const existing = await sql`
        SELECT id, personality_vector FROM questionnaire_responses
        WHERE questionnaire_id = ${questionnaireId} AND respondent_email = ${emp.email} LIMIT 1
      `
      if (existing.length > 0) {
        const vecStr = existing[0].personality_vector as string
        if (vecStr) { allVectors.push(vecStr.slice(1, -1).split(',').map(Number)); allResponseIds.push(existing[0].id as string) }
        process.stdout.write('·')
        continue
      }
      const vector = computePersonalityVector(emp.answers as Record<string, number>)
      const [row] = await sql`
        INSERT INTO questionnaire_responses (questionnaire_id, respondent_name, respondent_email, status, answers, personality_vector, completed_at)
        VALUES (${questionnaireId}, ${emp.name}, ${emp.email}, 'completed', ${JSON.stringify(emp.answers)}, ${`[${vector.join(',')}]`}::vector(14), NOW())
        RETURNING id
      `
      allVectors.push(vector); allResponseIds.push(row.id as string)
      process.stdout.write('+')
    }

    // 4b. Synthetic employees (vectors directly)
    for (const emp of SYNTHETIC_EMPLOYEES) {
      const existing = await sql`
        SELECT id, personality_vector FROM questionnaire_responses
        WHERE questionnaire_id = ${questionnaireId} AND respondent_email = ${emp.email} LIMIT 1
      `
      if (existing.length > 0) {
        const vecStr = existing[0].personality_vector as string
        if (vecStr) { allVectors.push(vecStr.slice(1, -1).split(',').map(Number)); allResponseIds.push(existing[0].id as string) }
        process.stdout.write('·')
        continue
      }
      const [row] = await sql`
        INSERT INTO questionnaire_responses (questionnaire_id, respondent_name, respondent_email, status, answers, personality_vector, completed_at)
        VALUES (${questionnaireId}, ${emp.name}, ${emp.email}, 'completed', '{}', ${`[${emp.vector.join(',')}]`}::vector(14), NOW())
        RETURNING id
      `
      allVectors.push(emp.vector); allResponseIds.push(row.id as string)
      process.stdout.write('+')
    }

    console.log(`\n   Total: ${allResponseIds.length} responses`)
    await sql`UPDATE questionnaires SET total_responses = ${allResponseIds.length} WHERE id = ${questionnaireId}`

    // ── 5. Clustering ────────────────────────────────────────────────────────
    const autoK = optimalK(allVectors, 3, 10)
    console.log('\n── Step 5: Clustering (auto k=' + autoK + ')')
    const [job] = await sql`
      INSERT INTO jobs (type, status, company_id, entity_id, entity_type, metadata)
      VALUES ('cluster', 'running', ${companyId}, ${questionnaireId}, 'questionnaire', '{}')
      RETURNING id
    `
    const clusters = kmeanspp(allVectors, autoK)
    console.log(`   ${clusters.map((c, i) => `cluster${i}=${c.memberIndices.length}`).join(', ')}`)

    // ── 6. Personas ──────────────────────────────────────────────────────────
    console.log('\n── Step 6: Generating 5 personas (Groq)')
    await sql`DELETE FROM personas WHERE questionnaire_id = ${questionnaireId}`

    const personaIds: string[] = []
    for (let i = 0; i < clusters.length; i++) {
      process.stdout.write(`   Persona ${i + 1}/5... `)
      const profile = await generatePersonaProfile(clusters[i], i, clusters.length)
      const [p] = await sql`
        INSERT INTO personas (company_id, questionnaire_id, name, tagline, status, summary, system_prompt, personality_vector, cluster_id, cluster_size, generated_at, updated_at)
        VALUES (${companyId}, ${questionnaireId}, ${profile.name}, ${profile.tagline}, 'active', ${JSON.stringify(profile.summary)}, ${profile.systemPrompt}, ${`[${clusters[i].centroid.join(',')}]`}::vector(14), ${i}, ${clusters[i].memberIndices.length}, NOW(), NOW())
        RETURNING id
      `
      personaIds.push(p.id as string)
      console.log(profile.name)
    }

    await sql`UPDATE jobs SET status = 'complete', completed_at = NOW(), updated_at = NOW() WHERE id = ${job.id}`

    // ── 7. Training history ──────────────────────────────────────────────────
    console.log('\n── Step 7: Training history')
    await sql`DELETE FROM training_sessions WHERE user_id = ${adminUserId}`

    const scenarioIds = ['conflict-resolution-beginner', 'feedback-delivery-intermediate', 'change-management-beginner']
    let sessionCount = 0

    for (let pi = 0; pi < Math.min(3, personaIds.length); pi++) {
      const scenarioId = scenarioIds[pi % scenarioIds.length]
      const messages = [
        { role: 'user', content: 'I wanted to discuss the project timeline with you.' },
        { role: 'assistant', content: 'Of course. What specifically concerns you about the timeline?' },
        { role: 'user', content: "I think we're moving too fast and the team is stressed." },
        { role: 'assistant', content: "That's a valid concern. Let me share what I'm seeing from a delivery perspective." },
      ]
      await sql`
        INSERT INTO training_sessions (user_id, persona_id, scenario_id, messages, grade_result, overall_score)
        VALUES (
          ${adminUserId}, ${personaIds[pi]}, ${scenarioId},
          ${JSON.stringify(messages)},
          ${JSON.stringify({ communication: 'Good active listening', empathy: 'Acknowledged stress', problemSolving: 'Opened dialogue', professionalism: 'Stayed composed' })},
          ${72 + pi * 5}
        )
      `
      sessionCount++
    }
    console.log(`   Created ${sessionCount} training sessions`)

    // ── Summary ──────────────────────────────────────────────────────────────
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
