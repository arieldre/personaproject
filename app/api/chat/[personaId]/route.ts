import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { personas, conversations, messages } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { NextRequest } from 'next/server'

export const maxDuration = 60

// In-memory rate limiter: 20 messages per user per 60-second window.
// Resets automatically when the window expires — no external dependency needed.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  // 1. Auth — throws Response(401) if not authenticated
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const { personaId } = await params

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

  // 3. Load persona — tenant isolation: persona.companyId must match user.companyId
  const [persona] = await db
    .select()
    .from(personas)
    .where(eq(personas.id, personaId))
    .limit(1)

  if (!persona) {
    return new Response('Persona not found', { status: 404 })
  }
  if (persona.companyId !== user.companyId) {
    return new Response('Persona not found', { status: 404 })
  }

  // 4. Get or create conversation
  let activeConversationId: string

  if (conversationId) {
    // Verify ownership: userId + personaId must match
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
    // Auto-generate title from first user message (max 50 chars)
    const firstUserMsg = clientMessages.find((m) => m.role === 'user')
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50)
      : 'New conversation'

    const [newConv] = await db
      .insert(conversations)
      .values({
        personaId,
        userId: user.id,
        title,
        lastMessageAt: new Date(),
      })
      .returning()

    activeConversationId = newConv.id
  }

  // 5. Rate limit: 20 messages per user per 60-second sliding window
  const now = Date.now()
  const windowMs = 60_000
  const existing = rateLimitMap.get(user.id)

  if (existing && now - existing.windowStart < windowMs) {
    if (existing.count >= 20) {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    existing.count++
  } else {
    // New window
    rateLimitMap.set(user.id, { count: 1, windowStart: now })
  }

  // 6. Load last 20 messages from DB in chronological order
  const dbMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, activeConversationId))
    .orderBy(desc(messages.createdAt))
    .limit(20)

  // Reverse so oldest-first for the LLM context
  const historyMessages = dbMessages.reverse().map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // 7. Build the final user message with injection-defense delimiters
  const lastUserMessage = [...clientMessages].reverse().find((m) => m.role === 'user')
  if (!lastUserMessage) {
    return new Response('No user message found', { status: 400 })
  }
  const wrappedUserMessage = `<user_message>${lastUserMessage.content}</user_message>`

  // 8. Stream from Groq
  const result = streamText({
    model: groq(process.env.GROQ_MODEL!),
    system: persona.systemPrompt ?? 'You are a helpful workplace colleague.',
    messages: [
      ...historyMessages,
      { role: 'user', content: wrappedUserMessage },
    ],
    maxOutputTokens: 1000,

    // 9. Persist messages + update conversation after stream completes
    onFinish: async ({ text, usage }) => {
      await db.insert(messages).values([
        {
          conversationId: activeConversationId,
          role: 'user',
          content: lastUserMessage.content,
        },
        {
          conversationId: activeConversationId,
          role: 'assistant',
          content: text,
          tokensUsed: usage?.outputTokens ?? null,
        },
      ])

      await db
        .update(conversations)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(conversations.id, activeConversationId))
    },
  })

  return result.toTextStreamResponse()
}
