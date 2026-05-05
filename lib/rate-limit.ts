import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const MINUTE_WINDOW_SEC = 60
const MINUTE_MAX = 20

const DAY_WINDOW_SEC = 86_400
const DAY_MAX = 200

interface RateLimitResult {
  allowed: boolean
  count: number
}

/**
 * DB-backed sliding window rate limiter.
 * Enforces two independent limits per user, each stored as a namespaced row:
 *   - "chat:<userId>"      → 20 messages per minute
 *   - "chat:day:<userId>"  → 200 messages per day
 * Both use atomic upserts — safe across all Vercel function instances.
 * Fails CLOSED on DB error to prevent unbounded LLM spend during outages.
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    // Run both window checks in parallel — each is an independent atomic upsert
    const [minuteRows, dayRows] = await Promise.all([
      db.execute(sql`
        INSERT INTO rate_limits (user_id, window_start, count)
        VALUES (${'chat:' + userId}, NOW(), 1)
        ON CONFLICT (user_id) DO UPDATE SET
          count = CASE
            WHEN rate_limits.window_start > NOW() - make_interval(secs => ${MINUTE_WINDOW_SEC})
              THEN rate_limits.count + 1
            ELSE 1
          END,
          window_start = CASE
            WHEN rate_limits.window_start > NOW() - make_interval(secs => ${MINUTE_WINDOW_SEC})
              THEN rate_limits.window_start
            ELSE NOW()
          END
        RETURNING count
      `),
      db.execute(sql`
        INSERT INTO rate_limits (user_id, window_start, count)
        VALUES (${'chat:day:' + userId}, NOW(), 1)
        ON CONFLICT (user_id) DO UPDATE SET
          count = CASE
            WHEN rate_limits.window_start > NOW() - make_interval(secs => ${DAY_WINDOW_SEC})
              THEN rate_limits.count + 1
            ELSE 1
          END,
          window_start = CASE
            WHEN rate_limits.window_start > NOW() - make_interval(secs => ${DAY_WINDOW_SEC})
              THEN rate_limits.window_start
            ELSE NOW()
          END
        RETURNING count
      `),
    ])

    const minuteCount = (minuteRows[0] as { count: number })?.count ?? 1
    const dayCount = (dayRows[0] as { count: number })?.count ?? 1

    const allowed = minuteCount <= MINUTE_MAX && dayCount <= DAY_MAX
    return { allowed, count: minuteCount }
  } catch (err) {
    // DB unavailable — fail CLOSED to prevent unbounded LLM spend during outages
    console.error('[rate-limit] DB error, failing closed for user:', userId, err)
    return { allowed: false, count: MINUTE_MAX }
  }
}
