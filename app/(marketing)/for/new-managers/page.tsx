import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Manager Training for First-Time Managers — Persona Platform',
  description: 'Help new managers practise difficult conversations with AI personas before their first real 1:1s.',
}

const steps = [
  {
    n: '01',
    title: 'Employees complete the VCPQ survey',
    body: '28 questions covering cognition, communication style, hierarchy preference, and operations. Takes 5 minutes. No right or wrong answers.',
  },
  {
    n: '02',
    title: 'AI clusters responses into personas',
    body: 'K-means++ groups your team by personality profile. Groq generates named, described personas from the clusters — e.g. "The Autonomous Director" or "The Collaborative Diplomat."',
  },
  {
    n: '03',
    title: 'Managers practise with the right persona',
    body: 'The hero-match feature shows which persona best represents each team member. Managers practise that conversation specifically — not a generic archetype.',
  },
  {
    n: '04',
    title: 'Real-time grading after every session',
    body: 'Five dimensions scored: empathy, clarity, goal achievement, listening, and adaptability. Managers see where they excelled and where to improve before the real conversation.',
  },
]

const pains = [
  'Promoted for technical skills, not people skills — and left to figure out management alone',
  'No safe space to practise before the first real performance conversation',
  'Unclear how to adapt their communication style to different employees',
  'Afraid of giving feedback that damages the relationship or triggers a conflict',
  'No institutional memory of what worked in similar conversations',
]

export default function ForNewManagersPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Use Case</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-4">
        AI Manager Training for First-Time Managers
      </h1>
      <p className="text-neutral-400 text-sm leading-7 mb-6 max-w-2xl">
        60% of new managers struggle in their first six months — not because they lack
        expertise in their domain, but because managing people is a completely different
        skill set with no practice ground.
      </p>
      <div className="flex gap-3 mb-16">
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          Start free
        </Link>
        <a
          href="#how-it-works"
          className="px-5 py-2.5 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
        >
          See how it works
        </a>
      </div>

      {/* Pain section */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-6">What new managers are up against</h2>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <ul className="space-y-3">
            {pains.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-neutral-400">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-neutral-500 leading-6">
            Traditional manager training — a one-day workshop, an e-learning module, or a
            mentorship call — doesn&apos;t solve the practice problem. You can&apos;t get better at
            difficult conversations without having them.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="mb-16" id="how-it-works">
        <h2 className="text-white text-base font-semibold mb-3">Practice before it counts</h2>
        <p className="text-neutral-400 text-sm leading-7 mb-8">
          Persona Platform turns your team&apos;s actual survey data into AI personas that a new
          manager can have a difficult conversation with — before the real version of that
          conversation happens. The AI reacts the way that personality type actually tends to
          react: resistant, collaborative, avoidant, or direct.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <span className="text-xs font-mono text-neutral-600">{s.n}</span>
              <h3 className="mt-2 text-sm font-semibold mb-2 text-white">{s.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">Conversations new managers can practise</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { title: 'First 1:1', desc: 'Build trust and set expectations without being overly formal or losing authority.' },
            { title: 'Performance concern', desc: 'Address a quality issue before it becomes a performance management process.' },
            { title: 'Giving critical feedback', desc: 'Deliver specific, honest feedback that lands as caring — not critical.' },
            { title: 'Missed deadline debrief', desc: 'Understand root cause without creating blame or defensiveness.' },
            { title: 'Promotion conversation', desc: 'Discuss growth trajectory honestly when promotion isn\'t imminent.' },
            { title: 'Conflict between reports', desc: 'Mediate a team dynamic issue without picking sides.' },
          ].map((s) => (
            <div key={s.title} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-white text-xs font-semibold mb-2">{s.title}</p>
              <p className="text-neutral-500 text-xs leading-5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grading detail */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">Know how you&apos;re doing, not just how it felt</h2>
        <p className="text-neutral-400 text-sm leading-7 mb-6">
          After each practice session, Persona grades the conversation across five dimensions
          using Groq&apos;s LLM. New managers see exactly where they were effective and where their
          communication broke down.
        </p>
        <div className="grid sm:grid-cols-5 gap-3">
          {[
            { dim: 'Empathy', desc: 'Did you acknowledge the employee\'s perspective?' },
            { dim: 'Clarity', desc: 'Was the feedback specific and actionable?' },
            { dim: 'Goal Achievement', desc: 'Did the conversation achieve its intended outcome?' },
            { dim: 'Active Listening', desc: 'Did you respond to what was said, not just what you planned to say?' },
            { dim: 'Adaptability', desc: 'Did you adjust when the conversation went differently than expected?' },
          ].map((d) => (
            <div key={d.dim} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-center">
              <p className="text-white text-xs font-semibold mb-2">{d.dim}</p>
              <p className="text-neutral-500 text-[10px] leading-4">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-8 text-center">
        <h2 className="text-white font-semibold text-lg mb-3">
          Give your new managers a place to practise
        </h2>
        <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
          Send your team the survey. Get your first personas in under an hour. Let managers
          practise before the conversation that matters.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          Get started — it&apos;s free
        </Link>
        <p className="text-neutral-600 text-xs mt-3">No credit card required. GDPR compliant. EU-hosted.</p>
      </div>
    </main>
  )
}
