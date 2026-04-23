import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import {
  user as userTable,
  questionnaireResponses,
  conversations,
  messages,
  trainingSessions,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const authUser = await requireAuth()

  // Fetch all user-owned data in parallel
  const [profile, responses, convRows, sessions] = await Promise.all([
    db.select().from(userTable).where(eq(userTable.id, authUser.id)).limit(1),

    db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, authUser.id)),

    // Conversations with their messages
    db.query.conversations.findMany({
      where: eq(conversations.userId, authUser.id),
      with: { messages: true },
    }),

    db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.userId, authUser.id)),
  ])

  const userProfile = profile[0]

  // Strip sensitive internal fields before export
  const { ...exportableProfile } = userProfile ?? {}

  const payload = {
    exportedAt: new Date().toISOString(),
    user: exportableProfile,
    responses,
    conversations: convRows,
    trainingSessions: sessions,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="persona-data-export.json"',
    },
  })
}
