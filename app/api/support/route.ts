import { streamText, type ModelMessage } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { requireAuth } from '@/lib/auth/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { SUPPORT_SYSTEM_PROMPT } from '@/lib/support/knowledge-base'

export const maxDuration = 60

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

// Support uses a separate rate limit: 30 messages per 5-minute window.
// We derive this by keying the DB row with a suffix so it's isolated from chat limits.
const SUPPORT_WINDOW_SEC = 300
const SUPPORT_MAX = 30

async function checkSupportRateLimit(userId: string) {
  // Reuse the same DB-backed checkRateLimit infrastructure but with a distinct key.
  // The existing function hardcodes WINDOW_MS/MAX_REQUESTS, so we call it on a namespaced
  // userId string and accept that the window is 60s / 20 msgs per that slot.
  // To get 30/5min we call it with a namespaced key and rely on the fact that
  // the DB table uses user_id as the conflict key — namespacing gives isolation.
  //
  // Real solution: pass window/max as params to checkRateLimit.
  // For now, use a lightweight inline version that mirrors the same SQL pattern.
  const { sql } = await import('drizzle-orm')
  const { db } = await import('@/lib/db')

  try {
    const rows = await db.execute(sql`
      INSERT INTO rate_limits (user_id, window_start, count)
      VALUES (${'support:' + userId}, NOW(), 1)
      ON CONFLICT (user_id) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start > NOW() - make_interval(secs => ${SUPPORT_WINDOW_SEC})
            THEN rate_limits.count + 1
          ELSE 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start > NOW() - make_interval(secs => ${SUPPORT_WINDOW_SEC})
            THEN rate_limits.window_start
          ELSE NOW()
        END
      RETURNING count
    `)

    const count = (rows[0] as { count: number })?.count ?? 1
    return { allowed: count <= SUPPORT_MAX }
  } catch (err) {
    // Fail closed — DB error should not allow unbounded LLM spend
    console.error('[support rate-limit] DB error, failing closed:', err)
    return { allowed: false }
  }
}

/**
 * Select model based on message complexity.
 * Simple/short questions → fast 8B model (free tier friendly).
 * Complex/long/technical → 70B for better reasoning.
 */
function selectModel(lastMessage: string): string {
  const complex =
    lastMessage.length > 150 ||
    /clustering|inngest|vector|migration|webhook|stripe|api|error|broken|not working/i.test(
      lastMessage
    )
  return complex ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant'
}

/** Lazy Resend init — never at module scope (BP-045) */
async function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  const { Resend } = await import('resend')
  return new Resend(key)
}

export async function POST(req: Request) {
  // 1. Auth
  let user: { id: string; email?: string }
  try {
    user = (await requireAuth()) as { id: string; email?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Parse body
  let clientMessages: ModelMessage[]
  try {
    const body = await req.json()
    clientMessages = body.messages
    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return new Response('messages must be a non-empty array', { status: 400 })
    }
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  // 3. Rate limit (support-specific: 30/5min, keyed separately from chat)
  const { allowed } = await checkSupportRateLimit(user.id)
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // 4. Sanitize all messages — strip XML tags from entire history (BP-055)
  const sanitized: ModelMessage[] = clientMessages.slice(-10).map((m) => ({
    ...m,
    content:
      typeof m.content === 'string'
        ? m.content.replace(/<[^>]*>/g, '')
        : m.content,
  }))

  // 5. Select model based on last user message complexity
  const lastUserMessage = [...sanitized].reverse().find((m) => m.role === 'user')
  const modelId = selectModel(
    typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : ''
  )

  // 6. Stream
  const result = streamText({
    model: groq(modelId),
    system: SUPPORT_SYSTEM_PROMPT,
    messages: sanitized,
    maxOutputTokens: 600,
    temperature: 0.3,
    onFinish: async ({ text }) => {
      // Escalation detection — notify Ariel when support agent can't help
      if (text.includes('[ESCALATE]')) {
        const resend = await getResend()
        if (resend) {
          const lastMsg =
            typeof lastUserMessage?.content === 'string'
              ? lastUserMessage.content
              : '(no message)'
          await resend.emails.send({
            from: 'support@personaproject-one.vercel.app',
            to: 'ariel.d@goatstudios.co',
            subject: 'Persona Platform — Support Escalation',
            text: [
              `User: ${user.email ?? user.id}`,
              `Message: ${lastMsg}`,
              '',
              'The support agent flagged this conversation for human follow-up.',
            ].join('\n'),
          })
        }
      }
    },
  })

  return result.toTextStreamResponse()
}
