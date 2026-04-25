import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth/server'
import { SCENARIOS } from '@/lib/training/scenarios'
import { DEFAULT_PERSONAS } from '@/lib/training/default-personas'

const difficultyBadge: Record<string, string> = {
  beginner: 'bg-green-500/15 text-green-400',
  intermediate: 'bg-yellow-500/15 text-yellow-400',
  advanced: 'bg-red-500/15 text-red-400',
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
}

const difficultyLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

// Scenarios that belong to the default persona library
const defaultScenarios = SCENARIOS.filter((s) => s.personaId?.startsWith('default:'))

// Legacy scenarios without a persona assignment
const legacyScenarios = SCENARIOS.filter((s) => !s.personaId)

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
                  <div className="flex gap-2">
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
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Company Scenarios (legacy) ── */}
        {legacyScenarios.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Classic Scenarios</h2>
            <p className="text-neutral-400 text-sm mb-6">
              General manager training scenarios — practice with any of your company&apos;s personas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {legacyScenarios.map((scenario) => (
                <Link
                  key={scenario.id}
                  href={`/training/${scenario.id}`}
                  data-testid="scenario-card"
                  className="block rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 hover:bg-neutral-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-neutral-950"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {scenario.archetype}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${difficultyBadge[scenario.difficulty]}`}
                    >
                      {difficultyLabel[scenario.difficulty]}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-white mb-2 leading-snug">{scenario.title}</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">{scenario.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
