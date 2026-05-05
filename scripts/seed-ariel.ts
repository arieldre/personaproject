#!/usr/bin/env tsx
/**
 * Seed ariel@ariel.com with a 30-person company and AI-generated personas.
 * Idempotent — safe to re-run.
 * Requires dev server running: npm run dev
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'
import { kmeanspp, optimalK, type Cluster } from '../lib/clustering/kmeans'
import { DIMENSIONS } from '../lib/vcpq/vector'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = process.env.GROQ_MODEL
if (!GROQ_MODEL) { console.error('✗ GROQ_MODEL env var not set'); process.exit(1) }
const DATABASE_URL = process.env.DATABASE_URL!

const USER_EMAIL = 'ariel@ariel.com'
const USER_PASSWORD = 'Ariel2026!'
const USER_NAME = 'Ariel'
const COMPANY_NAME = "Ariel's Company"
const COMPANY_SLUG = 'ariel-co'
const ACCESS_CODE = 'ARIEL2026'

function clamp(v: number) { return Math.max(-1, Math.min(1, v)) }

function seededNoise(seed: number, scale = 0.12): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return (x - Math.floor(x) - 0.5) * 2 * scale
}

const ARCHETYPES = [
  {
    label: 'Analytical Thinker',
    centroid: [-0.7, 0.9, -0.4, 0.1, 0.6, -0.4, 0.8, 0.6, -0.4, 0.8, -0.6, 0.1, 0.8, 0.8],
    members: [
      { name: 'Noah Kim',       email: 'noah@ariel-co.com' },
      { name: 'Leah Fischer',   email: 'leah@ariel-co.com' },
      { name: 'Sam Okonkwo',    email: 'sam@ariel-co.com' },
      { name: 'Zara Ahmed',     email: 'zara@ariel-co.com' },
      { name: 'Leon Braun',     email: 'leon@ariel-co.com' },
      { name: 'Hana Inoue',     email: 'hana@ariel-co.com' },
    ],
  },
  {
    label: 'Results Driver',
    centroid: [-0.3, 0.6, -0.4, -0.6, 0.9, -0.9, 0.4, 0.1, -0.9, 0.9, -0.9, 0.9, 0.6, 0.9],
    members: [
      { name: 'Maya Torres',    email: 'maya@ariel-co.com' },
      { name: 'Ethan Reeves',   email: 'ethan@ariel-co.com' },
      { name: 'Lina Bergström', email: 'lina@ariel-co.com' },
      { name: 'Omar Khalil',    email: 'omar@ariel-co.com' },
      { name: 'Rachel Green',   email: 'rachel@ariel-co.com' },
      { name: 'Chris Dubois',   email: 'chris@ariel-co.com' },
    ],
  },
  {
    label: 'Collaborative Connector',
    centroid: [0.1, 0.0, 0.9, 0.8, -0.8, 0.8, 0.0, -0.4, 0.8, -0.4, 0.8, -0.8, 0.0, 0.1],
    members: [
      { name: 'Sofia Romero',   email: 'sofia@ariel-co.com' },
      { name: 'James Patel',    email: 'james@ariel-co.com' },
      { name: 'Nadia Volkov',   email: 'nadia@ariel-co.com' },
      { name: 'Tom Eriksson',   email: 'tom@ariel-co.com' },
      { name: 'Mei Lin',        email: 'mei@ariel-co.com' },
      { name: 'Ali Hassan',     email: 'ali@ariel-co.com' },
    ],
  },
  {
    label: 'Creative Disruptor',
    centroid: [0.9, -0.3, 0.5, 0.3, 0.1, 0.1, -0.8, -0.4, 0.1, 0.1, 0.1, -0.3, -0.4, 0.1],
    members: [
      { name: 'River Chang',    email: 'river@ariel-co.com' },
      { name: 'Iris Vasquez',   email: 'iris@ariel-co.com' },
      { name: 'Finn O\'Neill',  email: 'finn@ariel-co.com' },
      { name: 'Tara Mehra',     email: 'tara@ariel-co.com' },
      { name: 'Sven Larsson',   email: 'sven@ariel-co.com' },
      { name: 'Zoe Nguyen',     email: 'zoe@ariel-co.com' },
    ],
  },
  {
    label: 'Methodical Expert',
    centroid: [0.8, 0.5, -0.3, -0.3, 0.4, -0.4, 0.1, 0.8, -0.8, 0.8, -0.8, 0.4, 0.8, 0.6],
    members: [
      { name: 'David Weiss',    email: 'david@ariel-co.com' },
      { name: 'Priya Menon',    email: 'priya@ariel-co.com' },
      { name: 'Hugo Becker',    email: 'hugo@ariel-co.com' },
      { name: 'Amara Diallo',   email: 'amara@ariel-co.com' },
      { name: 'Kai Fujimoto',   email: 'kai@ariel-co.com' },
      { name: 'Rosa Castillo',  email: 'rosa@ariel-co.com' },
    ],
  },
]

const EMPLOYEES = ARCHETYPES.flatMap((arch) =>
  arch.members.map((m, idx) => ({
    name: m.name,
    email: m.email,
    vector: arch.centroid.map((v, dim) =>
      clamp(v + seededNoise(idx * 14 + dim))
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
      yearsExperience: string
      seniorityLevel: string
      typicalRole: string
      background: string
    }
    personality: {
      communicationStyle: string
      workStyle: string
      motivators: string[]
      stressors: string[]
      decisionMaking: string
    }
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
      "yearsExperience": "e.g. 8-15 years",
      "seniorityLevel": "e.g. Senior IC / Team Lead",
      "typicalRole": "e.g. Engineering Manager, Product Lead",
      "background": "1 sentence on typical education/career background"
    },
    "personality": {
      "communicationStyle": "1 sentence",
      "workStyle": "1 sentence",
      "motivators": ["motivator1", "motivator2", "motivator3"],
      "stressors": ["stressor1", "stressor2"],
      "decisionMaking": "1 sentence"
    },
    "interactionTips": ["tip1", "tip2", "tip3"]
  },
  "systemPrompt": "You are [persona name]. [2-3 sentences of in-character behavioral guidance for an AI to embody this persona in workplace conversations. Focus on communication style, decision-making approach, and interpersonal tendencies.]"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 1000, temperature: 0.7 }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const cleaned = data.choices[0].message.content.trim()
    .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned) as PersonaProfile
}

async function main() {
  console.log('🌱 Seed — ariel@ariel.com (30 employees)')
  console.log(`   Server: ${BASE_URL}\n`)

  if (!DATABASE_URL) { console.error('✗ DATABASE_URL not set'); process.exit(1) }
  if (!GROQ_API_KEY) { console.error('✗ GROQ_API_KEY not set'); process.exit(1) }

  const sql = postgres(DATABASE_URL, { prepare: false })

  try {
    // ── 1. User ──────────────────────────────────────────────────────────────
    console.log('── Step 1: User')
    let userId: string | null = null

    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
      body: JSON.stringify({ name: USER_NAME, email: USER_EMAIL, password: USER_PASSWORD }),
    })
    const signUpBody = await signUpRes.json() as { user?: { id: string }; code?: string; message?: string }

    if (signUpRes.ok && signUpBody.user?.id) {
      userId = signUpBody.user.id
      console.log(`   Created: ${USER_EMAIL}`)
    } else if (signUpBody.code === 'USER_ALREADY_EXISTS' || signUpBody.message?.includes('already exists')) {
      const rows = await sql`SELECT id FROM "user" WHERE email = ${USER_EMAIL} LIMIT 1`
      userId = rows[0]?.id ?? null
      console.log(`   Exists: ${USER_EMAIL}`)
    } else {
      throw new Error(`Sign-up failed: ${JSON.stringify(signUpBody)}`)
    }
    if (!userId) throw new Error('Could not resolve user ID')

    // ── 2. Company ───────────────────────────────────────────────────────────
    console.log('\n── Step 2: Company')
    const existingCo = await sql`SELECT id FROM companies WHERE slug = ${COMPANY_SLUG} LIMIT 1`
    let companyId: string

    if (existingCo.length > 0) {
      companyId = existingCo[0].id as string
      console.log(`   Exists: ${COMPANY_NAME}`)
    } else {
      const [co] = await sql`
        INSERT INTO companies (name, slug, industry, company_size, subscription_status, license_count, created_by)
        VALUES (${COMPANY_NAME}, ${COMPANY_SLUG}, 'Technology', '10-50', 'trial', 30, ${userId})
        RETURNING id
      `
      companyId = co.id as string
      console.log(`   Created: ${COMPANY_NAME}`)
    }

    await sql`UPDATE "user" SET role = 'company_admin', company_id = ${companyId} WHERE id = ${userId}`
    console.log(`   company_admin role assigned`)

    // ── 3. Questionnaire ─────────────────────────────────────────────────────
    console.log('\n── Step 3: Questionnaire')
    const existingQ = await sql`SELECT id FROM questionnaires WHERE access_code = ${ACCESS_CODE} LIMIT 1`
    let questionnaireId: string

    if (existingQ.length > 0) {
      questionnaireId = existingQ[0].id as string
      console.log(`   Exists: ${ACCESS_CODE}`)
    } else {
      const [q] = await sql`
        INSERT INTO questionnaires (company_id, name, description, status, access_code, is_anonymous, domain_context, created_by)
        VALUES (${companyId}, 'Team Personality Assessment 2026', 'Baseline VCPQ assessment.', 'active', ${ACCESS_CODE}, false, 'Technology', ${userId})
        RETURNING id
      `
      questionnaireId = q.id as string
      console.log(`   Created: ${ACCESS_CODE}`)
    }

    // ── 4. 30 employee responses ─────────────────────────────────────────────
    console.log('\n── Step 4: Employee responses (30)')
    const allVectors: number[][] = []
    const allResponseIds: string[] = []

    for (const emp of EMPLOYEES) {
      const existing = await sql`
        SELECT id, personality_vector FROM questionnaire_responses
        WHERE questionnaire_id = ${questionnaireId} AND respondent_email = ${emp.email} LIMIT 1
      `
      if (existing.length > 0) {
        const vecStr = existing[0].personality_vector as string
        if (vecStr) {
          allVectors.push(vecStr.slice(1, -1).split(',').map(Number))
          allResponseIds.push(existing[0].id as string)
        }
        process.stdout.write('·')
        continue
      }
      const [row] = await sql`
        INSERT INTO questionnaire_responses
          (questionnaire_id, respondent_name, respondent_email, status, answers, personality_vector, completed_at)
        VALUES
          (${questionnaireId}, ${emp.name}, ${emp.email}, 'completed', '{}', ${`[${emp.vector.join(',')}]`}::vector(14), NOW())
        RETURNING id
      `
      allVectors.push(emp.vector)
      allResponseIds.push(row.id as string)
      process.stdout.write('+')
    }
    console.log(`\n   Total: ${allResponseIds.length} responses`)
    await sql`UPDATE questionnaires SET total_responses = ${allResponseIds.length} WHERE id = ${questionnaireId}`

    // ── 5. Clustering ────────────────────────────────────────────────────────
    const autoK = optimalK(allVectors, 3, 8)
    console.log(`\n── Step 5: Clustering (k=${autoK})`)
    const [job] = await sql`
      INSERT INTO jobs (type, status, company_id, entity_id, entity_type, metadata)
      VALUES ('cluster', 'running', ${companyId}, ${questionnaireId}, 'questionnaire', '{}')
      RETURNING id
    `
    const clusters = kmeanspp(allVectors, autoK)
    console.log(`   ${clusters.map((c, i) => `cluster${i}=${c.memberIndices.length}`).join(', ')}`)

    // ── 6. Personas ──────────────────────────────────────────────────────────
    console.log(`\n── Step 6: Generating ${clusters.length} personas (Groq)`)

    // Skip if personas already exist — DELETE+re-insert cascades conversations (FK onDelete:cascade)
    const [{ count: existingPersonas }] = await sql<[{ count: string }]>`
      SELECT COUNT(*)::text AS count FROM personas WHERE questionnaire_id = ${questionnaireId}
    `
    if (parseInt(existingPersonas, 10) > 0) {
      console.log(`   Skipping — ${existingPersonas} personas already exist (re-run would wipe chat history)`)
    } else {
    for (let i = 0; i < clusters.length; i++) {
      process.stdout.write(`   Persona ${i + 1}/${clusters.length}... `)
      const profile = await generatePersonaProfile(clusters[i], i, clusters.length)
      await sql`
        INSERT INTO personas (company_id, questionnaire_id, name, tagline, status, summary, system_prompt, personality_vector, cluster_id, cluster_size, generated_at, updated_at)
        VALUES (${companyId}, ${questionnaireId}, ${profile.name}, ${profile.tagline}, 'active',
                ${JSON.stringify(profile.summary)}, ${profile.systemPrompt},
                ${`[${clusters[i].centroid.join(',')}]`}::vector(14),
                ${i}, ${clusters[i].memberIndices.length}, NOW(), NOW())
      `
      console.log(profile.name)
    }
    } // end persona-generation skip guard

    await sql`UPDATE jobs SET status = 'complete', completed_at = NOW(), updated_at = NOW() WHERE id = ${job.id}`

    // ── Done ─────────────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────')
    console.log('✓ Seed complete')
    console.log('')
    console.log('  Login:      ' + BASE_URL + '/login')
    console.log('  Email:      ' + USER_EMAIL)
    console.log('  Password:   ' + USER_PASSWORD)
    console.log('  Survey URL: ' + BASE_URL + '/survey/' + ACCESS_CODE)
    console.log('  Personas:   ' + BASE_URL + '/admin/personas')
    console.log('  Match:      ' + BASE_URL + '/match')
    console.log('')
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
