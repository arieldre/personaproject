import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { JobsClient } from './jobs-client'

export default async function AdminJobsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const user = session.user as { companyId?: string; role?: string }
  if (!user.companyId || !['company_admin', 'super_admin'].includes(user.role ?? '')) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Admin access required.</p>
      </div>
    )
  }

  const rows = await db
    .select({
      id: jobs.id,
      type: jobs.type,
      status: jobs.status,
      createdAt: jobs.createdAt,
      completedAt: jobs.completedAt,
    })
    .from(jobs)
    .where(eq(jobs.companyId, user.companyId))
    .orderBy(desc(jobs.createdAt))
    .limit(50)

  const hasRunning = rows.some((j) => j.status === 'queued' || j.status === 'running')

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <JobsClient jobs={rows} hasRunning={hasRunning} />
      </div>
    </div>
  )
}
