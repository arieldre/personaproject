import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Practice Giving Hard Feedback Before It Happens — Persona Platform',
  description: 'Help managers practise difficult feedback conversations with AI personas before they face them in real life.',
}

const mistakes = [
  { label: 'Avoiding it altogether', text: 'The manager waits for the annual review, or never says anything directly. The employee doesn\'t know there\'s a problem until it\'s serious.' },
  { label: 'Being too vague', text: '"You need to be more proactive" lands as criticism with no actionable path. The employee leaves confused and demotivated.' },
  { label: 'Over-softening the message', text: 'Sandwiching critical feedback between excessive praise obscures the message. The employee hears the praise and misses the concern.' },
  { label: 'Escalating when challenged', text: 'When an employee pushes back, managers without practice often either back down entirely or become more forceful — both damage trust.' },
  { label: 'Making it personal', text: '"You\'re not a team player" addresses character, not behaviour. Behaviour-focused feedback is both more accurate and more actionable.' },
]

const scenarios = [
  { title: 'Consistent deadline misses', context: 'A previously reliable employee has missed three sprint deadlines. You\'ve mentioned it informally twice but nothing has changed.' },
  { title: 'Code quality decline', context: 'A senior engineer\'s work is generating more bug reports. Peers have started quietly redoing their reviews.' },
  { title: 'Attitude in meetings', context: 'An employee is visibly disengaged in team meetings and has been dismissive toward a junior colleague\'s ideas.' },
  { title: 'Remote working pattern', context: 'A remote employee has become difficult to reach during core hours and response times have lengthened significantly.' },
  { title: 'Promotion conversation', context: 'A strong performer expects a promotion in the next cycle, but organisational constraints mean it won\'t happen for at least 6 months.' },
  { title: 'Performance improvement', context: 'A manager needs to communicate that without specific changes, formal performance management will begin.' },
]

export default function ForFeedbackTrainingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Use Case</p>
      <h1 className="text-3xl font-semibold tracking-tight mb-4">
        Practice Giving Hard Feedback Before It Happens
      </h1>
      <p className="text-neutral-400 text-sm leading-7 mb-6 max-w-2xl">
        Most managers avoid difficult feedback conversations — not because they don&apos;t care,
        but because they&apos;ve never had a safe place to practise them. Persona gives them that
        place.
      </p>
      <div className="flex gap-3 mb-16">
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          Start practising free
        </Link>
      </div>

      {/* Why managers get it wrong */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">Why managers get hard feedback wrong</h2>
        <p className="text-neutral-400 text-sm leading-7 mb-6">
          The research is consistent: most managers receive less than 4 hours of explicit
          feedback training in their careers. The rest is learned by trial and error — at
          their employees&apos; expense. These are the patterns that keep showing up.
        </p>
        <div className="space-y-3">
          {mistakes.map((m) => (
            <div key={m.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-white text-sm font-semibold mb-1.5">{m.label}</p>
              <p className="text-neutral-400 text-xs leading-6">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How Persona helps */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-3">Run the conversation before it counts</h2>
        <p className="text-neutral-400 text-sm leading-7 mb-4">
          Persona lets a manager describe the situation they&apos;re walking into, then practise
          the conversation with an AI persona that matches the communication style of their
          actual team member — not a generic &ldquo;difficult employee.&rdquo;
        </p>
        <p className="text-neutral-400 text-sm leading-7 mb-4">
          Because personas are derived from your employees&apos; own survey data, the AI captures
          real patterns: whether that employee tends to get defensive under criticism, goes
          quiet and withdrawn, or pushes back assertively. The manager practises the real
          dynamic, not an imagined one.
        </p>
        <p className="text-neutral-400 text-sm leading-7">
          After the session, Persona scores the conversation across five dimensions and flags
          the specific moments where the communication broke down — with reasoning, not just
          a number.
        </p>
      </section>

      {/* Scenarios */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">Scenarios managers practise</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {scenarios.map((s) => (
            <div key={s.title} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-white text-sm font-semibold mb-2">{s.title}</p>
              <p className="text-neutral-400 text-xs leading-6">{s.context}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The grading callout */}
      <section className="mb-16">
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <h2 className="text-white text-base font-semibold mb-4">What the scoring tells you</h2>
          <p className="text-neutral-400 text-sm leading-6 mb-5">
            After every practice session, Persona grades the conversation and shows the manager
            exactly what landed and what didn&apos;t — not as abstract scores, but with specific
            reasoning tied to the moments in the transcript.
          </p>
          <div className="grid sm:grid-cols-5 gap-3">
            {[
              { dim: 'Empathy', weight: '20%', note: 'Did you acknowledge the employee\'s perspective before moving to the message?' },
              { dim: 'Clarity', weight: '20%', note: 'Was the feedback specific, behaviour-focused, and actionable?' },
              { dim: 'Goal Achievement', weight: '30%', note: 'Did the conversation achieve its intended outcome without damaging the relationship?' },
              { dim: 'Active Listening', weight: '15%', note: 'Did you adapt when the conversation went somewhere you didn\'t expect?' },
              { dim: 'Adaptability', weight: '15%', note: 'Did you respond to what was said, not just the script in your head?' },
            ].map((d) => (
              <div key={d.dim} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-center">
                <p className="text-white text-xs font-semibold mb-1">{d.dim}</p>
                <p className="text-blue-400 text-xs font-mono mb-2">{d.weight}</p>
                <p className="text-neutral-600 text-[10px] leading-4">{d.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What changes */}
      <section className="mb-16">
        <h2 className="text-white text-base font-semibold mb-4">What changes when managers practise first</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { stat: 'Less avoidance', text: 'Managers who have practised the conversation know what to expect. The unknown is no longer the reason to delay.' },
            { stat: 'More specific feedback', text: 'Scoring penalises vague language. Managers learn — through iteration — what "specific and actionable" actually means.' },
            { stat: 'Better recovery', text: 'When an employee pushes back, managers who\'ve run the scenario before know how to redirect without escalating or backing down.' },
          ].map((c) => (
            <div key={c.stat} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-white font-semibold text-sm mb-2">{c.stat}</p>
              <p className="text-neutral-400 text-xs leading-6">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-8 text-center">
        <h2 className="text-white font-semibold text-lg mb-3">
          Help your managers have the conversations they&apos;ve been avoiding
        </h2>
        <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
          Send your team the VCPQ survey. Get personas in under an hour. Let managers
          practise with AI that actually reflects how your team communicates.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          Get started free
        </Link>
        <p className="text-neutral-600 text-xs mt-3">No credit card required. GDPR compliant. EU-hosted.</p>
      </div>
    </main>
  )
}
