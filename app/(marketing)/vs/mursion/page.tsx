import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Persona vs Mursion — AI Simulation Comparison',
  description: 'How Persona Platform compares to Mursion for manager and employee training simulations.',
}

const rows = [
  { feature: 'Simulation approach', persona: 'Fully automated AI — no humans required', mursion: 'AI + live human interactor backstage for every session' },
  { feature: 'Session scheduling', persona: 'Async, self-serve — practise anytime', mursion: 'Must book in advance with a Mursion simulator operator' },
  { feature: 'Persona source', persona: 'Assessment-derived from your actual team', mursion: 'Scripted by Mursion facilitators and trainers' },
  { feature: 'Pricing model', persona: '$199–$999/mo flat fee', mursion: '$49–$164/session (enterprise contract required)' },
  { feature: 'Target company size', persona: '20–500 employees', mursion: 'Large enterprise (Walmart, Nationwide, NHS)' },
  { feature: 'Setup time', persona: 'Under 1 hour (send survey, get personas)', mursion: 'Weeks — procurement, onboarding, simulator training' },
  { feature: 'Self-serve', persona: 'Yes — sign up, configure, invite team', mursion: 'No — requires sales engagement and contract' },
  { feature: 'Data stays EU', persona: 'Yes — Ireland-incorporated, EU primary infra', mursion: 'US-based — review your data transfer requirements' },
  { feature: 'Suitable for SMBs', persona: 'Yes — designed for teams of 20+', mursion: 'No — minimum contract sizes restrict accessibility' },
]

export default function VsMursionPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Comparison</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-4">
        Persona vs Mursion
      </h1>
      <p className="text-neutral-400 text-sm leading-7 mb-12 max-w-2xl">
        Mursion pioneered immersive workplace simulation and works with some of the world&apos;s
        largest organisations. Persona is built for teams that need the same quality of
        practice — without the enterprise price tag, scheduling overhead, or live operator
        dependency.
      </p>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-14">
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Persona Platform</p>
          <p className="text-white font-semibold text-base mb-2">Self-serve, async, assessment-derived</p>
          <p className="text-neutral-400 text-sm leading-6">
            Managers practise any time, no scheduling, no live operator. AI personas are
            built from your employees&apos; own survey data — not generic scripts. Flat monthly
            fee. Live in under an hour.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Mursion</p>
          <p className="text-white font-semibold text-base mb-2">Immersive simulation with human-in-the-loop</p>
          <p className="text-neutral-400 text-sm leading-6">
            Each Mursion session is run by a live &ldquo;simulator&rdquo; operator backstage who voices
            AI avatars in real time. High-fidelity experience, but requires scheduling, procurement,
            and costs $49–$164 per session. Built for enterprise deployments at scale.
          </p>
        </div>
      </div>

      {/* The core trade-off */}
      <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 p-5 mb-12">
        <p className="text-amber-300 font-semibold text-sm mb-2">The core trade-off</p>
        <p className="text-neutral-300 text-sm leading-6">
          Mursion&apos;s human-in-the-loop model produces more spontaneous, nuanced conversations
          — but every session needs a trained operator available, must be scheduled, and costs
          per session. If your team needs to practise 3× a week before a difficult review
          cycle, Mursion becomes prohibitively expensive and logistically demanding. Persona
          lets managers run unlimited sessions at $199/mo for the whole team.
        </p>
      </div>

      {/* Comparison table */}
      <h2 className="text-white text-base font-semibold mb-4">Feature comparison</h2>

      {/* Desktop */}
      <div className="hidden md:block mb-14">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="pb-3 pr-6 text-neutral-400 font-medium w-52">Feature</th>
              <th className="pb-3 pr-6 text-neutral-400 font-medium">Persona Platform</th>
              <th className="pb-3 text-neutral-400 font-medium">Mursion</th>
            </tr>
          </thead>
          <tbody className="text-neutral-300">
            {rows.map((r, i) => (
              <tr key={r.feature} className={`border-b ${i < rows.length - 1 ? 'border-neutral-800' : 'border-transparent'}`}>
                <td className="py-4 pr-6 text-neutral-500 align-top text-xs">{r.feature}</td>
                <td className="py-4 pr-6 align-top text-xs leading-6">{r.persona}</td>
                <td className="py-4 align-top text-xs leading-6 text-neutral-400">{r.mursion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3 mb-14">
        {rows.map((r) => (
          <div key={r.feature} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-xs space-y-2">
            <p className="text-neutral-500 uppercase tracking-wide text-[10px]">{r.feature}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-neutral-600 mb-1">Persona</p>
                <p className="text-neutral-300 leading-5">{r.persona}</p>
              </div>
              <div>
                <p className="text-neutral-600 mb-1">Mursion</p>
                <p className="text-neutral-400 leading-5">{r.mursion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* When each is better */}
      <div className="grid sm:grid-cols-2 gap-6 mb-14">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="text-white text-sm font-semibold mb-3">When Mursion is the better choice</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You have a budget for $50–$160/session and enterprise procurement</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You need live, human-nuanced simulation for high-stakes scenarios</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You&apos;re deploying across thousands of employees (Walmart-scale)</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You have a dedicated L&D team to manage scheduling and facilitators</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <h3 className="text-white text-sm font-semibold mb-3">When Persona is the better choice</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You need managers to practise frequently, not once a quarter</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You want personas based on your actual team&apos;s personalities</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You&apos;re a 50–500 person company, not a global enterprise</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You want to be live this week, not after a 6-week procurement cycle</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Cost predictability matters — flat fee, no per-session billing</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-sm mb-1">Ready to practise without the overhead?</p>
          <p className="text-neutral-400 text-xs">Unlimited sessions, assessment-derived personas, live in under an hour.</p>
        </div>
        <Link
          href="/login"
          className="shrink-0 px-4 py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-100 transition-colors"
        >
          Get started free
        </Link>
      </div>
    </main>
  )
}
