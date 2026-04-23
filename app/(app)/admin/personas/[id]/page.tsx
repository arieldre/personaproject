import { requireRole } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { personas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DIMENSIONS } from '@/lib/vcpq/vector'
import { archivePersona } from '../actions'

interface PersonaSummary {
  overview?: string
  strengths?: string[]
  growthAreas?: string[]
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
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

function VectorBar({ dimension, value }: { dimension: string; value: number }) {
  // value is in [-1, 1]; map to [0%, 100%] width
  const widthPct = ((value + 1) / 2) * 100
  const colorClass =
    value > 0.2 ? 'bg-green-400' : value < -0.2 ? 'bg-red-400' : 'bg-neutral-400'

  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-neutral-400 font-mono capitalize">
        {dimension.replace(/_/g, ' ')}
      </span>
      <div className="flex-1 h-2 rounded-full bg-neutral-800">
        <div
          className={`h-2 rounded-full ${colorClass}`}
          style={{ width: `${widthPct.toFixed(2)}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs text-neutral-500 font-mono tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
  )
}

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole('company_admin') as { id: string; companyId?: string }
  if (!user.companyId) notFound()

  const [persona] = await db
    .select()
    .from(personas)
    .where(eq(personas.id, id))
    .limit(1)

  if (!persona || persona.companyId !== user.companyId) notFound()

  const summary = (persona.summary ?? {}) as PersonaSummary
  const vector: number[] = Array.isArray(persona.personalityVector)
    ? (persona.personalityVector as number[])
    : []

  async function handleArchive() {
    'use server'
    await archivePersona(id)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">

        {/* ── Header ── */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">{persona.name}</h1>
            <div className="flex items-center gap-3 shrink-0 pt-1">
              <StatusBadge status={persona.status} />
              {persona.clusterSize != null && (
                <span className="text-xs text-neutral-500">{persona.clusterSize} employees</span>
              )}
            </div>
          </div>
          {persona.tagline && (
            <p className="text-neutral-400 text-sm">{persona.tagline}</p>
          )}
        </div>

        {/* ── Summary ── */}
        {(summary.overview || (summary.strengths?.length ?? 0) > 0 || (summary.growthAreas?.length ?? 0) > 0) && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
            <h2 className="text-base font-medium">Summary</h2>

            {summary.overview && (
              <p className="text-sm text-neutral-300 leading-relaxed">{summary.overview}</p>
            )}

            {(summary.strengths?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Strengths</h3>
                <ul className="space-y-1">
                  {summary.strengths!.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                      <span className="text-green-400 mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(summary.growthAreas?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Growth Areas</h3>
                <ul className="space-y-1">
                  {summary.growthAreas!.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                      <span className="text-yellow-400 mt-0.5">→</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Personality vector ── */}
        {vector.length === 14 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
            <h2 className="text-base font-medium">Personality Vector</h2>
            <div className="space-y-2.5">
              {DIMENSIONS.map((dim, i) => (
                <VectorBar key={dim} dimension={dim} value={vector[i] ?? 0} />
              ))}
            </div>
          </div>
        )}

        {/* ── System prompt ── */}
        {persona.systemPrompt && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h2 className="text-base font-medium">System Prompt</h2>
            <pre className="text-xs text-neutral-500 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {persona.systemPrompt}
            </pre>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-4 pt-2">
          <Link
            href={`/chat/${persona.id}`}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-neutral-500 hover:text-white transition-colors"
          >
            Chat with this persona
          </Link>

          {persona.status !== 'archived' && (
            <form action={handleArchive}>
              <button
                type="submit"
                data-testid="archive-btn"
                className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:border-red-700 hover:text-red-300 transition-colors"
              >
                Archive
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
