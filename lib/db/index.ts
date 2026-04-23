import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Supavisor transaction mode (port 6543) — required for Vercel serverless
// `prepare: false` because transaction mode doesn't support prepared statements
const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

export type Database = typeof db
