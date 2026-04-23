import { NonRetriableError } from 'inngest'
import { inngest } from '../client'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export const pingFn = inngest.createFunction(
  {
    id: 'ping',
    triggers: [{ event: 'persona/ping' }],
    // P1: write 'failed' status on Inngest-reported failure (after all retries exhausted)
    onFailure: async ({ event }) => {
      const { jobId, companyId } = event.data.event.data as { jobId: string; companyId: string }
      await db.update(jobs)
        .set({ status: 'failed', error: 'Job exceeded retry limit', updatedAt: new Date() })
        // P2: scope by companyId to guard cross-tenant mutation
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    },
  },
  async ({ event, step }) => {
    const { jobId, companyId } = event.data as { jobId: unknown; companyId: unknown }

    // P1: validate payload before any step — NonRetriableError skips Inngest retries
    if (typeof jobId !== 'string' || typeof companyId !== 'string') {
      throw new NonRetriableError('invalid event payload: jobId and companyId must be strings')
    }

    await step.run('mark-running', async () => {
      await db.update(jobs)
        .set({ status: 'running', updatedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    })

    await step.sleep('wait-5s', '5s')

    await step.run('mark-complete', async () => {
      await db.update(jobs)
        .set({ status: 'complete', updatedAt: new Date(), completedAt: new Date() })
        .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    })

    return { jobId, ok: true }
  }
)
