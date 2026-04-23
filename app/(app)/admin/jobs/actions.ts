'use server'

import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { inngest } from '@/lib/inngest/client'
import { eq } from 'drizzle-orm'

export async function triggerPing() {
  const session = await getServerSession()
  if (!session) throw new Error('Unauthorized')

  const user = session.user as { id: string; companyId?: string }
  if (!user.companyId) throw new Error('No company associated with account')

  const [job] = await db.insert(jobs).values({
    type: 'ping',
    status: 'queued',
    companyId: user.companyId,
    metadata: { triggeredBy: user.id },
  }).returning()

  const { ids } = await inngest.send({
    name: 'persona/ping',
    data: { jobId: job.id },
  })

  if (ids[0]) {
    await db.update(jobs)
      .set({ inngestRunId: ids[0] })
      .where(eq(jobs.id, job.id))
  }

  return { jobId: job.id }
}
