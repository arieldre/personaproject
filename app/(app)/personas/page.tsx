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
              <Link
                key={p.id}
                href={`/chat/${p.id}`}
                className="block rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800 transition-colors px-6 py-5 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-semibold text-sm group-hover:text-white">{p.name}</p>
                  {p.clusterSize != null && (
                    <span className="text-xs text-neutral-500 shrink-0 mt-0.5">{p.clusterSize} employees</span>
                  )}
                </div>
                {p.tagline && (
                  <p className="text-xs text-neutral-400 mb-3">{p.tagline}</p>
                )}
                <p className="text-xs text-blue-400 mt-4 group-hover:text-blue-300 transition-colors">
                  Start conversation →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
