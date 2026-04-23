import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { jobs, trainingSessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  let user: { id: string; companyId?: string }
  try {
    user = (await requireAuth()) as { id: string; companyId?: string }
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!user.companyId) {
    return NextResponse.json({ error: 'User has no company' }, { status: 400 })
  }

  const { jobId } = await params

  // Load job — scoped to user's company for tenant isolation
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, user.companyId)))
    .limit(1)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'complete') {
    return NextResponse.json({ status: job.status })
  }

  // Job complete — fetch gradeResult from the training session
  const trainingSessionId = (job.metadata as Record<string, string>)?.trainingSessionId
  if (!trainingSessionId) {
    return NextResponse.json({ status: 'complete' })
  }

  const [ts] = await db
    .select({ gradeResult: trainingSessions.gradeResult, overallScore: trainingSessions.overallScore })
    .from(trainingSessions)
    .where(eq(trainingSessions.id, trainingSessionId))
    .limit(1)

  return NextResponse.json({
    status: 'complete',
    gradeResult: ts?.gradeResult ?? null,
    overallScore: ts?.overallScore ?? null,
  })
}
