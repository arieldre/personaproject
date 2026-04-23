import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { questionnaires, questionnaireResponses } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function AdminSurveysPage() {
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
      id: questionnaires.id,
      name: questionnaires.name,
      status: questionnaires.status,
      accessCode: questionnaires.accessCode,
      totalResponses: questionnaires.totalResponses,
      isAnonymous: questionnaires.isAnonymous,
      createdAt: questionnaires.createdAt,
    })
    .from(questionnaires)
    .where(eq(questionnaires.companyId, user.companyId))
    .orderBy(questionnaires.createdAt)

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Surveys</h1>
          <p className="text-sm text-neutral-400 mt-1">{rows.length} questionnaire{rows.length !== 1 ? 's' : ''}</p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-12 text-center">
            <p className="text-neutral-500 text-sm">No surveys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((q) => (
              <div
                key={q.id}
                data-testid="survey-row"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm truncate">{q.name}</p>
                  {q.accessCode && (
                    <p className="text-xs text-neutral-500 font-mono">
                      /survey/{q.accessCode}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 shrink-0 text-sm">
                  <div className="text-center">
                    <p className="text-white font-semibold tabular-nums">{q.totalResponses ?? 0}</p>
                    <p className="text-neutral-500 text-xs">responses</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    q.status === 'active'
                      ? 'bg-green-500/10 text-green-400'
                      : q.status === 'closed'
                        ? 'bg-neutral-700 text-neutral-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
