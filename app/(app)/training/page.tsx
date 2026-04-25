import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth/server'
import { SCENARIOS } from '@/lib/training/scenarios'
import { DEFAULT_PERSONAS } from '@/lib/training/default-personas'

const difficultyBadge: Record<string, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
}

const difficultyLabel: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const defaultScenarios = SCENARIOS.filter((s) => s.personaId?.startsWith('default:'))

export default async function TrainingPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* ── Default Library ── */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-white mb-1">Training Library</h1>
          <p className="text-neutral-400 text-sm mb-8">
            6 built-in manager personas — no company survey needed. Pick a persona and choose your difficulty.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_PERSONAS.map((persona) => {
              const personaScenarios = defaultScenarios.filter((s) => s.personaId === persona.id)
              return (
                <div
                  key={persona.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                      style={{ backgroundColor: persona.avatarColor }}
                    >
                      {persona.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{persona.name}</p>
                      <p className="text-xs text-neutral-500">{persona.role}</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{persona.tagline}</p>

                  {/* Difficulty links */}
                  <div className="flex gap-2 mb-2">
                    {personaScenarios.map((s) => (
                      <Link
                        key={s.id}
                        href={`/training/${encodeURIComponent(s.id)}`}
                        data-testid={`scenario-link-${s.difficulty}`}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-neutral-900 ${difficultyBadge[s.difficulty]}`}
                      >
                        {difficultyLabel[s.difficulty]}
                      </Link>
                    ))}
                  </div>

                  {/* Consult link */}
                  <Link
                    href={`/consult/${encodeURIComponent(persona.id)}`}
                    data-testid="consult-link"
                    className="block w-full text-center py-1.5 rounded-lg text-xs font-medium text-violet-400 border border-violet-500/30 hover:border-violet-500/70 hover:bg-violet-500/5 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-neutral-900"
                  >
                    Consult →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </main>
  )
}
