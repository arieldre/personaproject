import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { personas, conversations } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import ChatUI from './chat-ui'

interface PageProps {
  params: Promise<{ personaId: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { personaId: rawPersonaId } = await params
  const personaId = decodeURIComponent(rawPersonaId)

  const session = await getServerSession()
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as { id: string; companyId?: string }

  // Load persona with tenant isolation
  const [persona] = await db
    .select({
      id: personas.id,
      name: personas.name,
      tagline: personas.tagline,
      systemPrompt: personas.systemPrompt,
      companyId: personas.companyId,
    })
    .from(personas)
    .where(eq(personas.id, personaId))
    .limit(1)

  if (!persona || persona.companyId !== user.companyId) {
    redirect('/dashboard')
  }

  // Load conversation history for this user + persona, newest first
  const conversationList = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      lastMessageAt: conversations.lastMessageAt,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.personaId, personaId),
        eq(conversations.userId, user.id)
      )
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(20)

  return (
    <ChatUI
      persona={{
        id: persona.id,
        name: persona.name,
        tagline: persona.tagline,
      }}
      conversations={conversationList}
    />
  )
}
