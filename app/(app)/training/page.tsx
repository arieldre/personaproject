import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth/server'
import { SCENARIOS } from '@/lib/training/scenarios'

const difficultyBadge: Record<string, string> = {
  beginner: 'bg-green-500/15 text-green-400',
  intermediate: 'bg-yellow-500/15 text-yellow-400',
  advanced: 'bg-red-500/15 text-red-400',
}

export default async function TrainingPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-2">Training Scenarios</h1>
        <p className="text-neutral-400 text-sm mb-8">
          Practice difficult conversations with AI personas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/training/${scenario.id}`}
              data-testid="scenario-card"
              className="block rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 hover:bg-neutral-800/60 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                  {scenario.archetype}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${difficultyBadge[scenario.difficulty]}`}
                >
                  {scenario.difficulty}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-white mb-2 leading-snug">{scenario.title}</h2>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">{scenario.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
