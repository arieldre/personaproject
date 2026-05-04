import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Persona vs Second Nature — AI Roleplay Comparison',
  description: 'How Persona Platform compares to Second Nature for manager training and people development.',
}

const rows = [
  { feature: 'Primary use case', persona: 'Manager–employee relationship training', second: 'Sales rep coaching and enablement' },
  { feature: 'Persona source', persona: 'Assessment-derived from your actual team (28-question VCPQ)', second: 'Trainer-scripted generic buyer/prospect personas' },
  { feature: 'Who practices', persona: 'Managers and team leads', second: 'Sales reps and BDRs' },
  { feature: 'Target company size', persona: '20–500 employees (any HR/L&D team)', second: 'Mid-market to enterprise sales orgs' },
  { feature: 'Pricing model', persona: 'Flat fee: $199–$999/mo per team', second: '~$30–40/user/month (per-seat)' },
  { feature: 'Setup time', persona: '< 1 hour: send survey link, get personas', second: '2–4 weeks: trainer scripts personas, configures scenarios' },
  { feature: 'Data source for AI', persona: 'Real employee survey responses → clustering', second: 'Manually scripted by trainers or sales managers' },
  { feature: 'Grading', persona: '5-dimension real-time scoring (Groq)', second: 'Coach feedback + AI speech analytics' },
  { feature: 'GDPR / EU hosting', persona: 'Yes — Ireland-incorporated, EU primary infra', second: 'US-based — check your DPA requirements' },
  { feature: 'EU AI Act compliance', persona: 'Explicit prohibited-use clause (not for hiring)', second: 'Not prominently addressed' },
]

export default function VsSecondNaturePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Comparison</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-4">
        Persona vs Second Nature
      </h1>
      <p className="text-neutral-400 text-sm leading-7 mb-12 max-w-2xl">
        Both tools use AI roleplay for workplace skill-building — but they solve very different
        problems for very different teams. Here&apos;s an honest breakdown.
      </p>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-14">
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Persona Platform</p>
          <p className="text-white font-semibold text-base mb-2">Built for manager training</p>
          <p className="text-neutral-400 text-sm leading-6">
            Turns your actual employees&apos; survey responses into AI personas. Managers practise
            1:1s, feedback conversations, and difficult discussions with a simulated version
            of the communication styles on their real team — not a generic archetype.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Second Nature</p>
          <p className="text-white font-semibold text-base mb-2">Built for sales coaching</p>
          <p className="text-neutral-400 text-sm leading-6">
            Lets sales managers script AI buyers and prospects for reps to practise pitches,
            objection handling, and discovery calls. Strong for sales enablement. Not designed
            for internal people management.
          </p>
        </div>
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
              <th className="pb-3 text-neutral-400 font-medium">Second Nature</th>
            </tr>
          </thead>
          <tbody className="text-neutral-300">
            {rows.map((r, i) => (
              <tr key={r.feature} className={`border-b ${i < rows.length - 1 ? 'border-neutral-800' : 'border-transparent'}`}>
                <td className="py-4 pr-6 text-neutral-500 align-top text-xs">{r.feature}</td>
                <td className="py-4 pr-6 align-top text-xs leading-6">{r.persona}</td>
                <td className="py-4 align-top text-xs leading-6 text-neutral-400">{r.second}</td>
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
                <p className="text-neutral-600 mb-1">Second Nature</p>
                <p className="text-neutral-400 leading-5">{r.second}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* When each is better */}
      <div className="grid sm:grid-cols-2 gap-6 mb-14">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="text-white text-sm font-semibold mb-3">When Second Nature is the better choice</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> Your primary training need is sales rep coaching</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You want to practise scripted buyer objections for a specific product</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> Your team is primarily SDRs or AEs, not people managers</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You have a large sales enablement team to write persona scripts</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <h3 className="text-white text-sm font-semibold mb-3">When Persona is the better choice</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You want personas derived from your real employees&apos; personalities</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You&apos;re training managers for feedback, 1:1s, and people conversations</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> EU data residency and GDPR compliance are hard requirements</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You want to be live in under an hour without trainer scripting time</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Flat-fee pricing matters — you don&apos;t want per-seat surprises</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-sm mb-1">See Persona in action</p>
          <p className="text-neutral-400 text-xs">Set up your first AI personas in under an hour — no trainer scripting required.</p>
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
