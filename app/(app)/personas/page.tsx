import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { personas } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'

export default async function PersonasPage() {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')

  const user = session.user as { companyId?: string }

  const activePersonas = user.companyId
    ? await db
        .select({
          id: personas.id,
          name: personas.name,
          tagline: personas.tagline,
          clusterSize: personas.clusterSize,
        })
        .from(personas)
        .where(and(eq(personas.companyId, user.companyId), eq(personas.status, 'active')))
        .orderBy(desc(personas.createdAt))
    : []

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-neutral-400 mt-1">
            AI personas built from your team&apos;s survey responses. Click one to start a conversation.
          </p>
        </div>

        {activePersonas.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-16 text-center">
            <p className="text-neutral-500 text-sm">No personas yet — your admin will generate them from survey responses.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activePersonas.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-semibold text-sm text-white">{p.name}</p>
                  {p.clusterSize != null && (
                    <span className="text-xs text-neutral-500 shrink-0 mt-0.5">{p.clusterSize} employees</span>
                  )}
                </div>
                {p.tagline && (
                  <p className="text-xs text-neutral-400 mb-4">{p.tagline}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/chat/${p.id}`}
                    className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium text-blue-400 border border-blue-500/30 hover:border-blue-500/70 hover:bg-blue-500/5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Chat →
                  </Link>
                  <Link
                    href={`/consult/${p.id}`}
                    data-testid="persona-consult-link"
                    className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium text-violet-400 border border-violet-500/30 hover:border-violet-500/70 hover:bg-violet-500/5 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    Consult →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
