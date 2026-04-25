import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

interface RateLimitResult {
  allowed: boolean
  count: number
}

/**
 * DB-backed sliding window rate limiter.
 * Upserts a single row per user — atomic across all Vercel function instances.
 * Falls back to allowing the request if the DB is unavailable.
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const windowSec = WINDOW_MS / 1000

  try {
    // Atomic upsert: reset count if window expired, otherwise increment
    const rows = await db.execute(sql`
      INSERT INTO rate_limits (user_id, window_start, count)
      VALUES (${userId}, NOW(), 1)
      ON CONFLICT (user_id) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start > NOW() - (${windowSec} || ' seconds')::interval
            THEN rate_limits.count + 1
          ELSE 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start > NOW() - (${windowSec} || ' seconds')::interval
            THEN rate_limits.window_start
          ELSE NOW()
        END
      RETURNING count
    `)

    const count = (rows[0] as { count: number })?.count ?? 1
    return { allowed: count <= MAX_REQUESTS, count }
  } catch {
    // DB unavailable — fail open (allow request, log for ops)
    console.warn('[rate-limit] DB unavailable, failing open for user:', userId)
    return { allowed: true, count: 0 }
  }
}
