#!/usr/bin/env tsx
// Test: new admin (ariel@ariel.com), small dataset (3 responses), auto-k behavior
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'
import { computePersonalityVector } from '../lib/vcpq/vector'
import { kmeanspp, optimalK, silhouetteScore } from '../lib/clustering/kmeans'
import { DIMENSIONS } from '../lib/vcpq/vector'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const DATABASE_URL = process.env.DATABASE_URL!

const EMAIL = 'ariel@ariel.com'
const PASSWORD = process.env.SEED_ADMIN_PASSWORD
if (!PASSWORD) { console.error('✗ SEED_ADMIN_PASSWORD env var required — add to .env.local'); process.exit(1) }
const NAME = 'Ariel'

const sql = postgres(DATABASE_URL, { prepare: false })

// 3 distinct employee profiles (small dataset)
const EMPLOYEES = [
  {
    name: 'Driven Leader',
    answers: { A1:5,A2:1,A3:4,A4:1,A5:3,A6:2,A7:2,A8:5,B1:5,B2:1,B3:2,B4:4,B5:4,B6:2,B7:4,B8:2,C1:2,C2:5,C3:1,C4:5,C5:2,C6:4,D1:5,D2:1,D3:5,D4:1,D5:5,D6:1 },
    demographics: { age: '36-45', relationship: 'married', children: '2', tenure: '7-15', work_style: 'office', level: 'senior_mgr' },
  },
  {
    name: 'Collaborative Team Player',
    answers: { A1:3,A2:3,A3:3,A4:3,A5:5,A6:1,A7:5,A8:1,B1:2,B2:4,B3:3,B4:3,B5:2,B6:4,B7:2,B8:4,C1:4,C2:2,C3:3,C4:3,C5:3,C6:2,D1:2,D2:4,D3:3,D4:3,D5:3,D6:3 },
    demographics: { age: '26-35', relationship: 'in a relationship', children: 'none', tenure: '1-3', work_style: 'hybrid', level: 'ic' },
  },
  {
    name: 'Detail-Focused Analyst',
    answers: { A1:2,A2:4,A3:5,A4:1,A5:1,A6:5,A7:3,A8:3,B1:3,B2:3,B3:5,B4:1,B5:5,B6:1,B7:5,B8:1,C1:3,C2:3,C3:2,C4:4,C5:1,C6:3,D1:2,D2:3,D3:5,D4:1,D5:4,D6:2 },
    demographics: { age: '26-35', relationship: 'single', children: 'none', tenure: '3-7', work_style: 'remote', level: 'lead' },
  },
]

async function run() {
  console.log('🧪 Test: new admin + small dataset (3 responses)\n')

  // ── Step 1: Register ariel@ariel.com ─────────────────────────────────────
  console.log('── Step 1: Register', EMAIL)
  const signupRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
  })
  const signupBody = await signupRes.json().catch(() => ({}))
  if (!signupRes.ok) {
    if (signupBody?.code === 'USER_ALREADY_EXISTS' || signupRes.status === 422) {
      console.log('   Already exists — signing in instead')
    } else {
      console.error('   Sign-up error:', JSON.stringify(signupBody))
      // Try signing in anyway
    }
  } else {
    console.log('   Created:', EMAIL)
  }

  // Sign in to get session
  const signinRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const signinBody = await signinRes.json().catch(() => ({}))
  if (!signinRes.ok) {
    console.error('   Sign-in failed:', JSON.stringify(signinBody))
    process.exit(1)
  }
  const userId = signinBody.user?.id
  console.log('   User ID:', userId)

  // ── Step 2: Company ──────────────────────────────────────────────────────
  console.log('\n── Step 2: Company')
  const existingCompany = await sql`SELECT id FROM companies WHERE slug = 'ariel-test'`
  let companyId: string
  if (existingCompany.length > 0) {
    companyId = existingCompany[0].id
    console.log('   Exists:', companyId)
  } else {
    const [co] = await sql`
      INSERT INTO companies (name, slug) VALUES ('Ariel Test Co', 'ariel-test')
      RETURNING id`
    companyId = co.id
    console.log('   Created:', companyId)
  }
  // Link user as company_admin
  await sql`UPDATE "user" SET company_id = ${companyId}, role = 'company_admin' WHERE id = ${userId}`
  console.log('   Admin role assigned')

  // ── Step 3: Questionnaire ────────────────────────────────────────────────
  console.log('\n── Step 3: Questionnaire')
  const existing = await sql`SELECT id FROM questionnaires WHERE access_code = 'ARIEL2026'`
  let qId: string
  if (existing.length > 0) {
    qId = existing[0].id
    await sql`DELETE FROM questionnaire_responses WHERE questionnaire_id = ${qId}`
    console.log('   Exists, cleared old responses')
  } else {
    const [q] = await sql`
      INSERT INTO questionnaires (company_id, name, access_code, status, total_responses)
      VALUES (${companyId}, 'Ariel Survey', 'ARIEL2026', 'active', 0)
      RETURNING id`
    qId = q.id
    console.log('   Created ARIEL2026')
  }

  // ── Step 4: 3 responses ──────────────────────────────────────────────────
  console.log('\n── Step 4: 3 survey responses')
  const vectors: number[][] = []
  for (const emp of EMPLOYEES) {
    const vec = computePersonalityVector(emp.answers as Record<string, number>)
    vectors.push(vec)
    await sql`
      INSERT INTO questionnaire_responses
        (questionnaire_id, respondent_name, status, answers, personality_vector, raw_survey_scores, demographics, completed_at)
      VALUES (
        ${qId}, ${emp.name}, 'completed',
        ${JSON.stringify(emp.answers)},
        ${JSON.stringify(vec)},
        ${JSON.stringify(emp.answers)},
        ${JSON.stringify(emp.demographics)},
        NOW()
      )`
    console.log(`   + ${emp.name}`)
  }
  await sql`UPDATE questionnaires SET total_responses = 3 WHERE id = ${qId}`

  // ── Step 5: auto-k on 3 vectors ─────────────────────────────────────────
  console.log('\n── Step 5: optimalK on 3 responses')
  const autoK = optimalK(vectors, 3, 10)
  console.log(`   → chosen k = ${autoK}`)

  // Show silhouette scores for all valid k values
  console.log('\n   Silhouette scores per k:')
  for (let k = 2; k <= Math.min(10, Math.floor(vectors.length / 2)); k++) {
    const clusters = kmeanspp(vectors, k)
    const score = silhouetteScore(vectors, clusters)
    console.log(`   k=${k}: score=${score.toFixed(4)} (${clusters.map(c => c.memberIndices.length).join('+')})`)
  }

  const clusters = kmeanspp(vectors, autoK)
  console.log(`\n   Clusters (k=${autoK}):`)
  clusters.forEach((c, i) => {
    console.log(`   cluster ${i}: ${c.memberIndices.length} member(s) — [${c.memberIndices.map(idx => EMPLOYEES[idx].name).join(', ')}]`)
  })

  // ── Step 6: Groq persona for each cluster ───────────────────────────────
  console.log('\n── Step 6: Generate personas (Groq)')
  for (let i = 0; i < clusters.length; i++) {
    const { centroid, memberIndices } = clusters[i]
    const dimensionLines = DIMENSIONS.map((d, idx) => `  ${d}: ${centroid[idx].toFixed(2)}`).join('\n')
    const clusterDemos = memberIndices.map(idx => EMPLOYEES[idx].demographics)
    const demoLines = Object.entries(clusterDemos[0]).map(([k, v]) => `  ${k}: ${v}`).join('\n')

    const prompt = `Generate a workplace persona profile for this cluster of ${memberIndices.length} employee(s).
Personality dimensions (scale -1 to 1):
${dimensionLines}
Typical demographics:
${demoLines}
Respond with ONLY valid JSON:
{"name":"...","tagline":"...","demographics":{"age":"...","relationship_status":"...","children":"...","tenure":"...","work_style":"...","level":"..."},"summary":{"overview":"...","strengths":["..."],"growthAreas":["..."]}}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
    })
    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    const text = data.choices[0].message.content.trim()
    try {
      const profile = JSON.parse(text) as { name: string; tagline: string; demographics: Record<string,string> }
      console.log(`\n   Persona ${i+1}: ${profile.name}`)
      console.log(`   Tagline: ${profile.tagline}`)
      console.log(`   Demographics: age=${profile.demographics?.age}, ${profile.demographics?.relationship_status}, ${profile.demographics?.children} kids, ${profile.demographics?.level}`)
    } catch {
      console.log(`   Persona ${i+1}: [parse error]`, text.slice(0, 100))
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log('✓ Test complete')
  console.log(`  Login: ${BASE_URL}/login`)
  console.log(`  Email: ${EMAIL} / Password: ${PASSWORD}`)
  console.log(`  k chosen: ${autoK} (from 3 responses)`)

  await sql.end()
}

run().catch(async (e) => {
  console.error(e)
  await sql.end()
  process.exit(1)
})
