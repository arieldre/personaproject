import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { jobs, personas, questionnaires } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { triggerClustering } from './actions'

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    queued: 'bg-yellow-500/10 text-yellow-400',
    running: 'bg-blue-500/10 text-blue-400',
    complete: 'bg-green-500/10 text-green-400',
    failed: 'bg-red-500/10 text-red-400',
    generating: 'bg-blue-500/10 text-blue-400',
    active: 'bg-green-500/10 text-green-400',
    archived: 'bg-neutral-700 text-neutral-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${(status && styles[status]) ?? 'bg-neutral-700 text-neutral-400'}`}>
      {status}
    </span>
  )
}

export default async function AdminPersonasPage() {
  const user = await requireRole('company_admin') as { id: string; companyId?: string }
  if (!user.companyId) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">No company associated with account.</p>
      </div>
    )
  }

  const companyId = user.companyId

  const [activeQuestionnaires, activePersonas, lastClusterJob] = await Promise.all([
    db
      .select({
        id: questionnaires.id,
        name: questionnaires.name,
        totalResponses: questionnaires.totalResponses,
      })
      .from(questionnaires)
      .where(and(
        eq(questionnaires.companyId, companyId),
        eq(questionnaires.status, 'active'),
      ))
      .orderBy(questionnaires.name),

    db
      .select({
        id: personas.id,
        name: personas.name,
        tagline: personas.tagline,
        clusterSize: personas.clusterSize,
        status: personas.status,
        createdAt: personas.createdAt,
      })
      .from(personas)
      .where(and(
        eq(personas.companyId, companyId),
        eq(personas.status, 'active'),
      ))
      .orderBy(desc(personas.createdAt)),

    db
      .select({
        id: jobs.id,
        status: jobs.status,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(and(
        eq(jobs.companyId, companyId),
        eq(jobs.type, 'cluster'),
      ))
      .orderBy(desc(jobs.createdAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  async function handleClusterSubmit(formData: FormData) {
    'use server'
    const questionnaireId = formData.get('questionnaireId') as string
    const k = Number(formData.get('k'))
    await triggerClustering(questionnaireId, k)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-neutral-400 mt-1">Cluster survey responses to generate AI personas.</p>
        </div>

        {/* ── Cluster Responses card ── */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-medium">Cluster Responses</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Run k-means clustering on a questionnaire&apos;s responses to generate personas.</p>
            </div>
            {lastClusterJob && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-neutral-500">Last job:</span>
                <StatusBadge status={lastClusterJob.status} />
              </div>
            )}
          </div>

          <form action={handleClusterSubmit} data-testid="cluster-form" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="questionnaireId" className="text-xs text-neutral-400 font-medium">
                  Questionnaire
                </label>
                {activeQuestionnaires.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-2">No active questionnaires.</p>
                ) : (
                  <select
                    id="questionnaireId"
                    name="questionnaireId"
                    required
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  >
                    {activeQuestionnaires.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} ({q.totalResponses ?? 0} responses)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="k" className="text-xs text-neutral-400 font-medium">
                  Clusters (k)
                </label>
                <select
                  id="k"
                  name="k"
                  defaultValue="0"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
                >
                  <option value="0">Auto (recommended)</option>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} clusters</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={activeQuestionnaires.length === 0}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Generate Personas
            </button>
          </form>
        </div>

        {/* ── Active Personas list ── */}
        <div className="space-y-4">
          <h2 className="text-base font-medium">Active Personas</h2>

          {activePersonas.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-12 text-center">
              <p className="text-neutral-500 text-sm">
                No personas yet. Cluster responses above to generate them.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePersonas.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/personas/${p.id}`}
                  data-testid="persona-card"
                  className="block rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.tagline && (
                        <p className="text-xs text-neutral-400 truncate">{p.tagline}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {p.clusterSize != null && (
                        <p className="text-xs text-neutral-500">
                          {p.clusterSize} employees
                        </p>
                      )}
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
