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
import { eq, and } from 'drizzle-orm'

export async function GET() {
  let authUser: { id: string; companyId?: string }
  try {
    authUser = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // Fetch all user-owned data in parallel
  const [profile, responses, convRows, sessions] = await Promise.all([
    db.select().from(userTable).where(eq(userTable.id, authUser.id)).limit(1),

    db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, authUser.id)),

    // Conversations with their messages — userId alone is sufficient (user → single company)
    db.query.conversations.findMany({
      where: eq(conversations.userId, authUser.id),
      with: { messages: true },
    }),

    // Scope to companyId to prevent cross-tenant leakage if userId is ever reused
    authUser.companyId
      ? db
          .select()
          .from(trainingSessions)
          .where(and(eq(trainingSessions.userId, authUser.id), eq(trainingSessions.companyId, authUser.companyId)))
      : db
          .select()
          .from(trainingSessions)
          .where(eq(trainingSessions.userId, authUser.id)),
  ])

  const userProfile = profile[0]

  // Allowlist only GDPR-safe fields — never spread the full user row (contains internal flags)
  const exportableProfile = userProfile
    ? {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        createdAt: userProfile.createdAt,
      }
    : null

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
