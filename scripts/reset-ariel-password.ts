#!/usr/bin/env tsx
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'

const BASE_URL = 'https://personaproject-one.vercel.app'
const EMAIL = 'ariel@ariel.com'
const NEW_PASSWORD = process.env.RESET_PASSWORD
if (!NEW_PASSWORD) { console.error('✗ RESET_PASSWORD env var required — add to .env.local'); process.exit(1) }

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false })

  try {
    // Delete existing user so Vercel auth creates a fresh hash
    const users = await sql`SELECT id FROM "user" WHERE email = ${EMAIL}`
    if (users.length) {
      const id = users[0].id as string
      await sql`DELETE FROM account WHERE user_id = ${id}`
      await sql`DELETE FROM session WHERE user_id = ${id}`
      await sql`UPDATE "user" SET company_id = NULL, role = 'user' WHERE id = ${id}`
      await sql`DELETE FROM "user" WHERE id = ${id}`
      console.log('Deleted old user:', id)
    } else {
      console.log('No existing user — creating fresh')
    }

    // Recreate via Vercel auth (correct BETTER_AUTH_SECRET hash)
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
      body: JSON.stringify({ name: 'Ariel', email: EMAIL, password: NEW_PASSWORD }),
    })
    const body = await res.json() as { user?: { id: string }; message?: string }
    if (!res.ok) throw new Error(JSON.stringify(body))

    const userId = body.user!.id
    console.log('Created user:', userId)

    // Re-link to existing company
    const co = await sql`SELECT id FROM companies WHERE slug = 'ariel-co' LIMIT 1`
    if (co.length) {
      await sql`UPDATE "user" SET role = 'company_admin', company_id = ${co[0].id} WHERE id = ${userId}`
      console.log('Re-linked to company ariel-co')
    }

    console.log('\n✓ Done')
    console.log('  URL:      ' + BASE_URL + '/login')
    console.log('  Email:    ' + EMAIL)
    console.log('  Password: ' + NEW_PASSWORD)
  } finally {
    await sql.end()
  }
}

main().catch(e => { console.error('✗', e.message); process.exit(1) })
