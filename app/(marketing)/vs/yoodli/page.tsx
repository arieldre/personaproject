import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Persona vs Yoodli — AI Communication Training Comparison',
  description: 'How Persona Platform compares to Yoodli for AI-powered workplace communication training.',
}

const rows = [
  { feature: 'Core focus', persona: 'Manager–employee relationship simulation', yoodli: 'Speech analytics + communication coaching' },
  { feature: 'Persona source', persona: 'Assessment-derived from your actual team members', yoodli: 'User-defined generic personas (name + job title)' },
  { feature: 'AI knows your team', persona: 'Yes — clustered from real survey responses', yoodli: 'No — same generic persona for everyone' },
  { feature: 'Primary user', persona: 'Managers and team leads', yoodli: 'Individuals improving public speaking and presentation' },
  { feature: 'Pricing', persona: '$199–$999/mo flat fee per team', yoodli: '~$11–28/user/month (personal and team plans)' },
  { feature: 'Conversation grading', persona: '5-dimension real-time scoring (empathy, clarity, etc.)', yoodli: 'Speech analytics: filler words, pacing, eye contact' },
  { feature: 'Use case fit', persona: 'Difficult feedback, 1:1 prep, performance reviews', yoodli: 'Presentations, public speaking, sales calls' },
  { feature: 'Data residency', persona: 'EU (Ireland-incorporated, EU primary infra)', yoodli: 'US-based — check data transfer requirements' },
  { feature: 'Async / on-demand', persona: 'Yes', yoodli: 'Yes' },
]

export default function VsYoodliPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Comparison</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-4">
        Persona vs Yoodli
      </h1>
      <p className="text-neutral-400 text-sm leading-7 mb-12 max-w-2xl">
        Both tools use AI to help people communicate better — but they work very differently
        and serve different audiences. Here&apos;s where they diverge.
      </p>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-14">
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Persona Platform</p>
          <p className="text-white font-semibold text-base mb-2">Relationship-focused simulation</p>
          <p className="text-neutral-400 text-sm leading-6">
            Managers practise specific types of difficult conversations with AI personas built
            from their team&apos;s real personality data. The AI counterpart has a defined
            communication style, hierarchy preference, and emotional register — it reacts the
            way that cluster of employees actually tends to react.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Yoodli</p>
          <p className="text-white font-semibold text-base mb-2">Speech analytics for the individual</p>
          <p className="text-neutral-400 text-sm leading-6">
            Yoodli listens to you speak and gives real-time feedback on pacing, filler words,
            eye contact, and structure. The AI &ldquo;personas&rdquo; you practise with are basic — a name
            and job title you enter manually. Designed for individual contributors improving
            their own communication, not managers practising team dynamics.
          </p>
        </div>
      </div>

      {/* Key differentiator callout */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-900/80 p-5 mb-12">
        <p className="text-white font-semibold text-sm mb-2">The fundamental difference: who the AI is</p>
        <p className="text-neutral-300 text-sm leading-6">
          In Yoodli, you define the person you&apos;re practising with by typing a name. In Persona,
          the AI character is derived from a statistically-clustered profile of your real
          employees&apos; personalities. When a manager practises a difficult conversation with
          &ldquo;The Autonomous Director&rdquo; persona, they&apos;re practising with a character whose
          responses reflect how that personality type actually communicates — not a generic
          &ldquo;difficult employee&rdquo; archetype.
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
              <th className="pb-3 text-neutral-400 font-medium">Yoodli</th>
            </tr>
          </thead>
          <tbody className="text-neutral-300">
            {rows.map((r, i) => (
              <tr key={r.feature} className={`border-b ${i < rows.length - 1 ? 'border-neutral-800' : 'border-transparent'}`}>
                <td className="py-4 pr-6 text-neutral-500 align-top text-xs">{r.feature}</td>
                <td className="py-4 pr-6 align-top text-xs leading-6">{r.persona}</td>
                <td className="py-4 align-top text-xs leading-6 text-neutral-400">{r.yoodli}</td>
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
                <p className="text-neutral-600 mb-1">Yoodli</p>
                <p className="text-neutral-400 leading-5">{r.yoodli}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* When each is better */}
      <div className="grid sm:grid-cols-2 gap-6 mb-14">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="text-white text-sm font-semibold mb-3">When Yoodli is the better choice</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You want individual coaching on speech delivery (filler words, pace)</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> Your goal is public speaking improvement, not team management</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You need per-seat pricing for individuals across the organisation</li>
            <li className="flex items-start gap-2"><span className="text-neutral-600 mt-0.5">→</span> You want real-time feedback during live presentations</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <h3 className="text-white text-sm font-semibold mb-3">When Persona is the better choice</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You want AI that mirrors your specific employees&apos; communication styles</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You&apos;re training managers, not polishing individual presentation skills</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Your focus is relationship conversations: feedback, conflict, 1:1s</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> You need flat-fee team pricing, not per-user billing</li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> EU data residency is a requirement</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-sm mb-1">Train your managers on real team dynamics</p>
          <p className="text-neutral-400 text-xs">Assessment-derived personas that reflect how your employees actually communicate.</p>
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
