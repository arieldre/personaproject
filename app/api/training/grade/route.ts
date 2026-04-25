import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { trainingSessions, jobs, personas } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'
import { getDefaultPersona } from '@/lib/training/default-personas'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!user.companyId) {
    return NextResponse.json({ error: 'User has no company' }, { status: 400 })
  }

  let messages: { role: string; content: string }[]
  let scenarioId: string
  let personaId: string

  try {
    const body = await req.json()
    messages = body.messages
    scenarioId = body.scenarioId
    personaId = body.personaId

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 })
    }
    if (typeof scenarioId !== 'string' || !scenarioId) {
      return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 })
    }
    if (typeof personaId !== 'string' || !personaId) {
      return NextResponse.json({ error: 'personaId is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const isDefault = personaId.startsWith('default:')

  // Verify persona ownership for company personas (P0 security fix)
  if (!isDefault) {
    const [persona] = await db
      .select({ id: personas.id, companyId: personas.companyId })
      .from(personas)
      .where(and(eq(personas.id, personaId), eq(personas.companyId, user.companyId)))
      .limit(1)

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }
  } else {
    // Validate that the default persona ID is known
    if (!getDefaultPersona(personaId)) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }
  }

  // Insert training session — personaId is UUID for company personas, null for defaults
  const [session] = await db
    .insert(trainingSessions)
    .values({
      userId: user.id,
      companyId: user.companyId,
      personaId: isDefault ? null : personaId,
      defaultPersonaId: isDefault ? personaId : null,
      scenarioId,
      messages,
    })
    .returning({ id: trainingSessions.id })

  const [job] = await db
    .insert(jobs)
    .values({
      type: 'grade-training-session',
      status: 'queued',
      companyId: user.companyId,
      entityId: session.id,
      entityType: 'training_session',
      metadata: { trainingSessionId: session.id, scenarioId, personaId },
    })
    .returning({ id: jobs.id })

  await inngest.send({
    name: 'training/grade.requested',
    data: {
      jobId: job.id,
      companyId: user.companyId,
      trainingSessionId: session.id,
    },
  })

  return NextResponse.json({ jobId: job.id, trainingSessionId: session.id })
}
