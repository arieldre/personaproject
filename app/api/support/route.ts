import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { requireAuth } from '@/lib/auth/server'
import { SUPPORT_SYSTEM_PROMPT } from '@/lib/support/knowledge-base'

export const maxDuration = 60

// Lazy-init Groq — module-scope instantiation crashes cold start if key absent (BP-045)
function getGroq() {
  return createGroq({ apiKey: process.env.GROQ_API_KEY })
}

// Support rate limit: 30 messages per 5-minute window, keyed separately from chat.
const SUPPORT_WINDOW_SEC = 300
const SUPPORT_MAX = 30

async function checkSupportRateLimit(userId: string) {
  // Inline rate limiter using the same DB table as lib/rate-limit.ts but with:
  // - namespaced key ("support:<userId>") to isolate from chat limits
  // - longer window (5 min) and higher max (30 msgs)
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
    // Fail closed — DB error should not allow unbounded LLM spend during outages
    console.error('[support rate-limit] DB error, failing closed:', err)
    return { allowed: false }
  }
}

/**
 * Select model based on message complexity.
 * Simple/short → llama-3.1-8b-instant (fast, free-tier friendly).
 * Complex/long/technical → llama-3.3-70b-versatile (better reasoning).
 */
function selectModel(lastMessage: string): string {
  const complex =
    lastMessage.length > 150 ||
    /clustering|inngest|vector|migration|webhook|stripe|api|error|broken|not working/i.test(
      lastMessage
    )
  return complex
    ? (process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile')
    : (process.env.GROQ_MODEL_FALLBACK ?? 'llama-3.1-8b-instant')
}

/** Lazy Resend init — never at module scope (BP-045) */
async function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  const { Resend } = await import('resend')
  return new Resend(key)
}

// Incoming message shape from the client widget
interface ClientMessage {
  role: 'user' | 'assistant'
  content: string
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
  let clientMessages: ClientMessage[]
  try {
    const body = await req.json()
    clientMessages = body.messages
    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return new Response('messages must be a non-empty array', { status: 400 })
    }
    // Validate role field — reject system-role injection (P1: prompt injection vector)
    if (clientMessages.some((m) => !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string')) {
      return new Response('invalid message format', { status: 400 })
    }
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  // 3. Rate limit (support-specific: 30/5min, isolated from chat rate limit)
  const { allowed } = await checkSupportRateLimit(user.id)
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // 4. Sanitize all messages — strip XML tags from entire history (BP-055)
  const sanitized: ClientMessage[] = clientMessages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content.replace(/<[^>]*>/g, ''),
  }))

  // 5. Select model based on last user message complexity
  const lastUserMessage = [...sanitized].reverse().find((m) => m.role === 'user')
  const modelId = selectModel(lastUserMessage?.content ?? '')

  // 6. Stream
  const result = streamText({
    model: getGroq()(modelId),
    system: SUPPORT_SYSTEM_PROMPT,
    messages: sanitized,
    maxOutputTokens: 600,
    temperature: 0.3,
    onFinish: async ({ text }) => {
      // Escalation detection — only trigger if LLM appended [ESCALATE] at end of response
      // AND the user's own message didn't already contain it (injection guard)
      const userContainedEscalate = lastUserMessage?.content.includes('[ESCALATE]') ?? false
      const llmEscalated = /\[ESCALATE\]\s*$/i.test(text.trimEnd())
      if (llmEscalated && !userContainedEscalate) {
        const resend = await getResend()
        if (resend) {
          await resend.emails.send({
            from: 'support@personaproject-one.vercel.app',
            to: 'ariel.d@goatstudios.co',
            subject: 'Persona Platform — Support Escalation',
            // Never include raw user content in email body (injection guard)
            text: `A user (${user.email ?? user.id}) needs human support. Log into Persona Platform and check their conversation.`,
          })
        }
      }
    },
  })

  return result.toTextStreamResponse()
}
