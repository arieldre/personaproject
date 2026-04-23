import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { trainingSessions, jobs } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'

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

  // Insert training session first to get its id
  const [session] = await db
    .insert(trainingSessions)
    .values({
      userId: user.id,
      personaId,
      scenarioId,
      messages,
    })
    .returning({ id: trainingSessions.id })

  // Insert job — companyId needed for tenant isolation in the Inngest function
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

  // Send Inngest event — fire and forget; the function handles retries
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
