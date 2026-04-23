'use server'

import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { jobs, personas, questionnaires } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'
import { eq, and } from 'drizzle-orm'

export async function triggerClustering(questionnaireId: string, k: number) {
  const user = await requireRole('company_admin') as { id: string; companyId?: string }
  if (!user.companyId) throw new Error('No company associated with account')

  // k must be integer in [1, 10]
  const kInt = Math.round(k)
  if (!Number.isInteger(kInt) || kInt < 1 || kInt > 10) {
    throw new Error('k must be an integer between 1 and 10')
  }

  // Verify questionnaire belongs to this company
  const [questionnaire] = await db
    .select({ id: questionnaires.id })
    .from(questionnaires)
    .where(and(
      eq(questionnaires.id, questionnaireId),
      eq(questionnaires.companyId, user.companyId),
    ))
    .limit(1)

  if (!questionnaire) {
    throw new Error('Questionnaire not found or access denied')
  }

  const [job] = await db.insert(jobs).values({
    type: 'cluster',
    status: 'queued',
    companyId: user.companyId,
    entityId: questionnaireId,
    metadata: { triggeredBy: user.id, k: kInt },
  }).returning()

  try {
    const { ids } = await inngest.send({
      name: 'persona/cluster.requested',
      data: {
        jobId: job.id,
        companyId: user.companyId,
        questionnaireId,
        k: kInt,
      },
    })

    // Best-effort runId capture — non-critical
    if (ids[0]) {
      await db.update(jobs)
        .set({ inngestRunId: ids[0] })
        .where(eq(jobs.id, job.id))
    }
  } catch (err) {
    // Compensate for Inngest send failure — prevent zombie queued jobs
    await db.update(jobs)
      .set({ status: 'failed', error: String(err), updatedAt: new Date() })
      .where(eq(jobs.id, job.id))
    throw err
  }

  return { jobId: job.id }
}

export async function archivePersona(personaId: string): Promise<void> {
  const user = await requireRole('company_admin') as { id: string; companyId?: string }
  if (!user.companyId) throw new Error('No company associated with account')

  // Verify persona belongs to this company before mutating
  const [persona] = await db
    .select({ id: personas.id, companyId: personas.companyId })
    .from(personas)
    .where(eq(personas.id, personaId))
    .limit(1)

  if (!persona || persona.companyId !== user.companyId) {
    throw new Error('Persona not found or access denied')
  }

  await db.update(personas)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(personas.id, personaId))
}
