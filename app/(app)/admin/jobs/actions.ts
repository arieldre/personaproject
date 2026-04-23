'use server'

import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'
import { eq } from 'drizzle-orm'

export async function triggerPing() {
  // P0: require admin role — any authenticated user could call server actions directly
  const user = await requireRole('company_admin') as { id: string; companyId?: string }
  if (!user.companyId) throw new Error('No company associated with account')

  const [job] = await db.insert(jobs).values({
    type: 'ping',
    status: 'queued',
    companyId: user.companyId,
    metadata: { triggeredBy: user.id },
  }).returning()

  try {
    const { ids } = await inngest.send({
      name: 'persona/ping',
      data: { jobId: job.id, companyId: user.companyId },
    })

    // Best-effort runId update — failure here is non-critical (P2)
    if (ids[0]) {
      await db.update(jobs)
        .set({ inngestRunId: ids[0] })
        .where(eq(jobs.id, job.id))
    }
  } catch (err) {
    // P1: compensate for Inngest send failure — prevents zombie queued jobs
    await db.update(jobs)
      .set({ status: 'failed', error: String(err), updatedAt: new Date() })
      .where(eq(jobs.id, job.id))
    throw err
  }

  return { jobId: job.id }
}
