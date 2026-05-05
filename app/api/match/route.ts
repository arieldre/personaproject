import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { questionnaires, questionnaireResponses, user as userTable } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// Session may be cached from before company_id was linked — fall back to DB lookup.
async function resolveCompanyId(userId: string, sessionCompanyId?: string): Promise<string | null> {
  if (sessionCompanyId) return sessionCompanyId
  const [row] = await db
    .select({ companyId: userTable.companyId })
    .from(userTable)
    .where(eq(userTable.id, userId))
  return row?.companyId ?? null
}

// GET /api/match — list employees (completed responses with vectors) for this company
export async function GET() {
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }
  const companyId = await resolveCompanyId(user.id, user.companyId)
  if (!companyId) return NextResponse.json({ error: 'no company' }, { status: 400 })

  const responses = await db
    .select({
      id: questionnaireResponses.id,
      respondentName: questionnaireResponses.respondentName,
      respondentEmail: questionnaireResponses.respondentEmail,
    })
    .from(questionnaireResponses)
    .innerJoin(questionnaires, eq(questionnaireResponses.questionnaireId, questionnaires.id))
    .where(
      and(
        eq(questionnaires.companyId, companyId),
        eq(questionnaireResponses.status, 'completed'),
        isNotNull(questionnaireResponses.personalityVector),
      )
    )

  return NextResponse.json({ responses })
}

// POST /api/match — run pgvector RPC and return ranked persona matches
export async function POST(req: NextRequest) {
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }
  const companyId = await resolveCompanyId(user.id, user.companyId)
  if (!companyId) return NextResponse.json({ error: 'no company' }, { status: 400 })

  let responseId: string
  try {
    const body = await req.json()
    responseId = body.responseId
    if (!responseId || typeof responseId !== 'string') {
      return NextResponse.json({ error: 'responseId required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // Fetch employee vector — must belong to this company (join via questionnaire)
  const [response] = await db
    .select({ personalityVector: questionnaireResponses.personalityVector })
    .from(questionnaireResponses)
    .innerJoin(questionnaires, eq(questionnaireResponses.questionnaireId, questionnaires.id))
    .where(
      and(
        eq(questionnaireResponses.id, responseId),
        eq(questionnaires.companyId, companyId),
      )
    )

  if (!response?.personalityVector) {
    return NextResponse.json({ error: 'response not found or incomplete' }, { status: 404 })
  }

  // Run pgvector RPC — HNSW index makes this O(log n) even at scale.
  // postgres.js returns a RowList which is array-like; spread to plain array.
  const rows = await db.execute(sql`
    select * from match_employee_to_personas(
      ${responseId}::uuid,
      ${companyId}::uuid,
      5
    )
  `)

  return NextResponse.json({
    matches: [...rows],
    employeeVector: response.personalityVector,
  })
}
