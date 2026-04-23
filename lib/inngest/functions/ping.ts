import { inngest } from '../client'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const pingFn = inngest.createFunction(
  { id: 'ping', triggers: [{ event: 'persona/ping' }] },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string

    await step.run('mark-running', async () => {
      await db.update(jobs)
        .set({ status: 'running', updatedAt: new Date() })
        .where(eq(jobs.id, jobId))
    })

    await step.sleep('wait-5s', '5s')

    await step.run('mark-complete', async () => {
      await db.update(jobs)
        .set({ status: 'complete', updatedAt: new Date(), completedAt: new Date() })
        .where(eq(jobs.id, jobId))
    })

    return { jobId, ok: true }
  }
)
