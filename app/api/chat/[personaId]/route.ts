import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { personas, conversations, messages } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { getDefaultPersona } from '@/lib/training/default-personas'
import { getScenario } from '@/lib/training/scenarios'

export const maxDuration = 60

// In-memory rate limiter: 20 messages per user per 60-second window.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  // 1. Auth
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const { personaId } = await params
  const isDefaultPersona = personaId.startsWith('default:')

  // 2. Parse body
  let clientMessages: { role: string; content: string }[]
  let conversationId: string | undefined
  try {
    const body = await req.json()
    clientMessages = body.messages
    conversationId = body.conversationId
    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return new Response('messages must be a non-empty array', { status: 400 })
    }
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  // 3. Load persona — different paths for default vs company personas
  let systemPrompt: string

  const mode = req.nextUrl.searchParams.get('mode') // 'consult' | null

  if (isDefaultPersona) {
    const defaultPersona = getDefaultPersona(personaId)
    if (!defaultPersona) {
      return new Response('Persona not found', { status: 404 })
    }
    systemPrompt = mode === 'consult' ? defaultPersona.consultSystemPrompt : defaultPersona.systemPrompt
  } else {
    // Company persona — enforce tenant isolation
    const [persona] = await db
      .select()
      .from(personas)
      .where(eq(personas.id, personaId))
      .limit(1)

    if (!persona || persona.companyId !== user.companyId) {
      return new Response('Persona not found', { status: 404 })
    }

    if (mode === 'consult') {
      // Derive consult prompt from role + existing system prompt context
      systemPrompt = `You are ${persona.name}, a domain expert and advisor in your field${persona.tagline ? ` — ${persona.tagline}` : ''}. Switch out of roleplay mode entirely. You are now acting as a consultant the user can ask questions to.

Draw on deep expertise relevant to your role. Give direct, actionable advice. Share frameworks, specific language, and practical guidance. Be honest when something the user describes sounds risky or mistaken. Ask one clarifying question when context would meaningfully improve your answer.

Background on who you are:
${persona.systemPrompt ?? ''}`
    } else {
      systemPrompt = persona.systemPrompt ?? 'You are a helpful workplace colleague.'
    }
  }

  // 4. Append scenario context to system prompt — only in training mode, not consult
  const scenarioId = req.nextUrl.searchParams.get('scenarioId')
  if (scenarioId && mode !== 'consult') {
    const scenario = getScenario(scenarioId)
    if (scenario) {
      systemPrompt += `\n\n## Training Scenario\n${scenario.systemPromptSuffix}`
    }
  }

  // 5. Rate limit: 20 messages per user per 60-second window
  const now = Date.now()
  const windowMs = 60_000
  const existing = rateLimitMap.get(user.id)

  if (existing && now - existing.windowStart < windowMs) {
    if (existing.count >= 20) {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    existing.count++
  } else {
    rateLimitMap.set(user.id, { count: 1, windowStart: now })
  }

  // 6. Conversation persistence — skip for default personas (training mode, no DB FK)
  let historyMessages: { role: 'user' | 'assistant'; content: string }[] = []

  if (!isDefaultPersona) {
    let activeConversationId: string

    if (conversationId) {
      const [existingConv] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, user.id),
            eq(conversations.personaId, personaId)
          )
        )
        .limit(1)

      if (!existingConv) {
        return new Response('Conversation not found', { status: 404 })
      }
      activeConversationId = existingConv.id
    } else {
      const firstUserMsg = clientMessages.find((m) => m.role === 'user')
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) : 'New conversation'

      const [newConv] = await db
        .insert(conversations)
        .values({ personaId, userId: user.id, title, lastMessageAt: new Date() })
        .returning()

      activeConversationId = newConv.id
    }

    // Load last 8 messages for hybrid truncation (research recommendation)
    const dbMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, activeConversationId))
      .orderBy(desc(messages.createdAt))
      .limit(8)

    historyMessages = dbMessages.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // 7. Extract last user message with injection-defense delimiters
    const lastUserMessage = [...clientMessages].reverse().find((m) => m.role === 'user')
    if (!lastUserMessage) {
      return new Response('No user message found', { status: 400 })
    }
    // Sanitize XML tags to prevent prompt injection breakout
    const sanitized = lastUserMessage.content.replace(/<[^>]*>/g, '')
    const wrappedUserMessage = `<user_message>${sanitized}</user_message>`

    const result = streamText({
      model: groq(process.env.GROQ_MODEL!),
      system: systemPrompt,
      messages: [...historyMessages, { role: 'user', content: wrappedUserMessage }],
      maxOutputTokens: 400,
      temperature: 0.55,
      onFinish: async ({ text, usage }) => {
        await db.insert(messages).values([
          { conversationId: activeConversationId, role: 'user', content: lastUserMessage.content },
          { conversationId: activeConversationId, role: 'assistant', content: text, tokensUsed: usage?.outputTokens ?? null },
        ])
        await db
          .update(conversations)
          .set({ lastMessageAt: new Date(), updatedAt: new Date() })
          .where(eq(conversations.id, activeConversationId))
      },
    })

    return result.toTextStreamResponse()
  }

  // Default persona path — no conversation DB persistence, just stream
  const lastUserMessage = [...clientMessages].reverse().find((m) => m.role === 'user')
  if (!lastUserMessage) {
    return new Response('No user message found', { status: 400 })
  }
  const sanitized = lastUserMessage.content.replace(/<[^>]*>/g, '')

  // Pass the full client messages as history (training-session.tsx manages state)
  const conversationHistory = clientMessages.slice(0, -1).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const result = streamText({
    model: groq(process.env.GROQ_MODEL!),
    system: systemPrompt,
    messages: [...conversationHistory, { role: 'user', content: sanitized }],
    maxOutputTokens: 400,
    temperature: 0.55,
  })

  return result.toTextStreamResponse()
}
