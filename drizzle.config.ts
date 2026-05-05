import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

export default defineConfig({
  schema: './lib/db/schema/index.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Direct connection (port 5432) for migrations only — NOT the pooler
    url: process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: true,
})
